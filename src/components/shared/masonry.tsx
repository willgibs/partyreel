"use client";

/**
 * THE ONE ALBUM TILE, AND THE ONE GRID THAT LAYS IT OUT (the `glass` board's
 * wiring, 2026-09-20; `app-vocabulary`'s `tile-grammar` call taken with it).
 *
 * Every album grid in the product is this component now: the guest album
 * (`GuestMasonry` is a thin wrapper over it), the host's moderation gallery, the
 * recovery bin and the two personal feeds. The admin's `ModerationTile` stays
 * its own thing on purpose — a report is not an album.
 *
 * ★ A TILE SHOWS STATE, NOT CONTROLS (Will, `tiles`, 2026-09-20, his own
 * alternative to the board's options): "Having icons visible on every image card
 * on mobile is going to get way too crowded and overwhelming immediately. Aside
 * from an active like icon..., a video play icon..., or a like count..., let's
 * handle all actions and controls (like, download, etc) in the lightbox
 * controls." So a tile carries exactly THREE MARKS and nothing else: an active
 * like, a play mark, a subtle count. On a phone that is the whole tile.
 *
 * ★ AND THE DESK KEEPS ITS HOVER ROW, BECAUSE THE RULE WAS A MOBILE RULE (his
 * `bulk-toolbar` note, 2026-09-20: "every action on a photograph lives in the
 * lightbox" was a MOBILE rule and the desk keeps hover controls on cards). The
 * set is a PER-SURFACE prop (`tileActions`) rather than a flag per verb: guest =
 * like + download, host = like + download + hide/show, the bin = restore +
 * delete forever, the personal feeds = none.
 *
 * ★ THE ROW IS ONE PANE, NOT THREE DISCS (`row=bar`, Will 2026-09-20: "This
 * feels much cleaner and more cohesive"). One `.glass` bar holds every glyph, so
 * the row is ONE blurred region rather than three, and the `[data-reveal-chip]`
 * collapse now runs on the BAR: one width opening instead of three chips
 * sliding. A glyph inside it carries no surface of its own.
 *
 * ★ EXPLICIT COLUMNS, NOT CSS `columns`. The album used to be a `columns-*` box,
 * and a browser re-flows EVERY column of one of those when an item is inserted:
 * a photograph landing live shoved the whole album about, which is the opposite
 * of `live=land` ("a new photograph grows into its column... the album re-flows
 * around it, nothing else moves"). Items are distributed to real column
 * elements, OLDEST FIRST into the shortest column, so the assignment of every
 * existing tile is untouched when a newer one is prepended — the arrival grows
 * one column and the others hold still. It is also what makes the stagger
 * honest, since a tile's position no longer depends on the browser's balancing.
 *
 * ★ THE PRE-MEASURE RENDER IS TODAY'S BOX, ON PURPOSE. The column COUNT needs
 * the container's width, which the server does not have, so the first paint is
 * the CSS-columns box this file has always shipped and the measured layout takes
 * over in a layout effect. Same rule, same count, same gap: the swap is a
 * re-balance, never a jump in height.
 */
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { TileLikeMark } from "@/components/likes/like-button";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
// The tile aspect-ratio math lives in a pure module (node-unit tested + reusable
// by host grids without pulling this client component's lightbox graph in).
import { tileAspect, UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { useLongPress } from "@/lib/shared/use-long-press";
import { cn } from "@/lib/utils";

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
 * width rule agree, so nothing jumps at the breakpoint.
 *
 * `--album-column` is the knob, not the number: Will's note on the same ruling
 * asked for an adjustable tile size "within/around our filter/sort/controls",
 * which is its own board (`gallery-controls`). When it lands, that control sets
 * this one property on an ancestor and every grid under it follows.
 *
 * ★ IT IS STILL A CLASS STRING because the lab, the marketing album stage and
 * the guest skeleton lay their OWN boxes out with it, and because it is this
 * grid's own pre-measure paint. `columnsFor` below reads the same two custom
 * properties, so there is still exactly one rule.
 */
export const GALLERY_COLUMNS =
  "columns-2 gap-[var(--gap-gallery)] sm:columns-[var(--album-column,220px)]";

/**
 * The same rule for the UNIFORM layout (the Reel and the Review queue, where a
 * fixed aspect makes drag order and selection legible). `auto-fill` is CSS
 * grid's spelling of the same idea, on the same floor, so a page whose Gallery
 * runs six across never puts its Review queue on four. A uniform grid has
 * nothing to balance, so its layout stays CSS's job.
 */
export const GALLERY_UNIFORM_COLUMNS =
  "grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-[repeat(auto-fill,minmax(var(--album-column,220px),1fr))]";

/** The phone's two columns, and the floor the count rule shares out from. */
const PHONE_COLUMNS = 2;
const PHONE_MAX = 640;
const COLUMN_FLOOR = 220;

/**
 * The subtle corner play marker for video tiles (one of Will's three permitted
 * marks). In the one material at the mark's blur: the tint, the edges and the
 * backdrop are Crystal's, the 42px is not, because a tile carries one of these
 * on every video of an album and a phone pays for each of them.
 */
export function CornerPlayBadge() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-full",
        GLASS_MARK,
      )}
    >
      <Play
        className={cn("ml-px size-2.5 fill-white text-white", GLASS_MARK_LIT)}
      />
    </span>
  );
}

