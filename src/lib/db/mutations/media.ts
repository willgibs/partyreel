/**
 * Media moderation writes for the authenticated host, via the RLS-scoped server
 * client. `media_host_all` scopes rows to media in the host's own events, so the
 * host can only ever touch their own uploads; we still re-check `getUser()` in
 * every function (RLS is the boundary, the proxy is not) and filter by
 * `event_id` + `id` belt-and-suspenders.
 *
 * Mirrors `mutations/events.ts` — plain module imported by the `'use server'`
 * actions, returning the shared `MutationResult` so the action maps failures to
 * toasts.
 *
 * MOSTLY no R2 / storage-counter touches: "Remove" is SOFT (status='removed' +
 * removed_at); the purge cron normally frees real bytes. The EXCEPTION is the recovery
 * Phase-3 `purgeMediaNow` (host "permanent delete now") — it deletes R2 then calls the
 * `purge_media_now` RPC (rows + profiles.storage_used_bytes). See
 * src/app/api/cron/purge/route.ts.
 */
import "server-only";

import { type MutationResult } from "@/lib/db/mutations/events";
import { deleteR2Objects } from "@/lib/r2/delete";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";

// PostgREST returns this when `.single()` matches zero rows — for a scoped
// UPDATE that means "no such media in one of the host's events" (missing,
// foreign, or already removed). We treat it as a not-found failure, not silent
// success, so the host gets a real error instead of a phantom "done".
const NO_ROWS = "PGRST116";

const UNAUTHORIZED = {
  ok: false as const,
  code: "unauthorized" as const,
  message: "Please sign in and try again.",
};

/** The only statuses a host may set directly. 'removed' goes through
 * removeMedia (it stamps the grace clock); 'pending' is the upload-time state. */
export type SettableMediaStatus = "approved" | "hidden";

/**
 * Approve / hide / unhide a single item (unhide = set back to 'approved').
 * `.neq('status','removed')` so a crafted call can't resurrect already-removed
 * media; combined with `.single()` a 0-row update surfaces as failure.
 */
export async function setMediaStatus(
  eventId: string,
  mediaId: string,
  status: SettableMediaStatus,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await supabase
    .from("media")
    .update({ status })
    .eq("event_id", eventId)
    .eq("id", mediaId)
    .neq("status", "removed")
    .select("id")
    .single();

  if (error) {
    if (error.code === NO_ROWS) {
      return {
        ok: false,
        code: "unknown",
        message: "That item is no longer available.",
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update that item. Please try again.",
    };
  }
  return { ok: true, data: { id: mediaId } };
}

/**
 * Soft-remove: free the per-event slot immediately (counts skip 'removed') and
 * stamp removed_at so the purge cron reclaims R2 + the row after the grace.
 * `.neq('status','removed')` so a repeat remove does NOT reset removed_at (that
 * would extend how long the bytes linger). A no-op (already removed / not the
 * host's) is treated as success — the end state is "removed" either way and the
 * page revalidates to the truth. No R2 call, no counter change here.
 */
export async function removeMedia(
  eventId: string,
  mediaId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await supabase
    .from("media")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("id", mediaId)
    .neq("status", "removed");

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove that item. Please try again.",
    };
  }
  return { ok: true, data: { id: mediaId } };
}

/**
 * Bulk-approve every pending item in an event (the Pending-review queue's
 * "Approve all"). RLS scopes the update to the host's own event; 0 pending rows
 * is a success with count 0.
 */
export async function approveAllPending(
  eventId: string,
): Promise<MutationResult<{ count: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase
    .from("media")
    .update({ status: "approved" })
    .eq("event_id", eventId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't approve the pending items. Please try again.",
    };
  }
  return { ok: true, data: { count: data?.length ?? 0 } };
}

/**
 * Bulk approve / hide SELECTED pending items (the review surface, S3·3b·D). Scoped
 * to `status='pending'` so it only ever acts on the review queue — a crafted call
 * can't flip already-approved/hidden/removed media (a general bulk-hide of the live
 * gallery would drop that predicate). RLS scopes to the host's own event; returns
 * the affected count (0 is success — the selection may have been cleared elsewhere).
 */
async function bulkSetFromPending(
  eventId: string,
  mediaIds: string[],
  status: SettableMediaStatus,
): Promise<MutationResult<{ count: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase
    .from("media")
    .update({ status })
    .eq("event_id", eventId)
    .in("id", mediaIds)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message:
        status === "approved"
          ? "Couldn't approve those items. Please try again."
          : "Couldn't hide those items. Please try again.",
    };
  }
  return { ok: true, data: { count: data?.length ?? 0 } };
}

export function approveBulk(eventId: string, mediaIds: string[]) {
  return bulkSetFromPending(eventId, mediaIds, "approved");
}

export function hideBulk(eventId: string, mediaIds: string[]) {
  return bulkSetFromPending(eventId, mediaIds, "hidden");
}

/**
 * The GALLERY album bulk-select counterparts of setMediaStatus / removeMedia: the same
 * RLS-scoped, column-locked writes, batched with `.in('id', …)`. These act on the LIVE
 * album (approved <-> hidden, or remove), so they deliberately DROP the `status='pending'`
 * predicate the review-queue bulk uses — `.neq('status','removed')` is kept so a crafted call
 * still can't resurrect already-removed media. RLS (`media_host_all`) scopes rows to the host's
 * own events, so a cross-tenant id in the array simply matches nothing (the count reflects only
 * owned rows — the partial-no-op is the security property, not a bug). 0 matched is success.
 */
