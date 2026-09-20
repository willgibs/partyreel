"use client";

/**
 * The shared masonry primitive (Phase 5 S2a): CSS columns flow GridMedia tiles
 * at their NATURAL aspect ratios (3px gaps + 3px tile radius), lifted from the
 * guest masonry's proven math (guest-masonry.tsx) into ONE reusable grid the
 * host surfaces share. A near-drop-in replacement for MediaGrid (same items +
 * onDeleteItem + lightbox ownership) that lays tiles out as masonry instead of a
 * uniform square grid. The guest masonry stays its OWN component for now (a
 * pinned live surface); converging it onto this primitive is a recorded follow-up.
 *
 * - aspectRatio comes from the plumbed width/height (1:1 fallback for
 *   pre-measure rows) so the layout reserves space BEFORE images load (no CLS),
 *   and `break-inside-avoid` keeps a tile from splitting across columns.
 * - `clampAspect` bounds extreme ratios into a browseable band — the host
 *   MODERATION-ergonomics escape hatch (object-cover crops the overflow); OFF by
 *   default, so personal feeds keep true ratios.
 * - `stagger` is the per-tile entrance cascade (--tile-i, seed render only). OFF
 *   on host surfaces (a management tool gets no arrival theater); kept as a prop
 *   for the future guest convergence. The gentle [data-media-tile] mount fade
 *   (globals.css) still applies, synchronized (--tile-i defaults to 0).
 * - Videos wear the shared CORNER play badge (the ratified subtle marker).
 * - `renderOverlay` injects per-tile chrome (the host moderation control bar +
 *   status/like badges, the recovery-bin countdown + restore/purge) as a SIBLING
 *   of the open-lightbox button, painted on top (it's the LAST child). Its
 *   controls are real `<button>`s, so tapping one never opens the lightbox (no
 *   stopPropagation needed — same contract as the old square grids). `viewerIsHost`
 *   threads to the lightbox (host gets its own viewer affordances). The component
 *   is generic in the item type so a caller (the bin) can render overlay chrome
 *   off its own extra fields (e.g. BinMedia.countdownDays) without a cast.
 */
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Play } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { LikeButton } from "@/components/likes/like-button";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
// The tile aspect-ratio math lives in a pure module (node-unit tested + reusable
// by host grids without pulling this client component's lightbox graph in).
import { tileAspect, UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { useLongPress } from "@/lib/shared/use-long-press";

/**
 * THE ALBUM'S COLUMN RULE — the one place a gallery's columns are decided
 * (Will, 2026-09-19, `tile=240` + `width=full`: "About 240 px: 5, 6 and 8
 * columns... The size a phone's tile looks in the hand, seen from a laptop's
 * distance", and "This feels natural at every window size, so all you have to
 * do is adjust your browser window to adjust the gallery size, rather than us
 * constrain it at any point").
 *
 * ★ A WIDTH, NEVER A COUNT. Both galleries used to hard-code a column COUNT
 * (`columns-2` on the guest's, `columns-2 sm:columns-3` here), and a count is
 * exactly what makes a wider window mean BIGGER photographs. `column-width`
 * with `column-count: auto` (what Tailwind's `columns-<length>` compiles to)
 * asks the browser for as many columns of at least that width as the box holds,
 * so a tile keeps one size and the COLUMNS follow the window.
 *
 * ★ 220, FOR A TILE THAT MEASURES ABOUT 240. The declared width is a floor: the
 * columns share out whatever is left over, so a tile always lands above it. 220
 * was chosen on the board so the count comes out the same whether the gap is
 * 3px or family C's 4px and whether or not the window shows a classic 15px
 * scrollbar — 5 columns at 1280, 6 at 1512, 8 at 1920, each tile ~230-245px.
 *
 * ★ FROM `sm` UP ONLY. The phone keeps its two columns (settled on the board;
 * 220 at 375 would collapse the album to one). At 640 the count rule and the
 * width rule agree, so nothing jumps at the breakpoint — where today the host
 * grid jumps from 2 columns to 3.
 *
 * `--album-column` is the knob, not the number: Will's note on the same ruling
 * asked for an adjustable tile size "within/around our filter/sort/controls",
 * which is its own board (`gallery-controls`). When it lands, that control sets
 * this one property on an ancestor and every grid under it follows.
 */
export const GALLERY_COLUMNS =
  "columns-2 gap-[var(--gap-gallery)] sm:columns-[var(--album-column,220px)]";

/**
 * The same rule for the UNIFORM layout (the Reel and the Review queue, where a
 * fixed aspect makes drag order and selection legible). `auto-fill` is CSS
 * grid's spelling of the same idea, on the same floor, so a page whose Gallery
 * runs six across never puts its Review queue on four.
 */
export const GALLERY_UNIFORM_COLUMNS =
  "grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-[repeat(auto-fill,minmax(var(--album-column,220px),1fr))]";

/** The subtle corner play marker for video tiles (shared with the guest masonry). */
export function CornerPlayBadge() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm"
    >
      <Play className="ml-px size-2.5 fill-white text-white" />
    </span>
  );
}

