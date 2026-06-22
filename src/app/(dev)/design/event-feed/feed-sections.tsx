"use client";

import { Check, Clapperboard, Eye, ShieldCheck } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GALLERY_TILES, REEL_TILES, REVIEW_TILES } from "./sample-feed";

export type SectionKey = "reviews" | "gallery" | "reel";
export type Filter = "all" | SectionKey;
export type ReviewsState = "pending" | "caught-up" | "moderation-off";

// The pill row (mirrors filter-chips.tsx): dark-fill active, bordered inactive,
// transform-only press. `condensed` shrinks it for the A3 sticky-condense variant;
// an amber badge marks the load-bearing Reviews count.
export function PillRow({
  pills,
  active,
  onSelect,
  condensed = false,
}: {
  pills: { value: Filter; label: string; count?: number; amber?: boolean }[];
  active: Filter;
  onSelect: (f: Filter) => void;
  condensed?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Filter the event"
      className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 py-0.5 [&::-webkit-scrollbar]:hidden"
    >
      {pills.map((pill) => {
        const isActive = active === pill.value;
        return (
          <button
            key={pill.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(pill.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full font-medium transition-[transform,height,padding,font-size] duration-200 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]",
              condensed ? "h-7 px-3 text-xs" : "h-8 px-3.5 text-sm",
              isActive
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {pill.label}
            {pill.count ? (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-background/20 text-background"
                    : pill.amber
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {pill.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function LabMasonry({ items }: { items: GridMedia[] }) {
  return (
    <div className="columns-2 gap-[var(--gap-gallery)] sm:columns-3">
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            aspectRatio: `${it.width} / ${it.height}`,
            borderRadius: "var(--radius-tile)",
          }}
          className="mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
        >
          <MediaTile item={it} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

function Eyebrow({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "amber";
}) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold tracking-wide uppercase",
        tone === "amber" ? "text-warning" : "text-muted-foreground",
      )}
    >
      {children}
    </h2>
  );
}

export function GallerySection() {
  return (
    <section aria-label="Gallery" className="space-y-2.5">
      <Eyebrow>Gallery ({GALLERY_TILES.length})</Eyebrow>
      <LabMasonry items={GALLERY_TILES} />
    </section>
  );
}

export function ReelSection() {
  return (
    <section aria-label="Reel" className="space-y-2.5">
      <Eyebrow>Reel ({REEL_TILES.length})</Eyebrow>
      <LabMasonry items={REEL_TILES} />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clapperboard className="size-3.5" /> Reel video generation is coming
        soon.
      </p>
    </section>
  );
}

// The Reviews section across its three states + the all-caught-up beat. In the real
// build this also holds the inline triage (select / bulk approve-hide); here it shows
// the grid (so the reorder has something to move) + the states the urgency-order keys on.
export function ReviewsSection({
  state,
  cleared,
  beatOn,
  onClear,
}: {
  state: ReviewsState;
  cleared: boolean;
  beatOn: boolean;
  onClear: () => void;
}) {
  // The all-caught-up beat plays wherever Reviews currently sits (it fires BEFORE the
  // reorder, while Reviews is still at the top), then the section settles to the slim
  // caught-up line + sinks to the bottom.
  if (beatOn) {
    return (
      <section
        aria-label="Reviews"
        className="rounded-xl border border-border bg-card p-5"
      >
        <Eyebrow>Reviews</Eyebrow>
        <div
          data-unlock-success
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-7" />
          </span>
          <p className="font-heading text-lg">All caught up</p>
        </div>
      </section>
    );
  }

  if (state === "moderation-off") {
    return (
      <section
        aria-label="Reviews"
        className="rounded-xl border border-dashed border-border bg-muted/20 p-5"
      >
        <Eyebrow>Reviews</Eyebrow>
        <div className="mt-2 flex items-center gap-4">
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
          <Button type="button" size="sm" variant="outline" className="ml-auto">
            <Eye /> Turn on review
          </Button>
        </div>
      </section>
    );
  }

  if (state === "caught-up" || cleared) {
    return (
      <section
        aria-label="Reviews"
        className="rounded-xl border border-border bg-card p-5"
      >
        <Eyebrow>Reviews</Eyebrow>
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

  // state === "pending"
  return (
    <section aria-label="Reviews" className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow tone="amber">Reviews · {REVIEW_TILES.length} waiting</Eyebrow>
        <Button type="button" size="sm" onClick={onClear}>
          <Check /> Approve all
        </Button>
      </div>
      <LabMasonry items={REVIEW_TILES} />
    </section>
  );
}
