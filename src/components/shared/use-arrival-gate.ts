"use client";

/**
 * AN ALBUM'S LIVE ARRIVAL LANDS COMPLETE, OR NOT UNTIL IT CAN (crumbs-23, build 26's red-team: "A live pushed
 * arrival still fades", for the guest's album; crumbs-25 put the same gate over the host's, `HostMediaGrid`,
 * whose arrival was the same shimmer and fade). One grammar for both albums (Will's `landing=sweep`), so the
 * gate lives with the shared components and both albums hand it their own arrivals.
 *
 * Will's `arrival=push`: "The row opens: the photo is revealed from its left edge while its neighbours
 * glide aside on the same beat. Nothing fades; it reads as inserted." The rows push whatever the album
 * hands them, and a photograph that is COMPLETE when its <img> mounts is shown at once (`MediaTile`,
 * `data-instant`), so the push reveals a photograph. But nothing had fetched an arrival before the album
 * pushed it, and on the paged album it has not even a link yet: a delta brings the manifest's tuple alone
 * (`url: ""`), the link is asked for only once a tile stands in the window (`ensureLinks`), and the tile
 * that stood there first drew a shimmer, then an <img> that faded in over 300ms after the wipe was over.
 * (The marketing stage pre-decodes its stills, and there every arrival was instant.)
 *
 * ★ SO AN ARRIVAL WAITS AT THE ALBUM'S DOOR, AND THE ROWS NEVER SEE IT UNTIL IT IS READY. This hook holds
 * every photograph the album's own grammar calls an arrival (`arrivals`: what appeared by itself, never
 * the seed, never this device's own upload, `arrivalMarks`) out of the list the rows lay, asks for its
 * link (`needLinks`), fetches and decodes its photograph into the document (`decodeTileImage`), and lets
 * it in when that is done: the rows then push a photograph the browser already holds, complete when its
 * <img> exists. The rest of the album, the scroll anchoring and the glide are the rows' own, untouched:
 * to them this is an ordinary local arrival that came a beat later.
 *
 * ★ IT NEVER WAITS FOR LONG, AND NEVER FOR MANY (`ARRIVAL_HOLD_MAX`), NOR FOR ANYTHING THAT CANNOT COME. A photograph that fails to decode
 * (a dead link, a file no engine draws) is let in at once, and one that takes longer than
 * `ARRIVAL_DECODE_WAIT_MS` (a slow link, a photograph with no preview, a hidden tab that decodes
 * nothing) is let in when the wait runs out: either mounts as any tile does, its shimmer then its fade,
 * which is the album as it was. A video with no preview draws no <img> and waits only for its link;
 * reduced motion pushes nothing and fades nothing, so it waits for nothing.
 *
 * ★ ONLY WHAT THE ALBUM'S GRAMMAR CALLS AN ARRIVAL IS HELD. A filter's toggle, a step, a resize and the
 * first paint bring photographs the rows lay at once, and none is in `arrivals`; an arrival the Yours
 * filter hides is never held (it is not there to push), and one that turns out to be this device's own
 * (its landing was noted a beat after the manifest brought it) is let in the moment it is known.
 *
 * ★ THE GLOW IS LIT WHEN THE PHOTOGRAPH LANDS. The provider's own hold started at the delta, so a
 * photograph let in a second later would have had its light cut a second short, mid-fade; this hook
 * lights each arrival for a full `ARRIVAL_GLOW_MS` from the moment it enters the rows.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  decodeTileImage,
  tileImageSrc,
  type GridMedia,
} from "@/components/app/media-grid";
import { ARRIVAL_GLOW_MS, useArrivalMarks } from "@/lib/shared/arrival";

/**
 * How long an arrival is held for its link and its photograph, from the moment it is taken in. A preview
 * is tens of kilobytes and its link one small request, so the usual arrival is ready in well under a
 * second; two seconds is where a slow phone's arrival stops being worth a wait, and it lands as it always
 * did, fading in.
 */
export const ARRIVAL_DECODE_WAIT_MS = 2000;

/**
 * The most arrivals held at once. A burst (a hidden tab waking to a hundred photographs, a host approving a
 * batch) would otherwise send for every link and every photograph together, six connections deep, ahead of
 * what the guest is looking at; past this many the rest are let straight in, as they were before the gate,
 * and the rows push them together.
 */
export const ARRIVAL_HOLD_MAX = 12;

/** How long a decoded photograph stays referenced after its arrival is let in, for its tile to find. */
const KEEP_DECODED_MS = 5000;

const NONE: readonly string[] = [];

export type Gate = {
  /** Every arrival this gate has taken in, held or not: an id is judged once, when it first appears. */
  known: ReadonlySet<string>;
  /** Arrivals held out of the rows until their photograph is ready (or they have waited long enough). */
  waiting: ReadonlySet<string>;
  /** Arrivals let into the rows, in the order they went in: the list the glow lights, once each. */
  released: readonly string[];
};

