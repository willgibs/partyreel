import type { AccountUploads, Reading } from "@/lib/db/queries/accounts";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

/**
 * HOW THE OPERATOR READS A HOST'S UPLOADS: the product's two upload refusals, said in the words the Accounts list and
 * the account's page share, so a row and the card under it cannot disagree (the reads are `db/queries/accounts.ts`).
 *
 * ★ WHAT EACH ONE IS, and why a false positive here is the thing to watch (PRICING.md: nothing may quietly block a
 * paying host): an upload is refused at presign past (1) her plan's ALLOWANCE over its window, a calendar month or a
 * pass's own year, which a delete never gives back (and whole, in the same words, while her pass has LAPSED: a pass
 * holder with no live pass, until the nightly recompute moves her to Free), and (2) the hour's BREAKER, the uploads her
 * account started in a clock hour. The room (her albums and her Deleted against the cap) is the third refusal, drawn
 * in the storage card.
 *
 * ★ A READING THAT COULD NOT BE TAKEN IS "NO READING", never a zero (`Reading`): every label here answers it in words.
 */

export const NO_READING = "No reading";

/**
 * The hour's breaker: an account's uploads (hers and every guest's, into all her events) started in a clock hour,
 * far past any party and unpublished (billing-caps.md). ★ MIRRORS `c_uploads_an_hour` in `meter_upload`, the SQL's
 * alone; `uploads.test.ts` reads it off the newest migration that sets it, so a new number there fails here.
 */
export const UPLOADS_AN_HOUR = 20_000;

export type UploadsState = "unread" | "lapsed" | "unmetered" | "within" | "at";

/**
 * Where her window stands against her allowance. `at` is the line the upload advisories read (`used >= allowance`,
 * `at_monthly_cap`): from there every guest's next upload is refused until the window turns (a file past what is left
 * is refused a little sooner, at the presign). `unmetered` is a Pro with no cap on record yet, which the SQL leaves
 * open on purpose (fail OPEN: never block a paying host on missing data). ★ `lapsed` is a pass holder with no live
 * pass (`AccountUploads.lapsed`): every upload is refused whatever her figure says, so it outranks the figure, whose
 * "0 B" of a pass's allowance used to read as room to spare.
 */
export function uploadsState(uploads: AccountUploads): UploadsState {
  if (!uploads.used.ok) return "unread";
  if (uploads.lapsed) return "lapsed";
  if (uploads.allowanceBytes === null) return "unmetered";
  return uploads.used.value >= uploads.allowanceBytes ? "at" : "within";
}

/** What her window has used, or "No reading". */
export function usedLabel(uploads: AccountUploads): string {
  return uploads.used.ok ? formatBytes(uploads.used.value) : NO_READING;
}

type Lapsed = NonNullable<AccountUploads["lapsed"]>;

/** The badge a lapsed pass wears, in the list's row and on the account's page alike. */
export const PASS_LAPSED = "Pass lapsed";

/** The badge a pass converted to Pro credit wears while her Pro plan has not landed: her uploads are refused too. */
export const PRO_PENDING = "Pro pending";

/** Which of the two a lapsed account wears: her last pass expired, or became Pro credit. */
export function lapsedBadge(lapsed: Lapsed): string {
  return lapsed.converted ? PRO_PENDING : PASS_LAPSED;
}

/** What a lapsed pass's allowance is, compact for a table: none, every upload refused. */
export const UPLOADS_REFUSED = "Uploads refused";

/**
 * Her allowance with its window, compact for a table: "300 MB / mo", "50 GB / yr", Unmetered, or Uploads refused for a
 * lapsed pass (her plan's number is held by no live pass, so it allows nothing).
 */
export function allowanceLabel(uploads: AccountUploads): string {
  if (uploads.used.ok && uploads.lapsed) return UPLOADS_REFUSED;
  if (uploads.allowanceBytes === null) return "Unmetered";
  return `${formatBytes(uploads.allowanceBytes)} / ${uploads.window === "year" ? "yr" : "mo"}`;
}

/** When a lapsed pass ended, as the list's row says it ("Oct 3, 2026 UTC"), or null when no pass of hers ever was live. */
export function lapsedSinceDate(lapsed: Lapsed): string | null {
  return lapsed.since ? formatAdminDate(lapsed.since) : null;
}

/**
 * What a lapsed pass means, on the account's page: when her pass ended (to the minute, as the page reads every
 * moment) and what lifts the refusal of every upload, hers and her guests': the nightly recompute moving her to Free
 * after an expiry, her Pro plan landing after a conversion to Pro credit (a host who has paid for Pro, whom the
 * operator looks for in Stripe). The words never promise the recompute's minute (a run can stop short of an account
 * and take it the next night).
 */
export function lapsedSentence(lapsed: Lapsed): string {
  if (lapsed.converted) {
    const when = lapsed.since
      ? `Her passes became Pro credit ${formatAdminTimestamp(lapsed.since)}`
      : "Her passes became Pro credit";
    return `${when} and her Pro plan has not landed yet: new uploads, hers and her guests', are refused until it does.`;
  }
  const what =
    "new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.";
  return lapsed.since
    ? `Her pass ended ${formatAdminTimestamp(lapsed.since)}: ${what}`
    : `She holds no live pass: ${what}`;
}

/** Her window on the account's page, as a sentence: "212 MB of 300 MB", "5 GB, unmetered", or "No reading". */
export function usedOfLabel(uploads: AccountUploads): string {
  if (!uploads.used.ok) return NO_READING;
  const used = formatBytes(uploads.used.value);
  return uploads.allowanceBytes === null
    ? `${used}, unmetered`
    : `${used} of ${formatBytes(uploads.allowanceBytes)}`;
}

/** The row's name on the account's page: the window the allowance counts over. */
export function windowLabel(window: AccountUploads["window"]): string {
  return window === "year" ? "Pass year" : "This month";
}

export type HourState = "unread" | "within" | "at";

/** Where this hour stands against the breaker: `at` is when the account's next presign is refused (`hour_uploads >= ceiling`). */
export function hourState(hour: Reading<number>): HourState {
  if (!hour.ok) return "unread";
  return hour.value >= UPLOADS_AN_HOUR ? "at" : "within";
}

/** The hour's tally against the breaker: "312 of 20,000", or "No reading". */
export function hourLabel(hour: Reading<number>): string {
  return hour.ok
    ? `${formatCount(hour.value)} of ${formatCount(UPLOADS_AN_HOUR)}`
    : NO_READING;
}
