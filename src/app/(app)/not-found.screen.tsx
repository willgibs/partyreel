import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

/**
 * THE HOST APP'S 404 SCREEN, reached through `app/not-found.lazy.tsx` (crumbs-25; `not-found.tsx` says why: the
 * group's 404 rides every dashboard page unless its screen loads behind one client boundary), and drawn directly by
 * an event's own pages (the hub, Review, Guests, the reel's old room) for an event that is gone or never this host's,
 * on that one line each (crumbs-28: a thrown `notFound()` reached the client before anyone saw the screen). Those
 * pages already reach every client part of it (the group's `error.tsx` draws the same shared screen), so the import
 * costs a found event's page nothing.
 *
 * It renders INSIDE AppShell: the (app) layout's getUser() auth gate has already passed by the time a page draws it,
 * so the authed shell (logo, notification bell, user menu) composes correctly. AppShell already wraps children in
 * <main><Container>, so this does NOT add its own Container: just a comfortable centered block. No "use client" of its
 * own: client code where the boundary's `import()` reaches it, a Server Component where a page draws it.
 */
export function AppNotFoundScreen() {
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
