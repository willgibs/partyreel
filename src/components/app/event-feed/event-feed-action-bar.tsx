"use client";

import { Clapperboard, ImageUp } from "lucide-react";
import Link from "next/link";

import { useHostAdd } from "@/components/app/host-add-provider";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { useReelStage } from "@/components/reel/reel-stage-provider";
import { type EventSection } from "@/lib/event/sections";
import { GalleryBulkBar } from "./gallery-actions";
import { ReviewActions } from "./review-actions";
import { type ReviewTriage } from "./use-review-triage";

// The contextual floating action bar (the headline of the feed redesign). One fixed-bottom surface
// that generalizes the old floating Add: it appears once the feed scrolls past its top sentinel
// (or whenever review select mode is active) and MORPHS its action to the section the host is
// looking at, so the relevant control is always in reach across the whole scroll, never lost above
// or below a section:
//   Review (pending / selecting) → the Select / Approve all / bulk cluster (shared ReviewActions)
//   Gallery (browse)             → Add photos (opens the command strip's panel) + the uploading chip
//   Gallery (album select mode)  → the bulk cluster (Add to reel / Like / Hide-Show / Delete), GalleryBulkBar
//   Reel (no reel yet)           → a violet Create reel that fires the builder's create + reveal
//   Reel (reel exists)           → Open studio (the dedicated room, a route)
// A section with nothing to act on (review caught-up / moderation-off) yields no bar. The content
// crossfades on section change via [data-section-swap]; the bar itself fades + rises on appearance.
// Every slot wears shadow-layer: the bar floats over a feed that keeps scrolling behind it, which is
// the larger shadow's definition (globals.css). It was five hand-typed rgba shadows at two sizes.
export function EventFeedActionBar({
  eventId,
  show,
  active,
  triage,
}: {
  /** For the Reel slot's Studio link. */
  eventId: string;
  show: boolean;
  /** The section in view (scroll-spy in "All", or the pinned filter when narrowed). */
  active: EventSection | null;
  triage: ReviewTriage;
}) {
  const add = useHostAdd();
  const selection = useHostSelection();
  const stage = useReelStage();

  let content: React.ReactNode = null;
  if (active === "review") {
    // Only when there's something to act on (a live queue, or mid-selection).
    if (triage.visualState === "pending" || triage.selectMode) {
      content = (
        <div className="pointer-events-auto flex items-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-layer backdrop-blur">
          <ReviewActions triage={triage} />
        </div>
      );
    }
  } else if (active === "gallery") {
    content = selection?.selectMode ? (
      <div className="pointer-events-auto flex items-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-layer backdrop-blur">
        <GalleryBulkBar />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => add?.openAdd()}
        className="pointer-events-auto flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-layer transition-transform duration-200 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <ImageUp className="size-4" />
        Add photos
        {add && add.uploadingCount > 0 && (
          <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-micro tabular-nums">
            {add.uploadingCount} uploading
          </span>
        )}
      </button>
    );
  } else if (active === "reel") {
    // The "Soon" holding slot is gone: the reel is real. Pre-Create the bar fires
    // the BUILDER's own create (the reveal's FLIP measures the builder's tiles, and
    // the bar only shows while the Reel section is the active one, so those tiles
    // are on screen by construction). Post-Create it is the Studio door.
    content = stage?.created ? (
      <Link
        href={`/dashboard/${eventId}/reel`}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full border border-border bg-background/95 px-5 text-sm font-medium shadow-layer backdrop-blur transition-transform duration-200 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <Clapperboard className="size-4 text-reel" aria-hidden />
        Open studio
      </Link>
    ) : stage?.canCreate ? (
      <button
        type="button"
        onClick={() => stage.requestCreate()}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-reel px-5 text-sm font-medium text-white shadow-layer transition-transform duration-200 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <Clapperboard className="size-4" aria-hidden />
        Create reel
      </button>
    ) : // No create target yet (nothing curated, so the builder registered nothing):
    // no bar at all, matching how a caught-up Review section yields none. A
    // disabled pill would just be the old "Soon" in new clothes.
    null;
  }

  if (!show || !content) return null;

  return (
    <div
      data-feed-action-bar
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-[transform,opacity] duration-200 ease-emphasis motion-safe:starting:translate-y-2 motion-safe:starting:opacity-0"
    >
      {/* Re-key on the active section so the content crossfades (the same [data-section-swap]
          language as the pill swap) as the host scrolls from one section into the next. */}
      <div key={active ?? "none"} data-section-swap>
        {content}
      </div>
    </div>
  );
}
