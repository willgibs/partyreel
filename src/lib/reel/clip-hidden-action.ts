"use server";

/**
 * THE HOST'S HIDDEN MOMENTS IN HER CLIP'S POOL (`blocked=caption`, Will: "I love showing it's
 * hidden and giving the option to show to include, rather than some complex logic around a way to
 * include hidden media in rules").
 *
 * The page the owner watches her reel on is the guest album, whose payload carries approved media
 * only, so the creator asks for her hidden photographs separately, only for her, only when she
 * opens it. A guest never meets them: nothing here answers anyone but the event's owner.
 *
 * ★ SHOW IS THE LIGHTBOX'S OWN SHOW. A hidden photograph is never in a clip (the reel does not play
 * it); Show puts it back in the album for everyone (`setMediaStatus(..., "approved")`, the same
 * write the viewer's Show makes), and only then is it an ordinary moment she may take.
 *
 * ★ NEITHER REVALIDATES. The creator sits over the guest page's playing reel, and a revalidation
 * from an action re-renders the page that called it: the whole presign-heavy album under the
 * creator. Every page that shows a status reads it per request, and the album's own poll brings the
 * shown photograph in within a beat.
 *
 * Both are public endpoints (Server Functions): every value is parsed, and the session is
 * re-verified with `getUser()` before any row is read or written, then RLS scopes the rest.
 */
import { z } from "zod";

import { setMediaStatus } from "@/lib/db/mutations/media";
import { readEventMedia } from "@/lib/db/queries/media";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import { isEventOwner } from "@/lib/events/gallery-access.server";
import { captureError } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";

const id = z.uuid();

export type ClipHiddenResult =
  | { ok: true; items: GalleryItem[] }
  | { ok: false };

/**
 * The owner's hidden photographs and videos, newest first, each with its presigned preview (a
 * hidden video with no poster has nothing to draw and is left out, as the reel would leave it).
 * Anyone but the owner, and any malformed id, gets `{ ok: false }` and no hint why.
 */
export async function listClipHiddenAction(
  eventId: unknown,
): Promise<ClipHiddenResult> {
  const parsed = id.safeParse(eventId);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (!(await isEventOwner(parsed.data, user.id, supabase))) {
    return { ok: false };
  }
  try {
    // The hidden slice alone, read whole: PostgREST ends a read at 1,000 rows, and a hidden
    // photograph past the first thousand is still hers to show.
    const rows = await readEventMedia(supabase, parsed.data, "hidden");
    const hidden = rows.filter(
      (m) =>
        m.status === "hidden" &&
        m.reel_eligible !== false &&
        (m.preview_key || m.type === "photo"),
    );
    const items = await Promise.all(
      hidden.map(async (m): Promise<GalleryItem> => {
        const previewUrl = await presignDownload({
          key: m.preview_key ?? m.original_key,
          stable: true,
        });
        return {
          id: m.id,
          type: m.type,
          url: previewUrl,
          previewUrl,
          status: "hidden",
          width: m.width ?? null,
          height: m.height ?? null,
          durationSeconds: m.duration_seconds ?? null,
          createdAt: m.created_at,
          isHost: m.guest_id === null,
          reelEligible: true,
        };
      }),
    );
    return { ok: true, items };
  } catch (error) {
    captureError("reel", error, {
      action: "clip_hidden_list",
      eventId: parsed.data,
    });
    return { ok: false };
  }
}

export type ShowMomentResult = { ok: true } | { ok: false; message: string };

/** Show one of the owner's hidden moments in the album again, so her clip may take it. */
export async function showClipMomentAction(
  eventId: unknown,
  mediaId: unknown,
): Promise<ShowMomentResult> {
  const event = id.safeParse(eventId);
  const media = id.safeParse(mediaId);
  if (!event.success || !media.success) {
    return { ok: false, message: "That photo isn't available." };
  }
  // setMediaStatus re-verifies the session and writes on the user's client, where
  // `media_host_all` matches only the host's own events' media: anyone else's id matches no row.
  const result = await setMediaStatus(event.data, media.data, "approved");
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}
