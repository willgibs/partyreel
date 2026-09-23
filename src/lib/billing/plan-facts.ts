/**
 * WHAT THE PLAN SHEET KNOWS WHEN IT OPENS: the shape `/api/stripe/plan-facts`
 * answers and the parser the sheet reads it through. Client-safe (no env, no SDK).
 *
 * WHY THE SHEET ASKS INSTEAD OF BEING TOLD: four doors open the sheet with no idea
 * what the host stores (the create wizard, the restore button, the Deleted grid,
 * the dashboard's event-limit line) and so opened it on Pro 100 GB for a host
 * storing 140 GB. One small authenticated read when it opens means no door has to
 * carry bytes, and every door gets the same, current answer.
 *
 * ★ CONTEXT, NEVER AN ENTITLEMENT (billing-caps.md). These facts choose which size
 * the sheet opens on and which rows it marks; the checkout and change-plan routes
 * re-derive everything from `profiles` and Stripe before they will open a session.
 */
import { BILLING_TIERS, type Tier } from "@/lib/constants/tiers";
import type { ChangePlanRefusalCode } from "@/lib/stripe/change-plan";
import { isProPlanId, type ProPlanId } from "@/lib/validation/checkout";

export type PlanFacts = {
  tier: Tier;
  /** A Stripe customer exists, so the general billing portal has something to open. */
  hasBilling: boolean;
  /** An Event Pass holder's expiry, already formatted by the server. */
  passExpiry: string | null;
  /** What the cap counts (non-removed media in non-deleted events). */
  activeBytes: number;
  /** What Deleted holds (removed media, or anything in a deleted event). */
  standbyBytes: number;
  /** The cap in force now; null only for a Pro profile the webhook has not written. */
  capBytes: number | null;
  /** A Pro host's plan, read from the subscription's price; null when unknown. */
  currentPlanId: ProPlanId | null;
  /** Why a Pro switch cannot open, or null when it can (or could not be checked). */
  changeBlocked: ChangePlanRefusalCode | null;
};

const BLOCKED = new Set<ChangePlanRefusalCode>([
  "not_subscribed",
  "no_subscription",
  "not_yours",
  "payment_issue",
  "not_active",
  "ending",
  "multi_item",
  "foreign_price",
  "already_on_plan",
]);

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * The route's `facts`, checked field by field. Anything malformed answers null and
 * the sheet keeps the facts its door passed: an old tab talking to a new server, or
 * a proxy's HTML error page, must never render `NaN GB` or mark the wrong row.
 */
export function parsePlanFacts(data: unknown): PlanFacts | null {
  if (!data || typeof data !== "object") return null;
  const f = (data as { facts?: unknown }).facts;
  if (!f || typeof f !== "object") return null;
  const r = f as Record<string, unknown>;
  if (!(BILLING_TIERS as readonly unknown[]).includes(r.tier)) return null;
  if (typeof r.hasBilling !== "boolean") return null;
  if (!finite(r.activeBytes) || !finite(r.standbyBytes)) return null;
  if (r.capBytes !== null && !finite(r.capBytes)) return null;
  return {
    tier: r.tier as Tier,
    hasBilling: r.hasBilling,
    passExpiry: typeof r.passExpiry === "string" ? r.passExpiry : null,
    activeBytes: r.activeBytes,
    standbyBytes: r.standbyBytes,
    capBytes: r.capBytes as number | null,
    currentPlanId: isProPlanId(r.currentPlanId) ? r.currentPlanId : null,
    changeBlocked: BLOCKED.has(r.changeBlocked as ChangePlanRefusalCode)
      ? (r.changeBlocked as ChangePlanRefusalCode)
      : null,
  };
}
