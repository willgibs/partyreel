"use client";

/**
 * WHAT LANDED OUT OF SIGHT, SAID (album-order, Will's question on customize r1's `order`: "when a new media
 * item/batch lands not first into the gallery, what is that animation and how does it constantly impact a user's
 * gallery experience when they are scrolled down? Don't want anything new to push out what they're looking at").
 *
 * The rows already hold the reader's place by hand (`album-window.tsx`: nothing she is looking at moves, Safari
 * included, a flick's momentum waited out), so an arrival never pushes her photographs away: it lands where the
 * album's order puts it (the head of a newest-first album, the end of one in order, mid-album for a late approval or
 * a late upload taken at the party) and glows if she can see it. This is the other half: ONE QUIET PILL, "12 new",
 * shown only when arrivals land where she cannot see them, with the arrow the way they lie, and one press that takes
 * her to the top of the nearest landing.
 *
 * ★ A LANDING IS ITS RUN OF ROWS, AND REACHING ANY OF IT CLEARS IT. Counting photographs off one by one as they
 * scrolled past would leave "↓ 180 new" under a reader working down through the very batch it announced, so the
 * unseen arrivals are grouped by row (rows that each hold one, side by side, are one landing) and a landing clears
 * whole the moment one of its rows is in view, whether the pill took her there or her own scroll did. Landings on
 * both sides count together; the arrow points to the nearer.
 *
 * ★ UNDER THE BAR, NEVER OVER THE ALBUM'S HEAD. It stands under whatever chrome is stuck to the top of the screen
 * (the hub's header and its stuck cards band, a guest's select bar, the demo's pinned header: `barBottom` finds it by
 * hit-testing, so no surface has to say), and only once she is past the album's first row, so it never covers the
 * head an arrival lands in, nor the cover above the album.
 *
 * ★ ONLY WHAT THE SURFACE CALLS AN ARRIVAL (`AlbumNews.arrivals`): another guest's photograph, a late approval, a
 * restore; never the seed and never this device's own upload (the sweep says hers). An arrival is judged once, when
 * it first stands in the rows (an arrival held at the door, `use-arrival-gate.ts`, is judged when it is let in), and
 * a lens's change (a filter) brings in no arrival: what it reveals was already in the album.
 *
 * Opt-in: a surface that provides no `AlbumNews` (the bin, the personal feeds, the marketing stage) draws no pill.
 */
import { createContext } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

import { ArrowDown, ArrowUp } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/** What a surface tells its album about arrivals, for the pill. */
export type AlbumNews = {
  /**
   * Every id the album's grammar calls an arrival, append-only, in arrival order: never the seed, never this device's
   * own landing (the guest's `arrivalMarks().arrived`, the hub's `useHubArrivals`).
   */
  arrivals: readonly string[];
  /**
   * The lens the reader sees the album through (a guest's filter): what enters the rows with a new lens is no
   * arrival, it was in the album all along.
   */
  lens?: string;
};

export const AlbumNewsContext = createContext<AlbumNews | null>(null);

/* ────────────────────────────── arithmetic ────────────────────────────── */

/** One landing: a run of adjacent rows that each hold an unseen arrival, and those arrivals. */
export type Landing = {
  readonly first: number;
  readonly last: number;
  readonly ids: readonly string[];
};

/** The unseen arrivals as landings, top to bottom, from where each sits (its row). */
export function landingsOf(
  rowOfUnseen: ReadonlyMap<string, number>,
): Landing[] {
  const byRow = new Map<number, string[]>();
  for (const [id, r] of rowOfUnseen) {
    const at = byRow.get(r);
    if (at) at.push(id);
    else byRow.set(r, [id]);
  }
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const out: { first: number; last: number; ids: string[] }[] = [];
  for (const r of rows) {
    const run = out[out.length - 1];
    if (run && r === run.last + 1) {
      run.last = r;
      run.ids.push(...byRow.get(r)!);
    } else out.push({ first: r, last: r, ids: [...byRow.get(r)!] });
  }
  return out;
}

/** What the reader can see of the album, in its own coordinates: under the bar, down to the screen's foot. */
export type Band = { readonly top: number; readonly bottom: number };

/**
 * WHETHER A ROW IS IN VIEW: at least a third of it inside the band (a row peeking a few pixels over the foot, or
 * tucked under the bar, is not seen), or the whole band inside it (a feature row taller than the screen).
 */
export function rowInView(
  tops: Float64Array,
  gap: number,
  r: number,
  band: Band,
): boolean {
  const top = tops[r];
  const bottom = tops[r + 1] - gap;
  const overlap = Math.min(bottom, band.bottom) - Math.max(top, band.top);
  if (overlap <= 0) return false;
  return overlap >= (bottom - top) / 3 || overlap >= band.bottom - band.top - 1;
}

/** Whether any row of a landing is in view: reaching one row of it reaches it all. */
export function landingReached(
  landing: Landing,
  tops: Float64Array,
  gap: number,
  band: Band,
): boolean {
  for (let r = landing.first; r <= landing.last; r++)
    if (rowInView(tops, gap, r, band)) return true;
  return false;
}

