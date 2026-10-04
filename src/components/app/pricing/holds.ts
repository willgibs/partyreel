import {
  BIG_PARTY,
  formatCapacity,
  partiesHeld,
  type Plan,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

/**
 * ★ WHAT A PLAN HOLDS, IN THE UNIT A HOST THINKS IN (Ladder A, the pricing research): a host reads "a 200-guest
 * wedding, twice over" before she reads 25 GB, and GB for GB a cloud drive is many times cheaper, so every pricing
 * surface leads a plan with its events and keeps the GB in its row. One home for the phrases, so the cards, the FAQ
 * and the plan sheet never word one room two ways. Each counts in the big party (`BIG_PARTY`, tiers.ts), whose
 * working the page says once (`BIG_PARTY_NOTE`).
 */

/** "A 200-guest wedding, twice over": the pass's room. */
export function passHoldsLine(storageBytes: number): string {
  const n = partiesHeld(storageBytes);
  const times =
    n === 2 ? "twice over" : n === 3 ? "three times over" : `${n} times over`;
  return n > 1
    ? `A ${BIG_PARTY.guests}-guest wedding, ${times}`
    : `A ${BIG_PARTY.guests}-guest wedding`;
}

/** "Room for about 20 parties of 200 guests": a Pro size's room. */
export function partiesLine(plan: Plan): string {
  return `Room for about ${formatCount(partiesHeld(plan.storageBytes))} parties of ${BIG_PARTY.guests} guests`;
}

/** What a screen reader hears for a Pro size: its use, then its room ("A planner's year, 200 GB"). */
export function sizeValueText(plan: Plan): string {
  const room = formatBytes(plan.storageBytes);
  return plan.use ? `${plan.use}, ${room}` : room;
}

/**
 * A plan card's holds line on the plan sheet: a Pro size's use first, then its estimate ("A planner's year: about
 * 58,514 photos or 53 hours of video"); Free (photos only) and the pass their estimate alone. The basis is said once
 * under the cards (`ESTIMATE_BASIS_NOTE`), so it never rides here.
 */
export function holdsPhrase(plan: Plan): string {
  const estimate = `about ${formatCapacity(plan.storageBytes, {
    video: videosAllowedForTier(plan.tier),
    basis: false,
  })}`;
  return plan.tier === "pro" && plan.use
    ? `${plan.use}: ${estimate}`
    : estimate;
}
