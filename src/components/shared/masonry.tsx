"use client";

/**
 * THE ONE GRID EVERY ALBUM IS LAID OUT BY (the `glass` board's wiring,
 * 2026-09-20; `app-vocabulary`'s `tile-grammar` call taken with it).
 *
 * Every album grid in the product is this component: the guest album
 * (`GuestMasonry` is a thin wrapper over it), the host's moderation gallery, the
 * recovery bin and the two personal feeds. The admin's `ModerationTile` stays
 * its own thing on purpose — a report is not an album. What a tile carries
 * (marks, and on the desk one declared set of verbs) is `album-tile.tsx`'s.
 *
 * ★ ONE CLICK AND ONE LONG-PRESS, ON THE GRID (the album-window lane). A tile
 * holds no handler: the open button, the hover verbs and the yours mark carry
 * `data-` attributes, and this grid answers them from one delegated click and
 * one long-press, reading the latest callbacks from a ref. So a render of the
 * grid hands every tile the same props it had, and the memoized tile skips it:
 * a like, a progress tick and a quiet poll re-render no tile at all.
 *
 * ★ EXPLICIT COLUMNS, NOT CSS `columns`. The album used to be a `columns-*` box,
 * and a browser re-flows EVERY column of one of those when an item is inserted:
 * a photograph landing live shoved the whole album about, which is the opposite
 * of `live=land` ("a new photograph grows into its column... the album re-flows
 * around it, nothing else moves"). Items are distributed to columns OLDEST FIRST
 * into the shortest one, so the assignment of every existing tile is untouched
 * when a newer one is prepended — the arrival grows one column and the others
 * hold still.
 *
 * ★ THE PRE-MEASURE RENDER IS TODAY'S BOX, AND THE MEASURED ONE IS THE SAME
 * BOX. The column COUNT needs the container's width, which the server does not
 * have, so the first paint is the CSS-columns box this file has always shipped.
 * The measured columns place each tile absolutely in that SAME box, in the same
 * DOM order, from `calc()`s on the box's own width (`placeColumns`): a tile
 * that changed parent would remount, and the columns used to be one wrapper
 * each, so the first measure remounted every tile (a second entrance, every
 * image decoded again), and so did every filter. Now the measure is a restyle.
 *
 * ★ AND `layout="rows"` IS THE JUSTIFIED ALBUM (`album-columns`: Will's
 * `layout=justified`), opt-in beside masonry, which stays the default until the
 * surfaces switch. Its engine is `lib/shared/album-rows.ts`; its box, windowed,
 * is `album-window.tsx`.
 */
// THE ARRIVAL GRAMMAR'S SHEET, on the ONE grid every album is made of: the glow
// an arriving tile takes (`data-arrived`, anyone's), the sweep a guest's own
// landing takes (`data-landed`) and the rows' push (`data-entering`). It used to
// be `guest/live-gallery.css`, where the host could not reach it, which is
// exactly what `landing=sweep` refused.
import "./arrival.css";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";

import type { GridMedia } from "@/components/app/media-grid";
import {
  AlbumTile,
  type AlbumTileProps,
  type TileAction,
} from "@/components/shared/album-tile";
import {
  AlbumRows,
  headSlots,
  type AlbumHandle,
  type RowRhythm,
  type RowTile,
} from "@/components/shared/album-window";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { readPhotoParam, withPhotoParam } from "@/lib/media/share-save";
import { tileAspect } from "@/lib/media/tile-aspect";
import type { RowAnchor, RowStep } from "@/lib/shared/album-rows";
import { useLongPress } from "@/lib/shared/use-long-press";
import { cn } from "@/lib/utils";

