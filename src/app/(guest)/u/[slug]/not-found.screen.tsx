import Link from "next/link";
import { UserRoundSearch } from "lucide-react";

import { GuestBar } from "@/components/guest/guest-bar";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

/**
 * THE GUEST PROFILE'S 404 SCREEN, reached through `app/not-found.lazy.tsx` (crumbs-25; `not-found.tsx` says why:
 * the segment's 404 rides every profile unless its screen loads behind one client boundary), and drawn directly by
 * the profile page for a handle nobody holds, on that one line (stale-link: the page draws its own 404 rather than
 * throw for Next's white error shell). A found profile's HTML is byte for byte what it was before that import.
 *
 * Tailored 404 for a handle that resolves to nothing. Without it the profile 404
 * would fall through to the ROOT not-found, which wears marketing chrome: a guest who tapped a name on an
 * album would land in a different half of the site. Every failure screen renders inside its real surface's
 * shell, guest included.
 *
 * ★ IT SAYS NOTHING ABOUT WHY, and that is the privacy rule rather than vague copy: the page never
 * distinguishes "no such person" from "they released their handle" from "no handle claimed", because the RPC
 * does not either. A 404 that explained itself would be a handle-existence oracle.
 *
 * GuestBar rather than GuestHeader: the bar is session-less, and a dead handle is exactly the render where
 * asking the network for an account menu is the wrong move (the same reason the bad-link 404 wears it).
 *
 * No "use client" of its own: it is client code where the boundary's `import()` reaches it, and a Server Component
 * where the page draws it.
 */
export function ProfileNotFoundScreen() {
  return (
    <>
      <GuestBar />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
        <NotFoundScreen
          icon={UserRoundSearch}
          eyebrow="Profile"
          title="There's nobody at this address"
          description="This handle isn't in use. Check the spelling, or ask for the link again: a profile only exists while somebody holds its handle."
          actions={
            <Button asChild size="cta">
              <Link href="/">What is Partyreel?</Link>
            </Button>
          }
          help={<HelpLine href="/help">Visit the help center</HelpLine>}
        />
      </main>
    </>
  );
}
