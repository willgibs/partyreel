import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE STAND-IN ALBUM: forty photographs, shaped like a phone's camera roll.
 *
 * The twelve marketing stills are the only photographs the repo holds (the real
 * set is the Higgsfield month's), and eleven of them are 3:2 landscapes. A
 * party album is not: a guest's phone shoots 3:4 portraits most of the time,
 * then the odd landscape, a 9:16 screen-height shot, a square. So each still is
 * DECLARED at one of those shapes and `MediaTile`'s `object-cover` crops it,
 * which is exactly what the real album does with a real upload. Without this
 * the masonry would read as a brick wall of landscapes and every tile-size
 * option would look shorter than it is.
 *
 * ★ FORTY, BECAUSE THE WIDEST OPTION IS TEN COLUMNS. CSS columns flow
 * column-major and balance the heights, so the first screen at 1920 is the top
 * of every column; forty photographs keep ten columns taller than the window.
 *
 * ★ THE ORDER IS SEARCHED, NOT CYCLED. Twelve stills over forty tiles repeat
 * whatever the order, and a plain cycle lines its repeats up: the tops of two
 * columns land twelve items apart and the same photograph sits twice in one
 * row (found on the first capture, 2026-09-18). This order was searched
 * against the positions Chrome itself gave every tile in all 36 layouts the
 * board draws (both galleries, every tile, width and window), read out of the
 * frames: in their first screens no still sits beside itself, and it sits two
 * or more columns from itself about half as often as under the cycle. Twelve
 * stills will always repeat somewhere at ten columns; the real album (the
 * Higgsfield month's) will not.
 */
const ORDER = [
  2, 0, 10, 8, 11, 4, 1, 6, 9, 3, 5, 11, 7, 4, 8, 2, 10, 6, 9, 0, 1, 3, 8, 5,
  11, 7, 4, 2, 0, 1, 6, 9, 5, 8, 10, 7, 2, 3, 0, 11,
] as const;

/** The shapes a phone's camera roll holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/** 19 portraits at 3:4, 4 tall at 9:16, 8 landscapes, 3 squares, 3 at 4:5
 *  and 3 wide at 16:9: about two thirds of the roll stands up, as a guest's
 *  phone shoots it. */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPPWPLTPFPLPSPWLP";

export const ALBUM: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  return {
    id: `gw-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w * 400,
    height: h * 400,
  } satisfies GridMedia;
});

/** The host's event, as the guest page and the host's page both name it. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  date: "2026-06-14",
  guests: 23,
} as const;
