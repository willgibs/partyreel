/**
 * Browser-side upload orchestration, shared by the guest and host flows. Runs in a
 * client component. The caller passes the endpoint pair + identity fields (guest =
 * { session_token }; host = { event_id }) — the two pipelines are otherwise identical.
 *
 * Per file: measure dimensions/duration → client-validate → make the preview (and,
 * for a photograph, its phone-size copy) → POST presign → upload bytes DIRECTLY to
 * R2 (single PUT or multipart, via XHR for progress) → POST complete (which
 * records the media row). The server derives the R2 key from
 * the identity (token or owned event); this module never constructs keys.
 *
 * XHR (not fetch) because only XHR exposes upload progress events. Reading a
 * multipart part's ETag requires the R2 bucket CORS to expose the ETag header.
 *
 * ★ A CANCEL AND A DROPPED CONNECTION ARE TOLD APART, AND A DROPPED CONNECTION IS NEVER HIDDEN (E6, Will 2026-10-04;
 * the failure sheet and the host's rows print `message` as it is, so the words are said here). A request that never
 * reached the network says "Your connection dropped. Check your signal and try again." (the sentence presign and
 * complete always said, now the byte PUT's too: it used to read "Network error during upload.", which reads as
 * a broken app to the person holding the phone in a crowded stadium), a PUT whose bytes stopped moving is ended and
 * said the same way (`UPLOAD_STALL_MS`: a stalled link would otherwise sit at its percentage for ever, hiding the
 * very thing she needs to know), an answer that is an error says the upload did not go through, and a `signal` she
 * aborts says it was cancelled. `cause` carries which, beside the words, for a surface that draws them apart.
 */
import { stripFileMetadata } from "@/lib/media/strip-metadata";
import { classifyMime, validateUpload } from "@/lib/media/validators";
import { getDeviceId } from "@/lib/upload/device-id";
import {
  generatePhoneCopy,
  generatePreview,
  posterPreview,
} from "@/lib/upload/preview";

type Measured = { width?: number; height?: number; duration?: number };

/**
 * An optional derivative's PUT the presign route issues when the client declared its (capped) size: the
 * tile's preview, or a photograph's phone-size copy (take-home r1).
 */
type PreviewPut = { key: string; url: string; headers: Record<string, string> };

type PresignResponse =
  | {
      ok: true;
      strategy: "single";
      media_id: string;
      key: string;
      content_type: string;
      url: string;
      headers: Record<string, string>;
      preview?: PreviewPut;
      phone?: PreviewPut;
    }
  | {
      ok: true;
      strategy: "multipart";
      media_id: string;
      key: string;
      content_type: string;
      upload_id: string;
      part_size_bytes: number;
      parts: { partNumber: number; url: string }[];
      preview?: PreviewPut;
      phone?: PreviewPut;
    }
  | { ok: false; code: string; message: string };

type CompleteResponse =
  | { ok: true; status: string; sealed?: boolean }
  | { ok: false; code: string; message: string };

export type UploadOutcome =
  | {
      ok: true;
      status: string;
      mediaId: string;
      kind: "photo" | "video";
      /** Sealed until its album develops (the complete's own word): approved, and no album content yet. */
      sealed?: boolean;
    }
  // `code` is the SERVER's own refusal code when the refusal came from one of
  // the two routes (absent for a local validation or a transport failure),
  // passed through verbatim from presign OR complete, since either can refuse.
  // The guest queue reads exactly two of them by name, both the SESSION's
  // rather than the file's: `verification_required` (a host who turns Require
  // verified emails ON mid-party invalidates every name-only session mid-run)
  // and `session_other_account` (the ticket this device kept belongs to an
  // account the viewer is not). The difference between "this file did not
  // go" and "your session is worth nothing now" is the difference between a
  // Retry that works and one that cannot.
  //
  // `cause` is set where the failure was the transport's: `dropped` (the connection: Retry once it is back) or
  // `cancelled` (her own abort: nothing is wrong). Absent for a refusal and for a local validation.
  | { ok: false; code?: string; message: string; cause?: UploadCause };

/** Why a transfer ended without landing, where the transport decided it (E6). */
export type UploadCause = "dropped" | "cancelled";

