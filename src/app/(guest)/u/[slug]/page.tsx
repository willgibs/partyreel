import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { OwnerSections } from "@/app/(guest)/u/[slug]/owner-sections";
import { GuestHeader } from "@/components/guest/guest-header";
import { FollowButton } from "@/components/social/follow-button";
import { ProfileActionsMenu } from "@/components/social/profile-actions-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils";

// Covers are presigned per request; the follow state is viewer-specific.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it here and in generateMetadata.
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return { title: "Profile" };
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

/** The marker on every card (Will, `made-of=covers`, 2026-09-19: "rather than a
 *  separate 'also at' section, maybe we could just have host/guest UI on each
 *  event card to denote within a single group"). It rides EventCard's top-right
 *  slot in the card's own chrome language (the same pill as the date and the
 *  lock below), so the group reads as one grid with a mark on it rather than
 *  two grids sharing a heading. No new prop on EventCard: that card is shared
 *  with the dashboard, and the marker is this page's idea. */
function Marker({ role }: { role: "host" | "guest" }) {
  return (
    <span className="flex h-5 items-center rounded-full border border-white/30 bg-black/25 px-2 text-[10px] font-medium text-white backdrop-blur-sm">
      {role === "host" ? "Host" : "Guest"}
      <span className="sr-only">
        {role === "host" ? ": hosted this event" : ": added photos here"}
      </span>
    </span>
  );
}

/** The card grid, and the two presign rounds behind it, BELOW A SUSPENSE
 *  BOUNDARY.
 *
 *  ★ AND THAT BOUNDARY IS IN THE PAGE RATHER THAN IN A loading.tsx, WHICH IS A
 *  LANDMINE WORTH THE PARAGRAPH. A loading file wraps the WHOLE route, so Next
 *  flushes the shell the moment the fallback renders and the response's status
 *  is already out of the door when the page calls notFound(): measured on this
 *  route, a dead handle answered 200 (in dev and against `next start` alike)
 *  while /e/<bad token> next door answered 404, and a public, indexable page
 *  that soft-404s is a growth surface teaching search engines that a dead
 *  handle is a real page. Throwing from generateMetadata does not help; it
 *  resolves after the flush too. So the route decides 404 at the top, where the
 *  RPC is, and only the slow half (a presign per cover, both arms) streams in
 *  behind the skeleton, which is what the wait was ever about. */
async function PartyGrid({ profile }: { profile: PublicProfile }) {
  const [hostedCovers, attendedCovers] = await Promise.all([
    getPublicProfileCoverUrls(profile.hosted_events),
    getPublicProfileAttendedCoverUrls(profile.id, profile.attended_events),
  ]);

  // One group, newest first across both kinds: the order each arm already
  // arrives in, merged, so a person's year reads as one year rather than as two
  // lists that happen to share a page.
  const parties = [
    ...profile.hosted_events.map((event) => ({
      id: event.id,
      name: event.name,
      eventDate: event.event_date,
      role: "host" as const,
      // The album link the host PUBLISHED (display_in_profile);
      // password/private events still gate at the /e/ page.
      href: `/e/${event.custom_slug ?? event.qr_token}`,
      coverUrl: hostedCovers.get(event.id) ?? null,
      statusLabel:
        event.visibility === "password"
          ? "Password"
          : event.visibility === "private"
            ? "Private"
            : null,
    })),
    ...profile.attended_events.map((event) => ({
      id: event.id,
      name: event.name,
      eventDate: event.event_date,
      role: "guest" as const,
      // No link, by the doctrine. EventCard draws an unopenable card for
      // href: null, which is exactly what this is.
      href: null,
      coverUrl: attendedCovers.get(event.id) ?? null,
      statusLabel: null,
    })),
  ].sort((a, b) => {
    if (a.eventDate === b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return a.eventDate < b.eventDate ? 1 : -1;
  });

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {parties.map((party) => (
        <li key={party.id}>
          <EventCard
            href={party.href}
            name={party.name}
            coverUrl={party.coverUrl}
            dateLabel={
              party.eventDate ? formatEventDate(party.eventDate) : "No date set"
            }
            statusLabel={party.statusLabel}
            action={<Marker role={party.role} />}
          />
        </li>
      ))}
    </ul>
  );
}

