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
 * The spine (complete): parse -> zod -> classify -> the row already recorded
 * answers at once -> the strategy's own budget -> multipart sum/abort guard + assemble -> R2-HEAD
 * authoritative size (database-security.md) -> a staged single PUT copied into
 * events/ -> strategy.createRecord (which counts the month) -> per-strategy
 * error-status mapping, a refusal taking back out only what no row names.
 *
 * ★ A BURST IS ITS FILES, ONE AFTER ANOTHER, IN ONE REQUEST (compute-uploads; the wire is `burst.ts`'s). Both spines
 * take a burst's body, the only body (one file is a burst of one), for every strategy, and run each file through the
 * very spine a request of its own ran, in order: every check, refusal and word a file met alone it meets in a burst,
 * and a file refused never stops its siblings. A burst shares only what cannot differ between its files (`Burst.memo`: who is sending, to which
 * album, asked once) and tells each file what its earlier siblings took (`Burst.admitted`), so the roll and the meter
 * judge it as a presign one at a time did, after the files before it had landed. A presign refusal the strategy marks
 * the burst's own (`scope: "burst"`: who is sending, which every file meets alike) refuses the whole request, in the
 * words each file would have met. A burst's completes run one after another too, so a budget (the guest's clips a day)
 * is met by each file after the one before it was spent.
 *
 * INVARIANTS THIS FILE OWNS (must survive any edit — docs/systems/
 * uploads-and-r2.md):
 * - The client NEVER influences the key (server-built via mediaObjectKey).
 * - file_size_bytes comes from a HEAD, never the client; so does the phone copy's phone_bytes.
 * - The phone copy (take-home r1) is never metered, so it is capped twice (`phoneCopyFits`): its PUT is
 *   minted only within 4 MB and half the declared original, and complete records it only within both on
 *   the HEAD sizes, else drops it and lands the photograph without one.
 * - An over-stuffed multipart is ABORTED, never assembled; one a first complete assembled and never recorded lands on
 *   its replay as assembled (uploads-idempotent: only that complete can have put an object at its key).
 * - ★ A BYTE REACHES `events/` ONLY THROUGH A COMPLETE (upload-meter, the Advisor's Q19): every single PUT is minted
 *   at its key's `staging/` twin (`stagingKeyFor`), which the backup and the orphan sweep never read and a lifecycle
 *   rule empties a day on, and the complete copies it in before the row is written; a multipart becomes an object only
 *   at this file's CompleteMultipartUpload. So the month (`create_media*`, on the HEAD) counts what landed, once: an
 *   unsent byte never counts, an abandoned one never persists nor is backed up, and a retried PUT counts once.
 * - The presign's meter (`meterUpload`) refuses what the hour, the month or the room cannot take, before a byte moves,
 *   and counts no month itself; it fails OPEN, as the limiters do, since the complete is the count. A burst's file is
 *   metered with its earlier siblings' declared bytes added (`Burst.admitted`), as their landing would have counted them.
 * - ★ A COMPLETE FOR AN UPLOAD ALREADY RECORDED IS ITS ROW'S TO ANSWER (crumbs-62, red-team 49's LOW): read by its id
 *   before any gate, copy or withdrawal, it answers `recorded` and moves nothing, whoever sends it; and a refused or
 *   failed record takes back out of `events/` only what no row names (`withdrawUnlessRecorded`). A gate that moved
 *   since the first complete (the roll its own shot filled, the album closed, a cap its own bytes reached), or any
 *   ticket at all from someone who knows the key, once withdrew the files a recorded row names.
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
import { z } from "zod";

import {
  captureUploadForensics,
  type ForensicIdentity,
} from "@/lib/forensics/capture";
import { acceptCaptureTime, readCaptureWall } from "@/lib/media/capture-time";
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
import { fileBody, splitBurst } from "@/lib/upload/burst";
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
import { readRecordedUpload } from "@/lib/upload/server-pipeline-recorded";
import { formatBytes } from "@/lib/utils";

