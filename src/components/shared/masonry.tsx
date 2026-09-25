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
 *
 * ★ AND `layout="rows"` IS THE JUSTIFIED ALBUM (`album-columns`: Will's
 * `layout=justified`), opt-in beside masonry, which stays the default. Its
 * engine is `lib/shared/album-rows.ts` (optimal breaks, local arrivals); this
 * file is its box, `AlbumRows`, below.
 */
// THE ARRIVAL GRAMMAR'S SHEET, on the ONE grid every album is made of: the glow
// an arriving tile takes (`data-arrived`, anyone's) and the sweep a guest's own
// landing takes (`data-landed`). It used to be `guest/live-gallery.css`, where
// the host could not reach it, which is exactly what `landing=sweep` refused.
import "./arrival.css";

import {
  Children,
  Component,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { TileLikeMark } from "@/components/likes/like-button";
import { probeAlbumRender } from "@/components/shared/album-tile";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
// The tile aspect-ratio math lives in a pure module (node-unit tested + reusable
// by host grids without pulling this client component's lightbox graph in).
import { readPhotoParam, withPhotoParam } from "@/lib/media/share-save";
import {
  rowRatio,
  tileAspect,
  UNIFORM_TILE_ASPECT,
} from "@/lib/media/tile-aspect";
import {
  DEFAULT_ROW_STEP,
  meanRatio,
  perRowFor,
  pickFeatures,
  reflowRows,
  ROW_CLASSES,
  type RowAnchor,
  type RowFeature,
  type RowItem,
  type RowsLayout,
  type RowStep,
} from "@/lib/shared/album-rows";
import { ARRIVAL_GLIDE_MS } from "@/lib/shared/arrival";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { runFlip } from "@/lib/shared/use-flip";
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

/* ── THE JUSTIFIED ROWS' BOX ─────────────────────────────────────────────── */

/**
 * A tile's box in the rows, handed to whoever draws the tile: spread `style`
 * into the tile root's own and write `rowsKey` as its `data-rows-key`, which is
 * how the glide finds it.
 */
export type RowTileBox = {
  style: CSSProperties;
  rowsKey: string;
};

/**
 * THE FIRST PAINT'S WIDTH CLASSES: `ROW_CLASSES`' own breakpoints as container
 * queries, each picking that class's count at the step. A class string because
 * Tailwind reads classes from source, so it cannot be built from the table;
 * `masonry.test.tsx` holds the two to the same numbers.
 */
export const ROWS_FIRST_PAINT =
  "gap-y-[var(--gap-gallery)] [--rows-n:var(--rows-n0)] @min-[480px]:[--rows-n:var(--rows-n1)] @min-[900px]:[--rows-n:var(--rows-n2)] @min-[1280px]:[--rows-n:var(--rows-n3)]";

/** Every drawn tile and head slot in a rows grid, by its key, as the DOM has them now. */
function rowNodes(grid: HTMLElement | null): Map<string, HTMLElement> {
  const nodes = new Map<string, HTMLElement>();
  grid
    ?.querySelectorAll<HTMLElement>(":scope > [data-rows-key]")
    .forEach((el) => nodes.set(el.dataset.rowsKey!, el));
  return nodes;
}

/** The rhythm: plain rows, or a feature row now and then (`RowFeature`). */
export type RowRhythm = "plain" | RowFeature;

/**
 * THE WIDTH TO LAY THE ROWS AT, given the last few measurements.
 *
 * ★ ROWS CAN SUMMON THEIR OWN SCROLLBAR, AND DISMISS IT. A row's height scales
 * with the width, so an album whose height sits within a hair of the window's
 * lays out tall enough to need a scrollbar, loses the scrollbar's width, lays
 * out short enough not to, gets the width back, and loops every frame (masonry
 * only changes at a column boundary, so it almost never meets this). A width
 * that flips back to where it was two measurements ago, by no more than a
 * scrollbar and within a few frames, is that loop: lay the NARROWER width and
 * hold. Those rows are short enough to need no scrollbar, and in the wider box
 * flex stretches them the few pixels they are short.
 */
export function steadyWidth(
  recent: readonly { width: number; at: number }[],
): number {
  const n = recent.length;
  const last = recent[n - 1];
  if (n < 3) return last.width;
  const [a, b] = [recent[n - 3], recent[n - 2]];
  const flipped =
    a.width === last.width &&
    a.width !== b.width &&
    Math.abs(a.width - b.width) <= 24 &&
    last.at - a.at < 300;
  return flipped ? Math.min(a.width, b.width) : last.width;
}

/** Where a head slot's id is kept apart from every photograph's. */
const HEAD_ID = "rows-head:";

/**
 * THE HEAD SLOT'S NOMINAL SHAPE. What stands at the album's head (the guest's
 * upload stack, a held photograph waiting for the host) has no dimensions the
 * grid can see, so it takes a square: the shape a photograph nobody measured
 * takes too (`ROW_FALLBACK_RATIO`), and the one that crops either orientation
 * least.
 */
const HEAD_RATIO = 1;

/**
 * Every tile-shaped node in a head: the page hands one fragment of however
 * many tiles, and each becomes a slot of its own in the first row. A fragment's
 * children are walked through (the guest album's head is exactly that shape);
 * anything that is not an element (a stray `false`, an empty string) is no
 * tile.
 */
function headSlots(head: ReactNode): { key: string; node: ReactNode }[] {
  const out: { key: string; node: ReactNode }[] = [];
  const walk = (node: ReactNode, path: string) => {
    Children.toArray(node).forEach((child, i) => {
      if (!isValidElement<{ children?: ReactNode }>(child)) return;
      const key = `${path}${child.key ?? i}`;
      if (child.type === Fragment) walk(child.props.children, `${key}/`);
      else out.push({ key, node: child });
    });
  };
  walk(head, "");
  return out;
}

/** The list the engine lays: every photograph's row ratio, the rhythm's picks, the head's slots. */
function rowItemsFor(
  items: readonly {
    id: string;
    width?: number | null;
    height?: number | null;
  }[],
  clampAspect: boolean,
  picks: { seed: number; perRow: number } | null,
  heads: readonly string[],
  anchor: RowAnchor,
): RowItem[] {
  const list: RowItem[] = items.map((m) => ({
    id: m.id,
    ratio: rowRatio(m, clampAspect),
  }));
  if (picks) {
    const featured = pickFeatures(list, picks.seed, picks.perRow);
    for (let i = 0; i < list.length; i++)
      if (featured.has(list[i].id)) list[i] = { ...list[i], feature: true };
  }
  const slots = heads.map((key) => ({ id: HEAD_ID + key, ratio: HEAD_RATIO }));
  return anchor === "end" ? [...slots, ...list] : [...list, ...slots];
}

/** Whether two laid lists are the same photographs, shapes and picks, in order. */
function sameRowItems(a: readonly RowItem[], b: readonly RowItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++)
    if (
      a[i].id !== b[i].id ||
      a[i].ratio !== b[i].ratio ||
      !!a[i].feature !== !!b[i].feature
    )
      return false;
  return true;
}

