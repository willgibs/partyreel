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
  setMediaStatus,
  setMediaStatusBulk,
  type SettableMediaStatus,
} from "@/lib/db/mutations/media";
import { readHostManifestPage } from "@/lib/db/queries/album-host";
import { getEvent } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { readHubReel, readRestOfManifest } from "@/lib/event/host-album.server";
import type { HubReel } from "@/lib/event/reel-progress";
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
 * The Review room's two bulk verbs below still revalidate: that room renders its queue on the server.
 * The same reason `clip-hidden-action.ts` gives for its own writes.
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

// Bulk approve / hide SELECTED pending items from the review surface (S3·3b·D).
// Mirror purgeMediaNowAction's array shape: the wrapper is scoped to pending +
// RLS-gated to the host's event; revalidate on success. The Review room's
// Approve all reaches past MAX_BULK_ITEMS by batching (`inBulkBatches`).
export async function approveBulkAction(
  eventId: string,
  mediaIds: string[],
): Promise<ActionResult> {
  const refused = refuseSelection(mediaIds);
  if (refused) return refused;

  const result = await approveBulk(eventId, mediaIds);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
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

  revalidatePath(`/dashboard/${eventId}`);
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
