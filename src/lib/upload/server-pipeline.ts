/**
 * THE UPLOAD PIPELINE (Phase 3 consolidation). One engine for the four
 * presign/complete route handlers — the guest (capability-token) and host
 * (authenticated) pairs were near copy-paste; the spine now lives here once
 * and the routes are thin strategy adapters.
 *
 * The spine (presign): parse -> zod -> classify/derive ext server-side ->
 * universal validateUpload -> strategy.resolveEvent (ALL per-strategy gates)
 * -> server-built key -> single-PUT or multipart presign.
 * The spine (complete): parse -> zod -> classify -> multipart sum/abort guard
 * + assemble -> R2-HEAD authoritative size (database-security.md) -> strategy.createRecord
 * -> per-strategy error-status mapping.
 *
 * INVARIANTS THIS FILE OWNS (must survive any edit — docs/systems/
 * uploads-and-r2.md):
 * - The client NEVER influences the key (server-built via mediaObjectKey).
 * - file_size_bytes comes from headObjectSize, never the client.
 * - An over-stuffed multipart is ABORTED, never assembled.
 * - Response JSON shapes/key order are the uploadFile() client contract —
 *   byte-for-byte identical to the pre-consolidation routes (curl-fixture
 *   verified). Do not reorder fields.
 * - The auth boundary stays in the ROUTES: the host routes gate on getUser()
 *   BEFORE calling the engine (401-before-body-parse ordering preserved);
 *   guest authorization happens inside the strategy's RPCs.
 */
import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

import {
  captureUploadForensics,
  type ForensicIdentity,
} from "@/lib/forensics/capture";
import { MAX_UPLOAD_BYTES, extForMime } from "@/lib/media/limits";
import type { MediaKind } from "@/lib/media/limits";
import { MAX_PREVIEW_BYTES } from "@/lib/media/preview-size";
import { classifyMime, validateUpload } from "@/lib/media/validators";
import {
  applyGuestCookies,
  type GuestCookieWrite,
} from "@/lib/guest/session-cookie";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import {
  isValidMediaKey,
  mediaObjectKey,
  parseEventIdFromKey,
  parseMediaIdFromKey,
} from "@/lib/r2/keys";
import { checkCompleteKeyConsistency } from "@/lib/upload/complete-key-check";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  headObjectSize,
  presignUpload,
  presignUploadPart,
  sumMultipartParts,
} from "@/lib/r2/presign";
import { planParts, uploadStrategyFor } from "@/lib/upload/part-plan";

/** A refusal the strategy fully specifies (status + the exact code/message copy). */
export type PipelineRefusal = {
  status: number;
  code: string;
  message: string;
};

function refuse(r: PipelineRefusal) {
  return NextResponse.json(
    { ok: false, code: r.code, message: r.message },
    { status: r.status },
  );
}

// ─── Presign ─────────────────────────────────────────────────────────────────

/** The fields the engine itself needs; each schema carries its own identity field. */
type PresignCommon = {
  content_type: string;
  size_bytes: number;
  /** The client-generated WebP preview's byte size, so the preview PUT binds content-length. */
  preview_size_bytes?: number;
};

export type PresignStrategy<Schema extends z.ZodType<PresignCommon>> = {
  schema: Schema;
  /**
   * Resolve + authorize the target event and apply EVERY per-strategy gate
   * (session/ownership, event state, video gating, caps, the guests-only
   * per-event max_upload_bytes) with the exact legacy status/code/message.
   */
  resolveEvent(
    parsed: z.output<Schema>,
    kind: MediaKind,
  ): Promise<
    { ok: true; eventId: string } | { ok: false; refusal: PipelineRefusal }
  >;
};

export async function runPresignPipeline<
  Schema extends z.ZodType<PresignCommon>,
