import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * A PARTY'S ALBUM AT THE SCALE THAT LAGS: 1,145 photographs by default, the size
 * of the scale-probe event the lag was mapped on (Will: "Even our test event
 * with 1000+ lightweight items gets laggy on my MBP fast").
 *
 * ★ EVERY TILE IS ITS OWN IMAGE REQUEST. The stills are the fourteen bootstrap
 * photographs every board reuses, and each tile asks for its still under its own
 * query, so the browser fetches and decodes one image per tile, as it does for a
 * real album's presigned previews; one shared URL per still would be served
 * decoded from memory and hide exactly the cost being measured.
 *
 * ★ DETERMINISTIC. The same count deals the same album on the server and in the
 * browser (no hydration drift) and on every run (before and after compare the
 * same photographs): the shapes come from a fixed hash of the index, in a
 * party's proportions (mostly phone portraits, a landscape in five, a few 9:16
 * clips, the odd square).
 */
const SHAPES: readonly [number, number, number][] = [
  // [weight, width, height]
  [52, 3024, 4032],
  [10, 1080, 1920],
  [20, 4032, 3024],
  [6, 1920, 1080],
  [7, 3000, 3000],
  [5, 2000, 3000],
];
const TOTAL = SHAPES.reduce((n, [w]) => n + w, 0);

/** A stable hash of an index to [0, 1). */
function unit(i: number, salt: number): number {
  let h = Math.imul(i + 1, 2654435761) ^ Math.imul(salt + 7, 40503);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The photograph a scale album holds at `i`, under its own id prefix. */
export function scaleItem(i: number, prefix = "scale"): GridMedia {
  const still = MARKETING_IMAGES[i % MARKETING_IMAGES.length];
  let pick = unit(i, 1) * TOTAL;
  let shape = SHAPES[0];
  for (const s of SHAPES) {
    if (pick < s[0]) {
      shape = s;
      break;
    }
    pick -= s[0];
  }
  const src = `${still.src}?t=${prefix}-${i}`;
  return {
    id: `${prefix}-${String(i).padStart(5, "0")}`,
    // About one in sixteen is a clip, drawn from its poster as a real one is.
    type: unit(i, 2) < 0.06 ? "video" : "photo",
    url: src,
    previewUrl: src,
    downloadUrl: src,
    status: "approved",
    width: shape[1],
    height: shape[2],
  };
}

/** The whole album, newest first. */
export function scaleAlbum(count: number): GridMedia[] {
  return Array.from({ length: count }, (_, i) => scaleItem(i));
}