/**
 * THE WORDS A TRANSPORT FAILURE SAYS, in one place (E6). The failure sheet prints a message as it is, so each is
 * copy a guest can act on.
 */
export const UPLOAD_WORDS = {
  dropped: "Your connection dropped. Check your signal and try again.",
  cancelled: "That upload was cancelled.",
  /** A server's answer that was an error (an expired link, a refused size): not the line's fault, nor hers. */
  refused: "That upload didn't go through. Please try again.",
} as const;

/**
 * HOW LONG BYTES MAY STOP MOVING before the upload is ended as a dropped connection. A phone on a weak link still
 * moves bytes every few seconds; a socket that has gone quiet for this long is not coming back (the OS would wait
 * minutes more), and a fresh request beats waiting on it. Generous on purpose: the clock restarts on every byte,
 * and on a page that has been in the background (a phone's browser freezes its timers there).
 */
export const UPLOAD_STALL_MS = 45_000;

/** After the last byte, how long R2 may take to answer (a big object is finalised there) before it is a drop. */
export const UPLOAD_ANSWER_MS = 90_000;

function measureFile(file: File, kind: "photo" | "video"): Promise<Measured> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    // Measurement is best-effort and MUST settle: Chrome defers <video> metadata
    // loading in hidden tabs (backgrounded mid-queue = loadedmetadata never fires),
    // which would wedge the whole queue before its first network call. Same rationale as
    // preview.ts's waitEvent timeouts; the server re-validates size via R2 HEAD.
    let done = false;
    const settle = (m: Measured) => {
      if (done) return;
      done = true;
      clearTimeout(bail);
      resolve(m);
      URL.revokeObjectURL(url);
    };
    const bail = setTimeout(() => settle({}), 7000);
    if (kind === "photo") {
      const img = new Image();
      img.onload = () =>
        settle({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => settle({});
      img.src = url;
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      settle({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
      });
    video.onerror = () => settle({});
    video.src = url;
  });
}

/**
 * ONE PROGRESS REPORT A FRAME. XHR fires `progress` as often as the network
 * hands it bytes (dozens a second on a fast link), and every report is a state
 * patch that re-renders the album around the in-flight tile; a frame can show
 * one number, so the rest were work for nobody. The latest fraction in a frame
 * is the one reported, and nothing is reported once the request has settled
 * (a stale frame landing after `done` would drag the bar back).
 */
export function perFrame(report: ((fraction: number) => void) | undefined) {
  let latest = 0;
  let frame: number | null = null;
  return {
    push(fraction: number) {
      if (!report) return;
      latest = fraction;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        report(latest);
      });
    },
    stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
  };
}

function putWithProgress(args: {
  url: string;
  body: Blob;
  headers?: Record<string, string>;
  onProgress?: (fraction: number) => void;
  /** Her cancel: aborts the transfer, said as a cancel and never as a drop. */
  signal?: AbortSignal;
}): Promise<XMLHttpRequest> {
  const { url, body, headers, onProgress, signal } = args;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadError(UPLOAD_WORDS.cancelled, "cancelled"));
      return;
    }
    const xhr = new XMLHttpRequest();
    const progress = perFrame(onProgress);
    // ★ A STALLED TRANSFER IS A DROPPED CONNECTION, SAID (E6): the clock restarts on every byte the browser reports
    // sent, and on the page coming back to the screen (a background tab's timers freeze); once the last byte is
    // out it waits for R2's answer instead. A silence that long ends the transfer the way a drop would.
    let quiet: ReturnType<typeof setTimeout> | undefined;
    let stalled = false;
    const wait = (ms: number) => {
      clearTimeout(quiet);
      quiet = setTimeout(() => {
        stalled = true;
        xhr.abort();
      }, ms);
    };
    let answering = false;
    const seen = () => wait(answering ? UPLOAD_ANSWER_MS : UPLOAD_STALL_MS);
    const onAbort = () => xhr.abort();
    // The page, where there is one with events to hear (a test's node world has none, and a stub may be bare).
    const page =
      typeof document !== "undefined" &&
      typeof document.addEventListener === "function"
        ? document
        : null;
    const onShow = () => {
      if (page?.visibilityState === "visible") seen();
    };
    const done = () => {
      clearTimeout(quiet);
      progress.stop();
      signal?.removeEventListener("abort", onAbort);
      page?.removeEventListener("visibilitychange", onShow);
    };
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers ?? {})) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (e) => {
      seen();
      if (e.lengthComputable) progress.push(e.loaded / e.total);
    };
    xhr.upload.onload = () => {
      answering = true;
      seen();
    };
    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
      else reject(new UploadError(UPLOAD_WORDS.refused, undefined, xhr.status));
    };
    xhr.onerror = () => {
      done();
      reject(new UploadError(UPLOAD_WORDS.dropped, "dropped"));
    };
    // An abort is hers when her signal says so; a stall is ours and reads as the drop it is; anything else (the
    // browser ending the request) is the connection's too.
    xhr.onabort = () => {
      done();
      reject(
        signal?.aborted && !stalled
          ? new UploadError(UPLOAD_WORDS.cancelled, "cancelled")
          : new UploadError(UPLOAD_WORDS.dropped, "dropped"),
      );
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    page?.addEventListener("visibilitychange", onShow);
    seen();
    xhr.send(body);
  });
}

