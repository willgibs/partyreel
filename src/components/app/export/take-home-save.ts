/**
 * SAVE, ON A PHONE: PICKS INTO PHOTOS AT PHONE SIZE (take-home r1, `save=light`; the rules and words are
 * `lib/export/take-home.ts`). The one engine for a guest's Save (her selection) and a host's Phone size in a hand:
 *
 *   tap → the links (`step: "save"`, minted now and never before) → the files into the phone, sheet by sheet
 *       (at most 100 MB a sheet), the toast and the caller's ring counting the bytes as they come
 *       → the phone's own share sheet ("Save 24 Images" puts them in Photos)
 *       → past one sheet, the next part is a tap ("Get part 2"), the way a big zip comes home in parts
 *
 * ★ THE SHEET NEEDS A TAP THAT IS STILL FRESH. WebKit opens a share sheet only within about five seconds of the
 * tap that asked (measured 5,023 ms, `share-save.ts`), and a party's network takes longer than that for most
 * picks. So the files are fetched first, and the sheet opens at once only while the tap's activation still
 * holds; once it has lapsed the toast (and the caller's control) says the files are ready, and one more tap opens
 * the sheet with every file already in hand, never a failure. A dismissed sheet keeps them in hand the same way.
 *
 * ★ EVERY WAIT CAN BE LEFT (Will: "Interruptibility is a huge win in UX"): the toast's x aborts every read in
 * flight and lets the files go, but asks first (E6, Will 2026-10-04: "a cancel is intentional"): nothing is handed
 * to the phone's sheet while the question stands, and a confirmed stop says it was cancelled with a Try again, or,
 * past the first part, where she stopped with the tap that takes the next. A file that cannot be read is tried once
 * more and then left out, and said.
 *
 * ★ AND A DROPPED CONNECTION IS NEVER HIDDEN (E6): a Save that could not reach the app says "Your connection
 * dropped." and what to do, and one whose reads stalled or were refused says so beside what it did save, so she
 * neither tries on a line that cannot carry it nor blames the app.
 *
 * The engine owns no React: it fetches through `deps.fetch`, shares through `deps.nav`, speaks through the walk's
 * own toast port (`export-toast.tsx`) and reports its state to the caller (`onState`), so its tests stand in for
 * every edge (take-home-save.test.ts).
 */
import type {
  ExportScope,
  ToastPort,
  ToastView,
} from "@/components/app/export/export-walk";
import {
  packSheets,
  type SaveItem,
  SHEET_BYTES,
  setNoun,
  TOO_MANY_FOR_PHOTOS,
} from "@/lib/export/take-home";
import { DONE_MS, partsLeft, WALK_COPY } from "@/lib/export/walk";
import { fetchMediaFile, type NavigatorLike } from "@/lib/media/share-save";
import { formatBytes } from "@/lib/utils";

/** What the caller draws (a guest's Save shutter): where the Save stands. */
export type SaveState =
  | { kind: "idle" }
  /** The links are being minted. */
  | { kind: "asking" }
  /** A sheet's files are arriving: how far, 0 to 1. */
  | { kind: "getting"; progress: number; part: number; parts: number }
  /** A sheet's files are in hand: the next tap opens the phone's sheet. */
  | { kind: "ready"; part: number; parts: number }
  /** Every sheet went. */
  | { kind: "done" };

export type SaveDeps = {
  fetch: typeof fetch;
  nav: NavigatorLike;
  toast: ToastPort;
  /** A plain download of one file (a clip too heavy for any sheet). */
  download: (url: string) => void;
  newId: () => string;
  onState?: (state: SaveState) => void;
};

/** Reads at once while a sheet's files arrive: R2 answers HTTP/1.1, so a few, leaving the page its own. */
const CONCURRENCY = 3;

