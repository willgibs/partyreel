/**
 * THE UPLOAD PIPELINE. One engine for the four presign/complete route
 * handlers — the guest (capability-token) and host (authenticated) pairs
 * share one spine, which lives here once, and the routes are thin strategy
 * adapters.
 *
 * The spine (presign): parse -> zod -> classify/derive ext server-side ->
 * universal validateUpload -> strategy.resolveEvent (ALL per-strategy gates)
 * -> THE METER (refused in the strategy's words, or the hour tallied)
 * -> server-built key -> a single PUT at its STAGING twin, or a multipart at its key.
 * The spine (complete): parse -> zod -> classify -> multipart sum/abort guard
 * + assemble -> R2-HEAD authoritative size (database-security.md) -> a staged
 * single PUT copied into events/ -> strategy.createRecord (which counts the
 * month) -> per-strategy error-status mapping.
 *
 * INVARIANTS THIS FILE OWNS (must survive any edit — docs/systems/
 * uploads-and-r2.md):
 * - The client NEVER influences the key (server-built via mediaObjectKey).
 * - file_size_bytes comes from a HEAD, never the client; so does the phone copy's phone_bytes.
 * - The phone copy (take-home r1) is never metered, so it is capped twice (`phoneCopyFits`): its PUT is
 *   minted only within 4 MB and half the declared original, and complete records it only within both on
 *   the HEAD sizes, else drops it and lands the photograph without one.
 * - An over-stuffed multipart is ABORTED, never assembled.
 * - ★ A BYTE REACHES `events/` ONLY THROUGH A COMPLETE (upload-meter, the Advisor's Q19): every single PUT is minted
 *   at its key's `staging/` twin (`stagingKeyFor`), which the backup and the orphan sweep never read and a lifecycle
 *   rule empties a day on, and the complete copies it in before the row is written; a multipart becomes an object only
 *   at this file's CompleteMultipartUpload. So the month (`create_media*`, on the HEAD) counts what landed, once: an
 *   unsent byte never counts, an abandoned one never persists nor is backed up, and a retried PUT counts once.
 * - The presign's meter (`meterUpload`) refuses what the hour, the month or the room cannot take, before a byte moves,
 *   and counts no month itself; it fails OPEN, as the limiters do, since the complete is the count.
 * - A preview is never heavier than its original: past it (or past 2 MB) its PUT is refused, in words, and the
 *   original still presigns (its tile serves the original, which is the smaller anyway).
 * - Response JSON shapes/key order are the uploadFile() client contract.
 *   Do not reorder fields.
 * - The auth boundary stays in the ROUTES: the host routes gate on getUser()
 *   BEFORE calling the engine (so a 401 comes before any body parse);
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
import {
  MAX_PREVIEW_BYTES,
  PHONE_FORMAT,
  phoneCopyFits,
} from "@/lib/media/preview-size";
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
  phoneKeyFor,
  stagingKeyFor,
} from "@/lib/r2/keys";
import { checkCompleteKeyConsistency } from "@/lib/upload/complete-key-check";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  copyObject,
  createMultipartUpload,
  headObject,
  headObjectSize,
  presignUpload,
  presignUploadPart,
  sumMultipartParts,
} from "@/lib/r2/presign";
import { planParts, uploadStrategyFor } from "@/lib/upload/part-plan";
import {
  meterUpload,
  type MeterRefusal,
} from "@/lib/upload/server-pipeline-meter";
import { formatBytes } from "@/lib/utils";

/** A refusal the strategy fully specifies (status + the exact code/message copy). */
export type PipelineRefusal = {
  status: number;
  code: string;
  message: string;
};

/** `retryAfterSec` rides as `Retry-After` (the hourly breaker's refusal says when the hour ends). */
function refuse(r: PipelineRefusal, retryAfterSec?: number) {
  return NextResponse.json(
    { ok: false, code: r.code, message: r.message },
    {
      status: r.status,
      ...(retryAfterSec
        ? { headers: { "Retry-After": String(retryAfterSec) } }
        : {}),
    },
  );
}

/**
 * THE STAGING TWIN OF A KEY THIS ENGINE MINTED. Our own keys are always media-shaped, so a null here is a broken
 * invariant, never an input to handle: it throws, and the request fails rather than PUT anywhere unstaged.
 */
function staged(key: string): string {
  const twin = stagingKeyFor(key);
  if (!twin) throw new Error(`stagingKeyFor: not a media key: ${key}`);
  return twin;
}

