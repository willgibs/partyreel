/**
 * THE DOWNLOAD'S ONE ENGINE: from a tapped row to a file in the browser's hands, said in one toast
 * (`export-flow` r1; the rules and every word are `lib/export/walk.ts`).
 *
 *   tap → the toast: Preparing your download… [x]
 *       → (a host's selection that mixes hidden and shown items asks first, in the toast)
 *       → mint (the app authorizes and signs; two quiet re-attempts on a dropped request)
 *       → check (the Worker says what the zip would hold; `workers/export/src/check.ts`)
 *       → post (a top-level form: the browser's download manager takes the stream)
 *       → listen (the Worker's word on the stream, `/api/export/status`), and say it: saved, short, stopped
 *       → the toast says what happened, and what to do next when there is a next
 *
 * ★ THE APP GOES BLIND AT THE POST, SO EVERYTHING WORTH SAYING IS LEARNED BEFORE IT, OR FROM THE WORKER
 * AFTER IT. The form's answer can never be read (and a refusal there would replace the page), so the
 * Worker is asked first, in a fetch that can be: an empty zip is refused in one line and never sent, a
 * short one is counted with a Try again for exactly what it missed, and a token the Worker would refuse is
 * said here. A check that cannot answer (a Worker from before it, R2 down) never stops the zip. After the
 * post the Worker reports its stream to the app (`export-ends`), so the walk listens: a zip reads SAVED
 * only once the Worker says its last byte went out, one the album emptied after its check was never sent
 * (the Worker's 204) and is said, and one it could not finish is said with a Try again. Where the Worker's
 * word cannot come (an older Worker, a laptop it cannot reach), the walk says what it knows and claims
 * nothing; it stops listening once the stream has been silent past its start (`START_HEARD_MS`).
 *
 * ★ EVERY WAIT CAN BE LEFT (Will: "Interruptibility is a huge win in UX"). The x on the right ends
 * whatever is in flight: the mint's or the check's fetch is aborted (the Worker stops reading when
 * its client leaves), the listening stops, the toast goes, and nothing is posted afterwards, whatever
 * arrives late. A file already handed to the browser is the browser's to cancel.
 *
 * ★ A BIG ALBUM IS A WALK, ONE TAP A PART. Each part is minted when it is asked for (a token lives
 * two minutes), and each is a download a person pressed, because a browser holds back a second
 * download a page starts on its own. The walk's position is the server's cursor, so nothing is
 * taken twice or missed while the album moves. Each part's line turns from downloading to saved as
 * the Worker finishes it, and the walk's last word waits for every part ("All 3 parts are saved.
 * That's everything.": Will's "Would hate for someone to think they downloaded everything then delete
 * the event not knowing").
 *
 * ★ AND A RELOAD OFFERS WHAT IT LEFT AGAIN (crumbs-32, from `export-wiring`'s deferred). A walk lives in
 * the page, so a reload (a phone's browser drops a tab it left for the Files app) forgot it, and with it
 * where the next part starts. Between parts, and while its last parts still download, a walk keeps its
 * cursor, its counts and its parts' words in the tab's own store (`deps.store`: sessionStorage in the
 * page), and the page's next walker offers the same "Get part N" again, or goes on listening (`resume`);
 * every way a walk ends (its last word, the x) lets it go. Nothing is posted on a resume.
 *
 * The engine owns no React: it drives a toast through `ToastPort`, fetches through `deps.fetch` and
 * posts through `deps.post`, so its tests stand in for all three (export-walk.test.ts), and a
 * Download menu that closes or a page that navigates cannot orphan a walk mid-way.
 */
