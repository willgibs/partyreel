/**
 * THE DOWNLOAD'S WALK, AS RULES (`export-flow` r1): what counts as worth another silent try, what
 * every state says, and where a phone keeps what it downloads. Pure and client-safe, so the one
 * engine that drives it (`components/app/export/export-walk.ts`) and its tests read the same words.
 *
 * Will's six, as they land here:
 *  - `wait=toast`: the toast keeps her in the loop where she is, and stays until the zip is handed
 *    to the browser (the Worker's check answered and the file is on its way).
 *  - `stuck=retry`: two quiet re-attempts before anything is said, then a way out on a real control;
 *    and his note, a subtle x on the right to cancel ("Interruptibility is a huge win in UX").
 *  - `hollow=refuse`: a zip with nothing in it is never sent, and that is said in one clean line.
 *  - `cap=split`: a big album comes home in parts, walked through in plain words ("Part 1 of 2"),
 *    and the last one says plainly that that is everything. Never "in 2 zips".
 *  - `phone` (built as the board's zip): Download all goes to Files on a phone, and says so.
 *  - `means=mine`: the Yours row (`export-dialog.tsx`), filtered on the server.
 *
 * And Will's E6 (2026-10-04): a cancel and a dropped connection are told apart.
 *  - A CANCEL IS INTENTIONAL: the x asks first ("Cancel this download?", nothing is handed over while it stands),
 *    then the toast says it was cancelled and offers Try again (or, past the first part, the part she stopped at).
 *  - A DROPPED CONNECTION IS NEVER HIDDEN: it says "Your connection dropped." and what to do, so she neither tries
 *    in vain nor blames the app (his picture: a crowded indoor stadium, "I hate this app, it's not working").
 *    The page can tell only what its own line did (`dropped`: a request of its own failed to reach the app), so a
 *    zip the Worker saw the client leave (`stopped`: she cancelled it in the browser's own list, or the line
 *    dropped) reads as a drop when the page's line failed while it streamed, and as a cancel when it did not.
 */
import { formatCount } from "@/lib/format/count";
import type { Platform } from "@/lib/media/share-save";

/** A token's nonce: 16 random bytes in hex (the mint's `randomBytes(16)`; `report.ts` keeps the same rule). */
const JTI_RE = /^[0-9a-f]{32}$/;

/* ── the waits: three tries a step, then a way out ───────────────────────── */

/**
 * ONE CEILING PER TRY, LONGER EACH TIME. A mint over a big album is honest work (the whole album
 * read and measured), so the first try gets ten seconds, not the board's three; a party network's
 * dropped request usually shows as a hang, which is what the ceiling is for. Two silent pauses
 * between them. Worst case, about 47 seconds before a word is said, with the x there all along.
 */
export const MINT_TRIES_MS = [10_000, 15_000, 20_000] as const;

/** The Worker's check: two tries (it is an extra, and the zip can go without it). */
export const CHECK_TRIES_MS = [15_000, 15_000] as const;

/** The menu's summary: two tries, while the open menu says "Adding it up". */
export const SUMMARY_TRIES_MS = [10_000, 15_000] as const;

/** The pause before each re-attempt. */
export const RETRY_PAUSE_MS = [500, 1500] as const;

/** One try's outcome, as the engine saw it. */
export type Attempt =
  | { kind: "answer"; status: number; body: unknown }
  | { kind: "network" }
  | { kind: "timeout" }
  | { kind: "cancelled" };

/**
 * WHETHER A TRY FAILED FOR WANT OF A LINE, which is the only thing the page can know about a dropped connection:
 * its request never reached the app (`network`: the fetch rejected, offline or a radio that lost its bearer) or
 * never came back (`timeout`: a stadium's crowded cell). An answer, even a 500, is a line that works, and a
 * `cancelled` try is her own act.
 */
export const lineFailed = (a: Attempt): boolean =>
  a.kind === "network" || a.kind === "timeout";

/**
 * How many status polls in a row must fail before the toast says the line looks lost while a zip streams: three,
 * which is a few seconds offline (each poll rejects at once) and about half a minute on a line that only stalls
 * (each waits out its ceiling), never one dropped request on a weak line that comes right on the next.
 */
