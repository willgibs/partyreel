/**
 * Browser-side upload orchestration, shared by the guest and host flows. Runs in a
 * client component. The caller passes the endpoint pair + identity fields (guest =
 * { session_token }; host = { event_id }) — the two pipelines are otherwise identical.
 *
 * Per file: measure dimensions/duration → client-validate → make the preview (and,
 * for a photograph, its phone-size copy) → presign → upload bytes DIRECTLY to
 * R2 (single PUT or multipart, via XHR for progress) → complete (which
 * records the media row). The server derives the R2 key from
 * the identity (token or owned event); this module never constructs keys.
 *
 * ★ A BURST, NEVER A REQUEST A FILE (compute-uploads, the compute model's lever 4; the wire and its limits are
 * `burst.ts`'s). The files a caller hands together (`uploadBurst`; `uploadFile` is a burst of one) share ONE presign
 * and as few completes as their landing allows, where each file was a presign and a complete of its own (a burst of
 * ten photos was 20 function calls). Three stages run side by side and a byte never waits for batching:
 *  - PREPARING runs ahead of the network, one file at a time: the file after the one in the air always (uploads-
 *    idempotent: a file over the budget, a video, no longer holds its successor's preparing until its bytes are up),
 *    and files beyond it while the prepared ones not yet up hold less than `PREP_AHEAD_BYTES`, so a phone never holds
 *    a whole burst of photographs in memory;
 *  - PRESIGNING asks for every prepared file at once: the first file alone (its bytes start as soon as they can), then
 *    the rest together, asked early enough to be back before the network needs them (when the file in the air will end
 *    within about two presign round trips, by its own pace) or at once when preparing can add nothing more (all
 *    prepared, or held by the budget);
 *  - THE BYTES go one file at a time (robust on flaky mobile connections), and a landed file waits for its siblings
 *    (`BURST_RECORD_WAIT_MS`), so the burst is RECORDED together: when its last file has gone up, when the first landed
 *    has waited that long, or at once when the page is hidden (that complete kept alive past the page).
 * Every file meets every check it met alone (the server's spine, file by file), a file refused never stops its
 * siblings, and each settles exactly once (`onOutcome`). A refusal of WHO is sending (the burst's whole answer) is
 * every file's not yet presigned, never asked again.
 *
 * ★ A REQUEST NEVER HANGS, AND A LOST ANSWER IS ASKED AGAIN, NEVER REDONE (uploads-idempotent). Presign and complete
 * each have a ceiling (`PRESIGN_CEILING_MS`, `COMPLETE_CEILING_MS`), past which the line is as dropped as a refused
 * connection and says so with its Try again, never a spinner for ever. That is safe for the complete only because a
 * complete whose answer never came (no answer, one the phone cannot read, or the server's own "couldn't finish") is
 * KEPT, by the very File (`UNANSWERED`): the next try of that file sends that same complete again, its media id and
 * all, and never the upload, so a row the first one wrote answers `recorded` (`readRecordedUpload`), one it never wrote
 * lands now, and no row or byte is ever counted twice. Any other answer settles it, and a refused file's next try
 * starts afresh.
 *
 * XHR (not fetch) because only XHR exposes upload progress events. Reading a
 * multipart part's ETag requires the R2 bucket CORS to expose the ETag header.
 *
 * ★ A CANCEL AND A DROPPED CONNECTION ARE TOLD APART, AND A DROPPED CONNECTION IS NEVER HIDDEN (E6, Will 2026-10-04;
 * the failure sheet and the host's rows print `message` as it is, so the words are said here). A request that never
 * reached the network says "Your connection dropped. Check your signal, then try again." (the sentence presign and
 * complete always said, now the byte PUT's too: it used to read "Network error during upload.", which reads as
 * a broken app to the person holding the phone in a crowded stadium), a PUT whose bytes stopped moving is ended and
 * said the same way (`UPLOAD_STALL_MS`: a stalled link would otherwise sit at its percentage for ever, hiding the
 * very thing she needs to know), an answer that is an error says the upload did not go through, and a `signal` she
 * aborts says it was cancelled. `cause` carries which, beside the words, for a surface that draws them apart.
 *
 * ★ A CANCEL IS ONE FILE'S, OR THE WHOLE BURST'S (upload-cancel, E6 for uploads). `BurstFile.signal` is one file's own
 * stop (the guest's tile and the host's row each stop the one file she means), `signal` on the burst is everything's.
 * A file stopped alone settles `cause: "cancelled"` at once and its siblings carry on, recorded together as ever: what
 * has not asked for a row is simply not recorded (a PUT in the air is aborted, a presign in the air meets its own
 * answer and the file's entry is let go), and a file whose complete is already asked is the record's, never the
 * cancel's: a row may exist, and its answer is what the caller reads. A file going again on a kept complete is the
 * record's from its first moment, for the same reason.
 *
 * ★ ONE SENTENCE FOR THE DROP, EVERYWHERE (crumbs-65): the downloads say it as a title and its detail
 * (`WALK_COPY.dropped` and `droppedDetail`), the camera's hint says this very string, and
 * `uploader.transport.test.ts` holds the three to one wording.
 */
import { stripFileMetadata } from "@/lib/media/strip-metadata";
import { classifyMime, validateUpload } from "@/lib/media/validators";
import {
  BURST_RECORD_WAIT_MS,
  MAX_BURST_FILES,
  PREP_AHEAD_BYTES,
} from "@/lib/upload/burst";
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

