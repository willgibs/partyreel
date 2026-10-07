import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatBytes } from "@/lib/utils";

/**
 * THE OPERATOR'S AUDITED UPLOADS CREDIT, IN THE WORDS THE PAGE, THE CONTROL AND THE ACTION SHARE (crumbs-92, Will's yes
 * to the calls lab's X6). The mechanism is `grant_uploads_credit` (20261008060000): extra room in a host's current
 * uploads window, ending with it, with a required reason, logged in `admin_actions`, bounded, idempotent per press.
 * The reads are `lib/db/queries/uploads-credits.ts`, the write `lib/db/mutations/uploads-credit.ts`.
 *
 * Pure and client-safe on purpose: the control (a client component) validates with these before it asks, and the
 * server action validates again, because the database is the only bound anyone must obey.
 */

/**
 * ★ THE THREE FIGURES BELOW ARE THE SQL'S, `grant_uploads_credit`'s `c_credit_min`, `c_credit_live` and `c_reason_max`;
 * `lib/db/uploads-credit-sql.test.ts` reads them off the newest migration that sets them, so a new number there fails
 * here (the hour's breaker, `UPLOADS_AN_HOUR`, is held the same way).
 */
export const UPLOADS_CREDIT_MIN_BYTES = 1_048_576;
export const UPLOADS_CREDIT_MAX_LIVE = 10;
export const UPLOADS_CREDIT_REASON_MAX = 500;

/**
 * A sanity ceiling for what the control and the action accept before they ask: one terabyte, in megabytes. The real
 * bound is the plan's own allowance (the SQL's), which no figure typed here can pass; this only keeps a slipped digit
 * from travelling as far as the database to be told so.
 */
export const UPLOADS_CREDIT_MAX_MB = 1_048_576;

/** The refusals the function answers in words (its `why`), the operator's sentence for each below. */
export const CREDIT_WHY = [
  "too_small",
  "no_reason",
  "reason_long",
  "no_account",
  "unmetered",
  "lapsed",
  "too_many",
  "over_bound",
] as const;
export type CreditWhy = (typeof CREDIT_WHY)[number];

/** What a refusal carries beside its `why`, as the function answers it (`over_bound` names the most and what is held). */
export type CreditFacts = {
  minBytes?: number | null;
  maxBytes?: number | null;
  liveBytes?: number | null;
  liveCount?: number | null;
};

/**
 * WHY NOTHING WAS CREDITED, in the operator's words: what is true, never a code. Each is a refusal the database made
 * before it wrote anything, so the sentence after it (the action adds "Nothing was credited.") is exact.
 */
export function creditRefusalWords(
  why: CreditWhy,
  facts: CreditFacts = {},
): string {
  switch (why) {
    case "too_small":
      return `A credit is at least ${formatBytes(facts.minBytes ?? UPLOADS_CREDIT_MIN_BYTES)}.`;
    case "no_reason":
      return "A credit needs a reason.";
    case "reason_long":
      return `Keep the reason to ${UPLOADS_CREDIT_REASON_MAX} characters.`;
    case "no_account":
      return "No such account.";
    case "unmetered":
      return "Her plan has no uploads allowance to lift (no cap is on record yet), so there is nothing to credit.";
    case "lapsed":
      return "Her pass has lapsed, which no credit lifts: the nightly recompute moves her to Free, or her Pro plan landing lifts it.";
    case "too_many":
      return `She already holds ${facts.liveCount ?? UPLOADS_CREDIT_MAX_LIVE} live credits, the most an account holds at once. Wait for one to end.`;
    case "over_bound": {
      const room = creditRoom(facts.maxBytes ?? null, facts.liveBytes ?? 0);
      return room !== null && room > 0
        ? `That is more than a credit may add: together her credits may be one more of her plan's allowance, so ${formatBytes(room)} more fits.`
        : "Her live credits already add one more of her plan's allowance, the most a window takes.";
    }
  }
}

/** Whether a string the function answered is one of its refusals (anything else is a shape it never answers). */
export function isCreditWhy(value: unknown): value is CreditWhy {
  return (
    typeof value === "string" &&
    (CREDIT_WHY as readonly string[]).includes(value)
  );
}

/**
 * What a new credit may still add: the plan's own allowance less the credits she holds, null while she has no number to
 * lift (an unmetered Pro). Mirrors the SQL's bound (`p_bytes > allowance - live` refuses), so the control can say
 * the room before anyone presses.
 */
export function creditRoom(
  allowanceBytes: number | null,
  liveBytes: number,
): number | null {
  return allowanceBytes === null
    ? null
    : Math.max(0, allowanceBytes - liveBytes);
}

export type CreditUnit = "MB" | "GB";

/**
 * THE AMOUNT AS TYPED, whole megabytes or gigabytes, to the whole megabytes the action sends. A whole number only: a
 * credit is a round figure the operator can say aloud and read back in the log, and "1.5 GB" is one press of "1536 MB".
 */
export function creditMegabytes(
  value: string,
  unit: CreditUnit,
): { ok: true; megabytes: number } | { ok: false; message: string } {
  const text = value.trim();
  if (!/^\d{1,7}$/.test(text)) {
    return { ok: false, message: "Enter a whole number." };
  }
  const megabytes = Number(text) * (unit === "GB" ? 1024 : 1);
  if (megabytes < 1)
    return { ok: false, message: "A credit is at least 1 MB." };
  if (megabytes > UPLOADS_CREDIT_MAX_MB) {
    return { ok: false, message: "That is more than any plan's allowance." };
  }
  return { ok: true, megabytes };
}

/** One live credit as the account's page reads it (`lib/db/queries/uploads-credits.ts`). */
export type UploadsCredit = {
  id: string;
  bytes: number;
  /** When its window ends and it with it (ISO). */
  windowEndsAt: string;
  /** When the operator made it (ISO). */
  grantedAt: string;
  reason: string;
  /** The operator's address, or null when it is unreadable (the act is on record by id). */
  operator: string | null;
};

/** What her live credits add together. */
export function creditTotal(credits: readonly UploadsCredit[]): number {
  return credits.reduce((sum, credit) => sum + credit.bytes, 0);
}

/** "+100 MB until Nov 1, 2026 UTC": the credit and where it ends. */
export function creditLine(credit: UploadsCredit): string {
  return `+${formatBytes(credit.bytes)} until ${formatAdminDate(credit.windowEndsAt)}`;
}

/** "Granted Oct 8, 2026, 12:03 UTC by hi@willgibs.com", to the minute as the page reads every moment. */
export function creditByline(credit: UploadsCredit): string {
  const by = credit.operator ? ` by ${credit.operator}` : "";
  return `Granted ${formatAdminTimestamp(credit.grantedAt)}${by}`;
}

/** The row's one sentence on the account's page, said once for the list's badge and the card alike. */
export function creditTotalWords(totalBytes: number): string {
  return `+${formatBytes(totalBytes)} credit`;
}

/**
 * The window's end, in the words the hint and the sheet use. A calendar month turns at the first instant of the next
 * UTC month (the ledger's own key); a pass holder's year ends with her soonest live pass, the one the database reads
 * the end from, which the page does not hold, so it is named and the credit's own line gives the date once it exists.
 */
export function windowEndWords(
  window: "month" | "year",
  nowMs: number,
): string {
  if (window === "year") return "her soonest live pass ends";
  const now = new Date(nowMs);
  const turns = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return `${formatAdminDate(turns)}, when the month turns`;
}
