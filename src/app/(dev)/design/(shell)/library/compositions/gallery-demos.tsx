import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { HostMediaGrid } from "@/components/app/host-media-grid";
import { RecentlyDeletedGrid } from "@/components/app/recently-deleted-grid";
import { LikesProvider } from "@/components/likes/likes-provider";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import {
  SAMPLE,
  SAMPLE_BIN,
  SAMPLE_MEDIA,
} from "@/app/(dev)/design/reference/sample-data";
import {
  AlbumCoverDemo,
  HubBandDemo,
  HubCoverDemo,
  WhatStaysDemo,
  QrPresetPickerDemo,
  ReviewSectionDemo,
  InertStorage,
  StorageChartDemo,
  StorageListDemo,
  AdminHealthBandDemo,
  AdminMetricsChartsDemo,
  AdminQueueDemo,
  AdminRailDemo,
  AdminReportCardDemo,
  AtTheDoorDemo,
  ChecklistDemo,
  CodeDoorDemo,
  DoorPageDemo,
  InvitedDemo,
  SettingsDemo,
} from "./composition-demos";
import { CreateRoomDemo } from "./create-room-demo";
import { DownloadToastDemo } from "./download-toast-demo";
import { HostGridArrivalDemo } from "./host-grid-arrival-demo";
import { ModerationGridDemo } from "./moderation-grid-demo";
import { PlanLimitsDemo } from "./plan-limits-demo";
import {
  LockChipDemo,
  PricingSheetDemo,
  WelcomeToProDemo,
} from "./pricing-demos";

/**
 * THE PRODUCT COMPOSITIONS, declared (the gallery round, 2026-09-12).
 *
 * Every specimen here is a REAL product component imported from production and
 * rendered from the shared sample props (no DB, no R2), so this family is the
 * live app UI rather than a drawing of it.
 *
 * Every entry declares its own `file` (gallery.test.ts checks the path exists)
 * and its `title`, and its `lede` is its description: a gallery section is a
 * heading only, so the descriptions live on the entries.
 *
 * Most of these components take DATA rather than variants, so most entries
 * declare no `variants` axis. Two do: the event card's chrome and the host
 * grid's layout are real prop unions, and the axis is checked against the
 * component's own source.
 *
 * STILL DEFERRED (the fact the old page's footer carried): the personal media
 * grids behind LikesProvider (Uploads and Likes), the notification bell, and the
 * checkout / billing buttons. Each needs a provider or a signed-in session the
 * lab cannot supply, so they wait for a small in-lab harness rather than going
 * into the gallery as a mock of themselves.
 */

// One share chip, rendered in two entries: as the hosted card's `qrSlot` and as
// the Share suite's own specimen. Shared deliberately, so the two can never
// drift into demonstrating different props.
const qrSlot = (
  <EventCardQr
    eventId="demo"
    eventName={SAMPLE.eventName}
    qrToken={SAMPLE.qrToken}
    qrStyle={SAMPLE.qrStyle}
    siteUrl={SAMPLE.siteUrl}
  />
);

