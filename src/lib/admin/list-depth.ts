import { readAllPages, type PageResult } from "@/lib/db/read-all";

/**
 * THE OPERATOR'S LONG LISTS: THE NEWEST FEW, AND A WAY TO SEE MORE (the 1,000-row round, Will
 * 2026-09-23: "Let's ensure we will not face any of those issues here").
 *
 * The support and applicant inboxes and the report queue read every row they held, newest first,
 * so past PostgREST's 1,000 rows each one ended silently at its thousandth message. A list the
 * operator reads top-down does not need every row at once, so each now reads the newest
 * `LIST_PAGE` and says so under the list (`ShowMoreLine`, `show-more.tsx`), with a link that shows
 * `LIST_PAGE` more (read-all.ts rule 6: a bound on purpose says so on the screen). The depth is the
 * URL's `?show=`, so a refresh, a triage write's revalidate and an opened message all keep it; and
 * the read pages under the hood, so any depth is exact, past 1,000 included.
 */

/** How many rows an operator list shows at first, and how many more each "Show more" adds. */
export const LIST_PAGE = 50;

/** The `?show=` depth: a whole number past the first page, else the first page. */
export function parseShow(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value > LIST_PAGE ? value : LIST_PAGE;
}

/** A path with its query, dropping empty values, so a default never clutters the URL. */
export function hrefWith(
  path: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "")
      query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/** The `?show=` value for a depth: none at the first page, so the default URL stays clean. */
export function showParam(show: number): number | null {
  return show > LIST_PAGE ? show : null;
}

/**
 * The newest `show` rows of a list, and whether it holds more. It reads one row past the depth
 * (`readAllPages` with a budget) so `more` is exact: a list of exactly `show` rows offers nothing.
 * `page` and `keyOf` are `readAllPages`' own, a fresh query per page on the list's display order.
 */
export async function readNewest<T, K>(
  label: string,
  show: number,
  page: (after: K | null, limit: number) => PromiseLike<PageResult<T>>,
  keyOf: (row: T) => K,
): Promise<{ rows: T[]; more: boolean }> {
  const { rows } = await readAllPages(label, page, keyOf, {
    budget: show + 1,
  });
  return { rows: rows.slice(0, show), more: rows.length > show };
}
