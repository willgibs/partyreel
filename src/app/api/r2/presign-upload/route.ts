import { NextResponse } from "next/server";

import { getUploadContext } from "@/lib/db/mutations/guest";
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
import { formatBytes } from "@/lib/utils";
import { presignUploadSchema } from "@/lib/validation/upload";

// Issues presigned URLs for a browser → R2 DIRECT upload. This is the orchestration
// brain: validate the session, re-check universal limits + tier caps BEFORE issuing
// any URL (so we don't create orphaned R2 objects create_media would reject), then
// derive the key server-side from the capability token and presign single-PUT
// (small) or multipart (large). create_media (at complete) remains authoritative.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = presignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid upload request." },
      { status: 400 },
    );
  }
  const { session_token, content_type, size_bytes } = parsed.data;

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
  const check = validateUpload({ mime: content_type, sizeBytes: size_bytes });
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid_file", message: check.reason },
      { status: 422 },
    );
  }

  // Resolve session → event + cap headroom (mirrors create_media's caps).
  const ctx = await getUploadContext(session_token, kind);
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid_session", message: ctx.message },
      { status: 401 },
    );
  }
  if (ctx.data.event_deleted) {
    return NextResponse.json(
      {
        ok: false,
        code: "event_gone",
        message: "This event is no longer available.",
      },
      { status: 409 },
    );
  }
  if (!ctx.data.accepting_uploads) {
    return NextResponse.json(
      {
        ok: false,
        code: "uploads_closed",
        message: "This event isn't accepting uploads right now.",
      },
      { status: 403 },
    );
  }
  // Phase 2: a free event is photos-only. Fail fast (zero orphans). The message is
  // EVENT-framed, never tier-framed — a guest must not learn the host's plan.
  if (ctx.data.video_blocked) {
    return NextResponse.json(
      {
        ok: false,
        code: "video_not_allowed",
        message: "This event accepts photos only.",
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
          ? "This album is full right now. The host needs to free up space."
          : "This album has hit its upload limit for the month.",
      },
      { status: 409 },
    );
  }
  // Host-configurable per-event cap (guests only). max_upload_bytes is the host ceiling
  // clamped to 10 GB; the universal 10 GB is already enforced by validateUpload above, so
  // this only bites when the host set a stricter cap. create_media re-checks authoritatively
  // on the R2-HEAD size — a spoofed-low size_bytes here just defers the reject to complete.
  if (size_bytes > ctx.data.max_upload_bytes) {
    return NextResponse.json(
      {
        ok: false,
        code: "too_large",
        message: `Files for this event are capped at ${formatBytes(ctx.data.max_upload_bytes)}.`,
      },
      { status: 422 },
    );
  }

  // Server-built key: event from the token + server-generated id + classified
  // kind/ext. The client never influences the key.
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
        const { url } = await presignUploadPart({ key, uploadId, partNumber });
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
