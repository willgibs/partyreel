import { NextResponse } from "next/server";

import { getHostUploadContext } from "@/lib/db/mutations/host-media";
import {
  extForMime,
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_THRESHOLD_BYTES,
} from "@/lib/media/limits";
import { classifyMime, validateUpload } from "@/lib/media/validators";
import { mediaObjectKey } from "@/lib/r2/keys";
import {
  createMultipartUpload,
  presignUpload,
  presignUploadPart,
} from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";
import { hostPresignUploadSchema } from "@/lib/validation/upload";

// Host twin of /api/r2/presign-upload: issues presigned R2 upload URLs, but for an
// AUTHENTICATED host adding media straight to an event they own (no capability token).
// Authorize via getUser() + the get_host_upload_context RPC (which re-checks ownership
// and reports cap headroom), then derive the key server-side and presign single-PUT or
// multipart. create_media_as_host (at complete) stays authoritative. Response shape is
// byte-for-byte identical to the guest route (the shared uploadFile depends on it).
export async function POST(request: Request) {
  // 1. Auth gate: a signed-in host only (RLS/RPC re-check ownership at the DB).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in to upload." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = hostPresignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid upload request." },
      { status: 400 },
    );
  }
  const { event_id, content_type, size_bytes } = parsed.data;

  // Classify + derive the extension SERVER-SIDE from the content-type.
  const kind = classifyMime(content_type);
  const ext = extForMime(content_type);
  if (!kind || !ext) {
    return NextResponse.json(
      {
        ok: false,
        code: "unsupported_type",
        message: "That file type isn't supported.",
      },
      { status: 415 },
    );
  }

  // Universal 10 GB per-upload ceiling + MIME (fail fast — zero orphans for too-big files).
  // The host is EXEMPT from the per-event host cap (max_upload_bytes bounds guests only).
  const check = validateUpload({ mime: content_type, sizeBytes: size_bytes });
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid_file", message: check.reason },
      { status: 422 },
    );
  }

  // Resolve ownership + cap headroom (mirrors create_media_as_host's caps).
  const ctx = await getHostUploadContext(event_id, kind);
  if (!ctx.ok) {
    // not_owner: 404, matching how a foreign/missing event resolves on the host page
    // (no leaking whether the event exists).
    return NextResponse.json(
      { ok: false, code: "not_found", message: "This event isn't available." },
      { status: 404 },
    );
  }
  // Phase 2: video is a paid feature. The host's picker is disabled up front on Free
  // (videosAllowedForTier), so reaching here with a video is a race/bypass — a
  // tier-framed message is fine since it's the owner.
  if (ctx.data.video_blocked) {
    return NextResponse.json(
      {
        ok: false,
        code: "video_not_allowed",
        message: "Video uploads are available on the Pro plan.",
      },
      { status: 403 },
    );
  }
  if (ctx.data.at_storage_cap || ctx.data.at_monthly_cap) {
    return NextResponse.json(
      {
        ok: false,
        code: "cap_reached",
        message: ctx.data.at_storage_cap
          ? "Storage is full for your plan. Free up space or upgrade."
          : "You've hit this plan's upload limit for the month.",
      },
      { status: 409 },
    );
  }

  // Server-built key: the owned event + a server-generated id + classified kind/ext.
  // The client never influences the key.
  const mediaId = crypto.randomUUID();
  const key = mediaObjectKey({
    eventId: ctx.data.event_id,
    mediaId,
    kind,
    variant: "original",
    ext,
  });

  if (size_bytes < MULTIPART_THRESHOLD_BYTES) {
    const { url, headers } = await presignUpload({
      key,
      contentType: content_type,
      contentLength: size_bytes,
    });
    return NextResponse.json({
      ok: true,
      strategy: "single",
      media_id: mediaId,
      key,
      content_type,
      url,
      headers,
    });
  }

  const { uploadId } = await createMultipartUpload({
    key,
    contentType: content_type,
  });
  const partCount = Math.ceil(size_bytes / MULTIPART_PART_SIZE_BYTES);
  const parts = await Promise.all(
    Array.from({ length: partCount }, (_, i) => i + 1).map(
      async (partNumber) => {
        // Each part's EXACT size, bound into the presign so R2 rejects an over-stuffed body
        // (parts 1..N-1 = the fixed part size; the last part = the remainder).
        const contentLength =
          partNumber < partCount
            ? MULTIPART_PART_SIZE_BYTES
            : size_bytes - (partCount - 1) * MULTIPART_PART_SIZE_BYTES;
        const { url } = await presignUploadPart({
          key,
          uploadId,
          partNumber,
          contentLength,
        });
        return { partNumber, url };
      },
    ),
  );

  return NextResponse.json({
    ok: true,
    strategy: "multipart",
    media_id: mediaId,
    key,
    content_type,
    upload_id: uploadId,
    part_size_bytes: MULTIPART_PART_SIZE_BYTES,
    parts,
  });
}
