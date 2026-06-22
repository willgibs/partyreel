"use client";

import { Clapperboard, ImageUp } from "lucide-react";

import { useHostAdd } from "@/components/app/host-add-provider";
import { useHostSelection } from "@/components/app/host-selection-provider";
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
//   Reel                         → a disabled Create reel (the future generation flow's holding slot)
// A section with nothing to act on (review caught-up / moderation-off) yields no bar. The content
// crossfades on section change via [data-section-swap]; the bar itself fades + rises on appearance.
export function EventFeedActionBar({
  show,
  active,
  triage,
}: {
  show: boolean;
  /** The section in view (scroll-spy in "All", or the pinned filter when narrowed). */
  active: EventSection | null;
  triage: ReviewTriage;
}) {
  const add = useHostAdd();
  const selection = useHostSelection();

  let content: React.ReactNode = null;
  if (active === "review") {
    // Only when there's something to act on (a live queue, or mid-selection).
    if (triage.visualState === "pending" || triage.selectMode) {
      content = (
        <div className="pointer-events-auto flex items-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur">
          <ReviewActions triage={triage} />
        </div>
      );
    }
  } else if (active === "gallery") {
    content = selection?.selectMode ? (
      <div className="pointer-events-auto flex items-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur">
        <GalleryBulkBar />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => add?.openAdd()}
        className="pointer-events-auto flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_6px_16px_rgba(0,0,0,0.18)] outline-none transition-transform duration-200 ease-emphasis active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:scale-100"
      >
        <ImageUp className="size-4" />
        Add photos
        {add && add.uploadingCount > 0 && (
          <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] tabular-nums">
            {add.uploadingCount} uploading
          </span>
        )}
      </button>
    );
  } else if (active === "reel") {
    content = (
      <span className="pointer-events-auto flex h-11 cursor-not-allowed items-center gap-2 rounded-full border border-border bg-muted/60 px-5 text-sm font-medium text-muted-foreground shadow-[0_4px_14px_rgba(0,0,0,0.1)] backdrop-blur">
        <Clapperboard className="size-4" />
        Create reel
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] tracking-wide uppercase">
          Soon
        </span>
      </span>
    );
  }

  if (!show || !content) return null;

  return (
    <div
      data-feed-action-bar
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] motion-safe:starting:translate-y-2 motion-safe:starting:opacity-0 transition-[transform,opacity] duration-200 ease-emphasis"
    >
      {/* Re-key on the active section so the content crossfades (the same [data-section-swap]
          language as the pill swap) as the host scrolls from one section into the next. */}
      <div key={active ?? "none"} data-section-swap>
        {content}
      </div>
    </div>
  );
}
