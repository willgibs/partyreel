import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

// Operations-portal 404 — primarily a missing account/album record (notFound() in
// admin/accounts/[id] + admin/albums/[eventId]). It renders INSIDE AdminShell: the (admin)
// layout's requireAdmin() + MFA (AAL2) gate has already passed by the time a page calls
// notFound(), and AdminShell wraps children in <main><Container>, so this is just a centered
// block (no extra Container). A non-admin / wrong-host notFound() is thrown in the LAYOUT
// itself, so it hits the ROOT not-found instead (no admin shell, leak-proof) — which is right.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <NotFoundScreen
        icon={FileQuestion}
        title="We couldn't find that page"
        description="The record may have been deleted, or this link points to something that no longer exists."
        actions={
          <Button asChild size="cta">
            <Link href="/admin">Back to overview</Link>
          </Button>
        }
        // Will, `ways-out=guided` (2026-09-19), UNLINKED here and nowhere else.
        // His overrule note on that step named the operator as the one reader
        // who may not want a pointer at all, and there is no runbook page to
        // point at yet: a link that 404s on a host serving only the portal
        // would be worse than the line it replaced. The words stand until a
        // runbook ships (ROADMAP), and then this gains an href and nothing else.
        help={<HelpLine>Check the runbook</HelpLine>}
      />
    </div>
  );
}
