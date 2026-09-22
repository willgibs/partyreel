"use client";

import { Clapperboard } from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";

import { CUT_ITEM, GALLERY_ITEMS, PENDING_ITEMS } from "./fixtures";

/**
 * THE ALBUM GRID AND THE REVIEW ROOM, FOR `cut` AND `review`. `MasonryColumns`
 * and `FeedSectionHeader` are the real, pure components host-curation's own
 * board already reuses the same way (never a quoted copy, since either
 * changing would drift a quote); the grids they draw are wrapped
 * `pointer-events-none` so a reviewer's click never opens the real lightbox
 * inside a static preview.
 */

/** `cut=marked` / `cut=plain`: the album with a host's own finished cut in
 *  it, landed approved. `mark` alone varies; the pool, the layout and every
 *  other tile are identical between the two options. */
export function AlbumWithCut({ mark }: { mark: boolean }) {
  const items = [...GALLERY_ITEMS.slice(0, 8), CUT_ITEM];
  return (
    <div className="px-6 py-4" data-rh-relevant>
      <FeedSectionHeader label="Gallery" count={items.length} />
      <div className="pointer-events-none mt-2.5" data-rh-album>
        <MasonryColumns
          items={items}
          clampAspect
          viewerIsHost
          renderOverlay={(item) =>
            item.id === "cut-1" && mark ? (
              <span
                data-rh-cut-chip
                className="absolute top-1.5 left-1.5 z-10 flex h-5 items-center gap-1 rounded-full bg-reel/90 px-2 text-[10px] font-semibold text-white"
              >
                <Clapperboard className="size-2.5" aria-hidden />
                Cut
              </span>
            ) : null
          }
        />
      </div>
    </div>
  );
}

/** `cut=confirm`: one small sheet before the upload fires, since the bytes
 *  are the host's own. Plain markup, already open (a real `Dialog` portals
 *  to the lab page's own document from inside a frame, the reason
 *  `event-settings-sheet.tsx`'s own "Discard changes?" is quoted here rather
 *  than opened for real). */
export function AddToAlbumConfirm() {
  // `fixed`, never `absolute` (scene.tsx's own SheetGround carries the full
  // reason): this board has no normal-flow content above the dialog, so an
  // `absolute` box anchors to a `min-h-full` ancestor with nothing to give it
  // real height inside the frame's own document, and collapses to nothing.
  return (
    <div className="min-h-full bg-background">
      <div className="fixed inset-0 bg-black/10" />
      <div
        data-rh-relevant
        className="fixed top-1/2 left-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-[var(--radius-float)] border border-border bg-popover p-5 text-popover-foreground shadow-layer"
      >
        <div className="space-y-1.5">
          <h2 className="font-heading text-card-title font-medium">
            Add this cut to the album?
          </h2>
          <p className="text-sm text-muted-foreground">
            It lands approved, right away. This uses about 8 MB of your
            storage, the same as any video you upload yourself.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" tabIndex={-1}>
            Cancel
          </Button>
          <Button size="sm" tabIndex={-1}>
            Add to the album
          </Button>
        </div>
      </div>
    </div>
  );
}

/** `review=roomsays` / `review=nothing`: the Review room, real header and
 *  grid, with or without the one sentence connecting it to the live reel. */
export function ReviewRoom({ withReelNote }: { withReelNote: boolean }) {
  return (
    <div className="px-6 py-4">
      <section aria-label="Review" className="space-y-2.5" data-rh-relevant>
        <FeedSectionHeader label="Review" count={PENDING_ITEMS.length} amber />
        {withReelNote && (
          <p
            data-rh-reel-note
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Clapperboard className="size-3.5 shrink-0 text-reel" aria-hidden />
            Approved items join the live reel right away.
          </p>
        )}
        <div className="pointer-events-none" data-rh-album>
          <MasonryColumns items={PENDING_ITEMS} clampAspect layout="uniform" />
        </div>
      </section>
    </div>
  );
}
