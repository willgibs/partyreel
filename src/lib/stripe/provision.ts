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

export type EventPassPatch = {
  /** profiles.id — Event Pass is provisioned by user id (client_reference_id). */
  userId: string;
  customerId: string;
  storageCapBytes: number;
  /** ISO timestamp — when the pass lapses (the expiry sweep downgrades to Free). */
  tierExpiresAt: string;
};

/**
 * Resolve a `checkout.session.completed` event for a ONE-TIME Event Pass purchase into a
 * profile patch (Pro subscriptions provision from `customer.subscription.*` instead).
 * Returns null for any other event or a non-Event-Pass session.
 *
 * `tierExpiresAt` is derived from the session's `created` time (NOT now()), so a
 * re-delivered event is idempotent — it rewrites the same expiry instead of extending the
 * term. `plan` (tiers.ts `event_pass`) supplies the storage cap + term length.
 */
export function resolveEventPassCheckout(
  event: Stripe.Event,
  plan: Plan,
): EventPassPatch | null {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.plan_id !== "event_pass") return null;

  const userId = session.client_reference_id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  if (!userId || !customerId) return null;

  const termSeconds = (plan.termDays ?? 365) * 86_400;
  const tierExpiresAt = new Date(
    (session.created + termSeconds) * 1000,
  ).toISOString();

  return {
    userId,
    customerId,
    storageCapBytes: plan.storageBytes,
    tierExpiresAt,
  };
}
