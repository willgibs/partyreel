import type { Metadata } from "next";

import { PersonReportList } from "@/app/admin/reports/person-report-list";
import { ReportQueue } from "@/components/admin/report-queue";
import { TriageFilter } from "@/components/admin/triage-filter";
import { ReportReviewList } from "@/components/app/report-review";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hrefWith, LIST_PAGE, parseShow } from "@/lib/admin/list-depth";
import {
  parseReportFilter,
  REPORT_WORDS,
  type ReportFilter,
} from "@/lib/admin/reports";
import { serverNow } from "@/lib/admin/pending";
import { ShowMoreLine } from "@/lib/admin/show-more";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  listOpenEntries,
  listProfileReports,
  listReports,
  readProofMailEnabled,
} from "@/lib/db/queries/reports";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

// Hold for forensics preserves a report's item and its uploader's other items in one press
// (`escalate=door`); its loop stops starting copies at 40 s, inside this.
export const maxDuration = 60;

export const metadata: Metadata = { title: "Reports" };

/** What an empty filter says, in the filter's own word. */
const EMPTY: Record<ReportFilter, { title: string; line: string }> = {
  open: { title: "All clear", line: "No open reports right now." },
  dismissed: { title: "None dismissed", line: "No report has been dismissed." },
  actioned: { title: "None actioned", line: "No report has been actioned." },
  all: { title: "No reports", line: "No reports on record." },
};

/**
 * THE REPORTS INBOX (admin-triage r2, `look=grid`): the open queue as the review grid (the front's harm, People,
 * then the sweep), and under the other filters each arm's closed log with its way back. Every read is the
 * service role's behind `requireAdmin()` and AAL2; the reporter's address never leaves the server.
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; show?: string }>;
}) {
  const ctx = await requireAdmin();
  // Don't fetch + presign reported media until MFA is satisfied. The layout shows
  // the gate at AAL1; this guards the data path as its own entry point.
  if (ctx.aal !== "aal2") return null;

  const { status, show: showRaw } = await searchParams;
  // The queue (Open) is where the bare path lands; All, Dismissed and Actioned are the shared
  // filter bar's other tabs, in Reports' own words (admin-triage r1, `idiom=shape`).
  const filter = parseReportFilter(status);
  // Each arm reads its newest `show` reports (the 1,000-row round, 2026-09-23); the line under an
  // arm says how deep it reads and offers one page more, and one depth serves every arm.
  const show = parseShow(showRaw);
  const now = serverNow();
  const withQueue = filter === "open" || filter === "all";
  const withClosed = filter !== "open";
  const [queue, closed, personQueue, proofOn] = await Promise.all([
    withQueue
      ? listOpenEntries(show)
      : Promise.resolve({ entries: [], more: false }),
    withClosed
      ? listReports(filter, show, now)
      : Promise.resolve({ reports: [], more: false }),
    listProfileReports(filter, show, now),
    withQueue ? readProofMailEnabled() : Promise.resolve(false),
  ]);
  const personReports = personQueue.reports;
  const closedReports = closed.reports.filter((r) => r.status !== "open");
  const deeper = hrefWith("/admin/reports", {
    status: filter === "open" ? null : filter,
    show: show + LIST_PAGE,
  });
  const nothing =
    queue.entries.length === 0 &&
    closedReports.length === 0 &&
    personReports.length === 0;

  const people =
    personReports.length > 0 ? (
      <section aria-label="Reported people" className="space-y-3">
        <h2>
          <span className="text-label font-semibold text-muted-foreground uppercase">
            People
          </span>
        </h2>
        <PersonReportList reports={personReports} />
        <ShowMoreLine
          shown={personReports.length}
          more={personQueue.more}
          href={deeper}
        />
      </section>
    ) : null;

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Review reports</PageHeading>
        {/* ★ THE WINDOW AND ITS WORD ARE ONE STRING: Next's SWC drops the leading
            space of a JSX text that runs over several lines and holds an entity,
            so a number followed by its word read "30days" (build 20's red-team),
            and prettier folds a `{" "}` back into the text (jsx-text-space-policy). */}
        <p className="text-sm text-pretty text-muted-foreground">
          Reports of harm from guests and hosts, the harm in front. Remove takes
          an item out of the album and the host&apos;s Deleted at once, and its
          closed line&apos;s Undo brings it back for{" "}
          {`${RECENTLY_DELETED_WINDOW_DAYS} days`}, then the purge deletes it
          unless it is held. A dismissal&apos;s Undo reopens its report for the
          same {`${RECENTLY_DELETED_WINDOW_DAYS} days`}. A reported person is
          actioned out of band, so Mark actioned only closes the report. An open
          report keeps its item from every permanent delete until it closes.
        </p>
      </div>

      <TriageFilter
        basePath="/admin/reports"
        active={filter}
        words={REPORT_WORDS}
        landing="open"
      />

      {withQueue && (queue.entries.length > 0 || people) ? (
        <div className="space-y-3">
          <ReportQueue
            entries={queue.entries}
            proofOn={proofOn}
            people={people}
          />
          <ShowMoreLine
            shown={queue.entries.reduce((n, e) => n + e.reports.length, 0)}
            more={queue.more}
            href={deeper}
          />
        </div>
      ) : null}

      {!withQueue && people}

      {closedReports.length > 0 ? (
        <section
          aria-label="Closed album and item reports"
          className="space-y-3"
        >
          <ReportReviewList reports={closedReports} />
          <ShowMoreLine
            shown={closed.reports.length}
            more={closed.more}
            href={deeper}
          />
        </section>
      ) : null}

      {nothing ? (
        <Card>
          <CardHeader>
            <CardTitle>{EMPTY[filter].title}</CardTitle>
            <CardDescription>{EMPTY[filter].line}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
