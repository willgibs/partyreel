/**
 * THE TAKE — one seeded ORDER of the whole album, per loop.
 *
 * The reel loops the current (not hidden) media of the event's gallery in random order, and a loop
 * includes most or all of it. The randomness is STRUCTURED: each loop is a new seeded take ordered by
 * the quick-add brain (uploader spread, photo and video mix, the newest soon), deterministic per
 * take.
 *
 * ★ THE QUICK-ADD BRAIN IS THE ORDERING FUNCTION, NOT A SECOND ALGORITHM. The score is the brain's
 * own (`quickAddScores`, src/lib/reel/quick-add.ts: likes rank-normalized, recency decayed from the
 * newest, its seeded jitter, its weights) and so is the mix (`quickAddVideoCap`); the take walks the
 * album in PASSES of `TAKE_PASS` under the brain's own rules — a round-robin over uploaders, the
 * strongest first; the video cap relaxed only to fill the pass; at least one video while any remain —
 * so every property the brain guarantees holds LOCALLY, in the part of the loop a viewer is actually
 * watching: no guest appears twice in a pass before every guest has appeared once, a video lands in
 * the first minute, the newest and the most-liked are in the first pass. Writing a second ranker here
 * would have been two brains to keep honest.
 *
 * ★ SCORED ONCE, WALKED WITH A HEAP: O(n log n) FOR THE WHOLE TAKE. The take used to re-run the
 * brain's whole pick over whatever it had not placed yet, pass after pass, re-scoring and re-sorting
 * the remaining pool every time: quadratic, most of a second at 6,000 items (a few milliseconds now),
 * on paths that re-plan on every arrival and at every loop boundary. Now the album is scored ONCE per
 * loop, sorted once and bucketed per uploader once, and a pass pops the uploader rings it needs off a
 * heap keyed by each ring's best remaining score, so a pass costs O(pass · log uploaders). One
 * consequence, on purpose: the score is the LOOP's, so recency runs from the album's newest and likes
 * rank across the whole album, rather than being re-normalized over what is left before every pass
 * (which is where the quadratic lived).
 *
 * ★ AND EACH PASS IS SHUFFLED. With no likes yet the score is dominated by recency, which is the same
 * number on every loop, so pass after pass would place the same twelve AND in the same order: a reel
 * whose whole point is randomizing all the current media would have played the identical film every
 * time round. So each pass is shuffled on the loop's own seed and then de-clumped, which keeps the
 * guarantee the shuffle would otherwise spend: two photographs from the same guest do not sit next to
 * each other while another guest's is available.
 *
 * Pure: no DOM, no React, no clock. Deterministic per (items in that order, eventId, loopIndex).
 */

import { seeded } from "@/lib/reel/engine/seed";
import { quickAddScores, quickAddVideoCap } from "@/lib/reel/quick-add";
import { defaultReelSeed } from "@/lib/reel/seed-default";

import { isReelEligible, type LiveMediaItem } from "./items";

/**
 * How many items one pass of the brain places. The brain's own QUICK_ADD_MAX (12) is tuned for a
 * host's first clip; the take wants the same size for a different reason — a pass is the span over
 * which the coverage guarantee holds, and twelve clips is about half a minute on a wall, which is
 * how long a guest watches before deciding the reel is showing them the party.
 */
export const TAKE_PASS = 12;

/**
 * The seed for anything the live reel plans. ★ It goes through `defaultReelSeed`, which is the
 * repo's one string-to-seed function AND the one place the < 1e6 bound is written down: `seeded()`
 * computes `seed * 2654435761 + index * 40503 + salt * 97`, and a seed anywhere near 2^32 pushes
 * that product past 2^53, where a salt step of 97 falls under the float's own resolution and every
 * motion stream in a clip collapses onto one value. A big hash here would not throw; it would
 * quietly make every reel move the same way.
 */
export function seedFor(...parts: (string | number)[]): number {
  return defaultReelSeed(parts.join("\u0000"));
}

/** The loop's seed: a new take every loop, the same take for everyone on the same loop. */
export function takeSeed(eventId: string, loopIndex: number): number {
  return seedFor(eventId, "loop", loopIndex);
}

/**
 * ★ THE MOTION SEED IS THE SESSION'S, NOT THE LOOP'S. A loop reshuffles the ORDER (`takeSeed`
 * above); the motion (each clip's hold, Ken-Burns and the transition into the next) is drawn from
 * ONE stream for the whole session, indexed by a clip ORDINAL that never resets (source.ts's
 * `startIndex`). That is what lets the clip carried across a loop boundary keep the plan it was
 * already playing: re-seeding the motion per loop would re-roll its pan and zoom under the viewer
 * (a ~5% scale jump at every boundary, and at every handover for an album of six or fewer, where
 * every window IS a boundary). The order still changes every loop; the film simply never restarts.
 */
