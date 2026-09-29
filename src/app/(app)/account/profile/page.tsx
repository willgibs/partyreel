import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SetCrumbs } from "@/components/shared/crumbs";
import { ProfileSetupWizard } from "@/components/social/profile-setup-wizard";
import { seedFor } from "@/lib/avatar/seed";
import { countActiveEvents } from "@/lib/db/queries/events";
import { firstFreeHandle, getProfile } from "@/lib/db/queries/profile";
import { getMyAttendedEventPicks } from "@/lib/db/queries/social";
import { getSiteUrl } from "@/lib/site-url";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";

import { handleCandidates } from "./handle-suggestion";
import { PAGE_CHOICES_PATH } from "./invite";

export const metadata: Metadata = { title: "Set up your page" };

/**
 * THE PAGE SETUP'S ROUTE (`identity-profile` r1, `setup=wizard`): `/account/profile`, named at the
 * lane's boot so the album's "Claim a handle" row can point here. The account layout's name gate has
 * already run (a nameless account is at /welcome, never here), and the (app) layout's `getUser()`
 * before it.
 *
 * ★ THE FIRST TIME ONLY, BY CONSTRUCTION. A page that exists is set up, so a handle sends her to the
 * Account card that holds every later edit (Will: "follow-up edits can feel more like account
 * settings for quick direct edits"). Decided on the server before anything renders, so a set-up
 * account never sees a wizard flash.
 */
export default async function ProfileSetupPage() {
  const [profile, events, siteUrl, hostedEvents] = await Promise.all([
    getProfile(),
    getMyAttendedEventPicks(),
    getSiteUrl(),
    countActiveEvents(),
  ]);
  if (!profile) redirect("/login");
  if (profile.slug) redirect(PAGE_CHOICES_PATH);

  const [avatarUrl, suggestedHandle] = await Promise.all([
    getAvatarUrl(profile.id, profile.avatar_updated_at),
    firstFreeHandle(handleCandidates(profile.display_name)),
  ]);

  return (
    <div className="space-y-6">
      <SetCrumbs
        trail={[
          { label: "Partyreel", href: "/dashboard" },
          { label: "Account", href: "/account" },
          { label: "Your page" },
        ]}
      />
      <ProfileSetupWizard
        siteUrl={siteUrl}
        suggestedHandle={suggestedHandle ?? ""}
        displayName={profile.display_name ?? ""}
        email={profile.email}
        avatarUrl={avatarUrl}
        seed={seedFor(profile.id)}
        events={events}
        hostsEvents={hostedEvents > 0}
      />
    </div>
  );
}