import {
  EXPORT_CURSOR_RE,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import {
  type Attempt,
  CHECK_TRIES_MS,
  type CheckAnswer,
  type CheckVerdict,
  checkVerdict,
  DONE_MS,
  type DownloadPlace,
  EMPTY_EXPORT_MESSAGE,
  LINE_LOST_AFTER,
  lineFailed,
  MINT_TRIES_MS,
  type MintAnswer,
  mintVerdict,
  RETRY_PAUSE_MS,
  START_HEARD_MS,
  STATUS_TRY_MS,
  type StreamOutcome,
  type StreamState,
  statusVerdict,
  SUMMARY_TRIES_MS,
  WALK_COPY,
  WATCH_MAX_MS,
  watchPauseMs,
} from "@/lib/export/walk";

export type ExportScope = "host" | "guest";

/** What the caller asks for: the album (and, for a host, its filters or a selection). */
export type MintBody = Record<string, unknown>;

export type ToastAction = { label: string; run: () => void };

/**
 * The toast's states. Every one but `done` stays until it is answered, and carries the x (its label
 * says what it does there: cancel, stop, dismiss).
 */
export type ToastView =
  /** Preparing: a spinner, and the x that cancels (which asks first: `confirm`). */
  | { tone: "wait"; title: string; close: ToastAction }
  /** A host's selection holds hidden items among shown ones: include them, or leave them out? */
  | { tone: "ask"; title: string; actions: ToastAction[]; close: ToastAction }
  /**
   * The x was pressed while something is in flight (E6: a cancel is intentional): one question, its two answers,
   * and nothing handed over while it stands. Keep going first, since it is what an unintended press means.
   */
  | { tone: "confirm"; title: string; detail?: string; actions: ToastAction[] }
  /** A part is on its way (or saved) and the next is a tap. */
  | {
      tone: "between";
      title: string;
      detail?: string;
      action: ToastAction;
      close: ToastAction;
    }
  /** Handed over; the Worker's word on it has not come yet. */
  | { tone: "downloading"; title: string; detail?: string; close: ToastAction }
  /** Handed over, all of it. */
  | { tone: "done"; title: string; duration: number }
  /** Handed over, short: the count, and a Try again for what it missed. */
  | {
      tone: "short";
      title: string;
      detail?: string;
      action?: ToastAction;
      close: ToastAction;
    }
  /** Cancelled, by her: neutral, never an error, with the way back where there is one. */
  | {
      tone: "cancelled";
      title: string;
      action?: ToastAction;
      close: ToastAction;
      /** How long it stays: ms, or Infinity for one the Worker reported after the fact. */
      duration: number;
    }
  /** Nothing was handed over (or nothing whole), and why. */
  | {
      tone: "refused";
      title: string;
      /** What to do about it, where there is something to do (a dropped connection's). */
      detail?: string;
      action?: ToastAction;
      close: ToastAction;
    };

export type ToastPort = {
  show(id: string, view: ToastView): void;
  dismiss(id: string): void;
};

export type WalkDeps = {
  fetch: typeof fetch;
  /** Hand a signed token to the Worker as a top-level form POST (the browser downloads it). */
  post: (workerUrl: string, token: string) => void;
  toast: ToastPort;
  /** Where this device keeps a download, read when a walk ends. */
  place: () => DownloadPlace;
  /** Whether the browser says it is online, read when a try fails (`navigator.onLine`); absent reads as online. */
  online?: () => boolean;
  sleep: (ms: number) => Promise<void>;
  newId: () => string;
  /** Where a walk between parts is kept for the page's next life (the head's reload note). */
  store?: WalkStore;
};

/** The status route the walk listens to (`api/export/status`). */
export const STATUS_URL = "/api/export/status";

/**
 * ONE PART HANDED TO THE BROWSER, and what the Worker said of it (`export-ends`): `listening` while the walk
 * waits for its word, `saved` once every byte went out, `ended` when it ended without all of them (its
 * outcome, and the ids its zip lacks), `unheard` when no word can come.
 */
export type HandedPart = {
  part: number;
  /** How many items its zip was counted to hold (the Worker's check, or the mint's own count). */
  items: number;
  /** The token's nonce, while the walk listens for the Worker's word on it. */
  jti: string | null;
  word: "listening" | "saved" | "ended" | "unheard";
  outcome: StreamOutcome | null;
  missing: string[];
  /**
   * The page's own line failed while this zip streamed (a status poll never reached the app): what tells a
   * `stopped` zip that the connection dropped from one that was cancelled (the Worker sees only that the client
   * left). Absent from a walk an older build kept: then nothing is claimed either way.
   */
  dropped?: boolean;
};

/**
 * A WALK AS A RELOAD FINDS IT: what it asked for, the part last handed over, where the next one starts
 * (the server's cursor; null once every part is taken and only the Worker's word is awaited), the counts
 * its last word is made of, and each handed part's word.
 */
export type SavedWalk = {
  scope: ExportScope;
  body: MintBody;
  retryOf: number | null;
  /** The part last handed over; the next tap takes the one after it. */
  part: number;
  parts: number;
  next: string | null;
  items: number;
  found: number;
  missing: string[];
  handed: number;
  /** Absent from a walk an older build kept: its parts' words are then unknown, and nothing is claimed. */
  handedParts?: HandedPart[];
};

/** The tab's own store of walks between parts: read once by `resume`, written whole on every change. */
export type WalkStore = {
  load(): unknown;
  save(walks: SavedWalk[]): void;
};

const isCount = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;

const JTI_RE = /^[0-9a-f]{32}$/;
const WORDS = new Set(["listening", "saved", "ended", "unheard"]);
const OUTCOMES = new Set(["saved", "short", "stopped", "failed", "empty"]);

function readHandedPart(v: unknown): HandedPart | null {
  if (typeof v !== "object" || v === null) return null;
  const p = v as Record<string, unknown>;
  const ok =
    isCount(p.part) &&
    p.part >= 1 &&
    isCount(p.items) &&
    (p.jti === null || (typeof p.jti === "string" && JTI_RE.test(p.jti))) &&
    typeof p.word === "string" &&
    WORDS.has(p.word) &&
    (p.word !== "listening" || p.jti !== null) &&
    (p.outcome === null ||
      (typeof p.outcome === "string" && OUTCOMES.has(p.outcome))) &&
    Array.isArray(p.missing) &&
    p.missing.every((m) => typeof m === "string") &&
    (p.dropped === undefined || typeof p.dropped === "boolean");
  return ok ? (p as HandedPart) : null;
}

/**
 * What a store holds, read as walks: anything that is not one (another build's shape, a hand edit,
 * a cursor no server would take) is dropped, never offered.
 */
export function readSavedWalks(raw: unknown): SavedWalk[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((w: unknown): SavedWalk[] => {
    if (typeof w !== "object" || w === null) return [];
    const s = w as Record<string, unknown>;
    const parts =
      s.handedParts === undefined
        ? undefined
        : Array.isArray(s.handedParts)
          ? s.handedParts.map(readHandedPart)
          : [null];
    const partsOk = parts === undefined || parts.every((p) => p !== null);
    // Between parts: a cursor a server would take. Every part taken: only a walk still listening.
    const positionOk =
      typeof s.next === "string"
        ? EXPORT_CURSOR_RE.test(s.next) &&
          isCount(s.parts) &&
          isCount(s.part) &&
          s.parts > s.part
        : s.next === null &&
          !!parts &&
          parts.some((p) => p?.word === "listening");
    const ok =
      (s.scope === "host" || s.scope === "guest") &&
      typeof s.body === "object" &&
      s.body !== null &&
      !Array.isArray(s.body) &&
      (s.retryOf === null || isCount(s.retryOf)) &&
      isCount(s.part) &&
      s.part >= 1 &&
      isCount(s.parts) &&
      positionOk &&
      isCount(s.items) &&
      isCount(s.found) &&
      Array.isArray(s.missing) &&
      s.missing.every((m) => typeof m === "string") &&
      isCount(s.handed) &&
      partsOk;
    return ok
      ? [
          {
            ...(s as SavedWalk),
            handedParts: parts as HandedPart[] | undefined,
          },
        ]
      : [];
  });
}

type Walk = {
  id: string;
  scope: ExportScope;
  body: MintBody;
  /** A walk that takes a zip's missed ones: how many it went back for. */
  retryOf: number | null;
  part: number;
  /** How many parts, once the first mint has said. */
  parts: number | null;
  after: string | null;
  /** What every part handed over held, and what the Worker found of it. */
  items: number;
  found: number;
  missing: string[];
  /** How many files the browser was handed, and whether she was ever walked between parts. */
  handed: number;
  walked: boolean;
  /** Every part handed over, and the Worker's word on each (`export-ends`). */
  handedParts: HandedPart[];
  /** The hidden question was asked, or needed none: a restart never asks it twice. */
  asked: boolean;
  /** Every part is taken: the last word waits only on the Worker. */
  done: boolean;
  /** Where the next part starts while the walk is between parts (the toast's "Get part N"). */
  waiting: { next: string; parts: number } | null;
  controller: AbortController;
  /** Every status poll's signal: aborted when the walk ends, so nothing listens after. */
  listening: AbortController;
  /** A part is being taken: a second tap on Try again or Get part N waits its turn. */
  busy: boolean;
  /** Ended (cancelled, dismissed or finished): nothing more is said or posted. */
  over: boolean;
  /**
   * THE x'S QUESTION STANDS (E6: a cancel asks first): which state it was pressed in. While it stands over a part
   * being prepared nothing is handed to the browser (`holdWhileAsked`), and between parts the Worker's word on an
   * earlier part is kept for after her answer, never drawn over it.
   */
  asking: "wait" | "between" | null;
  /** The post waits on these while the question stands. */
  released: (() => void)[];
  /** She cancelled the part in flight: what its aborted work was about to do is not done. */
  cancelled: boolean;
  /** She stopped between parts: the toast says where, and keeps the tap that takes the next. */
  stopped: boolean;
  /** Her own line has stopped answering while a zip streams (`LINE_LOST_AFTER` polls in a row). */
  lineLost: boolean;
};

/** One try of one request, with its own ceiling, abandoned the moment the walk is cancelled. */
async function attempt(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  ceilingMs: number,
  walk: AbortSignal,
): Promise<Attempt> {
  if (walk.aborted) return { kind: "cancelled" };
  const request = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    request.abort();
  }, ceilingMs);
  const leave = () => request.abort();
  walk.addEventListener("abort", leave);
  try {
    const res = await fetchFn(url, { ...init, signal: request.signal });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (walk.aborted) return { kind: "cancelled" };
    if (timedOut) return { kind: "timeout" };
    return { kind: "answer", status: res.status, body };
  } catch {
    if (walk.aborted) return { kind: "cancelled" };
    return timedOut ? { kind: "timeout" } : { kind: "network" };
  } finally {
    clearTimeout(timer);
    walk.removeEventListener("abort", leave);
  }
}

