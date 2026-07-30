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
 * Recognize a ONE-TIME Event Pass checkout and pull out the two ids, WITHOUT computing the new
 * expiry. Split out because the expiry now depends on the host's current one (ADR-0023: renewal
 * EXTENDS), and the route cannot read that row until it knows whose row to read. Returns null for
 * any other event or a non-Event-Pass session.
 */
export function eventPassSession(
  event: Stripe.Event,
): { userId: string; customerId: string } | null {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.plan_id !== "event_pass") return null;

  const userId = session.client_reference_id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  if (!userId || !customerId) return null;
  return { userId, customerId };
}

/**
 * Resolve a `checkout.session.completed` event for a ONE-TIME Event Pass purchase into a
 * profile patch (Pro subscriptions provision from `customer.subscription.*` instead).
 *
 * ADR-0023 ruling 1: renewal EXTENDS from the current expiry, so the new term starts at
 * `max(purchase time, current expiry)`. THE FAILURE THIS PREVENTS (QA #35): the old
 * `session.created + term` reset the clock, so a host who renewed a month early silently threw
 * away eleven months they had already paid for. An expiry in the PAST (a lapsed pass, or none at
 * all) falls back to the purchase time, which is a fresh full term.
 *
 * Still derived from `session.created` rather than `now()`, so the value is a pure function of the
 * event: a delivery that reaches this twice computes the same answer instead of drifting forward.
 * That is not by itself replay-safety though, because this patch ACCUMULATES rather than being
 * absolute like the subscription one. Replay-safety comes from the ordering guard in the webhook
 * route, which refuses any delivery not strictly newer than the last one applied to the profile.
 */
export function resolveEventPassCheckout(
  event: Stripe.Event,
  plan: Plan,
  currentExpiresAt: string | null,
): EventPassPatch | null {
  const ref = eventPassSession(event);
  if (!ref) return null;
  const session = event.data.object as Stripe.Checkout.Session;

  const termMs = (plan.termDays ?? 365) * 86_400_000;
  const purchasedMs = session.created * 1000;
  const currentMs = currentExpiresAt
    ? Date.parse(currentExpiresAt)
    : Number.NaN;
  // max(purchase, current expiry). An unparseable stored value degrades to a fresh term rather
  // than throwing: never fail a host's paid purchase over a malformed timestamp.
  const startMs =
    Number.isFinite(currentMs) && currentMs > purchasedMs
      ? currentMs
      : purchasedMs;

  return {
    userId: ref.userId,
    customerId: ref.customerId,
    storageCapBytes: plan.storageBytes,
    tierExpiresAt: new Date(startMs + termMs).toISOString(),
  };
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
