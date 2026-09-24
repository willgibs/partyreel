import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING, THE SAME ONE (Maya and Jay's, hosted by Maya, 14 June):
 * `guest-capture`'s own world, and `reel-view`'s (its brief names the same
 * album by name). The reel round tells one story across its six boards; a
 * reader who has answered any of them recognises this album immediately.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT (guest-capture's own rule, carried here): a
 * board's directory dies at its ruling, so importing another board's fixtures
 * would tie this one's life to a folder it does not own. The facts repeat on
 * purpose.
 *
 * ★ ROUND TWO KEEPS THE ALBUM, DROPS THE ENGINE. Round one's `tile` ask
 * settled on the crossfade over the live canvas (ruled), so `engine.ts`,
 * `propsFor` and every `buildReelProps` fixture that fed it are gone with it
 * (git holds them): nothing still open here ever needs a live frame again.
 *
 * ★ THE STILLS ARE THE FOURTEEN MARKETING IMAGES EVERY BOARD REUSES (bible 9:
 * no new asset, nothing to track the rights of).
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  hostSlug: "maya",
  date: "14 June",
} as const;

const still = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length];

const GUEST_NAMES = ["Tom", "Sam", "Dan", "Aunt Bev", "Leah", "Ife", "Nina"];

/** One approved photograph, in the album's own GridMedia shape. */
function photo(i: number, id: string, uploaderName: string): GridMedia {
  const img = still(i);
  return {
    id,
    type: "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: img.width,
    height: img.height,
    uploaderName,
    isVerified: true,
  } satisfies GridMedia;
}

/** CHRONOLOGICAL, OLDEST FIRST: the order the party actually happened in.
 *  Twelve guests' worth. */
export const CHRONO_IDS: string[] = Array.from(
  { length: 12 },
  (_, i) => `rf-${i}`,
);
const CHRONO_BY_ID = new Map<string, GridMedia>(
  CHRONO_IDS.map((id, i) => [
    id,
    photo(i + 1, id, GUEST_NAMES[i % GUEST_NAMES.length]),
  ]),
);

/** The album as it sorts for real: newest first. This board's own album
 *  context under the tile, in `signature` and `badge` alike. */
export const ALBUM_IDS: string[] = [...CHRONO_IDS].reverse();

export const BY_ID = CHRONO_BY_ID;

/** GridMedia for a set of ids, in the order given (the gallery strip's own
 *  read: whatever order the caller wants is what renders). */
export function mediaFor(ids: string[]): GridMedia[] {
  return ids.map((id) => BY_ID.get(id)!).filter(Boolean);
}

/**
 * THE TAKE the reel plays: a curated 8, mixing subjects for a loop with real
 * variety. `signature`'s own ground: never the album's newest (round one's
 * crossfade drew exactly that, and reading identical to the grid beneath it
 * undid the very differentiation he asked for: "The different images
 * differentiate the reel vs album media stills").
 */
const TAKE_IDS = [
  "rf-11",
  "rf-2",
  "rf-8",
  "rf-5",
  "rf-0",
  "rf-9",
  "rf-3",
  "rf-6",
];

/** The take's own stills, in take order: what every `signature` option plays. */
export const TAKE_STILLS: string[] = mediaFor(TAKE_IDS).map((m) => m.url);
