"use client";

/**
 * THE JUSTIFIED ALBUM, WINDOWED (`album-columns`, Will's `layout=justified`: "I
 * like this more than masonry because we insert into rows (feels natural)
 * rather than columns... along with cleaner row lines"; the album-window lane).
 * The engine decides the rows (`lib/shared/album-rows.ts`); this box measures
 * the width they are laid in, mounts only the rows around the viewport
 * (`lib/shared/album-window.ts`), keeps what a reader is looking at still when
 * the rows above it change, and glides what an arrival, a hide or a step moves.
 *
 * ★ ONLY THE ROWS AROUND THE VIEWPORT ARE MOUNTED. A row's top is a prefix sum
 * of the engine's whole-pixel heights, so the rows in view are a binary search
 * per frame: a spacer for everything above, the mounted rows, a spacer for
 * everything below, one viewport of rows behind and two ahead. A tile keeps its
 * key wherever it goes, so a reflow or a scroll moves breaks and spacers,
 * never a mounted tile. At 1,145 photographs the album draws about as many
 * nodes as one screen of them needs, not sixteen thousand.
 *
 * ★ ONE FLEX CONTAINER, ITS ROWS BROKEN BY HAND, NEVER A WRAPPER PER ROW. A
 * photograph that changes rows would change PARENT under a wrapper per row, and
 * React remounts a node that changes parent: the tile would drop its decoded
 * image back to the shimmer, replay its entrance and lose its hover, on every
 * arrival, for every photograph the arrival pushed along. So every tile is a
 * child of one wrapping flex box, each row is one flex line, and a zero-height,
 * full-width break (the row gap's own height) ends each line; the spacers are
 * full-width lines of their own.
 *
 * ★ WHOLE PIXELS, AND FLEX HANDS THEM OUT. The engine gives each tile a whole
 * pixel width summing to the row; the tile's `flex-grow` IS that width over a
 * zero basis, so at the width it was laid for every tile lands on its pixel
 * (no seams), and in the frames between a resize and its layout the row still
 * fills the box edge to edge, stretched a hair, rather than wrapping.
 *
 * ★ NOTHING A READER IS LOOKING AT MOVES. The browser's own scroll anchoring is
 * off (`overflow-anchor: none`: it cannot see through a spacer, and Safari has
 * none), and the box anchors by hand: before a change it notes the first
 * photograph showing at the view's top (or the one under a pinch), and in the
 * same layout effect that writes the change it scrolls by exactly how far that
 * photograph moved. A head arrival while the reader is deep, a hide above, a
 * late approval landing mid-album, a step and a resize all keep it on its
 * pixel. ★ The scroll can only hold what the change did not re-lay, so the rows
 * in view are handed to the engine (`rowsInView`) and a change outside them
 * re-lays only rows on its own side: a hide in the row just above the view used
 * to re-break the row at the view's top, whose top edge the scroll kept while
 * its photographs moved under the reader. On a touch screen a change that needs
 * such a scroll waits until the scroll has been still for a beat
 * (`MOMENTUM_IDLE_MS`): a scroll written during a flick's momentum stops the
 * flick dead.
 *
 * ★ THE FIRST PAINT IS CSS, BECAUSE THE SERVER HAS NO WIDTH. Before the box is
 * measured the first photographs wrap greedily on the same target (a container
 * query per width class, the album's mean ratio, each tile growing in
 * proportion to its shape), and a spacer estimates the rest; the engine's rows
 * replace it in a layout effect, moving breaks and never remounting a tile.
 *
 * Arrivals push (`album-columns` r2, `arrival=push`): a photograph new to the
 * rows is revealed from its left edge (`data-entering`, `arrival.css`) while
 * every tile the reflow moved glides from where it stood, only those a reader
 * can see (`--arrival-glide-ms`). A step change glides the same way; a resize,
 * a filter and the first layout land at once, and reduced motion lands
 * everything at once.
 */