/**
 * ONE ACTION IN A SURFACE'S HOVER ROW. Declared rather than rendered by the
 * caller, so the row stays ONE pane whoever fills it: a caller handing us JSX
 * would bring its own chip back, which is the shape `row=bar` retired.
 */
export type TileAction = {
  id: string;
  /** The native tooltip and the accessible name (tiles use `title`, not radix). */
  label: string;
  icon: LucideIcon;
  /** The hue on direct hover (emil: monochrome at rest, colour on hover/state). */
  tone?: "save" | "warning" | "destructive" | "success" | "like";
  /** A state the glyph KEEPS off-hover (the liked heart, the hidden marker's amber eye). */
  active?: boolean;
  /** A link action (Save the original) — rendered as an `<a download>`. */
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

/**
 * THE FOURTH MARK: THIS ONE IS YOURS (`theirs=mark`, Will 2026-09-20). A guest
 * can already remove any photograph they uploaded, for ever (`yours`, wired);
 * what no surface said was WHICH of 68 tiles are theirs, so the answer rides
 * the tile rather than a new control above the album — his own note on the
 * option he did not take: "rather than just adding more and more configs here".
 *
 * ★ IT TAKES THE TOP-LEFT CORNER, AND THAT IS THE ONLY CORNER FREE AT EVERY
 * WIDTH. The play mark and the like mark own the two bottom corners, and the
 * desk's hover row owns the top right (`row=bar`, one pane). The board drew
 * this mark top-right on a PHONE, where there is no hover row at all; on a
 * laptop that corner is the bar's, so the mark moves to the corner nobody else
 * claims rather than living under a pane that opens over it. (A guest's own
 * just-landed check shares this corner for about two seconds after an upload
 * and paints over it, which is the right order: the news wins, then the mark.)
 *
 * ★ THE GLYPH CARRIES ITS OWN LIGHT, like every other mark on a photograph:
 * `GLASS_MARK` is the material at the marks' cheaper blur and `GLASS_MARK_LIT`
 * is the dark halo that keeps a white glyph legible over a bright sky, which no
 * pane can do for it (`lib/glass.ts`).
 */
function MineMark({
  onSelect,
  selected,
}: {
  onSelect?: () => void;
  selected?: boolean;
}) {
  const body = (
    <span
      aria-hidden
      className={cn("size-1.5 rounded-full bg-white", GLASS_MARK_LIT)}
    />
  );
  const box = cn(
    "absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full",
    GLASS_MARK,
  );
  // No handler = a marker, not a control: a surface that cannot filter must not
  // hand a screen reader a button that does nothing.
  if (!onSelect)
    return (
      <span
        data-tile-mark="mine"
        aria-hidden
        className={cn("pointer-events-none", box)}
      >
        {body}
      </span>
    );
  const label = selected
    ? "Showing only your photos. Show the whole album."
    : "Yours. Show only your photos.";
  return (
    <button
      type="button"
      data-tile-mark="mine"
      aria-label={label}
      aria-pressed={selected ?? false}
      title={label}
      onClick={(e) => {
        // The tile underneath opens the lightbox; this one does not.
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        box,
        "cursor-pointer transition-transform duration-150 ease-emphasis outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
      )}
    >
      {body}
    </button>
  );
}

/**
 * ONE COLOUR LANGUAGE FOR EVERY SURFACE'S ROW (Will, 2026-06-20: the action SET
 * differs by role, the colour language does not). Monochrome at rest, the hue on
 * direct hover, and the hue KEPT with a soft fill when the verb is a state you
 * are already in.
 */
const TONE: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "hover:text-save",
  warning: "hover:text-warning",
  destructive: "hover:text-destructive",
  success: "hover:text-success",
  like: "hover:text-like",
};
const TONE_ACTIVE: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "text-save",
  warning: "text-warning",
  destructive: "text-destructive",
  success: "text-success",
  like: "text-like",
};
const TONE_FILL: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "fill-save/25",
  warning: "fill-warning/25",
  destructive: "fill-destructive/25",
  success: "fill-success/25",
  like: "fill-like/25",
};