export const LINE_LOST_AFTER = 3;

/** A mint that answered what the walk needs. */
export type MintAnswer = {
  token: string;
  workerUrl: string;
  /** Absent from a server before the check: the walk then goes straight to the zip. */
  checkUrl?: string;
  part: number;
  parts: number;
  next: string | null;
  items: number;
  /** The token's nonce, which the walk's status poll asks by (`export-ends`; absent from older servers). */
  jti?: string;
  /** The token asks the Worker to report, so its word on the stream may come (`export-ends`). */
  reports?: boolean;
};

export type MintVerdict =
  | { kind: "ok"; mint: MintAnswer }
  | { kind: "retry" }
  | { kind: "refused"; code: string | null; message: string | null }
  | { kind: "cancelled" };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** Codes a server says on purpose: another try would only say them again. */
const SETTLED = new Set(["paused", "unconfigured"]);

/**
 * What one mint try means. A dropped request, a ceiling reached, or a server error with no settled
 * reason is worth another quiet try; a server that refused on purpose (paused, rate limited, not
 * yours, nothing left) is said at once.
 */
export function mintVerdict(a: Attempt): MintVerdict {
  if (a.kind === "cancelled") return { kind: "cancelled" };
  if (a.kind !== "answer") return { kind: "retry" };
  const body = isRecord(a.body) ? a.body : null;
  const code = typeof body?.code === "string" ? body.code : null;
  if (
    a.status === 200 &&
    body?.ok === true &&
    typeof body.token === "string" &&
    typeof body.workerUrl === "string"
  ) {
    const num = (v: unknown, d: number) =>
      typeof v === "number" && Number.isFinite(v) ? v : d;
    return {
      kind: "ok",
      mint: {
        token: body.token,
        workerUrl: body.workerUrl,
        checkUrl: typeof body.checkUrl === "string" ? body.checkUrl : undefined,
        part: num(body.part, 1),
        parts: num(body.parts, 1),
        next: typeof body.next === "string" ? body.next : null,
        items: num(body.items, 0),
        jti:
          typeof body.jti === "string" && JTI_RE.test(body.jti)
            ? body.jti
            : undefined,
        reports: body.reports === true,
      },
    };
  }
  if (a.status >= 500 && !(code && SETTLED.has(code))) return { kind: "retry" };
  // A 200 without its token is a proxy's page, not the app: try again.
  if (a.status === 200) return { kind: "retry" };
  return {
    kind: "refused",
    code,
    message: typeof body?.message === "string" ? body.message : null,
  };
}

/** What the Worker's check said about a zip. */
export type CheckAnswer = {
  items: number;
  found: number;
  missing: string[];
  /** The Worker will report this zip's stream (`export-ends`); an older Worker never says so. */
  reports?: boolean;
};

export type CheckVerdict =
  | { kind: "ok"; check: CheckAnswer }
  | { kind: "retry" }
  /** It refused the token (paused, or a token it would not stream): never post the form. */
  | { kind: "refused"; reason: "paused" | "forbidden" }
  /** It could not say (an older Worker, R2 down): the zip goes ahead, uncounted, as it used to. */
  | { kind: "skip" }
  | { kind: "cancelled" };

/**
 * What one check try means. ★ A CHECK THAT CANNOT ANSWER NEVER STOPS A DOWNLOAD: an older Worker
 * (no `/check`, so the browser's fetch fails on CORS) and an R2 hiccup both fall through to the zip,
 * exactly as it went before the check existed. Only a Worker that says it would refuse the zip
 * stops it, because posting then would replace the album with its bare refusal.
 */
