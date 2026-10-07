"use client";

/**
 * AN ALBUM'S LIVE ARRIVAL LANDS COMPLETE, OR NOT UNTIL IT CAN (crumbs-23, build 26's red-team: "A live pushed
 * arrival still fades", for the guest's album; crumbs-25 put the same gate over the host's, `HostMediaGrid`,
 * whose arrival was the same shimmer and fade). One grammar for both albums (Will's `landing=sweep`), so the
 * gate lives with the shared components and both albums hand it their own arrivals.
 *
 * The rows lay whatever the album hands them, and a photograph that is COMPLETE when its <img> mounts is shown
 * at once (`MediaTile`, `data-instant`). But nothing had fetched an arrival before the album laid it, and on the
 * paged album it has not even a link yet: a delta brings the manifest's tuple alone (`url: ""`), the link is
 * asked for only once a tile stands in the window (`ensureLinks`), and the tile that stood there first drew a
 * shimmer, then an <img> that faded in over 300ms. (The marketing stage pre-decodes its stills, and there every
 * arrival was instant.)
 *
 * ★ SO AN ARRIVAL WAITS AT THE ALBUM'S DOOR, AND THE ROWS NEVER SEE IT UNTIL IT IS READY. This hook holds every
 * photograph the album's own grammar calls an arrival (`arrivals`: what appeared by itself, never the seed, never
 * this device's own upload, `arrivalMarks`) out of the list the rows lay, asks for its link (`needLinks`), fetches
 * and decodes its photograph into the document (`decodeTileImage`), and lets it in when that is done: the rows
 * then lay a photograph the browser already holds, complete when its <img> exists. The rest of the album, the
 * scroll anchoring and the glide are the rows' own, untouched: to them this is an ordinary local arrival that came
 * a beat later.
 *
 * ★ A BATCH LANDS WHOLE, AT ITS SLOWEST PHOTOGRAPH (guest-moments r1, Will's `batch=settle`). The arrivals one
 * answer brings (a delta of six from the dance floor, a host approving twelve) are one batch, and the batch goes
 * in together once every one of its photographs is ready, so the rows open once and each photograph stands whole
 * in its place from the first frame (`arrival.css`'s settle). Let in one by one as each decoded, the top of the
 * album re-laid six times in a second, and the photograph that was slow came in a beat after its batch.
 *
 * ★ IT NEVER WAITS FOR LONG, NEVER FETCHES MANY (`ARRIVAL_HOLD_MAX`), AND NEVER WAITS FOR WHAT CANNOT COME. A
 * photograph that fails to decode (a dead link, a file no engine draws) is ready at once, and a batch that takes
 * longer than `ARRIVAL_DECODE_WAIT_MS` (a slow link, a hidden tab that decodes nothing) goes in when its wait runs
 * out: a photograph still not drawn then mounts as any tile does, its shimmer then its fade, which is the album as
 * it was. A video with no preview draws no <img> and waits only for its link; reduced motion glides nothing, so it
 * waits for nothing.
 *
 * ★ ONLY WHAT THE ALBUM'S GRAMMAR CALLS AN ARRIVAL IS HELD. A filter's toggle, a step, a resize and the first
 * paint bring photographs the rows lay at once, and none is in `arrivals`; an arrival the Yours filter hides is
 * never held (it is not there to lay), and one that turns out to be this device's own (its landing was noted a
 * beat after the manifest brought it) is let in the moment it is known.
 *
 * ★ THE GLOW IS LIT WHEN THE PHOTOGRAPH LANDS. The provider's own hold started at the delta, so a photograph let
 * in a second later would have had its light cut a second short, mid-fade; this hook lights each arrival for a full
 * `ARRIVAL_GLOW_MS` from the moment it enters the rows. Her own landings (`own`, guest-moments r1's `own=glow`) take
 * the same light the moment they stand, since they are drawn already and never wait.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  decodeTileImage,
  tileImageSrc,
  type GridMedia,
} from "@/components/app/media-grid";
import { ARRIVAL_GLOW_MS, useArrivalMarks } from "@/lib/shared/arrival";

/**
 * How long a batch is held for its links and its photographs, from the moment it is taken in. A preview is tens of
 * kilobytes and its link one small request, so the usual batch is ready in well under a second; two seconds is
 * where a slow phone's arrival stops being worth a wait, and what is not drawn by then lands as it always did,
 * fading in.
 */
export const ARRIVAL_DECODE_WAIT_MS = 2000;

/**
 * The most arrivals fetched at once. A burst (a hidden tab waking to a hundred photographs, a host approving a
 * batch) would otherwise send for every link and every photograph together, six connections deep, ahead of what
 * the guest is looking at; past this many the rest are fetched by nobody here (the window asks their links once it
 * mounts them), and each still waits for its batch, so the batch goes in as one.
 */
export const ARRIVAL_HOLD_MAX = 12;

/** How long a decoded photograph stays referenced after its arrival is let in, for its tile to find. */
const KEEP_DECODED_MS = 5000;

const NONE: readonly string[] = [];