export function motionSeed(eventId: string): number {
  return seedFor(eventId, "motion");
}

export type TakeOptions = {
  eventId: string;
  loopIndex: number;
  /**
   * The device's OWN media ids ("yours first"): after a guest's first upload the reel on THEIR
   * device leads with their newest item. Reads the approved payload only, so a held first upload
   * never leads — it is not in `items` at all.
   */
  ownIds?: ReadonlySet<string> | null;
  /** Pass size; the harness's knob. */
  pass?: number;
  /**
   * Stop after this many passes (absent: the whole album). ★ A CUT-SHORT TAKE IS THE HEAD OF THE
   * WHOLE ONE, EXACTLY: a pass depends only on what the passes before it placed, and "yours first"
   * still leads with the device's newest own item even when the whole take would only have placed it
   * later, so `passes: 1` is the first `pass` ids of the full take, hoist included. The album tile's
   * six stills need nothing more (src/lib/guest/reel-tile.ts).
   */
  passes?: number;
};

/** The ordered media ids for one loop. Empty when nothing is eligible. */
export function planTake(
  items: readonly LiveMediaItem[],
  opts: TakeOptions,
): string[] {
  // Every eligible item exactly once: a payload that somehow carried an id twice keeps its first.
  const seen = new Set<string>();
  const eligible = items.filter((item) => {
    if (!isReelEligible(item) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  if (eligible.length === 0) return [];

  const pass = Math.max(1, Math.floor(opts.pass ?? TAKE_PASS));
  const passes =
    opts.passes === undefined || Number.isNaN(opts.passes)
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.floor(opts.passes));

  const order = walkPasses(
    eligible,
    takeSeed(opts.eventId, opts.loopIndex),
    pass,
    passes,
  );
  return hoistOwn(order, ownLead(eligible, opts.ownIds));
}

/**
 * One uploader's remaining entries (indices into the eligible list), photos and videos apart and each
 * best first, so "the ring's best", "its best photo" and "its best video" are all a head. `p`/`v` are
 * those heads; an entry taken some other way (the fill, the one-video swap) is skipped lazily.
 */
type Ring = {
  photos: number[];
  videos: number[];
  p: number;
  v: number;
  /** Which heap holds it (none, MIXED or VIDEO_ONLY) and at what position: an O(log U) removal. */
  heap: 0 | 1 | 2;
  at: number;
  /** The entry it is filed under, fixed while it sits in a heap (nothing is taken from it there). */
  key: number;
  /** The last pass that took from it, so a pass re-files each ring it touched exactly once. */
  stamp: number;
};

const MIXED = 1;
const VIDEO_ONLY = 2;

/**
 * THE PASSES, over an album scored once.
 *
 * Two heaps of uploader rings: MIXED (a ring with a photo left, keyed by its best remaining entry)
 * and VIDEO_ONLY (keyed by its best video). Splitting them is what keeps a pass O(pass · log U) when
 * the video cap closes: the brain's lap then skips every ring that has only videos left, and a single
 * heap would have to pop past all of them, pass after pass. A ring leaves its heap the moment
 * anything is taken from it and is re-filed once, under its new best, when the pass ends.
 *
 * Per pass, the brain's own order of business (quick-add.ts's `pickQuickAdd`):
 *  1. LAP ONE: one entry per ring, strongest ring first, honouring the video cap (a capped ring
 *     offers its best photo; a ring with only videos is passed over).
 *  2. LATER LAPS, only when the album has fewer rings than the pass has room: the same rings, in the
 *     same order, again.
 *  3. THE FILL: the cap is a preference, not a wall; a video-heavy album still fills the pass, best
 *     remaining first.
 *  4. ONE VIDEO while any remain: the pass's weakest photo gives its place to the best video left.
 */
function walkPasses(
  eligible: readonly LiveMediaItem[],
  seed: number,
  pass: number,
  passes: number,
): string[] {
  const n = eligible.length;
  // The brain's score, once for the loop. Where the payload carries no like counts (every guest
  // surface) the likes term collapses to zero rather than pretending everything is unloved.
  const score = quickAddScores(eligible, seed);
  /** The brain's total order: higher score first, then payload order. */
  const before = (a: number, b: number) =>
    score[a] > score[b] || (score[a] === score[b] && a < b);

  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => score[b] - score[a] || a - b,
  );

  const isVideo = new Uint8Array(n);
  const ringOf = new Int32Array(n);
  /** An entry's place in its ring's photo (or video) list, for the one-video swap's give-back. */
  const slot = new Int32Array(n);
  const orderAt = new Int32Array(n);
  const rings: Ring[] = [];
  const videoOrder: number[] = [];
  // Rings in the order their best entries rank; nameless legacy uploads (a null key) share ONE ring,
  // exactly as the brain buckets them, so they cannot crowd out named guests.
  const ringFor = new Map<string | null, number>();
  order.forEach((e, k) => {
    orderAt[e] = k;
    const item = eligible[e];
    const uploader = item.uploaderKey ?? null;
    let r = ringFor.get(uploader);
    if (r === undefined) {
      r = rings.length;
      ringFor.set(uploader, r);
      rings.push({
        photos: [],
        videos: [],
        p: 0,
        v: 0,
        heap: 0,
        at: -1,
        key: -1,
        stamp: -1,
      });
    }
    const ring = rings[r];
    ringOf[e] = r;
    if (item.type === "video") {
      isVideo[e] = 1;
      slot[e] = ring.videos.length;
      ring.videos.push(e);
      videoOrder.push(e);
    } else {
      slot[e] = ring.photos.length;
      ring.photos.push(e);
    }
  });

  const taken = new Uint8Array(n);
  const photoHead = (ring: Ring) => {
    while (ring.p < ring.photos.length && taken[ring.photos[ring.p]]) ring.p++;
    return ring.p < ring.photos.length ? ring.photos[ring.p] : -1;
  };
  const videoHead = (ring: Ring) => {
    while (ring.v < ring.videos.length && taken[ring.videos[ring.v]]) ring.v++;
    return ring.v < ring.videos.length ? ring.videos[ring.v] : -1;
  };
  /** What the ring offers now: its best photo while videos are capped, else its best entry. */
  const offer = (ring: Ring, videosOpen: boolean) => {
    const photo = photoHead(ring);
    if (!videosOpen) return photo;
    const video = videoHead(ring);
    if (photo < 0) return video;
    if (video < 0) return photo;
    return before(photo, video) ? photo : video;
  };

  const mixed = ringHeap(MIXED, before);
  const videoOnly = ringHeap(VIDEO_ONLY, before);
  const file = (ring: Ring) => {
    if (photoHead(ring) >= 0) {
      ring.key = offer(ring, true);
      mixed.push(ring);
    } else if (videoHead(ring) >= 0) {
      ring.key = videoHead(ring);
      videoOnly.push(ring);
    }
  };
  for (const ring of rings) file(ring);

  // The fill's and the swap's views: the whole album and its videos, best first, heads skipped lazily.
  let orderHead = 0;
  const nextBest = () => {
    while (orderHead < n && taken[order[orderHead]]) orderHead++;
    return orderHead < n ? order[orderHead] : -1;
  };
  let videoAt = 0;
  const nextVideo = () => {
    while (videoAt < videoOrder.length && taken[videoOrder[videoAt]]) videoAt++;
    return videoAt < videoOrder.length ? videoOrder[videoAt] : -1;
  };

  const who = (e: number) => eligible[e].uploaderKey ?? null;
  const out: string[] = [];
  let remaining = n;

  for (let passIndex = 0; remaining > 0 && passIndex < passes; passIndex++) {
    const count = Math.min(pass, remaining);
    const cap = quickAddVideoCap(count);
    const picks: number[] = [];
    const touched: Ring[] = [];
    let videos = 0;

    const touch = (ring: Ring) => {
      if (ring.heap === MIXED) mixed.remove(ring);
      else if (ring.heap === VIDEO_ONLY) videoOnly.remove(ring);
      if (ring.stamp !== passIndex) {
        ring.stamp = passIndex;
        touched.push(ring);
      }
    };
    const take = (e: number) => {
      taken[e] = 1;
      picks.push(e);
      if (isVideo[e]) videos += 1;
    };

    // 1. Lap one.
    const lap: Ring[] = [];
    while (picks.length < count) {
      const open = videos < cap;
      const m = mixed.peek();
      const v = open ? videoOnly.peek() : undefined;
      const ring = !v ? m : !m ? v : before(m.key, v.key) ? m : v;
      if (!ring) break;
      touch(ring);
      lap.push(ring);
      take(offer(ring, open));
    }

    // 2. Later laps (lap one ran out of rings before the pass was full).
    for (let progressed = true; progressed && picks.length < count; ) {
      progressed = false;
      for (const ring of lap) {
        if (picks.length >= count) break;
        const e = offer(ring, videos < cap);
        if (e < 0) continue;
        take(e);
        progressed = true;
      }
    }

    // 3. The fill.
    while (picks.length < count) {
      const e = nextBest();
      if (e < 0) break;
      touch(rings[ringOf[e]]);
      take(e);
    }

    // 4. One video. A reel of only stills from an event full of clips reads as broken.
    if (videos === 0) {
      const video = nextVideo();
      let weakest = -1;
      for (let k = 0; video >= 0 && k < picks.length; k++) {
        if (isVideo[picks[k]]) continue;
        if (weakest < 0 || before(picks[weakest], picks[k])) weakest = k;
      }
      if (weakest >= 0) {
        // The photo goes back, at its own place: its ring's head and the album's (every photo its
        // ring placed this pass was stronger, so the head is exactly where it stood).
        const back = picks[weakest];
        taken[back] = 0;
        const home = rings[ringOf[back]];
        home.p = Math.min(home.p, slot[back]);
        orderHead = Math.min(orderHead, orderAt[back]);
        touch(home);
        touch(rings[ringOf[video]]);
        taken[video] = 1;
        picks[weakest] = video;
        videos = 1;
      }
    }

    if (picks.length === 0) {
      // Defensive: every ring with anything left is filed at a pass's start, so a pass always
      // places something, and an empty one would spin for ever. Place what is left in payload order.
      for (let e = 0; e < n; e++) if (!taken[e]) out.push(eligible[e].id);
      break;
    }
    for (const ring of touched) file(ring);
    remaining -= picks.length;
    // A fresh stream per pass: one seed for the whole loop would hand every pass the same tie
    // breaks, which is how a "random" order grows a rhythm you can hear.
    for (const e of spreadPass(picks, who, seedFor(seed, "pass", passIndex))) {
      out.push(eligible[e].id);
    }
  }

  return out;
}

/** An indexed binary heap of rings, best key first (the brain's own order), with removal. */
function ringHeap(id: 1 | 2, before: (a: number, b: number) => boolean) {
  const items: Ring[] = [];
  const less = (i: number, j: number) => before(items[i].key, items[j].key);
  const swap = (i: number, j: number) => {
    const t = items[i];
    items[i] = items[j];
    items[j] = t;
    items[i].at = i;
    items[j].at = j;
  };
  const up = (i: number) => {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!less(i, parent)) return;
      swap(i, parent);
      i = parent;
    }
  };
  const down = (i: number) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let best = i;
      if (l < items.length && less(l, best)) best = l;
      if (r < items.length && less(r, best)) best = r;
      if (best === i) return;
      swap(i, best);
      i = best;
    }
  };
  return {
    peek: (): Ring | undefined => items[0],
    push(ring: Ring) {
      ring.heap = id;
      ring.at = items.length;
      items.push(ring);
      up(ring.at);
    },
    remove(ring: Ring) {
      const i = ring.at;
      const last = items.pop()!;
      ring.heap = 0;
      ring.at = -1;
      if (last === ring) return;
      items[i] = last;
      last.at = i;
      up(i);
      down(last.at);
    },
  };
}