export function checkVerdict(a: Attempt): CheckVerdict {
  if (a.kind === "cancelled") return { kind: "cancelled" };
  if (a.kind !== "answer") return { kind: "retry" };
  const body = isRecord(a.body) ? a.body : null;
  if (
    a.status === 200 &&
    body?.ok === true &&
    typeof body.items === "number" &&
    typeof body.found === "number" &&
    Array.isArray(body.missing)
  ) {
    return {
      kind: "ok",
      check: {
        items: body.items,
        found: body.found,
        missing: body.missing.filter((m): m is string => typeof m === "string"),
        reports: body.reports === true,
      },
    };
  }
  if (body?.ok === false && body.reason === "paused") {
    return { kind: "refused", reason: "paused" };
  }
  if (
    body?.ok === false &&
    (body.reason === "forbidden" || body.reason === "bad_request")
  ) {
    return { kind: "refused", reason: "forbidden" };
  }
  if (a.status >= 500) return { kind: "retry" };
  return { kind: "skip" };
}

/* ── the Worker's word on a zip it streamed (`export-ends`) ──────────────── */

/**
 * ★ SAVED IS THE WORKER'S WORD, NEVER THE PAGE'S GUESS. The page goes blind when the browser's download
 * manager takes a zip, so a zip reads saved only once the Worker reports its stream finished (`/api/export/
 * report` keeps it, `/api/export/status` answers it). The walk listens only where both halves said they
 * would (the mint asked for reports and the Worker's check promised them); anywhere else, and once it stops
 * listening, it says what it knows and claims nothing.
 */
export type StreamOutcome = "saved" | "short" | "stopped" | "failed" | "empty";

export type StreamState =
  /** Nothing heard yet (or no such export). */
  | { state: "none" }
  /** The zip's first file is on its way. */
  | { state: "streaming" }
  /** How it ended, and the media ids the zip does not hold whole. */
  | { state: StreamOutcome; missing: string[] };

const OUTCOMES: readonly StreamOutcome[] = [
  "saved",
  "short",
  "stopped",
  "failed",
  "empty",
];

/** The export's row (as `queries/exports.ts` reads it), as the walk hears it. */
export function streamStateOf(
  word: {
    streamStartedAt: string | null;
    streamEndedAt: string | null;
    streamOutcome: string | null;
    streamMissing: string[];
  } | null,
): StreamState {
  if (!word) return { state: "none" };
  const outcome = OUTCOMES.find((o) => o === word.streamOutcome);
  if (word.streamEndedAt && outcome) {
    return { state: outcome, missing: [...word.streamMissing] };
  }
  return word.streamStartedAt ? { state: "streaming" } : { state: "none" };
}

/** One status poll's meaning: the state, or null for no answer (the next tick asks again). */
export function statusVerdict(a: Attempt): StreamState | null {
  if (a.kind !== "answer" || a.status !== 200) return null;
  const body = isRecord(a.body) ? a.body : null;
  if (body?.ok !== true) return null;
  if (body.state === "none" || body.state === "streaming") {
    return { state: body.state };
  }
  const outcome = OUTCOMES.find((o) => o === body.state);
  if (!outcome || !Array.isArray(body.missing)) return null;
  return {
    state: outcome,
    missing: body.missing.filter((m): m is string => typeof m === "string"),
  };
}

/**
 * How long the walk waits for a stream to BEGIN: the Worker says so within a second or two of the file's
 * POST, so silence this long means its word cannot reach this app, and the walk stops listening.
 */
export const START_HEARD_MS = 15_000;

/** The longest the walk listens for a zip to END: a 20 GB part over a slow line, with time to spare. */
export const WATCH_MAX_MS = 6 * 60 * 60 * 1000;

/** One status poll's own ceiling. */
export const STATUS_TRY_MS = 8_000;

/**
 * The pause before each status poll, by how long the walk has listened: every second while a zip begins
 * (a small one ends in that time too), then backing off to every ten seconds for a long one, so an hour's
 * download asks a few hundred times rather than thousands.
 */
export function watchPauseMs(listenedMs: number): number {
  if (listenedMs < 15_000) return 1_000;
  if (listenedMs < 60_000) return 2_000;
  if (listenedMs < 5 * 60_000) return 5_000;
  return 10_000;
}

/* ── where the file lands ─────────────────────────────────────────────────── */

/**
 * WHERE THIS DEVICE KEEPS A DOWNLOAD (`export-flow` r1, `phone`, Will: Download all "can be catered
 * toward the best big download path(s), like saving directly to files"; a single photo keeps the
 * viewer's Save to Photos). An iPhone or iPad saves a zip to the Files app, an Android phone to its
 * Downloads; a desk needs no telling. The platform is the viewer's own reading of it
 * (`share-save.ts`' `detectPlatform`), so the two saves never disagree about which phone this is.
 */
