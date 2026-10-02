import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * EVERY PHOTOGRAPH THE BOARD DRAWS, AS A CROP OF ONE OF THE TWELVE STILLS.
 *
 * ★ NO NEW ASSET (bible 9): every board reuses the bootstrap stills, and forty
 * covers from twelve photographs would read as twelve covers three times. So
 * each cover is a CROP (a position and a zoom), the way a real album's
 * photographs differ: the table's flowers, the bouquet in the low sun, the
 * confetti's top corner.
 *
 * ★ THE CROP RIDES THE URL'S FRAGMENT, BECAUSE PRODUCTION DRAWS THE PICTURES.
 * The tiles, the stage and the rows are production's own components, and each
 * takes a plain url (`coverUrl`, `stills`, a stage photo's `url`) into an
 * `object-cover` image it owns. A fragment (`#hd-<crop>`) is never fetched, so
 * every crop of a still is one download, and it is the one thing an attribute
 * selector can find on an image the board did not draw: `cropRules()` gives each
 * crop its `object-position` and zoom, drawn into every frame (`shell.tsx`).
 */

type Crop = { still: string; pos: string; zoom: number };

const crop = (still: string, pos = "50% 50%", zoom = 1): Crop => ({
  still,
  pos,
  zoom,
});

/** Every crop, by a name that says what it shows. */
const CROPS = {
  confetti: crop("concert-confetti"),
  confettiSky: crop("concert-confetti", "25% 25%", 1.8),
  confettiHands: crop("concert-confetti", "60% 85%", 1.7),
  confettiLights: crop("concert-confetti", "85% 30%", 1.8),
  stage: crop("festival-crowd"),
  stageGlow: crop("festival-crowd", "50% 35%", 1.7),
  stageCrowd: crop("festival-crowd", "30% 85%", 1.8),
  lights: crop("festival-lights"),
  lightsLeft: crop("festival-lights", "20% 40%", 1.8),
  lightsRight: crop("festival-lights", "70% 30%", 1.7),
  balloons: crop("party-balloons"),
  balloonsLeft: crop("party-balloons", "30% 30%", 1.9),
  balloonsRight: crop("party-balloons", "75% 25%", 1.8),
  dj: crop("party-dj"),
  djDeck: crop("party-dj", "70% 60%", 1.7),
  djSmoke: crop("party-dj", "20% 40%", 1.8),
  hall: crop("reception-hall"),
  hallCentre: crop("reception-hall", "35% 60%", 1.7),
  hallWindows: crop("reception-hall", "75% 40%", 1.8),
  table: crop("reception-table"),
  tableFlowers: crop("reception-table", "55% 40%", 1.8),
  tablePlates: crop("reception-table", "80% 70%", 1.7),
  arch: crop("wedding-arch"),
  archFlowers: crop("wedding-arch", "45% 45%", 1.7),
  archDrape: crop("wedding-arch", "70% 50%", 1.8),
  golden: crop("wedding-golden"),
  goldenBouquet: crop("wedding-golden", "55% 60%", 1.6),
  goldenLight: crop("wedding-golden", "35% 40%", 1.7),
  rings: crop("wedding-rings"),
  ringsHands: crop("wedding-rings", "40% 40%", 1.8),
  ringsBouquet: crop("wedding-rings", "35% 75%", 1.7),
  toast: crop("wedding-toast"),
  toastLights: crop("wedding-toast", "45% 30%", 1.7),
  toastGlass: crop("wedding-toast", "80% 55%", 1.8),
  petals: crop("wedding-petals"),
  petalsKiss: crop("wedding-petals", "50% 40%", 1.6),
} as const satisfies Record<string, Crop>;

export type CropId = keyof typeof CROPS;

/** A crop's url: its still's, with the crop named in the fragment. */
export function photo(id: CropId): string {
  return `${marketingImage(CROPS[id].still).src}#hd-${id}`;
}

/**
 * The rules that draw each crop: a position and a zoom on the image that wears
 * its fragment. Unlayered, so production's utilities never outrank them; the
 * zoom grows from the crop's own point, inside the box production clips.
 */
export function cropRules(): string {
  return Object.entries(CROPS)
    .filter(([, c]) => c.zoom !== 1 || c.pos !== "50% 50%")
    .map(
      ([id, c]) =>
        `img[src$="#hd-${id}"]{object-position:${c.pos};transform:scale(${c.zoom});transform-origin:${c.pos}}`,
    )
    .join("\n");
}
