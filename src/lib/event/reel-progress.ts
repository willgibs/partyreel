/**
 * THE HIGHLIGHT REEL FROM THE HOST'S SIDE: does it play yet, and what is left before it does
 * (`reel-host`, Will 2026-09-25: `progress=card`, `pulse=band`).
 *
 * The live reel makes itself: every viewer's device composes it from the album's approved,
 * reel-eligible items, from the SECOND one on, unless the host turned it off. So a host has no
 * reel to create, only a state to read, and it is one of three:
 *
 *   - `off`       the host's Show the reel switch is off, whatever the album holds;
 *   - `counting`  switch on, fewer than two items that can play: the reel is on its way;
 *   - `live`      switch on, two or more: guests see it on the album now.
 *
 * The hub's Reel card, the dashboard's What needs you band and the old Studio route's redirect all
 * read their state here, so the three can never disagree about whether an event has a reel.
 *
 * ★ "CAN PLAY" IS THE GUEST'S OWN RULE, NEVER A SECOND ONE. An item counts exactly when the live
 * reel would draw it (`isReelEligible`: approved, not a clip someone added to the album, something
 * drawable), so the host's card flips to live on the very photo that makes the guest's tile appear.
 * The dashboard, which cannot hold every album, asks the same question in SQL
 * (`getReelProgress`, `queries/events.ts`) and spells the same three conditions there.
 *
 * Pure and client-safe: no DOM, no React, no server imports.
 */
import { LIVE_REEL_MINIMUM } from "@/lib/events/gallery-reel";
import {
  isReelEligible,
  stillUrlFor,
  type LiveMediaItem,
} from "@/lib/reel/live/items";
import { planTake } from "@/lib/reel/live/take";

/**
 * The live reel exists from this many reel-eligible items (Will's "could even drop the minimum to
 * 2", `reel-front`; the engine alternates two clips cleanly). One number, one home
 * (`LIVE_REEL_MINIMUM`, `gallery-reel.ts`, read-only here): the guest album's gate and the host's
 * own card can never drift apart over how many photos start a reel.
 */
export const REEL_MINIMUM = LIVE_REEL_MINIMUM;

/** How many stills the Reel card dissolves through: enough to feel alive, few enough to stay calm. */
export const REEL_CARD_STILLS = 4;

/**
 * The most items the card's take is planned over. `planTake` runs the quick-add brain pass after
 * pass over what is left, so its cost grows with the square of the album (measured: 48 ms at
 * 1,200 items, a second at 6,000), and the hub renders on every arrival. A spread of the album this
 * size keeps it near 2 ms at any size.
 */
export const TAKE_POOL = 96;

/**
 * At most `max` items spread evenly across the list, first and last included: a deterministic
 * sample that spans the whole album (newest to oldest) rather than its head.
 */
export function spreadSample<T>(items: readonly T[], max: number): T[] {
  if (items.length <= max) return [...items];
  if (max <= 1) return items.slice(0, Math.max(0, max));
  const last = items.length - 1;
  return Array.from(
    { length: max },
    (_, i) => items[Math.round((i * last) / (max - 1))],
  );
}

export type ReelState = "off" | "counting" | "live";

/**
 * The reel's state from the switch, the platform lever and a count of items that can play (a count
 * capped anywhere at or past the minimum is enough).
 *
 * ★ THE LEVER OUTRANKS THE SWITCH, SILENTLY. `ops_flags.live_reel_enabled` (`reel-teardown`) is an
 * operator's platform-wide pause, read the same way the guest payload reads it
 * (`getLiveReelServerFacts`, `db/queries/guest-events-admin.ts`); off collapses straight to `off`
 * whatever the host's OWN switch says, so the hub's Reel card, the "What needs you" band and the old
 * `/reel` room's redirect can never disagree with the album the guest actually sees.
 */
export function reelState(input: {
  showReel: boolean;
  liveReelEnabled: boolean;
  playable: number;
}): ReelState {
  if (!input.showReel || !input.liveReelEnabled) return "off";
  return input.playable >= REEL_MINIMUM ? "live" : "counting";
}

/** Photos still needed before the reel plays: 0 once it does. */
export function photosToGo(playable: number): number {
  return Math.max(0, REEL_MINIMUM - playable);
}

/** The Reel card's face, read off the album the hub already holds. */
export type HubReel = {
  state: ReelState;
  /** Items that can play, capped at the minimum: the card's pips. */
  have: number;
  /**
   * What the card shows behind its words: at one item that item's still, and once live the
   * reel's own opening stills. Empty when the card is plain (off, or nothing yet).
   */
  stills: string[];
};

/**
 * ★ THE LIVING CARD WEARS THE REEL'S OWN TAKE, NEVER THE ALBUM'S NEWEST. The card sits right above
 * the album, whose first tiles are the newest photographs; a card that dissolved through those
 * would read as the album repeating itself. The take (`planTake`, loop 0: the brain that orders
 * the reel, blending recency, likes and every guest's turn) is planned over a spread of the whole
 * album (`TAKE_POOL`), so the card previews the reel's feel from across the party at a cost that
 * stays flat however big the album grows.
 *
 * The count is read off the whole album the hub reads (`listEventMedia` pages to the last row), so
 * it is exact, and the stills come from the same items: the face can never claim a reel whose
 * pictures it does not have.
 */
export function hubReel(input: {
  eventId: string;
  showReel: boolean;
  liveReelEnabled: boolean;
  items: readonly LiveMediaItem[];
}): HubReel {
  const playable = input.items.filter(isReelEligible);
  const state = reelState({
    showReel: input.showReel,
    liveReelEnabled: input.liveReelEnabled,
    playable: playable.length,
  });
  const have = Math.min(playable.length, REEL_MINIMUM);
  if (state === "off") return { state, have, stills: [] };
  if (state === "counting") {
    const first = playable[0];
    return { state, have, stills: first ? [stillUrlFor(first)] : [] };
  }
  const pool = spreadSample(playable, TAKE_POOL);
  const byId = new Map(pool.map((item) => [item.id, item]));
  const stills = planTake(pool, { eventId: input.eventId, loopIndex: 0 })
    .slice(0, REEL_CARD_STILLS)
    .map((id) => {
      const item = byId.get(id);
      return item ? stillUrlFor(item) : "";
    })
    .filter(Boolean);
  return { state, have, stills };
}
