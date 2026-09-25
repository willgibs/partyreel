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
import {
  isReelEligible,
  stillUrlFor,
  type LiveMediaItem,
} from "@/lib/reel/live/items";
import { planTake } from "@/lib/reel/live/take";

/**
 * The live reel exists from this many reel-eligible items (Will's "could even drop the minimum to
 * 2", `reel-front`; the engine alternates two clips cleanly). The guest album's gate is the same
 * number (`LIVE_REEL_MINIMUM`, `reel-guest-wiring`); the two fold into one home when both land.
 */
export const REEL_MINIMUM = 2;

/** How many stills the Reel card dissolves through: enough to feel alive, few enough to stay calm. */
export const REEL_CARD_STILLS = 4;

export type ReelState = "off" | "counting" | "live";

/** The reel's state from the switch and a count of items that can play (a count capped anywhere at or past the minimum is enough). */
export function reelState(input: {
  showReel: boolean;
  playable: number;
}): ReelState {
  if (!input.showReel) return "off";
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
 * would read as the album repeating itself. The take (`planTake`, loop 0) is the order the reel
 * itself opens on, which is also what the guest album's tile draws, so the host's card previews
 * the reel the guests are about to watch.
 *
 * The count is read off the whole album the hub reads (`listEventMedia` pages to the last row), so
 * it is exact, and the stills come from the same items: the face can never claim a reel whose
 * pictures it does not have.
 */
export function hubReel(input: {
  eventId: string;
  showReel: boolean;
  items: readonly LiveMediaItem[];
}): HubReel {
  const playable = input.items.filter(isReelEligible);
  const state = reelState({
    showReel: input.showReel,
    playable: playable.length,
  });
  const have = Math.min(playable.length, REEL_MINIMUM);
  if (state === "off") return { state, have, stills: [] };
  if (state === "counting") {
    const first = playable[0];
    return { state, have, stills: first ? [stillUrlFor(first)] : [] };
  }
  const byId = new Map(playable.map((item) => [item.id, item]));
  const stills = planTake(playable, { eventId: input.eventId, loopIndex: 0 })
    .slice(0, REEL_CARD_STILLS)
    .map((id) => {
      const item = byId.get(id);
      return item ? stillUrlFor(item) : "";
    })
    .filter(Boolean);
  return { state, have, stills };
}