/** One file's presign, as a burst's answer carries it (field for field the one-file answer). */
type PresignedFile =
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
    };

/** One file's completion, as a burst's answer carries it. */
type RecordedFile = { ok: true; status: string; sealed?: boolean };

/** One file's refusal inside a burst's answer, or the whole request's (its gate about who is sending). */
type Refusal = { ok: false; code: string; message?: string; status?: number };

/** A burst's answer: each file's, in the request's order, or the whole request refused (`burst.ts`). */
type BurstAnswer<T> = { ok: true; files: (T | Refusal)[] } | Refusal;

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
  dropped: "Your connection dropped. Check your signal, then try again.",
  cancelled: "That upload was cancelled.",
  /** A server's answer that was an error (an expired link, a refused size): not the line's fault, nor hers. */
  refused: "That upload didn't go through. Please try again.",
} as const;

/** The words for what is nobody's to act on but a retry (a bug, an answer of the wrong shape): never a raw error. */
const SOMETHING_WRONG =
  "Something went wrong with that upload. Please try again.";

/**
 * HOW LONG BYTES MAY STOP MOVING before the upload is ended as a dropped connection. A phone on a weak link still
 * moves bytes every few seconds; a socket that has gone quiet for this long is not coming back (the OS would wait
 * minutes more), and a fresh request beats waiting on it. Generous on purpose: the clock restarts on every byte,
 * and on a page that has been in the background (a phone's browser freezes its timers there).
 */
export const UPLOAD_STALL_MS = 45_000;

/** After the last byte, how long R2 may take to answer (a big object is finalised there) before it is a drop. */
export const UPLOAD_ANSWER_MS = 90_000;

/**
 * HOW LONG A PRESIGN MAY TAKE before it is a dropped connection (uploads-idempotent, the head note). Measured on a
 * local build against the real database, a burst's presign answers within a second; one unanswered at thirty is a line
 * that died under it. The clock restarts when the page comes back to the screen (a phone freezes a hidden page's
 * timers, and a request that finished meanwhile must not be ended by a timer that fires late).
 */
export const PRESIGN_CEILING_MS = 30_000;

/**
 * HOW LONG A COMPLETE MAY TAKE before it is a dropped connection. Measured, a burst's complete records its files in a
 * few seconds (their copies landed four at a time, their rows one after another); a minute is a line that died. Its
 * clock restarts as the presign's does. Ending it is safe only because the complete is kept for the next try
 * (`UNANSWERED`): a row it wrote meanwhile answers that try, and is never written twice.
 */
export const COMPLETE_CEILING_MS = 60_000;

/** A file's complete as it was asked, kept while its answer is unknown (`UNANSWERED`). */
type Unanswered = {
  /** The complete's entry for this file, exactly as it went: its media id, key, copies and parts. */
  entry: Record<string, unknown>;
  mediaId: string;
  kind: "photo" | "video";
};

/**
 * ★ THE COMPLETES WHOSE ANSWER NEVER CAME, BY THE FILE THEY RECORD (the head note). A Retry hands the uploader the very
 * File it sent (the guest's queue and the host's panel keep it), which finds its complete here and sends it again
 * instead of presigning and uploading anew, which would write a second row beside the one the first complete may have
 * written. A second pick of the same photograph is another File, so another upload. Weak, so a file a queue lets go
 * takes its entry with it; one page's, as the queue is.
 */
const UNANSWERED = new WeakMap<File, Unanswered>();

/**
 * The server's own "couldn't finish" (a failure it threw, a database it could not reach): a row may stand behind it,
 * so its complete is kept for the next try as a lost answer's is. Every other refusal is the server's settled word on
 * the file, and its next try starts afresh.
 */
const UNSETTLED_REFUSALS: ReadonlySet<string> = new Set([
  "complete_failed",
  "unknown",
]);

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

/** The page, where there is one with events to hear (a test's node world has none, and a stub may be bare). */
function pageEvents(): Document | null {
  return typeof document !== "undefined" &&
    typeof document.addEventListener === "function"
    ? document
    : null;
}

/**
 * A signal that aborts when either of two does: one file's own stop and the burst's. (`AbortSignal.any` is newer than
 * the phones this runs on, so it is two listeners and a controller; `dispose` lets both go once the request is over.)
 */
function eitherSignal(
  a: AbortSignal | undefined,
  b: AbortSignal | undefined,
): { signal: AbortSignal | undefined; dispose: () => void } {
  if (!a || !b) return { signal: a ?? b, dispose: () => {} };
  const either = new AbortController();
  const stop = () => either.abort();
  if (a.aborted || b.aborted) either.abort();
  a.addEventListener("abort", stop, { once: true });
  b.addEventListener("abort", stop, { once: true });
  return {
    signal: either.signal,
    dispose: () => {
      a.removeEventListener("abort", stop);
      b.removeEventListener("abort", stop);
    },
  };
}