/**
 * THE DESK'S ROW, AS ONE PANE. `data-reveal-chip` rides the BAR rather than each
 * glyph (globals.css owns the collapse), so the whole row opens to one width on
 * tile hover instead of three chips sliding independently; `--reveal-max` is
 * sized from the count so a two-verb surface does not reserve a five-verb row.
 * Hidden below `md` by construction: a phone tile shows marks and nothing else.
 */
function TileActionBar({ actions }: { actions: readonly TileAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div
      data-reveal-chip
      data-tile-actions
      style={
        { "--reveal-max": `${actions.length * 1.75 + 0.5}rem` } as CSSProperties
      }
      className={cn(
        "absolute top-1.5 right-1.5 z-10 hidden items-center gap-0.5 rounded-full p-0.5 md:flex",
        GLASS,
      )}
    >
      {actions.map((a) => {
        const Icon = a.icon;
        const glyph = (
          <Icon
            className={cn(
              "size-4",
              GLASS_MARK_LIT,
              a.active && a.tone && TONE_FILL[a.tone],
            )}
          />
        );
        const className = cn(
          "flex size-6 cursor-pointer items-center justify-center rounded-full text-white outline-none",
          "transition-[color,transform] duration-150 ease-emphasis",
          "focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
          a.tone && (a.active ? TONE_ACTIVE[a.tone] : TONE[a.tone]),
          a.disabled && "pointer-events-none opacity-50",
        );
        // A link action saves the original; everything else is a button. Both
        // stop the click so the lightbox never opens behind a control.
        return a.href ? (
          <a
            key={a.id}
            href={a.href}
            download
            aria-label={a.label}
            title={a.label}
            onClick={(e) => e.stopPropagation()}
            className={className}
          >
            {glyph}
          </a>
        ) : (
          <button
            key={a.id}
            type="button"
            aria-label={a.label}
            title={a.label}
            disabled={a.disabled}
            onClick={(e) => {
              e.stopPropagation();
              a.onSelect?.();
            }}
            className={className}
          >
            {glyph}
          </button>
        );
      })}
    </div>
  );
}

