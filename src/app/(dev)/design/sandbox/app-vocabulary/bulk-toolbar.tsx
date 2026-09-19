"use client";

import { useEffect, useRef } from "react";
import {
  Check,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  Heart,
  Trash2,
  X,
} from "lucide-react";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import {
  GalleryBulkBar,
} from "@/components/app/event-feed/gallery-actions";
import { ReviewActions } from "@/components/app/event-feed/review-actions";
import type { ReviewTriage } from "@/components/app/event-feed/use-review-triage";
import {
  HostSelectionProvider,
  useHostSelection,
} from "@/components/app/host-selection-provider";
import { Button } from "@/components/ui/button";

import { GALLERY_ITEMS, HOST_EVENT, REVIEW_ITEMS } from "./fixtures";

/**
 * THE BULK TOOLBAR: labelled buttons on Review versus icon-only on the
 * Gallery, for the same shape of action. Both real components are drawn
 * unchanged (the labelling is hard-coded in each, so it cannot flip live);
 * what changes per option is a small illustrative row, built from the real
 * `Button`, showing what the OTHER bar would look like under the option's
 * rule — captioned as a sketch, never the shipped component.
 */

const REVIEW_TRIAGE: ReviewTriage = {
  pending: REVIEW_ITEMS.slice(0, 5),
  selected: new Set([REVIEW_ITEMS[0].id, REVIEW_ITEMS[1].id]),
  exiting: new Set(),
  beatKind: "approve",
  busy: false,
  selectMode: true,
  allSelected: false,
  reviewUrgent: true,
  visualState: "pending",
  toggle: () => {},
  selectAll: () => {},
  enterSelect: () => {},
  exitSelect: () => {},
  run: async () => {},
  approveAll: () => {},
};

/** Seeds the REAL HostSelectionProvider through its own public hook (never a
 *  hand-built context value) so `GalleryBulkBar` reads real, live state. */
function SeedSelection({ ids }: { ids: string[] }) {
  const selection = useHostSelection();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !selection || ids.length === 0) return;
    done.current = true;
    selection.enterSelect(ids[0]);
    for (const id of ids.slice(1)) selection.toggle(id);
  }, [selection, ids]);
  return null;
}

export function ReviewBarSample() {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-[10px] text-muted-foreground">
        The real ReviewActions, in select mode
      </p>
      <ReviewActions triage={REVIEW_TRIAGE} />
    </div>
  );
}

export function GalleryBarSample() {
  const items = GALLERY_ITEMS.slice(0, 6);
  const ids = items.map((m) => m.id);
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-[10px] text-muted-foreground">
        The real GalleryBulkBar, over the real host grid in select mode
      </p>
      <HostSelectionProvider>
        <SeedSelection ids={ids.slice(0, 2)} />
        <HostMediaGrid eventId={HOST_EVENT.id} items={items} selectable />
        <div className="mt-2 flex justify-end">
          <GalleryBulkBar />
        </div>
      </HostSelectionProvider>
    </div>
  );
}

/* ── the illustrative "if converged" rows: real Button, sketched layout ──── */

export function MockReviewIconOnly() {
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="mb-2 text-[10px] text-muted-foreground">
        Sketch: Review, icon-only
      </p>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <Button type="button" variant="ghost" size="sm">
          All
        </Button>
        <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
          2
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Hide"
          title="Hide"
        >
          <EyeOff className="text-warning" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Approve"
          title="Approve"
        >
          <Check />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel"
          title="Cancel"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}

export function MockGalleryLabelled({ id }: { id?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="mb-2 text-[10px] text-muted-foreground">
        Sketch: Gallery, labelled
      </p>
      <div id={id} className="flex w-fit items-center gap-1.5">
        <Button type="button" variant="ghost" size="sm">
          All
        </Button>
        <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
          2
        </span>
        <Button type="button" variant="ghost" size="sm">
          <Clapperboard className="text-reel" /> Reel
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <Heart className="text-like" /> Like
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <EyeOff className="text-warning" /> Hide
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <Download className="text-save" /> Download
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <Trash2 className="text-destructive" /> Delete
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <X /> Cancel
        </Button>
      </div>
    </div>
  );
}

export function MockGalleryHybrid() {
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="mb-2 text-[10px] text-muted-foreground">
        Sketch: Gallery, hybrid: Hide/Show worded, the rest icon-only
      </p>
      <div className="flex w-fit items-center gap-1.5">
        <Button type="button" variant="ghost" size="sm">
          All
        </Button>
        <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
          2
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Add to reel" title="Add to reel">
          <Clapperboard className="text-reel" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Like" title="Like">
          <Heart className="text-like" />
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <Eye className="text-warning" /> Show
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Download" title="Download">
          <Download className="text-save" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete" title="Delete">
          <Trash2 className="text-destructive" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" title="Cancel">
          <X />
        </Button>
      </div>
    </div>
  );
}

export const GALLERY_LABELLED_ID = "gallery-labelled-mock";

export type ToolbarOption = "label" | "icon" | "hybrid";

/**
 * The two REAL bars anchor every option (they cannot relabel themselves), and
 * one sketch shows what the option actually CHANGES: `label` words the
 * Gallery bar, `icon` bares the Review bar, `hybrid` words only Hide/Show on
 * the Gallery bar. Whichever is already correct today draws nothing extra.
 */
export function ToolbarShowcase({ option }: { option: ToolbarOption }) {
  return (
    <div className="min-h-full space-y-4 bg-background p-5 text-foreground">
      <ReviewBarSample />
      <GalleryBarSample />
      {option === "label" && <MockGalleryLabelled id={GALLERY_LABELLED_ID} />}
      {option === "icon" && <MockReviewIconOnly />}
      {option === "hybrid" && <MockGalleryHybrid />}
    </div>
  );
}
