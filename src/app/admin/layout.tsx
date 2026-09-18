import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AppDesignIsland } from "@/components/dev/app-design-island";
import { MfaChallenge } from "@/components/admin/mfa-challenge";
import { MfaEnroll } from "@/components/admin/mfa-enroll";
import { Logo } from "@/components/shared/logo";
import { requireAdmin } from "@/lib/auth/admin-context";
import { countApplicationsByStatus } from "@/lib/db/queries/applications";
import { countOpenReports } from "@/lib/db/queries/reports";
import { countContactByStatus } from "@/lib/db/queries/support";
import { PageHeading } from "@/components/shared/page-heading";

// The operations portal segment. Canonical path is /admin on every host; in prod
// requireAdmin() host-guards it to admin.<domain> (the apex 404s), redirects anon
// users to login, and 404s logged-in non-admins. Never statically cache (auth +
// per-request presigned review URLs live under here).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s · Partyreel Ops" },
  // Defense in depth alongside robots.ts — the portal must never be indexed.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  // MFA gate. An admin at AAL1 must enroll a first factor (or step up if one
  // exists) before the portal renders. This screen is intentionally reachable at
  // AAL1 — that's what makes first-time enrollment lockout-proof.
  if (ctx.aal !== "aal2") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            {/* The gate card's title is the screen's h1: the `subsection` step,
                which is the rank a max-w-sm card reads at (/login's card takes
                it too). A stock `text-lg` would leave the ladder, and
                type-ladder-policy.test.ts refuses one on a heading. */}
            <PageHeading className="text-subsection">
              {ctx.mfaEnrolled
                ? "Verify it's you"
                : "Secure the operations portal"}
            </PageHeading>
            <p className="text-sm text-muted-foreground">
              {ctx.mfaEnrolled
                ? "This portal requires two-factor authentication."
                : "Set up two-factor authentication to continue. It's required for everyone with portal access."}
            </p>
          </div>
          {ctx.mfaEnrolled ? <MfaChallenge /> : <MfaEnroll />}
        </div>
      </div>
    );
  }

  // Pending-work counts for the header alerts bell (the same queries the Overview cards use). Cheap
  // head-counts; refresh on page-load + post-triage revalidation (no real-time, matching the host bell).
  const [support, applicants, reports] = await Promise.all([
    countContactByStatus("new"),
    countApplicationsByStatus("new"),
    countOpenReports(),
  ]);

  return (
    <AdminShell email={ctx.email} alerts={{ support, applicants, reports }}>
      {children}
      {/* Key-gated, inert otherwise: a board's candidate block on the portal's
          own pages (the second round, 2026-09-15). */}
      <AppDesignIsland />
    </AdminShell>
  );
}
