import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

// Host-facing 404 for the (app) group — primarily the missing/not-yours dashboard event
// (notFound() in dashboard/[eventId]/page). It renders INSIDE AppShell: the (app) layout's
// getUser() auth gate has already passed by the time the page calls notFound(), so the
// authed shell (logo, notification bell, user menu) composes correctly. AppShell already
// wraps children in <main><Container>, so this does NOT add its own Container — just a
// comfortable centered block.
export const metadata: Metadata = {
  title: "Event not found",
};

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <NotFoundScreen
        icon={CalendarX2}
        title="We couldn't find that event"
        description="It may have been deleted, or the link points to an event that no longer exists. Your other events are safe on your dashboard."
        actions={
          <>
            <Button asChild size="cta">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/dashboard/new">Create an event</Link>
            </Button>
          </>
        }
        // Will, `ways-out=guided` (2026-09-19). A host who followed a link to an
        // event that is gone is often asking whether they deleted it, and that
        // is a help-center question, not a dashboard one.
        help={<HelpLine href="/help">Visit the help center</HelpLine>}
      />
    </div>
  );
}
