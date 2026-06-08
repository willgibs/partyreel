import { NextResponse } from "next/server";

import { createMediaAsHost } from "@/lib/db/mutations/host-media";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { classifyMime } from "@/lib/media/validators";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  headObjectSize,
  sumMultipartParts,
} from "@/lib/r2/presign";
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
    duration_seconds,
    width,
    height,
    upload_id,
    parts,
  } = parsed.data;
  // size_bytes is still accepted by the schema (the presign step uses it) but is NOT trusted here —
  // we re-derive the authoritative size from R2 below.

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
      // Cost/abuse guard: sum the REAL uploaded part sizes and ABORT (never assemble) if they
      // exceed the 10 GB ceiling. Per-part content-length binding already caps each part at the
      // R2 edge; this is the defense-in-depth backstop that stops an assembled megafile orphan
      // (which the backup Worker would replicate to the WORM bucket) before it can exist.
      const uploadedBytes = await sumMultipartParts({ key, uploadId: upload_id });
      if (uploadedBytes > MAX_UPLOAD_BYTES) {
        await abortMultipartUpload({ key, uploadId: upload_id }).catch(() => {});
        captureWarning("upload", "oversize_multipart_aborted", {
          key,
          upload_id,
          uploadedBytes,
        });
        return NextResponse.json(
          {
            ok: false,
            code: "too_large",
            message: "This upload exceeded the size limit and was discarded.",
          },
          { status: 413 },
        );
      }
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

  // AUTHORITATIVE size: read the real stored bytes from R2 — never trust the client's size_bytes (a
  // spoofed-low size would evade the storage cap, whose meter is SUM(media.file_size_bytes)).
  let realSize: number;
  try {
    realSize = await headObjectSize({ key });
  } catch {
    captureWarning("upload", "head_object_failed", { key, media_id });
    return NextResponse.json(
      {
        ok: false,
        code: "bad_key",
        message: "Couldn't verify the uploaded file. Please retry.",
      },
      { status: 400 },
    );
  }

  const result = await createMediaAsHost({
    eventId: event_id,
    mediaId: media_id,
    type: kind,
    originalKey: key,
    fileSizeBytes: realSize,
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
