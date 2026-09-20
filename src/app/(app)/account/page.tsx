import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAvatarForm } from "@/components/app/account-avatar-form";
import { AccountDeleteCard } from "@/components/app/account-delete-card";
import { PasskeysCard } from "./passkeys-card";
import { AccountSecurityForm } from "@/components/app/account-security-form";
import { DisplayNameForm } from "@/components/app/display-name-form";
import { NotificationPrefsForm } from "@/components/app/notification-prefs-form";
import {
  UnblockButton,
  UnfollowButton,
} from "@/components/social/connection-buttons";
import { AttendedEventsVisibility } from "@/components/social/attended-events-visibility";
import { ProfileBioForm } from "@/components/social/profile-bio-form";
import { ProfileSlugControl } from "@/components/social/profile-slug-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  effectiveStorageCap,
  formatLimit,
  friendlyCapacity,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import {
  countMyLiveEvents,
  isOnNewsletterList,
} from "@/lib/db/mutations/account";
import { hasPassword } from "@/lib/db/queries/account";
import { getProfile } from "@/lib/db/queries/profile";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { formatBytes } from "@/lib/utils";
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
import { seedFor } from "@/lib/avatar/seed";
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
      <Avatar size="sm" seed={item.seed}>
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

// Account settings (auth-accounts.md + the profiles-social.md profile surface). Renders under the
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
    storage,
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
    getHostStorageSummary(),
  ]);
  if (!profile) redirect("/login");

  const avatarUrl = await getAvatarUrl(profile.id, profile.avatar_updated_at);
  // Server-side SHA-256 of the account id (docs/design/rulings.md, the sixth
  // batch, `seed=account`): one colour per person everywhere, never the raw
  // id itself (src/lib/avatar/seed.ts).
  const seed = seedFor(profile.id);
  const [followingItems, blockItems] = await Promise.all([
    withAvatarUrls(following),
    withAvatarUrls(blocks),
  ]);
  const tier = toBillingTier(profile.tier ?? DEFAULT_TIER);
  const bio = profile.bio ?? null;

  /* ── The Plan card's facts, every one of them SERVER-DERIVED ────────────────
     ★ THE CLIENT IS NEVER ASKED WHAT PLAN SOMEBODY IS ON. `profiles.tier`,
     `storage_cap_bytes`, `tier_expires_at` and `event_slots` are written ONLY
     by the Stripe webhook through the service-role client (billing-caps.md),
     read here through RLS-scoped `getProfile()`, and rendered. Nothing on this
     page takes an entitlement from a prop, a search param or a cookie, and the
     buttons below only ever ASK the server to start a session — the route
     re-resolves the entitlement from `profiles` itself and refuses if it
     disagrees. A Plan card is exactly the surface where trusting the client
     would be cheapest and worst. */
  const planName = TIER_NAMES[tier];
  const planCap = effectiveStorageCap(tier, profile.storage_cap_bytes ?? null);
  const planUsed = storage.activeBytes;
  // Stacked Event Passes override the static tier limit, exactly as
  // enforce_event_limit does in SQL.
  const planMaxEvents = profile.event_slots ?? MAX_EVENTS[tier];
  const planAtCap = !withinLimit(liveEventCount, planMaxEvents);
  const planCapacity = planCap ? friendlyCapacity(planCap) : null;
  const passExpiry =
    tier === "event_pass" && profile.tier_expires_at
      ? new Date(profile.tier_expires_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;
  const hasBilling = Boolean(profile.stripe_customer_id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <PageHeading>Account</PageHeading>
        <p className="text-sm text-muted-foreground">
          Manage your profile and how you sign in.
        </p>
      </div>

      {/* BILLING'S FIRST DOOR (`you=?`, Will 2026-09-20: "plans, billing, etc
          should live under an account page"). Until now the only path to a plan
          in the whole app was a popover on the storage strip on the dashboard,
          and the only path to the Billing Portal was a button inside it. First
          on the page because it is the one card a host arrives here looking
          for; the profile they came to edit is one scroll down and always was. */}
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            {planCap
              ? `${planName} · ${formatBytes(planUsed)} of ${formatBytes(planCap)} used`
              : `${planName} · ${formatBytes(planUsed)} used`}
            {passExpiry ? ` · expires ${passExpiry}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">
                Events
              </dt>
              {/* THE UPGRADE TRIGGER. "3 of 3 used" is the sentence that makes
                  a host understand why the New event button went grey, and it
                  has to be readable BEFORE they go looking for it. */}
              <dd className="text-sm">
                <span className={planAtCap ? "font-medium text-warning" : ""}>
                  {liveEventCount} of {formatLimit(planMaxEvents)} used
                </span>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">
                Storage
              </dt>
              <dd className="text-sm">
                {planCapacity
                  ? `About ${planCapacity.photos.toLocaleString()} photos or ${planCapacity.videoMinutes.toLocaleString()} min of video`
                  : `${formatBytes(planUsed)} used`}
              </dd>
            </div>
          </dl>

          {tier === "free" && (
            <p className="text-sm text-muted-foreground">
              {/* ★ SINGLE-SOURCE FOLLOW-UP. This is the ruled Pro line
                  (`pro-line=video`, his words: "For videos and unlimited
                  events."). Its HOME is `lib/constants/marketing-voice.ts`
                  beside the other ruled lines, and `voice-wiring` is the lane
                  adding it there — it does not exist yet, so importing it would
                  not compile. When that lane lands, swap this literal for the
                  import; it is one line in the handoff, not a second home. */}
              <strong className="font-medium text-foreground">
                For videos and unlimited events.
              </strong>{" "}
              <Link
                href="/pricing"
                className="underline underline-offset-4 hover:text-foreground"
              >
                See plans
              </Link>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {hasBilling && <ManageBillingButton />}
            {tier === "event_pass" && (
              <CheckoutButton planId="event_pass" renewal variant="outline">
                Renew Event Pass
              </CheckoutButton>
            )}
            {!hasBilling && tier === "free" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">See plans</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
            seed={seed}
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

      {/* The id is the after-upload prompt's door: a guest who just added
          photographs to somebody's wedding arrives here wanting one box, not a
          five-card page to scroll (Will, `claim=after`, 2026-09-19). */}
      <Card id="public-profile" className="scroll-mt-6">
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>
            Your page on Partyreel: the events you host and choose to share,
            plus events you joined. Follower counts stay private to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileSlugControl siteUrl={siteUrl} slug={slug} />
          {/* The bio lives beside the handle rather than in the Profile card
              above: it exists at exactly one address, and only once a handle
              does. */}
          <ProfileBioForm bio={bio} />
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
      {/* door-wiring's one line (2026-09-20), placed by the Orchestrator once avatar-wiring, which owned this page, had landed: the passkey row under the Password card. */}
      <PasskeysCard />

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