>(request: Request, strategy: PresignStrategy<Schema>): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse({
      status: 400,
      code: "bad_request",
      message: "Invalid request body.",
    });
  }

  const parsed = strategy.schema.safeParse(body);
  if (!parsed.success) {
    return refuse({
      status: 400,
      code: "bad_request",
      message: "Invalid upload request.",
    });
  }
  const { content_type, size_bytes } = parsed.data;

  // Classify + derive the extension SERVER-SIDE from the content-type.
  const kind = classifyMime(content_type);
  const ext = extForMime(content_type);
  if (!kind || !ext) {
    return refuse({
      status: 415,
      code: "unsupported_type",
      message: "That file type isn't supported.",
    });
  }

  // Universal 10 GB per-upload ceiling + MIME (fail fast — zero orphans for too-big files).
  const check = validateUpload({ mime: content_type, sizeBytes: size_bytes });
  if (!check.ok) {
    return refuse({ status: 422, code: "invalid_file", message: check.reason });
  }

  const resolved = await strategy.resolveEvent(parsed.data, kind);
  if (!resolved.ok) return refuse(resolved.refusal);

  // Server-built key: the resolved event + a server-generated id + classified
  // kind/ext. The client never influences the key.
  const mediaId = crypto.randomUUID();
  const key = mediaObjectKey({
    eventId: resolved.eventId,
    mediaId,
    kind,
    variant: "original",
    ext,
  });

  // The OPTIONAL preview PUT (a small client-generated WebP, served on tiles). Server-built key, same
  // event/media/kind. Bind its content-length (skip if the declared size exceeds the cap — the original
  // still uploads; a missing preview falls back to the original tile). webp is always single-PUT (tiny).
  const previewKey = mediaObjectKey({
    eventId: resolved.eventId,
    mediaId,
    kind,
    variant: "preview",
    ext: "webp",
  });
  const previewSize = parsed.data.preview_size_bytes;
  const preview =
    previewSize && previewSize <= MAX_PREVIEW_BYTES
      ? await presignUpload({
          key: previewKey,
          contentType: "image/webp",
          contentLength: previewSize,
        })
      : null;
  const previewField = preview
    ? {
        preview: {
          key: previewKey,
          url: preview.url,
          headers: preview.headers,
        },
      }
    : {};

  if (uploadStrategyFor(size_bytes) === "single") {
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
      ...previewField,
    });
  }

  const { uploadId } = await createMultipartUpload({
    key,
    contentType: content_type,
  });
  // Each part's EXACT size, bound into the presign so R2 rejects an
  // over-stuffed body (part-plan.ts owns the math).
  const plan = planParts(size_bytes);
  const parts = await Promise.all(
    plan.map(async (contentLength, i) => {
      const partNumber = i + 1;
      const { url } = await presignUploadPart({
        key,
        uploadId,
        partNumber,
        contentLength,
      });
      return { partNumber, url };
    }),
  );

  return NextResponse.json({
    ok: true,
    strategy: "multipart",
    media_id: mediaId,
    key,
    content_type,
    upload_id: uploadId,
    part_size_bytes: plan[0],
    parts,
    ...previewField,
  });
}

// ─── Complete ────────────────────────────────────────────────────────────────

type CompleteCommon = {
  media_id: string;
  key: string;
  content_type: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  /** The preview R2 key (set only when the client uploaded one); recorded as media.preview_key. */
  preview_key?: string;
  upload_id: string | null;
  parts: { partNumber: number; eTag: string }[];
  /** Capture-only device UUID (trust-safety-forensics.md) — forwarded to the forensic record, nothing else. */
  device_uuid?: string;
};

/** The shape both create-record mutations resolve to (guest + host results both fit). */
type CreateRecordOutcome =
  | {
      ok: true;
      data: { media_id: string; status: string } | { idempotent: true };
      /**
       * ★ COOKIES THE STRATEGY WANTS ON THE SUCCESS RESPONSE (the door as three steps,
       * 2026-09-21). The guest route heals `pr_guest_<eventId>` here, because a completed upload
       * is the LAST moment before the album is supposed to open and the one act that proves the
       * token is real. Optional, and the host strategy never sets it: a host has an account and
       * no guest session. The engine applies them verbatim to the 200 and to nothing else, so a
       * refused upload never writes one.
       */
      setCookies?: readonly (GuestCookieWrite | null | undefined)[];
    }
  | { ok: false; code: string; message: string };