export {
  CornerPlayBadge,
  type TileAction,
} from "@/components/shared/album-tile";
export type { AlbumHandle } from "@/components/shared/album-window";

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
 * grid's own pre-measure paint. `columnsFor` below reads the same knob and the
 * gap this rule resolves to, so there is still exactly one rule.
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
 * THE PHOTOGRAPH'S OWN ADDRESS (media-viewer r1, the brief's `?photo=`).
 * Opening a photograph writes `?photo=<id>` beside the page's other params, so
 * a refresh comes back to it; the grid reads it once, on mount, and opens that
 * item. ★ ACCESS STAYS EXACTLY AS IT WAS: the address opens only an item
 * already in this viewer's payload (the server decided that list), so an
 * unknown, held or hidden id matches nothing and the album simply opens, with
 * no error and no sign the item exists. Behind a door the payload is the door's
 * (nothing at a password, the teaser at a gate), and the viewer waits for any
 * dialog already open (the door) to close before it opens over the album.
 *
 * ★ ONE GRID CLAIMS IT. A page can mount two grids (the profile's uploads and
 * likes; the host's album beside its bin), and a photograph in both must open
 * once. The claim is released when its grid unmounts, so the album a door
 * remounts at `full` can take it.
 */
let addressClaim: string | null = null;

/** Write the open photograph into the address (null clears it), history untouched. */
function writeAddress(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    const next = withPhotoParam(window.location.href, id);
    const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    // `null` state: Next's patched replaceState copies its own history state
    // in and tells the router, so useSearchParams sees the new address.
    if (next !== here) window.history.replaceState(null, "", next);
  } catch {
    // An address the browser will not rewrite leaves the viewer working.
  }
}

/** A dialog someone else opened (the album's door), which the address waits behind. */
function foreignDialogOpen() {
  return !!document.querySelector(
    "[role='dialog']:not([data-lightbox-content]), [role='alertdialog']",
  );
}