function putWithProgress(args: {
  url: string;
  body: Blob;
  headers?: Record<string, string>;
  onProgress?: (fraction: number) => void;
  /** Every progress report as it comes (never one a frame): the burst's own pace reading, which no paint waits on. */
  onBytes?: (fraction: number) => void;
  /** Her cancel: aborts the transfer, said as a cancel and never as a drop. */
  signal?: AbortSignal;
}): Promise<XMLHttpRequest> {
  const { url, body, headers, onProgress, onBytes, signal } = args;
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
    const page = pageEvents();
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
      if (!e.lengthComputable) return;
      progress.push(e.loaded / e.total);
      onBytes?.(e.loaded / e.total);
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

/** A failure as an outcome: the transport's own words and verdict, or the generic sentence for anything else. */
function failureOf(e: unknown): UploadOutcome {
  if (e instanceof UploadError) {
    return {
      ok: false,
      message: e.message,
      ...(e.why ? { cause: e.why } : {}),
    };
  }
  console.error("uploadBurst: unexpected failure", e);
  return { ok: false, message: SOMETHING_WRONG };
}

/**
 * A complete's body small enough to outlive the page (`fetch`'s `keepalive` allows 64 KB in flight a page): a burst
 * recorded as the page is hidden still reaches the server if the page is then closed.
 */
const KEEPALIVE_MAX_BYTES = 60_000;

async function postJson<T>(
  url: string,
  body: unknown,
  opts: { signal?: AbortSignal; keepalive?: boolean; ceilingMs: number },
): Promise<T> {
  const { signal, ceilingMs } = opts;
  const text = JSON.stringify(body);
  // ★ THE CEILING (the head note): a request still unanswered past it is ended as the dropped line it is, its clock
  // restarting whenever the page is looked at again. Beside her signal, never in its place: hers says cancelled.
  const ceiling = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ceiling.abort(), ceilingMs);
  };
  const page = pageEvents();
  const onShow = () => {
    if (page?.visibilityState === "visible") arm();
  };
  const either = eitherSignal(signal, ceiling.signal);
  arm();
  page?.addEventListener("visibilitychange", onShow);
  // Hers if her signal ended it; anything else that ended it (the ceiling, the line) is the connection's.
  const ended = () =>
    signal?.aborted
      ? new UploadError(UPLOAD_WORDS.cancelled, "cancelled")
      : new UploadError(UPLOAD_WORDS.dropped, "dropped");
  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
        signal: either.signal,
        ...(opts.keepalive && text.length <= KEEPALIVE_MAX_BYTES
          ? { keepalive: true }
          : {}),
      });
    } catch {
      // fetch REJECTS only on a genuine transport failure (venue WiFi dropping,
      // a cell handoff, the tab going offline) and never on a 4xx/5xx. Uncaught,
      // this blip would wedge the whole batch.
      throw ended();
    }
    try {
      return (await res.json()) as T;
    } catch {
      // A body cut off by the ceiling or her signal is that; otherwise a proxy/edge failure answered with an HTML
      // error page, so .json() throws on a response that arrived perfectly well.
      if (either.signal?.aborted) throw ended();
      throw new UploadError(
        `The server didn't respond properly (${res.status}). Please try again.`,
      );
    }
  } finally {
    clearTimeout(timer);
    page?.removeEventListener("visibilitychange", onShow);
    either.dispose();
  }
}

/** A burst's answer's files, when it is one for exactly `count` files; null for an answer of any other shape. */
function filesOf<T>(answer: BurstAnswer<T>, count: number) {
  return answer.ok === true &&
    Array.isArray(answer.files) &&
    answer.files.length === count
    ? answer.files
    : null;
}

/** One file of a burst, as its caller hands it. */
export type BurstFile = {
  file: File;
  /** A clip added to the album (the live reel's seam): `false` keeps it out of the live reel. */
  reelEligible?: boolean;
  /** The image the album shows for this upload, when the caller already has it (a clip's poster). */
  poster?: Blob;
  /** Its original's bytes going up, 0 to 1. */
  onProgress?: (fraction: number) => void;
  /** Its bytes began to go: it is the file in the air. */
  onSending?: () => void;
  /** Its bytes (and its copies) are up: it waits to be recorded with its siblings. */
  onSent?: () => void;
  /**
   * HER CANCEL OF THIS ONE FILE: it settles `cause: "cancelled"` (nothing recorded, nothing counted) and its siblings go
   * on. Too late once its complete is asked (a row may be recorded): the abort is then ignored and its answer stands.
   */
  signal?: AbortSignal;
};

/**
 * THE CONTRACT: uploadBurst ALWAYS RESOLVES, one UploadOutcome a file in the order given, and never rejects; each
 * file's outcome is also handed to `onOutcome` the moment it is known (a refusal at presign before its siblings have
 * gone, a landing when its complete answers), exactly once.
 *
 * The callers await this in a loop over their queue. A rejection escaping here would break out of that loop entirely:
 * its files would stay "uploading" forever (so they never get the errored tile's retry affordance) and every file
 * still queued behind them would be silently abandoned. One dropped request on venue WiFi would kill the whole batch.
 * So every stage settles its own files, and the run as a whole is wrapped: a new `await` below cannot wedge the queue.
 */
