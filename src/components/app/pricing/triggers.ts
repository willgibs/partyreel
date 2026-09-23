import { smallestProFor } from "@/components/marketing/sections/pricing/recommend";
import {
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  plansForTier,
  type Plan,
} from "@/lib/constants/tiers";

/**
 * WHY A PRICING SURFACE OPENED (`first=trigger`, Will 2026-09-20: "A locked
 * feature names the feature; running out of room opens on the smallest plan
 * that clears it; a Pro host is told she subscribes already").
 *
 * Knowing the trigger is the ONLY thing keeping pricing inside the app buys us:
 * /pricing is statically generated and tier-blind, so it cannot know which
 * control refused you, how many bytes short you are, or that you already
 * subscribe. Every door in the app hands one of these three down, and the sheet
 * reads nothing else about the situation.
 *
 * ★ A TRIGGER IS CONTEXT, NEVER AN ENTITLEMENT. Nothing here decides what a
 * host may do: the locks are re-derived from `profiles.tier` server-side on
 * every render, enforced again in the RPCs, and the checkout route re-resolves
 * the entitlement from `profiles` before it will open a session
 * (billing-caps.md). A forged trigger changes which sentence a host reads and
 * nothing else, which is why this module is client-safe.
 *
 * Pure data and pure functions: no React, no env, so a test and a server page
 * both read it.
 */

/** The three gated capabilities behind the app's four locked controls. */
export type LockedFeature = "password" | "custom_slug" | "video";

export type PricingTrigger =
  /** A control said no: the sheet leads with that control's own name. */
  | { kind: "locked"; feature: LockedFeature }
  /** Out of room, or out of events. `needed` picks the smallest plan that clears it. */
  | { kind: "room"; needed?: number }
  /** Nobody was refused: the host came to look at what they pay. */
  | { kind: "plan" };

/**
 * What a locked control says, in one place (`words=chip`, and his note:
 * "the lock chip should also provide context on why it's locked and provide
 * action to upgrade, rather than simply appear unusable. Convert, not block").
 *
 * `name` is the CONTROL's own name, so the chip reads as the thing it replaces
 * rather than as an apology; `why` is the Free truth, which is what makes the
 * lock legible; `unlocks` is the sentence the sheet leads with. Four inline
 * sentences worded four ways became this one record.
 */
export const LOCKED_FEATURES: Record<
  LockedFeature,
  { name: string; why: string; unlocks: string }
> = {
  password: {
    name: "Password lock",
    why: "On Free, anyone holding the link can open the album.",
    unlocks: "Password locks are on every paid plan",
  },
  custom_slug: {
    name: "Custom link",
    why: "Free events share the code link, which nobody can read out loud.",
    unlocks: "Custom links are on every paid plan",
  },
  video: {
    name: "Video uploads",
    why: "Free events take photos only, for you and for every guest.",
    unlocks: "Video is on every paid plan",
  },
};

/**
 * The Pro size the sheet opens on: the SMALLEST that holds what the host needs
 * (the storage guard's call, Will 2026-09-22), resolved through the SAME
 * `smallestProFor` the marketing calculator uses, so the app can never upsell
 * past fit. "Needs" is the larger of what a door says it was refused for and
 * what the server says the host stores (`storedBytes`, from the sheet's own
 * read when it opens), so a door that knows nothing about bytes (the create
 * wizard, the restore button) still opens on a size the host fits, and a host
 * storing nothing opens on the smallest Pro, the honest floor for a first ask.
 */
export function openingPlanFor(trigger: PricingTrigger, storedBytes = 0): Plan {
  const needed =
    trigger.kind === "room" && typeof trigger.needed === "number"
      ? trigger.needed
      : 0;
  const bytes = Math.max(needed, storedBytes);
  return bytes > 0 ? smallestProFor(bytes) : plansForTier("pro")[0];
}

/**
 * THE THREE BENEFIT LINES ON THE PRO CARD (his `carry` note: "We could include
 * a couple of benefits (Unlimited events, videos, more storage maybe? phrased
 * better) in this more minimal version").
 *
 * ★ NOT A SECOND HOME FOR THE MARKETING COPY. /pricing's unlock grid is four
 * headed tiles with a Free line under each; this is three clauses inside a card
 * a thumb is holding, and every number in them is read from `tiers.ts` rather
 * than typed, so the two surfaces cannot disagree about a fact even though they
 * say it at different lengths. The ORDER is the conversion order he named.
 */
export function proBenefitLines(): string[] {
  return [
    "Video from you and every guest",
    MAX_EVENTS.pro !== null
      ? `Up to ${MAX_EVENTS.pro} events`
      : MAX_EVENTS.free === 1
        ? "Unlimited events, not just the one"
        : `Unlimited events, not ${MAX_EVENTS.free}`,
    `Password locks, custom links, ${MAX_REEL_SECONDS.pro}-second reels`,
  ];
}
