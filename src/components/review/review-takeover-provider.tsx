"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { HostReview } from "@/components/app/host-review";
import { type GridMedia } from "@/components/app/media-grid";

// Shares the review-takeover open-state across the event-page tabs, and OWNS the mount point of the
// full-screen review takeover (HostReview). The takeover is rendered HERE - a sibling of the tabs,
// always mounted - so it survives tab switches: the S4 invariant that its close-exit + all-caught-up
// beat must outlive the revalidate that empties pendingItems (a TabsContent unmounts on switch, which
// would tear that lifecycle down). The Reviews tab content opens it via useReviewTakeover(). Mirrors
// ReelProvider's shape (a thin client context wrapping the tabs region).

type ReviewTakeoverValue = {
  openReview: () => void;
};

const ReviewTakeoverContext = createContext<ReviewTakeoverValue | null>(null);

// Returns null when no provider wraps the surface, so ReviewsPanel's trigger is a safe no-op.
export function useReviewTakeover(): ReviewTakeoverValue | null {
  return useContext(ReviewTakeoverContext);
}

export function ReviewTakeoverProvider({
  eventId,
  pendingItems,
  children,
}: {
  eventId: string;
  pendingItems: GridMedia[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openReview = useCallback(() => setOpen(true), []);

  return (
    <ReviewTakeoverContext.Provider value={{ openReview }}>
      {children}
      {/* Always mounted, OUTSIDE any TabsContent, so switching tabs never tears down the Dialog's
          close-exit / all-caught-up beat. Teaser-less - the Reviews tab IS the trigger surface. */}
      <HostReview
        eventId={eventId}
        items={pendingItems}
        open={open}
        onOpenChange={setOpen}
        showTeaser={false}
      />
    </ReviewTakeoverContext.Provider>
  );
}
