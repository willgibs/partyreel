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
 * flight and lets the files go. A file that cannot be read is tried once more and then left out, and said.
 *
 * The engine owns no React: it fetches through `deps.fetch`, shares through `deps.nav`, speaks through the walk's
 * own toast port (`export-toast.tsx`) and reports its state to the caller (`onState`), so its tests stand in for
 * every edge (take-home-save.test.ts).
 */
import type {
  ExportScope,
  ToastPort,
} from "@/components/app/export/export-walk";
import {
  packSheets,
  type SaveItem,
  SHEET_BYTES,
  setNoun,
} from "@/lib/export/take-home";
import { DONE_MS } from "@/lib/export/walk";
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
};

export function createTakeHomeSaver(deps: SaveDeps) {
  let run: Run | null = null;

  const state = (s: SaveState) => deps.onState?.(s);

  /** Let the run go: every read aborted, every file released, the toast gone. */
  function stop() {
    if (!run) return;
    run.abort.abort();
    deps.toast.dismiss(run.id);
    run = null;
    state({ kind: "idle" });
  }

  const close = { label: SAVE_COPY.cancel, run: stop };

  async function ask(
    scope: ExportScope,
    body: Record<string, unknown>,
    signal: AbortSignal,
  ) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await deps.fetch(`/api/export/${scope}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, step: "save" }),
          signal,
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          items?: SaveItem[];
          message?: string;
        } | null;
        if (res.ok && data?.ok && Array.isArray(data.items)) return data.items;
        if (res.status < 500) return { refused: data?.message ?? null };
      } catch {
        if (signal.aborted) return null;
      }
    }
    return { refused: null };
  }

  /** One file, tried twice: a dropped read on a party's network is worth one more go. */
  async function bring(
    item: SaveItem,
    signal: AbortSignal,
    onBytes: (received: number) => void,
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
      onBytes(0);
    }
    return null;
  }

  /** The current part's files into the phone, the toast and the ring counting. */
  async function getPart(r: Run): Promise<void> {
    r.waiting = null;
    const sheet = r.sheets[r.part - 1] ?? [];
    const parts = r.sheets.length;
    const total = sheet.reduce((sum, i) => sum + i.bytes, 0);
    const received = new Map<string, number>();
    const say = () => {
      if (run !== r) return;
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
      deps.toast.show(r.id, {
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
    const lane = async () => {
      while (next < sheet.length && !r.abort.signal.aborted) {
        const index = next++;
        const item = sheet[index];
        files[index] = await bring(item, r.abort.signal, (bytes) => {
          received.set(item.id, bytes);
          say();
        });
        received.set(item.id, item.bytes);
        say();
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, sheet.length) }, lane),
    );
    if (run !== r) return;
    r.missed += files.filter((f) => f === null).length;
    r.files = files.filter((f): f is File => f !== null);
    r.saved.push(...sheet.filter((_, i) => files[i] !== null));
  }

  /** Hand the part's files to the phone's sheet, or wait for the tap that can. */
  async function share(r: Run): Promise<void> {
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
      deps.toast.show(r.id, {
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
      deps.toast.show(r.id, {
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
    deps.toast.show(r.id, {
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
    if (run !== r) return;
    r.part += 1;
    await getPart(r);
    await share(r);
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
    deps.toast.show(r.id, { tone: "done", title, duration: DONE_MS.one });
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
    };
    run = r;
    state({ kind: "asking" });
    deps.toast.show(r.id, { tone: "wait", title: SAVE_COPY.asking, close });
    const answer = await ask(scope, body, r.abort.signal);
    if (run !== r) return;
    if (answer === null) return stop();
    if (!Array.isArray(answer)) {
      deps.toast.show(r.id, {
        tone: "refused",
        title: answer.refused ?? SAVE_COPY.refused,
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
    await getPart(r);
    await share(r);
  }

  return {
    start,
    /**
     * The caller's own control, pressed while a part waits on her: the sheet opens inside this tap, or the next
     * part starts. Pressed while files are still arriving, it does nothing (the toast's x is the stop).
     */
    tap(): void {
      const r = run;
      if (!r) return;
      if (r.waiting === "sheet") void share(r);
      else if (r.waiting === "next") void nextPart(r);
    },
    stop,
    /** Whether a Save is under way (its control is the stop, or the tap that opens the sheet). */
    get busy(): boolean {
      return run !== null;
    },
  };
}

export type TakeHomeSaver = ReturnType<typeof createTakeHomeSaver>;
