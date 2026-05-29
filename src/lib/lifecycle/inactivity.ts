/**
 * Free-tier inactivity policy (pure). An event is "active" while the latest of its host's
 * last_active_at + the event's created/updated + its newest upload is within ~6 months;
 * past that we warn (14 days out) then remove. Pure so the destructive decision is
 * unit-tested; the cron computes the activity timestamp and calls inactivityAction.
 */
export const INACTIVE_DAYS = 180; // ~6 months of no host activity → removal
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
