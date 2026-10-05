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
 * GRANTED claim (two Checkout tabs each stamped a credit for the same passes), answers overlap: nothing granted,
 * nothing converted, and the operator hears of it (the second tab's subscription also bills, which the operator
 * settles). ★ Another checkout's claim that only holds its lease answers busy (credit-watch): a lease is never a
 * refusal, since its holder can die, and the tab told overlap for good while the first tab's retries ran out left
 * neither checkout granted. This checkout's own claim, left open by a holder that died, is settled at its overlap:
 * looked for on Stripe's side, then released, its lost grant on record beside it when there was one.
 *
 * Run by the webhook for each credited checkout and by the operator's Retry on /admin/accounts for one that stuck
 * (`retryPassCreditAsOperatorAction`): the claim makes the two one path, whichever runs first.
 */
import "server-only";

import type Stripe from "stripe";

import {
  claimPassCredit,
  convertPassCredit,
  recordPassCreditGrant,
  releasePassCredit,
} from "@/lib/db/mutations/event-passes";
import { creditedPassIds } from "@/lib/billing/passes";
import { captureWarning } from "@/lib/observability/sentry";
import { getStripe } from "@/lib/stripe/client";
import { proCreditSession, type ProCreditRef } from "@/lib/stripe/provision";

/** The metadata key a credit's balance transaction carries its checkout session under: how a lost grant is found. */
export const PASS_CREDIT_SESSION_KEY = "pass_credit_session";

/**
 * What honouring one credited checkout came to. A busy one is not done: the route answers non-2xx and Stripe retries.
 * `busy_this_checkout` met another delivery of this checkout holding its claim; `busy_another_checkout` met another
 * checkout's claim holding a pass it names, whose grant or lapse the retry meets.
 */
export type PassCreditOutcome =
  | "converted"
  | "busy_this_checkout"
  | "busy_another_checkout"
  | "overlap"
  | "no_host";

/** Is it not done yet (a lease holds it), so the delivery answers non-2xx and Stripe retries? */
export function creditBusy(outcome: PassCreditOutcome): boolean {
  return (
    outcome === "busy_this_checkout" || outcome === "busy_another_checkout"
  );
}

export type PassCreditInput = ProCreditRef & {
  /** The passes the checkout credited, each once (`creditedPassIds`). */
  passIds: string[];
  /** The session's `created` (unix seconds): no grant for it can be older, so the Stripe-side search starts there. */
  sessionCreated: number;
};

/**
 * The credit a completed checkout carries, read exactly as the webhook reads its delivery (`proCreditSession`,
 * `creditedPassIds`): the operator's Retry hands it the session it retrieved from Stripe, which is the very object
 * that checkout's `checkout.session.completed` event carries (the parse reads nothing else of the event). Null when
 * the session carries no credit; `names_no_pass` when it carries one but names no pass it can be held to (the webhook's
 * 500: never a guess at which passes it meant).
 */
export function creditOfSession(
  session: Stripe.Checkout.Session,
): PassCreditInput | "names_no_pass" | null {
  const credit = proCreditSession({
    type: "checkout.session.completed",
    data: { object: session },
  } as unknown as Stripe.Event);
  if (!credit) return null;
  const passIds = creditedPassIds(session.metadata);
  if (!passIds) return "names_no_pass";
  return { ...credit, passIds, sessionCreated: session.created };
}

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
      return claim.heldBy === "another_checkout"
        ? "busy_another_checkout"
        : "busy_this_checkout";
    case "overlap": {
      // ★ This checkout's own claim, still open beside the overlap, lost its passes while its holder was dead (another
      // checkout credited them after its lease lapsed), and that holder may have granted on Stripe's side before its
      // record was lost. So look there, then settle it: released for good, never stuck, and a grant found is put on
      // record beside it, two grants for one set of passes that only the operator can settle by reversing one.
      if (claim.unsettled) {
        const lost = await findGrant(input);
        await releasePassCredit(input.sessionId, input.userId, lost);
        if (lost) {
          captureWarning("billing", "stripe_pass_credit_overlap_granted", {
            sessionId: input.sessionId,
            customerId: input.customerId,
            creditCents: input.creditCents,
            alsoGranted: lost,
          });
        }
      }
      captureWarning("billing", "stripe_pass_credit_overlap", {
        sessionId: input.sessionId,
        customerId: input.customerId,
        creditCents: input.creditCents,
        passes: input.passIds.length,
      });
      return "overlap";
    }
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