/** Independent seeded streams for the shuffle, so it never correlates with the brain's own. */
const SALT_SHUFFLE = 71;

/**
 * A pass, shuffled on the loop's seed and then de-clumped. The shuffle is what makes a loop a new
 * take; the de-clump is what stops the shuffle from spending the brain's coverage guarantee, which
 * is the one property that makes the reel feel like the party rather than like one phone.
 */
function spreadPass(
  picks: readonly number[],
  who: (e: number) => string | null,
  seed: number,
): number[] {
  const out = [...picks];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(seed, i, SALT_SHUFFLE) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  for (let i = 1; i < out.length; i++) {
    if (who(out[i]) === null || who(out[i]) !== who(out[i - 1])) continue;
    const swap = out.findIndex((e, k) => k > i && who(e) !== who(out[i - 1]));
    if (swap > i) [out[i], out[swap]] = [out[swap], out[i]];
  }
  return out;
}

/**
 * "Yours first": the guest's NEWEST approved item, which opens the loop on their own device.
 * Newest rather than any of theirs, because the beat it serves is "the photograph you just added is
 * in the reel"; an older one of theirs would read as coincidence. Chosen from the whole album rather
 * than from the order, so a take cut short (`passes`) leads with the same item the whole one does;
 * two items of theirs from the same millisecond go to the payload's first. An unknown timestamp
 * still qualifies, but only if nothing dated does.
 */
function ownLead(
  eligible: readonly LiveMediaItem[],
  ownIds: ReadonlySet<string> | null | undefined,
): string | null {
  if (!ownIds || ownIds.size === 0) return null;
  let leadId: string | null = null;
  let leadTime = Number.NEGATIVE_INFINITY;
  for (const item of eligible) {
    if (!ownIds.has(item.id)) continue;
    const parsed = Date.parse(item.createdAt ?? "");
    const time = Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
    if (leadId === null || time > leadTime) {
      leadId = item.id;
      leadTime = time;
    }
  }
  return leadId;
}

/**
 * The lead to the front, everything else in its order. When a cut-short take had not placed it yet
 * it displaces the last id, so the take keeps its length: exactly the head of the whole take.
 */
function hoistOwn(order: string[], leadId: string | null): string[] {
  if (leadId === null || order.length === 0 || order[0] === leadId) {
    return order;
  }
  return [leadId, ...order.filter((id) => id !== leadId)].slice(
    0,
    order.length,
  );
}
