/**
 * WHEN A RESTORE PASS RUNS (durability-backups.md, "The restore"): a pass is the prune's Durable Object's alarm
 * (prune-state.ts), so it has an invocation and a 15-minute budget of its own, whoever asked. Three things ask: the
 * daily cron (the reconcile's), the prune's end (it may have just found lone copies), and an operator's Restore now
 * (the Worker's door, restore-door.ts). PURE: what a request does, decided from what the object holds.
 *
 * A request never starts a second pass beside one in flight, and is never lost: one that arrives while a pass runs
 * is remembered, and a pass follows it at once. A pass marked running for longer than any alarm can run is a pass
 * that died, and no longer blocks the next.
 */

export type RestoreTrigger = "schedule" | "manual";

/** What a request did: set the alarm for now, joined one already set, or queued a pass to follow the one running. */
export type RestoreRequestState = "started" | "queued" | "running";

/** Past this, a pass still marked running died mid-way (an alarm runs 15 minutes at most). */
export const RESTORE_STALE_MS = 16 * 60 * 1000;

export function decideRestoreRequest(input: {
  nowMs: number;
  runningSinceMs: number | null;
  alarmAtMs: number | null;
}): RestoreRequestState {
  const { nowMs, runningSinceMs, alarmAtMs } = input;
  if (runningSinceMs !== null && nowMs - runningSinceMs < RESTORE_STALE_MS) {
    return "running";
  }
  if (alarmAtMs !== null) return "queued";
  return "started";
}

/** An operator's press outranks the clock: the pass it joins is recorded as hers. */
export function strongerTrigger(
  held: RestoreTrigger | null,
  asked: RestoreTrigger,
): RestoreTrigger {
  return held === "manual" || asked === "manual" ? "manual" : "schedule";
}

/** A stored trigger, or null for anything that is not one. */
export function readTrigger(raw: unknown): RestoreTrigger | null {
  return raw === "manual" || raw === "schedule" ? raw : null;
}

/** A stored time, or null for anything that is not one. */
export function readTime(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0
    ? raw
    : null;
}