export async function uploadBurst(args: {
  files: readonly BurstFile[];
  // The presign/complete route pair to hit. Guest -> /api/r2/*; host -> /api/host/r2/*.
  // Both pairs return identical response shapes, so the orchestration below is shared.
  endpoints: { presign: string; complete: string };
  // Auth fields, once at the top of BOTH request bodies: { session_token } (guest capability)
  // or { event_id } (host, authorized server-side via getUser()). The server reads them as every file's.
  identity: Record<string, string>;
  /** Her cancel: ends what has not been asked to record, and answers `cause: "cancelled"`. */
  signal?: AbortSignal;
  onOutcome?: (index: number, outcome: UploadOutcome) => void;
}): Promise<UploadOutcome[]> {
  const outcomes: (UploadOutcome | undefined)[] = args.files.map(
    () => undefined,
  );
  const settle = (i: number, outcome: UploadOutcome) => {
    if (outcomes[i]) return;
    outcomes[i] = outcome;
    args.onOutcome?.(i, outcome);
  };
  try {
    await runBurst(args, outcomes, settle);
  } catch (e) {
    // An unexpected throw is a bug, not a guest-facing condition: kept in the console for triage, and every file it
    // left unsettled says what a guest can act on.
    console.error("uploadBurst: unexpected failure", e);
  }
  return outcomes.map((o, i) => {
    if (o) return o;
    const failed: UploadOutcome = { ok: false, message: SOMETHING_WRONG };
    settle(i, failed);
    return failed;
  });
}

/** One file as preparing leaves it: the stripped bytes every later step sees, its measure and its copies. */
type Prepared = {
  file: File;
  kind: "photo" | "video";
  measured: Measured;
  preview: { blob: Blob } | null;
  phone: { blob: Blob } | null;
};

/** Where a file of the burst stands. `settled` once its outcome is out. */
type Stage =
  | "waiting"
  | "prepared"
  | "presigning"
  | "presigned"
  | "sending"
  | "sent"
  | "recording"
  | "settled";

/** What a landed file's complete names: its copies that landed, and a multipart's parts. */
type Sent = {
  previewKey?: string;
  phoneKey?: string;
  parts: { partNumber: number; eTag: string }[];
};

/**
 * How far ahead of need the next presign is asked, at the least: about two of the last presign's round trips, never
 * under this, so the answer is back before the file in the air ends however the line breathes.
 */
const PRESIGN_LEAD_MIN_MS = 1_000;

