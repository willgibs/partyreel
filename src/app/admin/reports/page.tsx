import type { Metadata } from "next";

import { ReportReviewList } from "@/components/app/report-review";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { listOpenReports } from "@/lib/db/queries/reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const ctx = await requireAdmin();
  // Don't fetch + presign reported media until MFA is satisfied. The layout shows
  // the gate at AAL1; this guards the data path as its own entry point.
  if (ctx.aal !== "aal2") return null;

  const reports = await listOpenReports();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Review reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Guest-submitted reports awaiting review. Actioning an item removes it;
          the purge cron reclaims its storage afterward.
        </p>
      </div>

      {reports.length > 0 ? (
        <ReportReviewList reports={reports} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All clear</CardTitle>
            <CardDescription>No open reports right now.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
