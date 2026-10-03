import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { appNotFoundMetadata } from "@/app/(app)/not-found.metadata";
import { AppNotFoundScreen } from "@/app/(app)/not-found.screen";

import { HostCreditLookProvider } from "@/components/app/event-blocks/credit-look";
import { EventChecklist } from "@/components/app/event-feed/checklist";
import { EventCardsRow } from "@/components/app/event-feed/event-cards-row";
import { HubCover } from "@/components/app/event-feed/event-hub-head";
import {
  newestCoverStills,
  reelCoverStills,
} from "@/components/app/event-feed/event-hub-head-stills";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import { EventGallery } from "@/components/app/event-feed/event-gallery";
import { HostAlbumProvider } from "@/components/app/event-feed/host-album";
import { EventUploads } from "@/components/app/event-uploads";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { EventSheets } from "@/components/app/share/event-sheets";

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
import {
  calendarDayInZone,
  resolveViewerZone,
  serverZone,
  VIEWER_ZONE_HEADER,
} from "@/lib/dashboard/viewer-day";
import { getLinkStats } from "@/lib/db/queries/analytics";
import { getDoorCounts } from "@/lib/db/queries/event-doors";
import { getEvent } from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { getProfile } from "@/lib/db/queries/profile";
import {
  getEventGuests,
  getEventSocialSettings,
  getMyProfileSlug,
} from "@/lib/db/queries/social";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { guestCount } from "@/lib/events/event-guests";
import { formatCount } from "@/lib/format/count";
import {
  dealVisitSeed,
  planHubManifest,
  readHubReel,
  readRestOfManifest,
  seedFrom,
} from "@/lib/event/host-album.server";
import {
  firstWindowIds,
  newestPreviewUrl,
  seedLinkMap,
} from "@/lib/event/hub-album";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { legacySectionRoom, resolveEventSheet } from "@/lib/event/sections";
import {
  checklistOver,
  type ReadyFacts,
  stepsLeft,
} from "@/lib/events/readiness";
import { preferredEventUrl } from "@/lib/events/share-urls";
import { captureError } from "@/lib/observability/sentry";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
} from "@/lib/shared/tile-size-cookie";
import { getSiteUrl } from "@/lib/site-url";
import { getRequestAuth } from "@/lib/supabase/request-auth";

