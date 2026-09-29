import type { Metadata } from "next";

import { PersonReportList } from "@/app/admin/reports/person-report-list";
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
import { ShowMoreLine } from "@/lib/admin/show-more";
import { requireAdmin } from "@/lib/auth/admin-context";
import { listProfileReports, listReports } from "@/lib/db/queries/reports";
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
  // Each arm reads its newest `show` reports (the 1,000-row round, 2026-09-23);
  // the line under an arm says how deep it reads and offers one page more, and
  // one depth serves both arms, so the queue deepens as one.
  const show = parseShow(showRaw);
  // Two arms of one queue (20260919130000): albums and items, and people.
  const [albumQueue, personQueue] = await Promise.all([
    listReports(filter, show),
    listProfileReports(filter, show),
  ]);
  const reports = albumQueue.reports;
  const personReports = personQueue.reports;
  const deeper = hrefWith("/admin/reports", {
    status: filter === "open" ? null : filter,
    show: show + LIST_PAGE,
  });

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Review reports</PageHeading>
        <p className="text-sm text-pretty text-muted-foreground">
          Reports of harm from guests and hosts. Remove takes an item out of the
          album and the host&apos;s Deleted at once, and its closed line&apos;s
          Undo brings it back for {RECENTLY_DELETED_WINDOW_DAYS} days, then the
          purge deletes it unless it is held. A reported person is actioned out
          of band, so Mark actioned only closes the report.
        </p>
      </div>

      <TriageFilter
        basePath="/admin/reports"
        active={filter}
        words={REPORT_WORDS}
        landing="open"
      />

      {/* People first when there are any: a report about a person is about
          somebody's conduct across the product, which outranks one photograph. */}
      {personReports.length > 0 && (
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
      )}

      {reports.length > 0 ? (
        <section aria-label="Reported albums and items" className="space-y-3">
          {personReports.length > 0 && (
            <h2>
              <span className="text-label font-semibold text-muted-foreground uppercase">
                Albums and items
              </span>
            </h2>
          )}
          <ReportReviewList reports={reports} />
          <ShowMoreLine
            shown={reports.length}
            more={albumQueue.more}
            href={deeper}
          />
        </section>
      ) : (
        personReports.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{EMPTY[filter].title}</CardTitle>
              <CardDescription>{EMPTY[filter].line}</CardDescription>
            </CardHeader>
          </Card>
        )
      )}
    </div>
  );
}