export type CompleteStrategy<Schema extends z.ZodType<CompleteCommon>> = {
  schema: Schema;
  /** The authoritative record write (create_media / create_media_as_host wrapper). */
  createRecord(
    parsed: z.output<Schema>,
    kind: MediaKind,
    realSize: number,
  ): Promise<CreateRecordOutcome>;
  /** HTTP status per failure code — the legacy per-route mapping, verbatim. */
  errorStatus(code: string): number;
  /** Sentry label for unexpected create failures (bad_key/unknown). */
  captureLabel: string;
  /**
   * The uploader identity the route ALREADY holds (guest capability token / getUser()-verified
   * host id), handed to the forensic-capture seam (trust-safety-forensics.md). No new auth is derived here.
   */
  forensicIdentity(parsed: z.output<Schema>): ForensicIdentity;
};

export async function runCompletePipeline<
  Schema extends z.ZodType<CompleteCommon>,
>(request: Request, strategy: CompleteStrategy<Schema>): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse({
      status: 400,
      code: "bad_request",
      message: "Invalid request body.",
    });
  }

  const parsed = strategy.schema.safeParse(body);
  if (!parsed.success) {
    return refuse({
      status: 400,
      code: "bad_request",
      message: "Invalid completion request.",
    });
  }
  const { media_id, key, content_type, upload_id, parts } = parsed.data;

  // ★ KEY BINDING (QA Pattern A, defense-in-depth). The server BUILT both keys at presign as
  // events/<eventId>/<kind>/<mediaId>/<variant>.<ext>, but the client hands them back here, so a
  // caller can substitute either one. The RPCs hold the authoritative event-ownership check; this
  // is the edge twin, and it adds a binding the SQL cannot express: both keys must name THIS
  // media_id and the SAME event. Without it a caller could complete one upload while registering a
  // preview_key belonging to a different upload of their own (a self-inflicted 404, but also the
  // shape that made the cross-event plant possible in the first place). Refuse, don't repair.
  const keyEventId = parseEventIdFromKey(key);
  if (!keyEventId || parseMediaIdFromKey(key) !== media_id) {
    captureWarning("upload", "complete_key_mismatch", { key, media_id });
    return refuse({
      status: 400,
      code: "bad_key",
      message: "That upload key doesn't match this upload.",
    });
  }
  const previewKey = parsed.data.preview_key;
  if (
    previewKey &&
    (!isValidMediaKey(previewKey, keyEventId) ||
      parseMediaIdFromKey(previewKey) !== media_id)
  ) {
    captureWarning("upload", "complete_preview_key_mismatch", {
      key,
      previewKey,
      media_id,
    });
    return refuse({
      status: 400,
      code: "bad_key",
      message: "That preview key doesn't match this upload.",
    });
  }

  // size_bytes is still accepted by the schemas (the presign step uses it) but is
  // NOT trusted here — the authoritative size comes from R2 below.

  // Derive media_type server-side from the content-type (never trust a client type).
  const kind = classifyMime(content_type);
  if (!kind) {
    return refuse({
      status: 415,
      code: "unsupported_type",
      message: "That file type isn't supported.",
    });
  }

  // ★ VARIANT/KIND/EXT BINDING (QA #6), the second half of the key binding above. The key IS the
  // issuance record: presign minted <kind>/<variant>.<ext> from ITS content_type, so requiring the
  // echoed content_type to re-derive the same segments transitively pins complete-time
  // content_type to presign-time content_type with zero stored state. Closes the variant swap
  // (metering the ~2 MB preview as file_size_bytes while the original sits uncounted) and the
  // kind swap (video bytes completed as a photo row, dodging the free-tier photos-only gate).
  // Refuse, don't repair — same posture as the id binding.
  const keyProblem = checkCompleteKeyConsistency({
    key,
    previewKey,
    kind,
    ext: extForMime(content_type),
  });
  if (keyProblem) {
    captureWarning("upload", `complete_key_inconsistent: ${keyProblem}`, {
      key,
      previewKey: previewKey ?? null,
      media_id,
      content_type,
    });
    return refuse({
      status: 400,
      code: "bad_key",
      message: "That upload key doesn't match this upload.",
    });
  }

  // Multipart: assemble the object before recording it. (Single-PUT is already
  // finalized by the browser's PUT.)
  if (upload_id) {
    try {
      // Cost/abuse guard: sum the REAL uploaded part sizes and ABORT (never
      // assemble) if they exceed the 10 GB ceiling. Per-part content-length
      // binding already caps each part at the R2 edge; this is the
      // defense-in-depth backstop that stops an assembled megafile orphan
      // (which the backup Worker would replicate to the WORM bucket).
      const uploadedBytes = await sumMultipartParts({
        key,
        uploadId: upload_id,
      });
      if (uploadedBytes > MAX_UPLOAD_BYTES) {
        await abortMultipartUpload({ key, uploadId: upload_id }).catch(
          () => {},
        );
        captureWarning("upload", "oversize_multipart_aborted", {
          key,
          upload_id,
          uploadedBytes,
        });
        return refuse({
          status: 413,
          code: "too_large",
          message: "This upload exceeded the size limit and was discarded.",
        });
      }
      await completeMultipartUpload({ key, uploadId: upload_id, parts });
    } catch (e) {
      captureError("upload", e, { key, upload_id });
      return refuse({
        status: 502,
        code: "complete_failed",
        message: "Couldn't finalize the upload. Please retry.",
      });
    }
  }

  // AUTHORITATIVE size: read the real stored bytes from R2 — never trust the
  // client's size_bytes (a spoofed-low size would evade the storage cap, whose
  // meter is SUM(media.file_size_bytes)). database-security.md.
  let realSize: number;
  try {
    realSize = await headObjectSize({ key });
  } catch {
    captureWarning("upload", "head_object_failed", { key, media_id });
    return refuse({
      status: 400,
      code: "bad_key",
      message: "Couldn't verify the uploaded file. Please retry.",
    });
  }

  const result = await strategy.createRecord(parsed.data, kind, realSize);

  if (!result.ok) {
    // Routine user rejections (cap/limits/closed/session/ownership) are expected;
    // only a key mismatch or an unmapped DB error signals a bug.
    if (result.code === "bad_key" || result.code === "unknown") {
      captureWarning("upload", `${strategy.captureLabel}: ${result.code}`, {
        code: result.code,
        media_id,
        key,
      });
    }
    return refuse({
      status: strategy.errorStatus(result.code),
      code: result.code,
      message: result.message,
    });
  }

  // Forensic capture (trust-safety-forensics.md), at the ONE seam where the row + the request context coexist.
  // AFTER createRecord so a rejected upload records nothing; AWAITED (serverless would kill a
  // floating promise at response time); best-effort-but-loud inside (a capture failure never
  // fails the upload — captureUploadForensics Sentry-warns and the /admin coverage signal shows
  // the gap). The idempotent-retry case upserts-ignore, so a retry never duplicates the record.
  await captureUploadForensics({
    headers: request.headers,
    mediaId: media_id,
    key,
    deviceUuid: parsed.data.device_uuid ?? null,
    identity: strategy.forensicIdentity(parsed.data),
  });

  // {media_id, status} on a fresh insert; {idempotent:true} on a retry.
  const status = "idempotent" in result.data ? "recorded" : result.data.status;
  const response = NextResponse.json({ ok: true, status });
  if (result.setCookies?.length) applyGuestCookies(response, result.setCookies);
  return response;
}
