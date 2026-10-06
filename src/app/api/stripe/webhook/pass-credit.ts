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
 * neither checkout granted. ★ And a claim taken past such a lease once it lapsed names that claim as an orphan, whose
 * grant (its holder may have died after Stripe and before the record) is looked for before this one grants; a grant
 * found is adopted in ONE transaction (billing-orphans: on record, converted, this claim released), two orphans granted
 * for one pass leaving the younger released beside its grant (granted twice). This
 * checkout's own claim, left open by a holder that died, is settled at its overlap: looked for on Stripe's side, then
 * released, its lost grant on record beside it when there was one.
 *
 * Run by the webhook for each credited checkout and by the operator's Retry on /admin/accounts for one that stuck
 * (`retryPassCreditAsOperatorAction`): the claim makes the two one path, whichever runs first.
 */
import "server-only";

import type Stripe from "stripe";

import {
  adoptPassCreditOrphans,
  claimPassCredit,
  convertPassCredit,
  PassCreditReleasedError,
  recordPassCreditGrant,
  releasePassCredit,
  type ClaimOrphan,
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

/**
 * The credit's balance transactions Stripe holds for these checkouts of one customer (grants whose records were lost),
 * by session, from one listing of that customer's transactions since `since` (unix seconds on Stripe's clock: a
 * checkout's `created`, so no grant for it is older). The first found for a session is its grant: a key holds its
 * parameters, so a session's own grants repeat one id.
 */
async function findGrants(
  customerId: string,
  sessions: readonly string[],
  since: number,
): Promise<Map<string, string>> {
  const wanted = new Set(sessions);
  const found = new Map<string, string>();
  if (wanted.size === 0) return found;
  const transactions = getStripe().customers.listBalanceTransactions(
    customerId,
    { created: { gte: since }, limit: 100 },
  );
  for await (const transaction of transactions) {
    const session = transaction.metadata?.[PASS_CREDIT_SESSION_KEY];
    if (session && wanted.has(session) && !found.has(session)) {
      found.set(session, transaction.id);
      if (found.size === wanted.size) break;
    }
  }
  return found;
}

/** This checkout's own grant on Stripe's side, when its record was lost. */
async function findGrant(input: PassCreditInput): Promise<string | null> {
  const found = await findGrants(
    input.customerId,
    [input.sessionId],
    input.sessionCreated,
  );
  return found.get(input.sessionId) ?? null;
}

/**
 * How much of a claim's lease must be left to grant: the grant (Stripe's timeout is 80 s) and its record must land
 * before the lease ends, or another delivery may take the claim over and grant too.
 */
const GRANT_LEASE_MARGIN_MS = 3 * 60_000;

/**
 * ★ EVERY LOST GRANT THESE PASSES MAY ALREADY HOLD, before this checkout grants: its own when it took over a lapsed
 * lease, and each orphan's. An orphan's checkout is read from Stripe for the customer it charged and its time on
 * Stripe's clock, since its grant went to ITS customer (two first checkouts can each make one) and the database's
 * clock is not Stripe's; then one listing a customer. Any failed read throws: a retry looks again, and nothing is
 * granted on a guess.
 */
async function findLostGrants(
  input: PassCreditInput,
  resumed: boolean,
  orphans: readonly ClaimOrphan[],
): Promise<Map<string, string>> {
  const byCustomer = new Map<string, { sessions: string[]; since: number }>();
  const add = (customerId: string, session: string, since: number) => {
    const entry = byCustomer.get(customerId);
    if (entry) {
      entry.sessions.push(session);
      entry.since = Math.min(entry.since, since);
    } else {
      byCustomer.set(customerId, { sessions: [session], since });
    }
  };
  if (resumed) add(input.customerId, input.sessionId, input.sessionCreated);
  for (const orphan of orphans) {
    const session = await getStripe().checkout.sessions.retrieve(
      orphan.session,
    );
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ?? input.customerId);
    add(customerId, orphan.session, session.created);
  }
  const found = new Map<string, string>();
  for (const [customerId, { sessions, since }] of byCustomer) {
    for (const [session, transaction] of await findGrants(
      customerId,
      sessions,
      since,
    )) {
      found.set(session, transaction);
    }
  }
  return found;
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
        const settled = await releasePassCredit(
          input.sessionId,
          input.userId,
          lost,
        );
        if (lost && settled === "released_granted") {
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
      // ★ LOOK BEFORE GRANTING, for every grant Stripe may hold with no record: this checkout's own when it took over
      // a lapsed lease, and each orphan's (another checkout's claim on these passes whose holder died with no grant on
      // record: waiting on its lease rather than refusing gave this retry the time to claim past it).
      const found = await findLostGrants(input, claim.resumed, claim.orphans);
      const own = found.get(input.sessionId) ?? null;
      const adopted = own
        ? []
        : claim.orphans.filter((orphan) => found.has(orphan.session));
      if (adopted.length > 0) {
        // ★ Other checkouts' dead holders granted these passes and lost their records: each grant is its own
        // checkout's, put on record on its claim and converted, and this checkout's claim is released, granting
        // nothing, all in ONE transaction (billing-orphans): three calls left an orphan granted and unconverted when a
        // failure fell between them. Two orphans holding grants for one pass: the older is the credit, the younger is
        // released beside its grant (granted twice), which the operator reverses in Stripe.
        const adoption = await adoptPassCreditOrphans(
          input.sessionId,
          input.userId,
          adopted.map((orphan) => ({
            session: orphan.session,
            balanceTransactionId: found.get(orphan.session)!,
          })),
        );
        // An orphan's own delivery came back and holds its lease again: nothing was written; the retry meets its
        // grant or its lapse.
        if (adoption.state === "busy") return "busy_another_checkout";
        for (const orphan of adoption.orphans) {
          if (orphan.grantedTwice) {
            captureWarning("billing", "stripe_pass_credit_overlap_granted", {
              sessionId: orphan.session,
              customerId: input.customerId,
              alsoGranted: orphan.balanceTransactionId,
              creditedBy: adoption.orphans.find((o) => !o.grantedTwice)
                ?.session,
            });
          }
        }
        captureWarning("billing", "stripe_pass_credit_overlap", {
          sessionId: input.sessionId,
          customerId: input.customerId,
          creditCents: input.creditCents,
          passes: input.passIds.length,
          creditedBy: adoption.orphans
            .filter((orphan) => !orphan.grantedTwice)
            .map((orphan) => orphan.session),
        });
        return "overlap";
      }
      // ★ NEVER GRANT PAST THE LEASE: a caller with no maxDuration (a local build's Retry, a laptop that slept) could
      // be past it, where another delivery may have taken the claim over and granted. Stop short of Stripe instead:
      // the failure is a retry, and the retry claims again.
      if (
        !own &&
        claim.claimedUntil !== null &&
        Date.now() > Date.parse(claim.claimedUntil) - GRANT_LEASE_MARGIN_MS
      ) {
        throw new Error(
          "the claim's lease ran short before its grant; nothing was granted, so a retry claims again",
        );
      }
      const transaction = own ?? (await grant(input));
      let recorded: string;
      try {
        recorded = await recordPassCreditGrant(
          input.sessionId,
          input.userId,
          transaction,
        );
      } catch (error) {
        if (!(error instanceof PassCreditReleasedError)) throw error;
        // ★ This holder outlived its lease: another checkout credited its passes and released this claim, and then
        // this grant landed. It is no credit: on record beside the release (granted twice), the operator's to reverse.
        await releasePassCredit(input.sessionId, input.userId, transaction);
        captureWarning("billing", "stripe_pass_credit_overlap_granted", {
          sessionId: input.sessionId,
          customerId: input.customerId,
          creditCents: input.creditCents,
          alsoGranted: transaction,
        });
        return "overlap";
      }
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
      await convertPassCredit(input.sessionId, input.userId);
      await settleOrphans(input, claim.orphans, found);
      return "converted";
    }
    case "granted":
      break;
  }

  await convertPassCredit(input.sessionId, input.userId);
  return "converted";
}

