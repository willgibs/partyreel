/**
 * What plan a host ACTUALLY holds right now, derived server-side from `profiles`.
 *
 * ADR-0023 ruling 1 ("one plan at a time") needs one honest answer to "does this caller already
 * have a live entitlement?", and that answer can never come from the client: the tier the browser
 * believes it has is exactly the field an attacker edits. Kept pure and fixture-testable so the
 * checkout route stays a thin gate over it.
 *
 * THE FAILURE THIS PREVENTS (QA #3): nothing stopped a host on an active Pro subscription from
 * opening a SECOND subscription, or from buying an Event Pass whose provisioning writes
 * `storage_cap_bytes = 75 GB` straight over their 2 TB while Stripe keeps billing Pro. The nightly
 * over-capacity sweep then began removing media that sat legitimately inside the cap they pay for,
 * composing directly into the review's second critical. Refusing at checkout kills the whole class
 * at its source instead of patching the sweep downstream.
 *
 * Import-safe from anywhere: no env, no Stripe SDK, no DB. `tiers.ts` is the only dependency.
 */
import { toBillingTier } from "@/lib/constants/tiers";

/** The live entitlement a host holds. "none" covers Free, lapsed, and never-paid alike. */
export type HeldPlan = "none" | "pro" | "event_pass";

export type Entitlement = {
  held: HeldPlan;
  /** ISO expiry of an ACTIVE Event Pass. null in every other state. */
  expiresAt: string | null;
};

/** The only two `profiles` columns the ruling depends on. Both are webhook-written. */
export type EntitlementProfile = {
  tier: string | null;
  tier_expires_at: string | null;
};

export function resolveEntitlement(
  profile: EntitlementProfile | null | undefined,
  now: Date,
): Entitlement {
  if (!profile?.tier) return { held: "none", expiresAt: null };
  const tier = toBillingTier(profile.tier);

  // Pro = a live Stripe subscription. `tier` IS the subscription state here: the webhook is its
  // sole writer and rewrites "free" the moment a subscription is cancelled or leaves an active
  // status. Deliberately NOT keyed on stripe_subscription_id, which is nulled on that same write
  // (so it adds no signal) and whose stale non-null value would refuse a legitimate re-subscribe.
  if (tier === "pro") return { held: "pro", expiresAt: null };

  if (tier === "event_pass") {
    // The EXPIRY is authoritative, not the label. `sweepExpiredPasses` runs nightly, so a lapsed
    // pass can stay labelled `event_pass` for the better part of a day. Reading the timestamp means
    // a host whose pass ended at 9am is not refused a purchase until the cron catches up at
    // midnight. Note the direction: every unreadable or missing value falls through to "none", so
    // bad data lets the customer BUY rather than locking them out of the product they want.
    const expiresAt = profile.tier_expires_at;
    const expiresMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
    if (Number.isFinite(expiresMs) && expiresMs > now.getTime()) {
      return { held: "event_pass", expiresAt };
    }
  }

  return { held: "none", expiresAt: null };
}

/**
 * An expiry date for refusal copy. Locale is PINNED: this renders on the server, where the runtime
 * locale is the deploy region's, not the host's, so an unpinned `toLocaleDateString` would quietly
 * hand a US customer a European date order.
 */
export function formatEntitlementExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
