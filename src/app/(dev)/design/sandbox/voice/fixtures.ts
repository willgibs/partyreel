import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE STAND-IN EVENT every surface on this board shows, so a line is read
 * against one album rather than against six different ones.
 *
 * The counts are the demo numbers the site already quotes and are never the
 * thing being judged here: the album is furniture, the sentence over it is the
 * candidate. Twelve marketing stills are all the repo holds (the real set is
 * the Higgsfield month's), declared at a phone's own shapes so the guest
 * masonry reads like a camera roll rather than a wall of landscapes.
 */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  date: "2026-06-14",
  photos: 23,
  guests: 8,
} as const;

/** The shapes a phone's camera roll holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
} as const;

/** Sixteen tiles: enough to fill two columns past a 375 screen's fold. */
const ROLL = "PLPTPSPLPPTLPSLP";
const ORDER = [2, 0, 10, 8, 11, 4, 1, 6, 9, 3, 5, 7, 4, 8, 2, 10];

export const ALBUM: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  return {
    id: `vce-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w * 400,
    height: h * 400,
  } satisfies GridMedia;
});
