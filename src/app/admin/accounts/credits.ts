import { stuckKind, type StuckKind } from "@/lib/billing/passes-stuck";
import type { PassCreditRow } from "@/lib/db/queries/pass-credits";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

/**
 * HOW THE OPERATOR READS A PASS-TO-PRO CREDIT (credit-watch; the credit itself is billing-caps.md's): what became of
 * each credited Pro checkout, in the words the Accounts list and the account's page share, so a row and the card under
 * it cannot disagree. The stuck rule is `billing/passes-stuck.ts`' (an hour at one step); the reads are
 * `db/queries/pass-credits.ts`.
 *
 * A credited checkout's claim moves claimed, granted (the Stripe customer balance on record), converted (her passes
 * consumed as Pro credit), in one delivery of seconds. What the operator meets here is the rest: a claim a delivery
 * holds right now, one stuck at a step (Retry runs the webhook's own path for it), one another checkout credited
 * first (released: nothing owed), and the two that only Stripe can settle, two grants for one set of passes.
 */

export type CreditState =
  /** Its passes became credit: done. */
  | "converted"
  /**
   * Granted, and its conversion found every pass it names credited already: another conversion took them (the older
   * build's, which converts without a claim), which may have granted a credit of its own.
   */
  | "converted_none"
  /** A delivery holds its lease right now. */
  | "granting"
  /** Granted moments ago, converting. */
  | "converting"
  /** Claimed under the hour, no delivery holding it: Stripe's retry is on its way. */
  | "waiting"
  /** Another checkout credited its passes first, and nothing was granted for this one. */
  | "released"
  /** Another checkout credited its passes first, and this one's dead holder had granted on Stripe's side too. */
  | "granted_twice"
  | StuckKind;

/** Where a claim stands at `nowMs`. */
export function creditState(row: PassCreditRow, nowMs: number): CreditState {
  if (row.released_at !== null) {
    return row.granted_at === null ? "released" : "granted_twice";
  }
  if (row.converted_at !== null) {
    return (row.converted_count ?? 0) > 0 ? "converted" : "converted_none";
  }
  const stuck = stuckKind(row, nowMs);
  if (stuck) return stuck;
  if (row.granted_at !== null) return "converting";
  return row.claimed_until !== null && Date.parse(row.claimed_until) > nowMs
    ? "granting"
    : "waiting";
}

/** The states that wait on the operator: Retry for a stuck one, Stripe for two grants. */
export function creditNeedsALook(state: CreditState): boolean {
  return (
    state === "never_granted" ||
    state === "never_converted" ||
    state === "converted_none" ||
    state === "granted_twice"
  );
}

/** The states Retry settles: it runs the webhook's own path (claim, grant once, convert, or settle an overlap). */
export function creditRetryable(state: CreditState): boolean {
  return state === "never_granted" || state === "never_converted";
}

/** A credit in dollars, as Stripe's balance shows it ("$18.50"). The grant is always USD. */
export function creditDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** The badge a state wears; null where the line says it all. */
export function creditBadge(state: CreditState): string | null {
  switch (state) {
    case "never_granted":
    case "never_converted":
      return "Stuck";
    case "converted_none":
      return "Check Stripe";
    case "granted_twice":
      return "Granted twice";
    default:
      return null;
  }
}

const passes = (n: number) =>
  `${formatCount(n)} ${n === 1 ? "pass" : "passes"}`;

/**
 * What became of one credited checkout, as a sentence: the credit, its passes and the moment that matters for its
 * state, to the minute (the page's clock), and what happens next where something waits.
 */
export function creditSentence(row: PassCreditRow, nowMs: number): string {
  const credit = creditDollars(row.credit_cents);
  const named = passes(row.pass_ids.length);
  const at = (value: string | null) =>
    value === null ? "at an unknown time" : formatAdminTimestamp(value);
  switch (creditState(row, nowMs)) {
    case "converted":
      return `${credit} granted ${at(row.granted_at)}; ${passes(row.converted_count ?? 0)} became credit ${at(row.converted_at)}.`;
    case "converted_none":
      return `${credit} granted ${at(row.granted_at)}, but its ${named} were credit already, so none converted: another conversion took them, which may have granted its own credit. Check Stripe for two grants, and reverse one.`;
    case "never_granted":
      return `Claimed ${at(row.created_at)} for ${credit} over ${named}, never granted: its delivery died and no retry has finished it. Retry runs it now.`;
    case "never_converted":
      return `${credit} granted ${at(row.granted_at)}; its ${named} never converted, so she holds both. Retry converts them now.`;
    case "granting":
      return `A delivery is granting ${credit} over ${named} right now (its claim holds until ${at(row.claimed_until)}).`;
    case "converting":
      return `${credit} granted ${at(row.granted_at)}; converting its ${named}.`;
    case "waiting":
      return `Claimed ${at(row.created_at)} for ${credit} over ${named}; its delivery stopped, and Stripe's retry finishes it.`;
    case "released":
      return `Not credited: another checkout of hers credited its ${named} first (released ${at(row.released_at)}). Nothing is owed.`;
    case "granted_twice":
      return `Another checkout of hers credited its ${named} first, and this one's ${credit} grant landed on Stripe too (found ${at(row.released_at)}): two credits for one set of passes. Reverse one grant in Stripe.`;
  }
}

/** A stuck credit's line on the Accounts list: why, since when. */
export function stuckLine(kind: StuckKind, since: string): string {
  return kind === "never_granted"
    ? `Never granted, claimed ${formatAdminTimestamp(since)}`
    : `Never converted, granted ${formatAdminTimestamp(since)}`;
}
