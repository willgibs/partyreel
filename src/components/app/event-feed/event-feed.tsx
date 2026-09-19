"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { type GridMedia } from "@/components/app/media-grid";
import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import {
  EVENT_SECTIONS,
  SECTION_LABEL,
  orderedSections,
  type EventFilter,
  type EventSection,
} from "@/lib/event/sections";
import { useActiveSection } from "@/lib/shared/use-active-section";
import { useFlip } from "@/lib/shared/use-flip";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";

import { EventFeedActionBar } from "./event-feed-action-bar";
import { EventFilterPills, type FeedPill } from "./event-filter-pills";
import { FeedSectionHeader } from "./feed-section-header";
import { GallerySelectButton } from "./gallery-actions";
import { ReviewSection } from "./review-section";
import { useReviewTriage } from "./use-review-triage";

function mergeRefs<T>(
  ...refs: Array<((el: T | null) => void) | undefined>
): (el: T | null) => void {
  return (el) => {
    for (const r of refs) r?.(el);
  };
}

/**
 * The single-feed client boundary for the host event page — the DashboardFeed analog. The RSC page
 * resolves every section's data + presigns server-side and hands the Gallery + Reel sections down
 * as opaque pre-rendered SLOTS; this owns the filter + the urgency order + the review triage and
 * decides what shows. "All" stacks the three sections in urgency order (Review leads while a queue
 * waits, sinks last when caught up / moderation off); a pill narrows to one. Built to MIRROR
 * dashboard-feed.tsx's hydration-safe shape (client island fed by RSC props, URL synced via
 * replaceState, NO radix Tooltip on SSR'd tiles), the documented host-page subtree-bail discipline.
 *
 * The motion (ratified in the /design/event-feed lab): A=Condense pills (the sticky bar shrinks on
 * scroll), B=Fade filter swap (re-key → [data-section-swap]), C=FLIP reorder (useFlip slides the
 * sections when the urgency order flips). The contextual floating action bar (the headline) follows
 * the active section via the scroll-spy.
 */