/**
 * An upload failure whose message is ALREADY guest-ready copy. Anything else
 * that escapes gets the generic message instead, so a raw JS error string
 * ("Unexpected token '<'") can never reach a guest's screen. `why` is the
 * transport's own verdict where it made one (E6); `status` is the answer's, kept
 * for the console and never said.
 */
class UploadError extends Error {
  constructor(
    message: string,
    readonly why?: UploadCause,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    // fetch REJECTS only on a genuine transport failure (venue WiFi dropping,
    // a cell handoff, the tab going offline) and never on a 4xx/5xx. Uncaught,
    // this blip would wedge the whole batch. Hers, if her signal ended it.
    if (signal?.aborted) {
      throw new UploadError(UPLOAD_WORDS.cancelled, "cancelled");
    }
    throw new UploadError(UPLOAD_WORDS.dropped, "dropped");
  }
  try {
    return (await res.json()) as T;
  } catch {
    // A proxy/edge failure answers with an HTML error page, so .json() throws
    // on a response that arrived perfectly well.
    throw new UploadError(
      `The server didn't respond properly (${res.status}). Please try again.`,
    );
  }
}

/**
 * THE CONTRACT: uploadFile ALWAYS RESOLVES an UploadOutcome, never rejects.
 *
 * The queue runner awaits this once per file in a sequential loop. A rejection
 * escaping here would break out of that loop entirely: the file would stay at
 * status "uploading" forever (so it never gets the errored tile's retry
 * affordance) and every file still queued behind it would be silently
 * abandoned. One dropped request on venue WiFi would kill the whole batch.
 *
 * Rather than guard each step (the R2 PUT, the presign/complete round-trips,
 * the best-effort media helpers) one by one, the whole pipeline is wrapped so
 * the contract holds by construction: a new `await` added below cannot wedge
 * the queue. (The queue ALSO catches, belt and braces.)
 */
export async function uploadFile(args: {
  file: File;
  endpoints: { presign: string; complete: string };
  identity: Record<string, string>;
  onProgress?: (fraction: number) => void;
  /** A clip added to the album (the live reel's seam): `false` keeps it out of the live reel. */
  reelEligible?: boolean;
  /** The image the album shows for this upload, when the caller already has it (a clip's poster). */
  poster?: Blob;
  /** Her cancel: ends the transfer and answers `cause: "cancelled"`, never a failure of the connection's. */
  signal?: AbortSignal;
}): Promise<UploadOutcome> {
  try {
    return await runUpload(args);
  } catch (e) {
    if (e instanceof UploadError) {
      return {
        ok: false,
        message: e.message,
        ...(e.why ? { cause: e.why } : {}),
      };
    }
    // An unexpected throw is a bug, not a guest-facing condition: keep it in
    // the console for triage, and show copy a guest can act on.
    console.error("uploadFile: unexpected failure", e);
    return {
      ok: false,
      message: "Something went wrong with that upload. Please try again.",
    };
  }
}

