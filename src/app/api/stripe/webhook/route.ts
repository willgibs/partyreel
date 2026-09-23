import type Stripe from "stripe";

import { passWindowForPurchase } from "@/lib/billing/passes";
import {
  consumeLivePassesForProCredit,
  insertPassPurchase,
  recomputePassEntitlement,
} from "@/lib/db/mutations/event-passes";
import { getLivePasses } from "@/lib/db/queries/event-passes";
import { getStripe } from "@/lib/stripe/client";
import { planForPriceId } from "@/lib/stripe/plans";
import {
  deliveryCreatedAt,
  eventPassSession,
  proCreditSession,
  resolveSubscriptionUpdate,
  subscriptionQuantityWarning,
} from "@/lib/stripe/provision";
import { assertStripeEnv } from "@/lib/env";
import type { TablesUpdate } from "@/lib/db/types";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook = the SINGLE source of truth for a host's tier. CRITICAL: read the
// RAW body (req.text(), NOT req.json()) before constructEvent — JSON-parsing mutates
// the bytes and the signature check fails. All writes go through the service-role
// admin client (bypasses RLS); the client can never set tier/storage_cap_bytes.
//
// ★ DEPLOY ORDERING: the entitlement writes below filter on profiles.stripe_event_created_at
// (the QA #5 recency guard, added by 20260729170000_qa_q2_billing_guards.sql). Ship the MIGRATION
// FIRST. If this code reaches prod ahead of it, PostgREST answers 42703 (undefined column), this
// route 500s, and Stripe retries for three days — entitlements are DELAYED, never lost. That loud,
// self-healing failure is deliberate: a guard that silently disabled itself on a missing column
// would be the same fail-open shape the parity test was just fixed for.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * How a given entitlement write tolerates Stripe re-delivering an event it already applied.
 *
 * `absolute` (the subscription patch) rewrites the same derived values, so a replay is a no-op and
 * we accept anything not strictly OLDER than the last delivery. That leniency is load-bearing:
 * Stripe can emit two distinct subscription events inside the same second and `event.created` has
 * only second resolution, so a strict comparison would drop the second one and leave the profile
 * on a stale plan.
 *
 * `accumulating` (the Event Pass extension) adds a year onto whatever is already stored, so a
 * replay would silently gift a second year. It accepts only deliveries strictly NEWER than the
 * last. Two genuinely distinct Event Pass purchases by one host in the same second do not happen;
 * Stripe re-delivering one event does.
 */
type Ordering = "absolute" | "accumulating";

/**
 * The outcome of a guarded entitlement write. `stale` is a SUCCESS: an out-of-order or replayed
 * delivery the guard correctly declined, which Stripe must be told is handled (200) or it retries
 * it for three days.
 */
type WriteResult = "applied" | "stale";

/**
 * Apply an entitlement patch to exactly one profile, or throw.
 *
 * TWO failures this closes:
 *
 * QA #4 — the update reported success on ZERO matched rows. A host paid, got nothing, and there
 * was no error, no Sentry event and no Stripe retry (200 means delivered). Nothing anywhere
 * reconciles Stripe against `profiles`, so that host stayed unprovisioned until they complained.
 * The write now `.select()`s and asserts exactly one row.
 *
 * QA #5 — the recency guard rides IN THE WHERE CLAUSE rather than in a read-then-write, so it is
 * atomic. Postgres re-evaluates the predicate against the locked row version under READ COMMITTED,
 * which means two concurrent deliveries genuinely serialize: the loser matches zero rows instead
 * of both passing off one stale read. Without it, a retried or out-of-order delivery could
 * re-grant Pro after a cancellation, or strip a paying host back to Free.
 *
 * Zero rows is therefore ambiguous, and the disambiguation matters: "the guard declined it" is a
 * 200, "no profile holds this Stripe customer" is a 500. One follow-up select on the same key
 * settles it, taken only on the zero-row path.
 */
