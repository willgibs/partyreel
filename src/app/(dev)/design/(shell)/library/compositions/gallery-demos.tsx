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
    for: "Maya's hub wearing her album's cover, her numbers and link on it and the code on its white mat",
    lede: "One head on both sides of the code (`host=shared`): Maya sees her party as her guests do. The facts and the link under the title are today's (r2 redraws them); the code stands on its mat in the cover's corner, scannable from across a table, wearing its door on its corner. Once it has scrolled away the room cards' band carries its face and the code as a chip.",
    specimens: [
      {
        label: "Tonight",
        hint: "two people at her door, the lock's count on the code's corner",
        bleed: true,
        node: <HubCoverDemo />,
      },
      {
        label: "The week before",
        hint: "nothing in the album: the house light",
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
    lede: "The real ReportQueue over a Saturday night of reports and writes that answer after a round trip and change nothing, so a reviewer here can never touch anyone's report. Space or a press opens a report whole; Remove…'s note is optional, Hold for forensics' reason is required and its Take it down too starts on; Ask for proof opens its question. At phone width each report carries Take it down and Hold for forensics, one press each.",
    specimens: [
      {
        label: "The front, the sweep, and the closed log under them",
        hint: "View shows a covered photo · Space opens the report whole · at 375 the two acts",
        node: <AdminReportCardDemo />,
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
    lede: "The storage ring beside the dashboard's New event. Open it for the friendly capacity, the Event Pass expiry, the standby bytes and the billing buttons.",
    specimens: [
      {
        label: "Storage meter",
        hint: "ambient · popover",
        node: (
          <StorageMeter
            storageUsed={1_200_000_000}
            storageCap={5_000_000_000}
            storagePct={24}
            standbyBytes={0}
            overBudget={false}
            passExpiry={null}
            planName="Pro"
            hasBilling
            isEventPass={false}
          />
        ),
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
    for: "what is using space: every item a host stores, largest first, with All or one event, the bulk bar's Download and Remove with Undo, and the strip that finishes a smaller plan's switch",
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
    for: "the four code styles as a choice rather than four thumbnails: a container-query grid, each swatch as big as its cell through CSS rather than a re-render, every preview drawn on this event's real join URL. Controlled: the parent owns the value and the saving",
    test: "src/app/(app)/dashboard/new/create-flow.test.tsx",
    family: "compositions",
    section: "Share suite",
    title: "QrPresetPicker",
    // No variants axis for the same reason as the filter chips: the four style
    // keys live in src/lib/constants/qr-presets, not in this file.
    lede: "The style step of the create flow, and the styler inside the share sheet's designer: every preset previewed on this event's real join URL, controlled by the parent.",
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
];
