import type { Metadata } from "next";
import Link from "next/link";

import { PersonReportList } from "@/app/admin/reports/person-report-list";
import { ReportReviewList } from "@/components/app/report-review";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  hrefWith,
  LIST_PAGE,
  parseShow,
} from "@/lib/admin/list-depth";
import { ShowMoreLine } from "@/lib/admin/show-more";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  listProfileReports,
  listReports,
  type ReportFilter,
} from "@/lib/db/queries/reports";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reports" };

const FILTERS: { key: ReportFilter; label: string; href: string }[] = [
  { key: "open", label: "Open", href: "/admin/reports" },
  { key: "all", label: "All", href: "/admin/reports?status=all" },
];

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
  const filter: ReportFilter = status === "all" ? "all" : "open";
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
    status: filter === "all" ? "all" : null,
    show: show + LIST_PAGE,
  });

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Review reports</PageHeading>
        <p className="text-sm text-muted-foreground">
          Guest-submitted reports. Actioning an item removes it; the purge cron
          reclaims its storage afterward. A reported person is actioned out of
          band, so marking one handled only closes the report. Resolved reports
          are read-only.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              filter === f.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

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
              <CardTitle>
                {filter === "open" ? "All clear" : "No reports"}
              </CardTitle>
              <CardDescription>
                {filter === "open"
                  ? "No open reports right now."
                  : "No reports on record."}
              </CardDescription>
            </CardHeader>
          </Card>
        )
      )}
    </div>
  );
}
