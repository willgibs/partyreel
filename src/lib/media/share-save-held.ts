/**
 * THE HELD ORIGINAL (save-speed, 2026-10-02): a photograph's original, downloaded
 * ONCE as bytes when the viewer draws it, then both drawn (an object URL) and
 * handed to Save and Share as a file in hand.
 *
 * ★ WHY IT EXISTS: WILL'S 30 SECONDS. Save on his iPhone sat on "preparing" for
 * about 30 s, then asked for a second tap. Measured on the alias, the wait was
 * the Save's own file: a second download of the original the viewer had just
 * drawn (a CORS read with `cache: "no-store"`, so the drawn copy could never
 * serve it), started only on the tap, on the same six HTTP/1.1 connections to R2
 * as everything the viewer was loading (R2's S3 endpoint speaks HTTP/1.1 only,
 * and iOS buffers the next clip whole even at `preload="metadata"`), while the
 * system sheet needs the tap's activation, which WebKit keeps five seconds
 * (measured 5,023 ms). Held, the bytes are already here when the tap comes, the
 * sheet opens inside the tap, and nothing is downloaded twice.
 *
 * ★ THE PHOTOGRAPH ON SCREEN FIRST. A `high` want (the photograph in the middle)
 * starts at once; a `low` one (a neighbour the swipe track draws) waits until no
 * `high` one is loading, at most `LOW_AT_ONCE` together, so on a slow link the
 * photograph being looked at, and so its Save, gets the bandwidth.
 *
 * ★ ONLY WHAT IS DRAWN, ONLY WHILE IT IS DRAWN. A want is a reference: the
 * viewer's slot holds it while it draws the photograph and lets it go when it
 * leaves; an unreferenced download is aborted after a short grace (a slot that
 * re-mounts in the same breath keeps it), and an unreferenced held file stays
 * for a later visit inside a byte budget, oldest out first, its object URL
 * revoked as it goes.
 *
 * ★ ANYTHING IT CANNOT HOLD IS `plain`, AND PLAIN IS WHAT THE VIEWER ALWAYS DID:
 * the <img> draws the link and Save fetches on its tap. An original over
 * `maxItemBytes`, a stalled body, a refusal. R2 refuses a CORS read from an
 * origin outside its allow-list (localhost, for one: testing-verification.md),
 * so two refusals of unexpired links before any read has succeeded turn the
 * store off for the page, and every later photograph goes straight to plain.
 *
 * Pure: `fetch`, the object-URL pair, the clock and the timers arrive as
 * arguments, so the whole lifecycle is unit-tested in the node project.
 */
import {
  FETCH_STALL_MS,
  fetchMediaFile,
  type FetchFailure,
} from "@/lib/media/share-save";

/** What the viewer may draw and the capsule may send for one photograph. */
export type Held =
  /** Asked for, queued behind the photograph on screen. */
  | { readonly kind: "waiting" }
  /** Coming: bytes so far and the whole, once the answer declared it. */
  | {
      readonly kind: "loading";
      readonly received: number;
      readonly total: number | null;
    }
  /** Here: the file to send and the object URL to draw. */
  | { readonly kind: "held"; readonly file: File; readonly src: string }
  /** Not held, and not going to be: draw the link, fetch on the tap. */
  | { readonly kind: "plain" };

export type HoldPriority = "high" | "low";

export type HeldStore = {
  /**
   * Hold this photograph's original (by media id; a re-minted link is the same
   * object). Returns the release, which the caller must call when it stops
   * drawing it.
   */
  want(
    id: string,
    url: string,
    opts: { priority: HoldPriority; name: string },
  ): () => void;
  /** Its state, or null when nobody asked. Stable between changes. */
  get(id: string): Held | null;
  subscribe(listener: () => void): () => void;
  /** The file once held; null once it never will be (plain, let go, or `signal`). */
  whenHeld(id: string, signal?: AbortSignal): Promise<File | null>;
};

export const PLAIN: Held = Object.freeze({ kind: "plain" });
export const WAITING: Held = Object.freeze({ kind: "waiting" });

/** Above this an original is drawn and saved the plain way (a phone holds three at once). */
export const HELD_MAX_ITEM_BYTES = 32 * 1024 * 1024;
/** What held-but-unused originals may keep in memory, all told. */
export const HELD_BUDGET_BYTES = 64 * 1024 * 1024;
/** And how many of them, whatever their size. */
export const HELD_MAX_UNUSED = 24;
/** Neighbours downloading at once, and only while the photograph on screen is not. */
export const LOW_AT_ONCE = 2;
/** How long an unreferenced download survives (a re-mount in the same breath keeps it). */
export const RELEASE_GRACE_MS = 400;
/** The quickest a download's progress repaints its button. */
export const PROGRESS_EVERY_MS = 100;

type Timer = ReturnType<typeof setTimeout>;

export type HeldDeps = {
  fetch: typeof fetch;
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => Timer;
  clearTimeout?: (t: Timer) => void;
  maxItemBytes?: number;
  budgetBytes?: number;
  maxUnused?: number;
  stallMs?: number;
};

