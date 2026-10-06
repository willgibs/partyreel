import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";
import Link from "next/link";

import { EventCard, RoleMarker } from "@/components/app/event-card";
import { PAGE_CHOICES_PATH } from "@/app/(app)/account/profile/invite";
import { emptyPageLine } from "@/app/(guest)/u/[slug]/empty-page";
import { OwnerSections } from "@/app/(guest)/u/[slug]/owner-sections";
import { OwnerSkeleton } from "@/app/(guest)/u/[slug]/owner-skeleton";
import { partyCards } from "@/app/(guest)/u/[slug]/party-cards";
import { GuestHeader } from "@/components/guest/guest-header";
import { FollowButton } from "@/components/social/follow-button";
import { ProfileActionsMenu } from "@/components/social/profile-actions-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { seedFor } from "@/lib/avatar/seed";
import {
  getPublicProfile,
  getPublicProfileAttendedCoverUrls,
  getPublicProfileCoverUrls,
  hasBlocked,
  isBlockedEitherWay,
  isFollowing,
  type PublicProfile,
} from "@/lib/db/queries/social";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate, formatMonthYear } from "@/lib/utils";

import { notFoundMetadata } from "./not-found.metadata";
import { ProfileNotFoundScreen } from "./not-found.screen";

// Covers are presigned per request; the follow state is viewer-specific.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it here and in generateMetadata.
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  // A handle nobody holds is titled as the not-found it is, "Profile not found" and noindex: the
  // not-found's own metadata, `not-found.metadata.ts` (it said "Profile"). The page answers it at
  // 200 (a soft 404), so this noindex is all that keeps a dead handle out of an index.
  if (!profile) return notFoundMetadata;
  const name = profile.display_name ?? `@${profile.slug}`;
  // Their own line when they wrote one: it is the truest description of the
  // page, and the one a share card should carry.
  const description =
    profile.bio ?? `Events and albums by ${name} on Partyreel.`;
  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      url: `/u/${profile.slug}`,
      type: "profile",
    },
  };
}

/** The card grid, and the two presign rounds behind it, BELOW A SUSPENSE
 *  BOUNDARY.
 *
 *  ★ AND THAT BOUNDARY IS IN THE PAGE RATHER THAN IN A loading.tsx, WHICH IS A
 *  LANDMINE WORTH THE PARAGRAPH. A loading file wraps the WHOLE route, so Next
 *  flushes its skeleton before the page runs: a dead handle would paint a
 *  skeleton before its not-found. So the page draws its not-found at the top,
 *  where the RPC is, and a dead handle's first paint is its own screen; only
 *  the slow half (a presign per cover, both arms) streams in behind the
 *  skeleton, which is what the wait was ever about. */
async function PartyGrid({ profile }: { profile: PublicProfile }) {
  const [hostedCovers, attended] = await Promise.all([
    getPublicProfileCoverUrls(profile.hosted_events),
    getPublicProfileAttendedCoverUrls(profile.id, profile.attended_events),
  ]);
  // One group, newest first across both kinds (`party-cards.ts` says what each card claims).
  const parties = partyCards(profile, hostedCovers, attended);

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {parties.map((party) => (
        <li key={party.id}>
          <EventCard
            href={party.href}
            name={party.name}
            coverUrl={party.coverUrl}
            dateLabel={
              party.eventDate
                ? formatEventDate(party.eventDate, party.eventEndDate)
                : "No date set"
            }
            statusLabel={party.statusLabel}
            empty={party.empty}
            // The marker on every card: one grid with a mark on it, not two grids sharing a
            // heading. The dashboard's Guest cards wear the same object (event-card.tsx owns it).
            action={<RoleMarker role={party.role} />}
          />
        </li>
      ))}
    </ul>
  );
}

/** The grid's own wait: the cards' shape, at the cards' size. */
function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy>
      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
        <Skeleton key={i} className="aspect-[16/10] w-full rounded-xl" />
      ))}
    </div>
  );
}

