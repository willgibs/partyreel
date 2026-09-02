"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  approveAllPending,
  approveBulk,
  hideBulk,
  purgeMediaNow,
  removeMedia,
  removeMediaBulk,
  restoreEvent,
  restoreMedia,
  setMediaStatus,
  setMediaStatusBulk,
  type SettableMediaStatus,
} from "@/lib/db/mutations/media";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

// Allowlist the host-settable statuses HERE, at the action boundary — the
// client calls these with a raw string and we never trust it. 'removed' is not
// settable this way (use removeMediaAction, which stamps the grace clock) and
// 'pending' is the upload-time state, never a host target.
const SETTABLE_STATUSES: readonly SettableMediaStatus[] = [
  "approved",
  "hidden",
];

function isSettableStatus(value: string): value is SettableMediaStatus {
  return (SETTABLE_STATUSES as readonly string[]).includes(value);
}

export async function setMediaStatusAction(
  eventId: string,
  mediaId: string,
  status: string,
): Promise<ActionResult> {
  if (!isSettableStatus(status)) {
    return { ok: false, code: "validation", message: "Unsupported status." };
  }

  const result = await setMediaStatus(eventId, mediaId, status);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function removeMediaAction(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const result = await removeMedia(eventId, mediaId);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function approveAllPendingAction(
  eventId: string,
): Promise<ActionResult> {
  const result = await approveAllPending(eventId);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

// Bulk approve / hide SELECTED pending items from the review surface (S3·3b·D).
// Mirror purgeMediaNowAction's array shape: the wrapper is scoped to pending +
// RLS-gated to the host's event; revalidate on success.
export async function approveBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const result = await approveBulk(eventId, mediaIds);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function hideBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const result = await hideBulk(eventId, mediaIds);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

// GALLERY album bulk-select: set status (hide/show) or remove a SELECTED set of LIVE album items
// (approved/hidden, not the pending review queue). Same allowlist guard as the single-item action —
// the client passes a raw status we never trust. RLS scopes the write to the host's own event.
export async function setMediaStatusBulkAction(
  eventId: string,
  mediaIds: string[],
  status: string,
): Promise<ActionResult> {
  if (!isSettableStatus(status)) {
    return { ok: false, code: "validation", message: "Unsupported status." };
  }

  const result = await setMediaStatusBulk(eventId, mediaIds, status);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function removeMediaBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const result = await removeMediaBulk(eventId, mediaIds);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

// --- Recovery (Phase 3) — restore + permanent-delete-now ---------------------------------
// Mirror removeMediaAction: call the wrapper, return its result on failure, revalidate on
// success. captureError ONLY on code 'unknown' — insufficient_space / event_limit /
// event_deleted are EXPECTED refusals (the host hit a cap), not bugs. The wrappers own the
// ownership + capacity gates (they call the SECURITY DEFINER RPCs). Area "media" — these are
// media/event-recovery ops (no "dashboard" Sentry area exists).

export async function restoreMediaAction(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const result = await restoreMedia(mediaId);
  if (!result.ok) {
    if (result.code === "unknown") {
      captureError("media", new Error(result.message), {
        action: "restore_media",
        eventId,
        mediaId,
      });
    }
    return result;
  }

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

/**
 * restore_event is all-or-nothing over the event, but media removed INDEPENDENTLY of the
 * event stay in the bin (lifecycle-recovery.md): the RPC reports how many as
 * `media_still_removed`, and a host who restores an event with 12 of its photos still
 * binned is told "Event restored." That count reached this action and stopped here.
 *
 * So this action has its OWN result type. The shared ActionResult stays `{ ok: true }`
 * deliberately: it is the contract of a dozen form actions, and widening it to carry one
 * action's payload would make every caller handle data it will never have. The failure arm
 * is EXTRACTED from ActionResult rather than restated, so the codes and the friendly
 * messages keep exactly one home (the same shape RestoreResult uses in db/mutations/media).
 *
 * Consumers narrow on `ok` as before, so nothing breaks by ignoring the count.
 */
export type RestoreEventResult =
  | { ok: true; mediaStillRemoved: number }
  | Extract<ActionResult, { ok: false }>;

export async function restoreEventAction(
  eventId: string,
): Promise<RestoreEventResult> {
  const result = await restoreEvent(eventId);
  if (!result.ok) {
    if (result.code === "unknown") {
      captureError("media", new Error(result.message), {
        action: "restore_event",
        eventId,
      });
    }
    return result;
  }

  // Restoring re-adds the event to BOTH the active dashboard list and its detail page.
  revalidatePath(`/dashboard/${eventId}`);
  revalidatePath("/dashboard");
  return { ok: true, mediaStillRemoved: result.data.mediaStillRemoved };
}

export async function purgeMediaNowAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const result = await purgeMediaNow(eventId, mediaIds);
  if (!result.ok) {
    if (result.code === "unknown") {
      captureError("media", new Error(result.message), {
        action: "purge_media_now",
        eventId,
        count: mediaIds.length,
      });
    }
    return result;
  }

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

/**
 * The reel publish switch (R3, ADR-0022 ruling 1) — the ONE seam the share card, the reveal's
 * settled "Share with guests", and the Studio header all call. The RPC authorizes internally
 * (auth.uid() + host-owns-event) on the USER client — defense in depth over RLS, same as the other
 * reel writes. NO notification here by ruling (2026-07-30): reel-published emails are R5's round;
 * when R5 lands, its fan-out hooks into THIS action (the single publish seam), nothing else.
 */
export type ReelPublishResult =
  | { ok: true; guestVisible: boolean }
  | {
      ok: false;
      reason: "unauthorized" | "not_found" | "empty" | "error";
      message: string;
    };

const PUBLISH_MESSAGES: Record<string, string> = {
  // 'empty' is the only reason a host can act on; the others are retry/defensive copy.
  unauthorized: "Please sign in again.",
  not_found: "We couldn't find this event.",
  empty: "Add some photos to your reel first.",
};

export async function setReelGuestVisibleAction(
  eventId: string,
  visible: boolean,
): Promise<ReelPublishResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      reason: "unauthorized",
      message: PUBLISH_MESSAGES.unauthorized,
    };
  }

  const { data: raw, error } = await supabase.rpc("set_reel_guest_visible", {
    p_event_id: eventId,
    p_visible: visible,
  });
  // The RPC returns jsonb; narrow its {ok, reason?, guest_visible?} shape once here.
  const data = raw as {
    ok: boolean;
    reason?: string;
    guest_visible?: boolean;
  } | null;

  if (error || !data) {
    captureError("reel", new Error(error?.message ?? "no data"), {
      action: "set_reel_guest_visible",
      eventId,
    });
    return {
      ok: false,
      reason: "error",
      message: "Couldn't update sharing. Please try again.",
    };
  }
  if (!data.ok) {
    const reason =
      data.reason === "unauthorized" ||
      data.reason === "not_found" ||
      data.reason === "empty"
        ? data.reason
        : ("error" as const);
    return {
      ok: false,
      reason,
      message:
        PUBLISH_MESSAGES[reason] ?? "Couldn't update sharing. Please try again.",
    };
  }

  // The guest page renders from live reads (nothing cached to bust there); the HOST page re-reads
  // getReelConfig for the card's Draft/Shared state.
  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true, guestVisible: data.guest_visible ?? visible };
}