/**
 * ★ THE GLIDE NEEDS WHERE EVERY TILE WAS A MOMENT BEFORE THE ROWS CHANGED, NOT
 * WHERE IT WAS AT THE LAST GLIDE. A guest scrolls between two arrivals, and a
 * rect remembered from the last one is off by however far they scrolled: the
 * whole album would fly by that distance. React's only way to read the DOM
 * after the new rows are decided and before they are written is a class
 * lifecycle, `getSnapshotBeforeUpdate` (there is no hook for it), so this null
 * component exists to call `capture` at exactly that moment, and only when the
 * rows about to be written will glide.
 */
class RowsSnapshot extends Component<{
  version: number;
  armed: boolean;
  capture: () => void;
}> {
  getSnapshotBeforeUpdate(prev: { version: number }) {
    if (prev.version !== this.props.version && this.props.armed)
      this.props.capture();
    return null;
  }
  // React calls the snapshot only on a component that also declares this.
  componentDidUpdate() {}
  render() {
    return null;
  }
}

type RowsLaid = {
  /** The list these rows were laid from. */
  items: readonly RowItem[];
  /** The parameters, as a key: a resize, a step, an anchor or a rhythm. */
  params: string;
  layout: RowsLayout;
  /** Bumped on every change actually written, so the glide runs once per change. */
  version: number;
  /** Whether this change glides (an arrival, a hide, a step), or lands at once. */
  glide: boolean;
};

