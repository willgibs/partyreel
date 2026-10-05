/**
 * Event Pass ledger writes (billing-caps.md) — service-role only, called by the Stripe
 * webhook and the nightly sweeps. Four invariants live here:
 *
 *   1. INSERTS ARE THE IDEMPOTENCY BOUNDARY: one Checkout session mints at most
 *      one row (unique partial index on stripe_session_id); a Stripe re-delivery
 *      surfaces as 23505 and is reported as "replay", never an error.
 *   2. THE PROFILE IS DERIVED STATE: `recompute_pass_entitlement` is the ONLY writer
 *      of the pass-owned profile fields (tier/storage_cap_bytes/event_slots/
 *      tier_expires_at for non-Pro profiles), always writing the full set from the
 *      ledger so a replayed recompute lands the same row; the one other write is the
 *      credit's conversion (4), which only clears the chain.
 *   3. NEVER TOUCH A PRO PROFILE: the subscription webhook owns those fields for
 *      tier='pro'. The recompute reads the tier under her profiles row lock and writes
 *      in the same transaction, so a concurrent Pro provision is never clobbered by a
 *      recompute that read a stale tier.
 *   4. ★ THE PASS-TO-PRO CREDIT IS GRANTED ONCE EVER AND CONVERTS ONLY WHAT IT CREDITED
 *      (billing-integrity, 20261005181000): a claim of our own keyed by the checkout
 *      session (`claim_pass_credit`), the grant put on record (`record_pass_credit_grant`),
 *      then exactly the passes the session named converted (`convert_pass_credit`). Each
 *      is one SQL transaction that takes her profiles row first, the one lock order every
 *      capacity body keeps (database-security.md): an upload's complete holds that row
 *      while it counts on her live pass.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

export type PassPurchaseInsert = {
  profileId: string;
  startAt: string;
  expiresAt: string;
  priceCents: number;
  source: "initial" | "renewal";
  stripeSessionId: string;
};

/** Mint the ledger row for one paid Checkout session. Replay-safe by session id. */
export async function insertPassPurchase(
  purchase: PassPurchaseInsert,
): Promise<"inserted" | "replay"> {
  const { error } = await createAdminClient().from("event_passes").insert({
    profile_id: purchase.profileId,
    start_at: purchase.startAt,
    expires_at: purchase.expiresAt,
    price_cents: purchase.priceCents,
    source: purchase.source,
    stripe_session_id: purchase.stripeSessionId,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return "replay";
    throw new Error(`event_passes insert: ${error.message}`);
  }
  return "inserted";
}

/** What a credit's claim answers (`claim_pass_credit`, read on every delivery before any grant). */
export type PassCreditClaim =
  /** This delivery holds the claim; `resumed` when it took over a lapsed one, so look on Stripe's side first. */
  | { state: "claimed"; resumed: boolean }
  /** The grant is on record: never grant again, whenever the retry comes. */
  | { state: "granted"; balanceTransactionId: string }
  /** Another delivery holds the claim's lease: answer non-2xx and let Stripe retry. */
  | { state: "busy"; retryAfterSec: number }
  /** A pass it names was converted already, or is another checkout's to credit: grant and convert nothing. */
  | { state: "overlap" }
  /** No profile holds the host: nothing to credit. */
  | { state: "no_host" };

/** Read `claim_pass_credit`'s answer, or throw: an answer it does not know is a broken call, never a guess. */
export function parseClaim(data: unknown): PassCreditClaim {
  const answer = (typeof data === "object" && data !== null ? data : {}) as {
    state?: unknown;
    resumed?: unknown;
    balance_transaction_id?: unknown;
    retry_after_sec?: unknown;
  };
  switch (answer.state) {
    case "claimed":
      if (typeof answer.resumed === "boolean") {
        return { state: "claimed", resumed: answer.resumed };
      }
      break;
    case "granted":
      if (
        typeof answer.balance_transaction_id === "string" &&
        answer.balance_transaction_id !== ""
      ) {
        return {
          state: "granted",
          balanceTransactionId: answer.balance_transaction_id,
        };
      }
      break;
    case "busy": {
      const secs = Number(answer.retry_after_sec);
      return {
        state: "busy",
        retryAfterSec:
          Number.isFinite(secs) && secs >= 1 ? Math.ceil(secs) : 600,
      };
    }
    case "overlap":
    case "no_host":
      return { state: answer.state };
  }
  throw new Error("claim_pass_credit answered something it never answers");
}

/**
 * Take (or read) the claim on one credited checkout's credit before any grant: its session, the host, the credit the
 * checkout computed and the passes it named. A failed call throws, so the webhook answers 500 and Stripe retries.
 */
export async function claimPassCredit(input: {
  sessionId: string;
  hostId: string;
  creditCents: number;
  passIds: string[];
}): Promise<PassCreditClaim> {
  const { data, error } = await createAdminClient().rpc(
    "claim_pass_credit",
    {
      p_session_id: input.sessionId,
      p_host_id: input.hostId,
      p_credit_cents: input.creditCents,
      p_pass_ids: input.passIds,
    },
  );
  if (error) throw new Error(`claim_pass_credit: ${error.message}`);
  return parseClaim(data);
}

/**
 * Put a credit's customer-balance transaction on record, once. Answers the transaction on record: the one passed, or an
 * earlier one when there is one (two grants for one checkout, which the caller reports).
 */
export async function recordPassCreditGrant(
  sessionId: string,
  hostId: string,
  balanceTransactionId: string,
): Promise<string> {
  const { data, error } = await createAdminClient().rpc(
    "record_pass_credit_grant",
    {
      p_session_id: sessionId,
      p_host_id: hostId,
      p_balance_transaction_id: balanceTransactionId,
    },
  );
  if (error) throw new Error(`record_pass_credit_grant: ${error.message}`);
  if (typeof data !== "string" || data === "") {
    throw new Error(
      "record_pass_credit_grant answered something other than a transaction",
    );
  }
  return data;
}

/**
 * Convert exactly the passes a granted credit's checkout named (consumed `pro_credit`) and clear the chain fields when
 * any converted, in ONE transaction that takes her profiles row first. Returns how many this call converted: 0 on a
 * replay, which the webhook reads as success, and never a pass bought after the checkout. A failed call throws, so the
 * webhook answers 500 and Stripe retries, behind a grant on record that cannot repeat.
 */
export async function convertPassCredit(
  sessionId: string,
  hostId: string,
): Promise<number> {
  const { data, error } = await createAdminClient().rpc(
    "convert_pass_credit",
    { p_session_id: sessionId, p_host_id: hostId },
  );
  if (error) throw new Error(`convert_pass_credit: ${error.message}`);
  // The function answers a row count; anything else is a broken call, never "nothing to convert".
  if (typeof data !== "number" || !Number.isInteger(data) || data < 0) {
    throw new Error(
      "convert_pass_credit answered something other than a count",
    );
  }
  return data;
}

export type RecomputeResult = "updated" | "unchanged" | "skipped_pro";

const RECOMPUTE_RESULTS: readonly unknown[] = [
  "updated",
  "unchanged",
  "skipped_pro",
] satisfies RecomputeResult[];

/**
 * Re-derive a profile's pass entitlement from its ledger and write the four pass-owned fields together, in ONE SQL
 * transaction under her profiles row lock (`recompute_pass_entitlement`). It read the ledger and wrote the profile in
 * two requests, so a conversion landing between them had its cleared chain put back until the subscription event came.
 * Safe to call any time (webhook, sweeps, drift healing): a pure function of the ledger and the instant, the sweep's
 * `now` when it passes one, the database's otherwise. Never a Pro profile (`skipped_pro`).
 */
export async function recomputePassEntitlement(
  profileId: string,
  now?: Date,
): Promise<RecomputeResult> {
  const { data, error } = await createAdminClient().rpc(
    "recompute_pass_entitlement",
    // A null instant is the database's own now(): the key is left out and the default applies.
    { p_host_id: profileId, p_now: now?.toISOString() },
  );
  if (error) throw new Error(`recompute_pass_entitlement: ${error.message}`);
  if (!RECOMPUTE_RESULTS.includes(data)) {
    throw new Error(
      "recompute_pass_entitlement answered something it never answers",
    );
  }
  return data as RecomputeResult;
}
