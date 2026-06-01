import type { Metadata } from "next";
import Link from "next/link";

import { ReportReviewList } from "@/components/app/report-review";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { listReports, type ReportFilter } from "@/lib/db/queries/reports";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reports" };

const FILTERS: { key: ReportFilter; label: string; href: string }[] = [
  { key: "open", label: "Open", href: "/admin/reports" },
  { key: "all", label: "All", href: "/admin/reports?status=all" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  // Don't fetch + presign reported media until MFA is satisfied. The layout shows
  // the gate at AAL1; this guards the data path as its own entry point.
  if (ctx.aal !== "aal2") return null;

  const { status } = await searchParams;
  const filter: ReportFilter = status === "all" ? "all" : "open";
  const reports = await listReports(filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Review reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Guest-submitted reports. Actioning an item removes it; the purge cron
          reclaims its storage afterward. Resolved reports are read-only.
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

      {reports.length > 0 ? (
        <ReportReviewList reports={reports} />
      ) : (
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
      )}
    </div>
  );
}