export function EventFeed({
  eventId,
  moderationOn,
  initialSection,
  pendingItems,
  gallerySection,
  reelSection,
  guestsSection,
  guestsCountInList,
  galleryCount,
  reelCount,
  guestsCount,
}: {
  eventId: string;
  moderationOn: boolean;
  initialSection: EventFilter;
  /** The pending-review queue as data (the inline triage is interactive, unlike the opaque slots). */
  pendingItems: GridMedia[];
  gallerySection: React.ReactNode;
  reelSection: React.ReactNode;
  /** The profiles-social.md named guest list (or its turn-it-on teaser when the host key is off). */
  guestsSection: React.ReactNode;
  galleryCount: number;
  reelCount: number;
  /** Named signed-in uploaders; 0 also while show_guest_list is off (no pill badge on a teaser). */
  guestsCount: number;
  /** The guest list draws its own count above the threshold (the faces row), so
   *  the section header drops its pill and the number renders once. The filter
   *  pill above keeps it: that row counts every section, not this one. */
  guestsCountInList?: boolean;
}) {
  const [filter, setFilter] = useState<EventFilter>(initialSection);
  const [enabling, setEnabling] = useState(false);

  const triage = useReviewTriage({
    eventId,
    items: pendingItems,
    moderationOn,
  });
  // The Gallery album bulk-select state (shared with the floating bar + the gallery grid). Null is fine
  // (a safe no-op) — though the provider always wraps this page.
  const selection = useHostSelection();

  // The live urgency order, recomputed from the optimistic review state: a clear flips the order →
  // the FLIP relocates the sections; the scroll-spy + pills follow the same order.
  const order = orderedSections({
    moderationOn,
    hasPending: triage.reviewUrgent,
  });
  const flipRegister = useFlip(order.join());
  const { activeSection, registerSection } =
    useActiveSection<EventSection>(order);

  // Top sentinel: once it scrolls out of view the pills condense AND the floating bar appears
  // (one sentinel for both, like the command strip's floating-Add gate).
  const { sentinelRef, inView } = useInViewSentinel<HTMLDivElement>();

  // Stable per-section wrapper ref (flip + scroll-spy merged); both sources are stable, so this is
  // computed once — no per-render ref churn that would thrash the IntersectionObserver.
  const sectionRefs = useMemo(() => {
    const m = new Map<EventSection, (el: HTMLDivElement | null) => void>();
    for (const k of EVENT_SECTIONS) {
      m.set(k, mergeRefs(flipRegister(k), registerSection(k)));
    }
    return m;
  }, [flipRegister, registerSection]);

  function select(next: EventFilter) {
    setFilter(next);
    // URL sync WITHOUT navigation: refresh-safe + deep-linkable, no server roundtrip. replaceState
    // (not push) so Back leaves the event page rather than walking every pill the host tapped.
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("section");
    else url.searchParams.set("section", next);
    url.searchParams.delete("eventTab"); // the client owns the param now; drop the legacy alias
    window.history.replaceState(null, "", url);
  }

  async function enableModeration() {
    if (enabling) return;
    setEnabling(true);
    const res = await updateEventAction(eventId, {
      moderation_mode: "hold_for_approval",
    });
    if (!res.ok) {
      toast.error(res.message || "Couldn't turn on review. Please try again.");
    } else {
      toast.success("Review is on. New uploads wait here for approval.");
    }
    setEnabling(false);
  }

  // Pills follow the urgency order (Review leads when a queue waits). The review count is LIVE +
  // amber (it drives the urgency); Gallery/Reel counts are the server snapshot (refine on reload).
  const reviewCount = triage.pending.length;
  const pillFor = (k: EventSection): FeedPill =>
    k === "review"
      ? {
          value: "review",
          label: SECTION_LABEL.review,
          count: reviewCount || undefined,
          amber: true,
        }
      : k === "gallery"
        ? {
            value: "gallery",
            label: SECTION_LABEL.gallery,
            count: galleryCount || undefined,
          }
        : k === "reel"
          ? {
              value: "reel",
              label: SECTION_LABEL.reel,
              count: reelCount || undefined,
            }
          : {
              value: "guests",
              label: SECTION_LABEL.guests,
              count: guestsCount || undefined,
            };
  const pills: FeedPill[] = [
    { value: "all", label: "All" },
    ...order.map(pillFor),
  ];

  // Gallery + Reel are opaque RSC slots, so the feed wraps them in a <section> led by the shared header
  // (the counts live here, not in the slots). Review owns its own header (4 states + the action slot).
  const nodeFor = (k: EventSection): React.ReactNode =>
    k === "review" ? (
      <ReviewSection
        triage={triage}
        onEnableModeration={enableModeration}
        enabling={enabling}
      />
    ) : k === "gallery" ? (
      <section aria-label="Gallery" className="space-y-2.5">
        <FeedSectionHeader
          label={SECTION_LABEL.gallery}
          count={galleryCount || undefined}
          // The header "Download all" + "Select" affordances (browse face); the bulk cluster (incl. its
          // own Download) lives in the floating bar once selecting. Hidden when already selecting or the
          // album is empty. Both ≤ h-7 (size="sm"), per the header's no-bounce rule.
          action={
            selection && !selection.selectMode && galleryCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <GalleryDownloadAllButton eventId={eventId} />
                <GallerySelectButton />
              </div>
            ) : undefined
          }
        />
        {gallerySection}
      </section>
    ) : k === "reel" ? (
      <section aria-label="Reel" className="space-y-2.5">
        {/* Label + count ONLY. Reorder used to live in this header; host-app.md moved it to the Studio's
            filmstrip dock (reordering beside a live player is the dock's whole point, and the feed's
            reel section is a visual surface now). `reelCount` stays: the filter pill reads it. The
            header is layout-safe with or without an action (min-h-7 sits on the ROW). */}
        <FeedSectionHeader
          label={SECTION_LABEL.reel}
          count={reelCount || undefined}
        />
        {reelSection}
      </section>
    ) : (
      <section aria-label="Guests" className="space-y-2.5">
        <FeedSectionHeader
          label={SECTION_LABEL.guests}
          count={guestsCountInList ? undefined : guestsCount || undefined}
        />
        {guestsSection}
      </section>
    );

  // The section the floating bar reflects: the scroll-spy in "All", else the pinned filter.
  const barActive: EventSection | null =
    filter === "all" ? activeSection : (filter as EventSection);
  // Reveal the bar once scrolled past the top, or whenever EITHER select mode (review triage or the
  // gallery album bulk-select) needs its bulk controls in reach.
  const showBar =
    !inView || triage.selectMode || (selection?.selectMode ?? false);

  return (
    <div className="space-y-6">
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <EventFilterPills
        pills={pills}
        active={filter}
        onSelect={select}
        stuck={!inView}
      />

      {/* B=Fade: re-key on the filter so the swap entrance ([data-section-swap]) re-fires. Within
          "all" the key is stable, so an order change reorders the children → the FLIP, not a fade. */}
      <div key={filter} data-section-swap className="space-y-8">
        {filter === "all"
          ? order.map((k) => (
              <div key={k} ref={sectionRefs.get(k)}>
                {nodeFor(k)}
              </div>
            ))
          : nodeFor(filter as EventSection)}
      </div>

      <EventFeedActionBar
        eventId={eventId}
        show={showBar}
        active={barActive}
        triage={triage}
      />
    </div>
  );
}
