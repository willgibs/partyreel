import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

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
 * ★ REAL ENGINE PIXELS, NOT A RE-TYPED RECIPE. `propsFor` is the same
 * `buildReelProps` the shipped composer calls (host-app.md: no second presign,
 * no RPC), over these fixture clips. `CanvasReelPlayer` draws every still and
 * every loop on this board: `frame` locks it to one frame where a caption
 * needs a still, omitted where the ask is genuinely about motion. Nothing here
 * touches a row, an RPC, an encode or an upload.
 *
 * ★ THE STILLS ARE THE FOURTEEN MARKETING IMAGES EVERY BOARD REUSES (bible 18:
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

/**
 * CHRONOLOGICAL, OLDEST FIRST: the order the party actually happened in, and
 * the order the `states` ask counts against ("the third reel-eligible item").
 * Twelve guests' worth, before the viewer's own upload exists.
 */
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

/** The album as it sorts for real: newest first. */
export const ALBUM_IDS: string[] = [...CHRONO_IDS].reverse();

/** The viewer's own fresh upload: landed after everything above, for the
 *  `yours` ask alone. Not a member of CHRONO_IDS/ALBUM_IDS: callers splice it
 *  in at the front so every other fixture is unaffected. */
export const MINE_ID = "rf-mine";
const MINE_MEDIA = photo(0, MINE_ID, "You");

export const BY_ID = new Map<string, GridMedia>([
  ...CHRONO_BY_ID,
  [MINE_ID, MINE_MEDIA],
]);

/** The album's ids up to and including `n` items (n = 0..12), newest-first:
 *  what the `states` ask's tile slot sees before the third item, and just
 *  after it. */
export function idsForCount(n: number): string[] {
  return CHRONO_IDS.slice(0, n).reverse();
}

/** GridMedia for a set of ids, in the order given (the gallery strip's own
 *  read: whatever order the caller wants is what renders). */
export function mediaFor(ids: string[]): GridMedia[] {
  return ids.map((id) => BY_ID.get(id)!).filter(Boolean);
}

/**
 * THE TAKE the engine plays: a curated 8, mixing subjects and orientations for
 * a loop with real variety in a short preview window. Ordering the actual live
 * take (uploader spread, likes, "yours first") is `reel-engine-live`'s job;
 * this board only needs a believable loop to judge a TILE against, never the
 * shuffle itself.
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

export const DEFAULT_STYLE_ID = "classic"; // Cinematic: the host's default mood (ruled)
const SEED = 481_516;

/**
 * The engine props for the living tile / the door's moving backdrop / the
 * closed-state loop. `orientation: "landscape"`: the tile is a full-bleed
 * horizontal band above the album (`event-experience.tsx`'s BLEED area), never
 * the portrait keepsake shape the old hero card owned.
 */
export function propsFor(
  opts: {
    ids?: string[];
    orientation?: Orientation;
    styleId?: string;
  } = {},
): ReelProps {
  const ids = opts.ids ?? TAKE_IDS;
  return buildReelProps({
    orderedIds: ids,
    byId: BY_ID,
    styleId: opts.styleId ?? DEFAULT_STYLE_ID,
    seed: SEED,
    orientation: opts.orientation ?? "landscape",
    watermark: false,
  });
}

/** A frame well past the opening transition, so a locked still carries the
 *  style's grade and its composition character (reel-studio's own precedent:
 *  frame 45 at 24fps, ~1.9s in). */
export const HERO_FRAME = 54;

/** The "one still" the door's third option shows: a single hero photograph,
 *  no engine, no grid: just the biggest, calmest picture in the pool. */
export const ONE_STILL = still(3);

/** The "nine stills" the door's shipped option shows: a plain grid, no engine,
 *  the album exactly as a locked/mid-itinerary guest already sees it today. */
export const NINE_STILLS: GridMedia[] = mediaFor(ALBUM_IDS.slice(0, 9));
