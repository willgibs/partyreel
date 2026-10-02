"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  approveBulk,
  hideBulk,
  purgeMediaNow,
  removeMedia,
  removeMediaBulk,
  restoreEvent,
  restoreMedia,
  returnToReview,
  setMediaStatus,
  setMediaStatusBulk,
  type RestoredStatus,
  type ReviewVerdictStatus,
  type SettableMediaStatus,
} from "@/lib/db/mutations/media";
import { setEventDoor } from "@/lib/db/mutations/event-doors";
import { readHostManifestPage } from "@/lib/db/queries/album-host";
import { getEvent } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { readHubReel, readRestOfManifest } from "@/lib/event/host-album.server";
import type { HubReel } from "@/lib/event/reel-progress";
import { isDoor } from "@/lib/event/door/door";
import { ALBUM_MANIFEST_PAGE } from "@/lib/events/album-wire";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
  TILE_SIZE_COOKIE_MAX_AGE,
} from "@/lib/shared/tile-size-cookie";

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

const mediaIdList = z.array(z.uuid());

/**
 * Every bulk verb's id list, checked HERE, at the action boundary: a Server Function is a public
 * endpoint and the list is a raw client value. Past `MAX_BULK_ITEMS` (the export's 2,000) the
 * host is told the limit in words; the length is checked BEFORE the ids are parsed, so an
 * oversized list costs nothing. Returns the refusal, or null when the list may run.
 */
function refuseSelection(mediaIds: unknown): ActionResult | null {
  if (Array.isArray(mediaIds) && mediaIds.length > MAX_BULK_ITEMS) {
    return { ok: false, code: "validation", message: BULK_LIMIT_MESSAGE };
  }
  if (!mediaIdList.safeParse(mediaIds).success) {
    return { ok: false, code: "validation", message: "Unsupported selection." };
  }
  return null;
}

/*
 * ★ THE ALBUM'S OWN WRITES DO NOT REVALIDATE THE HUB (the album-host-wiring lane). A revalidation
 * from a Server Function re-renders the page that called it in the same round trip (Next 16:
 * "updates the UI immediately"), and the hub is a page of a dozen reads plus the album's manifest and
 * links: one hide used to re-run all of it. The hub's album is the page's store now, and each write's
 * caller asks it to catch up (`afterWrite`, one delta by id); the counts it shows ride the same poll.
 * The same reason `clip-hidden-action.ts` gives for its own writes. ★ And Review's three verbs
 * (approve, reject, and Undo's return) do not either (curation-wiring): a revalidating action
 * refreshes whatever route called it, so every verdict re-ran the Review room's page, re-reading
 * and re-presigning the whole queue, once per key press with the keyboard. The room is a store over
 * the host's album now (`review-room.tsx`), moved by its own acts and the host's poll.
 */
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
  return { ok: true };
}

export async function removeMediaAction(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const result = await removeMedia(eventId, mediaId);
  if (!result.ok) return result;
  return { ok: true };
}

// Bulk approve / reject SELECTED pending items from the Review room. Mirror
// purgeMediaNowAction's array shape: the wrapper is scoped to pending +
// RLS-gated to the host's event. The room's Approve all reaches past
// MAX_BULK_ITEMS by batching (`inBulkBatches`). Rejecting is `hideBulk`: a
// refused upload lands hidden, the same row state a Hide in the album leaves
// (host-curation `verb=reject` changed the word, never the state).
export async function approveBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const result = await approveBulk(eventId, mediaIds);
  if (!result.ok) return result;
  return { ok: true };
}

export async function hideBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const result = await hideBulk(eventId, mediaIds);
  if (!result.ok) return result;
  return { ok: true };
}

const REVIEW_VERDICTS: readonly ReviewVerdictStatus[] = ["approved", "hidden"];

/**
 * UNDO ON A REVIEW VERDICT'S TOAST (host-curation `undo=undo`): the items an approve (`approved`)
 * or a reject (`hidden`) just decided go back into the queue. `from` is a raw client string, so it
 * is allow-listed here like every status; the ids are refused past the cap like every bulk verb.
 *
 * ★ NEVER INTO A LIVE EVENT: a live event holds no pending media (turning review off approves the
 * queue, and an upload lands pending only while the event reviews), so an Undo that outlived review
 * being switched off is refused in words before any write. The event is read through RLS
 * (`getEvent`), which is also the ownership check: another host's event, or a deleted one, reads as
 * gone. The check and the write are two requests, so a switch saved in another tab in the moment
 * between them could still leave one waiting; it would sit in Review until review is back on.
 */
