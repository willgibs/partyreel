/**
 * WHAT THE BACKUP RECONCILE'S CARD SAYS OF ITS PASS (durability-backups.md, "The reconcile"), decided from the run's
 * report as the Worker sent it (`counts`, workers/backup/src/reconcile-run.ts): how far its pass through the two
 * buckets has come and whether this run ended it, when the last whole pass ended, what it copied that the live queue
 * missed, and each thing that waits on a person. PURE, under test.
 *
 * WHY A PASS, NOT A RUN: the reconcile carries a cursor, so a pass can span runs. A run that closes every day can still
 * belong to a pass that never ends; the card says how far the pass has come and when one last ended, so a pass that
 * stalls reads as one (each run that stops early reads Needs a look, a run that settles nothing fails), and Overdue
 * keeps its plain meaning: no run reported at all.
 *
 * ★ THE KEYS ARE A CROSS-PACKAGE CONTRACT: the Worker writes them (`RECONCILE_COUNT_KEYS`) and cannot import this
 * module (a separate package), so each side's suite asserts the same strings.
 */
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

/** The Worker's count keys (workers/backup/src/reconcile-run.ts, `RECONCILE_COUNT_KEYS`), asserted on both sides. */
export const RECONCILE_KEYS = {
  checked: "checked",
  copied: "copied",
  failed: "failed",
  tooLarge: "too_large",
  copiesLeft: "copies_left",
  mismatched: "mismatched",
  absent: "absent_from_primary",
  youngAbsent: "young_absent",
  loneFound: "lone_found",
  loneUnjudged: "lone_unjudged",
  passComplete: "pass_complete",
  passWalked: "pass_walked",
  passStartedAt: "pass_started_at",
  lastPassAt: "last_pass_at",
  lastPassWalked: "last_pass_walked",
  stoppedEarly: "stopped_early",
  breakerTripped: "breaker_tripped",
} as const;

/** A line of the card: work done, something that waits on a person, or a quiet fact. */
export type ReconcileLine = {
  tone: "done" | "attention" | "quiet";
  text: string;
};

export type ReconcileView = {
  /** Where the pass stands: ended by this run, or carried on. */
  pass: ReconcileLine;
  /** When the last whole pass ended, or that none has yet. */
  lastPass: ReconcileLine;
  lines: ReconcileLine[];
} | null;

export function reconcileView(counts: unknown): ReconcileView {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const c = counts as Record<string, unknown>;
  // A run from before the pass (the old reconcile's `checked` and `capped`) has no pass to say: the raw counts stand.
  const complete = c[RECONCILE_KEYS.passComplete];
  if (typeof complete !== "boolean") return null;
  const n = (key: string) => countOf(c[key]) ?? 0;

  const walked = n(RECONCILE_KEYS.passWalked);
  const copied = n(RECONCILE_KEYS.copied);
  const startedAt = timeOf(c[RECONCILE_KEYS.passStartedAt]);
  const pass: ReconcileLine = complete
    ? {
        tone: "done",
        text:
          `Complete: ${keys(walked)} compared with the backup` +
          (copied > 0
            ? `, ${formatCount(copied)} copied that the live queue missed`
            : n(RECONCILE_KEYS.failed) + n(RECONCILE_KEYS.tooLarge) > 0
              ? ""
              : ", every one backed up"),
      }
    : {
        tone: "attention",
        text:
          `In progress: ${keys(walked)} compared` +
          (startedAt ? ` since ${formatAdminTimestamp(startedAt)}` : "") +
          `; the next run carries on` +
          (copied > 0 ? ` (${formatCount(copied)} copied this run)` : ""),
      };

  const lastAt = timeOf(c[RECONCILE_KEYS.lastPassAt]);
  const lastWalked = countOf(c[RECONCILE_KEYS.lastPassWalked]);
  const lastPass: ReconcileLine = lastAt
    ? {
        tone: "quiet",
        text:
          formatAdminTimestamp(lastAt) +
          (lastWalked !== null ? `, ${keys(lastWalked)}` : ""),
      }
    : { tone: "attention", text: "None has reached the end yet" };

  const lines: ReconcileLine[] = [];
  const failed = n(RECONCILE_KEYS.failed);
  if (failed > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(failed)} failed to copy: the next pass tries again (its note says why)`,
    });
  }
  const tooLarge = n(RECONCILE_KEYS.tooLarge);
  if (tooLarge > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(tooLarge)} past one run's copy reach: copy by hand from partyreel into partyreel-backup (the run's log names each)`,
    });
  }
  const mismatched = n(RECONCILE_KEYS.mismatched);
  if (mismatched > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(mismatched)} differ between the buckets (size or checksum): left as they are, never overwritten; a person decides which copy is good (the run's log names each)`,
    });
  }
  const lone = n(RECONCILE_KEYS.loneFound);
  if (lone > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(lone, "young key")} held by the backup alone: the backup restore copies them back (Held by the backup alone, above)`,
    });
  }
  const unjudged = n(RECONCILE_KEYS.loneUnjudged);
  if (unjudged > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(unjudged, "young key")} not yet judged (the app could not say which a live row names): the next pass asks again`,
    });
  }
  const young = n(RECONCILE_KEYS.youngAbsent);
  if (young > 0) {
    lines.push({
      tone: "quiet",
      text: `${keys(young, "young key")} in the backup the primary no longer holds, each asked of the app: ${formatCount(lone)} named by a live row`,
    });
  }
  return { pass, lastPass, lines };
}

function keys(count: number, noun = "key"): string {
  return `${formatCount(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** A count it can read, or null: a missing number is unknown, never a zero. */
function countOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/** An ISO time it can read, or null. */
function timeOf(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
}