export const COMPOSITION_ENTRIES: GalleryEntry[] = [
  /* CREATE'S ROOM (library-specimens-2): the real wizard over the stand-in its `create` prop is for, in a real viewport
     (the room is the whole screen, `fixed` and read against the viewport), so every screen can be pressed through with no
     session and no row written. */
  {
    id: "create-room",
    badge: "new",
    family: "compositions",
    section: "Create",
    file: "src/components/app/create-event-wizard.tsx",
    test: "src/components/app/create-event-wizard.test.tsx",
    title: "Create's room",
    for: "the whole screen a host makes an event in: her event's name, the album's style, the code's look, then her code developing, one question and one button to a screen, and the door before it at a plan's limit",
    lede: "The real wizard in a real viewport, over the stand-in its `create` prop is for: Create event answers after a round trip with an event nobody wrote, so every screen can be pressed through with no session. Type a name and it rises into the head; the album's style plays its night once as the step opens (Live, Review and Disposable, each a small album moving through it); the code's look dresses her phone and the room's screen; Create event develops the sample into her code, with Print and Share and Settings' steps beneath. The frame is the viewport, so the room reads its width and height: a phone and a laptop are the room each is. Get it ready, See Pro and the close are held, since each leaves the room, and the name's field does not take focus as the room opens, which production's does.",
    specimens: [
      {
        label: "At a phone",
        hint: "375 by 812: type a name, Continue, pick a style, Continue, pick a look, Create event; Back or a hairline walks back",
        node: <CreateRoomDemo screen="phone" />,
      },
      {
        label: "At a laptop",
        hint: "1440 by 900, zoomed down to the page's column: the frame's own viewport is still the laptop's",
        node: <CreateRoomDemo screen="desk" />,
      },
      {
        label: "At the plan's limit",
        hint: "Free holds one event: the door arrives before the work and names the event holding the slot",
        node: <CreateRoomDemo atCap />,
      },
    ],
  },
  /* THE EVENT'S HEAD (added by lp/header-wiring at the HEAD of the list, under a heading of its own, so
     it lands on its own hunk): `event-header` r1's three picks as production composes them. */
  {
    id: "album-cover",
    badge: "new",
    family: "compositions",
    section: "The event's head",
    file: "src/components/guest/event-experience-head.tsx",
    title: "The album's cover",
    for: "the head a guest walks into past the door: the reel's own photographs dissolving edge to edge under the event's name, Add photos white on them",
    lede: "The album's head on every event (`guest=cover`). The reel's own stills dissolve under the name, from the very HTML the server streams, on the house light until there are any (an empty album, one sealed until it develops). The byline says who and when in one line, the counts are glyphs at a desk, and the actions stand on the photograph: Add photos in white, the reel's round and Invite in glass. Reduced motion stands it on its first photograph.",
    specimens: [
      {
        label: "Priya lands on the album",
        hint: "214 photos from 31 guests; widen the window for the desk's two columns",
        bleed: true,
        node: <AlbumCoverDemo />,
      },
      {
        label: "The first guest of the night",
        hint: "nothing in the album yet: the house light, and Add the first photo",
        bleed: true,
        node: <AlbumCoverDemo empty />,
      },
    ],
  },
  {
    id: "hub-cover",
    badge: "new",
    family: "compositions",
    section: "The event's head",
    file: "src/components/app/event-feed/event-hub-head.tsx",
    title: "The hub's head",
    for: "Maya's hub wearing her album's cover, her numbers and link on it, the facts strip along its foot and the code on its white mat",
    lede: "One head on both sides of the code (`host=shared`): Maya sees her party as her guests do. Under the title stand the date, the guests, the views and the link; along the cover's foot runs the facts strip (`facts=strip`), one mark a photograph, each as tall as the photographs that landed within ten minutes of it, the newest lit while photographs land and the line ending in the album's number. The code stands on its mat in the cover's corner, scannable from across a table, wearing its door on its corner. Once it has scrolled away the room cards' band carries its face and the code as a chip.",
    specimens: [
      {
        label: "Tonight",
        hint: "two people at her door, the lock's count on the code's corner; the strip's newest marks stay lit for a quarter-hour after this page loads, as they do while photographs land",
        bleed: true,
        node: <HubCoverDemo />,
      },
      {
        label: "The week before",
        hint: "nothing in the album: the house light, and the strip a quiet line that says No photos yet",
        bleed: true,
        node: <HubCoverDemo before />,
      },
      {
        label: "Scrolled into the album",
        hint: "scroll past the head: the band sticks under the bar with its face, the name and the code as a chip",
        bleed: true,
        node: <HubBandDemo />,
      },
    ],
  },
  {
    id: "what-stays",
    badge: "new",
    family: "compositions",
    section: "The event's head",
    file: "src/components/guest/guest-action-dock.tsx",
    test: "src/components/guest/guest-action-dock.test.tsx",
    title: "What stays",
    for: "the album's actions once the cover has scrolled away: Invite, the shutter and its twin over the album, the page's ground rising under them",
    lede: "One round Add at the foot's centre in the album's light (`stays=shutter`), Invite on its left and its twin on its right (the reel, or the way back to the cover where an album has no reel), and the album's own ground rising under them while more album lies below. Press the shutter: its count goes down as a run of three goes.",
    specimens: [
      {
        label: "Deep in the album",
        hint: "press the shutter",
        node: <WhatStaysDemo />,
      },
    ],
  },
  /* THE OPERATIONS PORTAL'S SHELL (added by lp/admin-wiring at the HEAD of the
     list, so several lanes in one round land on distinct hunks). The `admin`
     board retires into this: every /admin route is behind requireAdmin() plus
     AAL2 on its own host, so nothing automated can open one, and these are the
     only crawl-reachable rendering of the portal's shape there is. */
  {
    id: "admin-shell",
    badge: "new",
    family: "compositions",
    section: "The operations portal",
    file: "src/components/admin/admin-rail.tsx",
    title: "The portal's shell",
    lede: "The portal's rail with its command palette, the band under the bar that is gone on a good day, and the numbers first with the queue beneath. Fed one Tuesday's fixtures, credential-free: the bar is left out because its operator menu holds a real sign-out form, and a gallery page does not get to end somebody's session.",
    specimens: [
      {
        label: "The rail",
        hint: "232px at lg; counts on Support, Applicants, Reports and Jobs. No row is current here, because the path is the library's",
        node: <AdminRailDemo />,
      },
      {
        label: "The band, on a bad day and on an unreadable one",
        hint: "it names the jobs while there are few enough to name; an unreadable heartbeat says so in words and never as a count",
        node: <AdminHealthBandDemo />,
      },
      {
        label: "What is waiting, worst first",
        hint: "a failed purge outranks a press enquiry, and the tint reaches only the rows worth finding by scrolling",
        node: <AdminQueueDemo />,
      },
    ],
  },
  {
    id: "admin-report-cards",
    badge: "new",
    family: "compositions",
    section: "The operations portal",
    file: "src/components/admin/report-queue.tsx",
    test: "src/components/admin/report-queue.test.tsx",
    title: "Reports' own queue",
    for: "the review grid an operator works the night's reports in: the harm in front, worst first and the worst covered, the sweep's one Dismiss, the report whole with every verb, and a phone's two acts",
    lede: "The real ReportQueue over a Saturday night of reports and writes that answer after a round trip and change nothing, so a reviewer here can never touch anyone's report. Space or a press opens a report whole; Remove…'s note is optional, Hold for forensics' reason is required and its Take it down too starts on; Ask for proof opens its question. At phone width each report carries Take it down and Hold for forensics, one press each. A report whose item has since been deleted is still that item's: its tile says the photo or the video was deleted, its chip says Deleted, and with nothing left to take down its verdict only closes.",
    specimens: [
      {
        label: "The front, the sweep, and the closed log under them",
        hint: "View shows a covered photo · Space opens the report whole · two reports name an item since deleted · at 375 the two acts",
        node: <AdminReportCardDemo />,
      },
    ],
  },
  {
    id: "admin-albums-grid",
    badge: "new",
    family: "compositions",
    section: "The operations portal",
    file: "src/components/admin/moderation-grid.tsx",
    test: "src/components/admin/moderation-grid.test.tsx",
    title: "The Albums browser's grid",
    for: "the operator's grid of an album's items: Remove on what is up, Restore on what was removed, and the worst kinds covered, a tile with no picture at all that opens nothing",
    lede: "The real ModerationGrid over four tiles: a seen photograph, a removed one, a video, and a covered one. A report of the worst kinds names a covered item, so nothing of it is signed (no url of any kind), its tile draws the reports inbox's own cover, the viewer steps only through what is seen, and Remove and Restore stay on it since neither needs a look. The portal's own writes (Remove behind its sheet, Restore) and the album caption's link are held here: they go nowhere.",
    specimens: [
      {
        label: "The feed, with the album's caption",
        hint: "Covered tile has no picture to open · tap a seen tile for the viewer · Remove and Restore are held",
        node: <ModerationGridDemo />,
      },
      {
        label: "Inside one album",
        hint: "mode=album · the caption is gone, since the page already says which album",
        node: <ModerationGridDemo mode="album" />,
      },
    ],
  },
  {
    id: "admin-metrics-charts",
    badge: "new",
    family: "compositions",
    section: "The operations portal",
    file: "src/components/admin/metrics-charts.tsx",
    test: "src/components/admin/metrics-charts.test.ts",
    title: "The metrics charts",
    for: "the trend and distribution charts /admin/metrics draws, at counts its test data never reaches",
    lede: "The real TrendChart and DistributionChart over fixed counts past 1,000, loaded lazily as the metrics page loads them. Each axis ticks compact and is sized from the labels it actually draws, so a tick the axis rounds past the data (a Free count of 3,000 ticks 2.3K, views near 99K tick 100K) reads whole.",
    specimens: [
      {
        label: "A trend and a distribution, past 1,000",
        hint: "hover a point or a bar for the exact count; every tick reads whole at any width",
        node: <AdminMetricsChartsDemo />,
      },
    ],
  },
  {
    id: "plan-limits",
    badge: "new",
    family: "compositions",
    section: "The operations portal",
    file: "src/app/admin/jobs/limits-card.tsx",
    test: "src/app/admin/jobs/limits-card.test.tsx",
    title: "The Plan limits card",
    for: "every vendor's meter against its plan's limit on /admin/jobs, the spend watch's last run as a bar and its words, never as a number a meter is not",
    lede: "The real PlanLimitsCard over runs written by hand, so every state the portal can show is here without an operator's sign-in. A meter is drawn as what it is: a bar and its words under a level's chip, never as a number it is not. One that could not be read says No reading and why, a missing or unreadable run says so in words, and nothing draws a calm card over a gap. Built from the real `METERS`, so a meter added there reaches every card.",
    specimens: [
      {
        label: "Every meter read, a few percent in",
        hint: "the one card that may say a plain OK; each bar is the share of the plan's limit and each row says how fast it climbs",
        node: <PlanLimitsDemo state="healthy" />,
      },
      {
        label: "Past a threshold",
        hint: "Active CPU critical, CDN requests warning, R2 storage a floor: the chip takes the worst, and a critical meter says what breaking it costs",
        node: <PlanLimitsDemo state="critical" />,
      },
      {
        label: "A failed read",
        hint: "Vercel refused the token: its four meters have no bar and no number, only No reading and why in the failure tone, and the chip says it",
        node: <PlanLimitsDemo state="failed" />,
      },
      {
        label: "Gaps: Not wired",
        hint: "a meter with no reader says Not wired (or that the vendor reports none), in words and no tone; the chip says Partly read and the header counts them",
        node: <PlanLimitsDemo state="gaps" />,
      },
      {
        label: "Nothing to show",
        hint: "no run has carried the limits yet, and a run that could not be read: said in words, never a calm card",
        node: (
          <div className="flex w-full flex-col gap-4">
            <PlanLimitsDemo state="never" />
            <PlanLimitsDemo state="unreadable" />
          </div>
        ),
      },
    ],
  },
  {
    id: "event-card",
    test: "src/components/app/event-card.test.tsx",
    family: "compositions",
    section: "Event card",
    file: "src/components/app/event-card.tsx",
    title: "EventCard",
    lede: "A party as a card, stat-forward, in each of its states: a profile's grid draws it (the dashboard's tile is its own since host-dashboard r1).",
    variants: [
      {
        prop: "variant",
        source: "prop",
        fallback: "hosted",
        options: ["hosted", "guest", "trash"],
        note: "What the chrome carries: hosted takes the QR slot and the amber review chip, guest (an event you added photos to) the profile's Guest marker and a byline, trash the dim and the countdown. No sample row, because the four specimens below already show all three.",
      },
    ],
    specimens: [
      {
        label: "Hosted",
        hint: "QR chip + review chip",
        node: (
          <EventCard
            variant="hosted"
            href="#"
            name={SAMPLE.eventName}
            coverUrl={SAMPLE.cover}
            dateLabel={SAMPLE.dateLabel}
            itemsLabel="128 items"
            statusLabel="Open"
            pendingCount={3}
            qrSlot={qrSlot}
          />
        ),
      },
      {
        label: "No cover",
        hint: "dark gallery fallback",
        node: (
          <EventCard
            variant="hosted"
            href="#"
            name="Office Summer Party"
            coverUrl={null}
            dateLabel="Aug 2"
            itemsLabel="0 items"
            statusLabel="Open"
            pendingCount={0}
          />
        ),
      },
      {
        label: "Guest",
        hint: "an event you added to: marker + byline",
        node: (
          <EventCard
            variant="guest"
            href="#"
            name="Priya &amp; Sam"
            coverUrl={SAMPLE.cover2}
            dateLabel="May 30"
            byline="Hosted by Priya"
          />
        ),
      },
      {
        label: "Deleted",
        hint: "dimmed + countdown",
        node: (
          <EventCard
            variant="trash"
            href={null}
            name="Old Test Event"
            coverUrl={SAMPLE.cover3}
            dateLabel="Mar 11"
            statusLabel="6 days left"
          />
        ),
      },
    ],
  },

  {
    id: "storage-meter",
    family: "compositions",
    section: "Dashboard chrome",
    file: "src/components/app/dashboard/storage-meter.tsx",
    title: "StorageMeter",
    badge: "updated",
    lede: "The storage ring beside the dashboard's New event: everything she stores against her cap, her Deleted included, amber only when what an upload must fit beside nears it. Open it for the storage chart, the friendly capacity, the Event Pass expiry and the billing buttons.",
    specimens: [
      {
        label: "Storage meter",
        hint: "ambient · popover",
        node: (
          <InertStorage>
            <StorageMeter
              activeBytes={24 * 1024 ** 3}
              deletedBytes={3 * 1024 ** 3}
              storageCap={50 * 1024 ** 3}
              makeRoom
              passExpiry={null}
              planName="Pro"
              hasBilling
              isEventPass={false}
            />
          </InertStorage>
        ),
      },
    ],
  },
  {
    id: "storage-chart",
    family: "compositions",
    section: "Dashboard chrome",
    file: "src/components/app/storage/storage-chart.tsx",
    test: "src/components/app/storage/storage-chart.test.tsx",
    title: "StorageChart",
    badge: "new",
    for: "what her plan holds: her albums and her Deleted drawn apart against the cap, with Make room from Deleted and Empty Deleted beside them",
    lede: "The storage meter's popover holds it. Her plan's cap holds her albums and her Deleted together, so it is one bar with the two drawn apart, a sentence only when there is something to know or do, and the two acts that free room without leaving it. Drawn here over Pro 50 GB; its switch and Empty Deleted answer after a pause and change nothing.",
    specimens: [
      {
        label: "Empty",
        hint: "nothing stored",
        node: <StorageChartDemo state="empty" />,
      },
      {
        label: "Half used",
        hint: "20.5 GB in albums · 4.25 GB in Deleted",
        node: <StorageChartDemo state="half" />,
      },
      {
        label: "Full, Make room on",
        hint: "35 GB in albums · 15 GB in Deleted: an upload takes its room from Deleted",
        node: <StorageChartDemo state="full-on" />,
      },
      {
        label: "Full, Make room off",
        hint: "the same bytes: an upload is refused until Deleted is emptied",
        node: <StorageChartDemo state="full-off" />,
      },
    ],
  },
  {
    id: "storage-list",
    family: "compositions",
    section: "Dashboard chrome",
    file: "src/components/app/storage/storage-list.tsx",
    test: "src/components/app/storage/storage-list.test.tsx",
    title: "StorageList",
    badge: "new",
    for: "what is using space: every item a host stores, largest first, with All or one event, Deleted at its head with Empty, the bulk bar's Download and Delete for good, and the strip that finishes a smaller plan's switch",
    lede: "Opened from the storage meter's popover, and from a Pro price too small for what she stores (tap its Too small, then See what's using space), where the goal strip counts down to that size and its button finishes the switch. Its reads and writes are inert here: they answer after a round trip's pause and change nothing, and the switch stops at a note.",
    specimens: [
      {
        label: "Two doors",
        hint: "the meter's popover · a refused price in the plan",
        node: <StorageListDemo />,
      },
    ],
  },
  {
    id: "event-card-qr",
    family: "compositions",
    section: "Share suite",
    file: "src/components/app/event-card-qr.tsx",
    title: "EventCardQr",
    lede: "The card's top-left chip. It is a sibling of the card link, so tapping it goes to the event's share sheet and never to the event itself.",
    specimens: [
      {
        label: "Share chip",
        hint: "tap to open the share sheet",
        node: (
          <div className="flex items-center gap-3">
            {qrSlot}
            <span className="text-sm text-muted-foreground">
              Opens the share sheet
            </span>
          </div>
        ),
      },
    ],
  },
  {
    id: "qr-preset-picker",
    file: "src/components/app/qr-preset-picker.tsx",
    for: "the four code looks as one choice of four: a radio group of corners, each a window onto its own look's code (a rounded finder reads as rounded, Bold's coral as coral), sized in CSS rather than by a re-render, every corner drawn on the link it is handed. Controlled: the parent owns the value and the saving",
    test: "src/components/app/qr-preset-picker.test.tsx",
    family: "compositions",
    section: "Share suite",
    title: "QrPresetPicker",
    // No variants axis for the same reason as the filter chips: the four style
    // keys live in src/lib/constants/qr-presets, not in this file.
    lede: "The four swatches under Create's look step, re-dressing her code where guests meet it: the arrows move between the looks, choosing as they go, and the parent owns the pick.",
    specimens: [
      {
        label: "QR preset picker",
        hint: "share · live styled QR",
        node: <QrPresetPickerDemo />,
      },
    ],
  },

  {
    id: "events-empty-teaser",
    family: "compositions",
    section: "Teasers",
    file: "src/components/app/dashboard/events-empty-teaser.tsx",
    title: "EventsEmptyTeaser",
    lede: "The create-first hero the Events section shows when a host has no events at all, so a brand-new account meets an invitation instead of a void.",
    specimens: [
      {
        label: "Events empty (hero)",
        hint: "create-first",
        node: <EventsEmptyTeaser />,
      },
    ],
  },
  {
    id: "empty-section-teaser",
    family: "compositions",
    section: "Teasers",
    file: "src/components/app/dashboard/empty-section-teaser.tsx",
    title: "EmptySectionTeaser",
    lede: "The slim teaser an empty Uploads or Likes section shows, parameterized so both share it.",
    specimens: [
      {
        label: "Section teaser (slim)",
        hint: "parameterized",
        node: (
          <EmptySectionTeaser
            heading="Your uploads"
            blurb="Photos you add to any event show up here."
          />
        ),
      },
    ],
  },
  {
    id: "feed-section",
    family: "compositions",
    section: "Teasers",
    file: "src/components/app/dashboard/feed-section.tsx",
    title: "FeedSection",
    lede: "The labeled wrapper the feed puts around each content group. Its heading matches the teaser's exactly, so a section reads the same full or empty.",
    specimens: [
      {
        label: "Feed section",
        hint: "labeled wrapper",
        node: (
          <FeedSection heading="Your likes">
            <p className="text-sm text-muted-foreground">
              The labeled section the feed uses for each content group.
            </p>
          </FeedSection>
        ),
      },
    ],
  },

  {
    id: "host-media-grid",
    file: "src/components/app/host-media-grid.tsx",
    for: "the host's album: the shared masonry with the host's three verbs as its per-surface actions, optimistic moderation shared by the tiles and the lightbox, and the ARRIVAL mark, which is an id in this render that was not in the last one. That one definition catches every route a photograph takes into a host's album without this component knowing about any of them",
    test: "src/components/app/host-media-grid.test.tsx",
    family: "compositions",
    section: "Moderation gallery",
    title: "HostMediaGrid",
    lede: "The host's moderation grid on the shared masonry (S3·3a): status-aware approve / hide / unhide / remove plus the host like-count, each control riding any tile ratio. Visual only here, since the actions point at a sample id.",
    // The grid's one axis, `selectable`, is left undeclared: bulk select needs
    // HostSelectionProvider (useHostSelection returns null without it), so an
    // option row here would advertise a mode the lab cannot actually enter. It
    // belongs with the deferred provider-bound set at the top of this file.
    specimens: [
      {
        label: "Moderation grid",
        hint: "masonry · per-tile controls",
        /* Wrapped in LikesProvider to FAITHFULLY mirror the real host gallery
           (EventUploads wraps it the same way) — makes the host Like render +
           this a reliable host-gallery HYDRATION probe (auth-free, gated). */
        node: (
          <LikesProvider mediaIds={SAMPLE_MEDIA.map((m) => m.id)}>
            <HostMediaGrid eventId="demo" items={SAMPLE_MEDIA} />
          </LikesProvider>
        ),
      },
      {
        label: "A guest sends a photo",
        hint: "the album's arrival: the new one waits for its picture, the row opens where it lands, it glows for one length · five at once is a burst · the tile's verbs are held · the rows follow this window's width",
        node: <HostGridArrivalDemo />,
      },
    ],
  },
  {
    id: "recently-deleted-grid",
    family: "compositions",
    section: "Moderation gallery",
    file: "src/components/app/recently-deleted-grid.tsx",
    title: "RecentlyDeletedGrid",
    lede: "The recovery bin on the same masonry: a countdown pill per tile, restore, and delete-forever behind a confirm.",
    specimens: [
      {
        label: "Recovery bin",
        hint: "countdown · restore / purge",
        node: <RecentlyDeletedGrid eventId="demo" items={SAMPLE_BIN} />,
      },
    ],
  },

  {
    id: "review-section",
    family: "compositions",
    section: "Review surface",
    file: "src/components/app/event-feed/review-section.tsx",
    title: "ReviewSection",
    lede: "The Review room whole: the uniform queue, Select or Approve all, the bulk bar's Reject and Approve, the peek a tap opens with its verdict, the keys once a tile has focus, and each verdict's toast with its Undo. Its writes are inert here (they answer and change nothing); A guest sends one plays an upload arriving, which waits behind the line.",
    specimens: [
      {
        label: "Review room",
        hint: "triage · the peek's verdict · the keys · Undo · the line",
        node: <ReviewSectionDemo />,
      },
    ],
  },

  {
    id: "event-checklist",
    badge: "new",
    family: "compositions",
    section: "Event page",
    file: "src/components/app/event-feed/checklist.tsx",
    test: "src/components/app/event-feed/checklist.test.tsx",
    title: "The checklist",
    for: "what an event still needs before guests arrive, at the head of the hub until it is done: what a guest needs, measured by the bar, then what is worth doing, each row ticked from the event's own state and carrying the doors that finish it",
    lede: "The hub's checklist under the cards: the whole list while the album is empty, folded to one line once it has photos, gone once everything is done (and from the day after the event's date). Every tick is state the app already holds, read by the same function as Settings' steps and Create's hand-off. Its doors open nothing here: no hub stands behind them.",
    specimens: [
      {
        label: "An hour after Create",
        hint: "the album empty: the whole list, the code the one thing a guest still needs",
        node: <ChecklistDemo moment="fresh" />,
      },
      {
        label: "Three photos in, the code never opened",
        hint: "folded to one line over the album · Show unfolds it",
        node: <ChecklistDemo moment="seeded" />,
      },
      {
        label: "Ready, the shelf running short",
        hint: "a full bar is ready · room listed past 85% of the plan",
        node: <ChecklistDemo moment="short" />,
      },
    ],
  },
  {
    id: "event-code-door",
    badge: "new",
    family: "compositions",
    section: "Event page",
    file: "src/components/app/share/event-code-door.tsx",
    test: "src/components/app/share/event-code-door.test.tsx",
    title: "The code as the door",
    for: "the hub's live code beside the event's name, wearing who can get in on its corner: a lock for a gate, a closed eye for Only me, a pause for paused uploads, the count while people wait",
    lede: "The code at the left of the hub's title, in five doors. The mark sits outside the mat, so nothing lands on the modules; its words come on hover, on a keyboard's focus and on a tap. Paused uploads and Only me dim the code, since a guest who scans either cannot add.",
    specimens: [
      {
        label: "Five doors",
        hint: "hover, focus or tap a mark for its words",
        node: <CodeDoorDemo />,
      },
    ],
  },
  {
    id: "event-settings",
    badge: "new",
    family: "compositions",
    section: "Event settings",
    file: "src/components/app/event-settings/event-settings-sheet.tsx",
    test: "src/components/app/event-settings/event-settings-sheet.test.tsx",
    title: "Settings, five steps",
    lede: "An event's settings at rest: four steps down one rail, each one sentence of where its group stands with its key words live (tap one to change it there) and ticked once ready, then the code as the fifth; each step opens its own page, and every page ends in Next. Delete a quiet row at the foot. Every control saves as it is made. Its writes are inert here (they answer after a round trip and change nothing).",
    specimens: [
      {
        label: "On Pro",
        hint: "tap a word to change it · tap a step to open its page · Next walks on",
        node: <SettingsDemo />,
      },
      {
        label: "On Free",
        hint: "What guests can add › Videos: drawn off with the Pro mark, and it opens the plans",
        node: <SettingsDemo tier="free" />,
      },
      {
        label: "The door, in steps",
        hint: "Private, letting each person in: 31 in, 2 at the door; try Only me, or Public",
        node: <DoorPageDemo />,
      },
    ],
  },

  {
    id: "guests-door",
    badge: "new",
    family: "compositions",
    section: "Guests room",
    file: "src/app/(app)/dashboard/[eventId]/guests/at-the-door.tsx",
    test: "src/app/(app)/dashboard/[eventId]/guests/at-the-door.test.tsx",
    title: "At the door and Invited",
    lede: "The Guests room's door, above its guests: At the door lists who confirmed an email and waits for the host, Let in opening the album where each one waits and Decline blocking them, with Undo on its toast; Invited holds the invite list, one field taking a typed address or a pasted list, each address Joined or Not yet. Its acts are inert here (they answer after a round trip and change nothing).",
    specimens: [
      {
        label: "At the door",
        hint: "Let in · Decline, then Undo on its toast",
        node: <AtTheDoorDemo />,
      },
      {
        label: "Invited",
        hint: "type one and press Enter, or paste a list with a bad entry in it",
        node: <InvitedDemo />,
      },
    ],
  },
  /* THE PLANS' SURFACE (library-specimens-3): the real sheet, chip and receipt over the doors the surface names
     (`pricing-doors.tsx`), so Checkout, the billing portal and Stripe's confirm page are nowhere in reach and the
     sheet opens on a fixture's facts, in a real viewport at a laptop and a phone. */
  {
    id: "pricing-sheet",
    file: "src/components/app/pricing/pricing-sheet.tsx",
    test: "src/components/app/pricing/pricing-sheet.test.tsx",
    title: "PricingSheet",
    for: "the plans, inside the app: led by the reason it opened (a locked control, no room, a look at the plan), two cards and a price for a host choosing a first plan, her three sizes under one Monthly / Yearly toggle for a Pro host, the pass on one line, a quiet foot to the full page",
    badge: "new",
    family: "compositions",
    section: "Plans and billing",
    lede: "The real sheet over the doors the surface names, so the buttons that leave for Stripe do what they do until they would leave and then say the Library stops there, and it opens on a fixture's facts after the pause a real read takes. A popup of the plan kind: a wide dialog at a laptop, the whole screen under a close in a hand. Four hosts: a Free host who pressed the video lock, a pass holder whose albums outgrew the smallest size, a pass holder looking at the plan, and a Pro host with three sizes (one too small for what she stores, one a switch). Nothing is fetched, posted or opened.",
    specimens: [
      {
        label: "A locked control, on Free",
        hint: "trigger=locked · opens on the feature's own words, Free beside one Pro card, the pass on one line",
        node: <PricingSheetDemo state="locked" />,
      },
      {
        label: "Out of room, a pass holder",
        hint: "trigger=room · the read moves the card to the smallest size that fits and says which it skipped",
        node: <PricingSheetDemo state="room" />,
      },
      {
        label: "A look at the plan, a pass holder",
        hint: "trigger=plan · the Pro card and Add a pass, never Free",
        node: <PricingSheetDemo state="pass" />,
      },
      {
        label: "A Pro host's three sizes",
        hint: "a quiet list until her plan is read · her size held, one too small, one a switch · Manage billing",
        node: <PricingSheetDemo state="pro" />,
      },
    ],
  },
  {
    id: "lock-chip",
    file: "src/components/app/pricing/lock-chip.tsx",
    test: "src/components/app/pricing/lock-chip.test.tsx",
    title: "LockChip",
    for: "the one component behind every locked control: the control's own name and the plan that opens it, a tooltip saying why it is locked, a press that opens the plans' sheet led by that feature. Convert, not block",
    badge: "new",
    family: "compositions",
    section: "Plans and billing",
    lede: "A locked control is a button, never a dead label: it wears its own name and the plan, says why in its tooltip, and opens the sheet on the feature it stands for. Three chips over a Free host; press one and the sheet opens in this window over the inert doors (a laptop's wide dialog, a phone's whole screen).",
    specimens: [
      {
        label: "Three locked controls",
        hint: "hover or focus a chip for why it is locked · press it for the sheet, led by its feature",
        node: <LockChipDemo />,
      },
    ],
  },
  {
    id: "welcome-to-pro",
    file: "src/components/app/pricing/welcome-to-pro.tsx",
    test: "src/components/app/pricing/welcome-to-pro.test.tsx",
    title: "WelcomeToPro",
    for: "the door out of Checkout: a receipt that says the plan only once the server has it, and heals itself when the webhook is late",
    badge: "new",
    family: "compositions",
    section: "Plans and billing",
    lede: "What a host lands on after paying. Stripe redirects the instant payment succeeds, routinely seconds before the webhook writes the tier, so the receipt decides which of two true things to say: the plan is on (its three facts and the way on), or the payment is in and the plan is being applied. A pending receipt re-reads the server a bounded number of times and flips to the real one. Over a router that goes nowhere, at a laptop and a phone.",
    specimens: [
      {
        label: "The plan is on",
        hint: "applied · the room it holds, video, no watermark · Go to your dashboard closes it",
        node: <WelcomeToProDemo state="applied" />,
      },
      {
        label: "The webhook is late",
        hint: "Payment received, then, after its first re-read, Welcome to Pro · Replay plays the race again",
        node: <WelcomeToProDemo state="race" />,
      },
    ],
  },
  {
    id: "download-toast",
    badge: "new",
    family: "compositions",
    section: "Downloads",
    file: "src/components/app/export/export-toast.tsx",
    test: "src/components/app/export/export-toast.test.tsx",
    title: "The download's toast",
    for: "the one toast a download, updated in place through every state the walk passes: a question, a cancel, a dropped connection, a line lost mid-stream, saved",
    lede: "The real toast on the product's own toaster, fired and not drawn: each button hands `exportToasts` the view the download's walk builds for that state, and the toast appears at the top of the page, under the header, replacing the last by its one id as a walk does. Its x, a question's answers and Try again walk the fixture where they lead in production; nothing is minted, fetched or posted. The words are the walk's own (`lib/export/walk.ts`).",
    specimens: [
      {
        label: "Every state, one toast",
        hint: "press a state and look up: the cancel question, Download cancelled., a dropped connection, a line lost mid-stream, saved, and the rest of the nine tones",
        node: <DownloadToastDemo />,
      },
    ],
  },
];