export async function returnToReviewAction(
  eventId: string,
  mediaIds: string[],
  from: string,
): Promise<ActionResult> {
  if (!(REVIEW_VERDICTS as readonly string[]).includes(from)) {
    return { ok: false, code: "validation", message: "Unsupported status." };
  }
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const parsedEvent = z.uuid().safeParse(eventId);
  const event = parsedEvent.success ? await getEvent(parsedEvent.data) : null;
  if (!event) {
    return {
      ok: false,
      code: "validation",
      message: "That event is no longer available.",
    };
  }
  if (event.moderation_mode !== "hold_for_approval") {
    return {
      ok: false,
      code: "validation",
      message:
        "Review is off for this event, so there's no queue to put them back in.",
    };
  }

  const result = await returnToReview(
    eventId,
    mediaIds,
    from as ReviewVerdictStatus,
  );
  if (!result.ok) return result;
  return { ok: true };
}

// GALLERY album bulk-select: set status (hide/show) or remove a SELECTED set of LIVE album items
// (approved/hidden, not the pending review queue). Same allowlist guard as the single-item action —
// the client passes a raw status we never trust. RLS scopes the write to the host's own event. The
// album sends a bigger selection in batches of MAX_BULK_ITEMS (`inBulkBatches`), and does not
// revalidate (see above).
export async function setMediaStatusBulkAction(
  eventId: string,
  mediaIds: string[],
  status: string,
): Promise<ActionResult> {
  if (!isSettableStatus(status)) {
    return { ok: false, code: "validation", message: "Unsupported status." };
  }
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const result = await setMediaStatusBulk(eventId, mediaIds, status);
  if (!result.ok) return result;
  return { ok: true };
}

export async function removeMediaBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const result = await removeMediaBulk(eventId, mediaIds);
  if (!result.ok) return result;
  return { ok: true };
}

// --- Recovery (Phase 3) — restore + permanent-delete-now ---------------------------------
// Mirror removeMediaAction: call the wrapper, return its result on failure; the bin drops the item
// and the album store catches up on success, so neither revalidates the hub (see above).
// captureError ONLY on code 'unknown' — insufficient_space / event_limit /
// event_deleted are EXPECTED refusals (the host hit a cap), not bugs. The wrappers own the
// ownership + capacity gates (they call the SECURITY DEFINER RPCs). Area "media" — these are
// media/event-recovery ops (no "dashboard" Sentry area exists).

/**
 * A restore's own result: where the item landed (`restore_media` answers the status it held before
 * its removal), so the bin says what the restore did, never "back in the album" for an item that came
 * back hidden. Its own type for the reason `RestoreEventResult` below has one: the shared ActionResult
 * stays `{ ok: true }` for the actions with nothing to carry.
 */
export type RestoreMediaResult =
  | { ok: true; status?: RestoredStatus }
  | Extract<ActionResult, { ok: false }>;

export async function restoreMediaAction(
  eventId: string,
  mediaId: string,
): Promise<RestoreMediaResult> {
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
  return { ok: true, status: result.data.status };
}

/**
 * restore_event is all-or-nothing over the event, but media removed INDEPENDENTLY of the
 * event stay in the bin (lifecycle-recovery.md): the RPC reports how many as
 * `media_still_removed`, counted as her Deleted lists them, and the toast
 * (`RestoreEventButton`) says how many are still in the album's Deleted, or a host who
 * restored an event with 12 of its photos still binned was told "Event restored." alone.
 *
 * `customSlugReleased` carries into the same toast: a soft-deleted event's custom slug is
 * freed at once (host-app.md), so another event may have claimed it while this one sat in
 * Deleted, and the RPC comes back on the permanent link rather than failing the restore.
 * Silent, that is a link that quietly stopped working; the host has to hear it from the one
 * surface that knows, at the moment it happens.
 *
 * So this action has its OWN result type. The shared ActionResult stays `{ ok: true }`
 * deliberately: it is the contract of a dozen form actions, and widening it to carry one
 * action's payload would make every caller handle data it will never have. The failure arm
 * is EXTRACTED from ActionResult rather than restated, so the codes and the friendly
 * messages keep exactly one home (the same shape RestoreResult uses in db/mutations/media).
 *
 * Consumers narrow on `ok` as before, so nothing breaks by ignoring either field.
 */