/** The words a Save says, in one place. */
export const SAVE_COPY = {
  asking: "Getting your photos ready…",
  getting: (noun: string, received: number, total: number) =>
    `Getting ${noun}: ${formatBytes(received)} of ${formatBytes(total)}`,
  gettingPart: (part: number, parts: number, received: number, total: number) =>
    `Part ${part} of ${parts}: ${formatBytes(received)} of ${formatBytes(total)}`,
  ready: (noun: string) => `${capital(noun)} ready.`,
  readyPart: (part: number, parts: number) =>
    `Part ${part} of ${parts} is ready.`,
  save: "Save",
  partSaved: (part: number, parts: number) =>
    `Part ${part} of ${parts} is saved.`,
  nextPart: (part: number) => `Get part ${part}`,
  saved: (noun: string) => `Saved ${noun}.`,
  savedShort: (noun: string, missed: number) =>
    `Saved ${noun}. ${missed === 1 ? "1 couldn't be saved" : `${missed} couldn't be saved`}.`,
  loose: (n: number) =>
    n === 1
      ? "1 video was too big for Photos: it downloads as a file."
      : `${n} videos were too big for Photos: they download as files.`,
  refused: "Couldn't get your photos. Try again.",
  nothing: "Nothing left to save.",
  tryAgain: "Try again",
  cancel: "Stop saving",
  dismiss: "Dismiss",
  /** The x, asked before it is believed (E6): before the first part is in Photos, and past it, where it leaves the rest. */
  askStop: "Stop saving?",
  askStopAfter: (part: number, parts: number) =>
    `Stop after part ${part} of ${parts}?`,
  askStopDetail: (next: number, parts: number) =>
    `${partsLeft(next, parts)} won't be saved.`,
  keepGoing: "Keep going",
  stopHere: "Stop here",
  cancelled: "Saving cancelled.",
  stoppedAfter: (part: number, parts: number) =>
    `Stopped after part ${part} of ${parts}.`,
  /** What a Save that lost its line says of what it did not save: it cannot be tapped again, only picked again. */
  droppedDetail:
    "Your connection dropped. Check your signal, then save those again.",
} as const;

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const nounOf = (items: readonly SaveItem[]) =>
  setNoun(
    items.filter((i) => i.type === "photo").length,
    items.filter((i) => i.type === "video").length,
  );

type Run = {
  id: string;
  scope: ExportScope;
  body: Record<string, unknown>;
  abort: AbortController;
  sheets: SaveItem[][];
  loose: SaveItem[];
  /** The part the run stands at, from 1. */
  part: number;
  /** Its files, once in hand. */
  files: File[] | null;
  /** Items no read could bring, across every part. */
  missed: number;
  /** What every part has saved so far. */
  saved: SaveItem[];
  /** What the next tap does: open the sheet (`sheet`), take the next part (`next`), or nothing yet. */
  waiting: "sheet" | "next" | null;
  /** The x's question stands: nothing is handed to the phone's sheet while it does (`holdWhileAsked`). */
  asking: boolean;
  released: (() => void)[];
  /** The toast as the engine last drew it, which a Keep going puts back. */
  last: ToastView | null;
  /**
   * Which attempt at the current part is live: a stop that leaves the Save standing moves it on, so a part's reads
   * still unwinding when she takes the next part up again are never mistaken for the new part's (`getPart`).
   */
  epoch: number;
  /** Reads that failed for want of a line (a body that stopped, a read the browser would not let through). */
  lineMisses: number;
};

