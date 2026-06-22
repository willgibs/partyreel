"use client";

import { CheckCheck, ChevronRight } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { useReviewTakeover } from "@/components/review/review-takeover-provider";
import { Button } from "@/components/ui/button";

// The REVIEWS tab content: the pending-approval queue (the host event page renders this tab only when
// moderation is on - moderation_mode === 'hold_for_approval'). Bare (no card / heading - the tab label
// carries the name + the amber count). It's the TRIGGER surface for the full-screen review takeover,
// which lives in ReviewTakeoverProvider (a sibling of the tabs, so it survives tab switches); the actual
// approve/hide happen in that takeover. Empty (moderation on, nothing pending) = a reassuring "all
// caught up" teaser (mirrors ReelPanel's empty-state shape).
export function ReviewsPanel({ items }: { items: GridMedia[] }) {
  const review = useReviewTakeover();

  if (items.length === 0) {
    return (
      <div
        data-arrive
        className="flex flex-col items-center gap-3 py-10 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CheckCheck className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">You&rsquo;re all caught up</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            New uploads land here for your review before they appear in the
            gallery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-warning">
          {items.length} {items.length === 1 ? "photo" : "photos"} waiting for
          your review
        </p>
        <Button type="button" size="sm" onClick={() => review?.openReview()}>
          Review all
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {/* A preview grid; tapping any tile opens the takeover (the dense triage tool). MediaTile is the
          shared plain <img>/<video> poster (never next/image - its optimizer 400s on presigned R2). */}
      <div className="grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => review?.openReview()}
            aria-label="Open review"
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MediaTile item={it} />
          </button>
        ))}
      </div>
    </div>
  );
}
