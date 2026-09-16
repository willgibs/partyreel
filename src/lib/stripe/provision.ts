/**
 * PURE webhook → profile-patch logic (no SDK calls, no env, no DB) so it's unit
 * testable with fixture events. The webhook route applies the returned patch via the
 * service-role admin client (the SOLE writer of profiles.tier / storage_cap_bytes).
 *
 * Idempotent by design: it returns ABSOLUTE derived values, never deltas, so Stripe
 * re-delivering an event just rewrites the same row to the same state.
 */
import type Stripe from "stripe";

import type { Plan, Tier } from "@/lib/constants/tiers";

export type ProfilePatch = {
  /** Maps to profiles.stripe_customer_id (how we find the host). */
  customerId: string;
  tier: Tier;
  /** null → falls back to the tier default in create_media (Free = 2 GB). */
  storageCapBytes: number | null;
  subscriptionId: string | null;
};

// Statuses where the host keeps Pro access. past_due keeps access during dunning
// (minimal — full dunning UX is a fast-follow); a real cancel arrives as `deleted`.
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

/**
 * Resolve a `customer.subscription.*` event into a profile patch, using `resolvePlan`
 * to map the subscription's price → Plan. Returns null for unrelated events or an
 * unknown price (so we never blindly change entitlements).
 */
export function resolveSubscriptionUpdate(
  event: Stripe.Event,
  resolvePlan: (priceId: string) => Plan | null,
): ProfilePatch | null {
  if (
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return null;
  }

  const sub = event.data.object as Stripe.Subscription;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Cancellation (or any non-active state) → downgrade to Free. cap null → the
  // 2 GB Free default applies in create_media; existing media stays, new uploads
  // are blocked once over cap (minimal over-capacity; full grace is a fast-follow).
  if (
    event.type === "customer.subscription.deleted" ||
    !ACTIVE_STATUSES.has(sub.status)
  ) {
    return {
      customerId,
      tier: "free",
      storageCapBytes: null,
      subscriptionId: null,
    };
  }

  const priceId = sub.items.data[0]?.price?.id;
  const plan = priceId ? resolvePlan(priceId) : null;
  if (!plan) return null; // unknown price — leave entitlements untouched

  return {
    customerId,
    tier: plan.tier,
    storageCapBytes: plan.storageBytes,
    subscriptionId: sub.id,
  };
}

export type EventPassCheckoutRef = {
  /** profiles.id — Event Pass is provisioned by user id (client_reference_id). */
  userId: string;
  customerId: string;
  /** The idempotency key: one session mints at most one ledger row. */
  sessionId: string;
  /** session.created in ms — the purchase instant the window derives from. */
  createdMs: number;
  /** Checkout stamped metadata.renewal="1" → the window CHAINS instead of stacking. */
  renewal: boolean;
  /** What was ACTUALLY charged (promo codes reduce it); null if Stripe omitted it. */
  amountTotalCents: number | null;
};

/**
 * Recognize a ONE-TIME Event Pass checkout and pull out everything the ledger insert
 * needs (billing-caps.md). The WINDOW itself ([start, expiry)) is not computed here — it
 * depends on the host's other live passes, which the route reads once it knows whose
 * ledger to read; the math is `passWindowForPurchase` in lib/billing/passes.ts.
 * Returns null for any other event or a non-Event-Pass session.
 */
export function eventPassSession(
  event: Stripe.Event,
): EventPassCheckoutRef | null {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.plan_id !== "event_pass") return null;

  const userId = session.client_reference_id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  if (!userId || !customerId) return null;
  return {
    userId,
    customerId,
    sessionId: session.id,
    createdMs: session.created * 1000,
    renewal: session.metadata?.renewal === "1",
    amountTotalCents:
      typeof session.amount_total === "number" ? session.amount_total : null,
  };
}

export type ProCreditRef = {
  userId: string;
  customerId: string;
  /** Keys the idempotent Stripe balance grant (`pass-credit-<sessionId>`). */
  sessionId: string;
  /** The prorated credit the checkout route computed and stamped, in cents. */
  creditCents: number;
};

/**
 * Recognize a Pro subscription checkout that carries a prorated Event Pass credit
 * (billing-caps.md: the checkout route stamps `pass_credit_cents` when the buyer holds
 * live passes). The metadata is our own server-side write inside a
 * signature-verified event, so the number is trusted; malformed or non-positive
 * values return null and the session falls through to plain customer binding.
 */
export function proCreditSession(event: Stripe.Event): ProCreditRef | null {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "subscription") return null;
  const raw = session.metadata?.pass_credit_cents;
  if (!raw) return null;
  const creditCents = Number.parseInt(raw, 10);
  if (!Number.isFinite(creditCents) || creditCents <= 0) return null;

  const userId = session.client_reference_id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  if (!userId || !customerId) return null;
  return { userId, customerId, sessionId: session.id, creditCents };
}

/**
 * Stripe's `event.created` (unix seconds) as the ISO timestamp the ordering guard persists and
 * compares against `profiles.stripe_event_created_at`.
 *
 * THE FAILURE THIS PREVENTS (QA #5): provisioning keyed on the customer alone with no recency
 * check, so a retried or out-of-order delivery could re-grant Pro after a cancellation, or strip a
 * paying host back to Free. Stripe retries for up to three days and does not guarantee ordering.
 */
export function deliveryCreatedAt(event: Stripe.Event): string {
  return new Date(event.created * 1000).toISOString();
}
