import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportReviewList } from "@/components/app/report-review";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile } from "@/lib/db/queries/profile";
import { listOpenReports } from "@/lib/db/queries/reports";

// Operator-internal report review. Lives under the (app) getUser() gate; we ALSO
// re-check is_admin here and notFound() (a 404, not a 403) for non-admins so the
// route's existence never leaks. Presigned review URLs are per-request — never
// statically cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review reports" };

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile?.is_admin) notFound();

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