/** A refusal the strategy fully specifies (status + the exact code/message copy). */
export type PipelineRefusal = {
  status: number;
  code: string;
  message: string;
  /**
   * `burst`: a presign gate about WHO is sending and WHERE (the ticket, the album's door, its switches and its
   * fullness), which every file of a burst meets alike, so it refuses the whole request (the module's head note).
   * Absent: this file's own, and its siblings go on.
   */
  scope?: "burst";
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

/** One file's refusal inside a burst's answer: its words, and the status its own request would have answered. */
function fileRefusal(r: PipelineRefusal) {
  return {
    ok: false as const,
    status: r.status,
    code: r.code,
    message: r.message,
  };
}

const BAD_BODY: PipelineRefusal = {
  status: 400,
  code: "bad_request",
  message: "Invalid request body.",
};

// ─── Bursts ──────────────────────────────────────────────────────────────────

/**
 * ★ WHAT THE FILES OF ONE REQUEST SHARE, AND WHAT EACH IS TOLD OF THE ONES BEFORE IT (the head note). `memo` answers
 * every file of the request with one read of what cannot differ between them (the ticket's context, its owner, the
 * album's lock and switch), keyed by everything the read depends on; a read that failed is asked again by the next
 * file, as each file's own request asked it. `admitted` is what this request admitted before the file in hand (its
 * files, and their declared bytes): the roll counts those shots, and the meter adds those bytes. A burst of one's
 * reads are its own, and nothing came before it.
 */
export type Burst = {
  memo<T>(key: string, read: () => Promise<T>): Promise<T>;
  readonly admitted: { readonly files: number; readonly bytes: number };
};

type OpenBurst = Burst & { admit(bytes: number): void };

function openBurst(): OpenBurst {
  const reads = new Map<string, Promise<unknown>>();
  const admitted = { files: 0, bytes: 0 };
  return {
    memo<T>(key: string, read: () => Promise<T>): Promise<T> {
      const held = reads.get(key);
      if (held) return held as Promise<T>;
      const fresh = read();
      reads.set(key, fresh);
      fresh.catch(() => reads.delete(key));
      return fresh;
    },
    admitted,
    admit(bytes: number) {
      admitted.files += 1;
      admitted.bytes += bytes;
    },
  };
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
   * `burst` shares this request's reads across its files and says what its earlier files took (the head note); a
   * strategy that reads it marks a refusal every file would meet alike `scope: "burst"`.
   */
  resolveEvent(
    parsed: z.output<Schema>,
    kind: MediaKind,
    burst: Burst,
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

const BAD_PRESIGN: PipelineRefusal = {
  status: 400,
  code: "bad_request",
  message: "Invalid upload request.",
};

const UNSUPPORTED_TYPE: PipelineRefusal = {
  status: 415,
  code: "unsupported_type",
  message: "That file type isn't supported.",
};

/**
 * A burst's file whose URLs could not be minted (a multipart R2 would not open): its own failure, said and reported,
 * never its siblings'.
 */
const PRESIGN_FAILED: PipelineRefusal = {
  status: 502,
  code: "presign_failed",
  message: "Couldn't start the upload. Please try again.",
};

/** One file's presign: its entry in the burst's answer (the fields `uploadBurst` reads, in their order), or its refusal. */
type PresignAnswer =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; refusal: PipelineRefusal; retryAfterSec?: number };

export async function runPresignPipeline<
  Schema extends z.ZodType<PresignCommon>,
>(request: Request, strategy: PresignStrategy<Schema>): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse(BAD_BODY);
  }

  const burst = splitBurst(body);
  if (burst === "malformed") return refuse(BAD_PRESIGN);

  const shared = openBurst();
  const files: Record<string, unknown>[] = [];
  for (const entry of burst.files) {
    const parsed = strategy.schema.safeParse(fileBody(burst, entry));
    let one: PresignAnswer;
    if (!parsed.success) {
      one = { ok: false, refusal: BAD_PRESIGN };
    } else {
      try {
        one = await presignFile(parsed.data, strategy, shared);
      } catch (e) {
        captureError("upload", e, { phase: "presign_burst" });
        one = { ok: false, refusal: PRESIGN_FAILED };
      }
    }
    // ★ THE BURST'S OWN GATE (`scope: "burst"`): every file would meet it alike, so before any file is admitted it is
    // the whole request's answer, in the words each file would have met; met after some were (a read that moved
    // mid-request), it is this file's and every later one's, and the earlier answers stand.
    if (!one.ok && one.refusal.scope === "burst") {
      if (shared.admitted.files === 0) {
        return refuse(one.refusal, one.retryAfterSec);
      }
      while (files.length < burst.files.length) {
        files.push(fileRefusal(one.refusal));
      }
      break;
    }
    files.push(one.ok ? one.body : fileRefusal(one.refusal));
  }
  return NextResponse.json({ ok: true, files });
}