type Entry = {
  id: string;
  url: string;
  name: string;
  /** High while any slot holds it in the middle; low once only neighbours do. */
  priority: HoldPriority;
  state: Held;
  refs: number;
  highRefs: number;
  ctl: AbortController | null;
  /** Why it went plain: too big stays known past the visit, anything else is asked afresh. */
  why: FetchFailure | "large" | "off" | null;
  lastUsed: number;
  lastPaint: number;
  grace: Timer | null;
  waiters: Set<(file: File | null) => void>;
};

/**
 * A presign's own expiry, read off its query (`X-Amz-Date` + `X-Amz-Expires`),
 * with a minute's slack for a phone's clock. An expired presign answers a bare
 * 403 that a CORS read cannot tell from a refusal, so it never counts as one.
 */
export function presignExpired(url: string, nowMs: number): boolean {
  try {
    const q = new URL(url).searchParams;
    const date = q.get("X-Amz-Date");
    const ttl = Number(q.get("X-Amz-Expires"));
    if (!date || !Number.isFinite(ttl)) return false;
    const m = date.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return false;
    const signed = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    return nowMs > signed + ttl * 1000 - 60_000;
  } catch {
    return false;
  }
}

export function createHeldStore(deps: HeldDeps): HeldStore {
  const now = deps.now ?? (() => Date.now());
  const later = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = deps.clearTimeout ?? ((t) => clearTimeout(t));
  const maxItemBytes = deps.maxItemBytes ?? HELD_MAX_ITEM_BYTES;
  const budgetBytes = deps.budgetBytes ?? HELD_BUDGET_BYTES;
  const maxUnused = deps.maxUnused ?? HELD_MAX_UNUSED;
  const stallMs = deps.stallMs ?? FETCH_STALL_MS;

  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let refusals = 0;
  let successes = 0;
  let off = false;

  const emit = () => {
    for (const l of [...listeners]) l();
  };

  const settle = (e: Entry, file: File | null) => {
    for (const w of [...e.waiters]) w(file);
    e.waiters.clear();
  };

  const goPlain = (e: Entry, why: Entry["why"]) => {
    e.state = PLAIN;
    e.why = why;
    e.ctl = null;
    settle(e, null);
  };

  const forget = (e: Entry) => {
    e.ctl?.abort();
    e.ctl = null;
    if (e.grace) cancel(e.grace);
    if (e.state.kind === "held") deps.revokeObjectURL(e.state.src);
    settle(e, null);
    entries.delete(e.id);
  };

  /** Held but drawn by nobody: oldest out first, past the budget or the count. */
  const evict = () => {
    const unused = [...entries.values()]
      .filter((e) => e.refs === 0 && e.state.kind === "held")
      .sort((a, b) => a.lastUsed - b.lastUsed);
    let bytes = unused.reduce(
      (n, e) => n + (e.state.kind === "held" ? e.state.file.size : 0),
      0,
    );
    let count = unused.length;
    for (const e of unused) {
      if (bytes <= budgetBytes && count <= maxUnused) break;
      bytes -= e.state.kind === "held" ? e.state.file.size : 0;
      count -= 1;
      forget(e);
    }
  };

  const loading = (p: HoldPriority) =>
    [...entries.values()].filter(
      (e) => e.priority === p && e.state.kind === "loading",
    ).length;

  /** Start what may start: every high want, and lows while no high is loading. */
  const pump = () => {
    for (const e of entries.values())
      if (e.state.kind === "waiting" && e.priority === "high") start(e);
    if (loading("high") > 0) return;
    for (const e of entries.values()) {
      if (loading("low") >= LOW_AT_ONCE) break;
      if (e.state.kind === "waiting") start(e);
    }
  };

  // ★ A NEIGHBOUR ASKS A BREATH LATER. A commit mounts its slots in track order,
  // so the left neighbour's want lands before the centre's: started at once, it
  // would take the bandwidth the photograph on screen is owed. Lows are pumped
  // on a microtask, after every want of the same commit has landed.
  let pumpQueued = false;
  const pumpSoon = () => {
    if (pumpQueued) return;
    pumpQueued = true;
    queueMicrotask(() => {
      pumpQueued = false;
      pump();
      emit();
    });
  };

  const start = (e: Entry) => {
    const ctl = new AbortController();
    e.ctl = ctl;
    e.state = { kind: "loading", received: 0, total: null };
    e.lastPaint = now();
    const url = e.url;
    void fetchMediaFile(url, e.name, {
      fetch: deps.fetch,
      signal: ctl.signal,
      maxBytes: maxItemBytes,
      priority: e.priority,
      stallMs,
      onProgress: (received, total) => {
        if (e.ctl !== ctl) return;
        const t = now();
        const first = e.state.kind === "loading" && e.state.total !== total;
        if (!first && t - e.lastPaint < PROGRESS_EVERY_MS) return;
        e.lastPaint = t;
        e.state = { kind: "loading", received, total };
        emit();
      },
    }).then((got) => {
      // Let go while it ran, or the store turned off: not ours to settle.
      if (e.ctl !== ctl || entries.get(e.id) !== e) return;
      if (got.kind === "file") {
        successes += 1;
        e.ctl = null;
        e.why = null;
        e.state = {
          kind: "held",
          file: got.file,
          src: deps.createObjectURL(got.file),
        };
        e.lastUsed = now();
        settle(e, got.file);
      } else if (got.kind === "too-large") {
        goPlain(e, "large");
      } else if (got.kind === "failed") {
        const why = got.why ?? "refused";
        if (why === "refused" && !presignExpired(url, now())) {
          refusals += 1;
          if (refusals >= 2 && successes === 0) turnOff();
        }
        goPlain(e, why);
      } else {
        goPlain(e, null);
      }
      evict();
      pump();
      emit();
    });
  };

  /** The page's origin cannot read R2: everything not already held goes plain. */
  const turnOff = () => {
    off = true;
    for (const e of entries.values()) {
      if (e.state.kind === "held") continue;
      e.ctl?.abort();
      goPlain(e, "off");
    }
  };

  const release = (e: Entry, priority: HoldPriority) => {
    e.refs -= 1;
    if (priority === "high") e.highRefs -= 1;
    e.priority = e.highRefs > 0 ? "high" : "low";
    if (e.refs > 0) return;
    e.lastUsed = now();
    if (e.state.kind === "held") {
      // After the commit: a slot that re-mounts in the same breath (a swipe
      // moving it out of the middle) holds it again before anything is evicted.
      queueMicrotask(evict);
      return;
    }
    // Waiting, loading or plain: a short grace (a slot re-mounting in the same
    // breath keeps it), then a download goes and a plain answer is forgotten, so
    // the next visit asks afresh. Too big stays known: asking would only learn it
    // again.
    e.grace = later(() => {
      e.grace = null;
      if (e.refs > 0 || entries.get(e.id) !== e) return;
      if (e.state.kind === "plain" && e.why === "large") return;
      forget(e);
      pump();
      emit();
    }, RELEASE_GRACE_MS);
  };

  return {
    want(id, url, { priority, name }) {
      if (off) return () => {};
      let e = entries.get(id);
      if (!e) {
        e = {
          id,
          url,
          name,
          priority,
          state: WAITING,
          refs: 0,
          highRefs: 0,
          ctl: null,
          why: null,
          lastUsed: now(),
          lastPaint: 0,
          grace: null,
          waiters: new Set(),
        };
        entries.set(id, e);
      }
      const entry = e;
      entry.refs += 1;
      if (entry.grace) {
        cancel(entry.grace);
        entry.grace = null;
      }
      if (priority === "high") entry.highRefs += 1;
      entry.priority = entry.highRefs > 0 ? "high" : "low";
      // ★ A PLAIN ANSWER STANDS FOR THE VISIT. A re-minted link re-runs the slot's
      // effect (a release and a want in one breath) and must not send a photograph
      // already drawn plain back to waiting: its picture would blink out while
      // the bytes came again. The next visit, past the grace, asks afresh.
      entry.url = url;
      if (entry.priority === "high") pump();
      else pumpSoon();
      emit();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        release(entry, priority);
      };
    },
    get(id) {
      const e = entries.get(id);
      if (e) return e.state;
      return off ? PLAIN : null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    whenHeld(id, signal) {
      const e = entries.get(id);
      if (!e || e.state.kind === "plain") return Promise.resolve(null);
      if (e.state.kind === "held") return Promise.resolve(e.state.file);
      if (signal?.aborted) return Promise.resolve(null);
      return new Promise((resolve) => {
        const done = (file: File | null) => {
          signal?.removeEventListener("abort", stop);
          resolve(file);
        };
        const stop = () => {
          e.waiters.delete(done);
          resolve(null);
        };
        e.waiters.add(done);
        signal?.addEventListener("abort", stop);
      });
    },
  };
}

let browserStore: HeldStore | null | undefined;

/**
 * THE PAGE'S STORE, where this browser can hold: an object URL to draw from, a
 * readable body to count, and `navigator.userActivation`, the one way to know
 * whether a tap's activation is still alive, which is what holding is for. A
 * browser with none of those (and jsdom, which has no `userActivation`) keeps
 * the plain path, which is what it always had.
 */
export function browserHeldStore(): HeldStore | null {
  if (browserStore !== undefined) return browserStore;
  const able =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "userActivation" in navigator &&
    typeof URL.createObjectURL === "function" &&
    typeof ReadableStream === "function" &&
    typeof fetch === "function";
  browserStore = able
    ? createHeldStore({
        fetch: (input, init) => fetch(input, init),
        createObjectURL: (blob) => URL.createObjectURL(blob),
        revokeObjectURL: (url) => URL.revokeObjectURL(url),
      })
    : null;
  return browserStore;
}