async function applyEntitlement(
  admin: Admin,
  patch: TablesUpdate<"profiles">,
  key: { column: "id" | "stripe_customer_id"; value: string },
  createdAt: string,
  ordering: Ordering,
): Promise<WriteResult> {
  const { data: updated, error } = await admin
    .from("profiles")
    .update({ ...patch, stripe_event_created_at: createdAt })
    .eq(key.column, key.value)
    // The cursor advances in the SAME statement as the entitlement, and the comparison IS the
    // guard: an out-of-order or replayed delivery matches zero rows and writes nothing.
    .filter(
      "stripe_event_created_at",
      ordering === "absolute" ? "lte" : "lt",
      createdAt,
    )
    .select("id");

  if (error) throw new Error(`entitlement write: ${error.message}`);
  if (updated.length === 1) return "applied";

  if (updated.length > 1) {
    // Two profiles sharing one Stripe customer: whichever we just wrote, the other is now wrong.
    // The partial unique index in the Q2 migration makes this unreachable; the assertion stays as
    // the belt, because entitling the wrong account is worse than a retry.
    throw new Error(
      `entitlement write matched ${updated.length} profiles for ${key.column}`,
    );
  }

  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq(key.column, key.value);
  if (lookupError) {
    throw new Error(`entitlement write lookup: ${lookupError.message}`);
  }
  if (existing.length === 0) {
    throw new Error(`paid, but no profile matched on ${key.column}`);
  }
  return "stale";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header.", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      assertStripeEnv().STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    // Bad signature (or unconfigured secret) → reject. Never trust an unverified body.
    // A spike here signals a misconfigured secret; capture as a warning (no body/PII).
    captureWarning("webhook", "stripe signature verification failed");
    return new Response("Signature verification failed.", { status: 400 });
  }

  const admin = createAdminClient();
  const createdAt = deliveryCreatedAt(event);

  try {
    if (event.type === "checkout.session.completed") {
      // One-time Event Pass purchase → mint a LEDGER row, then recompute the profile
      // from the ledger (billing-caps.md; no subscription event fires for a one-time payment).
      // Replay-safety moved OFF the event-time ordering guard onto the ledger's unique
      // stripe_session_id: a re-delivery inserts nothing and the recompute re-derives
      // the same absolute state.
      const ref = eventPassSession(event);
      if (ref) {
        // The window this purchase occupies: an initial pass stacks a fresh year from
        // the purchase instant; a renewal chains onto the soonest-expiring active pass
        // (billing-caps.md's "extends, never resets", now per-window). price_cents records
        // what was ACTUALLY charged so promo purchases prorate off the real payment;
        // a missing amount degrades to 0 (never over-credit later).
        const passes = await getLivePasses(ref.userId);
        const kind = ref.renewal ? ("renewal" as const) : ("initial" as const);
        const window = passWindowForPurchase(kind, passes, ref.createdMs);
        await insertPassPurchase({
          profileId: ref.userId,
          startAt: window.startAt,
          expiresAt: window.expiresAt,
          priceCents: ref.amountTotalCents ?? 0,
          source: kind,
          stripeSessionId: ref.sessionId,
        });
        await recomputePassEntitlement(ref.userId);

        // Keep the customer bound + any stale subscription pointer cleared (a pass
        // holder has no live subscription by the checkout gate).
        const { error: bindError } = await admin
          .from("profiles")
          .update({
            stripe_customer_id: ref.customerId,
            stripe_subscription_id: null,
          })
          .eq("id", ref.userId);
        if (bindError) {
          throw new Error(`event-pass customer bind: ${bindError.message}`);
        }
        return Response.json({ received: true });
      }

      // A Pro checkout carrying a prorated pass credit (billing-caps.md): honor it BEFORE the
      // generic customer binding. Three idempotent steps, each safe under Stripe's
      // three-day retry window, ordered so a mid-flight failure can always resume:
      //   1. grant the credit as Stripe customer balance (the idempotency key pins the
      //      POST, so a retry never double-grants); balance auto-applies to upcoming
      //      Pro invoices and Checkout's own first invoice never consumes balance;
      //   2. consume every live pass ("nothing gets banked" — 0 rows on a replay);
      //   3. clear the chain fields (tier/cap themselves arrive via the subscription
      //      events, which also null event_slots).
      const credit = proCreditSession(event);
      if (credit) {
        await getStripe().customers.createBalanceTransaction(
          credit.customerId,
          {
            amount: -credit.creditCents,
            currency: "usd",
            description: "Event Pass credit (prorated)",
          },
          { idempotencyKey: `pass-credit-${credit.sessionId}` },
        );
        await consumeLivePassesForProCredit(credit.userId);
        const { error: clearError } = await admin
          .from("profiles")
          .update({ tier_expires_at: null, event_slots: null })
          .eq("id", credit.userId);
        if (clearError) {
          throw new Error(`pass credit clear: ${clearError.message}`);
        }
      }

      // Otherwise (Pro subscription checkout) just bind the Stripe customer to the host;
      // the tier is provisioned from the customer.subscription.* events below.
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null);
      if (userId && customerId) {
        // NOT an entitlement write, so it deliberately leaves no recency stamp:
        // customer.subscription.created can carry an EARLIER `created` than the checkout session
        // that produced it, and stamping here would make the guard drop the very event that
        // grants Pro. Zero rows is normal (checkout already persisted the id). An ERROR is not,
        // and used to be swallowed whole: an unbound customer means every later subscription
        // webhook for this host matches no profile.
        const { error } = await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId)
          .is("stripe_customer_id", null);
        if (error) throw new Error(`customer binding: ${error.message}`);
      }
      return Response.json({ received: true });
    }

    // A subscription billed more than once for one cap (the old portal stepper's
    // multiples): provisioning below still writes ONE plan's cap, unchanged, and the
    // operator hears about it, because the host is paying for more than they get.
    const multiple = subscriptionQuantityWarning(event);
    if (multiple) {
      captureWarning("billing", "stripe_subscription_quantity_above_1", {
        subscriptionId: multiple.subscriptionId,
        customerId: multiple.customerId,
        quantity: multiple.quantity,
        eventType: event.type,
      });
    }

    // Subscription lifecycle → derive tier + storage cap and write it (idempotent).
    // event_slots is nulled on EVERY subscription write: Pro is unlimited events, and a
    // stale stacked-pass slot count would cap a Pro host in enforce_event_limit's
    // coalesce. tier_expires_at is nulled for the same doctrine (billing-caps.md: nothing
    // banked behind Pro; a credited pass already cleared it, this is the belt). A null
    // patch writes nothing: an unrelated event, an unknown price, or a first payment
    // still in flight (`incomplete`, which must never downgrade a host it is paying for).
    const patch = resolveSubscriptionUpdate(event, planForPriceId);
    if (patch) {
      const result = await applyEntitlement(
        admin,
        {
          tier: patch.tier,
          storage_cap_bytes: patch.storageCapBytes,
          stripe_subscription_id: patch.subscriptionId,
          event_slots: null,
          tier_expires_at: null,
        },
        { column: "stripe_customer_id", value: patch.customerId },
        createdAt,
        "absolute",
      );

      // A downgrade to Free re-derives from the ledger: if the host somehow still owns
      // live UNCREDITED passes (they never started Pro through the credited checkout),
      // those windows resurface as event_pass entitlement instead of evaporating.
      if (result === "applied" && patch.tier === "free") {
        const { data: owner, error: ownerError } = await admin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", patch.customerId)
          .maybeSingle();
        if (ownerError) {
          throw new Error(`downgrade owner lookup: ${ownerError.message}`);
        }
        if (owner) await recomputePassEntitlement(owner.id);
      }
    }
  } catch (error) {
    // 5xx so STRIPE RETRIES. Every throw above lands on a host who is not getting what they paid
    // for, which must never resolve as a silent 200.
    const err = error instanceof Error ? error : new Error(String(error));
    captureError("billing", err, { eventType: event.type });
    return new Response(`Provisioning failed: ${err.message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