/** The presign spine for one file, after its body parsed (the head note). */
async function presignFile<Schema extends z.ZodType<PresignCommon>>(
  parsed: z.output<Schema>,
  strategy: PresignStrategy<Schema>,
  burst: OpenBurst,
): Promise<PresignAnswer> {
  const { content_type, size_bytes } = parsed;

  // Classify + derive the extension SERVER-SIDE from the content-type.
  const kind = classifyMime(content_type);
  const ext = extForMime(content_type);
  if (!kind || !ext) return { ok: false, refusal: UNSUPPORTED_TYPE };

  // Universal 10 GB per-upload ceiling + MIME (fail fast — zero orphans for too-big files).
  const check = validateUpload({ mime: content_type, sizeBytes: size_bytes });
  if (!check.ok) {
    return {
      ok: false,
      refusal: { status: 422, code: "invalid_file", message: check.reason },
    };
  }

  const resolved = await strategy.resolveEvent(parsed, kind, burst);
  if (!resolved.ok) return { ok: false, refusal: resolved.refusal };

  // ★ THE METER (upload-meter, 20261003210500): after every gate and before any URL exists, a file the hour's breaker,
  // the month or the room cannot take is refused here, before a byte moves, in the strategy's words; an admitted one
  // tallies the hour and counts nothing of the month (the complete counts what landed, on its HEAD, once). It fails
  // OPEN, as the limiters do (`meterUpload` reports it): the complete's count and caps stand behind it.
  // ★ A BURST'S FILE IS METERED WITH ITS EARLIER SIBLINGS' BYTES ADDED (compute-uploads): one at a time, they had
  // landed before it was presigned, so the month and the room already held them; the sum is held to the meter's own
  // bound (one upload's ceiling), which still judges this file at least as strictly as alone. Its hour is its own.
  const metered = await meterUpload({
    eventId: resolved.eventId,
    kind,
    bytes: Math.min(size_bytes + burst.admitted.bytes, MAX_UPLOAD_BYTES),
  });
  if (!metered.ok && metered.reason !== "unavailable") {
    const refusal = strategy.meterRefusal(metered);
    // ★ THE HOUR'S BREAKER IS WHO IS SENDING (crumbs-90): it counts the host's uploads across her albums, so every file
    // of a burst meets the hour its first one met, as it meets the album's switch. It refuses the whole request (429,
    // the hour's end in `Retry-After`, as the one-file answer said it), the client asks nothing more for the burst,
    // and no later file is metered for a refusal it cannot escape. The month and the room judge each file's bytes,
    // so a smaller sibling may still fit: those stay its own.
    if (metered.reason === "hourly") {
      return {
        ok: false,
        refusal: { ...refusal, scope: "burst" },
        retryAfterSec: metered.retryAfterSec,
      };
    }
    return { ok: false, refusal };
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
  const previewSize = parsed.preview_size_bytes;
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
  const phoneSize = parsed.phone_size_bytes;
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
    burst.admit(size_bytes);
    return {
      ok: true,
      body: {
        ok: true,
        strategy: "single",
        media_id: mediaId,
        key,
        content_type,
        url,
        headers,
        ...previewField,
        ...phoneField,
      },
    };
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

  burst.admit(size_bytes);
  return {
    ok: true,
    body: {
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
    },
  };
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
  /**
   * `media.captured_at` for the row this completion creates (Will's X7): the uploader's claim of when the original
   * says it was taken, as `completeCaptureTime` left it (an instant inside the bounds, or null: the arrival stands).
   * The engine carries it to either strategy, and each writes it once through its create_media* call.
   */
  captured_at?: string | null;
  /**
   * The original's zoneless wall clock as it is (`captureWall`, `YYYY-MM-DDTHH:mm:ss`), or null: a guest's strategy reads
   * it in the party's zone (`wallInPartyZone`), and the claim above is the fallback. The host's route takes none.
   */
  captured_wall?: string | null;
  upload_id: string | null;
  parts: { partNumber: number; eTag: string }[];
  /** Capture-only device UUID (trust-safety-forensics.md) — forwarded to the forensic record, nothing else. */
  device_uuid?: string;
};

/**
 * A COMPLETE'S CAPTURE TIME, as each route's schema takes it (beside `reel_eligible`): the claim held to the bounds on
 * the server's clock as the body is parsed (`acceptCaptureTime`, their one home), so an absurd or malformed one reads as
 * none (the arrival stands) and never refuses the file, and a body without one (an older tab, a file that said nothing)
 * reads as none too. ★ `.optional()` BEFORE THE TRANSFORM: zod 4 holds a transformed key as required, so without it a
 * body that leaves the key out would be refused whole (every upload from a tab before this field, and every file
 * without a capture time).
 */
export const completeCaptureTime = z
  .unknown()
  .optional()
  .transform((claim) => acceptCaptureTime(claim, Date.now()));

/** A complete's bare wall clock, as the guest's schema takes it: its one shape, or none, never a refusal. */
export const completeCaptureWall = z
  .unknown()
  .optional()
  .transform((wall) => readCaptureWall(wall));

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
       * them verbatim to the 200 and to nothing else, so a refused upload never writes one (a burst's
       * answer carries the first landed file's: every file of a burst shares its ticket and its event).
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
   * phone-size copy, recorded in the same insert (`p_phone_key`, `p_phone_bytes`), or null for none. `burst` shares
   * this request's reads across its files (the head note).
   */
  createRecord(
    parsed: z.output<Schema>,
    kind: MediaKind,
    realSize: number,
    phone: PhoneCopy | null,
    burst: Burst,
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
  /**
   * ★ A BUDGET THE ROUTE HOLDS BEYOND `create_media*`'s OWN (the guest's clips into the album a day, `reel_clip_add`),
   * for the files it `applies` to: `check` is asked of such a file once its row is known not to exist (one already
   * recorded is its row's to answer, never the budget's) and before a byte of it lands; `spend` once its completion
   * answers ok. A burst's budgeted files land one after another, each after the one before it was spent, as their own
   * requests did. Absent: nothing beyond the RPC.
   */
  budget?: {
    applies(parsed: z.output<Schema>): boolean;
    check(
      parsed: z.output<Schema>,
      request: Request,
    ): Promise<{ refusal: PipelineRefusal; retryAfterSec?: number } | null>;
    spend(parsed: z.output<Schema>, request: Request): Promise<void>;
  };
};

const BAD_COMPLETE: PipelineRefusal = {
  status: 400,
  code: "bad_request",
  message: "Invalid completion request.",
};

/** One file's completion: its entry in the burst's answer and its cookies, or its refusal. */
type CompleteAnswer =
  | {
      ok: true;
      body: { ok: true; status: string; sealed?: true };
      setCookies?: readonly (GuestCookieWrite | null | undefined)[];
    }
  | { ok: false; refusal: PipelineRefusal; retryAfterSec?: number };

/** The duplicate's answer, word for word what a twin whose insert met its own row says (`recorded`). */
const RECORDED: CompleteAnswer = {
  ok: true,
  body: { ok: true, status: "recorded" },
};

export async function runCompletePipeline<
  Schema extends z.ZodType<CompleteCommon>,
>(request: Request, strategy: CompleteStrategy<Schema>): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse(BAD_BODY);
  }

  const burst = splitBurst(body);
  if (burst === "malformed") return refuse(BAD_COMPLETE);

  // An upload is completed once a request: a second entry for it is malformed, never a race with itself.
  const seen = new Set<string>();
  const parsedFiles = burst.files.map((entry) => {
    const parsed = strategy.schema.safeParse(fileBody(burst, entry));
    if (!parsed.success || seen.has(parsed.data.media_id)) return null;
    seen.add(parsed.data.media_id);
    return parsed.data;
  });
  // ★ THE BURST'S FILES LAND SIDE BY SIDE AND ARE RECORDED IN ORDER: each file's own checks, its row's read and its R2
  // landing (the HEADs and copies, most of a complete's wait) run ahead, a few at once (`COMPLETE_LANES`), touching
  // only that file's own keys; its record (the gates' re-checks, `create_media*`, a refusal's withdrawal, forensics)
  // runs one file after another in the burst's order, so the rows are written as one-at-a-time completes wrote them.
  // A file the route's budget is for (a clip) lands inside that order too, after the one before it was spent.
  const lane = lanes(COMPLETE_LANES);
  const landings = parsedFiles.map((parsed) =>
    parsed && !strategy.budget?.applies(parsed)
      ? settled(lane(() => landFile(parsed, strategy, request)))
      : null,
  );
  const shared = openBurst();
  const files: Record<string, unknown>[] = [];
  let cookies: readonly (GuestCookieWrite | null | undefined)[] | undefined;
  for (const [i, parsed] of parsedFiles.entries()) {
    let one: CompleteAnswer;
    if (!parsed) {
      one = { ok: false, refusal: BAD_COMPLETE };
    } else {
      try {
        const ahead = landings[i];
        const landed = ahead
          ? await ahead
          : { step: await landFile(parsed, strategy, request) };
        if ("error" in landed) throw landed.error;
        one =
          "done" in landed.step
            ? landed.step.done
            : await recordFile(landed.step.landed, strategy, request, shared);
      } catch (e) {
        // A throw is this file's alone: reported, answered as a completion that did not finish, and its siblings go on.
        captureError("upload", e, {
          phase: "complete_burst",
          media_id: parsed.media_id,
        });
        one = { ok: false, refusal: NOT_FINALIZED };
      }
    }
    if (one.ok && !cookies && one.setCookies?.length) cookies = one.setCookies;
    files.push(one.ok ? one.body : fileRefusal(one.refusal));
  }
  const response = NextResponse.json({ ok: true, files });
  if (cookies) applyGuestCookies(response, cookies);
  return response;
}

