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
import { listRecentlyDeletedMedia } from "@/lib/db/queries/media";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { captureError } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";
import {
  resolveTileSize,
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
// the client passes a raw status we never trust. RLS scopes the write to the host's own event.
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

  revalidatePath(`/dashboard/${eventId}`);
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

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

/**
 * THE BIN, LOADED ONLY WHEN ASKED (his `settings` note: "The photo bin joins
 * the album as a filter").
 *
 * ★ WHY AN ACTION AND NOT A PROP ON THE PAGE. Every bin item needs its own
 * presigned URL, a signature computed on the request that renders it. Folding
 * the bin into the hub's payload would buy N presigns on EVERY render of the
 * event page — for a drawer most hosts open once, to recover one photograph,
 * weeks after they deleted it. The filter is the moment to pay for it.
 *
 * RLS scopes `listRecentlyDeletedMedia` to the host's own event and reads the
 * whole bin (a keyset, never the first 1,000), and the presigns are
 * INLINE-only (no download url), so the lightbox hides Save on a binned item
 * exactly as it does on the retired settings route.
 */
export type BinItem = {
  id: string;
  type: string;
  url: string;
  status: string;
  countdownDays: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

export async function listDeletedMediaAction(
  eventId: string,
): Promise<{ ok: true; items: BinItem[] } | { ok: false; message: string }> {
  // Re-verify the caller here as well as relying on RLS: a Server Function is a
  // public endpoint, and the query below is only safe because the session it
  // runs under is the host's (database-security.md).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  try {
    const rows = await listRecentlyDeletedMedia(eventId);
    const items = await Promise.all(
      rows.map(async (m) => ({
        id: m.id,
        type: m.type,
        url: await presignDownload({ key: m.original_key, stable: true }),
        status: m.status,
        countdownDays: m.countdownDays,
        width: m.width,
        height: m.height,
        durationSeconds: m.duration_seconds,
      })),
    );
    return { ok: true, items };
  } catch (error) {
    captureError("media", error as Error, {
      action: "list_deleted_media",
      eventId,
    });
    return { ok: false, message: "Couldn't load deleted items." };
  }
}

/**
 * The gallery's tile-size cookie (`app-vocabulary` r1,
 * `gallery-controls-persistence`, overruled to a cookie: `tile-size-cookie.ts`
 * has why). A preference, not a trust boundary — no auth check, same as
 * `setEventsViewAction` in `dashboard/actions.ts`, whose pattern this mirrors
 * exactly. `resolveTileSize` narrows whatever arrives to the three wired
 * steps, so a hand-forged call can only ever set one of them.
 */
export async function setTileSizeAction(size: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TILE_SIZE_COOKIE, String(resolveTileSize(String(size))), {
    maxAge: TILE_SIZE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });
}
