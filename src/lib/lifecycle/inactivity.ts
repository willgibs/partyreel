/**
 * Free-tier inactivity policy (pure). An event is "active" while the latest of its host's
 * last_active_at + the event's created/updated + its newest upload is within `INACTIVE_DAYS`;
 * past that we warn (`WARN_BEFORE_DAYS` out) then remove. Pure so the destructive decision is
 * unit-tested; the cron computes the activity timestamp and calls inactivityAction.
 *
 * ★ THIS FILE IS THE WINDOW'S ONE HOME, and nothing in SQL mirrors it: the sweep reads its cutoff from here
 * (`warnCutoff`, sweeps/inactivity.ts) and the database only answers "which free events are older than this".
 * Every page, mail and operator line that says the window derives it from `INACTIVE_MONTHS` below, and the Terms
 * and the Privacy Policy say no figure at all (PRD's legal-text principle); `inactivity.test.ts` holds both.
 */
export const INACTIVE_DAYS = 730; // two years of no host activity → removal
/**
 * The same window in the months every page says it in ("about 24 months": the help, the FAQ, the event pages, the
 * JSON-LD, the llms files, the warning mail), derived here, beside the days it comes from, so a retune is one edit
 * and no page can say a window the sweep does not enforce (`inactivity.test.ts` refuses a second derivation).
 */
export const INACTIVE_MONTHS = Math.round(INACTIVE_DAYS / 30);
export const WARN_BEFORE_DAYS = 14; // email this long before the removal date
const DAY_MS = 86_400_000;

export type InactivityAction = "none" | "warn" | "remove";

export function inactivityAction(
  lastActivityMs: number,
  nowMs: number,
): InactivityAction {
  const ageDays = (nowMs - lastActivityMs) / DAY_MS;
  if (ageDays >= INACTIVE_DAYS) return "remove";
  if (ageDays >= INACTIVE_DAYS - WARN_BEFORE_DAYS) return "warn";
  return "none";
}
