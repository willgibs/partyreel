import type { Metadata } from "next";

import { ApplicantsList } from "@/components/admin/applicants-list";
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
import { listJobApplications } from "@/lib/db/queries/applications";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Applicants" };

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { status: statusParam } = await searchParams;
  const parsed = triageStatusSchema.safeParse(statusParam);
  const status: TriageStatus | undefined = parsed.success
    ? parsed.data
    : undefined;

  const applications = await listJobApplications(status);

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Applicants</PageHeading>
        <p className="text-sm text-muted-foreground">
          Job applications. Reply from your inbox; set a status to track each
          one. (Job postings live in the codebase, not here.)
        </p>
      </div>

      <TriageFilter basePath="/admin/applicants" active={status} />

      {applications.length > 0 ? (
        <ApplicantsList applications={applications} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nothing here</CardTitle>
            <CardDescription>
              No applications
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
