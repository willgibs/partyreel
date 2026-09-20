import type { Metadata } from "next";
import Link from "next/link";
import { UserRoundSearch } from "lucide-react";

import { GuestBar } from "@/components/guest/guest-bar";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

/**
 * Tailored 404 for a handle that resolves to nothing (notFound() in
 * u/[slug]/page). Until this file existed the profile 404 fell through to the
 * ROOT not-found, which wears marketing chrome: a guest who tapped a name on an
 * album landed in a different half of the site, which was the one gap left in
 * Will's `surround=shell` ruling ("every failure screen renders inside its real
 * surface's shell, guest included").
 *
 * ★ IT SAYS NOTHING ABOUT WHY, and that is the privacy rule rather than vague
 * copy: the page never distinguishes "no such person" from "they released their
 * handle" from "no handle claimed", because the RPC does not either. A 404 that
 * explained itself would be a handle-existence oracle.
 *
 * GuestBar rather than GuestHeader: the bar is session-less, and a dead handle
 * is exactly the render where asking the network for an account menu is the
 * wrong move (the same reason the bad-link 404 wears it).
 */
export const metadata: Metadata = {
  title: "Profile not found",
  robots: { index: false, follow: false },
};

export default function ProfileNotFound() {
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
