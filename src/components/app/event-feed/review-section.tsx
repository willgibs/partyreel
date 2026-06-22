"use client";

import { Check, Eye, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedSectionEmpty } from "./feed-section-empty";
import { FeedSectionHeader } from "./feed-section-header";
import { ReviewActions } from "./review-actions";
import { ReviewGrid } from "./review-grid";
import { type ReviewTriage } from "./use-review-triage";

// The inline Review section — the always-present replacement for the gated Reviews tab + its pop-up takeover.
// Every state leads with the shared `FeedSectionHeader` (so it reads + toggles consistently with Gallery /
// Reel — same band, same top, no bounce), then a body:
//   pending        → the amber header (label + count + the Select/Approve-all action slot) + the triage grid;
//   beat           → the all-caught-up success pop ([data-unlock-success]), un-carded;
//   caught-up      → the shared centered empty body (sorted last);
//   moderation-off → the shared centered teaser body + a one-tap "Turn on review" (sorted last).
// caught-up + moderation-off dropped their bordered cards for the centered, card-less `FeedSectionEmpty` —
// Will's preferred "Reel" treatment (2026-06-22).
export function ReviewSection({
  triage,
  onEnableModeration,
  enabling,
}: {
  triage: ReviewTriage;
  onEnableModeration: () => void;
  enabling: boolean;
}) {
  const { visualState, beatKind, pending, selected, exiting, selectMode, toggle } =
    triage;

  if (visualState === "moderation-off") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" />
        <FeedSectionEmpty
          icon={ShieldCheck}
          title="Review uploads before they appear"
          desc="Turn on review and new uploads wait here for your approval instead of showing live."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={enabling}
              onClick={onEnableModeration}
            >
              <Eye /> Turn on review
            </Button>
          }
        />
      </section>
    );
  }

  if (visualState === "beat") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" amber />
        <div
          data-unlock-success
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <span
            className={`flex size-14 items-center justify-center rounded-full ${
              beatKind === "approve"
                ? "bg-success text-success-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <Check className="size-7" />
          </span>
          <p className="font-heading text-lg">All caught up</p>
        </div>
      </section>
    );
  }

  if (visualState === "caught-up") {
    return (
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader label="Review" />
        <FeedSectionEmpty
          icon={Check}
          title="You're all caught up"
          desc="New uploads land here for review."
        />
      </section>
    );
  }

  // visualState === "pending"
  return (
    <section aria-label="Review" className="space-y-2.5">
      <FeedSectionHeader
        label="Review"
        count={pending.length}
        amber
        action={!selectMode ? <ReviewActions triage={triage} /> : undefined}
      />
      <ReviewGrid
        items={pending}
        selectMode={selectMode}
        selected={selected}
        exiting={exiting}
        onToggle={toggle}
      />
    </section>
  );
}