/**
 * ★ THE ORPHANS, SETTLED once this checkout's credit has landed: their holders are dead and their passes are this
 * checkout's credit now, so each is released, never left to read stuck; one whose grant Stripe holds after all (a
 * double grant from before this look) goes on record beside its release, said as granted twice. Housekeeping after the
 * credit: a failure is warned, never a failed delivery (a retry meets the grant on record and never comes back here;
 * a claim left unsettled shows as stuck, with its Retry).
 */
async function settleOrphans(
  input: PassCreditInput,
  orphans: readonly ClaimOrphan[],
  found: ReadonlyMap<string, string>,
): Promise<void> {
  for (const orphan of orphans) {
    const lost = found.get(orphan.session) ?? null;
    try {
      const settled = await releasePassCredit(
        orphan.session,
        input.userId,
        lost,
      );
      // Said only when the grant went on record beside the release (a replay may find one released without it).
      if (lost && settled === "released_granted") {
        captureWarning("billing", "stripe_pass_credit_overlap_granted", {
          sessionId: orphan.session,
          customerId: input.customerId,
          alsoGranted: lost,
          creditedBy: input.sessionId,
        });
      }
    } catch (error) {
      captureWarning("billing", "stripe_pass_credit_orphan_unsettled", {
        sessionId: orphan.session,
        customerId: input.customerId,
        creditedBy: input.sessionId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
