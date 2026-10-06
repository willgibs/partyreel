import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AppDesignIsland } from "@/components/dev/app-design-island";
import { MfaChallenge } from "@/components/admin/mfa-challenge";
import { MfaEnroll } from "@/components/admin/mfa-enroll";
import { Logo } from "@/components/shared/logo";
import { SITE_NAME } from "@/lib/constants/site";
import { requireAdmin } from "@/lib/auth/admin-context";
import { readPendingWork } from "@/lib/admin/pending";
import { PageHeading } from "@/components/shared/page-heading";

// The operations portal segment. Canonical path is /admin on every host; in prod
// requireAdmin() host-guards it to admin.<domain> (the apex 404s), redirects anon
// users to login, and 404s logged-in non-admins. Never statically cache (auth +
// per-request presigned review URLs live under here).
export const dynamic = "force-dynamic";

const PORTAL = "Partyreel Ops";

/** What an operator's pages wear: every page's own title takes the portal's suffix, the home reads Operations. */
const PORTAL_HEAD: Metadata = {
  // ★ ABSOLUTE, NOT A DEFAULT (crumbs-40, build 35's red-team): a segment's own title is templated by its
  // parent's, so a `default` here read "Operations · Partyreel" (the root's "%s · Partyreel") on /admin
  // and on any portal page without a title of its own, where every other read "<X> · Partyreel Ops".
  title: { absolute: `Operations · ${PORTAL}`, template: `%s · ${PORTAL}` },
  // Defense in depth alongside robots.ts — the portal must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * WHAT A VISITOR WHO IS NOT AN OPERATOR READS IN THE TAB: the title of a URL that does not exist, whatever page they
 * asked for (crumbs-82; the re-walk's finding). The gate 404s a non-admin from inside this LAYOUT, so the root's 404
 * draws the body, but a layout's metadata is resolved beside its gate and never learns of it: the tab read
 * "Page not found · Partyreel Ops" in the server's HTML, and once the page's own metadata streamed in, "Jobs ·
 * Partyreel Ops", which named the portal and the page, and told `/admin/jobs` (a page) from `/admin/nope` (nothing):
 * the one thing the 404 exists to keep from a stranger (`requireAdmin`: "a logged-in non-admin can't even confirm the
 * route").
 *
 * ★ THE TEMPLATE HAS NO `%s` ON PURPOSE. A page's title only ever reaches the tab through its parents' template, so a
 * template with nowhere to put it turns every portal page's own title, and the 404's, into this one line, the one an
 * unmatched URL wears (`portal-title.test.ts` holds the two to the byte).
 */
const LOST = `Page not found · ${SITE_NAME}`;
const NOT_AN_OPERATOR_HEAD: Metadata = {
  title: { absolute: LOST, template: LOST },
  // The portal's own head carries this on every response, a stranger's 404 included.
  robots: { index: false, follow: false },
};

// ★ THE HEAD ASKS THE GATE, AND SWALLOWS ITS ANSWER: `requireAdmin` throws Next's own 404 for a non-admin or a wrong
// host and its redirect for a signed-out one, and the layout below throws them for real. Here each only means "not an
// operator", so the tab says the 404's words. The gate is read once a request (`readGate`'s `cache()`), so this costs
// the portal nothing. ★ IT FAILS CLOSED, LIKE THE GATE (`readGate`'s deliberate swallow): any other error (the database
// that cannot answer) is no operator's head either, so the tab says nothing of the portal; the layout below meets the same
// error for real and the page is the error boundary's.
export async function generateMetadata(): Promise<Metadata> {
  try {
    await requireAdmin();
    return PORTAL_HEAD;
  } catch {
    return NOT_AN_OPERATOR_HEAD;
  }
}

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
