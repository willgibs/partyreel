/**
 * THE HOST'S ADD TO EVENT: her finished clip into her own album, through the host's own upload
 * pair (`/api/host/r2/presign-upload`, `/api/host/r2/complete-upload`), never the guest queue.
 *
 * Why the host route and not the page's queue: the owner watching her own reel is not a guest. Her
 * upload is written by `create_media_as_host` (the getUser()-verified host, the ownership join,
 * status approved because the host is the moderator, metered on her storage and her monthly ingress,
 * the paid-only video gate), exactly as her own Add photos is, and never spends a guest's clip
 * budget. `reel_eligible = false` rides the completion, so the live reel never plays a reel it made
 * (the complete route's own schema takes it, host-app.md).
 *
 * A guest's add is the seam's `addClipToAlbum` (the page's one upload queue, `use-upload-queue.ts`'s
 * `addClip`), which this module never touches.
 *
 * Client-only: the shared uploader measures, strips, previews and PUTs from the browser.
 */
import { uploadFile, type UploadOutcome } from "@/lib/upload/uploader";

/** The host's upload pair, the same two routes `host-upload.tsx` drives. */
export const HOST_CLIP_ENDPOINTS = {
  presign: "/api/host/r2/presign-upload",
  complete: "/api/host/r2/complete-upload",
} as const;

/**
 * Upload the host's clip into her event's album. Always resolves (the uploader's contract): the
 * outcome's `message` is copy a host can act on, `code` the server's own refusal when there is one.
 */
export function addClipAsHost(input: {
  eventId: string;
  file: File;
  poster: Blob | null;
  onProgress?: (fraction: number) => void;
}): Promise<UploadOutcome> {
  return uploadFile({
    file: input.file,
    endpoints: HOST_CLIP_ENDPOINTS,
    identity: { event_id: input.eventId },
    reelEligible: false,
    poster: input.poster ?? undefined,
    onProgress: input.onProgress,
  });
}