export async function setMediaStatusBulk(
  eventId: string,
  mediaIds: string[],
  status: SettableMediaStatus,
): Promise<MutationResult<{ count: number }>> {
  if (mediaIds.length === 0) return { ok: true, data: { count: 0 } };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase
    .from("media")
    .update({ status })
    .eq("event_id", eventId)
    .in("id", mediaIds)
    .neq("status", "removed")
    .select("id");

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message:
        status === "hidden"
          ? "Couldn't hide those items. Please try again."
          : "Couldn't show those items. Please try again.",
    };
  }
  return { ok: true, data: { count: data?.length ?? 0 } };
}

/**
 * Soft-remove SELECTED album items to the Deleted bin. Mirrors removeMedia (status='removed' +
 * removed_at; the trigger stamps purge_at = removed_at + 30 days), batched with `.in()`.
 * `.neq('status','removed')` so a repeat remove never re-stamps removed_at (which would extend how
 * long the bytes linger). No R2 call here — the daily purge cron reclaims bytes after the grace.
 */
export async function removeMediaBulk(
  eventId: string,
  mediaIds: string[],
): Promise<MutationResult<{ count: number }>> {
  if (mediaIds.length === 0) return { ok: true, data: { count: 0 } };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase
    .from("media")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .in("id", mediaIds)
    .neq("status", "removed")
    .select("id");

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove those items. Please try again.",
    };
  }
  return { ok: true, data: { count: data?.length ?? 0 } };
}

/**
 * Recovery (Phase 3) — host-facing restore + permanent-delete-now. These call the
 * authenticated, ownership-gated SECURITY DEFINER RPCs (restore_media / restore_event /
 * purge_media_now), which own the capacity + slot gates. The RPCs RETURN a jsonb
 * {ok, reason, …} for EXPECTED refusals (we branch on data.reason — they do NOT raise),
 * so insufficient_space can carry needed_bytes for the UI.
 */
type RestoreReason =
  | "not_found"
  | "not_removed"
  | "event_deleted"
  | "insufficient_space"
  | "event_limit";

type RestoreResult =
  | { ok: true; media_still_removed?: number }
  | {
      ok: false;
      reason: RestoreReason;
      needed_bytes?: number;
      max_events?: number;
    };

// Map an RPC refusal to a friendly MutationResult. insufficient_space bakes the byte
// shortfall into the message; the Phase-4 UI keys a /pricing CTA on the code. Returns the
// error variant (assignable to any MutationResult<T> — never returns ok:true).
function mapRestoreRefusal(
  r: Extract<RestoreResult, { ok: false }>,
): MutationResult<never> {
  switch (r.reason) {
    case "insufficient_space":
      return {
        ok: false,
        code: "insufficient_space",
        message: `Free up ${formatBytes(r.needed_bytes ?? 0)} to restore this, or upgrade your plan.`,
      };
    case "event_limit":
      return {
        ok: false,
        code: "event_limit",
        message:
          "You're at your event limit. Delete an event or upgrade to restore this one.",
      };
    case "event_deleted":
      return {
        ok: false,
        code: "event_deleted",
        message: "This item's event was deleted. Restore the event first.",
      };
    case "not_removed":
      return {
        ok: false,
        code: "unknown",
        message: "That item is no longer in Deleted.",
      };
    default:
      return {
        ok: false,
        code: "unknown",
        message: "That item is no longer available.",
      };
  }
}

/** Restore a soft-removed media item (capacity-gated in the RPC; pure status flip). */
export async function restoreMedia(
  mediaId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase.rpc("restore_media", {
    p_media_id: mediaId,
  });
  if (error || !data) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't restore that item. Please try again.",
    };
  }
  const result = data as unknown as RestoreResult;
  if (!result.ok) return mapRestoreRefusal(result);
  return { ok: true, data: { id: mediaId } };
}

/** Restore a soft-deleted event (slot- + capacity-gated in the RPC). Independently-removed
 * media stay in the bin; the success data carries how many (for the Phase-4 prompt). */
export async function restoreEvent(
  eventId: string,
): Promise<MutationResult<{ id: string; mediaStillRemoved: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase.rpc("restore_event", {
    p_event_id: eventId,
  });
  if (error || !data) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't restore that event. Please try again.",
    };
  }
  const result = data as unknown as RestoreResult;
  if (!result.ok) return mapRestoreRefusal(result);
  return {
    ok: true,
    data: { id: eventId, mediaStillRemoved: result.media_still_removed ?? 0 },
  };
}

/** Permanently delete removed media now (skip the 30-day wait). R2-FIRST, then the rows:
 * read the host's OWN removed-media keys (RLS-scoped), delete the R2 objects, THEN the RPC
 * re-validates own+removed and drops rows + decrements storage_used_bytes. A partial R2
 * failure returns before the RPC so the rows survive and the daily cron reclaims them
 * (idempotent) — mirrors the cron's R2-first safety. */
export async function purgeMediaNow(
  eventId: string,
  mediaIds: string[],
): Promise<MutationResult<{ purged: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data: rows, error: readErr } = await supabase
    .from("media")
    .select("id, original_key, preview_key")
    .eq("event_id", eventId)
    .in("id", mediaIds)
    .eq("status", "removed");
  if (readErr) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't delete those items. Please try again.",
    };
  }
  const owned = rows ?? [];
  if (owned.length > 0) {
    const keys: string[] = [];
    for (const row of owned) {
      keys.push(row.original_key);
      if (row.preview_key) keys.push(row.preview_key);
    }
    const r2 = await deleteR2Objects(keys);
    if (r2.errored.length > 0) {
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't fully delete those items. Please try again.",
      };
    }
  }

  const { error } = await supabase.rpc("purge_media_now", {
    p_media_ids: mediaIds,
  });
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't delete those items. Please try again.",
    };
  }
  return { ok: true, data: { purged: owned.length } };
}