/** One held arrival's work: its clock, and whether its photograph has been sent for. */
type Job = {
  timer: ReturnType<typeof setTimeout>;
  decoding: boolean;
  image?: HTMLImageElement;
};

/** Reduced motion pushes nothing and fades nothing, so there is nothing to wait for. */
function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * THE GATE'S NEXT STATE for what the album hands it now, or the same object when nothing changed (so
 * the render that stores it settles). Pure: `ids` reads the album's ids and `still` reduced motion, each
 * only when a decision needs it.
 *  - an arrival never met before is judged once: not among `ids` (the Yours filter hides it) it is
 *    passed over, under reduced motion it goes straight in, else it is held;
 *  - a held arrival that is no longer an arrival (this device's own landing, noted after the manifest
 *    brought it) or no longer in the album (hidden, removed) is not held for any more.
 */
export function advanceGate(
  gate: Gate,
  arrivals: readonly string[],
  ids: () => ReadonlySet<string>,
  still: () => boolean,
): Gate {
  const fresh = arrivals.filter((id) => !gate.known.has(id));
  let here: ReadonlySet<string> | null = null;
  const dropped =
    gate.waiting.size === 0
      ? []
      : [...gate.waiting].filter(
          (id) => !arrivals.includes(id) || !(here ??= ids()).has(id),
        );
  if (fresh.length === 0 && dropped.length === 0) return gate;
  here ??= ids();
  const known = new Set(gate.known);
  const waiting = new Set(gate.waiting);
  const released = [...gate.released];
  for (const id of dropped) waiting.delete(id);
  const calm = fresh.length > 0 && still();
  for (const id of fresh) {
    known.add(id);
    if (!here.has(id)) continue;
    if (calm || waiting.size >= ARRIVAL_HOLD_MAX) released.push(id);
    else waiting.add(id);
  }
  return { known, waiting, released };
}

export function useArrivalGate<T extends GridMedia>(
  items: T[],
  /** What appeared by itself (`arrivalMarks().arrived`); undefined turns the gate off. */
  arrivals: readonly string[] | undefined,
  /** Asks for these ids' links: the arrivals now held, whose tiles no window has mounted yet. */
  needLinks?: (ids: readonly string[]) => void,
): { items: T[]; glow: ReadonlySet<string> } {
  const asked = arrivals ?? NONE;
  const [gate, setGate] = useState<Gate>(() => ({
    // An arrival already standing when the album first draws (the first photographs of an event, drawn
    // as its opening paint) is the album's own first paint: it glows as before and is never held.
    known: new Set(asked),
    waiting: new Set(),
    released: asked.filter((id) => items.some((item) => item.id === id)),
  }));

  // ★ THE DECISION IS MADE IN THE RENDER THE ARRIVAL FIRST APPEARS IN, so the rows never lay it: a hold
  // written a commit later would have let it mount first (the rows' own `data-entering` is written the
  // same way, for the same reason).
  const next = advanceGate(
    gate,
    asked,
    () => new Set(items.map((item) => item.id)),
    reducedMotion,
  );
  if (next !== gate) setGate(next);

  const letIn = useCallback((id: string) => {
    setGate((prev) => {
      if (!prev.waiting.has(id)) return prev;
      const waiting = new Set(prev.waiting);
      waiting.delete(id);
      return { ...prev, waiting, released: [...prev.released, id] };
    });
  }, []);

  // ── the work of a held arrival: its link, its photograph, and the end of its wait ──
  const jobs = useRef(new Map<string, Job>());
  const kept = useRef(new Set<HTMLImageElement>());
  useEffect(() => {
    const running = jobs.current;
    if (gate.waiting.size === 0 && running.size === 0) return;
    const held = new Map<string, GridMedia>();
    for (const item of items)
      if (gate.waiting.has(item.id)) held.set(item.id, item);
    const newcomers: string[] = [];
    for (const id of gate.waiting) {
      let job = running.get(id);
      if (!job) {
        job = {
          timer: setTimeout(() => letIn(id), ARRIVAL_DECODE_WAIT_MS),
          decoding: false,
        };
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
          void Promise.resolve().then(() => letIn(id));
        } else {
          const { image, ready } = decodeTileImage(src);
          job.image = image;
          void ready.then(() => letIn(id));
        }
      }
    }
    // Whatever has been let in (or dropped) keeps its decoded photograph a while, for its tile to find.
    for (const [id, job] of running) {
      if (gate.waiting.has(id)) continue;
      clearTimeout(job.timer);
      running.delete(id);
      const image = job.image;
      if (image) {
        kept.current.add(image);
        setTimeout(() => kept.current.delete(image), KEEP_DECODED_MS);
      }
    }
    if (newcomers.length > 0) needLinks?.(newcomers);
  }, [gate.waiting, items, needLinks, letIn]);

  // Every wait ends with the album's own view.
  useEffect(() => {
    const running = jobs.current;
    return () => {
      for (const job of running.values()) clearTimeout(job.timer);
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
