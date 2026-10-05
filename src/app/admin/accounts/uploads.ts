import type { AccountUploads, Reading } from "@/lib/db/queries/accounts";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

/**
 * HOW THE OPERATOR READS A HOST'S UPLOADS: the product's two upload refusals, said in the words the Accounts list and
 * the account's page share, so a row and the card under it cannot disagree (the reads are `db/queries/accounts.ts`).
 *
 * ★ WHAT EACH ONE IS, and why a false positive here is the thing to watch (PRICING.md: nothing may quietly block a
 * paying host): an upload is refused at presign past (1) her plan's ALLOWANCE over its window, a calendar month or a
 * pass's own year, which a delete never gives back, and (2) the hour's BREAKER, the uploads her account started in a
 * clock hour. The room (her albums and her Deleted against the cap) is the third refusal, drawn in the storage card.
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

export type UploadsState = "unread" | "unmetered" | "within" | "at";

/**
 * Where her window stands against her allowance. `at` is the line the upload advisories read (`used >= allowance`,
 * `at_monthly_cap`): from there every guest's next upload is refused until the window turns (a file past what is left
 * is refused a little sooner, at the presign). `unmetered` is a Pro with no cap on record yet, which the SQL leaves
 * open on purpose (fail OPEN: never block a paying host on missing data).
 */
export function uploadsState(uploads: AccountUploads): UploadsState {
  if (!uploads.used.ok) return "unread";
  if (uploads.allowanceBytes === null) return "unmetered";
  return uploads.used.value >= uploads.allowanceBytes ? "at" : "within";
}

/** What her window has used, or "No reading". */
export function usedLabel(uploads: AccountUploads): string {
  return uploads.used.ok ? formatBytes(uploads.used.value) : NO_READING;
}

/** Her allowance with its window, compact for a table: "300 MB / mo", "50 GB / yr", or Unmetered. */
export function allowanceLabel(uploads: AccountUploads): string {
  if (uploads.allowanceBytes === null) return "Unmetered";
  return `${formatBytes(uploads.allowanceBytes)} / ${uploads.window === "year" ? "yr" : "mo"}`;
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