import {
  Children,
  Component,
  Fragment,
  isValidElement,
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
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import { flushSync } from "react-dom";

import {
  classWidths,
  decodeFirstPaint,
  encodeFirstPaint,
  firstPaintKey,
  firstPaintPlan,
  isPhoto,
  rowItemsFor,
  HEAD_ID,
  type RowRhythm,
} from "@/components/shared/album-window-plan";
import {
  useDensityGestures,
  type FocalPoint,
} from "@/components/shared/density-control";
import {
  DEFAULT_ROW_STEP,
  perRowFor,
  reflowRows,
  ROW_CLASSES,
  type HeldRows,
  type RowAnchor,
  type RowFeature,
  type RowItem,
  type RowsLayout,
  type RowStep,
} from "@/lib/shared/album-rows";
import {
  albumHeight,
  anchorShift,
  holdForMomentum,
  MOMENTUM_IDLE_MS,
  mountedRanges,
  rowAt,
  rowBottom,
  rowIndex,
  rowTops,
  spacerHeights,
  topAnchor,
  windowRange,
  type AnchorPoint,
  type ViewBox,
} from "@/lib/shared/album-window";
import { ARRIVAL_GLIDE_MS } from "@/lib/shared/arrival";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { runFlip } from "@/lib/shared/use-flip";
import { cn } from "@/lib/utils";

// The first paint's plan lives beside this file, where the server can run it too
// (`album-window-plan.ts`); the rhythm's name is re-exported where it was found.
export type { RowRhythm };
export { FIRST_PAINT } from "@/components/shared/album-window-plan";

/**
 * What the box hands whoever draws a photograph's tile: spread `style` into the
 * tile root's own and write `rowsKey` as its `data-rows-key` (how the glide and
 * the anchoring find it). A board that draws its own tile needs only these two.
 */
export type RowTileBox = {
  style: CSSProperties;
  rowsKey: string;
};

/** The box, and what the one grid's own tile also reads (`masonry.tsx`). */
export type RowTile = RowTileBox & {
  /** The album has not settled yet: a tile mounting now may take the album's entrance. */
  fresh: boolean;
  /** New to the rows this moment (an arrival, a late approval): it pushes in. */
  entering: boolean;
  /** In the album's first row: fetched first. */
  eager: boolean;
};

/** What a surface can ask of the album. */
export type AlbumHandle = {
  /**
   * Brings a photograph's tile on screen (centred, when it was off it), mounts
   * it and returns it; null for a photograph the album does not hold. For a
   * deep link and for the viewer's way back into its tile.
   */
  scrollToId: (id: string) => HTMLElement | null;
};

/**
 * THE FIRST PAINT'S WIDTH CLASSES: `ROW_CLASSES`' own breakpoints as container
 * queries, each picking that class's count and the rest's height at the step.
 * Class strings because Tailwind reads classes from source, so they cannot be
 * built from the table; `masonry.test.tsx` holds them to the same numbers.
 */
export const ROWS_FIRST_PAINT =
  "[--rows-fill:var(--rows-fill0)] [--rows-rest:var(--rows-rest0)] @min-[480px]:[--rows-fill:var(--rows-fill1)] @min-[480px]:[--rows-rest:var(--rows-rest1)] @min-[900px]:[--rows-fill:var(--rows-fill2)] @min-[900px]:[--rows-rest:var(--rows-rest2)] @min-[1280px]:[--rows-fill:var(--rows-fill3)] @min-[1280px]:[--rows-rest:var(--rows-rest3)]";

/** A first-paint row break shown only in its own width class (same breakpoints as above). */
export const CLASS_BREAKS = [
  "@max-[480px]:block",
  "@min-[480px]:@max-[900px]:block",
  "@min-[900px]:@max-[1280px]:block",
  "@min-[1280px]:block",
] as const;

const NONE: ReadonlySet<string> = new Set();

/** Every drawn tile and head slot in a rows grid, by its key, as the DOM has them now. */
function rowNodes(grid: HTMLElement | null): Map<string, HTMLElement> {
  const nodes = new Map<string, HTMLElement>();
  grid
    ?.querySelectorAll<HTMLElement>(":scope > [data-rows-key]")
    .forEach((el) => nodes.set(el.dataset.rowsKey!, el));
  return nodes;
}

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

/**
 * Every tile-shaped node in a head: the page hands one fragment of however
 * many tiles, and each becomes a slot of its own in the first row. A fragment's
 * children are walked through (the guest album's head is exactly that shape);
 * anything that is not an element (a stray `false`, an empty string) is no
 * tile.
 */
export function headSlots(head: ReactNode): { key: string; node: ReactNode }[] {
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

/**
 * THE ROWS A READER CAN SEE, first and last, in a laid album: what a change
 * outside them must never re-lay (`reflowRows`' `held`). The first is the row
 * `topAnchor` anchors on (the row showing at the view's top, even by a pixel;
 * past it when the view's top sits in the gap under it), so the anchor always
 * rides a held row. Null when the view shows none of the album.
 */
export function rowsInView(
  tops: Float64Array,
  gap: number,
  view: ViewBox,
): HeldRows | null {
  const n = tops.length - 1;
  const bottom = view.top + view.height;
  if (n <= 0 || bottom <= 0 || view.top >= albumHeight(tops, gap)) return null;
  let first = rowAt(tops, view.top);
  if (rowBottom(tops, first, gap) <= view.top && first + 1 < n) first++;
  // The last row with a pixel above the view's bottom edge.
  let last = rowAt(tops, bottom);
  if (tops[last] >= bottom && last > first) last--;
  return [first, Math.max(first, last)];
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

/** The ids in `next` that `prev` did not have: what a local reflow brought in. */
function newIds(
  prev: readonly RowItem[],
  next: readonly RowItem[],
): Set<string> {
  const had = new Set(prev.map((it) => it.id));
  const out = new Set<string>();
  for (const it of next) if (!had.has(it.id) && isPhoto(it.id)) out.add(it.id);
  return out;
}

type ScrollRoot = HTMLElement | Window;

/**
 * THE SCROLLER THE ALBUM MOVES IN: the nearest ancestor that really scrolls
 * (its overflow lets it AND its content overflows it), else the element's own
 * window. The overflow alone is not enough: an `overflow-x: hidden` wrapper
 * computes `overflow-y: auto` and scrolls nothing, and listening to it would
 * leave the window deaf. The lab portals albums into frames, so the window is
 * the element's own, never this script's.
 */
function scrollRootOf(el: HTMLElement): ScrollRoot {
  const doc = el.ownerDocument;
  const win = doc.defaultView ?? window;
  for (
    let p = el.parentElement;
    p && p !== doc.body && p !== doc.documentElement;
    p = p.parentElement
  ) {
    const oy = win.getComputedStyle(p).overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      p.scrollHeight > p.clientHeight + 1
    )
      return p;
  }
  return win;
}

const isWindow = (r: ScrollRoot): r is Window => "innerHeight" in r;
const scrollTopOf = (r: ScrollRoot) => (isWindow(r) ? r.scrollY : r.scrollTop);
const heightOf = (r: ScrollRoot) =>
  isWindow(r) ? r.innerHeight : r.clientHeight;

/**
 * The viewport in the album's own coordinates, read off the layout: its top
 * from the album's top, and its height. It forces a layout when one is owed,
 * so a scroll never calls it (see `offsetRef`).
 */
function readView(el: HTMLElement, root: ScrollRoot): ViewBox {
  const rect = el.getBoundingClientRect();
  if (isWindow(root)) return { top: -rect.top, height: root.innerHeight };
  const r = root.getBoundingClientRect();
  return { top: r.top + root.clientTop - rect.top, height: root.clientHeight };
}

const sameView = (a: ViewBox | null, b: ViewBox) =>
  !!a && Math.abs(a.top - b.top) < 0.5 && a.height === b.height;

/** A tile's box by the id of the photograph in it. */
function tileAt(root: ParentNode, id: string): HTMLElement | null {
  const safe = id.replace(/["\\]/g, "\\$&");
  return root.querySelector<HTMLElement>(
    `[data-media-tile][data-media-id="${safe}"]`,
  );
}

/** The photograph under a point, and where on it: the anchor a pinch keeps under the fingers. */
function focalAt(grid: HTMLElement, at: FocalPoint): AnchorPoint | null {
  // An engine without hit-testing (jsdom) has no focal photograph: the top one anchors.
  const hit = grid.ownerDocument
    .elementFromPoint?.(at.x, at.y)
    ?.closest<HTMLElement>("[data-media-tile][data-media-id]");
  if (!hit || !grid.contains(hit)) return null;
  const r = hit.getBoundingClientRect();
  if (r.height <= 0) return null;
  return {
    id: hit.dataset.mediaId!,
    fraction: Math.min(1, Math.max(0, (at.y - r.top) / r.height)),
    offset: at.y,
  };
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
  /** The photographs they were laid from, by id: a change held back still draws them. */
  byId: ReadonlyMap<string, unknown>;
  /** The parameters, as a key: a resize, a step, an anchor or a rhythm. */
  params: string;
  layout: RowsLayout;
  /** Each row's top: the window's prefix sum. */
  tops: Float64Array;
  /** Bumped on every change actually written, so the glide runs once per change. */
  version: number;
  /** Whether this change glides (an arrival, a hide, a step), or lands at once. */
  glide: boolean;
  /** Photographs new to the rows, pushing in until the glide is over. */
  entering: ReadonlySet<string>;
  /** The scroll that keeps what the reader was looking at on its pixel. */
  shift: number;
};

/**
 * The first paint's plan a server render wrote on this grid (`data-rows-plan`),
 * found by the grid's own `useId`, which the server and the hydration share.
 * Read once, in the hydration's first render, before React touches the grid;
 * null on a client that never had a server's grid.
 */
function readServedPlan(planId: string): string | null {
  if (typeof document === "undefined") return null;
  const safe = planId.replace(/["\\]/g, "\\$&");
  return (
    document.querySelector<HTMLElement>(`[data-rows-plan-id="${safe}"]`)
      ?.dataset.rowsPlan ?? null
  );
}

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
  onStepChange,
  onWindowChange,
  handleRef,
  firstPaintWidth,
  onBoxWidth,
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
  renderTile: (item: T, tile: RowTile) => ReactNode;
  gridRef?: (el: HTMLDivElement | null) => void;
  gridProps?: HTMLAttributes<HTMLDivElement>;
  /**
   * The density gestures' answer: a pinch, a trackpad pinch or ctrl and the
   * wheel over the album asks for the next step here (anchored on the
   * photograph under the gesture). Omitted = no gesture over the album.
   */
  onStepChange?: (step: RowStep) => void;
  /** The photographs mounted now, whenever that changes: links and likes load per window. */
  onWindowChange?: (ids: readonly string[]) => void;
  handleRef?: Ref<AlbumHandle>;
  /**
   * The width this album last laid its rows at, remembered by the surface (a
   * cookie the server reads): the first paint lays that width's class at it
   * exactly, so its breaks are the measure's (`classWidths`).
   */
  firstPaintWidth?: number | null;
  /** The width the rows are laid at, whenever it changes (the surface remembers it, and words its steps by it). */
  onBoxWidth?: (width: number) => void;
}) {
  const gridEl = useRef<HTMLDivElement | null>(null);
  const [gridNode, setGridNode] = useState<HTMLDivElement | null>(null);
  const rootRef = useRef<ScrollRoot | null>(null);
  const [box, setBox] = useState<{ width: number; gap: number } | null>(null);
  const widths = useRef<{ width: number; at: number }[]>([]);
  const [view, setView] = useState<ViewBox | null>(null);
  // A touch scroll in flight (and whether this is a touch screen at all): a
  // change that needs a scroll waits for it to settle (see the head note).
  const [touch, setTouch] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  // The row the keyboard is in stays mounted wherever the reader scrolls.
  const [pinId, setPinId] = useState<string | null>(null);
  // A pinch's point, for the step change it asked for (`at`: the layout it saw).
  const [focal, setFocal] = useState<{ point: AnchorPoint; at: number } | null>(
    null,
  );
  // The last change whose scroll has been written.
  const [appliedVersion, setAppliedVersion] = useState(0);

  /**
   * ★ A SCROLL READS THE VIEW BY ARITHMETIC, NEVER OFF THE LAYOUT. The album's
   * top sits a fixed distance into its scroller's content (`offsetRef`), so the
   * view's top is the scroller's scroll offset less that distance. Reading a
   * rect in the scroll handler instead forced a layout mid-frame, every frame,
   * right after a commit had dirtied one (measured: 1.4s of a throttled phone's
   * ten-second fling). The distance is re-read off the layout where one is due
   * anyway (a measure, a written change) and once a scroll settles, which is
   * what catches content above the album changing size.
   */
  const offsetRef = useRef<number | null>(null);
  const readViewAt = useCallback((el: HTMLElement, root: ScrollRoot) => {
    const v = readView(el, root);
    offsetRef.current = scrollTopOf(root) - v.top;
    return v;
  }, []);

  // The width the rows are laid in, the gap as the box resolves it (the token
  // is a `max()`, which a custom property reads back as text), and the view.
  const measure = useCallback(() => {
    const el = gridEl.current;
    if (!el) return;
    rootRef.current = scrollRootOf(el);
    const measured = el.getBoundingClientRect().width;
    // A zero width is "not laid out" (a hidden tab, jsdom), never "a phone".
    if (measured > 0) {
      const recent = widths.current;
      if (recent[recent.length - 1]?.width !== measured)
        recent.push({ width: measured, at: performance.now() });
      if (recent.length > 3) recent.shift();
      const width = steadyWidth(recent);
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setBox((prev) =>
        prev && prev.width === width && prev.gap === gap
          ? prev
          : { width, gap },
      );
    }
    const v = readViewAt(el, rootRef.current);
    setView((prev) => (sameView(prev, v) ? prev : v));
  }, [readViewAt]);
  useLayoutEffect(() => {
    measure();
    const el = gridEl.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // The width the rows are laid at, whenever it changes (see `onBoxWidth`).
  const laidWidth = box?.width ?? null;
  useEffect(() => {
    if (laidWidth !== null) onBoxWidth?.(laidWidth);
  }, [laidWidth, onBoxWidth]);

  // THE VIEW, once a frame while the reader scrolls. Cheap by construction: the
  // rows below are rebuilt only when the mounted ranges change.
  useEffect(() => {
    const el = gridEl.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const coarse = win.matchMedia?.("(pointer: coarse)");
    const readTouch = () => setTouch(!!coarse?.matches);
    readTouch();
    coarse?.addEventListener?.("change", readTouch);
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (coarse?.matches) {
        setScrolling(true);
        clearTimeout(idle);
        idle = setTimeout(() => setScrolling(false), MOMENTUM_IDLE_MS);
      }
      if (frame) return;
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        const root = rootRef.current ?? win;
        const offset = offsetRef.current;
        const v =
          offset === null
            ? readViewAt(el, root)
            : { top: scrollTopOf(root) - offset, height: heightOf(root) };
        setView((prev) => (sameView(prev, v) ? prev : v));
        // Once the scroll settles, the distance is checked against the layout.
        clearTimeout(settle);
        settle = setTimeout(() => {
          const exact = readViewAt(el, rootRef.current ?? win);
          setView((prev) => (sameView(prev, exact) ? prev : exact));
        }, MOMENTUM_IDLE_MS);
      });
    };
    const root = rootRef.current ?? win;
    root.addEventListener("scroll", onScroll, { passive: true });
    // An album in a scroller still moves on screen with the page around it.
    if (root !== win)
      win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll);
    return () => {
      root.removeEventListener("scroll", onScroll);
      win.removeEventListener("scroll", onScroll);
      win.removeEventListener("resize", onScroll);
      coarse?.removeEventListener?.("change", readTouch);
      if (frame) win.cancelAnimationFrame(frame);
      clearTimeout(idle);
      clearTimeout(settle);
    };
  }, [readViewAt]);

  const slots = useMemo(() => headSlots(head), [head]);
  const slotsKey = useMemo(
    () => slots.map((h) => h.key).join("\u0000"),
    [slots],
  );
  const perRow = box ? perRowFor(box.width, step) : null;
  const feature: RowFeature = rhythm === "plain" ? "double" : rhythm;
  // By content: a poll that hands down an equal list lays nothing.
  const rowItems = useMemo(
    () =>
      rowItemsFor(
        items,
        clampAspect,
        rhythm !== "plain" && perRow !== null ? { seed, perRow } : null,
        slotsKey ? slotsKey.split("\u0000") : [],
        anchor,
      ),
    [items, clampAspect, rhythm, perRow, seed, slotsKey, anchor],
  );
  const byId = useMemo(
    () => new Map<string, T>(items.map((m) => [m.id, m] as const)),
    [items],
  );
  // THE PLAN THE SERVER DREW (`decodeFirstPaint`): read once, off the grid the
  // server rendered, by the grid's own id; none where no server drew one.
  const planId = useId();
  const [servedPlan] = useState(() => readServedPlan(planId));
  // Only until the box is measured: the first paint's rows, per width class, as
  // the server drew them when it drew this very list, else laid here.
  const plan = useMemo(() => {
    if (box) return null;
    const widths = classWidths(firstPaintWidth);
    const key = firstPaintKey(
      rowItems,
      step,
      rhythm,
      seed,
      anchor,
      feature,
      widths,
    );
    const served = decodeFirstPaint(servedPlan, rowItems, key);
    if (served && servedPlan) return { ...served, wire: servedPlan };
    const laid = firstPaintPlan(
      rowItems,
      step,
      rhythm,
      seed,
      anchor,
      feature,
      widths,
    );
    return { ...laid, wire: encodeFirstPaint(laid, rowItems, key) };
  }, [
    box,
    rowItems,
    step,
    rhythm,
    seed,
    anchor,
    feature,
    firstPaintWidth,
    servedPlan,
  ]);

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
    const params = !laid || laid.params !== paramsKey;
    // The rows the reader sees stay whole through any change outside them
    // (`reflowRows`' hold), so the anchor below rides a row that did not move
    // and its scroll leaves everything on screen where it was.
    const seen =
      laid && view && !params
        ? rowsInView(laid.tops, laid.layout.gap, view)
        : null;
    const r = reflowRows(
      laid?.layout ?? null,
      rowItems,
      {
        width: box.width,
        gap: box.gap,
        perRow,
        anchor,
        feature,
      },
      seen,
    );
    if (r.kind !== "none" || params) {
      const tops = rowTops(r.layout.rows, box.gap);
      // THE ANCHOR (see the head note): a pinch's photograph, else the first
      // photograph showing at the top once the reader is into the album (for a
      // step or a resize, anywhere past its top edge; for an arrival or a hide,
      // past its first row, so a reader at the head still watches it arrive).
      let shift = 0;
      const pinched = !!focal && !!laid && focal.at === laid.version;
      const deep =
        !!laid &&
        !!view &&
        (params
          ? view.top > 0
          : view.top > rowBottom(laid.tops, 0, laid.layout.gap));
      if (laid && (pinched || deep)) {
        const anchors = pinched
          ? [focal.point]
          : topAnchor(
              laid.layout.rows,
              laid.tops,
              laid.layout.gap,
              view!.top,
              isPhoto,
            );
        shift =
          anchorShift(
            anchors,
            { rows: laid.layout.rows, tops: laid.tops },
            { rows: r.layout.rows, tops },
          ) ?? 0;
      }
      const hold =
        !!laid &&
        holdForMomentum({
          touch,
          shift,
          sinceScroll: scrolling ? 0 : MOMENTUM_IDLE_MS,
        });
      if (!hold) {
        const sameWidth = !!laid && laid.layout.width === box.width;
        const fresh =
          r.kind === "local" && laid ? newIds(laid.items, rowItems) : NONE;
        current = {
          items: rowItems,
          byId,
          params: paramsKey,
          layout: r.layout,
          tops,
          version: (laid?.version ?? 0) + 1,
          glide:
            r.kind === "local" ||
            (r.kind === "full" &&
              ((r.reason === "params" && sameWidth) || r.reason === "tiny")),
          // Still pushing from a moment ago, and now these too.
          entering:
            fresh.size > 0 || (laid && laid.entering.size > 0)
              ? new Set([...(laid?.entering ?? []), ...fresh])
              : NONE,
          shift,
        };
        setLaid(current);
      }
    }
  }

  const layout = current?.layout ?? null;
  const tops = current?.tops ?? null;
  const version = current?.version ?? 0;
  const glide = current?.glide ?? false;

  // The scroll this change still owes the reader, until its layout effect pays it.
  const owed =
    current && current.version !== appliedVersion ? current.shift : 0;
  const pinRow =
    pinId && layout ? (rowIndex(layout.rows).get(pinId) ?? -1) : -1;
  const ranges = layout
    ? mountedRanges(
        tops && view
          ? windowRange(tops, { top: view.top + owed, height: view.height })
          : [0, Math.min(layout.rows.length - 1, 7)],
        pinRow >= 0 ? [pinRow] : [],
      )
    : [];
  const rangesKey = ranges.map((r) => `${r[0]}-${r[1]}`).join(",");

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

  // THE CHANGE, PAID FOR: the anchor's scroll first, then the glide, so every
  // tile glides from where it stood ON SCREEN; and the view re-read, so the
  // rows mounted are the rows now in view before anything is painted.
  useLayoutEffect(() => {
    if (!laid || laid.version === appliedVersion) return;
    const el = gridEl.current;
    const root = rootRef.current;
    if (laid.shift && el && root) {
      root.scrollBy({ top: laid.shift, behavior: "instant" });
      const v = readViewAt(el, root);
      setView((prev) => (sameView(prev, v) ? prev : v));
    }
    setAppliedVersion(laid.version);
    const was = snap.current;
    snap.current = null;
    if (!was || !laid.glide) return;
    runFlip(rowNodes(el), was, {
      scale: true,
      visibleOnly: true,
      duration: readCssMs("--arrival-glide-ms", ARRIVAL_GLIDE_MS, el),
      easing: "var(--arrival-glide-ease, var(--ease-in-out-strong))",
    });
  }, [laid, appliedVersion, readViewAt]);

  // The push lasts the glide, then the attribute goes (a tile scrolled out and
  // back must not replay it).
  useEffect(() => {
    if (!laid || laid.entering.size === 0) return;
    const v = laid.version;
    const t = setTimeout(
      () =>
        setLaid((l) =>
          l && l.version === v && l.entering.size > 0
            ? { ...l, entering: NONE }
            : l,
        ),
      readCssMs("--arrival-glide-ms", ARRIVAL_GLIDE_MS, gridEl.current) + 60,
    );
    return () => clearTimeout(t);
  }, [laid]);

  const slotByKey = useMemo(
    () => new Map(slots.map((h) => [HEAD_ID + h.key, h.node])),
    [slots],
  );
  // Only the first paint's photographs take the album's opening entrance: once
  // rows are laid, a tile mounts still (a window's scroll) or pushes in (an
  // arrival), never with a page that opened minutes ago.
  const fresh = !laid;

  const children = useMemo(() => {
    const out: ReactNode[] = [];
    const drawn = (
      id: string,
      style: CSSProperties,
      tile: Omit<RowTile, keyof RowTileBox>,
    ) => {
      const slot = slotByKey.get(id);
      if (slot !== undefined)
        return (
          <div
            key={id}
            role="listitem"
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
      // A change held back (a touch flick in flight) still draws a photograph
      // the list has just lost, until the change lands.
      const item =
        byId.get(id) ?? (current?.byId.get(id) as T | undefined) ?? null;
      return item ? renderTile(item, { style, rowsKey: id, ...tile }) : null;
    };

    if (layout && tops) {
      const sp = spacerHeights(tops, ranges, layout.gap);
      const spacer = (key: string, height: number) =>
        height > 0 ? (
          <div
            key={key}
            aria-hidden
            data-rows-spacer
            className="basis-full"
            style={{ height }}
          />
        ) : null;
      out.push(spacer("spacer:before", sp.before));
      ranges.forEach(([a, b], i) => {
        for (let r = a; r <= b; r++) {
          const row = layout.rows[r];
          row.ids.forEach((id, k) => {
            const w = row.widths[k];
            out.push(
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
                {
                  fresh,
                  entering: current?.entering.has(id) ?? false,
                  eager: r === 0,
                },
              ),
            );
          });
          if (r < b)
            out.push(
              <div
                key={`break:${row.ids[row.ids.length - 1]}`}
                aria-hidden
                data-row-break
                className="basis-full"
                style={{ height: "var(--gap-gallery)" }}
              />,
            );
        }
        if (i < sp.between.length)
          out.push(spacer(`spacer:${a}`, sp.between[i]));
      });
      out.push(spacer("spacer:after", sp.after));
      return out;
    }

    // The first paint (see `firstPaintPlan`): the first photographs on each
    // class's own breaks, each line justified by its shapes (a width in
    // proportion to its ratio, the height the line's), then a spacer for the rest.
    if (!plan) return out;
    rowItems.slice(0, plan.count).forEach((it, i) => {
      out.push(
        drawn(
          it.id,
          {
            flexGrow: it.ratio,
            flexBasis: 0,
            aspectRatio: it.ratio,
            minWidth: 0,
          },
          { fresh: true, entering: false, eager: i < 3 },
        ),
      );
      const classes = plan.breaksAfter.get(it.id);
      if (classes)
        out.push(
          <div
            key={`break:${it.id}`}
            aria-hidden
            data-row-break
            className={cn(
              "hidden basis-full",
              ...classes.map((c) => CLASS_BREAKS[c]),
            )}
            style={{ height: "var(--gap-gallery)" }}
          />,
        );
    });
    // A last line a class leaves unfinished keeps about the target height
    // rather than blowing its photographs up to the full width.
    out.push(
      <div
        key="rows-rest"
        aria-hidden
        className="h-0 basis-0"
        style={{ flexGrow: "var(--rows-fill)" }}
      />,
    );
    if (rowItems.length > plan.count)
      out.push(
        <div
          key="spacer:estimate"
          aria-hidden
          data-rows-spacer
          className="basis-full"
          style={{ height: "var(--rows-rest)" }}
        />,
      );
    return out;
    // `ranges` is read through its key: a new array for the same rows rebuilds nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    layout,
    tops,
    rangesKey,
    byId,
    slotByKey,
    renderTile,
    fresh,
    current,
    rowItems,
  ]);

  // THE LIST'S SIZE AND EACH ITEM'S PLACE, written on what is mounted (a window
  // mounts a slice, so a screen reader is told the whole album's size, and
  // where in it each photograph sits). Written here, not rendered: an arrival
  // renumbers every mounted tile, which as a prop would re-render them all.
  useLayoutEffect(() => {
    const el = gridEl.current;
    if (!el) return;
    const size = String(rowItems.length);
    const at = new Map(rowItems.map((it, i) => [it.id, i + 1] as const));
    el.querySelectorAll<HTMLElement>(":scope > [data-rows-key]").forEach(
      (node) => {
        const pos = at.get(node.dataset.rowsKey!);
        if (pos === undefined) return;
        if (node.getAttribute("aria-posinset") !== String(pos))
          node.setAttribute("aria-posinset", String(pos));
        if (node.getAttribute("aria-setsize") !== size)
          node.setAttribute("aria-setsize", size);
      },
    );
  }, [children, rowItems]);

  // What the window mounts, reported when it changes.
  const reported = useRef("");
  useEffect(() => {
    if (!onWindowChange || !layout) return;
    const ids: string[] = [];
    for (const [a, b] of ranges)
      for (let r = a; r <= b; r++)
        for (const id of layout.rows[r].ids) if (isPhoto(id)) ids.push(id);
    const key = ids.join(",");
    if (key === reported.current) return;
    reported.current = key;
    onWindowChange(ids);
    // `ranges` is read through its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, rangesKey, onWindowChange]);

  // For a deep link and the viewer's way back (see `AlbumHandle`).
  const latest = useRef({ laid });
  useEffect(() => {
    latest.current = { laid };
  });
  useImperativeHandle(
    handleRef,
    () => ({
      scrollToId(id: string) {
        const el = gridEl.current;
        if (!el) return null;
        const l = latest.current.laid;
        const root = rootRef.current ?? el.ownerDocument.defaultView ?? window;
        if (l) {
          const r = rowIndex(l.layout.rows).get(id);
          if (r === undefined) return null;
          const v = readView(el, root);
          const top = l.tops[r];
          const h = l.layout.rows[r].height;
          if (top < v.top || top + h > v.top + v.height)
            root.scrollBy({
              top: top - (v.height - h) / 2 - v.top,
              behavior: "instant",
            });
          // Mount the rows now in view, now: the caller wants the element back.
          flushSync(() => setView(readViewAt(el, root)));
        }
        return tileAt(el, id);
      },
    }),
    [readViewAt],
  );

  // The density gestures over the album, each anchored on the photograph
  // under it (`density-control.tsx`).
  useDensityGestures(onStepChange ? gridNode : null, {
    step,
    onStep: onStepChange
      ? (next, at) => {
          const el = gridEl.current;
          const l = latest.current.laid;
          const point = el ? focalAt(el, at) : null;
          if (point && l) setFocal({ point, at: l.version });
          onStepChange(next);
        }
      : undefined,
  });

  const setGrid = useCallback(
    (el: HTMLDivElement | null) => {
      gridEl.current = el;
      setGridNode(el);
      gridRef?.(el);
    },
    [gridRef],
  );

  // The keyboard's row stays mounted (see `pinId`).
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    gridProps?.onFocus?.(e);
    const key = (e.target as Element).closest?.<HTMLElement>("[data-rows-key]")
      ?.dataset.rowsKey;
    if (key) setPinId(key);
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    gridProps?.onBlur?.(e);
    const next = e.relatedTarget as Node | null;
    if (!next || !e.currentTarget.contains(next)) setPinId(null);
  };

  // Each width class's filler and rest, for the first paint's container
  // queries (`firstPaintPlan`). ★ FIRST PAINT ONLY: a custom property changed on
  // the grid restyles every one of its descendants, so none is written once the
  // rows are measured.
  const vars: Record<string, string | number> = {};
  if (!layout && plan)
    ROW_CLASSES.forEach((_, i) => {
      vars[`--rows-fill${i}`] = plan.fill[i];
      vars[`--rows-rest${i}`] = plan.rest[i];
    });

  return (
    <div className="@container w-full">
      <div
        {...gridProps}
        ref={setGrid}
        role="list"
        data-album-grid
        data-album-layout="rows"
        // The first paint's plan, for the hydration to draw with (`readServedPlan`).
        data-rows-plan-id={planId}
        data-rows-plan={!layout && plan ? plan.wire : undefined}
        // One placeholder in a session replay (masonry.tsx has why).
        data-sentry-block=""
        onFocus={onFocus}
        onBlur={onBlur}
        style={
          {
            ...vars,
            overflowAnchor: "none",
            // Two fingers are the album's (the density pinch), one is the page's.
            ...(onStepChange ? { touchAction: "pan-y" } : {}),
          } as CSSProperties
        }
        className={cn(
          "flex w-full flex-wrap gap-x-[var(--gap-gallery)]",
          "gap-y-0",
          !layout && ROWS_FIRST_PAINT,
          layout?.tiny && "justify-center",
        )}
      >
        {children}
      </div>
      <RowsSnapshot version={version} armed={glide} capture={capture} />
    </div>
  );
}
