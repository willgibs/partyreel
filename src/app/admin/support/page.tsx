import type { Metadata } from "next";

import { SupportList } from "@/components/admin/support-list";
import { TriageFilter } from "@/components/admin/triage-filter";
import { serverNow } from "@/lib/admin/pending";
import { requireAdmin } from "@/lib/auth/admin-context";
import { triageStatusSchema, type TriageStatus } from "@/lib/constants/triage";
import { listContactSubmissions } from "@/lib/db/queries/support";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Support" };

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const ctx = await requireAdmin();
  // Don't read operator data until MFA is satisfied (the layout shows the gate at AAL1).
  if (ctx.aal !== "aal2") return null;

  const { status: statusParam, id } = await searchParams;
  const parsed = triageStatusSchema.safeParse(statusParam);
  const status: TriageStatus | undefined = parsed.success
    ? parsed.data
    : undefined;

  const submissions = await listContactSubmissions(status);

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Support</PageHeading>
        <p className="text-sm text-muted-foreground">
          Contact form submissions. Reply from your inbox (the email link opens
          a reply), then set a status to track it.
        </p>
      </div>

      <TriageFilter basePath="/admin/support" active={status} />

      {/* The chosen message is a URL, not state (`?id=`), so it survives a
          refresh and a triage write's revalidate with no client component at
          all. `nowMs` is one cached clock read per request
          (lib/admin/pending.ts), so every relative label agrees and no
          component reads an impure value during render. */}
      <SupportList
        submissions={submissions}
        selectedId={id ?? null}
        basePath={status ? `/admin/support?status=${status}` : "/admin/support"}
        nowMs={serverNow()}
      />
    </div>
  );
}
