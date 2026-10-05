/**
 * ★ THE PASS-TO-PRO CREDIT, GRANTED ONCE EVER, CONVERTING ONLY WHAT IT CREDITED (billing-caps.md; billing-integrity).
 *
 * A Pro checkout that carries a prorated pass credit (`proCreditSession`) names every pass the credit counted
 * (`creditedPassIds`). The webhook honours it in three steps, ordered so a delivery failing anywhere resumes:
 *
 *   1. THE CLAIM, taken before the grant and read on every retry (`claim_pass_credit`, keyed by the checkout session).
 *      A claim already granted answers so: no second grant, whenever the retry comes. Stripe's idempotency key held the
 *      grant for at least 24 hours while a failing delivery retries for three days, so a conversion still failing a day
 *      on granted the balance again. Another delivery holding the claim's lease (the two TEST endpoints receive every
 *      event) answers busy, and Stripe retries this one.
 *   2. THE GRANT, as Stripe customer balance (auto-applied to the upcoming Pro invoices; Checkout's own first invoice
 *      never takes balance, so nothing is lost to the first charge), carrying the session in its metadata and keyed
 *      `pass-credit-<session>` still. A claim that lapsed with no grant on record (a delivery that died between Stripe
 *      and the record) looks on Stripe's side for that metadata first, so a grant lost mid-call is found, never repeated.
 *      Then the grant goes on record (`record_pass_credit_grant`).
 *   3. THE CONVERSION of exactly the passes the session named (`convert_pass_credit`), never a pass bought after the
 *      checkout: a replay used to consume every unconsumed pass, a pass paid a day after going Pro included.
 *
 * ★ A pass is credited once ever: a checkout whose passes were converted already, or are named by another checkout's
 * claim (two Checkout tabs each stamped a credit for the same passes), answers overlap: nothing granted, nothing
 * converted, and the operator hears of it (the second tab's subscription also bills, which the operator settles).
 */
import "server-only";

import type Stripe from "stripe";

import {
  claimPassCredit,
  convertPassCredit,
  recordPassCreditGrant,
} from "@/lib/db/mutations/event-passes";
import { captureWarning } from "@/lib/observability/sentry";
import { getStripe } from "@/lib/stripe/client";
import type { ProCreditRef } from "@/lib/stripe/provision";

/** The metadata key a credit's balance transaction carries its checkout session under: how a lost grant is found. */
export const PASS_CREDIT_SESSION_KEY = "pass_credit_session";

/** What honouring one credited checkout came to. Only `busy` is not done: the route answers non-2xx for it. */
export type PassCreditOutcome = "converted" | "busy" | "overlap" | "no_host";

export type PassCreditInput = ProCreditRef & {
  /** The passes the checkout credited, each once (`creditedPassIds`). */
  passIds: string[];
  /** The session's `created` (unix seconds): no grant for it can be older, so the Stripe-side search starts there. */
  sessionCreated: number;
};

/** The credit's balance transaction for this session, when Stripe holds one (a grant whose record was lost). */
async function findGrant(input: PassCreditInput): Promise<string | null> {
  const transactions = getStripe().customers.listBalanceTransactions(
    input.customerId,
    { created: { gte: input.sessionCreated }, limit: 100 },
  );
  for await (const transaction of transactions) {
    if (transaction.metadata?.[PASS_CREDIT_SESSION_KEY] === input.sessionId) {
      return transaction.id;
    }
  }
  return null;
}

async function grant(input: PassCreditInput): Promise<string> {
  const transaction: Stripe.CustomerBalanceTransaction =
    await getStripe().customers.createBalanceTransaction(
      input.customerId,
      {
        amount: -input.creditCents,
        currency: "usd",
        description: "Event Pass credit (prorated)",
        metadata: { [PASS_CREDIT_SESSION_KEY]: input.sessionId },
      },
      { idempotencyKey: `pass-credit-${input.sessionId}` },
    );
  return transaction.id;
}

/**
 * Honour one credited checkout: claim, grant once (found on Stripe's side when a lapsed claim lost its record), then
 * convert exactly what it credited. Every failure throws, so the delivery is a 500 and Stripe retries behind a claim
 * that remembers what already happened.
 */
export async function honorPassCredit(
  input: PassCreditInput,
): Promise<PassCreditOutcome> {
  const claim = await claimPassCredit({
    sessionId: input.sessionId,
    hostId: input.userId,
    creditCents: input.creditCents,
    passIds: input.passIds,
  });

  switch (claim.state) {
    case "no_host":
      return "no_host";
    case "busy":
      return "busy";
    case "overlap":
      captureWarning("billing", "stripe_pass_credit_overlap", {
        sessionId: input.sessionId,
        customerId: input.customerId,
        creditCents: input.creditCents,
        passes: input.passIds.length,
      });
      return "overlap";
    case "claimed": {
      const found = claim.resumed ? await findGrant(input) : null;
      const transaction = found ?? (await grant(input));
      const recorded = await recordPassCreditGrant(
        input.sessionId,
        input.userId,
        transaction,
      );
      // Two grants for one checkout (two deliveries past each other's lease): both bill against one credit, which only
      // the operator can settle, by reversing one in Stripe.
      if (recorded !== transaction) {
        captureWarning("billing", "stripe_pass_credit_granted_twice", {
          sessionId: input.sessionId,
          customerId: input.customerId,
          recorded,
          alsoGranted: transaction,
        });
      }
      break;
    }
    case "granted":
      break;
  }

  await convertPassCredit(input.sessionId, input.userId);
  return "converted";
}
