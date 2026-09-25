"use client";

import { Clapperboard, Play } from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";

import { CUT_ITEM, GALLERY_ITEMS, PENDING_ITEMS, stillOf } from "./fixtures";
import { AppBar } from "./parts-hub";

/**
 * THE ALBUM GRID AND THE REVIEW ROOM, FOR `cut` AND `review`. `MasonryColumns`
 * and `FeedSectionHeader` are the real, pure components host-curation's own
 * board reuses the same way; the grids are wrapped `pointer-events-none` so a
 * reviewer's click never opens the real lightbox inside a static preview.
 */

/** `cut=marked` / `cut=plain`: the album with a host's own finished cut in
 *  it, landed approved. `mark` alone varies; the pool, the layout and every
 *  other tile are identical between the two options.
 *
 * ★ THE CUT LEADS THE GRID: buried ninth of nine, its small badge reads as
 * "the same picture" against the plain option. Masonry fills its shortest
 * column first, so the leading item lands in the most prominent slot a
 * reviewer's eye actually meets. */
export function AlbumWithCut({ mark }: { mark: boolean }) {
  const items = [CUT_ITEM, ...GALLERY_ITEMS.slice(0, 8)];
  return (
    <div className="px-6 py-4" data-rh-relevant>
      <FeedSectionHeader label="Album" count={items.length} />
      <div className="pointer-events-none mt-2.5" data-rh-album>
        <MasonryColumns
          items={items}
          clampAspect
          viewerIsHost
          renderOverlay={(item) =>
            item.id === "cut-1" && mark ? (
              <span
                data-rh-cut-chip
                className="absolute top-2 left-2 z-10 flex h-6 items-center gap-1 rounded-full bg-reel px-2.5 text-xs font-semibold text-white shadow-layer ring-2 ring-white/80"
              >
                <Clapperboard className="size-3" aria-hidden />
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
 *  to the lab page's own document from inside a frame). */
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
        className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-[var(--radius-float)] border border-border bg-popover p-5 text-popover-foreground shadow-layer"
      >
        <div className="space-y-1.5">
          <h2 className="font-heading text-card-title font-medium">
            Add this cut to the album?
          </h2>
          <p className="text-sm text-muted-foreground">
            It lands approved, right away. This uses about 8 MB of your storage,
            the same as any video you upload yourself.
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

/**
 * `review=header`: the Review room on the host's phone, its real header and
 * the one line that connects the queue to the reel. A plain two-column grid
 * rather than the masonry: this is drawn inside the review composite's phone
 * box, where the masonry's `sm:` box would read the composite's width.
 */
export function PhoneReviewRoom() {
  return (
    <div
      data-rh-review-room=""
      className="min-h-full bg-background text-foreground"
    >
      <AppBar device="phone" bell={PENDING_ITEMS.length} />
      <section aria-label="Review" className="space-y-2.5 px-4 py-5">
        <FeedSectionHeader label="Review" count={PENDING_ITEMS.length} amber />
        <p
          data-rh-said=""
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Clapperboard className="size-3.5 shrink-0" aria-hidden />
          Approved photos join the highlight reel right away.
        </p>
        <div className="grid grid-cols-2 gap-1 pt-1">
          {PENDING_ITEMS.map((m) => (
            <span key={m.id} className="relative block">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
              <img
                src={stillOf(m)}
                alt=""
                className="aspect-square w-full rounded-[var(--radius-tile)] object-cover"
              />
              {m.type === "video" ? (
                <Play
                  className="absolute top-2 right-2 size-4 fill-white text-white drop-shadow"
                  aria-hidden
                />
              ) : null}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
