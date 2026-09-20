import type { Metadata } from "next";

import { ApplicantsList } from "@/components/admin/applicants-list";
import { TriageFilter } from "@/components/admin/triage-filter";
import { serverNow } from "@/lib/admin/pending";
import { requireAdmin } from "@/lib/auth/admin-context";
import { triageStatusSchema, type TriageStatus } from "@/lib/constants/triage";
import { listJobApplications } from "@/lib/db/queries/applications";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Applicants" };

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { status: statusParam, id } = await searchParams;
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

      {/* The chosen application is a URL, not state (`?id=`); `nowMs` is the
          server's clock, since a client component reading one at render would
          break React Compiler's purity rule. */}
      <ApplicantsList
        applications={applications}
        selectedId={id ?? null}
        basePath={
          status ? `/admin/applicants?status=${status}` : "/admin/applicants"
        }
        nowMs={serverNow()}
      />
    </div>
  );
}