/** The two sentences a refused preview carries in the presign's answer (`preview_refused`). */
export const PREVIEW_HEAVIER_THAN_ORIGINAL =
  "A preview can't be larger than the file it shows, so this upload's tile shows the file itself.";
export const PREVIEW_PAST_ITS_CAP = `A preview can be at most ${formatBytes(MAX_PREVIEW_BYTES)}, so this upload's tile shows the file itself.`;

/**
 * ★ A PREVIEW IS NEVER HEAVIER THAN ITS ORIGINAL (upload-meter). The preview is never metered, so a PUT at its key is
 * bounded twice on the declared sizes: 2 MB, and its original's bytes (which the meter counts). Past either, the
 * preview alone is refused, in the answer's words, and the original presigns as ever: the browser's 640 px WebP can
 * outweigh a small, heavily compressed photograph, and a guest's upload must never fail over its tile, which then
 * serves the original (the smaller of the two anyway). Null when the preview may go.
 */
export function previewRefusal(
  previewBytes: number,
  originalBytes: number,
): string | null {
  if (previewBytes > MAX_PREVIEW_BYTES) return PREVIEW_PAST_ITS_CAP;
  if (previewBytes > originalBytes) return PREVIEW_HEAVIER_THAN_ORIGINAL;
  return null;
}

// ─── Presign ─────────────────────────────────────────────────────────────────

/** The fields the engine itself needs; each schema carries its own identity field. */
type PresignCommon = {
  content_type: string;
  size_bytes: number;
  /** The client-generated WebP preview's byte size, so the preview PUT binds content-length. */
  preview_size_bytes?: number;
  /** The client-generated phone-size JPEG's byte size (photos only), so its PUT binds content-length too. */
  phone_size_bytes?: number;
};