import { doorLabel } from "@/lib/events/visibility-labels";

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
  // ★ AN EVENT THAT IS GONE OR NEVER THIS HOST'S IS TITLED AS THE 404 IT IS (crumbs-28, build 30's red-team: this
  // said "Event", and its title won over the boundary's, so the tab read "Event · Partyreel" in the head and after
  // hydration). The not-found's own metadata, one home for the page and the boundary.
  return event ? { title: event.name } : appNotFoundMetadata;
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
  //
  // ★ AND THIS PAGE DRAWS IT ITSELF, NEVER THROUGH `notFound()` (crumbs-28, the
  // guest link's answer from `stale-link`). Thrown here, under this segment's
  // loading.tsx, it landed after the skeleton had streamed: a 200 whose HTML
  // held the skeleton alone, the screen drawn only once the client had run,
  // under this page's own title. Drawn here it streams into the skeleton's place
  // in the HTML, headed by generateMetadata's not-found answer. The status stays
  // 200, a soft 404: behind sign-in no crawler or link checker reads it, so a
  // read before every hub load would buy nothing (the manifest's Question).
  if (!event) return <AppNotFoundScreen />;

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
  // ★ THE DOOR'S NUMBERS (the doors, 20260929120000): who is in, who waits, the list, read on the
  // service role only now that `getEvent` has proved the host (RLS). They feed the Guests card's
  // waiting count, the code's corner mark and Settings' door page ("31 guests are already in").
  const [
    plan,
    linkStats,
    guests,
    socialSettings,
    myProfileSlug,
    jar,
    headerList,
    liveReelFacts,
    doorCounts,
    storage,
  ] = await Promise.all([
    planHubManifest(supabase, event.id),
    getLinkStats(event.id),
    getEventGuests(event.id),
    getEventSocialSettings(event.id),
    getMyProfileSlug(),
    cookies(),
    headers(),
    getLiveReelServerFacts(event.id),
    getDoorCounts(event.id),
    // The checklist's room row, the dashboard meter's own read. ★ A ROW IS NEVER WORTH THE PAGE: a failed
    // read leaves the row out (the quiet direction; the dashboard's meter still says it) and says so
    // where failures are read.
    getHostStorageSummary().catch((error: unknown) => {
      captureError("db", error, { seam: "hub_checklist_storage" });
      return null;
    }),
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

  // ★ READY FOR GUESTS (event-ready, Will 2026-10-02): the checklist at the head of the hub, Settings'
  // rail and the Settings card all read these facts through one function (`lib/events/readiness.ts`).
  // Every one is state already read above; the album's two ride live on the client from here.
  // ★ The code ticks at its first open, and "opened" is the header's own Views number, so "Opened 3
  // times" and the eye's 3 never disagree. The storage percent is the dashboard meter's own math.
  const storageCap = effectiveStorageCap(
    tier,
    profile?.storage_cap_bytes ?? null,
  );
  const storagePct =
    storage && storageCap && storageCap > 0
      ? Math.min(100, Math.round((storage.activeBytes / storageCap) * 100))
      : 0;
  const readyFacts: ReadyFacts = {
    door: event.door,
    hasPassword: event.has_password,
    guestsIn: doorCounts.in,
    invited: doorCounts.invited,
    acceptingUploads: event.accepting_uploads,
    approved: seed.sync.counts.album,
    playable: reelFace.have,
    showReel: event.show_reel,
    liveReelEnabled: liveReelFacts.liveReelEnabled,
    eventDate: event.event_date,
    description: event.description,
    opened: views,
    storagePct,
  };
  // ★ "Before guests arrive" is moot once they have: from the day after the event's date the checklist
  // steps aside, and the Settings card stops counting. The day is the VIEWER's (host-app.md: Vercel's
  // UTC is already tomorrow from evening on west of it), read as the dashboard reads it.
  const viewerZone = resolveViewerZone(
    headerList.get(VIEWER_ZONE_HEADER),
    serverZone(),
  );
  const { today } = calendarDayInZone(new Date().getTime(), viewerZone);
  const over = checklistOver(event.event_date, today);
  const guestNeeds = over ? 0 : stepsLeft(readyFacts);

  const cards = [
    {
      id: "review" as const,
      // The same face the row keeps live off the album's counts.
      ...reviewCardFace(isModerationOn, pendingCount),
    },
    {
      id: "guests" as const,
      // The guest list is always on (Will, event-safety `room=always`), so the
      // room behind this card always lists them, and the card says how many.
      // ★ AND WHO WAITS AT THE DOOR (event-settings r1, `queue=room`): while a
      // newcomer waits for the host, the card says so in the needs-action colour,
      // as Review's does for held uploads, since letting her in is done there.
      ...(doorCounts.waiting > 0
        ? {
            value: `${formatCount(doorCounts.waiting)} waiting`,
            amber: true,
            count: doorCounts.waiting,
          }
        : {
            value: `${formatCount(guestsCount)} ${guestsCount === 1 ? "guest" : "guests"}`,
          }),
    },
    {
      id: "settings" as const,
      // ★ WHAT A GUEST STILL NEEDS, COUNTED, while Settings' steps are not all ticked (event-ready: the
      // steps live in Settings, so its card says how many are left); then the door, in the one function
      // that words it everywhere (Public, Private and its gate, Only me).
      ...(guestNeeds > 0
        ? { value: `${formatCount(guestNeeds)} left`, strong: true }
        : { value: doorLabel(event.door) }),
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
    // Until a develop time ahead, no guest sees a photograph, so the card says it goes live then (red-team 43).
    developsAt: event.develops_at,
  };

  // ★ THE HUB'S COVER (`event-header` r1, `host=shared`): the album's own head, her tools on it. Its
  // photographs are the guests' cover's (`event-hub-head-stills.ts`): the reel's opening stills while it
  // plays, else the album's newest a guest can see, from the links the first window already minted.
  const seedLinks = seedLinkMap(seed);
  const coverStills =
    reelFace.state === "live" && reelFace.stills.length > 0
      ? reelCoverStills(reelFace)
      : newestCoverStills(seed.sync.entries, (id) => seedLinks.get(id)?.tile);
  // A receipt above the head (Checkout's return) keeps the head in the page's flow; otherwise the
  // cover reaches up to the app's bar, taking back the main's 32px.
  const welcomed = welcome === WELCOME_VALUE;

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
          capBytes={storageCap}
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
            and Reel, the checklist and Settings' rail, the album and its header. */}
        <HostAlbumProvider seed={seed} qrToken={event.qr_token}>
          {/* ★ THE HEAD IS THE ALBUM'S OWN (`event-header` r1, `host=shared`): the cover her guests walk
              into, its photographs dissolving edge to edge under the name, with her tools on it: the
              facts and the link under the title (r2 redraws both from his note; today's words stand),
              and the live code on its white mat in the cover's corner, scannable from across a table
              and pressing it grows it (`EventCodeDoor`). It bleeds by the wide page's own gutter to the
              window's edges, and reaches up to the app's bar. */}
          <HubCover
            name={event.name}
            date={event.event_date}
            counts={{
              album: seed.sync.counts.album,
              guests: guestsCount,
              views,
            }}
            prettyUrl={prettyUrl}
            eventLink={eventLink}
            code={{
              qrStyle: event.qr_style,
              door: event.door,
              acceptingUploads: event.accepting_uploads,
              waiting: doorCounts.waiting,
            }}
            stills={coverStills}
            toBar={!welcomed}
          />

          {/* A photograph's credit in the host's viewer opens its sender's look, with its quiet Block
              (event-safety `entry=all`, the viewer's face-led credit). */}
          <HostCreditLookProvider>
            <HostAddProvider>
              <HostSelectionProvider>
                <EventCardsRow
                  eventId={event.id}
                  cards={cards}
                  reel={reel}
                  moderationOn={isModerationOn}
                  head={{ name: event.name, stills: coverStills }}
                />
                <EventChecklist
                  eventId={event.id}
                  facts={readyFacts}
                  over={over}
                  plan={{
                    tier,
                    hasBilling: Boolean(profile?.stripe_customer_id),
                  }}
                />
                <EventGallery
                  eventId={event.id}
                  videosAllowed={videosAllowedForTier(tier)}
                  initialStep={rowStep}
                  tier={tier}
                >
                  <EventUploads
                    eventId={event.id}
                    shareUrl={eventLink}
                    rhythmSeed={rhythmSeed}
                  />
                </EventGallery>
              </HostSelectionProvider>
            </HostAddProvider>
          </HostCreditLookProvider>

          {/* Inside the album's store, after the album: Settings' rail ticks the reel's first photos as
              the album brings them, and a sheet is never inside a section a filter could unmount. */}
          <EventSheets
            event={event}
            tier={tier}
            counts={doorCounts}
            pendingCount={pendingCount}
            social={
              socialSettings
                ? {
                    displayInProfile: socialSettings.displayInProfile,
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
            ready={readyFacts}
          />
        </HostAlbumProvider>
      </EventShareProvider>
    </div>
  );
}
