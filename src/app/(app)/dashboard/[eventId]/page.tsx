import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Eye, Images, Users } from "lucide-react";

import { EventCardsRow } from "@/components/app/event-feed/event-cards-row";
import { EventGallery, EventLive } from "@/components/app/event-feed/event-gallery";
import {
  LaunchList,
  launchItems,
} from "@/components/app/event-feed/launch-list";
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
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { listEventMedia } from "@/lib/db/queries/media";
import { getProfile } from "@/lib/db/queries/profile";
import { getReelConfig, listReelItems } from "@/lib/db/queries/reel";
import {
  getEventGuestList,
  getEventSocialSettings,
  getMyProfileSlug,
} from "@/lib/db/queries/social";
import { toHostGalleryItems } from "@/lib/event/gallery-items";
import { legacySectionRoom, resolveEventSheet } from "@/lib/event/sections";
import { preferredEventUrl } from "@/lib/events/share-urls";
import { resolveTileSize, TILE_SIZE_COOKIE } from "@/lib/shared/tile-size-cookie";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";
import { VISIBILITY_LABELS } from "@/lib/events/visibility-labels";

// Presigned gallery URLs are per-request + short-lived, so this page must never
// be statically cached.
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

  const [
    media,
    linkStats,
    uploaderIdentities,
    likeCounts,
    reelIds,
    reelConfig,
    guestListEntries,
    socialSettings,
    myProfileSlug,
    jar,
  ] = await Promise.all([
    listEventMedia(event.id),
    getLinkStats(event.id),
    getUploaderIdentities(event.id),
    getEventLikeCounts(event.id),
    listReelItems(event.id),
    getReelConfig(event.id),
    getEventGuestList(event.id),
    getEventSocialSettings(event.id),
    getMyProfileSlug(),
    cookies(),
  ]);
  // The gallery's tile size, painted inline from the cookie (`app-vocabulary`
  // r1, `gallery-controls-persistence`; events-view.ts's own precedent).
  const tileSize = resolveTileSize(jar.get(TILE_SIZE_COOKIE)?.value);

  const galleryItems = await toHostGalleryItems({
    media,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });

  // hold_for_approval uploads arrive as 'pending' and live in the Review ROOM;
  // approved + hidden are the album. 'removed' never reaches here (listEventMedia
  // filters it) and lives in the bin, which is the album's Deleted filter.
  const pendingItems = galleryItems.filter((m) => m.status === "pending");
  const visibleItems = galleryItems.filter((m) => m.status !== "pending");

  const isModerationOn = event.moderation_mode === "hold_for_approval";
  const views = linkStats.qrScans + linkStats.albumViews;

  // contributorCount is computed HERE, not via getGalleryStats (which zeroes
  // counts for password/private events as a GUEST privacy guard), so the host
  // always sees real numbers on their OWN event.
  const visibleMedia = media.filter((m) => m.status !== "pending");
  const itemCount = visibleMedia.length;
  const guestContributors = new Set<string>();
  let hostContributed = false;
  for (const m of visibleMedia) {
    if (m.guest_id) guestContributors.add(m.guest_id);
    else hostContributed = true;
  }
  const contributorCount = guestContributors.size + (hostContributed ? 1 : 0);
  const guestsCount = guestListEntries?.length ?? 0;

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
      value: isModerationOn
        ? pendingItems.length > 0
          ? `${pendingItems.length} waiting`
          : "All caught up"
        : "Off",
      amber: isModerationOn && pendingItems.length > 0,
      count: isModerationOn && pendingItems.length > 0 ? pendingItems.length : undefined,
    },
    {
      id: "reel" as const,
      // The card reads "Create reel" until one exists; the room holds the
      // builder before birth and the studio after it.
      value: reelConfig
        ? `${reelIds.length} ${reelIds.length === 1 ? "clip" : "clips"}`
        : "Create reel",
    },
    {
      id: "guests" as const,
      value: guestListEntries
        ? `${guestsCount} ${guestsCount === 1 ? "contributor" : "contributors"}`
        : "Turn on the list",
    },
    {
      id: "settings" as const,
      value: VISIBILITY_LABELS[event.visibility],
    },
  ];

  return (
    // ★ THE ONE WIDE PAGE IN THE HOST APP (Will's `host=same`, 2026-09-19): the
    // host's album runs to the window's edges. `data-app-wide` is how a page
    // asks the shell to drop its 1280 cap (app-shell.tsx), so the logo, the
    // code, the cards row and the album's first column all start on ONE left
    // line. The words keep the app's measure, pinned left.
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
          capBytes={effectiveStorageCap(tier, profile?.storage_cap_bytes ?? null)}
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
        {/* THE HEADER AS ONE OBJECT: the code's height IS the title + metadata
            + link stack, so the two columns read as a single block rather than
            a badge pinned beside a heading. */}
        <div className="flex max-w-7xl items-center gap-4 sm:gap-5">
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
                {itemCount}
              </span>
              <span
                className="flex items-center gap-1.5"
                title={
                  contributorCount === 1
                    ? "1 contributor"
                    : `${contributorCount} contributors`
                }
              >
                <Users className="size-3.5" />
                {contributorCount}
              </span>
              <span className="flex items-center gap-1.5" title="Views">
                <Eye className="size-3.5" />
                {views}
              </span>
              {/* ★ THE PIP IS THE PAGE'S ONE LIVE ISLAND (`first=live`, Will
                  2026-09-21). It sits in the metadata row because that is where
                  a host is already reading the counts it keeps current, and it
                  renders NOTHING until the Realtime channel is actually
                  subscribed — a pip claiming "Live" over a dead socket is worse
                  than no pip. Everything it refreshes is this page's own RSC. */}
              <EventLive eventId={event.id} qrToken={event.qr_token} />
            </div>
            <EventLinkRow prettyUrl={prettyUrl} permanentUrl={eventLink} />
          </div>
        </div>

        <HostAddProvider>
          <HostSelectionProvider>
            <EventCardsRow eventId={event.id} cards={cards} />
            <EventGallery
              eventId={event.id}
              albumCount={visibleItems.length}
              launchCount={launch.length}
              videosAllowed={videosAllowedForTier(tier)}
              initialTileSize={tileSize}
            >
              <EventUploads
                eventId={event.id}
                items={visibleItems}
                pendingCount={pendingItems.length}
                shareUrl={eventLink}
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

        <EventSheets
          event={event}
          tier={tier}
          pendingCount={pendingItems.length}
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
        />
      </EventShareProvider>
    </div>
  );
}