export type PresignStrategy<Schema extends z.ZodType<PresignCommon>> = {
  schema: Schema;
  /**
   * Resolve + authorize the target event and apply EVERY per-strategy gate
   * (session/ownership, event state, video gating, caps, the guests-only
   * per-event max_upload_bytes) with its route's exact status/code/message.
   */
  resolveEvent(
    parsed: z.output<Schema>,
    kind: MediaKind,
  ): Promise<
    { ok: true; eventId: string } | { ok: false; refusal: PipelineRefusal }
  >;
  /**
   * THE METER'S REFUSALS IN THIS ROUTE'S WORDS (upload-meter): a file the month or the room cannot take, the hour's
   * breaker, an event deleted since its gates. A guest's words name the album and never the plan (a guest must not
   * learn the host's plan); a host's name her plan. The engine adds `Retry-After` to the breaker's.
   */
  meterRefusal(refusal: MeterRefusal): PipelineRefusal;
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

  // ★ THE METER (upload-meter, 20261003210500): after every gate and before any URL exists, a file the hour's breaker,
  // the month or the room cannot take is refused here, before a byte moves, in the strategy's words; an admitted one
  // tallies the hour and counts nothing of the month (the complete counts what landed, on its HEAD, once). It fails
  // OPEN, as the limiters do (`meterUpload` reports it): the complete's count and caps stand behind it.
  const metered = await meterUpload({
    eventId: resolved.eventId,
    kind,
    bytes: size_bytes,
  });
  if (!metered.ok && metered.reason !== "unavailable") {
    return refuse(
      strategy.meterRefusal(metered),
      metered.reason === "hourly" ? metered.retryAfterSec : undefined,
    );
  }

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

  // ★ EVERY SINGLE PUT BELOW IS MINTED AT ITS KEY'S STAGING TWIN (`staged`), never at the key itself, which the answer
  // still names: the client echoes the `events/` keys at complete (the key IS the issuance record), and the complete
  // copies each staged object in. Only a multipart original targets its key directly, since nothing becomes an object
  // there until the complete assembles it.
  //
  // The OPTIONAL preview PUT (a small client-generated WebP, served on tiles). Server-built key, same
  // event/media/kind. Bind its content-length, within 2 MB and its original's bytes (`previewRefusal`): past either,
  // the preview alone is refused and the answer says why in `preview_refused`, in the preview's own slot, while the
  // original still uploads and its tile serves the original. webp is always single-PUT (tiny).
  const previewKey = mediaObjectKey({
    eventId: resolved.eventId,
    mediaId,
    kind,
    variant: "preview",
    ext: "webp",
  });
  const previewSize = parsed.data.preview_size_bytes;
  const previewRefused =
    previewSize === undefined ? null : previewRefusal(previewSize, size_bytes);
  const preview =
    previewSize !== undefined && previewRefused === null
      ? await presignUpload({
          key: staged(previewKey),
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
    : previewRefused
      ? { preview_refused: previewRefused }
      : {};

  // ★ THE PHONE-SIZE COPY (take-home r1): a photograph's 2048 px JPEG, best-effort like the preview. Its PUT is
  // minted only within both caps on the declared sizes (`phoneCopyFits`: 4 MB, and half the original), bound to
  // its exact length, at the staging twin of the photograph's own key; past either, the original simply uploads
  // without one. A clip
  // never asks (videos stay as taken), and an old client never sends the size, so its answer is unchanged.
  const phoneSize = parsed.data.phone_size_bytes;
  const phoneKey = phoneKeyFor({ eventId: resolved.eventId, mediaId });
  const phone =
    kind === "photo" &&
    phoneSize !== undefined &&
    phoneCopyFits(phoneSize, size_bytes)
      ? await presignUpload({
          key: staged(phoneKey),
          contentType: PHONE_FORMAT,
          contentLength: phoneSize,
        })
      : null;
  // Last in the answer, so every earlier field keeps its place (the uploadFile() contract).
  const phoneField = phone
    ? { phone: { key: phoneKey, url: phone.url, headers: phone.headers } }
    : {};

  if (uploadStrategyFor(size_bytes) === "single") {
    const { url, headers } = await presignUpload({
      key: staged(key),
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
      ...phoneField,
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
    ...phoneField,
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
  /** The phone-size copy's key (set only on a confirmed PUT); recorded as media.phone_key with its HEAD size. */
  phone_key?: string;
  /**
   * `media.reel_eligible` for the row this completion creates (the live reel): sent as
   * false ONLY for a clip added to the album (`addClipToAlbum`), so the live reel never plays a reel;
   * absent means eligible (the column's default). The engine carries it to either strategy, guest
   * or host, and each writes it once through its create_media* call. Not a trust boundary: the
   * worst a forged `false` does is keep the sender's own upload out of the reel.
   */
  reel_eligible?: boolean;
  upload_id: string | null;
  parts: { partNumber: number; eTag: string }[];
  /** Capture-only device UUID (trust-safety-forensics.md) — forwarded to the forensic record, nothing else. */
  device_uuid?: string;
};

/** The shape both create-record mutations resolve to (guest + host results both fit). */
type CreateRecordOutcome =
  | {
      ok: true;
      data:
        | { media_id: string; status: string; sealed?: boolean }
        | { idempotent: true };
      /**
       * ★ COOKIES THE STRATEGY WANTS ON THE SUCCESS RESPONSE. The guest route heals
       * `pr_guest_<eventId>` here, because a completed upload is the LAST moment before the album
       * is supposed to open and the one act that proves the token is real. Optional, and the host
       * strategy never sets it: a host has an account and no guest session. The engine applies
       * them verbatim to the 200 and to nothing else, so a refused upload never writes one.
       */
      setCookies?: readonly (GuestCookieWrite | null | undefined)[];
    }
  | { ok: false; code: string; message: string };

/**
 * A photograph's phone-size copy as the complete seam verified it: its key (the photograph's own) and the
 * bytes R2 holds for it, both caps met. Null when the upload has none to record.
 */
export type PhoneCopy = { key: string; bytes: number };

export type CompleteStrategy<Schema extends z.ZodType<CompleteCommon>> = {
  schema: Schema;
  /**
   * The authoritative record write (create_media / create_media_as_host wrapper). `phone` is the verified
   * phone-size copy, recorded in the same insert (`p_phone_key`, `p_phone_bytes`), or null for none.
   */
  createRecord(
    parsed: z.output<Schema>,
    kind: MediaKind,
    realSize: number,
    phone: PhoneCopy | null,
  ): Promise<CreateRecordOutcome>;
  /** HTTP status per failure code — each route's own mapping. */
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
  // The phone copy is bound the same way: this upload's own, in this upload's event (its variant, kind and
  // ext are the consistency check's below). A stranger's key here is the same plant the preview's binding stops.
  const phoneKey = parsed.data.phone_key;
  if (
    phoneKey &&
    (!isValidMediaKey(phoneKey, keyEventId) ||
      parseMediaIdFromKey(phoneKey) !== media_id)
  ) {
    captureWarning("upload", "complete_phone_key_mismatch", {
      key,
      phoneKey,
      media_id,
    });
    return refuse({
      status: 400,
      code: "bad_key",
      message: "That upload key doesn't match this upload.",
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

  // ★ VARIANT/KIND/EXT BINDING, the second half of the key binding above. The key IS the
  // issuance record: presign minted <kind>/<variant>.<ext> from ITS content_type, so requiring the
  // echoed content_type to re-derive the same segments transitively pins complete-time
  // content_type to presign-time content_type with zero stored state. Closes the variant swap
  // (metering the ~2 MB preview as file_size_bytes while the original sits uncounted) and the
  // kind swap (video bytes completed as a photo row, dodging the free-tier photos-only gate).
  // Refuse, don't repair — same posture as the id binding.
  const keyProblem = checkCompleteKeyConsistency({
    key,
    previewKey,
    phoneKey,
    kind,
    ext: extForMime(content_type),
  });
  if (keyProblem) {
    captureWarning("upload", `complete_key_inconsistent: ${keyProblem}`, {
      key,
      previewKey: previewKey ?? null,
      phoneKey: phoneKey ?? null,
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
  // meter is SUM(media.file_size_bytes)). database-security.md. ★ And a staged
  // single PUT is copied into its key here, before any row names it (`landOriginal`).
  const landing = await landOriginal({ key, upload_id, media_id });
  if (!landing.ok) return refuse(landing.refusal);
  const { realSize, copied } = landing;

  // The derivatives land the same way, each best-effort: a preview that did not land is recorded as none (its tile
  // serves the original), and a phone copy past its caps is never copied in at all.
  const landedPreview = previewKey
    ? await landPreview({ previewKey, media_id, copied })
    : null;
  const phone = phoneKey
    ? await verifyPhoneCopy({ phoneKey, realSize, media_id, copied })
    : null;
  const record =
    previewKey && !landedPreview
      ? { ...parsed.data, preview_key: undefined }
      : parsed.data;

  // ★ A REFUSED OR FAILED RECORD TAKES ITS COPIES BACK OUT: the objects this complete wrote into `events/` have no row
  // to name them, so they are deleted at once rather than left for the orphan sweep (the backup would copy them
  // meanwhile). The staged objects stay where they are, for the lifecycle rule.
  let result: CreateRecordOutcome;
  try {
    result = await strategy.createRecord(record, kind, realSize, phone);
  } catch (e) {
    await unlandCopies(copied, media_id);
    throw e;
  }

  if (!result.ok) {
    await unlandCopies(copied, media_id);
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
  // ★ SEALED, AS THE WRITE SAID IT (disposable-camera, build 43's red-team): a row sealed until its album develops
  // completes `approved` but is no album content yet, and the uploader's caller must not draw it as such. Said only
  // when true, so every other answer is the one it always was.
  const sealed = !("idempotent" in result.data) && result.data.sealed === true;
  const response = NextResponse.json({
    ok: true,
    status,
    ...(sealed ? { sealed: true } : {}),
  });
  if (result.setCookies?.length) applyGuestCookies(response, result.setCookies);
  return response;
}

/** The complete's two refusals of an original it cannot land (a missing object, a copy R2 would not make). */
const NOT_VERIFIED: PipelineRefusal = {
  status: 400,
  code: "bad_key",
  message: "Couldn't verify the uploaded file. Please retry.",
};
const NOT_FINALIZED: PipelineRefusal = {
  status: 502,
  code: "complete_failed",
  message: "Couldn't finalize the upload. Please retry.",
};

/**
 * ★ WHERE THE ORIGINAL LANDED, AND ITS AUTHORITATIVE SIZE (upload-meter's staging). A multipart original was
 * assembled at its key by this complete, so its key's HEAD is the size. A single PUT landed at its key's staging twin:
 * its HEAD there is the size (the PUT bound its Content-Length, and a copy is byte-identical), and it is copied into
 * its key now, before any row names it, which is the object-create the backup copies. A single PUT presigned before
 * staging (a deployment's upload in flight across it) went straight to its key, and is honoured there as ever.
 * `copied` lists the keys this complete wrote, so a refused record can take them back out.
 */
async function landOriginal(args: {
  key: string;
  upload_id: string | null;
  media_id: string;
}): Promise<
  | { ok: true; realSize: number; copied: string[] }
  | { ok: false; refusal: PipelineRefusal }
> {
  const { key, upload_id, media_id } = args;
  if (!upload_id) {
    const stagedKey = staged(key);
    const head = await headObject({ key: stagedKey });
    if (head && head.size > 0) {
      try {
        await copyObject({ sourceKey: stagedKey, destinationKey: key });
      } catch (e) {
        captureError("upload", e, { key, media_id, phase: "copy_staged" });
        return { ok: false, refusal: NOT_FINALIZED };
      }
      return { ok: true, realSize: head.size, copied: [key] };
    }
  }
  try {
    return { ok: true, realSize: await headObjectSize({ key }), copied: [] };
  } catch {
    captureWarning("upload", "head_object_failed", { key, media_id });
    return { ok: false, refusal: NOT_VERIFIED };
  }
}

/**
 * The preview, copied in from staging, or (presigned before staging) already at its key; null when none landed, so
 * the row records none and its tile serves the original rather than a key with no object behind it.
 */
async function landPreview(args: {
  previewKey: string;
  media_id: string;
  copied: string[];
}): Promise<string | null> {
  const { previewKey, media_id, copied } = args;
  try {
    await copyObject({
      sourceKey: staged(previewKey),
      destinationKey: previewKey,
    });
    copied.push(previewKey);
    return previewKey;
  } catch {
    const direct = await headObject({ key: previewKey });
    if (direct && direct.size > 0) return previewKey;
    captureWarning("upload", "preview_missing", { key: previewKey, media_id });
    return null;
  }
}

/**
 * ★ THE PHONE COPY, CHECKED ON THE BYTES R2 HOLDS (take-home r1). The presign bound its PUT to the declared
 * sizes, but a multipart original can land shorter than declared, and the copy is never metered: so it is
 * measured here, beside the original's HEAD, and recorded only within both caps (`phoneCopyFits`). A staged copy
 * within both is copied into its key; one past either is never copied in at all (the staging rule deletes it). A
 * copy presigned before staging is measured at its key as before: recorded within both caps, else dropped AND its
 * object deleted, since an unrecorded object under a recorded row is one no purge would ever reach. A copy that is
 * not there lands the photograph without one. Best-effort throughout: nothing about a phone copy ever refuses the
 * photograph itself.
 */
async function verifyPhoneCopy(args: {
  phoneKey: string;
  realSize: number;
  media_id: string;
  copied: string[];
}): Promise<PhoneCopy | null> {
  const { phoneKey, realSize, media_id, copied } = args;
  const stagedKey = staged(phoneKey);
  const stagedHead = await headObject({ key: stagedKey });
  if (stagedHead && stagedHead.size > 0) {
    if (!phoneCopyFits(stagedHead.size, realSize)) {
      captureWarning("upload", "phone_copy_over_cap", {
        key: phoneKey,
        media_id,
        phoneBytes: stagedHead.size,
        originalBytes: realSize,
      });
      return null;
    }
    try {
      await copyObject({ sourceKey: stagedKey, destinationKey: phoneKey });
    } catch (e) {
      captureWarning("upload", "phone_copy_copy_failed", {
        key: phoneKey,
        media_id,
        error: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
    copied.push(phoneKey);
    return { key: phoneKey, bytes: stagedHead.size };
  }
  const head = await headObject({ key: phoneKey });
  if (!head || head.size <= 0) {
    captureWarning("upload", "phone_copy_missing", { key: phoneKey, media_id });
    return null;
  }
  if (phoneCopyFits(head.size, realSize)) {
    return { key: phoneKey, bytes: head.size };
  }
  captureWarning("upload", "phone_copy_over_cap", {
    key: phoneKey,
    media_id,
    phoneBytes: head.size,
    originalBytes: realSize,
  });
  try {
    // Loaded only on this rare path: every completion that records its copy, or has none, never needs it.
    const { deleteR2Objects } = await import("@/lib/r2/delete");
    const out = await deleteR2Objects([phoneKey]);
    if (out.errored.length > 0)
      throw new Error(out.errored[0]?.code ?? "errored");
  } catch (e) {
    // Left in place under a live row (the orphan sweep reclaims it once the row is gone): said, never silent.
    captureWarning("upload", "phone_copy_delete_failed", {
      key: phoneKey,
      media_id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
  return null;
}

/**
 * Take back out of `events/` what this complete copied in, when no row will name it (a refused or failed record).
 * Best-effort and said when it fails: what stays is a recognized key with no row, which the orphan sweep reclaims.
 */
async function unlandCopies(keys: string[], media_id: string): Promise<void> {
  if (keys.length === 0) return;
  try {
    const { deleteR2Objects } = await import("@/lib/r2/delete");
    const out = await deleteR2Objects(keys);
    if (out.errored.length > 0)
      throw new Error(out.errored[0]?.code ?? "errored");
  } catch (e) {
    captureWarning("upload", "unrecorded_copies_left", {
      keys,
      media_id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