/**
 * The PUBLIC profile page (profiles-social.md: profiles are public by existence; the slug
 * is the address, and claiming it was the consent act). Logged-out visible via
 * the anon get_public_profile RPC. What renders is exactly the RPC's
 * composition: hosted events the host PUBLISHED (display_in_profile, with the
 * album link) + the events this person added photos to that their hosts' guest
 * lists surface and that the owner CHOSE to show (nothing until chosen), each
 * following its album's own doors for THIS viewer. Never a follow count (the
 * graph is owner-private) and never an email; the one number is an empty page's
 * "2 private events", held to those same doors.
 *
 * ★ ONE GRID, TWO KINDS OF CARD. Event cards make a profile page feel full and
 * give a guest a reason to upload (the event's card on their own profile); a host
 * or guest mark on each card tells the two apart within one group, and the page
 * carries no photographs gallery, keeping it about events. So a party someone
 * attended is a card with a cover, and the only
 * difference a viewer can act on is the one that matters: a hosted card opens
 * the album the host published, and an ATTENDED CARD CARRIES NO LINK, because
 * being on a guest list is not a capability grant. The covers behind the
 * attended half are presigned only through the owner's gates the RPC applied,
 * re-proved inside the query rather than inherited from its payload.
 *
 * This is a growth surface (the /e/ page's "who made this?" answer), so the
 * chrome stays quiet: the person and their events are the page.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  // ★ THE PAGE AND ITS VIEWER, ASKED TOGETHER (crumbs-44). The shell waits on exactly these two, so
  // they run side by side rather than one after the other, and the viewer is the request's one
  // `getUser()` (`getRequestAuth`, cached), which `isFollowing` below reuses: a signed-in visit asked
  // the auth server twice, once before the follow reads could start. An anonymous visit asks it
  // nothing (no session, no call). getUser(), never getSession().
  const [profile, { user }] = await Promise.all([
    getPublicProfile(slug.toLowerCase()),
    getRequestAuth(),
  ]);
  // Missing handle -> the not-found; we never distinguish "no user" from "no slug". ★ The segment's
  // own screen, drawn here and never through `notFound()`, whose throw is served as Next's error
  // shell (a white page until the script has run), at 200 and noindex: a soft 404, as the album
  // page's (`e/[token]/page.tsx` says why). The screen itself rather than the not-found's lazy
  // boundary, which would widen two references on every profile load.
  if (!profile) return <ProfileNotFoundScreen />;

  const isSelf = user?.id === profile.id;

  // The follow affordance renders ONLY signed-in, non-self, and NOT blocked in
  // either direction (a button that can only silently no-op would advertise the
  // block). The menu (report / block) renders for EVERY signed-in non-self
  // viewer: if I blocked them it's my Unblock path, and if they blocked me a
  // redundant Block is harmless while keeping the page from changing shape (the
  // less the layout differs under a block, the less the block leaks).
  let showFollow = false;
  let following = false;
  let viewerBlockedThem = false;
  const showMenu = Boolean(user && !isSelf);
  if (user && !isSelf) {
    const [blockedEitherWay, blockedByViewer, followingNow] = await Promise.all(
      [
        isBlockedEitherWay(user.id, profile.id),
        hasBlocked(user.id, profile.id),
        isFollowing(profile.id),
      ],
    );
    viewerBlockedThem = blockedByViewer;
    showFollow = !blockedEitherWay;
    following = followingNow;
  }

  const avatarUrl = await getAvatarUrl(profile.id, profile.avatar_updated_at);

  const name = profile.display_name ?? `@${profile.slug}`;
  // The one pinned date format (en-US, read in UTC), never the runtime's locale.
  const joined = formatMonthYear(profile.created_at);
  // Known from the RPC's payload, so the empty page never waits on a presign
  // round it has nothing to presign for.
  const partyCount =
    profile.hosted_events.length + profile.attended_events.length;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* The album's own header, with no album behind it:
          one header for every guest-side page, so a signed-in visitor keeps
          their account menu the moment they tap somebody's name. */}
      <GuestHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {/* Identity block: avatar, name, handle, restraint (joined month only —
            no counts by design: the graph is private, profiles-social.md point 4).

            ★ THE AVATAR IS CENTRED ON THE NAME ROW AND THE BIO SITS OUTSIDE IT,
            so the avatar stays aligned to the name and meta whether a bio is
            missing or runs to any length. A bio inside this flex row would drag
            the avatar down by half of whatever the person wrote.

            ★ AND THE PHONE LAYOUT IS `max-sm:` ONLY: the name column
            takes the rest of the row and the actions wrap under it at 375,
            where a single row would squeeze all three into about 90px. No
            wider screen is touched by it. */}
        <section
          data-arrive
          style={{ "--arrive-i": 0 } as CSSProperties}
          className="flex flex-wrap items-center gap-5"
        >
          {/* `xl` (80px, the Avatar's fourth size) keeps this row on the
              shared component rather than a hand-rolled disc, so the seeded
              colour and the component's clipping reach it the same way every
              other avatar surface gets them. */}
          <Avatar size="xl" seed={seedFor(profile.id)}>
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-6.25rem)]">
            <h1 className="font-heading text-page text-balance">{name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              <span>@{profile.slug}</span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>Joined {joined}</span>
            </p>
          </div>
          {(showFollow || showMenu) && (
            <div className="flex items-center gap-2 max-sm:w-full">
              {showFollow && (
                <FollowButton
                  profileId={profile.id}
                  initialFollowing={following}
                />
              )}
              {showMenu && (
                <ProfileActionsMenu
                  profileId={profile.id}
                  displayName={profile.display_name}
                  blocked={viewerBlockedThem}
                />
              )}
            </div>
          )}
          {isSelf && (
            <div className="flex items-center max-sm:w-full">
              <Button asChild variant="outline" size="sm">
                <Link href="/account">Edit profile</Link>
              </Button>
            </div>
          )}
        </section>

        {profile.bio && (
          <p
            data-arrive
            style={{ "--arrive-i": 1 } as CSSProperties}
            className="mt-4 max-w-prose text-sm text-pretty text-foreground"
          >
            {profile.bio}
          </p>
        )}

        {partyCount === 0 ? (
          <div
            data-arrive
            style={{ "--arrive-i": 2 } as CSSProperties}
            className="mt-10"
          >
            {/* ★ ONE QUIET LINE (`page=count`): "2 private events" tells a visitor this is an
                active person who keeps her events to herself, where "No events here yet" is a
                page with nothing behind it. The number is the RPC's, scoped to what THIS viewer
                could confirm, so it can never say more than a shown line would. The owner alone
                gets the way to change it, one tap from the thing it changes. */}
            <EmptyState
              variant="quiet"
              title={emptyPageLine(profile.private_event_count)}
              action={
                isSelf ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={PAGE_CHOICES_PATH}>Choose what shows</Link>
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <section
            data-arrive
            style={{ "--arrive-i": 2 } as CSSProperties}
            aria-label="Events"
            className="mt-10 space-y-3"
          >
            {/* The label sizes a child span, not the heading tag: an Inter label
                inside an h2, the same one the guest album's own Guests heading
                uses (the `label` step: 12px on a 16px line, 0.08em tracking). */}
            <h2>
              <span className="text-label font-semibold text-muted-foreground uppercase">
                Events
              </span>
            </h2>
            <Suspense fallback={<GridSkeleton count={partyCount} />}>
              <PartyGrid profile={profile} />
            </Suspense>
          </section>
        )}

        {/* ★ THE OWNER MODE, AND ★ NOT IN A loading.tsx. The paragraph at
            PartyGrid above applies here: a loading FILE would wrap this
            whole route in Suspense and flush its skeleton before the page
            runs, so a dead handle would paint it before its not-found. So the
            owner's three feeds stream behind their OWN in-page boundary,
            exactly as the card grid does, and the not-found decision stays at
            the top of the page where the RPC is.

            A visitor's render carries none of it: `isSelf` is false, nothing
            below is constructed, and not one of the three personal queries
            runs. */}
        {isSelf && (
          <Suspense fallback={<OwnerSkeleton />}>
            <OwnerSections />
          </Suspense>
        )}
      </main>

      {/* The growth-loop footer line (quiet, the guest-page stance). */}
      <footer className="border-t border-border/60 px-5 py-4 text-center text-xs text-muted-foreground">
        Made with{" "}
        <Link
          href="/"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Partyreel
        </Link>
        , the guest-powered event album.
      </footer>
    </div>
  );
}
