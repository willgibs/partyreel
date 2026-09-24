/**
 * THE TAKE — one seeded ORDER of the whole album, per loop.
 *
 * The reel loops the current (not hidden) media of the event's gallery in random order, and a loop
 * includes most or all of it. The randomness is STRUCTURED: each loop is a new seeded take from
 * the quick-add brain (uploader spread, photo and video mix, the newest soon), deterministic per
 * take.
 *
 * ★ THE QUICK-ADD BRAIN IS THE ORDERING FUNCTION, NOT A SECOND ALGORITHM. `pickQuickAdd`
 * (src/lib/reel/quick-add.ts) already blends likes, recency, per-uploader coverage and the photo/
 * video mix, and it already refuses Math.random. A live reel needs an ORDER over everything rather
 * than a PICK of twelve, so the take runs the same brain repeatedly over what it has not placed yet:
 * each pass is a quick-add over the remaining pool, and the passes concatenate. Every property the
 * brain guarantees therefore holds locally, in the part of the loop a viewer is actually watching —
 * no guest appears twice before every guest has appeared once, a video lands in the first minute,
 * the newest and the most-liked are in the first pass — instead of being a property of a list nobody
 * watches end to end. Writing a second ranker here would have been two brains to keep honest.
 *
 * ★ AND THE PASS IS SHUFFLED, not chronological. The brain returns its pick in time order, because a
 * host's first cut should read as the night's story; a LOOP cannot. With no likes yet, the brain's
 * score is dominated by recency, which is the same number on every loop, so pass after pass would
 * pick the same twelve AND print them in the same order — a reel whose whole point is randomizing
 * all the current media would have played the identical film every time round. So each pass is
 * shuffled on the loop's own seed and then de-clumped, which keeps the guarantee the shuffle would
 * otherwise spend: two photographs from the same guest do not sit next to each other while another
 * guest's is available.
 *
 * Pure: no DOM, no React, no clock. Deterministic per (items in that order, eventId, loopIndex).
 */

import { seeded } from "@/lib/reel/engine/seed";
import { pickQuickAdd, type QuickAddCandidate } from "@/lib/reel/quick-add";
import { defaultReelSeed } from "@/lib/reel/seed-default";

import { isReelEligible, type LiveMediaItem } from "./items";

/**
 * How many items one pass of the brain places. The brain's own QUICK_ADD_MAX (12) is tuned for a
 * host's first cut; the take wants the same size for a different reason — a pass is the span over
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
};

/** The ordered media ids for one loop. Empty when nothing is eligible. */
export function planTake(
  items: readonly LiveMediaItem[],
  opts: TakeOptions,
): string[] {
  const eligible = items.filter(isReelEligible);
  if (eligible.length === 0) return [];

  const seed = takeSeed(opts.eventId, opts.loopIndex);
  const pass = Math.max(1, opts.pass ?? TAKE_PASS);

  const byId = new Map(eligible.map((item) => [item.id, item]));
  let pool: LiveMediaItem[] = eligible;
  const order: string[] = [];

  for (let passIndex = 0; pool.length > 0; passIndex++) {
    // A fresh stream per pass: one seed for the whole loop would hand every pass the same tie
    // breaks, which is how a "random" order grows a rhythm you can hear.
    const passSeed = seedFor(seed, "pass", passIndex);
    const pick = pickQuickAdd(pool.map(toCandidate), {
      seed: passSeed,
      max: pass,
      min: pass,
    });
    if (pick.ids.length === 0) {
      // Defensive: the brain always returns at least one id for a non-empty pool, and an empty
      // answer here would spin forever. Place what is left in payload order instead.
      order.push(...pool.map((item) => item.id));
      break;
    }
    order.push(...spreadPass(pick.ids, byId, passSeed));
    const placed = new Set(pick.ids);
    pool = pool.filter((item) => !placed.has(item.id));
  }

  return hoistOwn(order, byId, opts.ownIds);
}

/** Independent seeded streams for the shuffle, so it never correlates with the brain's own. */
const SALT_SHUFFLE = 71;

/**
 * A pass, shuffled on the loop's seed and then de-clumped. The shuffle is what makes a loop a new
 * take; the de-clump is what stops the shuffle from spending the brain's coverage guarantee, which
 * is the one property that makes the reel feel like the party rather than like one phone.
 */
function spreadPass(
  ids: readonly string[],
  byId: Map<string, LiveMediaItem>,
  seed: number,
): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(seed, i, SALT_SHUFFLE) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  const who = (id: string) => byId.get(id)?.uploaderKey ?? null;
  for (let i = 1; i < out.length; i++) {
    if (who(out[i]) === null || who(out[i]) !== who(out[i - 1])) continue;
    const swap = out.findIndex((id, k) => k > i && who(id) !== who(out[i - 1]));
    if (swap > i) [out[i], out[swap]] = [out[swap], out[i]];
  }
  return out;
}

/**
 * "Yours first": the guest's NEWEST approved item opens the loop on their own device.
 * Newest rather than any of theirs, because the beat it serves is "the photograph you just added is
 * in the reel"; an older one of theirs would read as coincidence.
 */
function hoistOwn(
  order: string[],
  byId: Map<string, LiveMediaItem>,
  ownIds: ReadonlySet<string> | null | undefined,
): string[] {
  if (!ownIds || ownIds.size === 0 || order.length < 2) return order;
  let leadId: string | null = null;
  let leadTime = Number.NEGATIVE_INFINITY;
  for (const id of order) {
    if (!ownIds.has(id)) continue;
    const parsed = Date.parse(byId.get(id)?.createdAt ?? "");
    // An unknown timestamp still qualifies, but only if nothing dated does.
    const time = Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
    if (leadId === null || time > leadTime) {
      leadId = id;
      leadTime = time;
    }
  }
  if (leadId === null || order[0] === leadId) return order;
  return [leadId, ...order.filter((id) => id !== leadId)];
}

function toCandidate(item: LiveMediaItem): QuickAddCandidate {
  return {
    id: item.id,
    type: item.type,
    createdAt: item.createdAt,
    uploaderKey: item.uploaderKey,
    // Left undefined where the payload carries no counts (every guest surface), which collapses the
    // brain's likes term to zero rather than pretending everything is unloved.
    likeCount: item.likeCount,
  };
}