/** How many of a burst's files land at once (their R2 HEADs and copies): a few, never the whole burst at R2. */
const COMPLETE_LANES = 4;

/** At most `width` of the works handed in run at once; the rest wait their turn, in order. */
function lanes(width: number) {
  let running = 0;
  const waiting: (() => void)[] = [];
  return async <T>(work: () => Promise<T>): Promise<T> => {
    while (running >= width) await new Promise<void>((go) => waiting.push(go));
    running += 1;
    try {
      return await work();
    } finally {
      running -= 1;
      waiting.shift()?.();
    }
  };
}

/** A landing run ahead, held as its outcome: a rejection waits, handled, for its turn in the burst's order. */
function settled<T>(
  work: Promise<T>,
): Promise<{ step: T } | { error: unknown }> {
  return work.then(
    (step) => ({ step }),
    (error: unknown) => ({ error }),
  );
}

/** A file landed in `events/`, its record still to write: what the record needs, and what a refusal takes back out. */
type Landed<Schema extends z.ZodType<CompleteCommon>> = {
  parsed: z.output<Schema>;
  kind: MediaKind;
  /** The body the record writes (a preview that did not land is none). */
  record: z.output<Schema>;
  realSize: number;
  phone: PhoneCopy | null;
  copied: string[];
};

