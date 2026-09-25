import type { TableTone } from "@/components/ui/table";
import type { JobHealthReport } from "@/lib/jobs/health-summary";

/**
 * WHAT IS WAITING ON THE OPERATOR, RANKED WORST FIRST.
 *
 * The board asked this as its own home (`console`) and Will chose the numbers
 * with the same list beneath them (`home=kpi`), so the ranking is the part that
 * survived intact: a failed purge outranks a press enquiry, and only a ranked
 * list can say so. The nine-card grid could not: a calm platform and a burning
 * one drew the same page.
 *
 * ★ PURE, AND THE RANK IS A NUMBER RATHER THAN AN ORDER OF `push` CALLS. The
 * severity ladder is the one judgement this module makes, so it is written down
 * once and testable: an unreadable console first (we cannot see), then a
 * failure, then something overdue, then safety, then the two inboxes. A tie
 * breaks on age, because between two support messages the older one has been
 * waiting longer and that is the whole of it.
 */

export type QueueKind = "jobs" | "reports" | "support" | "applicants";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  /** The group word in the left column: "Jobs", "Support". */
  kindLabel: string;
  /** What is wrong, in a few words. */
  what: string;
  /** The supporting half-sentence beside it. */
  detail: string;
  /** How long it has waited, in ms, or null where nothing dates it. */
  waitedMs: number | null;
  action: { label: string; href: string };
  tone?: TableTone;
  /** Lower is worse. Exposed so a test can pin the ladder rather than the output. */
  rank: number;
};

const KIND_LABEL: Record<QueueKind, string> = {
  jobs: "Jobs",
  reports: "Reports",
  support: "Support",
  applicants: "Applicants",
};

export type QueueInput = {
  health: JobHealthReport;
  /** Open reports, and when the oldest arrived. */
  reports: { count: number; oldestAtMs: number | null };
  support: { count: number; oldestAtMs: number | null };
  applicants: { count: number; oldestAtMs: number | null };
  nowMs: number;
};

export function buildOperatorQueue(input: QueueInput): QueueItem[] {
  const { health, nowMs } = input;
  const items: QueueItem[] = [];

  if (!health.readable) {
    items.push({
      id: "jobs-unreadable",
      kind: "jobs",
      kindLabel: KIND_LABEL.jobs,
      what: "The heartbeat could not be read",
      // Never a count here: a number invented for an unreadable read is the
      // exact failure the console exists to remove.
      detail: "Every job's health is unknown until this read succeeds",
      waitedMs: null,
      action: { label: "Open the console", href: "/admin/jobs" },
      tone: "destructive",
      rank: 0,
    });
  } else {
    for (const job of health.unhealthy) {
      const failed = job.health === "failed";
      items.push({
        id: `job-${job.id}`,
        kind: "jobs",
        kindLabel: KIND_LABEL.jobs,
        what: job.label,
        detail:
          job.health === "failed"
            ? "Last run failed"
            : job.health === "missed"
              ? "Overdue"
              : "Needs a look",
        waitedMs: health.heartbeatAgeMs,
        action: { label: "Open the console", href: `/admin/jobs#job-${job.id}` },
        tone: failed ? "destructive" : "warning",
        rank: failed ? 1 : 2,
      });
    }
  }

  // A report's row says its KIND and its AGE and nothing else: what a report
  // holds, and what answering it costs, is the triage surface's own language
  // (`admin-triage`, 2026-09-19) and does not belong on a home page.
  if (input.reports.count > 0) {
    items.push({
      id: "reports",
      kind: "reports",
      kindLabel: KIND_LABEL.reports,
      what: plural(input.reports.count, "open report"),
      detail: "Guest safety, not yet reviewed",
      waitedMs: age(input.reports.oldestAtMs, nowMs),
      action: { label: "Review them", href: "/admin/reports" },
      tone: "warning",
      rank: 3,
    });
  }

  if (input.support.count > 0) {
    items.push({
      id: "support",
      kind: "support",
      kindLabel: KIND_LABEL.support,
      what: plural(input.support.count, "unanswered message"),
      detail: "Somebody wrote in and is waiting",
      waitedMs: age(input.support.oldestAtMs, nowMs),
      action: { label: "Open the inbox", href: "/admin/support?status=new" },
      rank: 4,
    });
  }

  if (input.applicants.count > 0) {
    items.push({
      id: "applicants",
      kind: "applicants",
      kindLabel: KIND_LABEL.applicants,
      what: plural(input.applicants.count, "unread application"),
      detail: "Nobody has looked at these yet",
      waitedMs: age(input.applicants.oldestAtMs, nowMs),
      action: { label: "Open the inbox", href: "/admin/applicants?status=new" },
      rank: 5,
    });
  }

  return items.sort(
    (a, b) => a.rank - b.rank || (b.waitedMs ?? 0) - (a.waitedMs ?? 0),
  );
}

function age(atMs: number | null, nowMs: number): number | null {
  if (atMs === null) return null;
  return Math.max(0, nowMs - atMs);
}

function plural(n: number, one: string): string {
  return `${n} ${n === 1 ? one : `${one}s`}`;
}

/**
 * How long something has waited, in the shortest true words. Rounded DOWN at
 * every step: "3 days" for something 3 days and 20 hours old is wrong in the
 * direction that makes an operator relax, so the step above takes over at the
 * whole unit and the queue sorts on the real number anyway.
 */
export function waitedLabel(ms: number | null): string {
  if (ms === null) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
