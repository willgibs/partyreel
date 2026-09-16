import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Sparkles } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { FollowButton } from "@/components/social/follow-button";
import { ProfileActionsMenu } from "@/components/social/profile-actions-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  getPublicProfile,
  getPublicProfileCoverUrls,
  hasBlocked,
  isBlockedEitherWay,
  isFollowing,
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
  const description = `Events and albums by ${name} on Partyreel.`;
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

/**
 * The PUBLIC profile page (profiles-social.md: profiles are public by existence; the slug
 * is the address, and claiming it was the consent act). Logged-out visible via
 * the anon get_public_profile RPC. What renders is exactly the RPC's ruled
 * composition: hosted events the host PUBLISHED (display_in_profile, with the
 * album link) + attended events surfaced by their hosts' guest lists, minus the
 * owner's own hides. Never any counts (follower counts are owner-private) and
 * never an email.
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
  // block). The overflow (block/unblock) renders for EVERY signed-in non-self
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

  const [avatarUrl, coverUrls] = await Promise.all([
    getAvatarUrl(profile.id, profile.avatar_updated_at),
    getPublicProfileCoverUrls(profile.hosted_events),
  ]);

  const name = profile.display_name ?? `@${profile.slug}`;
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const hasEvents =
    profile.hosted_events.length > 0 || profile.attended_events.length > 0;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Quiet auth-aware header (the GuestHeader stance: this page belongs to
          the person, not to a loud Partyreel shell). Server-resolved: the page
          already ran getUser() for the follow gate. */}
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Link href="/" aria-label="Partyreel home">
          <Logo />
        </Link>
        <div className="flex h-8 items-center">
          <Button asChild variant="ghost" size="sm">
            <Link href={user ? "/dashboard" : "/"}>
              {user ? "Dashboard" : "Start for free"}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {/* Identity block: avatar, name, handle, restraint (joined month only —
            no counts by design: the graph is private, profiles-social.md point 4). */}
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
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[28px] leading-snug text-balance">
              {name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              <span>@{profile.slug}</span>
              <span aria-hidden className="text-muted-foreground/50">
                ·
              </span>
              <span>Joined {joined}</span>
            </p>
          </div>
          {(showFollow || showMenu) && (
            <div className="flex items-center gap-2">
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
            <Button asChild variant="outline" size="sm">
              <Link href="/account">Edit profile</Link>
            </Button>
          )}
        </section>

        {!hasEvents ? (
          <div
            data-arrive
            style={{ "--arrive-i": 1 } as CSSProperties}
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
          <>
            {profile.hosted_events.length > 0 && (
              <section
                data-arrive
                style={{ "--arrive-i": 1 } as CSSProperties}
                aria-label="Events"
                className="mt-10 space-y-3"
              >
                <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Events
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {profile.hosted_events.map((event) => (
                    <li key={event.id}>
                      {/* The album link the host PUBLISHED (display_in_profile);
                          password/private events still gate at the /e/ page.
                          Covers are open-events-only (the masking rule). */}
                      <EventCard
                        href={`/e/${event.custom_slug ?? event.qr_token}`}
                        name={event.name}
                        coverUrl={coverUrls.get(event.id) ?? null}
                        dateLabel={
                          event.event_date
                            ? formatEventDate(event.event_date)
                            : "No date set"
                        }
                        statusLabel={
                          event.visibility === "password"
                            ? "Password"
                            : event.visibility === "private"
                              ? "Private"
                              : null
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.attended_events.length > 0 && (
              <section
                data-arrive
                style={{ "--arrive-i": 2 } as CSSProperties}
                aria-label="Also at"
                className="mt-10 space-y-3"
              >
                <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Also at
                </h2>
                {/* Attendance rows carry NO link on purpose: being on a guest
                    list is not a capability grant (the RPC returns no token). */}
                <ul className="divide-y divide-border/60">
                  {profile.attended_events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {event.name}
                      </span>
                      {event.event_date && (
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" aria-hidden />
                          {formatEventDate(event.event_date)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
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