type MintOutcome =
  | { kind: "ok"; mint: MintAnswer }
  | { kind: "refused"; code: string | null; message: string | null }
  /** Every try failed; `line` when it was for want of a connection (a request that never reached the app). */
  | { kind: "failed"; line: boolean }
  | { kind: "cancelled" };

const JSON_POST = {
  method: "POST",
  headers: { "content-type": "application/json" },
} as const;

/** The summary's buckets, summed: how many of a selection are hidden, and how many shown. */
function hiddenMixOf(body: unknown): { hidden: number; shown: number } | null {
  const b = body as {
    ok?: unknown;
    summary?: {
      shown?: { photo?: { count?: unknown }; video?: { count?: unknown } };
      hidden?: { photo?: { count?: unknown }; video?: { count?: unknown } };
    };
  } | null;
  if (b?.ok !== true || !b.summary) return null;
  const n = (v: unknown) => (isCount(v) ? v : 0);
  const { shown, hidden } = b.summary;
  return {
    shown: n(shown?.photo?.count) + n(shown?.video?.count),
    hidden: n(hidden?.photo?.count) + n(hidden?.video?.count),
  };
}

export function createExportWalker(deps: WalkDeps) {
  const online = () => deps.online?.() ?? true;

  /** The question is over (answered, or the walk said something that replaces it): whatever waited on it goes on. */
  const release = (w: Walk) => {
    w.asking = null;
    for (const resolve of w.released.splice(0)) resolve();
  };

  const show = (w: Walk, view: ToastView) => {
    if (w.over) return;
    // A question between parts stands over the Worker's word on an earlier part (kept, said after her answer).
    if (w.asking === "between") return;
    // Anything else the walk says (an ending, a new state) is past the question.
    release(w);
    deps.toast.show(w.id, view);
  };

  /* ── the walks a reload finds, as the tab keeps them for its next page (the head's reload note) ── */
  const kept = new Map<string, SavedWalk>();
  const save = () => deps.store?.save([...kept.values()]);
  /**
   * Between parts (the cursor the next one starts from) or with every part taken and its last parts
   * still downloading (`next: null`): what the next page needs, kept until the walk ends.
   */
  const keep = (w: Walk) => {
    // A walk she stopped is hers to take up again on this page only: a reload never offers it back.
    if (w.stopped) return;
    const at = w.waiting;
    if (!at && !w.done) return;
    kept.set(w.id, {
      scope: w.scope,
      body: w.body,
      retryOf: w.retryOf,
      part: w.part,
      parts: at ? at.parts : (w.parts ?? w.part),
      next: at ? at.next : null,
      items: w.items,
      found: w.found,
      missing: [...w.missing],
      handed: w.handed,
      handedParts: w.handedParts.map((p) => ({
        ...p,
        missing: [...p.missing],
      })),
    });
    save();
  };
  /** The walk ended, whichever way: nothing of it is offered again. */
  const letGo = (w: Walk) => {
    if (kept.delete(w.id)) save();
  };

  /** The x, and every way a walk is put down: nothing in flight survives it. */
  const end = (w: Walk) => {
    if (w.over) return;
    w.over = true;
    w.controller.abort();
    w.listening.abort();
    release(w);
    letGo(w);
    deps.toast.dismiss(w.id);
  };

  const closeAs = (w: Walk, label: string): ToastAction => ({
    label,
    run: () => end(w),
  });

  /** The part before the tap, said as the Worker last said it. */
  function betweenTitle(w: Walk, parts: number): string {
    const latest = w.handedParts.at(-1);
    if (latest && latest.part === w.part) {
      if (latest.word === "saved") return WALK_COPY.partSaved(w.part, parts);
      if (latest.word === "ended") {
        if (latest.outcome === "short") {
          const found = Math.max(0, latest.items - latest.missing.length);
          return WALK_COPY.partShort(found, latest.items, w.part);
        }
        if (latest.outcome === "empty")
          return WALK_COPY.partEmpty(w.part, parts);
        // The Worker saw the client leave: her line, if the page's own failed while it streamed; her, if it
        // did not; neither claimed for a walk that never said (an older build's).
        if (latest.outcome === "stopped" && latest.dropped === true) {
          return WALK_COPY.partDropped(w.part, parts);
        }
        if (latest.outcome === "stopped" && latest.dropped === false) {
          return WALK_COPY.partCancelled(w.part, parts);
        }
        return WALK_COPY.partStopped(w.part, parts);
      }
    }
    return WALK_COPY.partStarted(w.part, parts);
  }

  /**
   * A part is on its way and the next is a tap: said, and kept, so a reload offers the same tap again.
   * The button reads the cursor it was drawn with, never the walk's, so an old toast's tap is its own.
   */
  function between(w: Walk, next: string, parts: number) {
    w.walked = true;
    w.stopped = false;
    w.waiting = { next, parts };
    keep(w);
    showBetween(w);
  }

  function showBetween(w: Walk) {
    const at = w.waiting;
    if (!at) return;
    const nextPart = w.part + 1;
    const { next, parts } = at;
    show(w, {
      tone: "between",
      // Where she stopped, once she has (E6): said, never a silent end ("would hate for someone to think they
      // downloaded everything"), with the tap that takes the rest still here.
      title: w.stopped
        ? WALK_COPY.stoppedAfter(w.part, parts)
        : betweenTitle(w, parts),
      detail: w.lineLost ? WALK_COPY.lost : undefined,
      action: {
        label: WALK_COPY.nextPart(nextPart),
        run: () => {
          // A second tap on the same button, before its toast has turned, takes nothing twice.
          if (w.over || w.busy || w.part >= nextPart) return;
          w.part = nextPart;
          w.after = next;
          w.waiting = null;
          w.stopped = false;
          void takePart(w);
        },
      },
      // A stop asks first; once stopped, the x only puts the toast away.
      close: w.stopped
        ? closeAs(w, WALK_COPY.dismiss)
        : { label: WALK_COPY.stop, run: () => askToStop(w) },
    });
  }

  /** The toast of a part being prepared, as the walk stands (also what Keep going puts back). */
  function showWait(w: Walk) {
    show(w, {
      tone: "wait",
      title:
        w.retryOf !== null
          ? WALK_COPY.preparingMissing(w.retryOf)
          : w.parts !== null && w.parts > 1
            ? WALK_COPY.preparingPart(w.part, w.parts)
            : WALK_COPY.preparing,
      close: { label: WALK_COPY.cancel, run: () => askToCancel(w) },
    });
  }

  /* ── the x asks first (E6: a cancel is intentional) ─────────────────────── */

  /** Keep going: the question is withdrawn and the walk is drawn as it stands. */
  function keepGoing(w: Walk) {
    if (w.over || !w.asking) return;
    const was = w.asking;
    release(w);
    if (was === "between") showBetween(w);
    else showWait(w);
  }

  /**
   * The x of a part being prepared. The mint and the check go on meanwhile (cheap, and what Keep going wants), but
   * nothing is handed to the browser until she answers (`holdWhileAsked`), so the question is never asked of a
   * download that has already begun.
   */
  function askToCancel(w: Walk) {
    if (w.over || w.asking) return;
    w.asking = "wait";
    deps.toast.show(w.id, {
      tone: "confirm",
      title: WALK_COPY.askCancel,
      actions: [
        { label: WALK_COPY.keepGoing, run: () => keepGoing(w) },
        { label: WALK_COPY.cancel, run: () => cancelPart(w) },
      ],
    });
  }

  /** The x between parts: stopping leaves the rest of the album behind, so it says so before it does. */
  function askToStop(w: Walk) {
    const at = w.waiting;
    if (w.over || w.asking || !at) return;
    w.asking = "between";
    deps.toast.show(w.id, {
      tone: "confirm",
      title: WALK_COPY.askStop(w.part, at.parts),
      detail: WALK_COPY.askStopDetail(w.part + 1, at.parts),
      actions: [
        { label: WALK_COPY.keepGoing, run: () => keepGoing(w) },
        { label: WALK_COPY.stopHere, run: () => stopHere(w) },
      ],
    });
  }

  /** Stop here, confirmed: the walk stays, the toast says where she stopped, and Get part N is still the way on. */
  function stopHere(w: Walk) {
    if (w.over || w.asking !== "between") return;
    release(w);
    w.stopped = true;
    letGo(w);
    showBetween(w);
  }

  /**
   * Cancel, confirmed, while a part is being prepared. Whatever was in flight is abandoned and nothing is handed
   * over. A first part is the whole download: the walk ends and the toast says it was cancelled, with Try again
   * (the download again, from its start). A later part leaves the parts before it hers: the walk goes back to
   * where it stood, stopped, with Get part N to take it again.
   */
  function cancelPart(w: Walk) {
    if (w.over || w.asking !== "wait") return;
    release(w);
    w.cancelled = true;
    w.controller.abort();
    if (w.part > 1 && w.after !== null && w.parts !== null) {
      w.part -= 1;
      w.waiting = { next: w.after, parts: w.parts };
      w.stopped = true;
      letGo(w);
      showBetween(w);
      return;
    }
    w.over = true;
    w.listening.abort();
    letGo(w);
    deps.toast.show(w.id, {
      tone: "cancelled",
      title: WALK_COPY.cancelled,
      action: {
        label: WALK_COPY.tryAgain,
        run: () => {
          deps.toast.dismiss(w.id);
          void begin(w.scope, w.body, w.retryOf, true);
        },
      },
      close: { label: WALK_COPY.dismiss, run: () => deps.toast.dismiss(w.id) },
      duration: DONE_MS.cancelled,
    });
  }

  /** Nothing is handed to the browser while her question stands over a part being prepared. */
  async function holdWhileAsked(w: Walk) {
    while (w.asking === "wait" && !w.over) {
      await new Promise<void>((resolve) => w.released.push(resolve));
    }
  }

  async function mint(w: Walk): Promise<MintOutcome> {
    const body = JSON.stringify({
      step: "mint",
      ...w.body,
      part: w.part,
      ...(w.after ? { after: w.after } : {}),
    });
    let last: Attempt | null = null;
    for (let i = 0; i < MINT_TRIES_MS.length; i++) {
      if (i > 0) {
        await deps.sleep(RETRY_PAUSE_MS[i - 1]);
        if (w.over) return { kind: "cancelled" };
      }
      const tried = await attempt(
        deps.fetch,
        `/api/export/${w.scope}`,
        { ...JSON_POST, body },
        MINT_TRIES_MS[i],
        w.controller.signal,
      );
      last = tried;
      const verdict = mintVerdict(tried);
      if (verdict.kind !== "retry") return verdict;
      // Offline by the browser's own word: another try can only fail the same way, so it is said now.
      if (tried.kind === "network" && !online()) {
        return { kind: "failed", line: true };
      }
    }
    // The last try decides what it was: a line that never reached the app, or an app that answered an error.
    return {
      kind: "failed",
      line: !online() || (last !== null && lineFailed(last)),
    };
  }

  async function check(w: Walk, answer: MintAnswer): Promise<CheckVerdict> {
    if (!answer.checkUrl) return { kind: "skip" };
    for (let i = 0; i < CHECK_TRIES_MS.length; i++) {
      if (i > 0) {
        await deps.sleep(RETRY_PAUSE_MS[i - 1]);
        if (w.over) return { kind: "cancelled" };
      }
      const verdict = checkVerdict(
        await attempt(
          deps.fetch,
          answer.checkUrl,
          {
            method: "POST",
            // text/plain keeps it a CORS "simple" request: no preflight (workers/export/src/index.ts).
            headers: { "content-type": "text/plain;charset=UTF-8" },
            body: answer.token,
            credentials: "omit",
          },
          CHECK_TRIES_MS[i],
          w.controller.signal,
        ),
      );
      if (verdict.kind !== "retry") return verdict;
    }
    return { kind: "skip" };
  }

  /* ── listening for the Worker's word on a handed part (`export-ends`) ── */

  /**
   * Ask the app, now and then, what the Worker said of this part: every second while it begins, backing
   * off for a long one (`watchPauseMs`). A stream silent past its start, or one past the longest a zip
   * could take, is let go unheard; a poll with no answer just waits for the next.
   */
  async function listen(w: Walk, p: HandedPart) {
    // This walk's ear as it stands now: a restart (or the x) aborts it, and this loop with it.
    const ear = w.listening.signal;
    const gone = () => w.over || ear.aborted || p.word !== "listening";
    let listened = 0;
    let begun = false;
    // Polls in a row that never reached the app: her own line, which is all the page can know of a dropped one.
    let misses = 0;
    for (;;) {
      const pause = watchPauseMs(listened);
      await deps.sleep(pause);
      listened += pause;
      if (gone()) return;
      const tried = await attempt(
        deps.fetch,
        STATUS_URL,
        { ...JSON_POST, body: JSON.stringify({ jti: p.jti }) },
        STATUS_TRY_MS,
        ear,
      );
      const state = statusVerdict(tried);
      if (gone()) return;
      if (lineFailed(tried)) {
        misses += 1;
        // A request that was refused outright is a line that failed; one that only ran long may be the app's
        // own slowness, so a stall counts only when it repeats. The Worker sees a dropped line and a cancelled
        // download alike (the client left): this is what tells her own apart.
        if (tried.kind === "network" || misses >= 2) p.dropped = true;
        if (misses === LINE_LOST_AFTER) lineChanged(w, true);
      } else if (tried.kind === "answer") {
        misses = 0;
        lineChanged(w, false);
      }
      if (state?.state === "streaming") begun = true;
      else if (state && state.state !== "none") return heard(w, p, state);
      if ((!begun && listened >= START_HEARD_MS) || listened >= WATCH_MAX_MS) {
        return heard(w, p, null);
      }
    }
  }

  /**
   * Her line stopped answering while a zip streams, or came back: said under the title the walk already shows, so a
   * download that has quietly stopped is never left reading "Downloading…" (E6: a dropped connection is never hidden).
   */
  function lineChanged(w: Walk, lost: boolean) {
    if (w.over || w.lineLost === lost) return;
    w.lineLost = lost;
    if (w.done) say(w);
    else if (w.waiting && !w.asking) showBetween(w);
  }

  /** The Worker's word on one part (null: none will come), said where the walk now stands. */
  function heard(w: Walk, p: HandedPart, state: StreamState | null) {
    if (w.over) return;
    // A word came through: her line works.
    w.lineLost = false;
    if (!state || state.state === "none" || state.state === "streaming") {
      p.word = "unheard";
    } else if (state.state === "saved") {
      p.word = "saved";
      p.outcome = "saved";
    } else {
      p.word = "ended";
      p.outcome = state.state;
      p.missing = state.missing;
    }
    if (w.done) {
      say(w);
    } else if (w.waiting) {
      keep(w);
      showBetween(w);
    }
    // Otherwise the next part is being prepared: its toast stands, and the last word counts this one.
  }

  /** Every id a handed zip lacks or its check found gone, once each. */
  const missingOf = (w: Walk) => [
    ...new Set([...w.missing, ...w.handedParts.flatMap((p) => p.missing)]),
  ];

  /** Nothing more to take: the last word, once the Worker has said what it will. */
  function finish(w: Walk) {
    w.done = true;
    w.waiting = null;
    say(w);
  }

  /** Say how it went, in one toast: still downloading, saved, short, or nothing whole. */
  function say(w: Walk) {
    if (w.over) return;
    const place = deps.place();
    if (w.handedParts.some((p) => p.word === "listening")) {
      // Kept, so a reload goes on listening rather than forgetting the walk's last word.
      keep(w);
      show(w, {
        tone: "downloading",
        title:
          w.walked && w.handed > 1
            ? WALK_COPY.allStarted(w.handed)
            : WALK_COPY.downloading(place),
        // A line that has stopped answering is said here, never left under a bare "Downloading…".
        detail: w.lineLost ? WALK_COPY.lost : undefined,
        close: closeAs(w, WALK_COPY.dismiss),
      });
      return;
    }
    letGo(w);
    const missing = missingOf(w);
    if (missing.length === 0) {
      // Saved only by the Worker's own word on every part handed over; otherwise what the walk knows.
      const saved =
        w.handed > 0 &&
        w.handedParts.length === w.handed &&
        w.handedParts.every((p) => p.word === "saved");
      // One file is said where it lands; a walk ends on the whole of it, counted by what was
      // really handed over (a last part the album emptied meanwhile is not one of them).
      show(w, {
        tone: "done",
        title: !w.walked
          ? saved
            ? WALK_COPY.saved(place)
            : WALK_COPY.started(place)
          : w.handed > 1
            ? saved
              ? WALK_COPY.allSaved(w.handed)
              : WALK_COPY.allStarted(w.handed)
            : WALK_COPY.everything,
        duration: w.walked ? DONE_MS.walk : DONE_MS.one,
      });
      w.over = true;
      return;
    }

    const found = Math.max(0, w.items - missing.length);
    if (found === 0) {
      // Nothing whole reached her: a zip that never finished, or one the album emptied after its check.
      // ★ AND WHY IT NEVER FINISHED, TOLD APART (E6). `failed` is a read that broke on our side. `stopped` is the
      // client leaving, which the Worker cannot tell from a cancel in the browser's own list: it is her line
      // when the page's own failed while the zip streamed, and her cancel when it did not. A walk an older build
      // kept never recorded which (`dropped` absent), so it claims neither.
      const stoppedParts = w.handedParts.filter((p) => p.outcome === "stopped");
      const failed = w.handedParts.some((p) => p.outcome === "failed");
      const dropped = !failed && stoppedParts.some((p) => p.dropped === true);
      const cancelled =
        !failed &&
        !dropped &&
        stoppedParts.length > 0 &&
        stoppedParts.every((p) => p.dropped === false);
      const again = { label: WALK_COPY.tryAgain, run: () => restart(w) };
      if (cancelled) {
        // Hers, so neutral, never an error; stays until she puts it away, since the Worker's word can come after
        // she has looked away.
        show(w, {
          tone: "cancelled",
          title: WALK_COPY.cancelled,
          action: again,
          close: closeAs(w, WALK_COPY.dismiss),
          duration: Infinity,
        });
        return;
      }
      if (dropped) {
        show(w, {
          tone: "refused",
          title: WALK_COPY.dropped,
          detail: WALK_COPY.droppedDetail,
          action: again,
          close: closeAs(w, WALK_COPY.dismiss),
        });
        return;
      }
      const broke = failed || stoppedParts.length > 0;
      show(w, {
        tone: "refused",
        title:
          w.retryOf !== null
            ? WALK_COPY.missingUnreachable(w.retryOf)
            : broke
              ? WALK_COPY.stopped
              : EMPTY_EXPORT_MESSAGE,
        action: w.retryOf !== null ? undefined : again,
        close: closeAs(w, WALK_COPY.dismiss),
      });
      return;
    }

    show(w, {
      tone: "short",
      title: WALK_COPY.short(found, w.items),
      // A part whose zip the line dropped says so, with what to do, beside the count.
      detail: w.handedParts.some((p) => p.outcome === "stopped" && p.dropped)
        ? WALK_COPY.droppedDetail
        : undefined,
      // Exactly the missed ones, as one zip's worth; past that, the whole walk again (never a dead end).
      action:
        missing.length <= MAX_EXPORT_ITEMS
          ? {
              label: WALK_COPY.retryMissing(missing.length),
              run: () => {
                end(w);
                void begin(
                  w.scope,
                  { ...w.body, ids: missing },
                  missing.length,
                );
              },
            }
          : {
              label: WALK_COPY.tryAgain,
              run: () => {
                end(w);
                void begin(w.scope, w.body, w.retryOf, true);
              },
            },
      close: closeAs(w, WALK_COPY.dismiss),
    });
  }

  /** Begin this walk again from its first part (an empty zip's Try again). */
  function restart(w: Walk) {
    w.listening.abort();
    Object.assign(w, {
      part: 1,
      parts: null,
      after: null,
      items: 0,
      found: 0,
      missing: [],
      handed: 0,
      walked: false,
      handedParts: [],
      done: false,
      waiting: null,
      listening: new AbortController(),
      asking: null,
      cancelled: false,
      stopped: false,
      lineLost: false,
    });
    void takePart(w);
  }

  /** Take the walk's current part, one at a time: a tap while one is in flight does nothing. */
  async function takePart(w: Walk): Promise<boolean> {
    if (w.over || w.busy) return false;
    w.busy = true;
    try {
      return await takeParts(w);
    } finally {
      w.busy = false;
    }
  }

  async function takeParts(w: Walk): Promise<boolean> {
    for (;;) {
      const taken = await takeOne(w);
      if (taken !== "skip") return taken;
    }
  }

  /**
   * ★ A HOST'S SELECTION THAT MIXES HIDDEN AND SHOWN ITEMS ASKS FIRST (`export-ends`; ROADMAP: "the album's
   * bulk Download mints with hidden items in and no confirmation"). Download all's own menu leaves hidden
   * items out unless she says so; a selection is her say for the tiles she picked, except where Select all
   * swept hidden ones in among the rest. So only a mix asks, in the download's own toast, and the bar that
   * started it is let go at once. Read from the server's own summary of the selection; a summary that cannot
   * answer asks nothing and takes what she picked, as before.
   */
  async function hiddenAsk(w: Walk): Promise<boolean> {
    if (
      w.asked ||
      w.part !== 1 ||
      w.retryOf !== null ||
      w.scope !== "host" ||
      !Array.isArray(w.body.ids) ||
      w.body.include_hidden !== true
    ) {
      return false;
    }
    w.asked = true;
    const answer = await attempt(
      deps.fetch,
      `/api/export/${w.scope}`,
      { ...JSON_POST, body: JSON.stringify({ step: "summary", ...w.body }) },
      SUMMARY_TRIES_MS[0],
      w.controller.signal,
    );
    if (w.over) return true;
    const mix = answer.kind === "answer" ? hiddenMixOf(answer.body) : null;
    if (!mix || mix.hidden === 0 || mix.shown === 0) return false;
    const go = (includeHidden: boolean) => () => {
      if (w.over || w.busy) return;
      if (!includeHidden) w.body = { ...w.body, include_hidden: false };
      void takePart(w);
    };
    show(w, {
      tone: "ask",
      title: WALK_COPY.hiddenAsk(mix.hidden, mix.hidden + mix.shown),
      actions: [
        { label: WALK_COPY.includeHidden(mix.hidden), run: go(true) },
        { label: WALK_COPY.leaveHidden(mix.hidden), run: go(false) },
      ],
      close: closeAs(w, WALK_COPY.cancel),
    });
    return true;
  }

  /** One part: minted, checked, posted, said. "skip" when it held nothing and the walk goes on. */
  async function takeOne(w: Walk): Promise<boolean | "skip"> {
    if (w.over) return false;
    w.controller = new AbortController();
    w.cancelled = false;
    w.lineLost = false;
    showWait(w);

    // The question waits on her answer, whose button takes the part from here.
    if (await hiddenAsk(w)) return false;

    const minted = await mint(w);
    if (w.over || minted.kind === "cancelled") return false;
    if (minted.kind === "failed") {
      // ★ A DROPPED CONNECTION NAMES ITSELF (E6): when the tries failed for want of a line it says so and what to
      // do, so she neither tries on a line that cannot carry it nor blames the app; an app that answered an error
      // is "Couldn't start that download", as it was.
      show(w, {
        tone: "refused",
        title: minted.line ? WALK_COPY.dropped : WALK_COPY.failed,
        detail: minted.line ? WALK_COPY.droppedDetail : undefined,
        action: { label: WALK_COPY.tryAgain, run: () => void takePart(w) },
        close: closeAs(w, WALK_COPY.dismiss),
      });
      return false;
    }
    if (minted.kind === "refused") {
      if (minted.code === "empty" && w.part > 1) {
        // Everything after the last part was deleted meanwhile: the walk is done.
        finish(w);
        return false;
      }
      if (minted.code === "empty") {
        show(w, {
          tone: "refused",
          title:
            w.retryOf !== null
              ? WALK_COPY.missingGone(w.retryOf)
              : EMPTY_EXPORT_MESSAGE,
          action:
            w.retryOf !== null
              ? undefined
              : { label: WALK_COPY.tryAgain, run: () => restart(w) },
          close: closeAs(w, WALK_COPY.dismiss),
        });
        return false;
      }
      // Refused on purpose (paused, too many from this network, not this viewer's): said as the
      // server says it, with nothing to press but the x, since pressing again would say it again.
      show(w, {
        tone: "refused",
        title: minted.message ?? WALK_COPY.failed,
        close: closeAs(w, WALK_COPY.dismiss),
      });
      return false;
    }

    const answer = minted.mint;
    w.parts = answer.parts;
    const checked = await check(w, answer);
    if (w.over || checked.kind === "cancelled") return false;
    // ★ NOTHING IS HANDED OVER WHILE HER QUESTION STANDS (E6): a download that has begun cannot be asked about. A
    // Keep going carries on from here; a Cancel (or the x of a later part) abandons this part before a byte moves.
    await holdWhileAsked(w);
    if (w.over || w.cancelled) return false;
    if (checked.kind === "refused") {
      show(w, {
        tone: "refused",
        title:
          checked.reason === "paused" ? WALK_COPY.paused : WALK_COPY.failed,
        action:
          checked.reason === "paused"
            ? undefined
            : { label: WALK_COPY.tryAgain, run: () => void takePart(w) },
        close: closeAs(w, WALK_COPY.dismiss),
      });
      return false;
    }

    // What this part holds: the Worker's count, or (it could not say) the mint's own.
    const counted: CheckAnswer =
      checked.kind === "ok"
        ? checked.check
        : { items: answer.items, found: answer.items, missing: [] };
    w.items += counted.items;
    w.found += counted.found;
    w.missing.push(...counted.missing);

    if (counted.found === 0) {
      // ★ NEVER AN EMPTY FILE (`hollow=refuse`). One zip, or a walk's first part with nothing
      // before it and nothing after: refused in one line. A part in the middle of a walk that
      // holds nothing is simply not sent, and the walk goes on to the next.
      if (answer.next) {
        w.part += 1;
        w.after = answer.next;
        return "skip";
      }
      if (w.handed === 0) {
        show(w, {
          tone: "refused",
          // A retry's ones are still in the album (the mint found them) with their files not there.
          title:
            w.retryOf !== null
              ? WALK_COPY.missingUnreachable(w.retryOf)
              : EMPTY_EXPORT_MESSAGE,
          action:
            w.retryOf !== null
              ? undefined
              : { label: WALK_COPY.tryAgain, run: () => restart(w) },
          close: closeAs(w, WALK_COPY.dismiss),
        });
        return false;
      }
      finish(w);
      return true;
    }

    deps.post(answer.workerUrl, answer.token);
    w.handed += 1;
    // Listen only where both halves said the Worker's word will come: the mint asked for it, and the
    // Worker's own check promised it (an older Worker never does).
    const listening =
      !!answer.reports &&
      !!answer.jti &&
      checked.kind === "ok" &&
      checked.check.reports === true;
    const handed: HandedPart = {
      part: w.part,
      items: counted.items,
      jti: listening ? (answer.jti ?? null) : null,
      word: listening ? "listening" : "unheard",
      outcome: null,
      missing: [],
      // Only a zip the walk listens to can say how its line did: until a poll fails, it did not drop.
      ...(listening ? { dropped: false } : {}),
    };
    w.handedParts.push(handed);
    if (listening) void listen(w, handed);

    if (answer.next) {
      between(w, answer.next, answer.parts);
      return true;
    }
    finish(w);
    return true;
  }

  function newWalk(
    scope: ExportScope,
    body: MintBody,
    retryOf: number | null,
  ): Walk {
    return {
      id: deps.newId(),
      scope,
      body,
      retryOf,
      part: 1,
      parts: null,
      after: null,
      items: 0,
      found: 0,
      missing: [],
      handed: 0,
      walked: false,
      handedParts: [],
      asked: false,
      done: false,
      waiting: null,
      controller: new AbortController(),
      listening: new AbortController(),
      busy: false,
      over: false,
      asking: null,
      released: [],
      cancelled: false,
      stopped: false,
      lineLost: false,
    };
  }

  function begin(
    scope: ExportScope,
    body: MintBody,
    retryOf: number | null = null,
    asked = false,
  ): Promise<boolean> {
    const w = newWalk(scope, body, retryOf);
    w.asked = asked;
    return takePart(w);
  }

  let resumed = false;
  /**
   * Offer again every walk the tab kept (the page before a reload), once per walker: between parts, the
   * toast it was left on, its "Get part N" taking the next part from the cursor it kept; with every part
   * taken, the toast that waits for the Worker's word. Either way, every part it was still listening for
   * is listened for again. A store holding nothing readable is emptied, so it is never read again.
   */
  function resume() {
    if (resumed) return;
    resumed = true;
    const saved = readSavedWalks(deps.store?.load());
    kept.clear();
    for (const s of saved) {
      const w = newWalk(s.scope, s.body, s.retryOf);
      Object.assign(w, {
        asked: true,
        part: s.part,
        parts: s.parts,
        items: s.items,
        found: s.found,
        missing: [...s.missing],
        handed: s.handed,
        walked: s.next !== null || s.handed > 1,
        handedParts: (s.handedParts ?? []).map((p) => ({
          ...p,
          missing: [...p.missing],
        })),
      });
      if (s.next !== null) between(w, s.next, s.parts);
      else finish(w);
      for (const p of w.handedParts) {
        if (p.word === "listening") void listen(w, p);
      }
    }
    if (kept.size === 0) save();
  }

  return {
    /** Start a download: resolves true once its first file is in the browser's hands. */
    start: (scope: ExportScope, body: MintBody) => begin(scope, body),
    /** The page's first act: offer again what a reload left between parts. */
    resume,
  };
}
