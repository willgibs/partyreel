import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Lock } from "lucide-react";

import { OwnerSections } from "@/app/(guest)/u/[slug]/owner-sections";
import { OwnerSkeleton } from "@/app/(guest)/u/[slug]/owner-skeleton";
import { ProfileHead } from "@/app/(guest)/u/[slug]/profile-head";
import { PageInviteCard } from "@/components/app/dashboard/page-invite-card";
import { seedFor } from "@/lib/avatar/seed";
import { getProfile } from "@/lib/db/queries/profile";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { formatMonthYear } from "@/lib/utils";

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
 * ★ HER PAGE BEFORE IT IS PUBLIC (`account-moments` r1, `me-page=private`, Will 2026-10-06): the public page's own head,
 * her photo and name (`ProfileHead`, the one the public page wears), marked that only she can see this page, then her
 * things. It reads as hers, and going public later changes who sees it and never what it is. The mark carries the
 * privacy, since a head like a public page's could be taken for one that is live. Before this it was a list of her
 * things under a "Your profile" heading, which is now only what the tab says.
 *
 * ★ PRIVATE BY CONSTRUCTION, AS THE PROFILE'S OWNER MODE IS. `OwnerSections` takes no identity and every read in it
 * answers for the caller (`owner-sections.tsx`), and this page names nobody else: no segment, no search input, only the
 * viewer's own row. The (app) layout above is the sign-in gate, and `layout.tsx` beside this is the name gate. The
 * head's face and name are that same row's, and the only address read for it is her own public avatar's.
 *
 * ★ THE SETUP'S INVITATION STANDS UNDER THE HEAD (`dismissible={false}`): this page is the menu's only profile door for
 * an account that has not claimed a handle, so the way on to the setup stays on it. The dashboard's invitation points at
 * the same setup and is not moved here: it IS the invitation, and a stop at /me on the way would be a tap more. (The
 * invitation's own look is account-moments r2's.)
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

  const avatarUrl = await getAvatarUrl(profile.id, profile.avatar_updated_at);

  return (
    <div className="mx-auto max-w-3xl">
      <ProfileHead
        seed={seedFor(profile.id)}
        avatarUrl={avatarUrl}
        // The name gate (`layout.tsx`) holds a nameless account at /welcome, so this is her own name; the page's
        // title is what a head with none would still say.
        name={profile.display_name?.trim() || "Your profile"}
        joined={formatMonthYear(profile.created_at)}
      >
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Only you can see this page.
        </p>
      </ProfileHead>
      <div className="mt-6">
        <PageInviteCard dismissible={false} />
      </div>
      <div className="mt-10">
        <Suspense fallback={<OwnerSkeleton />}>
          <OwnerSections />
        </Suspense>
      </div>
    </div>
  );
}
