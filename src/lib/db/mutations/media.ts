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
 * IMPORTANT: nothing here touches R2 or any storage counter. "Remove" is SOFT
 * (status='removed' + removed_at); the Phase-3 purge cron is the ONLY path that
 * frees real bytes (R2 + row + profiles.storage_used_bytes). See
 * src/app/api/cron/purge/route.ts.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type MutationResult } from "@/lib/db/mutations/events";

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