export function createTakeHomeSaver(deps: SaveDeps) {
  let run: Run | null = null;

  const state = (s: SaveState) => deps.onState?.(s);

  /** The question is over (answered, or the Save said something that replaces it): what waited on it goes on. */
  function release(r: Run) {
    r.asking = false;
    for (const resolve of r.released.splice(0)) resolve();
  }

  /**
   * Every toast the Save draws goes through here, so the question can stand over progress: while it does, a state
   * that is only a wait or a tap (the bytes arriving, a part ready) is kept and not drawn, and an ending (saved,
   * refused, short, cancelled) replaces the question, there being nothing left to ask about.
   */
  function put(r: Run, view: ToastView) {
    if (run !== r) return;
    r.last = view;
    if (r.asking) {
      if (view.tone === "wait" || view.tone === "between") return;
      release(r);
    }
    deps.toast.show(r.id, view);
  }

  /** Let the run go at once, without a word: every read aborted, every file released, the toast gone. */
  function stop() {
    if (!run) return;
    release(run);
    run.abort.abort();
    deps.toast.dismiss(run.id);
    run = null;
    state({ kind: "idle" });
  }

  /**
   * ★ THE x ASKS FIRST (E6: a cancel is intentional). The reads go on meanwhile, but nothing is handed to the phone's
   * sheet until she answers (`holdWhileAsked`); Keep going draws the toast as it stood, and Stop saving cancels.
   */
  function cancel() {
    const r = run;
    if (!r || r.asking) return;
    // Parts already in Photos are hers: stopping past the first leaves the rest, and says so before it does.
    const parts = r.sheets.length;
    const shared = r.waiting === "next" ? r.part : r.part - 1;
    r.asking = true;
    deps.toast.show(r.id, {
      tone: "confirm",
      title:
        shared >= 1 && shared < parts
          ? SAVE_COPY.askStopAfter(shared, parts)
          : SAVE_COPY.askStop,
      detail:
        shared >= 1 && shared < parts
          ? SAVE_COPY.askStopDetail(shared + 1, parts)
          : undefined,
      actions: [
        { label: SAVE_COPY.keepGoing, run: () => keepGoing(r) },
        {
          label:
            shared >= 1 && shared < parts
              ? SAVE_COPY.stopHere
              : SAVE_COPY.cancel,
          run: () => cancelRun(r),
        },
      ],
    });
  }

  /** Keep going: the question is withdrawn and the toast is drawn as it stood. */
  function keepGoing(r: Run) {
    if (run !== r || !r.asking) return;
    release(r);
    if (r.last) deps.toast.show(r.id, r.last);
  }

  /**
   * Stopped, confirmed. Nothing in Photos yet: the Save ends and says it was cancelled, with Try again (the Save
   * from its start). Parts already in Photos: the Save stays, said where she stopped, with the tap that takes the
   * next part, so what she left behind is never a silent loss.
   */
  function cancelRun(r: Run) {
    if (run !== r || !r.asking) return;
    release(r);
    r.abort.abort();
    r.epoch += 1;
    r.files = null;
    const parts = r.sheets.length;
    const shared = r.waiting === "next" ? r.part : r.part - 1;
    if (shared >= 1 && shared < parts) {
      r.abort = new AbortController();
      r.part = shared;
      r.waiting = "next";
      state({ kind: "ready", part: shared + 1, parts });
      deps.toast.show(r.id, {
        tone: "between",
        title: SAVE_COPY.stoppedAfter(shared, parts),
        action: {
          label: SAVE_COPY.nextPart(shared + 1),
          run: () => void nextPart(r),
        },
        close: { label: SAVE_COPY.dismiss, run: stop },
      });
      return;
    }
    const { scope, body } = r;
    run = null;
    state({ kind: "idle" });
    deps.toast.show(r.id, {
      tone: "cancelled",
      title: SAVE_COPY.cancelled,
      action: {
        label: SAVE_COPY.tryAgain,
        run: () => {
          deps.toast.dismiss(r.id);
          void start(scope, body);
        },
      },
      close: {
        label: SAVE_COPY.dismiss,
        run: () => deps.toast.dismiss(r.id),
      },
      duration: DONE_MS.cancelled,
    });
  }

  /** Nothing is handed to the phone's sheet while her question stands. */
  async function holdWhileAsked(r: Run) {
    while (r.asking && run === r) {
      await new Promise<void>((resolve) => r.released.push(resolve));
    }
  }

  /** The toast's x: a question first, never a stop on the press. */
  const close = { label: SAVE_COPY.cancel, run: cancel };

  type Asked =
    | SaveItem[]
    /** Refused outright (`final` where another try would say the same), or the app answered an error. */
    | { refused: string | null; final?: true }
    /** The links could not be asked for: `line` when the request never reached the app. */
    | { refused: null; line: boolean }
    | null;

  async function ask(
    scope: ExportScope,
    body: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<Asked> {
    let line = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await deps.fetch(`/api/export/${scope}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, step: "save" }),
          signal,
        });
        line = false;
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          items?: SaveItem[];
          more?: boolean;
          message?: string;
        } | null;
        if (res.ok && data?.ok && Array.isArray(data.items)) {
          // The set ran past one Save (the album grew, or she pressed before its sizes came): all or none, and
          // another try would answer the same.
          if (data.more) return { refused: TOO_MANY_FOR_PHOTOS, final: true };
          return data.items;
        }
        if (res.status < 500) return { refused: data?.message ?? null };
      } catch {
        if (signal.aborted) return null;
        // A request that never reached the app: the line, which is all the page can know of a dropped one.
        line = true;
      }
    }
    return { refused: null, line };
  }

  /** One file, tried twice: a dropped read on a party's network is worth one more go. */
  async function bring(
    item: SaveItem,
    signal: AbortSignal,
    onBytes: (received: number) => void,
    onLine: () => void,
  ): Promise<File | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const got = await fetchMediaFile(item.url, item.name, {
        fetch: deps.fetch,
        signal,
        maxBytes: SHEET_BYTES,
        onProgress: (received) => onBytes(received),
      });
      if (got.kind === "file") return got.file;
      if (got.kind === "aborted" || got.kind === "too-large") return null;
      // A body that stopped arriving, or a read the browser would not let through (a dropped network looks like
      // one): the line, as far as the page can tell. An answer that was not a 200 is the app's.
      if (got.kind === "failed" && got.why !== "status") onLine();
      onBytes(0);
    }
    return null;
  }

  /**
   * The current part's files into the phone, the toast and the ring counting. True once they are in hand; false when
   * the part was abandoned meanwhile (a stop, or the Save let go), so nothing goes on to hand them over.
   */
  async function getPart(r: Run): Promise<boolean> {
    r.waiting = null;
    const epoch = r.epoch;
    const sheet = r.sheets[r.part - 1] ?? [];
    const parts = r.sheets.length;
    const total = sheet.reduce((sum, i) => sum + i.bytes, 0);
    const received = new Map<string, number>();
    const say = () => {
      if (run !== r || r.epoch !== epoch) return;
      const got = Math.min(
        total,
        [...received.values()].reduce((a, b) => a + b, 0),
      );
      state({
        kind: "getting",
        progress: total > 0 ? got / total : 0,
        part: r.part,
        parts,
      });
      put(r, {
        tone: "wait",
        title:
          parts > 1
            ? SAVE_COPY.gettingPart(r.part, parts, got, total)
            : SAVE_COPY.getting(nounOf(sheet), got, total),
        close,
      });
    };
    say();
    const files: (File | null)[] = new Array(sheet.length).fill(null);
    let next = 0;
    // This part's own signal, taken now: a stop that leaves the Save standing swaps in a fresh controller for the
    // next part, and a lane still unwinding from this one must not read that and carry on fetching.
    const signal = r.abort.signal;
    const lane = async () => {
      while (next < sheet.length && !signal.aborted) {
        const index = next++;
        const item = sheet[index];
        files[index] = await bring(
          item,
          signal,
          (bytes) => {
            received.set(item.id, bytes);
            say();
          },
          () => {
            r.lineMisses += 1;
          },
        );
        received.set(item.id, item.bytes);
        say();
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, sheet.length) }, lane),
    );
    if (run !== r || r.epoch !== epoch) return false;
    r.missed += files.filter((f) => f === null).length;
    r.files = files.filter((f): f is File => f !== null);
    r.saved.push(...sheet.filter((_, i) => files[i] !== null));
    return true;
  }

  /** Hand the part's files to the phone's sheet, or wait for the tap that can. */
  async function share(r: Run): Promise<void> {
    // Nothing goes to the sheet while her question stands: Keep going carries on from here (the tap that began
    // this has lapsed by then, so the files wait for the next one). Awaited only then, so the common path reaches
    // the sheet with no hop between the tap and it.
    if (r.asking) await holdWhileAsked(r);
    if (run !== r || !r.files) return;
    r.waiting = null;
    const parts = r.sheets.length;
    if (r.files.length === 0) {
      await advance(r);
      return;
    }
    const lapsed = deps.nav.userActivation && !deps.nav.userActivation.isActive;
    if (lapsed || typeof deps.nav.share !== "function") {
      ready(r);
      return;
    }
    try {
      await deps.nav.share({ files: r.files });
    } catch (e) {
      // Dismissed, or the tap's activation lapsed after all: the files stay in hand for one more tap.
      const name = (e as { name?: string } | null)?.name;
      if (name === "AbortError" || name === "NotAllowedError") {
        ready(r);
        return;
      }
      if (run !== r) return;
      put(r, {
        tone: "refused",
        title: SAVE_COPY.refused,
        action: { label: SAVE_COPY.tryAgain, run: () => void share(r) },
        close: { label: SAVE_COPY.dismiss, run: stop },
      });
      ready(r, false);
      return;
    }
    r.files = null;
    if (r.part < parts) {
      r.waiting = "next";
      state({ kind: "ready", part: r.part + 1, parts });
      put(r, {
        tone: "between",
        title: SAVE_COPY.partSaved(r.part, parts),
        action: {
          label: SAVE_COPY.nextPart(r.part + 1),
          run: () => void nextPart(r),
        },
        close,
      });
      return;
    }
    await advance(r);
  }

  /** The files are in hand and the next tap opens the sheet. */
  function ready(r: Run, speak = true) {
    if (run !== r) return;
    r.waiting = "sheet";
    const parts = r.sheets.length;
    state({ kind: "ready", part: r.part, parts });
    if (!speak) return;
    put(r, {
      tone: "between",
      title:
        parts > 1
          ? SAVE_COPY.readyPart(r.part, parts)
          : SAVE_COPY.ready(nounOf(r.sheets[r.part - 1] ?? [])),
      action: { label: SAVE_COPY.save, run: () => void share(r) },
      close,
    });
  }

  async function nextPart(r: Run) {
    if (run !== r || r.asking) return;
    // A part she stopped at is taken up again here: its reads are new, and what the old ones were doing is over.
    r.part += 1;
    if (await getPart(r)) await share(r);
  }

  /** Every part has gone: the loose files download, and the walk says what it saved. */
  async function advance(r: Run) {
    if (run !== r) return;
    for (const item of r.loose) deps.download(item.url);
    const noun = nounOf(r.saved);
    const title =
      r.saved.length === 0 && r.loose.length === 0
        ? SAVE_COPY.nothing
        : r.missed > 0
          ? SAVE_COPY.savedShort(noun, r.missed)
          : r.loose.length > 0
            ? `${SAVE_COPY.saved(noun)} ${SAVE_COPY.loose(r.loose.length)}`
            : SAVE_COPY.saved(noun);
    if (r.missed > 0 && r.lineMisses > 0) {
      // ★ NEVER HIDDEN (E6): what the line dropped is said where it stays, beside what did save, with what to do.
      put(r, {
        tone: "short",
        title,
        detail: SAVE_COPY.droppedDetail,
        close: {
          label: SAVE_COPY.dismiss,
          run: () => deps.toast.dismiss(r.id),
        },
      });
    } else {
      put(r, { tone: "done", title, duration: DONE_MS.one });
    }
    run = null;
    state({ kind: "done" });
  }

  /** Start a Save: `body` is the album and the set (a guest's ids or set, a host's filters), at phone size. */
  async function start(
    scope: ExportScope,
    body: Record<string, unknown>,
  ): Promise<void> {
    stop();
    const r: Run = {
      id: deps.newId(),
      scope,
      body,
      abort: new AbortController(),
      sheets: [],
      loose: [],
      part: 1,
      files: null,
      missed: 0,
      saved: [],
      waiting: null,
      asking: false,
      released: [],
      last: null,
      epoch: 0,
      lineMisses: 0,
    };
    run = r;
    state({ kind: "asking" });
    put(r, { tone: "wait", title: SAVE_COPY.asking, close });
    const answer = await ask(scope, body, r.abort.signal);
    if (run !== r) return;
    if (answer === null) return stop();
    if (!Array.isArray(answer)) {
      // ★ A DROPPED CONNECTION NAMES ITSELF (E6): a request that never reached the app says so and what to do; an
      // app that answered an error keeps its own sentence.
      const dropped = "line" in answer && answer.line;
      put(r, {
        tone: "refused",
        title: dropped
          ? WALK_COPY.dropped
          : (answer.refused ?? SAVE_COPY.refused),
        detail: dropped ? WALK_COPY.droppedDetail : undefined,
        action:
          "final" in answer
            ? undefined
            : {
                label: SAVE_COPY.tryAgain,
                run: () => {
                  deps.toast.dismiss(r.id);
                  void start(scope, body);
                },
              },
        close: {
          label: SAVE_COPY.dismiss,
          run: () => deps.toast.dismiss(r.id),
        },
      });
      run = null;
      state({ kind: "idle" });
      return;
    }
    const { sheets, loose } = packSheets(answer);
    r.sheets = sheets;
    r.loose = loose;
    if (sheets.length === 0) {
      await advance(r);
      return;
    }
    if (await getPart(r)) await share(r);
  }

  return {
    start,
    /**
     * The caller's own control, pressed while a part waits on her: the sheet opens inside this tap, or the next
     * part starts. Pressed while files are still arriving, it does nothing (the toast's x is the stop).
     */
    tap(): void {
      const r = run;
      if (!r || r.asking) return;
      if (r.waiting === "sheet") void share(r);
      else if (r.waiting === "next") void nextPart(r);
    },
    /** Let the run go at once and say nothing: a page that is leaving, or a new Save replacing this one. */
    stop,
    /** Ask whether to stop (the toast's x, and a control that stops a Save under way): the cancel she means. */
    cancel,
    /** Whether a Save is under way (its control is the stop, or the tap that opens the sheet). */
    get busy(): boolean {
      return run !== null;
    },
  };
}

export type TakeHomeSaver = ReturnType<typeof createTakeHomeSaver>;