/**
 * THE COLUMN COUNT, FROM THE ONE RULE. Read off the box itself so the
 * `--album-column` knob and the `--gap-gallery` token stay the single sources: a
 * second copy of "220" in JS is exactly the drift `GALLERY_COLUMNS` exists to
 * prevent.
 */
function columnsFor(el: HTMLElement): number {
  const width = el.clientWidth;
  // ★ A ZERO WIDTH IS "I DON'T KNOW", NOT "A PHONE". A `display:none` ancestor,
  // a collapsed tab and jsdom all measure 0, and answering 2 there would collapse
  // an album the moment it is hidden. 0 keeps the pre-measure box, which is a
  // correct layout at every width.
  if (width <= 0) return 0;
  if (width < PHONE_MAX) return PHONE_COLUMNS;
  const style = getComputedStyle(el);
  const floor =
    parseFloat(style.getPropertyValue("--album-column")) || COLUMN_FLOOR;
  const gap = parseFloat(style.getPropertyValue("--gap-gallery")) || 0;
  return Math.max(PHONE_COLUMNS, Math.floor((width + gap) / (floor + gap)));
}

/**
 * ★ OLDEST FIRST, INTO THE SHORTEST COLUMN, AND THAT IS WHAT MAKES AN ARRIVAL
 * LOCAL. Items arrive newest-first, so walking them backwards means a newly
 * prepended photograph is the LAST one placed: every tile already on screen
 * keeps the column it had, and the new one joins whichever column is shortest
 * and appears at its head. Prepending to a `columns-*` box re-flowed all of
 * them. Pure — no ref, no memo, no mutation across renders — so strict mode's
 * double render and a poll's reconcile give the same answer.
 */
export function distributeColumns<T extends GridMedia>(
  items: T[],
  cols: number,
  clampAspect: boolean,
): T[][] {
  const out: T[][] = Array.from({ length: cols }, () => []);
  const heights = new Array<number>(cols).fill(0);
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    let shortest = 0;
    for (let c = 1; c < cols; c++)
      if (heights[c] < heights[shortest]) shortest = c;
    out[shortest].push(item);
    // A column's height in tile-widths: h / w per tile. The gap is a constant
    // per tile and drops out of the comparison; this only has to RANK, the real
    // pixels are the browser's.
    const [w, h] = String(tileAspect(item, clampAspect))
      .split("/")
      .map((n) => parseFloat(n));
    heights[shortest] += h > 0 && w > 0 ? h / w : 1;
  }
  // Newest at the head of its own column (the array was filled oldest-first).
  for (const col of out) col.reverse();
  return out;
}