async function runUpload(args: {
  file: File;
  // The presign/complete route pair to hit. Guest -> /api/r2/*; host -> /api/host/r2/*.
  // Both pairs return identical response shapes, so the orchestration below is shared.
  endpoints: { presign: string; complete: string };
  // Auth fields merged into BOTH request bodies: { session_token } (guest capability)
  // or { event_id } (host, authorized server-side via getUser()). Spread first so it
  // can never override a server-derived field.
  identity: Record<string, string>;
  onProgress?: (fraction: number) => void;
  reelEligible?: boolean;
  poster?: Blob;
  signal?: AbortSignal;
}): Promise<UploadOutcome> {
  const {
    file: pickedFile,
    endpoints,
    identity,
    onProgress,
    reelEligible,
    poster,
    signal,
  } = args;
  // Hers before a byte moved: nothing was started, so nothing is left behind.
  if (signal?.aborted) {
    return { ok: false, message: UPLOAD_WORDS.cancelled, cause: "cancelled" };
  }

  const kind = classifyMime(pickedFile.type);
  if (!kind) return { ok: false, message: "That file type isn't supported." };

  // 0. Strip identifying metadata (EXIF GPS/device tags, XMP, MP4/MOV udta location, the
  //    Exif and XMP items of a HEIC/HEIF/AVIF, a WebM's Tags) BEFORE anything reads a size:
  //    presign binds the R2 PUT's Content-Length to the size_bytes declared below, so the
  //    stripped bytes MUST be what every downstream step (measure -> validate -> preview
  //    -> presign -> PUT) sees. Lossless byte-level surgery, never a pixel re-encode;
  //    orientation survives in every format. Best-effort like generatePreview: input the
  //    parsers cannot walk (truncated, malformed) comes back stripped:false with the
  //    ORIGINAL - a failed strip never blocks a guest.
  const cleaned = await stripFileMetadata(pickedFile);
  const file =
    cleaned.blob === pickedFile
      ? pickedFile
      : new File([cleaned.blob], pickedFile.name, {
          type: pickedFile.type,
          lastModified: pickedFile.lastModified,
        });

  const measured = await measureFile(file, kind);

  const localCheck = validateUpload({
    mime: file.type,
    sizeBytes: file.size,
  });
  if (!localCheck.ok) return { ok: false, message: localCheck.reason };

  // 0b. Generate a small WebP preview in the browser from the STRIPPED file (best-effort; null on
  //    skip/failure) - previews were already metadata-clean by canvas regeneration. Its size is sent
  //    to presign so the preview PUT can bind content-length (like the original) — no unbounded preview PUT.
  // A clip arrives with the poster its creator drew (the live reel's seam), which beats seeking into
  // a video the same browser has only just encoded; the generated one stays the fallback.
  const preview =
    (poster ? await posterPreview(poster) : null) ??
    (await generatePreview(file, kind, measured));
  // 0c. A photograph's phone-size copy (take-home r1): 2048 px, a JPEG, from the same stripped file, made
  //    after the preview so one photograph is decoded at a time. Best-effort the same way: null for a clip
  //    (videos stay as taken), for a photograph already phone size, or for a copy past its caps.
  const phone = await generatePhoneCopy(file, kind, measured);

  // 1. Presign (server validates identity + caps and builds the key; issues an optional preview PUT).
  const presign = await postJson<PresignResponse>(
    endpoints.presign,
    {
      ...identity,
      content_type: file.type,
      size_bytes: file.size,
      duration_seconds: measured.duration,
      preview_size_bytes: preview?.blob.size,
      phone_size_bytes: phone?.blob.size,
    },
    signal,
  );
  if (!presign.ok) {
    return {
      ok: false,
      code: presign.code,
      message: presign.message ?? "Couldn't start the upload.",
    };
  }

  // 2. Upload bytes directly to R2.
  const parts: { partNumber: number; eTag: string }[] = [];
  try {
    if (presign.strategy === "single") {
      await putWithProgress({
        url: presign.url,
        body: file,
        headers: presign.headers,
        onProgress,
        signal,
      });
    } else {
      const partSize = presign.part_size_bytes;
      let uploadedBytes = 0;
      for (const part of presign.parts) {
        const start = (part.partNumber - 1) * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));
        const xhr = await putWithProgress({
          url: part.url,
          body: blob,
          onProgress: (frac) =>
            onProgress?.((uploadedBytes + frac * blob.size) / file.size),
          signal,
        });
        uploadedBytes += blob.size;
        const eTag = xhr.getResponseHeader("ETag");
        if (!eTag) {
          // A missing part ETag is a BUCKET MISCONFIGURATION (R2 CORS stopped exposing
          // the ETag header), never something a guest did or can fix — so it follows the
          // uploadFile contract's rule above: the operator detail goes to the console for
          // triage, the guest gets copy they can act on. Naming the header and the bucket
          // to the guest would read like a broken app to the person holding the phone.
          console.error(
            "uploadFile: multipart part missing ETag (the R2 bucket CORS must expose the ETag header)",
            { partNumber: part.partNumber },
          );
          return {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          };
        }
        parts.push({ partNumber: part.partNumber, eTag });
      }
    }
  } catch (e) {
    // The transport's own words (`UPLOAD_WORDS`), with its verdict beside them: a dropped connection and a cancel
    // are never the same sentence (E6). Anything else that escaped is not guest copy.
    if (e instanceof UploadError) {
      if (e.status !== undefined) {
        console.error("uploadFile: the byte PUT was answered an error", {
          status: e.status,
        });
      }
      return {
        ok: false,
        message: e.message,
        ...(e.why ? { cause: e.why } : {}),
      };
    }
    console.error("uploadFile: unexpected failure in the byte PUT", e);
    return {
      ok: false,
      message: "Something went wrong with that upload. Please try again.",
    };
  }

  // 2b. Upload the preview (best-effort). A failure here NEVER fails the upload — the original is what
  //     matters; a missing preview just falls back to the original tile. preview_key is recorded only on
  //     a confirmed PUT.
  //     The phone copy goes beside it, the same way: named at complete only once its PUT has landed.
  const derived = async (
    put: PreviewPut | undefined,
    made: { blob: Blob } | null,
  ): Promise<string | undefined> => {
    if (!put || !made) return undefined;
    try {
      await putWithProgress({
        url: put.url,
        body: made.blob,
        headers: put.headers,
        signal,
      });
      return put.key;
    } catch {
      return undefined; // swallow: no derivative this time, the original is what matters
    }
  };
  const [previewKey, phoneKey] = await Promise.all([
    derived(presign.preview, preview),
    derived(presign.phone, phone),
  ]);
  // Hers while the copies went: the original is in R2 but no row was written, so nothing is recorded and the
  // multipart, if any, is left for the bucket's own abort rule. (Once `complete` is asked it is not aborted: a row
  // that may already be recorded is not the cancel's to undo, and its answer is what the caller reads.)
  if (signal?.aborted) {
    return { ok: false, message: UPLOAD_WORDS.cancelled, cause: "cancelled" };
  }

  // 3. Complete (assembles multipart in R2, then records the media row).
  const complete = await postJson<CompleteResponse>(endpoints.complete, {
    ...identity,
    media_id: presign.media_id,
    key: presign.key,
    content_type: presign.content_type,
    size_bytes: file.size,
    duration_seconds: measured.duration,
    width: measured.width,
    height: measured.height,
    preview_key: previewKey,
    phone_key: phoneKey,
    // Only a clip says anything (the live reel never plays a reel); every other body is unchanged.
    ...(reelEligible === false ? { reel_eligible: false } : {}),
    upload_id: presign.strategy === "multipart" ? presign.upload_id : null,
    parts,
    // CAPTURE-ONLY (trust-safety-forensics.md): the durable device UUID for the deny-all forensic
    // record. Never read back, never product logic; omitted when storage is blocked.
    device_uuid: getDeviceId() ?? undefined,
  });
  if (!complete.ok) {
    return {
      ok: false,
      code: complete.code,
      message: complete.message ?? "Couldn't finalize the upload.",
    };
  }

  // mediaId + kind let the caller optimistically render the upload in the gallery
  // (and dedupe it against the server poll by id).
  return {
    ok: true,
    status: complete.status,
    mediaId: presign.media_id,
    kind,
    ...(complete.sealed === true ? { sealed: true } : {}),
  };
}