/**
 * THE JUSTIFIED ALBUM (`album-columns`, Will's `layout=justified`: "I like this
 * more than masonry because we insert into rows (feels natural) rather than
 * columns... along with cleaner row lines"). The engine decides the rows
 * (`lib/shared/album-rows.ts`); this box measures the width they are laid in,
 * draws them, and glides what an arrival, a hide or a step moves.
 *
 * ★ ONE FLEX CONTAINER, ITS ROWS BROKEN BY HAND, NEVER A WRAPPER PER ROW. A
 * photograph that changes rows would change PARENT under a wrapper per row, and
 * React remounts a node that changes parent: the tile would drop its decoded
 * image back to the shimmer, replay its entrance and lose its hover, on every
 * arrival, for every photograph the arrival pushed along. So every tile is a
 * child of one wrapping flex box, each row is one flex line, and a zero-height,
 * full-width break (the row gap's own height) ends each line. A reflow moves
 * breaks, never tiles.
 *
 * ★ WHOLE PIXELS, AND FLEX HANDS THEM OUT. The engine gives each tile a whole
 * pixel width summing to the row; the tile's `flex-grow` IS that width over a
 * zero basis, so at the width it was laid for every tile lands on its pixel
 * (no seams), and in the frames between a resize and its layout the row still
 * fills the box edge to edge, stretched a hair, rather than wrapping.
 *
 * ★ THE FIRST PAINT IS CSS, BECAUSE THE SERVER HAS NO WIDTH. Before the box is
 * measured the tiles wrap greedily on the same target (a container query per
 * width class, the album's mean ratio, each tile growing in proportion to its
 * shape, so each line is already justified); the engine's rows replace it in a
 * layout effect, moving breaks and never remounting a tile. The greedy lines are
 * not the engine's, so the swap is a re-break: a jump-free first paint needs the
 * step and a width the server can know, which is the surface's to thread.
 *
 * Arrivals glide (`--arrival-glide-ms`, `ARRIVAL_GLIDE_MS`): a new tile mounts
 * in place and takes the album's own entrance and glow, and every tile the
 * reflow moved glides from where it stood, only those a reader can see. A step
 * change glides the same way. A resize, a filter and the first layout land at
 * once, and reduced motion lands everything at once.
 */
export function AlbumRows<
  T extends { id: string; width?: number | null; height?: number | null },
