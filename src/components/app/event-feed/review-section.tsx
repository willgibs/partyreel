"use client";

import { Check, Eye, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReviewActions } from "./review-actions";
import { ReviewGrid } from "./review-grid";
import { type ReviewTriage } from "./use-review-triage";

// The eyebrow that labels every stacked section (Review / Gallery / Reel). Amber tone is the
// load-bearing "needs action" signal on a live review queue, distinct from the neutral labels.
function Eyebrow({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "amber";
}) {
  return (
    <h2
      className={`text-[11px] font-semibold tracking-wide uppercase ${
        tone === "amber" ? "text-warning" : "text-muted-foreground"
      }`}
    >
      {children}
    </h2>
  );
}

// The inline Review section — the always-present replacement for the gated Reviews tab + its
// pop-up takeover. Four states (driven by useReviewTriage.visualState), each always visible so the
// urgency reorder has a stable element to relocate:
//   pending        → the amber eyebrow + the triage grid; browse-mode actions inline (Select /
//                    Approve all). In select mode the inline actions defer to the floating bar (it
//                    is forced visible then), so the bulk controls aren't duplicated.
//   beat           → the all-caught-up success pop ([data-unlock-success]); rides out before the
//                    section relocates to the bottom.
//   caught-up      → a slim reassuring line (sorted last).
//   moderation-off → a one-tap "turn on review" discovery teaser (sorted last).
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
      <section
        aria-label="Review"
        className="rounded-xl border border-dashed border-border bg-muted/20 p-5"
      >
        <Eyebrow>Review</Eyebrow>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Review uploads before they appear
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Turn on review and new uploads wait here for your approval instead
              of showing live.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="sm:ml-auto"
            disabled={enabling}
            onClick={onEnableModeration}
          >
            <Eye /> Turn on review
          </Button>
        </div>
      </section>
    );
  }

  if (visualState === "beat") {
    return (
      <section
        aria-label="Review"
        className="rounded-xl border border-border bg-card p-5"
      >
        <Eyebrow>Review</Eyebrow>
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
      <section
        aria-label="Review"
        className="rounded-xl border border-border bg-card p-5"
      >
        <Eyebrow>Review</Eyebrow>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Check className="size-4" />
          </span>
          <p className="text-sm text-muted-foreground">
            You&rsquo;re all caught up. New uploads land here for review.
          </p>
        </div>
      </section>
    );
  }

  // visualState === "pending"
  return (
    <section aria-label="Review" className="space-y-2.5">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <Eyebrow tone="amber">Review · {pending.length} waiting</Eyebrow>
        {/* Browse-mode entry points inline; in select mode the forced-visible floating bar owns
            the bulk controls, so they're never doubled. */}
        {!selectMode && <ReviewActions triage={triage} />}
      </div>
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
