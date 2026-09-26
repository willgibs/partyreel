"use server";

/**
 * The guest event page's Server Functions.
 *
 * ONE: a SIGNED-IN guest removing a photograph they uploaded (a guest
 * can delete any photo they personally uploaded, with no time limit, and the
 * delete is final for the host too).
 *
 * The anonymous half of the same feature is `POST /api/guests/remove`, and the
 * split is not duplication: the two have different identities. Here the
 * identity is the account, so `remove_my_upload` (auth.uid(), re-checking
 * ownership through the same guest arm as the Uploads tab) covers it from any
 * device, for ever. There the only identity is a device-bound session token,
 * which needs a service-role RPC that validates it against the media's own
 * guest row.
 *
 * ★ IT REUSES `removeMyUpload` RATHER THAN RE-TYPING THE RPC CALL. That
 * mutation is the one home of `remove_my_upload` (mutations/my-uploads.ts) and
 * a second copy here would be a second place to get the error branches wrong.
 * The guest page adds no ownership logic of its own on top of it — there is
 * none to add, and any there would be would be the kind that drifts.
 *
 * ★ IT REVALIDATES NOTHING. The guest page is `force-dynamic` and the album
 * reconciles itself: the gallery drops the tile optimistically and the next
 * poll (or the doorbell's ping) is the server agreeing. A `revalidatePath` on a
 * guest link would re-run the whole presign-heavy page for one removed tile.
 *
 * TWO: persisting the album's density step (set from View's slider, a pinch or
 * ctrl and the wheel) on the one shared cookie (`lib/shared/tile-size-cookie.ts`,
 * `album-columns` r2: one index shared by host and guest), so a guest and a host
 * picking the largest photographs write the same pick. The step itself is
 * per-device, never a profile column, on either surface.
 */
import { cookies } from "next/headers";

import { removeMyUpload } from "@/lib/db/mutations/my-uploads";
import { captureError } from "@/lib/observability/sentry";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
  TILE_SIZE_COOKIE_MAX_AGE,
} from "@/lib/shared/tile-size-cookie";

export type GuestRemoveResult = { ok: true } | { ok: false; message: string };

export async function removeMyUploadGuestAction(
  mediaId: string,
): Promise<GuestRemoveResult> {
  const result = await removeMyUpload(mediaId);
  if (result.ok) return { ok: true };

  // "unknown" is the only branch that is ours: `unauthorized` means the session
  // went away mid-session and `not found` means the row is not this account's
  // (or is already gone), both of which are expected answers rather than bugs.
  if (result.code === "unknown") {
    captureError("media", new Error(result.message), {
      action: "remove_my_upload_guest",
      mediaId,
    });
  }
  return { ok: false, message: result.message };
}

/** The guest album's density step, re-validated through `resolveRowStep`
 *  rather than trusted raw off the client (an index, or the default). */
export async function setRowStepAction(step: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TILE_SIZE_COOKIE, String(resolveRowStep(String(step))), {
    maxAge: TILE_SIZE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });
}