export type Gate = {
  /** Every id this gate has judged, held or not: an id is judged once, when it first appears. */
  known: ReadonlySet<string>;
  /** Arrivals held out of the rows: each batch until its slowest photograph is ready, or its wait is over. */
  waiting: ReadonlySet<string>;
  /** The held arrivals whose photograph is ready, or that nobody here fetches (past the cap). */
  ready: ReadonlySet<string>;
  /** Each held arrival's batch: what one answer brought, let in together. */
  batch: ReadonlyMap<string, number>;
  /** The next batch's number. */
  next: number;
  /** Ids let into the rows (her own as each stood), in the order they went in: the list the glow lights, once each. */
  released: readonly string[];
};

/** One held arrival's work: whether its photograph has been sent for, and the image holding it. */
type Job = { decoding: boolean; image?: HTMLImageElement };

/** Reduced motion glides nothing and fades nothing, so there is nothing to wait for. */
function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** A gate being changed: copies of its parts, written in place, and handed back as the next `Gate`. */
type Draft = {
  known: Set<string>;
  waiting: Set<string>;
  ready: Set<string>;
  batch: Map<string, number>;
  next: number;
  released: string[];
};

function draftOf(gate: Gate): Draft {
  return {
    known: new Set(gate.known),
    waiting: new Set(gate.waiting),
    ready: new Set(gate.ready),
    batch: new Map(gate.batch),
    next: gate.next,
    released: [...gate.released],
  };
}

/** Takes a held arrival out of the gate's books (it went in, or it is no longer there to hold). */
function unhold(d: Draft, id: string) {
  d.waiting.delete(id);
  d.ready.delete(id);
  d.batch.delete(id);
}

/** Lets one held batch in, whole, in the order it was held. */
function letBatchIn(d: Draft, n: number) {
  for (const id of [...d.waiting]) {
    if (d.batch.get(id) !== n) continue;
    unhold(d, id);
    d.released.push(id);
  }
}

/** Lets in every batch whose held arrivals are all ready: its slowest photograph has drawn. */
function letReadyBatchesIn(d: Draft) {
  const held = new Set<number>();
  const unready = new Set<number>();
  for (const id of d.waiting) {
    const n = d.batch.get(id)!;
    held.add(n);
    if (!d.ready.has(id)) unready.add(n);
  }
  for (const n of held) if (!unready.has(n)) letBatchIn(d, n);
}

/**
 * THE GATE'S NEXT STATE for what the album hands it now, or the same object when nothing changed (so the render
 * that stores it settles). Pure: `ids` reads the album's ids and `still` reduced motion, each only when a decision
 * needs it.
 *  - her own landing never waits: one not judged yet is lit the moment it stands in the rows, and one held a beat
 *    earlier as an arrival (the manifest brought it before her landing was noted) goes in at once, lit;
 *  - an arrival never met before is judged once: not among `ids` (the Yours filter hides it) it is passed over,
 *    under reduced motion it goes straight in, else it is held with the rest of its answer, as one batch;
 *  - a held arrival that is no longer an arrival or no longer in the album (hidden, removed) is not held any more,
 *    and a batch whose last unready photograph went that way is let in.
 */
export function advanceGate(
  gate: Gate,
  arrivals: readonly string[],
  own: readonly string[],
  ids: () => ReadonlySet<string>,
  still: () => boolean,
): Gate {
  const fresh = arrivals.filter((id) => !gate.known.has(id));
  const mine = own.filter((id) => !gate.known.has(id) || gate.waiting.has(id));
  let here: ReadonlySet<string> | null = null;
  const asArrival = gate.waiting.size === 0 ? null : new Set(arrivals);
  const dropped =
    asArrival === null
      ? []
      : [...gate.waiting].filter(
          (id) => !asArrival.has(id) || !(here ??= ids()).has(id),
        );
  if (fresh.length === 0 && mine.length === 0 && dropped.length === 0)
    return gate;
  here ??= ids();
  const d = draftOf(gate);
  for (const id of mine) {
    d.known.add(id);
    unhold(d, id);
    if (here.has(id)) d.released.push(id);
  }
  for (const id of dropped) unhold(d, id);
  const calm = fresh.length > 0 && still();
  const n = d.next;
  let took = false;
  for (const id of fresh) {
    if (d.known.has(id)) continue;
    d.known.add(id);
    if (!here.has(id)) continue;
    if (calm) {
      d.released.push(id);
      continue;
    }
    // Past the cap a photograph is fetched by nobody here: it has nothing to wait for but its batch.
    const fetching = d.waiting.size - d.ready.size;
    d.waiting.add(id);
    d.batch.set(id, n);
    if (fetching >= ARRIVAL_HOLD_MAX) d.ready.add(id);
    took = true;
  }
  if (took) d.next = n + 1;
  letReadyBatchesIn(d);
  return d;
}

/** The gate once one held arrival's photograph is ready (decoded, failed, or nothing to decode). */
export function readyIn(gate: Gate, id: string): Gate {
  if (!gate.waiting.has(id) || gate.ready.has(id)) return gate;
  const d = draftOf(gate);
  d.ready.add(id);
  letReadyBatchesIn(d);
  return d;
}

