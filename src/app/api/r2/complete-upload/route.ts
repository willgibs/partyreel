import { NextResponse } from "next/server";

import { createMedia } from "@/lib/db/mutations/guest";
import { classifyMime } from "@/lib/media/validators";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { completeMultipartUpload } from "@/lib/r2/presign";
import { completeUploadSchema } from "@/lib/validation/upload";

// Finalizes an upload. For multipart, assembles the object in R2 from the per-part
// ETags the browser collected; then records it via create_media (the authoritative
// gate for caps/limits/key-prefix + atomic ledger/status write). A duplicate
// media_id on retry is mapped to success (create_media rolls back cleanly).
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

  const parsed = completeUploadSchema.safeParse(body);
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
    session_token,
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
  // finalized by the browser's PUT, so there's nothing to complete in R2.)
  if (upload_id) {
    try {
      await completeMultipartUpload({ key, uploadId: upload_id, parts });
    } catch (e) {
      // A real R2/infra failure — previously swallowed (502 with no trace). Capture it.
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

  const result = await createMedia({
    sessionToken: session_token,
    mediaId: media_id,
    type: kind,
    originalKey: key,
    fileSizeBytes: size_bytes,
    durationSeconds: duration_seconds ?? null,
    width: width ?? null,
    height: height ?? null,
  });

  if (!result.ok) {
    // Routine user rejections (cap/limits/closed/session) are expected and handled below;
    // only the UNEXPECTED codes (a key mismatch or an unmapped DB error) signal a bug.
    if (result.code === "bad_key" || result.code === "unknown") {
      captureWarning("upload", `create_media: ${result.code}`, {
        code: result.code,
        media_id,
        key,
      });
    }
    const status =
      result.code === "invalid_session"
        ? 401
        : result.code === "uploads_closed"
          ? 403
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
