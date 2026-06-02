import { NextResponse } from "next/server";

import { createMediaAsHost } from "@/lib/db/mutations/host-media";
import { classifyMime } from "@/lib/media/validators";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { completeMultipartUpload } from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";
import { hostCompleteUploadSchema } from "@/lib/validation/upload";

// Host twin of /api/r2/complete-upload. For multipart, assembles the object in R2 from
// the per-part ETags the browser collected; then records it via create_media_as_host
// (the authoritative gate for caps/limits/key-prefix + ownership + atomic ledger write,
// status always 'approved'). A duplicate media_id on retry maps to success.
export async function POST(request: Request) {
  // Auth gate: a signed-in host only (the RPC re-checks event ownership).
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

  const parsed = hostCompleteUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "bad_request",
        message: "Invalid completion request.",
      },
      { status: 400 },
    );
  }
  const {
    event_id,
    media_id,
    key,
    content_type,
    size_bytes,
    duration_seconds,
    width,
    height,
    upload_id,
    parts,
  } = parsed.data;

  // Derive media_type server-side from the content-type (never trust a client type).
  const kind = classifyMime(content_type);
  if (!kind) {
    return NextResponse.json(
      {
        ok: false,
        code: "unsupported_type",
        message: "That file type isn't supported.",
      },
      { status: 415 },
    );
  }

  // Multipart: assemble the object before recording it. (Single-PUT is already
  // finalized by the browser's PUT.)
  if (upload_id) {
    try {
      await completeMultipartUpload({ key, uploadId: upload_id, parts });
    } catch (e) {
      captureError("upload", e, { key, upload_id });
      return NextResponse.json(
        {
          ok: false,
          code: "complete_failed",
          message: "Couldn't finalize the upload. Please retry.",
        },
        { status: 502 },
      );
    }
  }

  const result = await createMediaAsHost({
    eventId: event_id,
    mediaId: media_id,
    type: kind,
    originalKey: key,
    fileSizeBytes: size_bytes,
    durationSeconds: duration_seconds ?? null,
    width: width ?? null,
    height: height ?? null,
  });

  if (!result.ok) {
    // Routine rejections (cap/limits/not-owner) are expected; only a key mismatch or an
    // unmapped DB error signals a bug.
    if (result.code === "bad_key" || result.code === "unknown") {
      captureWarning("upload", `create_media_as_host: ${result.code}`, {
        code: result.code,
        media_id,
        key,
      });
    }
    const status =
      result.code === "not_owner"
        ? 404
        : result.code === "cap_reached"
          ? 409
          : result.code === "bad_key"
            ? 400
            : 422;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  // {media_id, status} on a fresh insert; {idempotent:true} on a retry.
  const status = "idempotent" in result.data ? "recorded" : result.data.status;
  return NextResponse.json({ ok: true, status });
}
