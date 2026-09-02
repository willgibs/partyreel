import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAvatarForm } from "@/components/app/account-avatar-form";
import { AccountDeleteCard } from "@/components/app/account-delete-card";
import { AccountSecurityForm } from "@/components/app/account-security-form";
import { DisplayNameForm } from "@/components/app/display-name-form";
import { NotificationPrefsForm } from "@/components/app/notification-prefs-form";
import {
  UnblockButton,
  UnfollowButton,
} from "@/components/social/connection-buttons";
import { AttendedEventsVisibility } from "@/components/social/attended-events-visibility";
import { ProfileSlugControl } from "@/components/social/profile-slug-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import {
  countMyLiveEvents,
  isOnNewsletterList,
} from "@/lib/db/mutations/account";
import { hasPassword } from "@/lib/db/queries/account";
import { getProfile } from "@/lib/db/queries/profile";
import {
  getMyAttendedEvents,
  getMyBlocks,
  getMyFollowCounts,
  getMyFollowing,
  getMyProfileSlug,
  getNotificationPrefs,
} from "@/lib/db/queries/social";
import { withAvatarUrls, type ProfileCardItem } from "@/lib/social/cards";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { getSiteUrl } from "@/lib/site-url";
import { PageHeading } from "@/components/shared/page-heading";

export const metadata: Metadata = { title: "Account" };

// A Connections row: the person + one action. The lists are RSC-rendered
// (avatar URLs resolved server-side); only the action buttons hydrate.
function PersonRow({
  item,
  action,
}: {
  item: ProfileCardItem;
  action: React.ReactNode;
}) {
  const identity = (
    <>
      <Avatar size="sm">
        <AvatarImage src={item.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="text-[10px]">
          {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm text-foreground">
        {item.displayName ?? "Someone"}
      </span>
    </>
  );
  return (
    <li className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      {item.slug ? (
        <Link
          href={`/u/${item.slug}`}
          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
        >
          {identity}
        </Link>
      ) : (
        <span className="flex min-w-0 items-center gap-2">{identity}</span>
      )}
      {action}
    </li>
  );
}

// Account settings (ADR-0011 + the ADR-0019 profile surface). Renders under the
// (app) gate, so getUser() already ran; getProfile re-checks defensively. Next
// 16: searchParams is a Promise. ?reset=1 arrives from the forgot-password flow
// (after a fresh OTP verify) and forces the Security form into "set" mode.
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const [
    profile,
    passwordSet,
    { reset },
    slug,
    attendedEvents,
    following,
    followCounts,
    blocks,
    siteUrl,
    notificationPrefs,
    onNewsletterList,
    liveEventCount,
  ] = await Promise.all([
    getProfile(),
    hasPassword(),
    searchParams,
    // The social reads all no-op gracefully pre-apply (see queries/social.ts'
    // runtime seam), so this page renders fine before the migration lands.
    getMyProfileSlug(),
    getMyAttendedEvents(),
    getMyFollowing(),
    getMyFollowCounts(),
    getMyBlocks(),
    getSiteUrl(),
    getNotificationPrefs(),
    isOnNewsletterList(),
    countMyLiveEvents(),
  ]);
  if (!profile) redirect("/login");

  const avatarUrl = await getAvatarUrl(profile.id, profile.avatar_updated_at);
  const [followingItems, blockItems] = await Promise.all([
    withAvatarUrls(following),
    withAvatarUrls(blocks),
  ]);
  // Same lock rule as setProfileSlug (locked = free; paid tiers all claim).
  const tier = toBillingTier(profile.tier ?? DEFAULT_TIER);
  const slugLocked = tier === "free";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <PageHeading>Account</PageHeading>
        <p className="text-sm text-muted-foreground">
          Manage your profile and how you sign in.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your photo, name, and the email tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountAvatarForm
            avatarUrl={avatarUrl}
            displayName={profile.display_name}
            email={profile.email}
          />
          <DisplayNameForm displayName={profile.display_name} />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">
              {profile.email ?? "No email on file"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>
            Your page on Partyreel: the events you host and choose to share,
            plus events you joined. Follower counts stay private to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileSlugControl
            siteUrl={siteUrl}
            slug={slug}
            locked={slugLocked}
          />
          <div className="space-y-2 border-t border-border/60 pt-5">
            <p className="text-xs font-medium text-muted-foreground">
              Events you joined
            </p>
            <p className="text-xs text-muted-foreground">
              Choose which show on your profile. Turning one off here
              doesn&rsquo;t remove you from that event&rsquo;s own guest list
              (the host controls that).
            </p>
            <AttendedEventsVisibility events={attendedEvents} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>
            {followCounts.followers === 0
              ? "No one follows you yet."
              : followCounts.followers === 1
                ? "1 person follows you."
                : `${followCounts.followers} people follow you.`}{" "}
            Only you can see this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Following
            </p>
            {followingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&rsquo;re not following anyone yet. Find a host&rsquo;s
                profile from any album they share.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {followingItems.map((item) => (
                  <PersonRow
                    key={item.id}
                    item={item}
                    action={
                      <UnfollowButton
                        profileId={item.id}
                        displayName={item.displayName}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </div>
          {blockItems.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-5">
              <p className="text-xs font-medium text-muted-foreground">
                Blocked
              </p>
              <ul className="divide-y divide-border/60">
                {blockItems.map((item) => (
                  <PersonRow
                    key={item.id}
                    item={item}
                    action={
                      <UnblockButton
                        profileId={item.id}
                        displayName={item.displayName}
                      />
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {reset === "1"
              ? "Set a new password. You can still sign in with a code or with Google."
              : passwordSet
                ? "Change your password. You can still sign in with a code or with Google."
                : "Add a password so you can sign in with your email and password. Signing in with a code or with Google keeps working too."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSecurityForm
            hasPassword={passwordSet}
            resetMode={reset === "1"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
          <CardDescription>
            What Partyreel may email you about. Your guests never hear from us.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPrefsForm
            prefs={notificationPrefs}
            onNewsletterList={onNewsletterList}
          />
        </CardContent>
      </Card>

      {/* Last on the page on purpose: the danger zone is somewhere you arrive
          deliberately, never somewhere you land on the way to something else. */}
      <AccountDeleteCard
        eventCount={liveEventCount}
        hasPassword={passwordSet}
        hasPlan={tier !== "free"}
        email={profile.email}
      />
    </div>
  );
}
