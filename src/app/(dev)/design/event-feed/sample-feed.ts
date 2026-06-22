import type { GridMedia } from "@/components/app/media-grid";

// Lab-only sample media for the event-feed prototype. Cycles the /design/pNN.jpg
// fixtures with varied aspect ratios so the masonry reads like a real gallery
// (tall enough to scroll, which is what makes the sticky/floating pill behavior
// feelable). NOT shipped data - the real feed gets RSC-resolved presigned items.
const IMAGES = Array.from(
  { length: 11 },
  (_, i) => `/design/p${String(i + 1).padStart(2, "0")}.jpg`,
);

const RATIOS: [number, number][] = [
  [1200, 1600],
  [1920, 1080],
  [1600, 1200],
  [1000, 1000],
  [1080, 1920],
  [1500, 1000],
  [1400, 1050],
  [1080, 1350],
];

export function sampleTiles(count: number, prefix: string): GridMedia[] {
  return Array.from({ length: count }, (_, i) => {
    const [width, height] = RATIOS[i % RATIOS.length];
    return {
      id: `${prefix}-${i}`,
      type: "photo",
      url: IMAGES[(i + prefix.length) % IMAGES.length],
      status: "approved",
      width,
      height,
    };
  });
}

export const GALLERY_TILES = sampleTiles(18, "gallery");
export const REEL_TILES = sampleTiles(6, "reel");
export const REVIEW_TILES = sampleTiles(11, "review");
