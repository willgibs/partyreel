import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { OwnerSections } from "@/app/(guest)/u/[slug]/owner-sections";
import { OwnerSkeleton } from "@/app/(guest)/u/[slug]/owner-skeleton";
import { PageInviteCard } from "@/components/app/dashboard/page-invite-card";
import { PageHeading } from "@/components/shared/page-heading";
import { getProfile } from "@/lib/db/queries/profile";

// Private by its address and its gate; the noindex is the page's own word on it as well.
export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

/**
 * /ME: THE OWNER MODE AT AN ADDRESS THAT NEEDS NO HANDLE (crumbs-46, Will's answer A to crumbs-44's question).
 *
 * A profile's private half (her uploads, her likes, the people she follows) lives on `/u/<handle>`, so an account with
 * no handle, a guest who confirmed an email and added photos to somebody's event, had hearts she could never list. Her
 * profile door (the user menu's Your profile) opens this page instead of the setup, and the day she has a handle it
 * sends her to the page that holds the same sections plus the public half.
 *
 * ★ PRIVATE BY CONSTRUCTION, AS THE PROFILE'S OWNER MODE IS. `OwnerSections` takes no identity and every read in it
 * answers for the caller (`owner-sections.tsx`), and this page names nobody else: no segment, no search param, only the
 * viewer's own row. The (app) layout above is the sign-in gate, and `layout.tsx` beside this is the name gate.
 *
 * ★ ITS HEAD IS THE SETUP'S INVITATION, STANDING (`dismissible={false}`): this page is the menu's only profile door for
 * an account that has not claimed a handle, so the way on to the setup stays on it. The dashboard's invitation points at
 * the same setup and is not moved here: it IS the invitation, and a stop at /me on the way would be a tap more.
 *
 * Like the profile, the sections stream behind a boundary of their own inside the page and never a `loading.tsx`: a
 * loading file flushes before the page decides, and a handle that exists must redirect with a real 307, not after a
 * skeleton.
 */
export default async function MePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // A page that exists is where the owner mode lives, with its public half.
  if (profile.slug) redirect(`/u/${profile.slug}`);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-4">
        <PageHeading>Your profile</PageHeading>
        <PageInviteCard dismissible={false} />
      </div>
      <Suspense fallback={<OwnerSkeleton />}>
        <OwnerSections />
      </Suspense>
    </div>
  );
}