/** A tile's box by the id of the photograph in it. */
function tileFor(root: HTMLElement | null, id: string): HTMLElement | null {
  if (!root) return null;
  const safe = id.replace(/["\\]/g, "\\$&");
  return root.querySelector<HTMLElement>(
    `[data-media-tile][data-media-id="${safe}"]`,
  );
}

/** The photograph a click or a press landed on: its tile's id, for a target inside its open button. */
function openedTileId(target: EventTarget | null): string | null {
  const el = target as Element | null;
  if (!el?.closest?.("[data-tile-open]")) return null;
  return (
    el.closest<HTMLElement>("[data-media-tile][data-media-id]")?.dataset
      .mediaId ?? null
  );
}

/**
 * THE COLUMN COUNT, FROM THE ONE RULE. Read off the box itself so the
 * `--album-column` knob and the `--gap-gallery` token stay the single sources: a
 * second copy of "220" in JS is exactly the drift `GALLERY_COLUMNS` exists to
 * prevent. Exported for its contract, which pins the gap it reads.
 */
export function columnsFor(el: HTMLElement): number {
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
  // ★ THE GAP IS READ RESOLVED, OFF THE BOX'S OWN `column-gap`, NEVER OFF THE
  // TOKEN. `--gap-gallery` is `max(3px, var(--radius-tile))`, and a custom
  // property computes to its text, so reading it handed parseFloat
  // "max(3px, 4px)", which is NaN and was counted as no gap at all. The count
  // then ran one column past the CSS box wherever a window sat just over a
  // boundary (a 1490 window: six 238px columns under a 240 floor, where the
  // rule, the pre-measure paint and the skeleton all lay five), so the album
  // jumped a column as it hydrated. Both boxes this grid draws set
  // `gap: var(--gap-gallery)`, and a real length property computes to pixels.
  const gap = parseFloat(style.columnGap) || 0;
  return Math.max(PHONE_COLUMNS, Math.floor((width + gap) / (floor + gap)));
}

/**
 * A tile's height in widths (h / w), from the same aspect its box is drawn at,
 * in either of `tileAspect`'s spellings ("w / h", or one number for a clamped
 * ratio).
 *
 * ★ THE CLAMPED SPELLING USED TO READ AS A SQUARE. The balance parsed "w / h"
 * only, so a clamped host album's "1.5" split into one number, failed its own
 * guard and counted every tile as square: the host's columns were balanced on
 * the wrong shapes and ran uneven.
 */
function heightInWidths(aspect: string): number {
  const parts = aspect.split("/").map((n) => parseFloat(n));
  const ratio = parts.length === 2 ? parts[0] / parts[1] : parts[0];
  return Number.isFinite(ratio) && ratio > 0 ? 1 / ratio : 1;
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
  items: readonly T[],
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
    heights[shortest] += heightInWidths(tileAspect(item, clampAspect));
  }
  // Newest at the head of its own column (the array was filled oldest-first).
  for (const col of out) col.reverse();
  return out;
}

/** A number for a `calc()`: short, and never an exponent. */
const n6 = (x: number) => String(Math.round(x * 1e6) / 1e6);

/**
 * THE MEASURED COLUMNS, AS PLACES IN THE ONE BOX: each tile's absolute box, the
 * box's height, and the first tile of each column (the album's first row).
 *
 * ★ `calc()` ON THE BOX'S OWN WIDTH, SO A RESIZE RE-PLACES NOTHING. A column is
 * `--col-w` wide (the box's `100cqw` shared out), a tile's height is its width
 * times its shape, so a tile's top is the shapes above it in `--col-w`s plus
 * their gaps: the browser recomputes every place as the box resizes, and this
 * runs again only when the COUNT changes. The first column starts under the
 * head (`--head-h`, the in-flight tiles, measured).
 */
export function placeColumns<T extends GridMedia>(
  items: readonly T[],
  cols: number,
  clampAspect: boolean,
): { box: Map<string, CSSProperties>; height: string; first: Set<string> } {
  const box = new Map<string, CSSProperties>();
  const first = new Set<string>();
  const heights: string[] = [];
  distributeColumns(items, cols, clampAspect).forEach((column, c) => {
    const head = c === 0 ? " + var(--head-h, 0px)" : "";
    let above = 0;
    column.forEach((item, k) => {
      if (k === 0) first.add(item.id);
      const aspect = tileAspect(item, clampAspect);
      box.set(item.id, {
        position: "absolute",
        left: `calc(${c} * (var(--col-w) + var(--gap-gallery)))`,
        top: `calc(${n6(above)} * var(--col-w) + ${k} * var(--gap-gallery)${head})`,
        width: "var(--col-w)",
        aspectRatio: aspect,
      });
      above += heightInWidths(aspect);
    });
    heights.push(
      `calc(${n6(above)} * var(--col-w) + ${column.length} * var(--gap-gallery)${head})`,
    );
  });
  return {
    box,
    height: heights.length === 1 ? heights[0] : `max(${heights.join(", ")})`,
    first,
  };
}

/**
 * THE SAME LIST, KEPT: an array whose items are the same objects in the same
 * order as the last render's answers the last array. A surface that copies its
 * list every render (the guest album's filter always does) then hands every memo
 * below an unchanged list, so a progress tick recomputes no layout.
 */
function useSameList<T>(items: readonly T[]): readonly T[] {
  const [kept, setKept] = useState(items);
  let same = kept.length === items.length;
  for (let i = 0; same && i < items.length; i++)
    if (kept[i] !== items[i]) same = false;
  if (same) return kept;
  setKept(items);
  return items;
}

/** The selection a surface's select mode hands the grid: every tile becomes a toggle. */
export type TileSelection = {
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Tiles on their way out (the removal beat, `[data-exiting]`). */
  exiting?: ReadonlySet<string>;
};

export function MasonryColumns<T extends GridMedia>(props: {
  items: T[];
  /** Surfaces the lightbox Delete (the personal Uploads feed); omitted = read-only. */
  onDeleteItem?: (id: string) => void;
  /**
   * THE SEAM (the Orchestrator, 2026-09-20, before the sixth batch's lanes were cut): three
   * additive props so the guest lane can pass what it knows from its own files while the glass
   * lane rebuilds this grid. `canDelete` gates `onDeleteItem` per item (a guest may remove their
   * OWN photographs, never another's); `prefix` renders before the first tile (the in-flight
   * tiles' seat).
   *
   * ★ THE ARRIVAL GRAMMAR IS TWO SETS AND ONE SHEET (`landing=sweep`, Will 2026-09-21:
   * "This should be consistent across guest and host arrival experiences"). `arrivedIds` are the
   * tiles that appeared by themselves and take the glow; `landedIds` are the ones THIS device
   * just sent and take the sweep, and it is never more than one (lib/shared/arrival.ts decides
   * both, and holds each id for exactly as long as its keyframe runs). A surface that passes
   * neither draws neither.
   */
  arrivedIds?: ReadonlySet<string>;
  landedIds?: ReadonlySet<string>;
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
   *  CSS grid (the Reel + Review, where uniformity makes drag-order / selection legible). "rows" =
   *  the justified album, windowed (`AlbumRows`, opt-in until each surface switches). Only the box
   *  and the per-tile box change; the marks / lightbox / dimItem paths are identical. */
  layout?: "masonry" | "uniform" | "rows";
  /** Rows only: the density step, photographs per row (`lib/shared/album-rows.ts`). */
  rowStep?: RowStep;
  /**
   * Rows only: a pinch, a trackpad pinch or ctrl and the wheel over the album
   * asks for the next step here (`density-control.tsx`). Omitted = no gesture.
   */
  onRowStepChange?: (step: RowStep) => void;
  /** Rows only: the fixed end, "end" (the default) for a newest-first album. */
  rowAnchor?: RowAnchor;
  /** Rows only: plain rows (the default) or a feature row now and then. */
  rowRhythm?: RowRhythm;
  /** Rows only: the visit's seed for the rhythm's picks, held for the visit. */
  rhythmSeed?: number;
  /** Rows only: the photographs the window mounts, whenever that changes (links and likes load per window). */
  onWindowChange?: (ids: readonly string[]) => void;
  /** The album's handle (`scrollToId`, for a deep link). */
  albumRef?: Ref<AlbumHandle>;
  /** Threads to the lightbox (host viewer affordances). Default false (guest/read-only). */
  viewerIsHost?: boolean;
  /** Tap-and-hold a tile to enter the gallery album bulk-select, seeded with that id. Omitted
   *  everywhere except the host gallery, so the guest / recovery grids get no long-press. */
  onTileLongPress?: (id: string) => void;
  /**
   * SELECT MODE ON THE ONE GRID: every tile a toggle wearing the selection's
   * marks, so a host's select mode can run on the album it is looking at
   * instead of swapping to another grid and remounting every tile.
   */
  selection?: TileSelection;
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
  /**
   * The open photograph rides the page's address as `?photo=<id>` (on by default; see
   * `writeAddress`). Off for a grid that is not the page's subject.
   */
  photoAddress?: boolean;
}) {
  const {
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
    rowStep,
    onRowStepChange,
    rowAnchor,
    rowRhythm,
    rhythmSeed,
    onWindowChange,
    albumRef,
    selection,
    arrivedIds,
    landedIds,
    canDelete,
    prefix,
    mineIds,
    onSelectMine,
    mineSelected,
    photoAddress = true,
  } = props;
  const items = useSameList(props.items) as T[];

  /**
   * ★ THE OPEN ITEM IS AN ID, NEVER A POSITION. `items` mutates under an open
   * lightbox (a doorbell prepends newly-approved media, an optimistic upload
   * prepends its own tile, a host removal drops one) and a stored index silently
   * starts pointing at a DIFFERENT photograph — the guest album has carried the
   * id since Phase 4 for exactly this reason, and the shared grid inherits it
   * now that it IS the guest album.
   */
  const [openId, setOpenId] = useState<string | null>(null);
  // Where the open photograph grew from (`opening=grow`): the tile's rect at
  // the tap. None when it opened from the address (its tile may be far down
  // the page), so it fades in, and still drops back into its tile.
  const [origin, setOrigin] = useState<ViewerOrigin | undefined>(undefined);
  const openAt = openId ? items.findIndex((m) => m.id === openId) : -1;
  // -1 covers both "closed" and "the open item just vanished", which the
  // lightbox reads as closed.
  const openIndex = openAt >= 0 ? openAt : null;
  // Only the FIRST render staggers (later arrivals enter instantly). Captured
  // once via the useState initializer (no ref-in-render). Unused when stagger=false.
  // ★ THE SEED INDEX, NOT TODAY'S: a tile's `--tile-i` is its place in the seed
  // render and stays that, because an arrival that shifted every index rewrote
  // an inline custom property on every tile and restyled the whole album for a
  // delay that only ever mattered at mount.
  const [seedIndex] = useState(
    () => new Map(items.map((m, i) => [m.id, i] as const)),
  );
  const uniform = layout === "uniform";
  const rows = layout === "rows";

  // The latest props, for the one click and the one long-press (read at the
  // moment of the tap, never during render).
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });
  const longPress = useLongPress(onTileLongPress, { resolve: openedTileId });

  // null until the box is measured: the first paint is the CSS-columns box (see
  // the head comment), so the server HTML and the hydrated tree hold the same
  // height and the swap is a re-balance rather than a jump.
  const [cols, setCols] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // The grid's root in every layout.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const handle = useRef<AlbumHandle | null>(null);
  useImperativeHandle(albumRef, () => ({
    scrollToId: (id) =>
      handle.current?.scrollToId(id) ?? tileFor(rootRef.current, id),
  }));

  /**
   * The tile of the photograph showing at close, brought on screen if the
   * viewer walked it out of view, so the photograph drops into ITS tile. In a
   * windowed album the tile may not be mounted at all: the window scrolls to it
   * and mounts it first.
   */
  const returnTo = useCallback((item: GridMedia) => {
    if (handle.current) return handle.current.scrollToId(item.id);
    const tile = tileFor(rootRef.current, item.id);
    if (!tile) return null;
    const r = tile.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight)
      tile.scrollIntoView({ block: "center" });
    return tile;
  }, []);

  const openItem = (id: string, tile: Element | null) => {
    setOpenId(id);
    setOrigin(
      tile
        ? { kind: "tile", rect: tile.getBoundingClientRect(), returnTo }
        : undefined,
    );
    if (photoAddress) writeAddress(id);
  };

  const closeItem = () => {
    setOpenId(null);
    if (photoAddress) writeAddress(null);
  };

  // The address, read once on mount (see `writeAddress`). Async on purpose: a
  // frame lets the page settle and a door open first, and a door that is
  // open is waited out.
  const claimId = useId();
  useEffect(() => {
    if (!photoAddress) return;
    const id = readPhotoParam(window.location.search);
    if (!id) return;
    let observer: MutationObserver | null = null;
    let raf = 0;
    const tryOpen = () => {
      if (addressClaim && addressClaim !== claimId) return;
      if (!latest.current.items.some((m) => m.id === id)) return;
      if (foreignDialogOpen()) {
        if (!observer && typeof MutationObserver !== "undefined") {
          observer = new MutationObserver(() => {
            if (!foreignDialogOpen()) {
              observer?.disconnect();
              observer = null;
              tryOpen();
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["role", "data-state"],
          });
        }
        return;
      }
      addressClaim = claimId;
      setOpenId(id);
      // It did not grow from anywhere on screen (its tile may be far down the
      // page), so it fades in; it still drops back into its tile.
      setOrigin({ kind: "tile", rect: null, returnTo });
    };
    raf = requestAnimationFrame(tryOpen);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      if (addressClaim === claimId) addressClaim = null;
    };
  }, [photoAddress, claimId, returnTo]);

  // The open photograph vanished under the viewer (removed, filtered away):
  // the address stops naming it.
  useEffect(() => {
    if (photoAddress && openId && openAt < 0) writeAddress(null);
  }, [photoAddress, openId, openAt]);

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
    // The rows measure their own box (`AlbumRows`).
    if (uniform || rows) return;
    measure();
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [uniform, rows, measure]);

  // THE HEAD'S HEIGHT, for the measured columns: the first column starts under
  // it. Measured before paint on every render (a new upload tile appears in the
  // same commit that needs the room) and watched for what loads inside it.
  const headRef = useRef<HTMLDivElement | null>(null);
  const [headHeight, setHeadHeight] = useState(0);
  const hasHead = headSlots(prefix).length > 0;
  const placed = useMemo(
    () =>
      uniform || rows || cols === null
        ? null
        : placeColumns(items, cols, clampAspect),
    [uniform, rows, cols, items, clampAspect],
  );
  useLayoutEffect(() => {
    const read = () =>
      setHeadHeight(
        placed && headRef.current ? headRef.current.offsetHeight : 0,
      );
    read();
    const el = headRef.current;
    if (!placed || !el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  });

  /**
   * THE SHIMMER RUNS ONLY WHERE SOMEONE CAN SEE IT: one observer for the grid
   * writes `data-inview` on the tiles on screen (`album-tile.css` runs the
   * skeleton's shimmer under it, after a beat). A thousand photographs below the
   * fold each ran a shimmer every frame for nobody (measured: 1,110 running
   * animations on the scale page). An attribute, not state: the tile does not
   * re-render to learn it is seen.
   */
  const [observe] = useState(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries)
        e.target.toggleAttribute("data-inview", e.isIntersecting);
    });
    return (el: HTMLElement | null) => {
      if (!el) return;
      io.observe(el);
      return () => io.unobserve(el);
    };
  });

  // THE ONE CLICK (see the head note): the verb, the mark or the open button
  // under the tap, answered from the latest props.
  const onGridClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as Element | null;
    const tile = target?.closest?.<HTMLElement>(
      "[data-media-tile][data-media-id]",
    );
    if (!target || !tile || !e.currentTarget.contains(tile)) return;
    const id = tile.dataset.mediaId!;
    const now = latest.current;
    const verb = target.closest<HTMLElement>("[data-tile-action]");
    if (verb && tile.contains(verb)) {
      // A link verb (Save) does its own work; a button verb is the surface's.
      if (verb.tagName === "A") return;
      const item = now.items.find((m) => m.id === id);
      const action = item
        ? now.tileActions?.(item).find((a) => a.id === verb.dataset.tileAction)
        : undefined;
      if (action && !action.disabled) action.onSelect?.();
      return;
    }
    if (target.closest('[data-tile-mark="mine"]')) {
      now.onSelectMine?.();
      return;
    }
    if (!target.closest("[data-tile-open]")) return;
    // Suppress the click the browser synthesizes after a long-press (else the
    // hold that entered select mode would also open the lightbox).
    if (longPress.consumeClick()) return;
    if (now.selection) {
      now.selection.onToggle(id);
      return;
    }
    openItem(id, tile);
  };

  // THE KEYBOARD'S HOVER: a tile the keyboard is inside shows its desk row the
  // way a hovered one does (`album-tile.css`, `data-kbd-focus`). An attribute
  // rather than `:has(:focus-visible)`, which matches but does not reliably
  // repaint in Chromium; and focus-visible only, so a click never pins it open.
  const onGridFocus = (e: FocusEvent<HTMLElement>) => {
    const target = e.target as Element;
    const tile = target.closest?.("[data-media-tile][data-media-id]");
    if (!tile) return;
    let keyboard = false;
    try {
      keyboard = target.matches(":focus-visible");
    } catch {
      // An engine without the selector (jsdom) gets no keyboard hover.
    }
    if (keyboard) tile.setAttribute("data-kbd-focus", "");
  };
  const onGridBlur = (e: FocusEvent<HTMLElement>) => {
    const tile = (e.target as Element).closest?.(
      "[data-media-tile][data-media-id]",
    );
    const next = e.relatedTarget as Node | null;
    if (tile && !(next && tile.contains(next)))
      tile.removeAttribute("data-kbd-focus");
  };

  const gridProps = {
    onClick: onGridClick,
    onFocus: onGridFocus,
    onBlur: onGridBlur,
    ...longPress.handlers,
    onPointerEnter: preloadMediaLightbox,
    onTouchStart: preloadMediaLightbox,
  };

  /** What every layout hands a tile, from the item and the surface's sets. */
  const tileProps = (item: T): AlbumTileProps => ({
    item,
    layout,
    clampAspect,
    enter: stagger,
    seedIndex: stagger ? (seedIndex.get(item.id) ?? 0) : undefined,
    arrived: arrivedIds?.has(item.id),
    landed: landedIds?.has(item.id),
    mine: mineIds?.has(item.id)
      ? onSelectMine
        ? "control"
        : "marker"
      : undefined,
    mineSelected,
    dimmed: dimItem?.(item),
    hideLikeMark,
    actions: tileActions?.(item),
    overlay: renderOverlay?.(item),
    selecting: !!selection,
    selected: selection?.selected.has(item.id),
    exiting: selection?.exiting?.has(item.id),
    observe,
  });

  // The rows' tile: the engine's box, entering once, pushing on arrival.
  const rowTile = (item: T, t: RowTile) => (
    <AlbumTile
      key={item.id}
      {...tileProps(item)}
      box={t.box}
      rowsKey={t.rowsKey}
      enter={stagger && t.fresh}
      entering={t.entering}
      eager={t.eager}
      listItem
    />
  );

  return (
    <>
      {rows ? (
        <AlbumRows
          items={items}
          step={rowStep}
          anchor={rowAnchor}
          rhythm={rowRhythm}
          seed={rhythmSeed}
          clampAspect={clampAspect}
          head={prefix}
          renderTile={rowTile}
          onStepChange={onRowStepChange}
          onWindowChange={onWindowChange}
          handleRef={handle}
          gridRef={(el) => {
            rootRef.current = el;
          }}
          gridProps={gridProps}
        />
      ) : (
        <div
          {...gridProps}
          ref={(el) => {
            if (!uniform) boxRef.current = el;
            rootRef.current = el;
          }}
          data-album-grid
          // ★ ONE PLACEHOLDER IN A SESSION REPLAY, NOT A THOUSAND PHOTOGRAPHS.
          // Sentry's replay (instrumentation-client.ts) buffers every session
          // to send on an error, so it serializes every node the album mounts,
          // and its media blocking measures each photograph's box, one forced
          // layout per image (measured: the largest single cost of a throttled
          // phone's fling through the windowed rows). The photographs are
          // blocked from replays already (`blockAllMedia`); blocking the grid
          // keeps its place and size in the recording and skips the rest.
          data-sentry-block=""
          className={
            uniform
              ? GALLERY_UNIFORM_COLUMNS
              : placed
                ? // The measured columns: the same box, restyled (see the head note).
                  "[container-type:inline-size] relative w-full gap-[var(--gap-gallery)]"
                : GALLERY_COLUMNS
          }
          style={
            placed && cols
              ? ({
                  "--col-w": `calc((100cqw - ${cols - 1} * var(--gap-gallery)) / ${cols})`,
                  "--head-h": `${headHeight}px`,
                } as CSSProperties)
              : undefined
          }
        >
          {hasHead && (
            <div
              ref={headRef}
              data-album-head
              // In the flow the head's tiles are the columns' own (`contents`);
              // measured, it stands at the first column's head.
              className={cn(placed ? "flow-root" : "contents")}
              style={
                placed
                  ? {
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "var(--col-w)",
                    }
                  : undefined
              }
            >
              {prefix}
            </div>
          )}
          {items.map((item, i) => (
            <AlbumTile
              key={item.id}
              {...tileProps(item)}
              box={placed?.box.get(item.id)}
              // The first row fetches first: each column's head once measured,
              // the first two before (the top of the first CSS column).
              eager={placed ? placed.first.has(item.id) : !uniform && i < 2}
            />
          ))}
          {placed && (
            // The box's height: absolutely placed tiles take none of their own.
            <div aria-hidden style={{ height: placed.height }} />
          )}
        </div>
      )}

      <MediaLightboxLazy
        items={items}
        index={openIndex}
        origin={origin}
        onClose={closeItem}
        // Swipe/arrow navigation still speaks in positions; translate straight
        // back to the id so the next mutation can't shift it either.
        onIndexChange={(i) => {
          const id = items[i]?.id ?? null;
          setOpenId(id);
          if (photoAddress) writeAddress(id);
        }}
        viewerIsHost={viewerIsHost}
        shareUrl={shareUrl}
        onSetStatus={onSetStatus}
        canDelete={canDelete}
        onDeleteCurrent={
          onDeleteItem
            ? (item) => {
                closeItem();
                onDeleteItem(item.id);
              }
            : undefined
        }
        // Remove shrinks the set -> close the viewer first, then run (mirrors onDeleteCurrent).
        onRemove={
          onRemove
            ? (item) => {
                closeItem();
                onRemove(item);
              }
            : undefined
        }
      />
    </>
  );
}
