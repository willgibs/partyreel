import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Eye, Images, Users } from "lucide-react";

import { EventCardsRow } from "@/components/app/event-feed/event-cards-row";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import {
  EventGallery,
  EventLive,
} from "@/components/app/event-feed/event-gallery";
import {
  LaunchList,
  launchItems,
} from "@/components/app/event-feed/launch-list";
import {
  HostAlbumProvider,
  HubAlbumCount,
} from "@/components/app/event-feed/host-album";
import { EventUploads } from "@/components/app/event-uploads";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { EventSheets } from "@/components/app/share/event-sheets";
import { PageHeading } from "@/components/shared/page-heading";
import { SetCrumbs } from "@/components/shared/crumbs";
import { WELCOME_VALUE } from "@/components/app/pricing/return-path";
import { WelcomeToPro } from "@/components/app/pricing/welcome-to-pro";
import {
  DEFAULT_TIER,
  TIER_NAMES,
  effectiveStorageCap,
  isSettingLocked,
  toBillingTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { getLinkStats } from "@/lib/db/queries/analytics";
import { getEvent } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { getProfile } from "@/lib/db/queries/profile";
import {
  getEventGuests,
  getEventSocialSettings,
  getMyProfileSlug,
} from "@/lib/db/queries/social";
import { guestCount } from "@/lib/events/event-guests";
import { formatCount } from "@/lib/format/count";
import {
  dealVisitSeed,
  planHubManifest,
  readHubReel,
  readRestOfManifest,
  seedFrom,
} from "@/lib/event/host-album.server";
import { firstWindowIds, newestPreviewUrl } from "@/lib/event/hub-album";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { legacySectionRoom, resolveEventSheet } from "@/lib/event/sections";
import { preferredEventUrl } from "@/lib/events/share-urls";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
} from "@/lib/shared/tile-size-cookie";
import { getSiteUrl } from "@/lib/site-url";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate } from "@/lib/utils";
import { VISIBILITY_LABELS } from "@/lib/events/visibility-labels";

// Presigned gallery URLs (the first window's) are per-request + short-lived, so
// this page must never be statically cached.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it.
type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    /** The sheet to open: share | settings. */
    room?: string;
    /** The retired feed filter, kept alive as a redirect into the rooms. */
    section?: string;
    eventTab?: string;
    /** `pro` after Checkout returns a buyer to the control that refused them. */
    welcome?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? event.name : "Event" };
}

/**
 * THE EVENT AS A HUB (Will, `event=hub`, 2026-09-20: "I love this view. The
 * additional controls (review, reel, guests, etc) feel much more beautiful,
 * actionable, and intuitive to hosts than the album-heavy page").
 *
 * Top to bottom: a live, scannable CODE at the left of the title + metadata
 * stack with the subtle link under it; a row of CARDS into the event's rooms;
 * and the ALBUM beneath them in most-recent order, which is the page's subject
 * and the reason the host opened it. The retired pieces — the Share-primary
 * command strip, the five filter pills, the stacked Review / Reel / Guests
 * sections — became those cards and those rooms.
 *
 * ★ THE STRUCTURE IS THE SHARING (his `event` note: "Get the QR and sharing
 * more infusion to the album UI visually"). The code is not a button that opens
 * a dialog containing a code; it is the header's left column, always there,
 * always scannable, and pressing it grows it. That is what carries his remark
 * on the neighbouring question — "On the event itself, always there ... I did
 * like your option 3 a lot" — without spending the header on a sharing block.
 */
