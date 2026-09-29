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
 */
import { formatCount } from "@/lib/format/count";
import type { Platform } from "@/lib/media/share-save";

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
export type CheckAnswer = { items: number; found: number; missing: string[] };

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

/** How long a finished walk's words stay: one zip reads at a glance, a walk's last word a little longer. */
export const DONE_MS = { one: 4000, walk: 7000 } as const;