/** Where a file's landing ended: its answer already (a refusal, its row's `recorded`), or landed for its record. */
type LandStep<Schema extends z.ZodType<CompleteCommon>> =
  | { done: CompleteAnswer }
  | { landed: Landed<Schema> };

/**
 * The complete spine for one file up to its record (the head note): its own shape, its row, the route's budget, and
 * its bytes landed in `events/`. Nothing here writes a row.
 */
async function landFile<Schema extends z.ZodType<CompleteCommon>>(
  parsed: z.output<Schema>,
  strategy: CompleteStrategy<Schema>,
  request: Request,
): Promise<LandStep<Schema>> {
  const { media_id, key, content_type, upload_id, parts } = parsed;

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
    return { done: { ok: false, refusal: KEY_NOT_THIS_UPLOAD } };
  }
  const previewKey = parsed.preview_key;
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
    return {
      done: {
        ok: false,
        refusal: {
          status: 400,
          code: "bad_key",
          message: "That preview key doesn't match this upload.",
        },
      },
    };
  }
  // The phone copy is bound the same way: this upload's own, in this upload's event (its variant, kind and
  // ext are the consistency check's below). A stranger's key here is the same plant the preview's binding stops.
  const phoneKey = parsed.phone_key;
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
    return { done: { ok: false, refusal: KEY_NOT_THIS_UPLOAD } };
  }

  // size_bytes is still accepted by the schemas (the presign step uses it) but is
  // NOT trusted here — the authoritative size comes from R2 below.

  // Derive media_type server-side from the content-type (never trust a client type).
  const kind = classifyMime(content_type);
  if (!kind) return { done: { ok: false, refusal: UNSUPPORTED_TYPE } };

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
    return { done: { ok: false, refusal: KEY_NOT_THIS_UPLOAD } };
  }

  // ★ AN UPLOAD ALREADY RECORDED IS ANSWERED BY ITS ROW, AT ONCE (crumbs-62, red-team 49's LOW): after the request's
  // own shape and before any gate, copy or withdrawal, as `create_media*` answer a duplicate id. A complete comes again
  // for a recorded upload whenever its first answer was lost (a phone retries such a request, a multipart's included,
  // which R2 would refuse to assemble twice), and anyone can send one for an upload whose key a tile's link shows; landed
  // again, it met every gate as it stood NOW and a refusal withdrew the files the row names. The answer is the
  // duplicate's (`recorded`), with no cookie and no forensic record, both the first landing's. A read that fails lets
  // the complete go on as it always did: the row is asked again before anything is taken back out.
  const prior = await readRecorded(media_id);
  if (prior.kind === "row")
    return { done: answerRecorded(prior.originalKey, key) };

  // ★ THE ROUTE'S OWN BUDGET (the guest's clips a day): asked once the row is known not to exist (a clip already
  // recorded is its row's to answer, never the budget's) and before a byte of it lands; spent once it answers ok.
  if (strategy.budget?.applies(parsed)) {
    const spent = await strategy.budget.check(parsed, request);
    if (spent) {
      return {
        done: {
          ok: false,
          refusal: spent.refusal,
          retryAfterSec: spent.retryAfterSec,
        },
      };
    }
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
        return {
          done: {
            ok: false,
            refusal: {
              status: 413,
              code: "too_large",
              message: "This upload exceeded the size limit and was discarded.",
            },
          },
        };
      }
      await completeMultipartUpload({ key, uploadId: upload_id, parts });
    } catch (e) {
      // ★ ASSEMBLED ALREADY (uploads-idempotent): a complete sent again after its first try assembled the object and
      // ended before its row (an answer lost, a function out of time) finds no upload left to list or assemble, and
      // the object at its key, which only a complete of this very upload can have made (the key is built from its
      // media id, an UploadPart URL makes no object, and that complete held the parts' sum to the ceiling first): it
      // lands as assembled, its HEAD the size. Nothing at the key keeps the failure, which a replay asks again (a twin
      // may be assembling it still), so the phone never starts the upload over beside a row that may come.
      if (!(await assembledAt(key))) {
        captureError("upload", e, { key, upload_id });
        return { done: { ok: false, refusal: NOT_FINALIZED } };
      }
      captureWarning("upload", "multipart_already_assembled", {
        key,
        media_id,
      });
    }
  }

  // AUTHORITATIVE size: read the real stored bytes from R2 — never trust the
  // client's size_bytes (a spoofed-low size would evade the storage cap, whose
  // meter is SUM(media.file_size_bytes)). database-security.md. ★ And a staged
  // single PUT is copied into its key here, before any row names it (`landOriginal`).
  const landing = await landOriginal({ key, upload_id, media_id });
  if (!landing.ok) return { done: { ok: false, refusal: landing.refusal } };
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
      ? { ...parsed, preview_key: undefined }
      : parsed;

  return {
    landed: { parsed, kind, record, realSize, phone, copied },
  };
}

