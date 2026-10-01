/**
 * Free-tier inactivity policy (pure). An event is "active" while the latest of its host's
 * last_active_at + the event's created/updated + its newest upload is within ~6 months;
 * past that we warn (14 days out) then remove. Pure so the destructive decision is
 * unit-tested; the cron computes the activity timestamp and calls inactivityAction.
 */
export const INACTIVE_DAYS = 180; // ~6 months of no host activity → removal
/**
 * The same window in the months every page says it in ("about 6 months": the help, the FAQ, the event pages, the
 * JSON-LD, the llms files, the privacy page), derived here, beside the days it comes from, so a retune is one edit
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
