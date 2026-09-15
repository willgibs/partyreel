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
  FilterChipsDemo,
  QrPresetPickerDemo,
  ReviewSectionDemo,
} from "./composition-demos";

/**
 * THE PRODUCT COMPOSITIONS, declared (the gallery round, 2026-09-12).
 *
 * Every specimen here is a REAL product component imported from production and
 * rendered from the shared sample props (no DB, no R2), so this family is the
 * live app UI rather than a drawing of it.
 *
 * WHAT IS DIFFERENT ABOUT THIS FAMILY, and it shapes every entry below: these
 * files live under src/components/app, which scripts/design-rules/collect.mjs
 * does not index, so the artifact holds NO record for any of them. The fields an
 * entry elsewhere inherits have to be stated by hand here. Each one declares its
 * own `file` (gallery.test.ts checks the path exists) and its own `title` (there
 * is no exported-name list to fall back on), and its `lede` is the only
 * description it will ever get, because COMPONENT_NOTES is keyed by the files
 * the collector indexes. The old page carried those descriptions as section
 * blurbs; a gallery section is a heading only, so they moved onto the entries.
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
  {
    id: "event-card",
    family: "compositions",
    section: "Event card",
    file: "src/components/app/event-card.tsx",
    title: "EventCard",
    lede: "The dashboard's atomic unit (the ratified stat-forward V3), in each of its states.",
    variants: [
      {
        prop: "variant",
        source: "prop",
        fallback: "hosted",
        options: ["hosted", "saved", "trash"],
        note: "What the chrome carries: hosted takes the QR slot and the amber review chip, saved a bookmark glyph and a byline, trash the dim and the countdown. No sample row, because the four specimens below already show all three.",
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
        label: "Saved",
        hint: "byline + status",
        node: (
          <EventCard
            variant="saved"
            href="#"
            name="Priya &amp; Sam"
            coverUrl={SAMPLE.cover2}
            dateLabel="May 30"
            byline="Hosted by Priya"
            statusLabel="Password"
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
    lede: "The ambient header bar. Open it for the friendly capacity, the Event Pass expiry, the standby bytes and the billing buttons.",
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
    id: "filter-chips",
    family: "compositions",
    section: "Dashboard chrome",
    file: "src/components/app/dashboard/filter-chips.tsx",
    title: "FilterChips",
    // No variants axis: the chips come from FILTER_CHIPS in
    // src/lib/dashboard/filters, so their values are not literals in this
    // component's source and an axis here could not be checked against it.
    lede: "The single feed's filter bar: a controlled segmented control rather than radix Tabs, because All shows three sections at once.",
    specimens: [
      {
        label: "Filter chips",
        hint: "dashboard · controlled",
        node: <FilterChipsDemo />,
      },
    ],
  },

  {
    id: "event-card-qr",
    family: "compositions",
    section: "Share suite",
    file: "src/components/app/event-card-qr.tsx",
    title: "EventCardQr",
    lede: "The card's top-left chip. It is a sibling of the card link, so tapping it opens the share dialog (the styled QR, copy link, customize) and never navigates.",
    specimens: [
      {
        label: "Share chip",
        hint: "tap to open the dialog",
        node: (
          <div className="flex items-center gap-3">
            {qrSlot}
            <span className="text-sm text-muted-foreground">
              Opens the share dialog
            </span>
          </div>
        ),
      },
    ],
  },
  {
    id: "qr-preset-picker",
    family: "compositions",
    section: "Share suite",
    file: "src/components/app/qr-preset-picker.tsx",
    title: "QrPresetPicker",
    // No variants axis for the same reason as the filter chips: the four style
    // keys live in src/lib/constants/qr-presets, not in this file.
    lede: "The styler inside that dialog: every preset previewed on this event's real join URL, controlled by the parent.",
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
    family: "compositions",
    section: "Moderation gallery",
    file: "src/components/app/host-media-grid.tsx",
    title: "HostMediaGrid",
    lede: "The host's moderation grid on the shared masonry (S3·3a): status-aware approve / hide / unhide / remove plus the host like-count, each control riding any tile ratio. Visual only here, since the actions point at a sample id.",
    // The grid's other axis, `selectable`, is left undeclared: bulk select needs
    // HostSelectionProvider (useHostSelection returns null without it), so an
    // option row here would advertise a mode the lab cannot actually enter. It
    // belongs with the deferred provider-bound set at the top of this file.
    variants: [
      {
        prop: "layout",
        source: "prop",
        fallback: "masonry",
        options: ["masonry", "uniform"],
        note: "The gallery keeps the natural-ratio masonry; the reel grid asks for uniform, a fixed-aspect grid. No sample row: either option is a whole grid, and the specimen below is the shipped one.",
      },
    ],
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
    lede: "The pending review, now inline in the event feed (the pop-up takeover is retired): the dense triage grid and its select mode, Select or Approve all, then the bulk bar. A reliable auth-free hydration probe for the review island; the bulk actions themselves need auth, so they no-op here.",
    specimens: [
      {
        label: "Review section",
        hint: "inline triage · Select / Approve all",
        node: <ReviewSectionDemo />,
      },
    ],
  },
];
