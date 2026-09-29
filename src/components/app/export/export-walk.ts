/**
 * THE DOWNLOAD'S ONE ENGINE: from a tapped row to a file in the browser's hands, said in one toast
 * (`export-flow` r1; the rules and every word are `lib/export/walk.ts`).
 *
 *   tap → the toast: Preparing your download… [x]
 *       → mint (the app authorizes and signs; two quiet re-attempts on a dropped request)
 *       → check (the Worker says what the zip would hold; `workers/export/src/check.ts`)
 *       → post (a top-level form: the browser's download manager takes the stream)
 *       → the toast says what happened, and what to do next when there is a next
 *
 * ★ THE APP GOES BLIND AT THE POST, SO EVERYTHING WORTH SAYING IS LEARNED BEFORE IT. The form's
 * answer can never be read (and a refusal there would replace the page), so the Worker is asked
 * first, in a fetch that can be: an empty zip is refused in one line and never sent, a short one is
 * counted with a Try again for exactly what it missed, and a token the Worker would refuse is said
 * here. A check that cannot answer (a Worker from before it, R2 down) never stops the zip.
 *
 * ★ EVERY WAIT CAN BE LEFT (Will: "Interruptibility is a huge win in UX"). The x on the right ends
 * whatever is in flight: the mint's or the check's fetch is aborted (the Worker stops reading when
 * its client leaves), the toast goes, and nothing is posted afterwards, whatever arrives late. A
 * file already handed to the browser is the browser's to cancel.
 *
 * ★ A BIG ALBUM IS A WALK, ONE TAP A PART. Each part is minted when it is asked for (a token lives
 * two minutes), and each is a download a person pressed, because a browser holds back a second
 * download a page starts on its own. The walk's position is the server's cursor, so nothing is
 * taken twice or missed while the album moves.
 *
 * The engine owns no React: it drives a toast through `ToastPort`, fetches through `deps.fetch` and
 * posts through `deps.post`, so its tests stand in for all three (export-walk.test.ts), and a
 * Download menu that closes or a page that navigates cannot orphan a walk mid-way.
 */
import { MAX_EXPORT_ITEMS } from "@/lib/export/build-manifest";
import {
  type Attempt,
  CHECK_TRIES_MS,
  type CheckAnswer,
  type CheckVerdict,
  checkVerdict,
  DONE_MS,
  type DownloadPlace,
  EMPTY_EXPORT_MESSAGE,
  MINT_TRIES_MS,
  type MintAnswer,
  mintVerdict,
  RETRY_PAUSE_MS,
  WALK_COPY,
} from "@/lib/export/walk";

export type ExportScope = "host" | "guest";

/** What the caller asks for: the album (and, for a host, its filters or a selection). */
export type MintBody = Record<string, unknown>;

export type ToastAction = { label: string; run: () => void };

/**
 * The toast's five states. Every one but `done` stays until it is answered, and carries the x (its
 * label says what it does there: cancel, stop, dismiss).
 */
export type ToastView =
  /** Preparing: a spinner, and the x that cancels. */
  | { tone: "wait"; title: string; close: ToastAction }
  /** A part is on its way and the next is a tap. */
  | { tone: "between"; title: string; action: ToastAction; close: ToastAction }
  /** Handed over, all of it. */
  | { tone: "done"; title: string; duration: number }
  /** Handed over, short: the count, and a Try again for what it missed. */
  | { tone: "short"; title: string; action?: ToastAction; close: ToastAction }
  /** Nothing was handed over, and why. */
  | {
      tone: "refused";
      title: string;
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
  sleep: (ms: number) => Promise<void>;
  newId: () => string;
};

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
  controller: AbortController;
  /** A part is being taken: a second tap on Try again or Get part N waits its turn. */
  busy: boolean;
  /** Ended (cancelled, dismissed or finished): nothing more is said or posted. */
  over: boolean;
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
  | { kind: "failed" }
  | { kind: "cancelled" };

