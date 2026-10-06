/**
 * ★ WHEN A PASS-TO-PRO CREDIT IS STUCK (credit-watch; the credit itself is billing-caps.md's). PURE: no DB, no env,
 * so the operator's two pages, the jobs console's owed line and the reads all judge by this one rule.
 *
 * A credited Pro checkout leaves one claim (`pass_credits`): claimed (a delivery holds its lease), granted (the
 * customer balance is on record), converted (its passes are consumed as Pro credit). A healthy delivery takes all three
 * in one request of seconds, and a failing one is held by a 10-minute lease while Stripe retries it. So a claim is
 * STUCK when it has had far longer than any honest path:
 *   - never granted: no grant an hour after it was taken, and no delivery holding its lease right now (its holder died
 *     and no retry has finished it, or Stripe's retries ran out);
 *   - never converted: a grant on record an hour ago and its passes still unconverted (the host holds both her credit
 *     and her passes until it lands).
 * A released claim (another checkout credited its passes first; the webhook settled it) is settled, never stuck.
 *
 * The hour sits far past every honest path and well inside Stripe's three days of retries, so the operator hears of
 * it while a retry may still come, and Retry on the account's page runs the same path at once.
 */

/** How long a claim may sit at one step before it reads stuck. */
export const PASS_CREDIT_STUCK_AFTER_MS = 60 * 60 * 1000;

/** The claim's columns the rule reads (`pass_credits`). */
export type CreditClaimState = {
  /** The lease while a delivery grants; null once granted or released. */
  claimed_until: string | null;
  granted_at: string | null;
  converted_at: string | null;
  /** Another checkout credited its passes first: settled for good. */
  released_at: string | null;
  created_at: string;
};

/** Why a claim is stuck: no grant (its delivery died and no retry finished it), or a grant whose passes never converted. */
export type StuckKind = "never_granted" | "never_converted";

/** Both halves, in the order the pages list them. */
export const STUCK_KINDS: readonly StuckKind[] = [
  "never_granted",
  "never_converted",
];

/** Is this claim stuck at `nowMs`, and how. */
export function stuckKind(
  claim: CreditClaimState,
  nowMs: number,
): StuckKind | null {
  if (claim.released_at !== null) return null;
  const cutoff = nowMs - PASS_CREDIT_STUCK_AFTER_MS;
  if (claim.granted_at === null) {
    // A live lease is a delivery at work on it right now, whatever the claim's age.
    const leased =
      claim.claimed_until !== null && Date.parse(claim.claimed_until) > nowMs;
    return !leased && Date.parse(claim.created_at) < cutoff
      ? "never_granted"
      : null;
  }
  return claim.converted_at === null && Date.parse(claim.granted_at) < cutoff
    ? "never_converted"
    : null;
}

/** When a stuck claim began owing: its claim (never granted), or its grant (never converted). */
export function stuckSince(
  claim: Pick<CreditClaimState, "granted_at" | "created_at">,
  kind: StuckKind,
): string {
  return kind === "never_converted" && claim.granted_at !== null
    ? claim.granted_at
    : claim.created_at;
}

/**
 * ★ WHAT ONLY STRIPE CAN SETTLE (credit-watch's red-team): two credits for one set of passes, which no retry fixes and
 * the operator settles by reversing one balance transaction in Stripe. Said on the Accounts list for a month after it
 * happened (a person reverses it in days, and nothing records that they did, so it never counts as owed):
 *   - granted twice: a claim released with a grant beside it (its dead holder's grant turned up after another
 *     checkout credited the passes): that grant is the one to reverse;
 *   - converted none: a granted claim whose conversion found every pass it names credited already (another
 *     conversion took them, the older build's, which may have granted its own credit).
 */
export const SETTLE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type SettleKind = "granted_twice" | "converted_none";

/** Both kinds, in the order the list says them. */
export const SETTLE_KINDS: readonly SettleKind[] = [
  "granted_twice",
  "converted_none",
];

/** The claim's columns the settle rule reads. */
export type CreditSettleState = Pick<
  CreditClaimState,
  "granted_at" | "converted_at" | "released_at"
> & { converted_count: number | null };

/** Does this claim wait on Stripe at `nowMs` (inside the month), and how. */
export function settleKind(
  claim: CreditSettleState,
  nowMs: number,
): SettleKind | null {
  const since = nowMs - SETTLE_WINDOW_MS;
  if (
    claim.released_at !== null &&
    claim.granted_at !== null &&
    Date.parse(claim.released_at) > since
  ) {
    return "granted_twice";
  }
  if (
    claim.converted_at !== null &&
    (claim.converted_count ?? 0) === 0 &&
    Date.parse(claim.converted_at) > since
  ) {
    return "converted_none";
  }
  return null;
}

/** When it came to wait on Stripe: its release (granted twice) or its conversion (converted none). */
export function settleSince(
  claim: Pick<CreditSettleState, "released_at" | "converted_at">,
  kind: SettleKind,
): string {
  return (
    (kind === "granted_twice" ? claim.released_at : claim.converted_at) ?? ""
  );
}