/**
 * The complete spine's record for one landed file: the write, a refusal's withdrawal, the forensic record, and the
 * route's budget spent. A burst's records run one after another, in its order.
 */
async function recordFile<Schema extends z.ZodType<CompleteCommon>>(
  landed: Landed<Schema>,
  strategy: CompleteStrategy<Schema>,
  request: Request,
  burst: Burst,
): Promise<CompleteAnswer> {
  const answer = await writeRecord(landed, strategy, request, burst);
  if (answer.ok && strategy.budget?.applies(landed.parsed)) {
    await strategy.budget.spend(landed.parsed, request);
  }
  return answer;
}

async function writeRecord<Schema extends z.ZodType<CompleteCommon>>(
  landed: Landed<Schema>,
  strategy: CompleteStrategy<Schema>,
  request: Request,
  burst: Burst,
): Promise<CompleteAnswer> {
  const { parsed, kind, record, realSize, phone, copied } = landed;
  const { media_id, key } = parsed;

  // ★ A REFUSED OR FAILED RECORD TAKES ITS COPIES BACK OUT, UNLESS A ROW NAMES THEM (`withdrawUnlessRecorded`): the
  // objects this complete wrote into `events/` with no row to name them are deleted at once rather than left for the
  // orphan sweep (the backup would copy them meanwhile); a twin complete of this upload that recorded it meanwhile
  // makes it this one's answer too. The staged objects stay where they are, for the lifecycle rule.
  let result: CreateRecordOutcome;
  try {
    result = await strategy.createRecord(record, kind, realSize, phone, burst);
  } catch (e) {
    if (!(await withdrawUnlessRecorded({ copied, media_id, key }))) throw e;
    // The twin's row answers; the throw is still reported, never swallowed.
    captureError("upload", e, { key, media_id, phase: "record_twin" });
    return RECORDED;
  }

  if (!result.ok) {
    if (await withdrawUnlessRecorded({ copied, media_id, key })) {
      return RECORDED;
    }
    // Routine user rejections (cap/limits/closed/session/ownership) are expected;
    // only a key mismatch or an unmapped DB error signals a bug.
    if (result.code === "bad_key" || result.code === "unknown") {
      captureWarning("upload", `${strategy.captureLabel}: ${result.code}`, {
        code: result.code,
        media_id,
        key,
      });
    }
    return {
      ok: false,
      refusal: {
        status: strategy.errorStatus(result.code),
        code: result.code,
        message: result.message,
      },
    };
  }

  // Forensic capture (trust-safety-forensics.md), at the ONE seam where the row + the request context coexist.
  // AFTER createRecord so a rejected upload records nothing; AWAITED (serverless would kill a
  // floating promise at response time); best-effort-but-loud inside (a capture failure never
  // fails the upload — captureUploadForensics Sentry-warns and the /admin coverage signal shows
  // the gap). A twin complete that lost the insert to its own row (idempotent) upserts-ignore, so it never duplicates
  // the record; one sent after the row existed never reaches here (its row answered it above).
  await captureUploadForensics({
    headers: request.headers,
    mediaId: media_id,
    key,
    deviceUuid: parsed.device_uuid ?? null,
    identity: strategy.forensicIdentity(parsed),
  });

  // {media_id, status} on a fresh insert; {idempotent:true} for a twin whose insert met its own row.
  const status = "idempotent" in result.data ? "recorded" : result.data.status;
  // ★ SEALED, AS THE WRITE SAID IT (disposable-camera, build 43's red-team): a row sealed until its album develops
  // completes `approved` but is no album content yet, and the uploader's caller must not draw it as such. Said only
  // when true, so every other answer is the one it always was.
  const sealed = !("idempotent" in result.data) && result.data.sealed === true;
  return {
    ok: true,
    body: { ok: true, status, ...(sealed ? { sealed: true as const } : {}) },
    setCookies: result.setCookies,
  };
}