export function MasonryColumns<T extends GridMedia>({
  items,
  onDeleteItem,
  stagger = false,
  clampAspect = false,
  viewerIsHost = false,
  renderOverlay,
  tileActions,
  hideLikeMark = false,
  dimItem,
  shareUrl,
  onSetStatus,
  onRemove,
  onTileLongPress,
  layout = "masonry",
  arrivedIds,
  canDelete,
  prefix,
  mineIds,
  onSelectMine,
  mineSelected,
}: {
  items: T[];
  /** Surfaces the lightbox Delete (the personal Uploads feed); omitted = read-only. */
  onDeleteItem?: (id: string) => void;
  /**
   * THE SEAM (the Orchestrator, 2026-09-20, before the sixth batch's lanes were cut): three
   * additive props so the guest lane can pass what it knows from its own files while the glass
   * lane rebuilds this grid. `arrivedIds` marks tiles that just arrived (`data-arrived` on the
   * tile box; the glow is the guest lane's sheet, the growth is the column assignment above);
   * `canDelete` gates `onDeleteItem` per item (a guest may remove their OWN photographs, never
   * another's); `prefix` renders before the first tile (the pending tiles' seat).
   */
  arrivedIds?: ReadonlySet<string>;
  canDelete?: (item: GridMedia) => boolean;
  prefix?: ReactNode;
  /**
   * THIS VIEWER'S OWN PHOTOGRAPHS (`theirs=mark`, Will 2026-09-20): the tiles
   * that wear the fourth mark, and `data-mine` on the tile box so a surface can
   * style or count them without re-deriving the set. Omitted everywhere except
   * a guest album — a host looking at their own event would be marking all of
   * it, which says nothing.
   */
  mineIds?: ReadonlySet<string>;
  /** The mark's tap. Omitted = a marker with no control in it. */
  onSelectMine?: () => void;
  /** The Yours filter is already on: the mark carries the state and clears it. */
  mineSelected?: boolean;
  stagger?: boolean;
  clampAspect?: boolean;
  /** "masonry" = explicit, height-balanced columns (the Gallery "wow"). "uniform" = a fixed-aspect
   *  CSS grid (the Reel + Review, where uniformity makes drag-order / selection legible). Only the
   *  container and the per-tile aspect change; the marks / lightbox / dimItem paths are identical. */
  layout?: "masonry" | "uniform";
  /** Threads to the lightbox (host viewer affordances). Default false (guest/read-only). */
  viewerIsHost?: boolean;
  /** Tap-and-hold a tile to enter the gallery album bulk-select, seeded with that id. Omitted
   *  everywhere except the host gallery, so the guest / recovery grids get no long-press. */
  onTileLongPress?: (id: string) => void;
  /**
   * THE DESK'S HOVER SET FOR THIS SURFACE, and the whole of it. Omitted = a tile with marks and
   * nothing else, which is what a phone gets everywhere and what the profile feeds get at any
   * width. Never rendered below `md`.
   */
  tileActions?: (item: T) => readonly TileAction[];
  /** The Likes feed: every tile in it is liked, so the mark would be wallpaper. */
  hideLikeMark?: boolean;
  /** Per-tile chrome painted over everything (the bin's countdown, the guest's landed check). */
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
  /**
   * ★ THE OPEN ITEM IS AN ID, NEVER A POSITION. `items` mutates under an open
   * lightbox (a doorbell prepends newly-approved media, an optimistic upload
   * prepends its own tile, a host removal drops one) and a stored index silently
   * starts pointing at a DIFFERENT photograph — the guest album has carried the
   * id since Phase 4 for exactly this reason, and the shared grid inherits it
   * now that it IS the guest album.
   */
  const [openId, setOpenId] = useState<string | null>(null);
  const openAt = openId ? items.findIndex((m) => m.id === openId) : -1;
  // -1 covers both "closed" and "the open item just vanished", which the
  // lightbox reads as closed.
  const openIndex = openAt >= 0 ? openAt : null;
  // Only the FIRST render staggers (later arrivals enter instantly). Captured
  // once via the useState initializer (no ref-in-render). Unused when stagger=false.
  const [seededIds] = useState(() => new Set(items.map((m) => m.id)));
  const uniform = layout === "uniform";
  // One long-press machine for the grid (a single press at a time). bind() is a no-op without
  // onTileLongPress, so non-host grids are unaffected.
  const longPress = useLongPress(onTileLongPress);

  // null until the box is measured: the first paint is the CSS-columns box (see
  // the head comment), so the server HTML and the hydrated tree hold the same
  // height and the swap is a re-balance rather than a jump.
  const [cols, setCols] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const measure = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    setCols((prev) => {
      const next = columnsFor(el);
      // An unmeasurable box keeps whatever it had (see columnsFor).
      if (next === 0) return prev;
      return prev === next ? prev : next;
    });
  }, []);
  useLayoutEffect(() => {
    if (uniform) return;
    measure();
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [uniform, measure]);

  const tileOf = (item: T, i: number) => (
    <div
      key={item.id}
      data-media-tile
      data-arrived={arrivedIds?.has(item.id) ? "" : undefined}
      data-mine={mineIds?.has(item.id) ? "" : undefined}
      // The bright edge (globals.css, [data-lit]): this div owns the tile
      // radius and clips the photo, so the hook sits here and nowhere
      // above it. No value: a tile has no border for the light to land on.
      data-lit=""
      // Host tiles (stagger off) opt out of the arrival fade-rise (emil: no
      // entrance theater on host); the guest album (stagger on) keeps it.
      data-static={stagger ? undefined : ""}
      style={
        {
          // Uniform = the one fixed aspect (object-cover crops); masonry = natural ratio.
          aspectRatio: uniform
            ? UNIFORM_TILE_ASPECT
            : tileAspect(item, clampAspect),
          borderRadius: "var(--radius-tile)",
          ...(stagger ? { "--tile-i": seededIds.has(item.id) ? i : 0 } : {}),
        } as CSSProperties
      }
      // Uniform: the CSS-grid gap spaces tiles. Masonry: the gap is the tile's own
      // bottom margin, because neither a `columns` box nor a column element has a row gap.
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
          setOpenId(item.id);
        }}
        aria-label={item.type === "photo" ? "View photo" : "Play video"}
        className={`size-full cursor-pointer transition-[transform,opacity] duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]${
          dimItem?.(item) ? "opacity-30" : ""
        }`}
      >
        <MediaTile item={item} playBadge="none" />
      </button>

      {/* THE MARKS — state, never controls, and the whole of a phone tile. The
          fourth ("yours") is the one exception his own ruling asked for: it is
          a mark that the guest album also makes tappable, because the filter it
          opens is the answer to "where are mine" at 68 photographs. */}
      {item.type === "video" && <CornerPlayBadge />}
      {!hideLikeMark && <TileLikeMark item={item} count={item.likeCount} />}
      {mineIds?.has(item.id) && (
        <MineMark onSelect={onSelectMine} selected={mineSelected} />
      )}

      {/* The desk's hover row, as one pane. A sibling of the open button, so a
          control's tap is captured by the control and never opens the lightbox. */}
      {tileActions && <TileActionBar actions={tileActions(item)} />}

      {/* Per-tile chrome LAST so it paints over everything; its own buttons
          capture the tap (the lightbox never opens behind them). */}
      {renderOverlay?.(item)}
    </div>
  );

  const columns =
    uniform || cols === null
      ? null
      : distributeColumns(items, cols, clampAspect);

  return (
    <>
      {columns ? (
        <div
          ref={boxRef}
          data-album-grid
          className="flex w-full items-start gap-[var(--gap-gallery)]"
          onPointerEnter={preloadMediaLightbox}
          onTouchStart={preloadMediaLightbox}
        >
          {columns.map((column, c) => (
            <div key={c} className="min-w-0 flex-1">
              {c === 0 && prefix}
              {column.map((item) => tileOf(item, items.indexOf(item)))}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={uniform ? undefined : boxRef}
          data-album-grid
          className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}
          onPointerEnter={preloadMediaLightbox}
          onTouchStart={preloadMediaLightbox}
        >
          {prefix}
          {items.map((item, i) => tileOf(item, i))}
        </div>
      )}

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        onClose={() => setOpenId(null)}
        // Swipe/arrow navigation still speaks in positions; translate straight
        // back to the id so the next mutation can't shift it either.
        onIndexChange={(i) => setOpenId(items[i]?.id ?? null)}
        viewerIsHost={viewerIsHost}
        shareUrl={shareUrl}
        onSetStatus={onSetStatus}
        canDelete={canDelete}
        onDeleteCurrent={
          onDeleteItem
            ? (item) => {
                setOpenId(null);
                onDeleteItem(item.id);
              }
            : undefined
        }
        // Remove shrinks the set -> close the viewer first, then run (mirrors onDeleteCurrent).
        onRemove={
          onRemove
            ? (item) => {
                setOpenId(null);
                onRemove(item);
              }
            : undefined
        }
      />
    </>
  );
}
