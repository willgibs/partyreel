/**
 * The pricing calculator's pure brain: (storage, video?, hosting again?) → the
 * honest plan recommendation. Every number derives from tiers.ts (the DRY single
 * source) so the receipt can never drift from what enforcement actually grants.
 *
 * The decision tree mirrors the real product walls, nothing else:
 *   • video is the Free wall (free events are photos-only);
 *   • 2 GB is the Free cap;
 *   • "hosting again" is the Pass → Pro fork (a pass covers ONE event; passes
 *     stack, but a recurring host is what Pro is FOR);
 *   • 75 GB is a single pass's room; above it, one event needs Pro storage;
 *   • Pro sizes resolve to the SMALLEST cap that fits (never upsell past fit).
 */
import {
  formatCapacity,
  GIGABYTE,
  planById,
  plansForTier,
  videosAllowedForTier,
  type Plan,
  type PlanId,
} from "@/lib/constants/tiers";

export type CalculatorInput = {
  /** Desired room, in bytes (the slider's value). */
  bytes: number;
  /** Will guests add video? */
  video: boolean;
  /** One event vs a host who will host again. */
  hostingAgain: boolean;
};

export type Recommendation = {
  planId: PlanId;
  plan: Plan;
  /** One sentence of WHY, in the site voice. */
  reason: string;
  /** An honest runner-up when one genuinely exists (e.g. Free fits too). */
  alternative: string | null;
};

/** The smallest Pro plan whose cap holds `bytes` (the largest one as a ceiling). */
export function smallestProFor(bytes: number): Plan {
  const pro = plansForTier("pro");
  return pro.find((p) => bytes <= p.storageBytes) ?? pro[pro.length - 1];
}

/** "about 12,800 photos or 7 hours of video" — the receipt line for a byte cap. */
// Delegates to the shared formatter (tiers.ts) so the blog and /pricing can never describe one
// cap in two ways; the en-US pin there also removes a host-locale hydration hazard this used to have.
export function capacityPhrase(bytes: number, withVideo: boolean): string {
  return `about ${formatCapacity(bytes, { video: withVideo })}`;
}

export function recommendPlan(input: CalculatorInput): Recommendation {
  const free = planById("free");
  const pass = planById("event_pass");
  const { bytes, video, hostingAgain } = input;

  if (hostingAgain) {
    const plan = smallestProFor(bytes);
    return {
      planId: plan.id,
      plan,
      reason: `Pro keeps every event you host in one place. ${plan.name} holds ${capacityPhrase(plan.storageBytes, true)}.`,
      alternative:
        !video && bytes <= pass.storageBytes
          ? "Two one-off events a year? Two Event Passes work too."
          : null,
    };
  }

  // One event, photos only, inside the Free cap: Free genuinely covers it.
  if (!video && bytes <= free.storageBytes && !videosAllowedForTier("free")) {
    return {
      planId: "free",
      plan: free,
      reason: `Free covers your whole event: ${capacityPhrase(free.storageBytes, false)}, every guest, the album and the reel.`,
      alternative: `Want video or more room later? An Event Pass adds both for ${pass.priceLabel.replace(" one-time", "")}, once.`,
    };
  }

  // One event that needs video or more room, inside a single pass's 75 GB.
  if (bytes <= pass.storageBytes) {
    return {
      planId: "event_pass",
      plan: pass,
      reason: `One event, paid once. A pass holds ${capacityPhrase(pass.storageBytes, true)}, video included.`,
      alternative: null,
    };
  }

  // One event bigger than a single pass: Pro storage is the honest answer.
  const plan = smallestProFor(bytes);
  return {
    planId: plan.id,
    plan,
    reason: `A single pass tops out at ${Math.round(pass.storageBytes / GIGABYTE)} GB. ${plan.name} gives this event ${capacityPhrase(plan.storageBytes, true)}.`,
    alternative: null,
  };
}
