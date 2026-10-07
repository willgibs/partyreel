import { WORDMARK_PATH } from "@/lib/brand/wordmark";

import { FINISHED_DISPLAY, FINISHED_SMALL } from "./finished";
import { LOWERCASE } from "./lowercase";
import { NAMEPLATE } from "./nameplate";

/**
 * THE WORDMARKS ON THE TABLE, as drawings production's `Logo` can wear: each
 * one path in a box 64 units tall (production's), its width its own.
 *
 * `display` is the drawing from 48px up (a footer's large mark, a social
 * card, a poster); `small` is the cut production draws in its bars (22px) and
 * the admin's (16px). A redraw that needs no small cut gives the same drawing
 * twice.
 */
export type WordmarkId = "finished" | "nameplate" | "lowercase";

export type Drawing = { readonly d: string; readonly w: number };

export type Wordmark = {
  readonly id: WordmarkId;
  readonly display: Drawing;
  readonly small: Drawing;
};

export const WORDMARKS: Record<WordmarkId, Wordmark> = {
  finished: {
    id: "finished",
    display: FINISHED_DISPLAY,
    small: FINISHED_SMALL,
  },
  nameplate: { id: "nameplate", display: NAMEPLATE, small: NAMEPLATE },
  lowercase: { id: "lowercase", display: LOWERCASE, small: LOWERCASE },
};

/** Today's wordmark, his file as production draws it, for a before beside an after. */
export const AS_DRAWN: Drawing = { d: WORDMARK_PATH, w: 308 };

export const wordmarkOf = (v: unknown): WordmarkId =>
  v === "nameplate" || v === "lowercase" ? v : "finished";

/** Production's box: 308 units wide, so a wider drawing widens the svg and a narrower one sits at its left. */
const BOX = 308;

/**
 * THE PASTE A FRAME WEARS (the kit's `css`), so every production surface it
 * draws signs with this wordmark: production's `Logo` is one `svg` of one
 * `path`, sized by its height, so the paste gives the svg this drawing's
 * width and the path this drawing's shape, and nothing else changes.
 *
 * ★ THE SVG KEEPS ITS 308 BY 64 VIEWBOX, which a paste cannot touch: a wider
 * box (`aspect-ratio`) holds that viewBox centred at the same height, so the
 * drawing is moved left by half the extra width to start at the box's own
 * left edge, and `overflow: visible` lets it draw past the viewBox. A drawing
 * narrower than 308 keeps production's box and stands at its left.
 */
export function pasteFor(mark: Drawing): string {
  const w = Math.max(BOX, mark.w);
  const shift = (w - BOX) / 2;
  const d = shift
    ? mark.d.replace(
        /(-?\d+(?:\.\d+)?)([ ,])(-?\d+(?:\.\d+)?)/g,
        (_, x, sep, y) =>
          `${Math.round((Number(x) - shift) * 1000) / 1000}${sep}${y}`,
      )
    : mark.d;
  return [
    `svg[role="img"][aria-label="Partyreel"] { aspect-ratio: ${(w / 64).toFixed(4)} !important; overflow: visible; }`,
    `svg[role="img"][aria-label="Partyreel"] > path { d: path("${d}"); }`,
  ].join("\n");
}