/** The key bindings' refusal of a key that is not this upload's. */
const KEY_NOT_THIS_UPLOAD: PipelineRefusal = {
  status: 400,
  code: "bad_key",
  message: "That upload key doesn't match this upload.",
};

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

/** Whether a multipart original stands assembled at its key (a HEAD that cannot answer says no, and nothing lands). */
async function assembledAt(key: string): Promise<boolean> {
  try {
    const head = await headObject({ key });
    return head !== null && head.size > 0;
  } catch {
    return false;
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

/** What the media row says of an upload: recorded (under the key it was recorded with), none, or a read that failed. */
type RecordedRead =
  | { kind: "row"; originalKey: string }
  | { kind: "none" }
  | { kind: "unknown" };

/** The row, read and said when the read fails: a caller that cannot tell neither answers for a row nor takes a file out. */
async function readRecorded(media_id: string): Promise<RecordedRead> {
  try {
    const row = await readRecordedUpload(media_id);
    return row
      ? { kind: "row", originalKey: row.originalKey }
      : { kind: "none" };
  } catch (e) {
    captureWarning("upload", "recorded_read_failed", {
      media_id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { kind: "unknown" };
  }
}

/**
 * A recorded upload's answer. A key that is not the one its row was recorded with (the id is the row's, the event,
 * kind or ext is not) is a complete our client never sends: refused in the key binding's words, and nothing moves.
 */
function answerRecorded(originalKey: string, key: string): CompleteAnswer {
  if (originalKey !== key) {
    captureWarning("upload", "complete_key_not_its_row", { key });
    return { ok: false, refusal: KEY_NOT_THIS_UPLOAD };
  }
  return RECORDED;
}

/**
 * ★ A REFUSAL NEVER WITHDRAWS A KEY A RECORDED ROW POINTS TO (crumbs-62). What a refused or failed record copied into
 * `events/` goes back out only once the row is read and there is none. Found, the row wins: a twin complete of this
 * upload recorded it while this one met a gate the twin had just moved (the roll its insert filled, the room its bytes
 * took), so the upload IS recorded and this complete says so (true; with a key not its row's, it keeps its refusal,
 * and the files stay). A read that fails takes nothing out and says so: the orphan sweep reclaims, a day on, a key no
 * row names. The read and the delete are two acts, so a twin recording in the milliseconds between them could still
 * lose its files; that needs both completes of one upload to straddle a host's change of a gate, and the backup holds
 * every object of `events/` meanwhile.
 */
async function withdrawUnlessRecorded(args: {
  copied: string[];
  media_id: string;
  key: string;
}): Promise<boolean> {
  const { copied, media_id, key } = args;
  const now = await readRecorded(media_id);
  if (now.kind === "row") return now.originalKey === key;
  if (now.kind === "unknown") {
    if (copied.length > 0) {
      captureWarning("upload", "unrecorded_copies_left", {
        keys: copied,
        media_id,
        error: "the media row could not be read",
      });
    }
    return false;
  }
  await unlandCopies(copied, media_id);
  return false;
}