export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { eventId } = await params;
  const { room, section, eventTab, welcome } = await searchParams;

  // A `?section=` deep link predates the rooms. Send it to the room that holds
  // that section now, rather than to a filter that no longer exists. Gallery
  // and "all" ARE this page, so they fall through.
  const legacyRoom = legacySectionRoom(section, eventTab);
  if (legacyRoom) redirect(`/dashboard/${eventId}/${legacyRoom}`);

  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  // The guest-facing absolute URL — the qr_token IS the capability
  // (database-security.md), straight from the row. One link per event
  // (guest-flow.md): the code, the link row and every copy control encode it.
  const siteUrl = await getSiteUrl();
  const eventLink = `${siteUrl}/e/${event.qr_token}`;
  // ★ What a host READS is the slug when they have claimed one; what anything
  // COPIES is still the permanent link above. A slug can be released; a code on
  // a table card cannot be reprinted. Built by the one builder, so the readable
  // form is a link that opens: a slug lives at `/e/<slug>`, never at the root.
  const prettyUrl = preferredEventUrl(siteUrl, {
    qrToken: event.qr_token,
    customSlug: event.custom_slug,
  });

  // ★ THE ALBUM IS THE PAGED ALBUM'S (the album-host-wiring lane). The page used
  // to read the album whole and presign three links an item before it rendered
  // anything, and every doorbell ping re-ran it. Now it reads the host's manifest
  // (every item, light, no links; approved, hidden and held, each with its status
  // in its flags) and the album's version, the same plan the host's poll answers
  // a first load with, then mints links for the newest items alone (the first
  // paint), and hands both to the album's store (`HostAlbumProvider`), which moves
  // the album from there with deltas. The page is never refreshed to show one.
  //
  // ★ ITS NUMBERS ARE COUNTED, IN THE VERSION'S SNAPSHOT (`album_changes_since`):
  // the album (approved + hidden) and Review (pending), never a list's length;
  // the bin's `removed` is in neither. (The Reel card's pips are a threshold, not a
  // number: `readHubReel` reads them off the manifest's flags.)
  const { supabase } = await getRequestAuth();
  const [
    plan,
    linkStats,
    guests,
    socialSettings,
    myProfileSlug,
    jar,
    liveReelFacts,
  ] = await Promise.all([
    planHubManifest(supabase, event.id),
    getLinkStats(event.id),
    getEventGuests(event.id),
    getEventSocialSettings(event.id),
    getMyProfileSlug(),
    cookies(),
    getLiveReelServerFacts(event.id),
  ]);
  // The first window's links and the Reel card, in parallel: both read off the
  // manifest, neither off the other. The card reads the whole album's flags (its
  // pool spans the album), so an album past one manifest page reads the rest.
  const [links, reelFace] = await Promise.all([
    readHostLinksBody(supabase, event, firstWindowIds(plan.part.entries)),
    readRestOfManifest(supabase, event.id, plan.part).then((entries) =>
      readHubReel(
        supabase,
        { id: event.id, showReel: event.show_reel },
        entries,
        liveReelFacts.liveReelEnabled,
      ),
    ),
  ]);
  const seed = seedFrom(event.id, plan, links);
  // The album's density step, painted from the cookie (`album-columns` r2: one
  // index shared by host and guest, a legacy width mapped across), and the
  // visit's seed for the rows' rhythm, dealt here so the first paint holds it.
  const rowStep = resolveRowStep(jar.get(TILE_SIZE_COOKIE)?.value);
  const rhythmSeed = dealVisitSeed();

  // The album's count and the Review queue's, counted: approved + hidden, and
  // pending. The bin's items are in neither (a host reading "48 photos" is
  // reading the photographs their guests can see or they have tucked away).
  const { pending: pendingCount } = seed.sync.counts;

  const isModerationOn = event.moderation_mode === "hold_for_approval";
  const views = linkStats.qrScans + linkStats.albumViews;

  // ★ THE ONE COUNT (guest by upload, Will 2026-09-22: "Uploaded 1 photo?
  // You're a guest."): the header's number and the Guests card's are the same
  // guests the album's own header counts (`getEventGuests`), a confirmed guest
  // once per person and a named unconfirmed one once per row, never the host.
  // It is read for the host directly, not through getGalleryStats (which zeroes
  // a private event's counts as a GUEST privacy guard), so a host always sees
  // the real number on their OWN event, whatever its visibility.
  const guestsCount = guestCount(guests);

  // ★ Visibility left the header's chip row for the Settings card's value line
  // (the header's two chips are gone: "accepting uploads" became the code's own
  // state). The word for `visibility = 'open'` is "Public", never "Open" (Will,
  // 2026-09-02), and it comes from the one server-safe record.
  // The launch list's outstanding items (`empty=list`), derived from the event's
  // own nulls by the same pure function the list renders from — so the section
  // header's count and the list can never disagree.
  const launch = launchItems({
    eventId: event.id,
    eventDate: event.event_date,
    description: event.description,
  });

  const cards = [
    {
      id: "review" as const,
      // The same face the row keeps live off the album's counts.
      ...reviewCardFace(isModerationOn, pendingCount),
    },
    {
      id: "guests" as const,
      // The room behind this card lists the guests only while the host's list
      // is on, so the card says the count when it can be opened onto, and the
      // one step it needs when it cannot.
      value: socialSettings?.showGuestList
        ? `${formatCount(guestsCount)} ${guestsCount === 1 ? "guest" : "guests"}`
        : "Turn on the list",
    },
    {
      id: "settings" as const,
      value: VISIBILITY_LABELS[event.visibility],
    },
  ];

  // THE HIGHLIGHT REEL'S CARD (`reel-host`, `progress=card`): it counts to two
  // off the album's manifest, then opens the view the guests watch. The owner
  // passes every gate at `/e/<token>?reel`. On the client its state and pips
  // follow the album live, and it asks for new stills when they change.
  const reel = {
    ...reelFace,
    of: REEL_MINIMUM,
    viewHref: `/e/${event.qr_token}?reel`,
    moderated: isModerationOn,
    pending: pendingCount,
  };

  return (
    // ★ A WIDE PAGE (Will's `host=same`, 2026-09-19): the host's album runs to
    // the window's edges. `data-app-wide` is how a page asks the shell to drop
    // its 1280 cap and take the album's gutter (app-shell.tsx), so the logo, the
    // code, the cards row and the album's first column all start on ONE left
    // line. The loading skeleton asks the same way, or the page would paint at
    // 1280 and then jump.
    <div data-route-fade data-app-wide className="space-y-6">
      {/* app-pricing-wiring's one block on this page (`back=finish`, Will
          2026-09-20): Checkout returns a buyer to the very control that refused
          them, with `?room=` already reopening its sheet, and this is the
          receipt above it. `applied` is the SERVER's tier (the webhook is its
          sole writer and can lag the redirect by a second), never the marker. */}
      {welcome === WELCOME_VALUE && (
        <WelcomeToPro
          applied={tier !== "free"}
          planName={TIER_NAMES[tier]}
          capBytes={effectiveStorageCap(
            tier,
            profile?.storage_cap_bytes ?? null,
          )}
          nextUrl={`/dashboard/${event.id}${room ? `?room=${room}` : ""}`}
          door={{ label: "Back to what you were doing" }}
        />
      )}
      <SetCrumbs
        trail={[
          { label: "Partyreel", href: "/dashboard" },
          { label: event.name },
        ]}
      />

      <EventShareProvider initialSheet={resolveEventSheet(room)}>
        {/* THE ALBUM'S STORE wraps everything on the page that shows the album
            or a number off it: the header's count and pip, the cards' Review
            and Reel, the album and its header. */}
        <HostAlbumProvider seed={seed} qrToken={event.qr_token}>
          {/* THE HEADER AS ONE OBJECT: the code's height IS the title + metadata
            + link stack, so the two columns read as a single block rather than
            a badge pinned beside a heading. It runs as wide as the page (his
            `album-columns` width note): a long name truncates at the window,
            not at a 1280 column the album beneath it ignores. */}
          <div className="flex items-center gap-4 sm:gap-5">
            <EventCodeDoor
              eventName={event.name}
              joinUrl={eventLink}
              qrStyle={event.qr_style}
              acceptingUploads={event.accepting_uploads}
            />
            <div className="min-w-0 flex-1 space-y-1">
              {/* No size override: the event name is this page's h1 and wears the
                ladder's `page` step like every other app title. The code beside
                it is a sibling BUTTON, never a child of the heading. */}
              <PageHeading className="truncate">{event.name}</PageHeading>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {event.event_date && (
                  <span>{formatEventDate(event.event_date)}</span>
                )}
                <span
                  className="flex items-center gap-1.5"
                  title="Photos and videos in the album"
                >
                  <Images className="size-3.5" />
                  {/* The album's count, live off the album's store (the page is
                    never refreshed to move it). */}
                  <HubAlbumCount />
                </span>
                <span
                  className="flex items-center gap-1.5"
                  title={
                    guestsCount === 1 ? "1 guest" : `${guestsCount} guests`
                  }
                >
                  <Users className="size-3.5" />
                  {formatCount(guestsCount)}
                </span>
                <span className="flex items-center gap-1.5" title="Views">
                  <Eye className="size-3.5" />
                  {formatCount(views)}
                </span>
                {/* ★ THE PIP (`first=live`, Will 2026-09-21). It sits in the
                  metadata row because that is where a host is already reading
                  the counts the album keeps current, and it renders NOTHING
                  until the Realtime channel is actually subscribed — a pip
                  claiming "Live" over a dead socket is worse than no pip. */}
                <EventLive />
              </div>
              <EventLinkRow prettyUrl={prettyUrl} permanentUrl={eventLink} />
            </div>
          </div>

          <HostAddProvider>
            <HostSelectionProvider>
              <EventCardsRow
                eventId={event.id}
                cards={cards}
                reel={reel}
                moderationOn={isModerationOn}
              />
              <EventGallery
                eventId={event.id}
                launchCount={launch.length}
                videosAllowed={videosAllowedForTier(tier)}
                initialStep={rowStep}
                tier={tier}
              >
                <EventUploads
                  eventId={event.id}
                  shareUrl={eventLink}
                  rhythmSeed={rhythmSeed}
                  launchList={
                    <LaunchList
                      eventId={event.id}
                      eventDate={event.event_date}
                      description={event.description}
                    />
                  }
                />
              </EventGallery>
            </HostSelectionProvider>
          </HostAddProvider>
        </HostAlbumProvider>

        <EventSheets
          event={event}
          tier={tier}
          pendingCount={pendingCount}
          social={
            socialSettings
              ? {
                  displayInProfile: socialSettings.displayInProfile,
                  showGuestList: socialSettings.showGuestList,
                  hostHasSlug: Boolean(myProfileSlug),
                }
              : null
          }
          joinUrl={eventLink}
          prettyUrl={prettyUrl}
          siteUrl={siteUrl}
          slugLocked={isSettingLocked("custom_slug", tier)}
          // Settings shows the reel's looks on one of this album's own
          // photographs: the reel's opening still, else the newest previewed
          // photo the first window already linked.
          reelSample={reelFace.stills[0] ?? newestPreviewUrl(seed)}
        />
      </EventShareProvider>
    </div>
  );
}