>({
  items,
  step = DEFAULT_ROW_STEP,
  anchor = "end",
  rhythm = "plain",
  seed = 0,
  clampAspect = false,
  head,
  renderTile,
  gridRef,
  gridProps,
}: {
  items: readonly T[];
  /** The density step: photographs per row (`ROW_CLASSES`), never pixels. */
  step?: RowStep;
  /** The fixed end (`RowAnchor`): "end" for a newest-first album. */
  anchor?: RowAnchor;
  rhythm?: RowRhythm;
  /** The visit's seed for the rhythm's picks: the same seed, the same picks. */
  seed?: number;
  /** The host's moderation band (`rowRatio`). */
  clampAspect?: boolean;
  /**
   * What stands at the growing end before the first photograph (the guest's
   * upload tiles): each tile-shaped node takes a slot of its own at the head
   * (at the tail for an oldest-first album), square, with its own bottom margin
   * zeroed and its box filled.
   */
  head?: ReactNode;
  renderTile: (item: T, box: RowTileBox) => ReactNode;
  gridRef?: (el: HTMLDivElement | null) => void;
  gridProps?: HTMLAttributes<HTMLDivElement>;
}) {
  const gridEl = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ width: number; gap: number } | null>(null);
  const widths = useRef<{ width: number; at: number }[]>([]);

  // The width the rows are laid in, and the gap as the box resolves it (the
  // token is a `max()`, which a custom property reads back as text).
  const measure = useCallback(() => {
    const el = gridEl.current;
    if (!el) return;
    const measured = el.getBoundingClientRect().width;
    // A zero width is "not laid out" (a hidden tab, jsdom), never "a phone".
    if (measured <= 0) return;
    const recent = widths.current;
    if (recent[recent.length - 1]?.width !== measured)
      recent.push({ width: measured, at: performance.now() });
    if (recent.length > 3) recent.shift();
    const width = steadyWidth(recent);
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    setBox((prev) =>
      prev && prev.width === width && prev.gap === gap ? prev : { width, gap },
    );
  }, []);
  useLayoutEffect(() => {
    measure();
    const el = gridEl.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const slots = headSlots(head);
  const perRow = box ? perRowFor(box.width, step) : null;
  const feature: RowFeature = rhythm === "plain" ? "double" : rhythm;
  // Plain arithmetic every render (a few microseconds a thousand photographs):
  // the rows below compare it by CONTENT, so a poll that hands down an equal
  // list in a new array lays nothing.
  const rowItems = rowItemsFor(
    items,
    clampAspect,
    rhythm !== "plain" && perRow !== null ? { seed, perRow } : null,
    slots.map((h) => h.key),
    anchor,
  );

  // THE ROWS, derived during render from the last rows (React's "storing
  // information from previous renders"): the engine is pure and fast, and a
  // reflow that is decided here is written in the same commit, so the glide's
  // snapshot sees the old rows and its effect the new ones.
  const paramsKey =
    box && perRow !== null
      ? `${box.width}|${box.gap}|${perRow}|${anchor}|${feature}`
      : "";
  const [laid, setLaid] = useState<RowsLaid | null>(null);
  let current = laid;
  if (
    box &&
    perRow !== null &&
    (!laid || laid.params !== paramsKey || !sameRowItems(laid.items, rowItems))
  ) {
    const r = reflowRows(laid?.layout ?? null, rowItems, {
      width: box.width,
      gap: box.gap,
      perRow,
      anchor,
      feature,
    });
    if (r.kind !== "none" || !laid || laid.params !== paramsKey) {
      const sameWidth = !!laid && laid.layout.width === box.width;
      current = {
        items: rowItems,
        params: paramsKey,
        layout: r.layout,
        version: (laid?.version ?? 0) + 1,
        glide:
          r.kind === "local" ||
          (r.kind === "full" &&
            ((r.reason === "params" && sameWidth) || r.reason === "tiny")),
      };
      setLaid(current);
    }
  }

  // The glide: every tile's box a moment before the rows changed (the
  // snapshot), then the pass over what moved. The tiles are read out of the
  // grid by their `data-rows-key` at those two moments rather than tracked by
  // a ref callback each, so a render hands nothing but attributes.
  const snap = useRef<Map<string, DOMRect> | null>(null);
  const capture = useCallback(() => {
    const was = new Map<string, DOMRect>();
    for (const [key, el] of rowNodes(gridEl.current))
      was.set(key, el.getBoundingClientRect());
    snap.current = was;
  }, []);
  const version = current?.version ?? 0;
  const glide = current?.glide ?? false;
  useLayoutEffect(() => {
    const was = snap.current;
    snap.current = null;
    if (!was || !glide) return;
    runFlip(rowNodes(gridEl.current), was, {
      scale: true,
      visibleOnly: true,
      duration: readCssMs(
        "--arrival-glide-ms",
        ARRIVAL_GLIDE_MS,
        gridEl.current,
      ),
      easing: "var(--arrival-glide-ease, var(--ease-in-out-strong))",
    });
  }, [version, glide]);

  const byId = useMemo(
    () => new Map(items.map((m) => [m.id, m] as const)),
    [items],
  );
  const slotByKey = new Map(slots.map((h) => [HEAD_ID + h.key, h.node]));

  const drawn = (id: string, style: CSSProperties) => {
    const slot = slotByKey.get(id);
    if (slot !== undefined)
      return (
        <div
          key={id}
          data-rows-key={id}
          data-rows-head
          style={style}
          // The head's tiles bring the masonry's bottom margin and their own
          // height; in a row the slot is the box, so both give way to it.
          className="relative [&_[data-media-tile]]:!mb-0 [&_[data-media-tile]]:h-full [&>*]:!mb-0 [&>*]:h-full [&>*]:w-full"
        >
          {slot}
        </div>
      );
    const item = byId.get(id);
    return item ? renderTile(item, { style, rowsKey: id }) : null;
  };

  const children: ReactNode[] = [];
  const layout = current?.layout;
  if (layout) {
    layout.rows.forEach((row, r) => {
      row.ids.forEach((id, i) => {
        const w = row.widths[i];
        children.push(
          drawn(
            id,
            layout.tiny
              ? { flex: `0 0 ${w}px`, height: row.height }
              : {
                  flexGrow: w,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  height: row.height,
                },
          ),
        );
      });
      if (r < layout.rows.length - 1)
        children.push(
          <div
            key={`break:${row.ids[row.ids.length - 1]}`}
            aria-hidden
            data-row-break
            className="basis-full"
            style={{ height: "var(--gap-gallery)" }}
          />,
        );
    });
  } else {
    // The first paint (see the head comment): greedy, justified per line.
    for (const it of rowItems)
      children.push(
        drawn(it.id, {
          flexGrow: it.ratio,
          flexBasis: `calc(var(--rows-unit) * ${it.ratio})`,
          aspectRatio: it.ratio,
          minWidth: 0,
        }),
      );
    // The last line keeps its target height rather than blowing one
    // photograph up to the full width.
    children.push(
      <div key="rows-rest" aria-hidden className="h-0 grow-[1000] basis-0" />,
    );
  }

  // Each width class's count at this step, for the first paint's container
  // queries; the engine reads the same table. ★ FIRST PAINT ONLY: the unit
  // carries the album's mean shape, which every arrival nudges, and a custom
  // property changed on the grid restyles every one of its descendants: a
  // thousand tiles restyled, on every arrival, for a value nothing reads once
  // the rows are measured.
  const unitVars: Record<string, string | number> = {};
  if (!layout) {
    ROW_CLASSES.forEach((c, i) => {
      unitVars[`--rows-n${i}`] = c.perRow[step];
    });
    unitVars["--rows-unit"] =
      `calc((100cqw - (var(--rows-n) - 1) * var(--gap-gallery)) / (var(--rows-n) * ${meanRatio(rowItems)}))`;
  }

  return (
    <div className="@container w-full">
      <div
        {...gridProps}
        ref={(el) => {
          gridEl.current = el;
          gridRef?.(el);
        }}
        data-album-grid
        data-album-layout="rows"
        style={unitVars as CSSProperties}
        className={cn(
          "flex w-full flex-wrap gap-x-[var(--gap-gallery)]",
          layout ? "gap-y-0" : ROWS_FIRST_PAINT,
          layout?.tiny && "justify-center",
        )}
      >
        {children}
      </div>
      <RowsSnapshot version={version} armed={glide} capture={capture} />
    </div>
  );
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
  rowStep,
  rowAnchor,
  rowRhythm,
  rhythmSeed,
  arrivedIds,
  landedIds,
  canDelete,
  prefix,
  mineIds,
  onSelectMine,
  mineSelected,
  photoAddress = true,
}: {
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
   *  the justified album (`AlbumRows`, opt-in until each surface switches). Only the container and
   *  the per-tile box change; the marks / lightbox / dimItem paths are identical. */
  layout?: "masonry" | "uniform" | "rows";
  /** Rows only: the density step, photographs per row (`lib/shared/album-rows.ts`). */
  rowStep?: RowStep;
  /** Rows only: the fixed end, "end" (the default) for a newest-first album. */
  rowAnchor?: RowAnchor;
  /** Rows only: plain rows (the default) or a feature row now and then. */
  rowRhythm?: RowRhythm;
  /** Rows only: the visit's seed for the rhythm's picks, held for the visit. */
  rhythmSeed?: number;
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
  /**
   * The open photograph rides the page's address as `?photo=<id>` (on by default; see
   * `writeAddress`). Off for a grid that is not the page's subject.
   */
  photoAddress?: boolean;
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
  // One long-press machine for the grid (a single press at a time). bind() is a no-op without
  // onTileLongPress, so non-host grids are unaffected.
  const longPress = useLongPress(onTileLongPress);

  // null until the box is measured: the first paint is the CSS-columns box (see
  // the head comment), so the server HTML and the hydrated tree hold the same
  // height and the swap is a re-balance rather than a jump.
  const [cols, setCols] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // The grid's root in every layout (the uniform grid has no measured box).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  /**
   * The tile of the photograph showing at close, brought on screen if the
   * viewer walked it out of view, so the photograph drops into ITS tile.
   */
  const returnTo = useCallback((item: GridMedia) => {
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
      if (!itemsRef.current.some((m) => m.id === id)) return;
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

  // `box` is a justified row's size and the glide's key (`AlbumRows`); without
  // one the tile sizes itself by its aspect, as masonry and uniform always have.
  const tileOf = (item: T, box?: RowTileBox) => {
    probeAlbumRender("tile", item.id);
    return (
      <div
        key={item.id}
        data-rows-key={box?.rowsKey}
        data-media-tile
        data-arrived={arrivedIds?.has(item.id) ? "" : undefined}
        data-landed={landedIds?.has(item.id) ? "" : undefined}
        data-mine={mineIds?.has(item.id) ? "" : undefined}
        // The lightbox finds a photograph's tile by it, to drop back into.
        data-media-id={item.id}
        // The bright edge (globals.css, [data-lit]): this div owns the tile
        // radius and clips the photo, so the hook sits here and nowhere
        // above it. No value: a tile has no border for the light to land on.
        data-lit=""
        // Host tiles (stagger off) opt out of the arrival fade-rise (emil: no
        // entrance theater on host); the guest album (stagger on) keeps it.
        data-static={stagger ? undefined : ""}
        style={
          {
            // Rows = the engine's box. Uniform = the one fixed aspect (object-cover
            // crops); masonry = natural ratio.
            ...(box
              ? box.style
              : {
                  aspectRatio: uniform
                    ? UNIFORM_TILE_ASPECT
                    : tileAspect(item, clampAspect),
                }),
            borderRadius: "var(--radius-tile)",
            ...(stagger ? { "--tile-i": seedIndex.get(item.id) ?? 0 } : {}),
          } as CSSProperties
        }
        // Uniform: the CSS-grid gap spaces tiles; rows: the flex gap and the row
        // breaks. Masonry: the gap is the tile's own bottom margin, because
        // neither a `columns` box nor a column element has a row gap.
        className={
          box
            ? "group relative overflow-hidden bg-black/10"
            : uniform
              ? "group relative w-full overflow-hidden bg-black/10"
              : "group relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        }
      >
        <button
          type="button"
          {...longPress.bind(item.id)}
          onClick={(e) => {
            // Suppress the click the browser synthesizes after a long-press (else the hold that
            // entered select mode would also open the lightbox).
            if (longPress.consumeClick()) return;
            openItem(item.id, e.currentTarget.closest("[data-media-tile]"));
          }}
          aria-label={item.type === "photo" ? "View photo" : "Play video"}
          // ★ `cn`, never a template: the dim used to be glued straight onto
          // `active:scale-[0.98]` with no space, one class nobody emits, so a
          // hidden photograph sat in the host album at full brightness.
          className={cn(
            "size-full cursor-pointer transition-[transform,opacity] duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]",
            dimItem?.(item) && "opacity-30",
          )}
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
  };

  const columns =
    uniform || rows || cols === null
      ? null
      : distributeColumns(items, cols, clampAspect);

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
          renderTile={(item, box) => tileOf(item, box)}
          gridRef={(el) => {
            rootRef.current = el;
          }}
          gridProps={{
            onPointerEnter: preloadMediaLightbox,
            onTouchStart: preloadMediaLightbox,
          }}
        />
      ) : columns ? (
        <div
          ref={(el) => {
            boxRef.current = el;
            rootRef.current = el;
          }}
          data-album-grid
          className="flex w-full items-start gap-[var(--gap-gallery)]"
          onPointerEnter={preloadMediaLightbox}
          onTouchStart={preloadMediaLightbox}
        >
          {columns.map((column, c) => (
            <div key={c} className="min-w-0 flex-1">
              {c === 0 && prefix}
              {column.map((item) => tileOf(item))}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={(el) => {
            if (!uniform) boxRef.current = el;
            rootRef.current = el;
          }}
          data-album-grid
          className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}
          onPointerEnter={preloadMediaLightbox}
          onTouchStart={preloadMediaLightbox}
        >
          {prefix}
          {items.map((item) => tileOf(item))}
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