/** The gate once a batch's wait is over: whatever of it is still held goes in as it is. */
export function batchIn(gate: Gate, n: number): Gate {
  if (![...gate.batch.values()].includes(n)) return gate;
  const d = draftOf(gate);
  letBatchIn(d, n);
  return d;
}

export function useArrivalGate<T extends GridMedia>(
  items: T[],
  /** What appeared by itself (`arrivalMarks().arrived`); undefined turns the gate off. */
  arrivals: readonly string[] | undefined,
  /** Asks for these ids' links: the arrivals now held, whose tiles no window has mounted yet. */
  needLinks?: (ids: readonly string[]) => void,
  /** This device's own landings (`arrivalMarks().own`): never held, lit the moment each stands in the rows. */
  own: readonly string[] = NONE,
): { items: T[]; glow: ReadonlySet<string> } {
  const asked = arrivals ?? NONE;
  const [gate, setGate] = useState<Gate>(() => {
    // What already stands when the album first draws (the first photographs of an event, drawn as its opening
    // paint) is the album's own first paint: it glows as before and is never held. Her own standing there too.
    const standing = new Set(items.map((item) => item.id));
    const named = [...asked, ...own];
    return {
      known: new Set(named),
      waiting: new Set(),
      ready: new Set(),
      batch: new Map(),
      next: 0,
      released: named.filter((id) => standing.has(id)),
    };
  });

  // ★ THE DECISION IS MADE IN THE RENDER THE ARRIVAL FIRST APPEARS IN, so the rows never lay it: a hold written a
  // commit later would have let it mount first (the rows' own `data-entering` is written the same way, for the
  // same reason).
  const next = advanceGate(
    gate,
    asked,
    own,
    () => new Set(items.map((item) => item.id)),
    reducedMotion,
  );
  if (next !== gate) setGate(next);

  const markReady = useCallback((id: string) => {
    setGate((prev) => readyIn(prev, id));
  }, []);
  const waitIsOver = useCallback((n: number) => {
    setGate((prev) => batchIn(prev, n));
  }, []);

  // ── the work of a held batch: each photograph's link and decode, and the end of the batch's wait ──
  const jobs = useRef(new Map<string, Job>());
  const clocks = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const kept = useRef(new Set<HTMLImageElement>());
  useEffect(() => {
    const running = jobs.current;
    const ticking = clocks.current;
    if (gate.waiting.size === 0 && running.size === 0 && ticking.size === 0)
      return;
    const held = new Map<string, GridMedia>();
    for (const item of items)
      if (gate.waiting.has(item.id)) held.set(item.id, item);
    const batches = new Set<number>();
    const newcomers: string[] = [];
    for (const id of gate.waiting) {
      const n = gate.batch.get(id)!;
      batches.add(n);
      // One clock a batch, from the moment it was taken in.
      if (!ticking.has(n))
        ticking.set(
          n,
          setTimeout(() => waitIsOver(n), ARRIVAL_DECODE_WAIT_MS),
        );
      // Past the cap (ready from its intake, with no job), nothing is fetched for it here: it waits for its batch.
      let job = running.get(id);
      if (!job) {
        if (gate.ready.has(id)) continue;
        job = { decoding: false };
        running.set(id, job);
        newcomers.push(id);
      }
      const item = held.get(id);
      // Its link has landed: the photograph the tile will draw is known, so fetch and decode it.
      if (item?.url && !job.decoding) {
        job.decoding = true;
        const src = tileImageSrc(item);
        if (src === null) {
          // Nothing to decode (a video's own poster frame): its link was all it waited for.
          void Promise.resolve().then(() => markReady(id));
        } else {
          const { image, ready } = decodeTileImage(src);
          job.image = image;
          void ready.then(() => markReady(id));
        }
      }
    }
    // A batch with nothing left held needs no clock.
    for (const [n, timer] of ticking) {
      if (batches.has(n)) continue;
      clearTimeout(timer);
      ticking.delete(n);
    }
    // Whatever has been let in (or dropped) keeps its decoded photograph a while, for its tile to find.
    for (const [id, job] of running) {
      if (gate.waiting.has(id)) continue;
      running.delete(id);
      const image = job.image;
      if (image) {
        kept.current.add(image);
        setTimeout(() => kept.current.delete(image), KEEP_DECODED_MS);
      }
    }
    if (newcomers.length > 0) needLinks?.(newcomers);
  }, [
    gate.waiting,
    gate.ready,
    gate.batch,
    items,
    needLinks,
    markReady,
    waitIsOver,
  ]);

  // Every wait ends with the album's own view.
  useEffect(() => {
    const ticking = clocks.current;
    const running = jobs.current;
    return () => {
      for (const timer of ticking.values()) clearTimeout(timer);
      ticking.clear();
      running.clear();
    };
  }, []);

  const shown = useMemo(
    () =>
      gate.waiting.size === 0
        ? items
        : items.filter((item) => !gate.waiting.has(item.id)),
    [items, gate.waiting],
  );
  const glow = useArrivalMarks(gate.released, ARRIVAL_GLOW_MS);
  return { items: shown, glow };
}
