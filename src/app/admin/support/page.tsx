import type { Metadata } from "next";

import { SupportList } from "@/components/admin/support-list";
import { TriageFilter } from "@/components/admin/triage-filter";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  TRIAGE_STATUS_META,
  triageStatusSchema,
  type TriageStatus,
} from "@/lib/constants/triage";
import { listContactSubmissions } from "@/lib/db/queries/support";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Support" };

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  // Don't read operator data until MFA is satisfied (the layout shows the gate at AAL1).
  if (ctx.aal !== "aal2") return null;

  const { status: statusParam } = await searchParams;
  const parsed = triageStatusSchema.safeParse(statusParam);
  const status: TriageStatus | undefined = parsed.success
    ? parsed.data
    : undefined;

  const submissions = await listContactSubmissions(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">
          Contact form submissions. Reply from your inbox (the email link opens
          a reply), then set a status to track it.
        </p>
      </div>

      <TriageFilter basePath="/admin/support" active={status} />

      {submissions.length > 0 ? (
        <SupportList submissions={submissions} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nothing here</CardTitle>
            <CardDescription>
              No submissions
              {status
                ? ` marked ${TRIAGE_STATUS_META[status].label.toLowerCase()}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