/** The owner mode's wait: three labelled bands, at the bands' size. */
function OwnerSkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-busy>
      {Array.from({ length: 2 }, (_, band) => (
        <div key={band} className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-6 lg:grid-cols-9">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton
                key={i}
                className="aspect-square w-full rounded-[var(--radius-tile)]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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
 * the anon get_public_profile RPC. What renders is exactly the RPC's ruled
 * composition: hosted events the host PUBLISHED (display_in_profile, with the
 * album link) + attended events surfaced by their hosts' guest lists, minus the
 * owner's own hides. Never any counts (follower counts are owner-private) and
 * never an email.
 *
 * ★ ONE GRID, TWO KINDS OF CARD (Will, `made-of=covers`, 2026-09-19): "This
 * makes profile pages feel much more full and incentivizes guests to upload to
 * get that beautiful event card on their profile... rather than a separate
 * 'also at' section, maybe we could just have host/guest UI on each event card
 * to denote within a single group. Don't think we need the photographs gallery
 * on the profile page, keeps it more event focused". So the grey "Also at" list
 * is gone, a party someone attended is a card with a cover, and the only
 * difference a viewer can act on is the one that matters: a hosted card opens
 * the album the host published, and an ATTENDED CARD CARRIES NO LINK, because
 * being on a guest list is not a capability grant. The covers behind the
 * attended half are presigned only through the same three gates the RPC
 * applied, re-proved inside the query rather than inherited from its payload.
 *
 * This is a growth surface (the /e/ page's "who made this?" answer), so the
 * chrome stays quiet: the person and their events are the page.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug.toLowerCase());
  // Missing handle -> 404; we never distinguish "no user" from "no slug".
  if (!profile) notFound();

  // The viewer (for the follow affordance). getUser() — never getSession().
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  // Known from the RPC's payload, so the empty page never waits on a presign
  // round it has nothing to presign for.
  const partyCount =
    profile.hosted_events.length + profile.attended_events.length;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* The album's own header, with no album behind it (Will, `head=guest`):
          one header for every guest-side page, so a signed-in visitor keeps
          their account menu the moment they tap somebody's name. */}
      <GuestHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {/* Identity block: avatar, name, handle, restraint (joined month only —
            no counts by design: the graph is private, profiles-social.md point 4).

            ★ THE AVATAR IS CENTRED ON THE NAME ROW AND THE BIO SITS OUTSIDE IT
            (Will, `identity=line`): "Profile picture (avatar) should be center
            aligned to the name/meta group, so if a bio 1) doesn't exist it
            looks correct, or 2) does exist and runs at any length, the avatar
            is still aligned to the top name/meta, not centered lower due to a
            long bio". A bio inside this flex row would drag the avatar down by
            half of whatever the person wrote.

            ★ AND THE PHONE FIX IS `max-sm:` ONLY (the board's): the name column
            takes the rest of the row and the actions wrap under it at 375,
            where the shipped row squeezed all three into about 90px. Every
            wider screen stays byte-identical to what shipped. */}
        <section
          data-arrive
          style={{ "--arrive-i": 0 } as CSSProperties}
          className="flex flex-wrap items-center gap-5"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public avatar URL with a cache-bust marker
            <img
              src={avatarUrl}
              alt=""
              className="size-20 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full border border-border bg-muted text-2xl font-medium text-muted-foreground">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
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
                  slug={profile.slug}
                  initialFollowing={following}
                />
              )}
              {showMenu && (
                <ProfileActionsMenu
                  profileId={profile.id}
                  slug={profile.slug}
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
            <EmptyState
              variant="quiet"
              icon={Sparkles}
              title="No events here yet"
              description={`When ${name} shares an event, it shows up here.`}
            />
          </div>
        ) : (
          <section
            data-arrive
            style={{ "--arrive-i": 2 } as CSSProperties}
            aria-label="Events"
            className="mt-10 space-y-3"
          >
            {/* The label sizes a child span, not the heading tag: the form
                design-system.md allows for an Inter label inside an h2, and the
                same one the guest album's own Guests heading uses.

                ★ THE LABEL PAIR, NOT A ONE-OFF (`label=12-08`, Will
                2026-09-20: "I think the tighter spacing looks better. Leaning
                towards 12px for now since we're a consumer product"). Written
                as STOCK CLASSES that equal the ruled step — text-xs IS 12 —
                because `ladder-wiring` has not landed and Tailwind v4 emits no
                utility at all for an undeclared token: `text-label` here would
                silently inherit and nothing in the gate would catch it. The
                mechanical swap to the step name happens after that lane. */}
            <h2>
              <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Events
              </span>
            </h2>
            <Suspense fallback={<GridSkeleton count={partyCount} />}>
              <PartyGrid profile={profile} />
            </Suspense>
          </section>
        )}

        {/* ★ THE OWNER MODE, AND ★ NOT IN A loading.tsx. The paragraph at
            PartyGrid above is the law here: a loading FILE would wrap this
            whole route in Suspense, flush the shell before the page runs, and
            make a dead handle answer 200 instead of 404 on a public, indexable
            page. So the owner's three feeds stream behind their OWN in-page
            boundary, exactly as the card grid does, and the 404 decision stays
            at the top of the page where the RPC is.

            A visitor's render is byte-identical to what it was: `isSelf` is
            false, nothing below is constructed, and not one of the three
            personal queries runs. */}
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