export function MasonryColumns<T extends GridMedia>({
  items,
  onDeleteItem,
  stagger = false,
  clampAspect = false,
  viewerIsHost = false,
  renderOverlay,
  dimItem,
  shareUrl,
  onSetStatus,
  onRemove,
  onTileLongPress,
  layout = "masonry",
  arrivedIds,
  canDelete,
  prefix,
}: {
  items: T[];
  /** Surfaces the lightbox Delete (the personal Uploads feed); omitted = read-only. */
  onDeleteItem?: (id: string) => void;
  /**
   * THE SEAM (the Orchestrator, 2026-09-20, before the sixth batch's lanes were cut): three
   * additive props so the guest lane can pass what it knows from its own files while the glass
   * lane rebuilds this grid. `arrivedIds` marks tiles that just arrived (`data-arrived` on the
   * tile box; the glow is the guest lane's sheet, the growth the glass lane's layout); `canDelete`
   * gates `onDeleteItem` per item (a guest may remove their OWN photographs, never another's);
   * `prefix` renders before the first tile inside the columns box (the pending tiles' seat).
   */
  arrivedIds?: ReadonlySet<string>;
  canDelete?: (item: GridMedia) => boolean;
  prefix?: ReactNode;
  stagger?: boolean;
  clampAspect?: boolean;
  /** "masonry" = natural-ratio CSS columns (the Gallery "wow"). "uniform" = a fixed-aspect CSS grid
   *  (the Reel + Review, where uniformity makes drag-order / selection legible). Only the container
   *  class + the per-tile aspect change; the overlay / lightbox / dimItem paths are identical. */
  layout?: "masonry" | "uniform";
  /** Threads to the lightbox (host viewer affordances). Default false (guest/read-only). */
  viewerIsHost?: boolean;
  /** Tap-and-hold a tile to enter the gallery album bulk-select, seeded with that id. Omitted
   *  everywhere except the host gallery, so the guest / recovery grids get no long-press. */
  onTileLongPress?: (id: string) => void;
  /** Per-tile chrome on top of the lightbox button (moderation bar, bin controls). */
  renderOverlay?: (item: T) => ReactNode;
  /** Dims the MEDIA to 30% (the host's hidden-from-guests mark); the overlay chrome
   *  stays full-opacity so the host can still see + act on it. */
  dimItem?: (item: T) => boolean;
  /** Host lightbox only (3c.2): the event JOIN url for the viewer Share + the host
   *  moderation handlers (curate group). Omitted = no Share / no host moderation in
   *  the viewer (guest galleries + the recovery bin). */
  shareUrl?: string;
  onSetStatus?: (item: GridMedia, status: "approved" | "hidden") => void;
  onRemove?: (item: GridMedia) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Only the FIRST render staggers (later arrivals enter instantly). Captured
  // once via the useState initializer (no ref-in-render). Unused when stagger=false.
  const [seededIds] = useState(() => new Set(items.map((m) => m.id)));
  const uniform = layout === "uniform";
  // One long-press machine for the grid (a single press at a time). bind() is a no-op without
  // onTileLongPress, so non-host grids are unaffected.
  const longPress = useLongPress(onTileLongPress);

  return (
    <>
      <div
        className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {prefix}
        {items.map((item, i) => (
          <div
            key={item.id}
            data-media-tile
            data-arrived={arrivedIds?.has(item.id) ? "" : undefined}
            // The bright edge (globals.css, [data-lit]): this div owns the tile
            // radius and clips the photo, so the hook sits here and nowhere
            // above it. No value: a tile has no border for the light to land on.
            data-lit=""
            // Host tiles (stagger off) opt out of the arrival fade-rise (emil: no
            // entrance theater on host); guest convergence (stagger on) keeps it.
            data-static={stagger ? undefined : ""}
            style={
              {
                // Uniform = the one fixed aspect (object-cover crops); masonry = natural ratio.
                aspectRatio: uniform
                  ? UNIFORM_TILE_ASPECT
                  : tileAspect(item, clampAspect),
                borderRadius: "var(--radius-tile)",
                ...(stagger
                  ? { "--tile-i": seededIds.has(item.id) ? i : 0 }
                  : {}),
              } as CSSProperties
            }
            // Uniform: the CSS-grid gap spaces tiles (no per-tile margin / column break).
            className={
              uniform
                ? "group relative w-full overflow-hidden bg-black/10"
                : "group relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
            }
          >
            <button
              type="button"
              {...longPress.bind(item.id)}
              onClick={() => {
                // Suppress the click the browser synthesizes after a long-press (else the hold that
                // entered select mode would also open the lightbox).
                if (longPress.consumeClick()) return;
                setOpenIndex(i);
              }}
              aria-label={item.type === "photo" ? "View photo" : "Play video"}
              className={`size-full cursor-pointer transition-[transform,opacity] duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]${
                dimItem?.(item) ? "opacity-30" : ""
              }`}
            >
              <MediaTile item={item} playBadge="none" />
            </button>
            {item.type === "video" && <CornerPlayBadge />}
            {/* Guest desktop hover-reveal like (no-op without a LikesProvider). The HOST gets its
                Like inside the moderation action row (renderOverlay) instead, so suppress this one
                for the host - else two hearts stack at top-right (the translucent layers read as a
                darker "double-wrapped" chip). */}
            {!viewerIsHost && <LikeButton item={item} variant="tile" />}
            {/* Per-tile chrome LAST so it paints over the lightbox button; its own
                buttons capture the tap (the lightbox never opens behind them). */}
            {renderOverlay?.(item)}
          </div>
        ))}
      </div>

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        viewerIsHost={viewerIsHost}
        shareUrl={shareUrl}
        onSetStatus={onSetStatus}
        canDelete={canDelete}
        onDeleteCurrent={
          onDeleteItem
            ? (item) => {
                setOpenIndex(null);
                onDeleteItem(item.id);
              }
            : undefined
        }
        // Remove shrinks the set -> close the viewer first, then run (mirrors onDeleteCurrent).
        onRemove={
          onRemove
            ? (item) => {
                setOpenIndex(null);
                onRemove(item);
              }
            : undefined
        }
      />
    </>
  );
}