export type DownloadPlace = "files" | "downloads" | "desk";

export function downloadPlaceFor(platform: Platform): DownloadPlace {
  return platform === "ios"
    ? "files"
    : platform === "android"
      ? "downloads"
      : "desk";
}

/* ── the words ────────────────────────────────────────────────────────────── */

/**
 * THE ONE LINE AN EMPTY ZIP IS REFUSED IN (`hollow=refuse`, Will: "Copy should be cleaner and 1
 * line"): short enough for one line at 375 beside its Try again. Said by the mint when nothing is
 * left to zip and by the walk when the Worker finds nothing there: the album changed after its
 * menu counted it, which "left" says without a second clause.
 */
export const EMPTY_EXPORT_MESSAGE = "Nothing left to download.";

export const WALK_COPY = {
  preparing: "Preparing your download…",
  preparingPart: (part: number, parts: number) =>
    `Preparing part ${part} of ${parts}…`,
  /** One zip, handed over, said where this device keeps it. */
  started: (place: DownloadPlace) =>
    place === "files"
      ? "Saving to your Files app."
      : place === "downloads"
        ? "Saving to your Downloads."
        : "Your download is starting.",
  /** Between parts: this one is on its way, and the next is a tap. */
  partStarted: (part: number, parts: number) =>
    `Part ${part} of ${parts} is downloading.`,
  /**
   * The next part's button: "Get part 2", short enough that the part's line beside it stays one line
   * at 375 and at a desk (measured on the toaster's own font; "Download part 2" wraps both).
   */
  nextPart: (part: number) => `Get part ${part}`,
  /**
   * The walk's last word: every part is on its way, and that is the whole of it. "That's everything."
   * is held together (a no-break space), so where the line runs out at 375 it moves down whole
   * instead of leaving "That's" behind.
   */
  allStarted: (parts: number) =>
    parts === 2
      ? "Both parts are downloading. That's\u00a0everything."
      : `All ${parts} parts are downloading. That's\u00a0everything.`,
  /**
   * One zip on its way, while the walk listens for the Worker's word on it (`export-ends`): where this
   * device keeps it, as it happens.
   */
  downloading: (place: DownloadPlace) =>
    place === "files"
      ? "Saving to your Files app…"
      : place === "downloads"
        ? "Saving to your Downloads…"
        : "Downloading…",
  /** One zip, every byte of it out of the Worker: said where it is now. */
  saved: (place: DownloadPlace) =>
    place === "files"
      ? "Saved to your Files app."
      : place === "downloads"
        ? "Saved to your Downloads."
        : "Your download is saved.",
  /** Between parts, the part before the tap: the Worker finished it. */
  partSaved: (part: number, parts: number) =>
    `Part ${part} of ${parts} is saved.`,
  /** Between parts, a part the album thinned while it streamed: the count, `short`'s register. */
  partShort: (found: number, items: number, part: number) =>
    `${formatCount(found)} of ${formatCount(items)} are in part ${part}.`,
  /** Between parts, a part that never finished (she stopped it, or the line or a read broke it). */
  partStopped: (part: number, parts: number) =>
    `Part ${part} of ${parts} didn't finish.`,
  /** Between parts, a part the album emptied after its check: nothing was sent. */
  partEmpty: (part: number, parts: number) =>
    `Part ${part} of ${parts} had nothing left to download.`,
  /** The walk's last word, every part saved by the Worker's own word. */
  allSaved: (parts: number) =>
    parts === 2
      ? "Both parts are saved. That's\u00a0everything."
      : `All ${parts} parts are saved. That's\u00a0everything.`,
  /**
   * One zip that never finished and nobody stopped it: a read broke (the Worker's `failed`), so it is ours, and
   * said plainly. One line beside its Try again at 375 and at a desk, as the hollow zip's is ("stopped before it
   * finished" ran two).
   */
  stopped: "That download didn't finish.",
  /**
   * ★ THE TWO ENDINGS THAT USED TO READ AS ONE (E6). A cancel: neutral, a way back. A dropped connection: said as
   * what it is, with what to do, so she does not try again on a line that cannot carry it, nor blame the app.
   */
  cancelled: "Download cancelled.",
  dropped: "Your connection dropped.",
  droppedDetail: "Check your signal, then try again.",
  /** A part of a walk that ended without all of it, told apart the same way. */
  partCancelled: (part: number, parts: number) =>
    `Part ${part} of ${parts} was cancelled.`,
  partDropped: (part: number, parts: number) =>
    `Part ${part} of ${parts} stopped: your connection dropped.`,
  /** While a zip streams and her own line has stopped answering: the walk goes on listening, and says so. */
  lost: "Your connection dropped. Check your signal.",
  /**
   * ★ THE x, ASKED BEFORE IT IS BELIEVED (E6: "a cancel is intentional"). Only where something is in flight: while
   * the zip is prepared, and between parts, where stopping leaves the rest of the album behind.
   */
  askCancel: "Cancel this download?",
  keepGoing: "Keep going",
  askStop: (part: number, parts: number) =>
    `Stop after part ${part} of ${parts}?`,
  /** What stopping leaves: "Part 3", "Parts 2 and 3", "Parts 2 to 4": a walk's own words, never "zips". */
  askStopDetail: (next: number, parts: number) =>
    `${partsLeft(next, parts)} won't download.`,
  stopHere: "Stop here",
  /** After a confirmed stop between parts: where she stopped, and the tap that takes the next part. */
  stoppedAfter: (part: number, parts: number) =>
    `Stopped after part ${part} of ${parts}.`,
  /** A host's selection that mixes hidden and shown items asks first (`export-ends`). */
  hiddenAsk: (hidden: number, total: number) =>
    hidden === 1
      ? `1 of these ${formatCount(total)} is hidden.`
      : `${formatCount(hidden)} of these ${formatCount(total)} are hidden.`,
  includeHidden: (hidden: number) =>
    hidden === 1 ? "Include it" : "Include them",
  leaveHidden: (hidden: number) =>
    hidden === 1 ? "Leave it out" : "Leave them out",
  /** A walk whose later parts the album emptied meanwhile: what was taken is all there is. */
  everything: "That's everything.",
  /** A short zip, `failed=exact`'s register: the count first, then the act. */
  short: (found: number, items: number) =>
    `${formatCount(found)} of ${formatCount(items)} are in your download.`,
  retryMissing: (n: number) =>
    n === 1 ? "Try again for the 1" : `Try again for the ${formatCount(n)}`,
  preparingMissing: (n: number) =>
    n === 1 ? "Preparing the 1…" : `Preparing the ${formatCount(n)}…`,
  /** The missing ones, asked again, were not in the album any more. */
  missingGone: (n: number) =>
    n === 1
      ? "That one isn't in the album anymore."
      : `Those ${formatCount(n)} aren't in the album anymore.`,
  /** Still in the album, and their files still not there: said plainly, with no promise. */
  missingUnreachable: (n: number) =>
    n === 1
      ? "That one couldn't be downloaded."
      : `Those ${formatCount(n)} couldn't be downloaded.`,
  failed: "Couldn't start that download.",
  paused: "Downloads are paused right now. Please try again later.",
  tryAgain: "Try again",
  /** The x's names, by what it does in each state. */
  cancel: "Cancel download",
  stop: "Stop after this part",
  dismiss: "Dismiss",
} as const;

/** The parts a stop leaves behind, in a walk's own words: "Part 3", "Parts 2 and 3", "Parts 2 to 4". */
export function partsLeft(next: number, parts: number): string {
  if (next >= parts) return `Part ${parts}`;
  return parts - next === 1
    ? `Parts ${next} and ${parts}`
    : `Parts ${next} to ${parts}`;
}

/**
 * How long a finished walk's words stay: one zip reads at a glance, a walk's last word a little longer. A cancel she
 * just made stays long enough to read and to take its Try again, and goes by itself (she meant it).
 */
export const DONE_MS = { one: 4000, walk: 7000, cancelled: 8000 } as const;