async function runBurst(
  args: Parameters<typeof uploadBurst>[0],
  outcomes: readonly (UploadOutcome | undefined)[],
  settleOutcome: (i: number, outcome: UploadOutcome) => void,
): Promise<void> {
  const { files, endpoints, identity, signal } = args;
  const n = files.length;
  const stage: Stage[] = files.map(() => "waiting");
  const prepared: (Prepared | undefined)[] = [];
  const presigned: (PresignedFile | undefined)[] = [];
  /** Each landed file's complete, as it is asked (and kept, while its answer is unknown: `UNANSWERED`). */
  const asked: (Unanswered | undefined)[] = [];
  /** A file going again on its kept complete: the record's from its first moment (the head note). */
  const replay: boolean[] = files.map(() => false);
  const sentAt: number[] = [];

  const settle = (i: number, outcome: UploadOutcome) => {
    if (outcomes[i]) return;
    stage[i] = "settled";
    // A settled file's blobs are nobody's any more (`aheadBytes`).
    prepared[i] = undefined;
    settleOutcome(i, outcome);
  };
  const cancelled: UploadOutcome = {
    ok: false,
    message: UPLOAD_WORDS.cancelled,
    cause: "cancelled",
  };

  // Hers before a byte moved: nothing is started, so nothing is left behind.
  if (signal?.aborted) {
    for (let i = 0; i < n; i++) settle(i, cancelled);
    return;
  }
  // Hers, one file, before a byte moved: it never starts, and its siblings are none the wiser.
  files.forEach((one, i) => {
    if (one.signal?.aborted) settle(i, cancelled);
  });

  // ★ A FILE WHOSE LAST COMPLETE NEVER ANSWERED GOES AGAIN ON IT (the head note): no preparing, presign or byte, and
  // that very complete asked again at once. Its bytes went up on the try before, so it stands full from the start.
  files.forEach((one, i) => {
    const kept = outcomes[i] ? undefined : UNANSWERED.get(one.file);
    if (!kept) return;
    // Taken: this complete's answer decides again whether it is kept (`record`), and the same File twice in one burst
    // is a second upload of it.
    UNANSWERED.delete(one.file);
    asked[i] = kept;
    replay[i] = true;
    stage[i] = "sent";
    sentAt[i] = Date.now();
    one.onSending?.();
    one.onProgress?.(1);
    one.onSent?.();
  });

  // ── The stages' one clock: every change pokes, and a stage waiting on another waits for the next poke ──
  let waiters: (() => void)[] = [];
  const next = () => new Promise<void>((resolve) => waiters.push(resolve));
  /** No new presign or byte starts (a refusal of who is sending, or her cancel). */
  let stopped = false;
  let prepDone = false;
  let sendDone = false;
  /** The file the network waits on for its presign, or null while it has one (or is sending). */
  let wantPresign: number | null = null;
  /** The file the network is on: the one in the air, or the one it waits on for its presign. */
  let sendIndex = 0;
  /** Preparing waits on the budget: nothing more can be prepared until the file in the air is up. */
  let prepHeld = false;
  /**
   * The file in the air, as its own pace tells when it will end: its original's bytes and its copies' (which follow it),
   * and the first and the latest of its progress reports.
   */
  let air: {
    bytes: number;
    copyBytes: number;
    first?: { fraction: number; at: number };
    fraction: number;
    at: number;
  } | null = null;
  /** The last presign's round trip: the next one is asked about twice that ahead of need. */
  let presignMs = 0;
  let presigning = false;
  let recording = false;
  const page = pageEvents();
  let hidden = page?.visibilityState === "hidden";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const poke = () => {
    maybePresign();
    maybeRecord();
    const due = waiters;
    waiters = [];
    for (const resolve of due) resolve();
  };

  /** Every file of the burst no request has carried yet meets `outcome` (the files in a request meet its answer). */
  const stopUnasked = (outcome: UploadOutcome) => {
    stopped = true;
    for (let i = 0; i < n; i++) {
      if (stage[i] === "waiting" || stage[i] === "prepared") {
        settle(i, outcome);
      }
    }
  };

  /** Whether a file still needs the network (its bytes are not up and it is not settled). */
  const needsNetwork = (s: Stage) =>
    s === "waiting" ||
    s === "prepared" ||
    s === "presigning" ||
    s === "presigned";

  // ── Preparing: one file at a time, ahead of the network: the next one always, the rest within PREP_AHEAD_BYTES ──
  // What the page holds: every prepared file whose bytes are not yet up (the one in the air included), and its copies.
  const aheadBytes = () => {
    let bytes = 0;
    for (const p of prepared) {
      if (p)
        bytes +=
          p.file.size + (p.preview?.blob.size ?? 0) + (p.phone?.blob.size ?? 0);
    }
    return bytes;
  };
  /** No file stands between the one the network is on and file `i`: `i` is the network's next. */
  const goesNext = (i: number) => {
    for (let j = sendIndex + 1; j < i; j++) {
      if (needsNetwork(stage[j])) return false;
    }
    return true;
  };
  async function prepareAll() {
    for (let i = 0; i < n; i++) {
      // ★ THE NEXT FILE IS ALWAYS PREPARED (uploads-idempotent): a file over the budget in the air (a video) held its
      // successor's preparing until its own bytes were up, so the next one was prepared in the gap between them.
      while (
        !stopped &&
        !outcomes[i] &&
        aheadBytes() >= PREP_AHEAD_BYTES &&
        !goesNext(i)
      ) {
        if (!prepHeld) {
          prepHeld = true;
          // Held, nothing more can join the next presign before the file in the air is up: it may be asked now.
          maybePresign();
        }
        await next();
      }
      prepHeld = false;
      if (stopped || outcomes[i] || stage[i] !== "waiting") continue;
      const made = await prepare(files[i]);
      if (outcomes[i]) continue;
      if (made.ok) {
        prepared[i] = made.prepared;
        stage[i] = "prepared";
      } else {
        settle(i, made.outcome);
      }
      poke();
    }
    prepDone = true;
    poke();
  }

  // ── Presigning: every prepared file at once, back before the network needs the next one ──
  /** The network's next file, after the one it is on, is prepared and has no presign yet. */
  const nextWantsPresign = () => {
    for (let j = sendIndex + 1; j < n; j++) {
      const s = stage[j];
      if (s === "prepared") return true;
      if (needsNetwork(s)) return false;
    }
    return false;
  };
  /**
   * The file in the air will end (its copies sent too) within the lead, by its own pace since its first report. A file
   * that takes under twice the lead to send never asks ahead: its whole send is shorter than a batch needs to gather,
   * so asking ahead would only split the batch, and the network's own need asks soon enough.
   */
  const endsSoon = () => {
    const first = air?.first;
    if (!air || !first || air.at <= first.at) return false;
    const rate =
      ((air.fraction - first.fraction) * air.bytes) / (air.at - first.at);
    if (!(rate > 0)) return false;
    const lead = Math.max(PRESIGN_LEAD_MIN_MS, 2 * presignMs);
    if ((air.bytes + air.copyBytes) / rate < 2 * lead) return false;
    const left =
      ((1 - air.fraction) * air.bytes + air.copyBytes) / rate -
      (Date.now() - air.at);
    return left <= lead;
  };
  function maybePresign() {
    if (presigning || stopped) return;
    const ready: number[] = [];
    for (let i = 0; i < n && ready.length < MAX_BURST_FILES; i++) {
      if (stage[i] === "prepared") ready.push(i);
    }
    if (ready.length === 0) return;
    const needed = wantPresign !== null && stage[wantPresign] === "prepared";
    // ★ ASKED BEFORE NEED (the head note), and only for the network's next file: once the file in the air nears its
    // end, or once preparing is held by the budget (nothing more could join before it ends). Every prepared file rides.
    const ahead = nextWantsPresign() && (prepHeld || endsSoon());
    if (!needed && !prepDone && !ahead) return;
    presigning = true;
    void presign(ready).finally(() => {
      presigning = false;
      poke();
    });
  }
  async function presign(ready: number[]) {
    for (const i of ready) stage[i] = "presigning";
    const began = Date.now();
    let answer: BurstAnswer<PresignedFile>;
    try {
      answer = await postJson<BurstAnswer<PresignedFile>>(
        endpoints.presign,
        {
          ...identity,
          files: ready.map((i) => {
            const p = prepared[i]!;
            return {
              content_type: p.file.type,
              size_bytes: p.file.size,
              duration_seconds: p.measured.duration,
              preview_size_bytes: p.preview?.blob.size,
              phone_size_bytes: p.phone?.blob.size,
            };
          }),
        },
        { signal, ceilingMs: PRESIGN_CEILING_MS },
      );
    } catch (e) {
      const failed = failureOf(e);
      for (const i of ready) settle(i, failed);
      return;
    }
    presignMs = Date.now() - began;
    if (answer.ok === false) {
      // ★ WHO IS SENDING WAS REFUSED (the burst's whole answer): every file it carried meets it, and so does every
      // file not yet asked for, never asked again (each would meet it alike). A file already presigned goes on: its own
      // complete re-checks every gate.
      const refused: UploadOutcome = {
        ok: false,
        code: answer.code,
        message: answer.message ?? "Couldn't start the upload.",
      };
      for (const i of ready) settle(i, refused);
      stopUnasked(refused);
      return;
    }
    const list = filesOf(answer, ready.length);
    ready.forEach((i, k) => {
      // Hers, one file, while the request was in the air: its entry is nobody's now (nothing was sent for it).
      if (outcomes[i]) return;
      const one = list?.[k];
      if (!one) settle(i, { ok: false, message: SOMETHING_WRONG });
      else if (one.ok) {
        presigned[i] = one;
        stage[i] = "presigned";
      } else {
        settle(i, {
          ok: false,
          code: one.code,
          message: one.message ?? "Couldn't start the upload.",
        });
      }
    });
  }

  /** A landed file's complete: its entry exactly as the complete sends it, and as a kept one is sent again. */
  const completeOf = (i: number, p: Prepared, landed: Sent): Unanswered => {
    const put = presigned[i]!;
    return {
      mediaId: put.media_id,
      kind: p.kind,
      entry: {
        media_id: put.media_id,
        key: put.key,
        content_type: put.content_type,
        size_bytes: p.file.size,
        duration_seconds: p.measured.duration,
        width: p.measured.width,
        height: p.measured.height,
        preview_key: landed.previewKey,
        phone_key: landed.phoneKey,
        // Only a clip says anything (the live reel never plays a reel); every other entry is unchanged.
        ...(files[i].reelEligible === false ? { reel_eligible: false } : {}),
        upload_id: put.strategy === "multipart" ? put.upload_id : null,
        parts: landed.parts,
      },
    };
  };

  // ── The bytes: one file at a time, in order ──
  async function sendAll() {
    for (let i = 0; i < n; i++) {
      sendIndex = i;
      // A kept complete's bytes went up on the try before.
      if (replay[i]) continue;
      while (!outcomes[i] && !presigned[i]) {
        wantPresign = i;
        maybePresign();
        await next();
      }
      wantPresign = null;
      if (outcomes[i]) continue;
      stage[i] = "sending";
      files[i].onSending?.();
      const p = prepared[i]!;
      air = {
        bytes: p.file.size,
        copyBytes: Math.max(p.preview?.blob.size ?? 0, p.phone?.blob.size ?? 0),
        fraction: 0,
        at: Date.now(),
      };
      // Its bytes stop for the burst's cancel or its own (a PUT in the air is aborted: said as a cancel, never a drop).
      const own = eitherSignal(signal, files[i].signal);
      let landed: Awaited<ReturnType<typeof sendBytes>>;
      try {
        landed = await sendBytes(
          files[i],
          p,
          presigned[i]!,
          own.signal,
          (fraction) => {
            if (!air) return;
            air.fraction = fraction;
            air.at = Date.now();
            air.first ??= { fraction, at: air.at };
            maybePresign();
          },
        );
      } finally {
        own.dispose();
        air = null;
      }
      // Its bytes are up (or never will be): its blobs are let go, so preparing may run on (`aheadBytes`).
      prepared[i] = undefined;
      if (outcomes[i]) continue;
      if (landed.ok) {
        asked[i] = completeOf(i, p, landed.sent);
        sentAt[i] = Date.now();
        stage[i] = "sent";
        files[i].onSent?.();
      } else {
        settle(i, landed.outcome);
      }
      poke();
    }
    sendIndex = n;
    sendDone = true;
    poke();
  }

  // ── Recording: the landed files together (the head note's three moments), one complete at a time ──
  function maybeRecord() {
    if (recording) return;
    const due: number[] = [];
    for (let i = 0; i < n && due.length < MAX_BURST_FILES; i++) {
      if (stage[i] === "sent") due.push(i);
    }
    if (due.length === 0) return;
    const waited = Date.now() - Math.min(...due.map((i) => sentAt[i]!));
    const now =
      sendDone ||
      hidden ||
      due.length >= MAX_BURST_FILES ||
      waited >= BURST_RECORD_WAIT_MS ||
      // A kept complete goes at once: nothing of it is left to send, and its answer is a round trip away.
      due.some((i) => replay[i]);
    if (!now) {
      timer ??= setTimeout(() => {
        timer = undefined;
        poke();
      }, BURST_RECORD_WAIT_MS - waited);
      return;
    }
    clearTimeout(timer);
    timer = undefined;
    recording = true;
    void record(due).finally(() => {
      recording = false;
      poke();
    });
  }
  async function record(due: number[]) {
    for (const i of due) stage[i] = "recording";
    const keep = (i: number) => UNANSWERED.set(files[i].file, asked[i]!);
    let answer: BurstAnswer<RecordedFile>;
    try {
      // Never aborted by a cancel (a row may be written); ended past its ceiling as the dropped line it is, the files
      // it carried kept for their next try (below), so that try asks again and never writes a second row.
      answer = await postJson<BurstAnswer<RecordedFile>>(
        endpoints.complete,
        {
          ...identity,
          // CAPTURE-ONLY (trust-safety-forensics.md): the durable device UUID for the deny-all forensic
          // record. Never read back, never product logic; omitted when storage is blocked.
          device_uuid: getDeviceId() ?? undefined,
          files: due.map((i) => asked[i]!.entry),
        },
        { keepalive: true, ceilingMs: COMPLETE_CEILING_MS },
      );
    } catch (e) {
      // ★ NO ANSWER (the line, the ceiling, a body it could not read): whether a row was written is unknown.
      for (const i of due) keep(i);
      const failed = failureOf(e);
      for (const i of due) settle(i, failed);
      return;
    }
    if (answer.ok === false) {
      // The whole request refused in the route's own words: it recorded nothing.
      const refused: UploadOutcome = {
        ok: false,
        code: answer.code,
        message: answer.message ?? "Couldn't finalize the upload.",
      };
      for (const i of due) settle(i, refused);
      return;
    }
    const list = filesOf(answer, due.length);
    due.forEach((i, k) => {
      const one = list?.[k];
      const { mediaId, kind } = asked[i]!;
      if (!one) {
        // An answer of the wrong shape says nothing of the row: kept, as no answer is.
        keep(i);
        settle(i, { ok: false, message: SOMETHING_WRONG });
      } else if (one.ok) {
        // mediaId + kind let the caller optimistically render the upload in the gallery
        // (and dedupe it against the server poll by id).
        settle(i, {
          ok: true,
          status: one.status,
          mediaId,
          kind,
          ...(one.sealed === true ? { sealed: true } : {}),
        });
      } else {
        // The server's own "couldn't finish" may stand on a row it wrote: kept. Any other refusal is its settled word.
        if (UNSETTLED_REFUSALS.has(one.code)) keep(i);
        settle(i, {
          ok: false,
          code: one.code,
          message: one.message ?? "Couldn't finalize the upload.",
        });
      }
    });
  }

  // Hers: what no request carries yet, and what landed with no row asked for, is cancelled (nothing is recorded); a
  // request in the air meets its own answer, and a file being recorded (or going again on its kept complete) is the
  // record's.
  const onAbort = () => {
    stopped = true;
    for (let i = 0; i < n; i++) {
      const s = stage[i];
      if (
        !replay[i] &&
        (s === "waiting" ||
          s === "prepared" ||
          s === "presigned" ||
          s === "sent")
      ) {
        settle(i, cancelled);
      }
    }
    poke();
  };
  // Hers, one file (`BurstFile.signal`): that file alone is cancelled wherever it stands short of its complete, and
  // everything else goes on. A PUT in the air is aborted by the signal it carries (`sendAll`); a presign in the air
  // meets its own answer, which lets this file's entry go (`presign`); a file being recorded is the record's, and so is
  // one going again on its kept complete (a row may already stand).
  const cancelOne = (i: number) => {
    const s = stage[i];
    if (replay[i] || s === "recording" || s === "settled") return;
    settle(i, cancelled);
    poke();
  };
  const offFile = files.map((one, i) => {
    const own = one.signal;
    if (!own || outcomes[i]) return () => {};
    const onFileAbort = () => cancelOne(i);
    own.addEventListener("abort", onFileAbort, { once: true });
    return () => own.removeEventListener("abort", onFileAbort);
  });
  // A page leaving the screen records what landed now (a phone may never come back to it).
  const onVisibility = () => {
    hidden = page?.visibilityState === "hidden";
    poke();
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  page?.addEventListener("visibilitychange", onVisibility);
  try {
    // A kept complete is asked before anything else starts.
    poke();
    await Promise.all([prepareAll(), sendAll()]);
    while (outcomes.some((o) => !o)) {
      poke();
      await next();
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    for (const off of offFile) off();
    page?.removeEventListener("visibilitychange", onVisibility);
  }
}

/** A file made ready to send (the steps before any request), or the outcome that ends it here. */
async function prepare(
  one: BurstFile,
): Promise<
  { ok: true; prepared: Prepared } | { ok: false; outcome: UploadOutcome }
> {
  try {
    const picked = one.file;
    const kind = classifyMime(picked.type);
    if (!kind) {
      return {
        ok: false,
        outcome: { ok: false, message: "That file type isn't supported." },
      };
    }
    // 0. Strip identifying metadata (EXIF GPS/device tags, XMP, MP4/MOV udta location, the
    //    Exif and XMP items of a HEIC/HEIF/AVIF, a WebM's Tags) BEFORE anything reads a size:
    //    presign binds the R2 PUT's Content-Length to the size_bytes declared below, so the
    //    stripped bytes MUST be what every downstream step (measure -> validate -> preview
    //    -> presign -> PUT) sees. Lossless byte-level surgery, never a pixel re-encode;
    //    orientation survives in every format. Best-effort like generatePreview: input the
    //    parsers cannot walk (truncated, malformed) comes back stripped:false with the
    //    ORIGINAL - a failed strip never blocks a guest.
    const cleaned = await stripFileMetadata(picked);
    const file =
      cleaned.blob === picked
        ? picked
        : new File([cleaned.blob], picked.name, {
            type: picked.type,
            lastModified: picked.lastModified,
          });

    const measured = await measureFile(file, kind);

    const localCheck = validateUpload({
      mime: file.type,
      sizeBytes: file.size,
    });
    if (!localCheck.ok) {
      return { ok: false, outcome: { ok: false, message: localCheck.reason } };
    }

    // 0b. Generate a small WebP preview in the browser from the STRIPPED file (best-effort; null on
    //    skip/failure) - previews were already metadata-clean by canvas regeneration. Its size is sent
    //    to presign so the preview PUT can bind content-length (like the original) — no unbounded preview PUT.
    // A clip arrives with the poster its creator drew (the live reel's seam), which beats seeking into
    // a video the same browser has only just encoded; the generated one stays the fallback.
    const preview =
      (one.poster ? await posterPreview(one.poster) : null) ??
      (await generatePreview(file, kind, measured));
    // 0c. A photograph's phone-size copy (take-home r1): 2048 px, a JPEG, from the same stripped file, made
    //    after the preview so one photograph is decoded at a time. Best-effort the same way: null for a clip
    //    (videos stay as taken), for a photograph already phone size, or for a copy past its caps.
    const phone = await generatePhoneCopy(file, kind, measured);
    return { ok: true, prepared: { file, kind, measured, preview, phone } };
  } catch (e) {
    console.error("uploadBurst: unexpected failure preparing a file", e);
    return { ok: false, outcome: { ok: false, message: SOMETHING_WRONG } };
  }
}

/** A presigned file's bytes, straight to R2: its original, then its copies; or the outcome that ends it here. */
async function sendBytes(
  one: BurstFile,
  p: Prepared,
  presign: PresignedFile,
  signal: AbortSignal | undefined,
  /** Its original's every progress report (the burst's pace reading), 0 to 1 across all its parts. */
  onBytes?: (fraction: number) => void,
): Promise<{ ok: true; sent: Sent } | { ok: false; outcome: UploadOutcome }> {
  const { file } = p;
  const onProgress = one.onProgress;
  const parts: { partNumber: number; eTag: string }[] = [];
  try {
    if (presign.strategy === "single") {
      await putWithProgress({
        url: presign.url,
        body: file,
        headers: presign.headers,
        onProgress,
        onBytes,
        signal,
      });
    } else {
      const partSize = presign.part_size_bytes;
      let uploadedBytes = 0;
      for (const part of presign.parts) {
        const start = (part.partNumber - 1) * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));
        const whole = (frac: number) =>
          (uploadedBytes + frac * blob.size) / file.size;
        const xhr = await putWithProgress({
          url: part.url,
          body: blob,
          onProgress: (frac) => onProgress?.(whole(frac)),
          onBytes: (frac) => onBytes?.(whole(frac)),
          signal,
        });
        uploadedBytes += blob.size;
        const eTag = xhr.getResponseHeader("ETag");
        if (!eTag) {
          // A missing part ETag is a BUCKET MISCONFIGURATION (R2 CORS stopped exposing
          // the ETag header), never something a guest did or can fix — so it follows the
          // uploadBurst contract's rule above: the operator detail goes to the console for
          // triage, the guest gets copy they can act on. Naming the header and the bucket
          // to the guest would read like a broken app to the person holding the phone.
          console.error(
            "uploadFile: multipart part missing ETag (the R2 bucket CORS must expose the ETag header)",
            { partNumber: part.partNumber },
          );
          return {
            ok: false,
            outcome: { ok: false, message: SOMETHING_WRONG },
          };
        }
        parts.push({ partNumber: part.partNumber, eTag });
      }
    }
  } catch (e) {
    // The transport's own words (`UPLOAD_WORDS`), with its verdict beside them: a dropped connection and a cancel
    // are never the same sentence (E6). Anything else that escaped is not guest copy.
    if (e instanceof UploadError && e.status !== undefined) {
      console.error("uploadFile: the byte PUT was answered an error", {
        status: e.status,
      });
    }
    return { ok: false, outcome: failureOf(e) };
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
    derived(presign.preview, p.preview),
    derived(presign.phone, p.phone),
  ]);
  // Hers while the copies went: the original is in R2 but no row was written, so nothing is recorded and the
  // multipart, if any, is left for the bucket's own abort rule. (Once `complete` is asked it is not aborted: a row
  // that may already be recorded is not the cancel's to undo, and its answer is what the caller reads.)
  if (signal?.aborted) {
    return {
      ok: false,
      outcome: {
        ok: false,
        message: UPLOAD_WORDS.cancelled,
        cause: "cancelled",
      },
    };
  }
  return { ok: true, sent: { previewKey, phoneKey, parts } };
}

/**
 * ONE FILE: a burst of one (the head note), for a caller with a single file to send (the host's clip, the reel's
 * Add). ALWAYS RESOLVES an UploadOutcome, never rejects (`uploadBurst`'s contract).
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
  const { file, endpoints, identity, onProgress, reelEligible, poster } = args;
  const [outcome] = await uploadBurst({
    files: [{ file, reelEligible, poster, onProgress }],
    endpoints,
    identity,
    signal: args.signal,
  });
  return outcome!;
}
