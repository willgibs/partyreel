import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AppDesignIsland } from "@/components/dev/app-design-island";
import { MfaChallenge } from "@/components/admin/mfa-challenge";
import { MfaEnroll } from "@/components/admin/mfa-enroll";
import { Logo } from "@/components/shared/logo";
import { requireAdmin } from "@/lib/auth/admin-context";
import { readPendingWork } from "@/lib/admin/pending";
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

  // Pending work for the bar's bell, the rail's counts and the band under both. Cheap head-counts
  // plus one heartbeat read; refresh on page-load + post-triage revalidation (no real-time, matching
  // the host bell). `jobs` is backend health: "the purge sweep has not run in three days" is pending
  // work in exactly the sense the other three are.
  //
  // ★ THE HOME CALLS THIS TOO AND PAYS FOR IT ONCE. `readPendingWork` is wrapped in React's
  // `cache()`, so a layout and the page inside it share one read per request; without it the rail
  // and the queue would each make the same four round trips (lib/admin/pending.ts).
  const { health, ...counts } = await readPendingWork();

  return (
    <AdminShell
      email={ctx.email}
      counts={counts}
      health={health}
      // Read here because a client component has no env: "production" on the
      // apex, "preview" on an alias, and unset in dev, which is why the tag is
      // absent on localhost rather than lying about it.
      env={process.env.VERCEL_ENV ?? null}
    >
      {children}
      {/* Key-gated, inert otherwise: a board's candidate block on the portal's
          own pages (the second round, 2026-09-15). */}
      <AppDesignIsland />
    </AdminShell>
  );
}