/** What the pill says: how many, which way, and where a press goes (the nearest landing). */
export type Pill = {
  readonly count: number;
  readonly dir: "up" | "down";
  readonly to: Landing;
};

/** The pill for the landings still unseen, or null. The arrow points to the nearest; the count is all of them. */
export function pillFor(
  landings: readonly Landing[],
  tops: Float64Array,
  gap: number,
  band: Band,
): Pill | null {
  if (landings.length === 0) return null;
  let count = 0;
  let best: { landing: Landing; dir: "up" | "down"; distance: number } | null =
    null;
  for (const landing of landings) {
    count += landing.ids.length;
    const top = tops[landing.first];
    const bottom = tops[landing.last + 1] - gap;
    const up = bottom <= band.top + (band.bottom - band.top) / 2;
    const distance = up ? band.top - bottom : top - band.bottom;
    if (!best || distance < best.distance)
      best = { landing, dir: up ? "up" : "down", distance };
  }
  return { count, dir: best!.dir, to: best!.landing };
}

/** Whether the album's first row has gone under the bar: the pill never stands over the album's head. */
export function pastHead(tops: Float64Array, gap: number, band: Band): boolean {
  return tops.length > 1 && band.top >= tops[1] - gap;
}

/** The hit-test's step and reach: chrome is found to four pixels, and never further down than this share. */
const BAR_STEP_PX = 4;
const BAR_MAX_SHARE = 0.4;

/** Whether an element is, or sits inside, chrome stuck to the screen (fixed or sticky), and not the pill itself. */
function isStuckChrome(
  el: Element | null,
  known: Map<Element, boolean>,
): boolean {
  const win = el?.ownerDocument.defaultView;
  const path: Element[] = [];
  let answer = false;
  for (let node = el; node && win; node = node.parentElement) {
    const seen = known.get(node);
    if (seen !== undefined) {
      answer = seen;
      break;
    }
    path.push(node);
    if (node.hasAttribute("data-album-news")) break;
    const position = win.getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      answer = true;
      break;
    }
  }
  for (const node of path) known.set(node, answer);
  return answer;
}

/**
 * HOW FAR DOWN THE SCREEN THE STUCK CHROME REACHES at x (px from the viewport's top): walked down four pixels at a
 * time while what is drawn there sits in something fixed or sticky (the hub's header, then its stuck band; a guest's
 * select bar). A layer that takes no pointer (the band's empty footprint below its cards) is no chrome, which is the
 * point of a hit test rather than reading boxes. 0 where nothing is stuck (a guest's album scrolls its header away),
 * and in an engine with no hit-testing.
 */
export function barBottom(doc: Document, x: number): number {
  const win = doc.defaultView;
  if (!win || typeof doc.elementFromPoint !== "function") return 0;
  const limit = Math.round(win.innerHeight * BAR_MAX_SHARE);
  // One walk up the tree per element met, however many steps land on it.
  const known = new Map<Element, boolean>();
  let y = 0;
  while (y < limit && isStuckChrome(doc.elementFromPoint(x, y), known))
    y += BAR_STEP_PX;
  return y;
}

/* ──────────────────────────────── the pill ─────────────────────────────── */

/** The pill's air under the bar, px. */
const PILL_GAP_PX = 12;

/**
 * THE PILL, drawn into the document's own body (a fixed box inside the album would be placed by any transformed
 * ancestor, and the develop raises the album's rows with a transform): the Review room's "N new" in the same glass
 * (`review-section.tsx`), one grammar for a count of what landed, under the bar where the Review's floats over its
 * grid. Quick in, as an occasional thing is (bible 5), and simply there under reduced motion.
 */
export function AlbumNewsPill({
  doc,
  pill,
  top,
  onGo,
}: {
  doc: Document;
  pill: Pill;
  /** Where the bar ends, px from the viewport's top. */
  top: number;
  onGo: (pill: Pill, viaKeyboard: boolean) => void;
}) {
  const Arrow = pill.dir === "up" ? ArrowUp : ArrowDown;
  return createPortal(
    <div
      data-album-news=""
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
      style={{
        top: `calc(${top + PILL_GAP_PX}px + env(safe-area-inset-top, 0px))`,
      }}
    >
      <button
        type="button"
        data-album-news-pill={pill.dir}
        onClick={(e: ReactMouseEvent<HTMLButtonElement>) =>
          // A keyboard's press is a click with no pointer behind it (detail 0): it lands at once, with focus.
          onGo(pill, e.detail === 0)
        }
        className={cn(
          "pointer-events-auto flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-white outline-none",
          "transition-[background-color,transform] duration-150 ease-emphasis hover:bg-white/10 focus-halo active:scale-95 motion-reduce:active:scale-100",
          "animate-in duration-200 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none",
          GLASS,
        )}
      >
        {/* Its words carry their own light, as every glyph on glass does (`GLASS_MARK_LIT`). */}
        <span
          className={cn(
            "flex items-center gap-1.5 tabular-nums",
            GLASS_MARK_LIT,
          )}
        >
          <Arrow className="size-4" aria-hidden />
          {formatCount(pill.count)} new
        </span>
        <span className="sr-only">
          {pill.dir === "up" ? ", above. Show them" : ", below. Show them"}
        </span>
      </button>
    </div>,
    doc.body,
  );
}