export function createExportWalker(deps: WalkDeps) {
  const show = (w: Walk, view: ToastView) => {
    if (!w.over) deps.toast.show(w.id, view);
  };

  /** The x, and every way a walk is put down: nothing in flight survives it. */
  const end = (w: Walk) => {
    if (w.over) return;
    w.over = true;
    w.controller.abort();
    deps.toast.dismiss(w.id);
  };

  const closeAs = (w: Walk, label: string): ToastAction => ({
    label,
    run: () => end(w),
  });

  async function mint(w: Walk): Promise<MintOutcome> {
    const body = JSON.stringify({
      step: "mint",
      ...w.body,
      part: w.part,
      ...(w.after ? { after: w.after } : {}),
    });
    for (let i = 0; i < MINT_TRIES_MS.length; i++) {
      if (i > 0) {
        await deps.sleep(RETRY_PAUSE_MS[i - 1]);
        if (w.over) return { kind: "cancelled" };
      }
      const verdict = mintVerdict(
        await attempt(
          deps.fetch,
          `/api/export/${w.scope}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
          },
          MINT_TRIES_MS[i],
          w.controller.signal,
        ),
      );
      if (verdict.kind !== "retry") return verdict;
    }
    return { kind: "failed" };
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

  /** Nothing more to take: say how it went, in one toast. */
  function finish(w: Walk) {
    if (w.missing.length === 0) {
      // One file is said where it lands; a walk ends on the whole of it, counted by what was
      // really handed over (a last part the album emptied meanwhile is not one of them).
      show(w, {
        tone: "done",
        title: !w.walked
          ? WALK_COPY.started(deps.place())
          : w.handed > 1
            ? WALK_COPY.allStarted(w.handed)
            : WALK_COPY.everything,
        duration: w.walked ? DONE_MS.walk : DONE_MS.one,
      });
      w.over = true;
      return;
    }
    const missing = [...w.missing];
    show(w, {
      tone: "short",
      title: WALK_COPY.short(w.found, w.items),
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
          : undefined,
      close: closeAs(w, WALK_COPY.dismiss),
    });
  }

  /** Begin this walk again from its first part (an empty zip's Try again). */
  function restart(w: Walk) {
    Object.assign(w, {
      part: 1,
      parts: null,
      after: null,
      items: 0,
      found: 0,
      missing: [],
      handed: 0,
      walked: false,
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

  /** One part: minted, checked, posted, said. "skip" when it held nothing and the walk goes on. */
  async function takeOne(w: Walk): Promise<boolean | "skip"> {
    if (w.over) return false;
    w.controller = new AbortController();
    show(w, {
      tone: "wait",
      title:
        w.retryOf !== null
          ? WALK_COPY.preparingMissing(w.retryOf)
          : w.parts !== null && w.parts > 1
            ? WALK_COPY.preparingPart(w.part, w.parts)
            : WALK_COPY.preparing,
      close: closeAs(w, WALK_COPY.cancel),
    });

    const minted = await mint(w);
    if (w.over || minted.kind === "cancelled") return false;
    if (minted.kind === "failed") {
      show(w, {
        tone: "refused",
        title: WALK_COPY.failed,
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

    if (answer.next) {
      const next = answer.next;
      const nextPart = w.part + 1;
      w.walked = true;
      show(w, {
        tone: "between",
        title: WALK_COPY.partStarted(w.part, answer.parts),
        action: {
          label: WALK_COPY.nextPart(nextPart),
          run: () => {
            // A second tap on the same button, before its toast has turned, takes nothing twice.
            if (w.over || w.busy || w.part >= nextPart) return;
            w.part = nextPart;
            w.after = next;
            void takePart(w);
          },
        },
        close: closeAs(w, WALK_COPY.stop),
      });
      return true;
    }
    finish(w);
    return true;
  }

  function begin(
    scope: ExportScope,
    body: MintBody,
    retryOf: number | null = null,
  ): Promise<boolean> {
    const w: Walk = {
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
      controller: new AbortController(),
      busy: false,
      over: false,
    };
    return takePart(w);
  }

  return {
    /** Start a download: resolves true once its first file is in the browser's hands. */
    start: (scope: ExportScope, body: MintBody) => begin(scope, body),
  };
}