export type RestoreEventResult =
  | { ok: true; mediaStillRemoved: number; customSlugReleased: boolean }
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
  return {
    ok: true,
    mediaStillRemoved: result.data.mediaStillRemoved,
    customSlugReleased: result.data.customSlugReleased,
  };
}

export async function purgeMediaNowAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

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
  return { ok: true };
}

/**
 * The album's density step, in the gallery's one cookie (`album-columns` r2: three steps, one index
 * shared by host and guest; `tile-size-cookie.ts` has why a cookie). A preference, not a trust
 * boundary — no auth check, same as `setEventsViewAction` in `dashboard/actions.ts`, whose pattern
 * this mirrors exactly. `resolveRowStep` narrows whatever arrives to the three steps (a legacy width
 * maps across), so a hand-forged call can only ever set one of them.
 */
export async function setRowStepAction(step: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TILE_SIZE_COOKIE, String(resolveRowStep(String(step))), {
    maxAge: TILE_SIZE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });
}

/**
 * THE HIGHLIGHT REEL CARD, READ AGAIN (the album-host-wiring lane). The hub's album is live, so the
 * card's state and pips move with it on the client (`isPlayableEntry` over the manifest); what the
 * client cannot make is the card's stills, which are the reel's own opening take over a spread of the
 * album with its quick-add signals (who uploaded, how liked) and presigned. So when the card's state
 * changes, or a still it shows leaves the album, it asks here: the page's own read (`readHubReel`),
 * for this event alone. A public endpoint like every Server Function: the id is parsed, the session
 * re-verified with `getUser()`, the event read through RLS.
 */
export async function refreshHubReelAction(
  eventId: unknown,
): Promise<{ ok: true; reel: HubReel } | { ok: false }> {
  const parsed = z.uuid().safeParse(eventId);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const event = await getEvent(parsed.data);
  if (!event) return { ok: false };
  try {
    const [first, facts] = await Promise.all([
      readHostManifestPage(supabase, event.id, null, ALBUM_MANIFEST_PAGE),
      getLiveReelServerFacts(event.id),
    ]);
    const entries = await readRestOfManifest(supabase, event.id, first);
    const reel = await readHubReel(
      supabase,
      { id: event.id, showReel: event.show_reel },
      entries,
      facts.liveReelEnabled,
    );
    return { ok: true, reel };
  } catch (error) {
    captureError("reel", error, { action: "hub_reel_refresh", eventId });
    return { ok: false };
  }
}

/** The door's answer: what the database did beside the door it set. */
export type SetEventDoorResult =
  | {
      ok: true;
      /** The email step was held on with it (letting each person in and the list match an address). */
      emailHeld: boolean;
      /** People waiting at the door who came straight in because the album turned Public. */
      admitted: number;
    }
  | {
      ok: false;
      code: "validation" | "unauthorized" | "no_password" | "unknown";
      message: string;
    };

/**
 * THE DOOR, SET (event-settings r1, `join=steps`): what the link opens and the gate it keeps, in one
 * write (`set_event_door`, SECURITY DEFINER, which re-checks the caller hosts the event on
 * `auth.uid()`, holds the email step on for an address gate, and lets everyone waiting in when the
 * album turns Public). The door page's consequence line has already said what it does to anyone
 * inside or at the door, before the host chose it.
 *
 * ★ THE CALLER'S VALUES ARE CHECKED HERE, AT THE BOUNDARY: a Server Function is a public endpoint, so
 * the event id must be one and the door one of the six, before anything is asked.
 */
export async function setEventDoorAction(
  eventId: string,
  door: string,
): Promise<SetEventDoorResult> {
  if (!z.uuid().safeParse(eventId).success || !isDoor(door)) {
    return { ok: false, code: "validation", message: "Unsupported door." };
  }
  const result = await setEventDoor(eventId, door);
  if (!result.ok) {
    if (result.code === "unknown" && result.cause) {
      captureError("other", result.cause, { phase: "set_event_door" });
    }
    return {
      ok: false,
      code:
        result.code === "unauthorized" || result.code === "no_password"
          ? result.code
          : "unknown",
      message: result.message,
    };
  }
  revalidatePath(`/dashboard/${eventId}`);
  revalidatePath("/dashboard");
  return {
    ok: true,
    emailHeld: result.data.emailHeld,
    admitted: result.data.admitted,
  };
}
