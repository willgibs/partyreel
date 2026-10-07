import { ringMonoSvg, ringSvg } from "./ring.ts";
import { WORDMARK_DISPLAY } from "./wordmark.ts";

/**
 * EVERY SVG FILE THE BRAND'S MARKS ARE SHIPPED IN, AND WHAT DRAWS EACH: the
 * one table `scripts/build-press-kit.mjs` writes from and `marks.test.ts`
 * holds the committed files to, byte for byte, so a mark changed at its
 * source and not redrawn fails a test that names the script. The rasters
 * (the favicon, the app icons, every PNG) are drawn from these by the script.
 * Imports named in full, so a bare Node script can load the table.
 */

/** The kit's two inks: near-black for a light ground, white for a dark one. */
const INK = "#101010";
const WHITE = "#ffffff";

/**
 * The wordmark as a file: the display cut (the kit is drawn large), its box
 * 512 tall at eight units a pixel, one path in one fill. ★ ITS SHAPE IS READ:
 * `scripts/build-email-wordmark.mjs` parses this file's `d`, `fill` and
 * `viewBox` for the mail's head, so they stay plain attributes of one path.
 */
function wordmarkSvg(fill: string): string {
  const w = WORDMARK_DISPLAY;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${w.viewBox}" width="${Math.round(w.width * 8)}" height="512" role="img" aria-label="Partyreel">\n  <path d="${w.d}" fill="${fill}"/>\n</svg>\n`;
}

export type BrandFile = {
  /** The file, from the repository's root. */
  readonly path: string;
  /** Its bytes, drawn from the sources now. */
  readonly svg: () => string;
};

const KIT: readonly BrandFile[] = [
  // The icon on its dark tile, for a light ground (the tile is the dark its light needs).
  {
    path: "kit/logo/partyreel-mark-dark.svg",
    svg: () => ringSvg({ size: 1024 }),
  },
  // The Ring alone, its light and its puck, for a dark ground of the reader's own.
  {
    path: "kit/logo/partyreel-mark-light.svg",
    svg: () => ringSvg({ size: 1024, shape: "bare" }),
  },
  // One ink on any ground.
  {
    path: "kit/logo/partyreel-mark-mono.svg",
    svg: () => ringMonoSvg({ size: 1024, ink: INK }),
  },
  { path: "kit/logo/partyreel-wordmark-dark.svg", svg: () => wordmarkSvg(INK) },
  {
    path: "kit/logo/partyreel-wordmark-light.svg",
    svg: () => wordmarkSvg(WHITE),
  },
];

export const BRAND_FILES: readonly BrandFile[] = [
  // The favicon a browser draws in a tab: a tab's cut, on its tile in a home screen's corner.
  { path: "src/app/icon.svg", svg: () => ringSvg({ size: 16 }) },
  ...KIT,
  // The press kit carries the brand kit's files byte for byte.
  ...KIT.map((f) => ({
    ...f,
    path: f.path.replace("kit/logo/", "public/press/"),
  })),
];
