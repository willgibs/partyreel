/**
 * THE marketing media manifest (Track B, F2) — the ONE source every marketing surface reads for
 * curated media, demo fixtures, and rendered reel loops. Nothing under `public/marketing/` may be
 * referenced except through an entry here, and nothing may live there without one (both directions
 * are pinned by marketing-media.test.ts). Why: Will's FINAL media lands later as a pure swap
 * (replace files + entries; components never change).
 *
 * Reel entries carry their full render recipe: the engine is deterministic per
 * (clips, styleId, seed, orientation), so any recorded loop re-renders byte-for-byte after a media
 * swap (the T2.5 cluster-5 convention). Shot boundaries are exact 1/24s multiples, in seconds; the
 * hero derives its active shot STATELESSLY from video.currentTime against them.
 *
 * THE BOOTSTRAP 12 ARE STAND-INS, copied in from the dev lab pack as placeholders. The final set is
 * generated (one Higgsfield month, docs/ROADMAP.md) and lands as that swap. A replacement keeps the
 * id of the still it replaces, or every blog cover moves under its published post, and the two
 * recorded reels then re-render from the new stills.
 *
 * ★ NO ENTRY CARRIES A CREDIT LINE, and the type has no field for one, so none can come back with
 * the generated set. An image on the site is one we hold the rights to, and no agent tracks
 * subjects, sources or permissions (Will, 2026-09-17, docs/design/rulings.md).
 */

export type MarketingOrientation = "landscape" | "portrait";

export type MarketingImage = {
  /** Stable id; components and reel recipes reference THIS, never the path. */
  id: string;
  /** Site-relative path under public/. */
  src: string;
  width: number;
  height: number;
  orientation: MarketingOrientation;
  /** Honest content description (verified by eye at intake, not inherited from filenames). */
  subject: string;
};

export type MarketingReel = {
  id: string;
  /** The served mp4 (post-ffmpeg finish) under public/marketing/reels/. */
  src: string;
  /** The LCP poster under public/marketing/posters/. */
  poster: string;
  orientation: MarketingOrientation;
  durationSeconds: number;
  /** Shot-cut times in seconds (1/24s multiples), first shot starting at 0. */
  shotBoundaries: number[];
  /** The deterministic render recipe: re-run it and the engine reproduces the source exactly. */
  recipe: {
    styleId: string;
    seed: number;
    /** MarketingImage ids, in clip order. */
    clipIds: string[];
    /** The engine bitrate the 1080 source was rendered at. */
    sourceBitrate: number;
    /** The ffmpeg finishing step applied to the served file (scale/bitrate/trim/faststart). */
    finish: string;
    renderedAt: string;
  };
};

export const MARKETING_IMAGES: readonly MarketingImage[] = [
  {
    id: "wedding-golden",
    src: "/marketing/img/mkt-wedding-golden-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Wedding couple with bouquet in golden-hour flare",
  },
  {
    id: "reception-table",
    src: "/marketing/img/mkt-reception-table-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Reception long table, glassware and bright florals",
  },
  {
    id: "party-balloons",
    src: "/marketing/img/mkt-party-balloons-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Pastel balloons with ribbons at a birthday party",
  },
  {
    id: "concert-confetti",
    src: "/marketing/img/mkt-concert-confetti-01.jpg",
    width: 800,
    height: 534,
    orientation: "landscape",
    subject: "Confetti falling over a night concert crowd, blue light",
  },
  {
    id: "wedding-rings",
    src: "/marketing/img/mkt-wedding-rings-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Hands with wedding rings over a peach bouquet",
  },
  {
    id: "reception-hall",
    src: "/marketing/img/mkt-reception-hall-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Banquet hall with blue and white streamers, yellow flowers",
  },
  {
    id: "party-dj",
    src: "/marketing/img/mkt-party-dj-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "DJ over a packed nightclub floor, disco ball and smoke",
  },
  {
    id: "wedding-toast",
    src: "/marketing/img/mkt-wedding-toast-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Champagne toast at a reception under string lights",
  },
  {
    id: "festival-lights",
    src: "/marketing/img/mkt-festival-lights-01.jpg",
    width: 800,
    height: 600,
    orientation: "landscape",
    subject: "Festival arena in rainbow lasers and glitter",
  },
  {
    id: "festival-crowd",
    src: "/marketing/img/mkt-festival-crowd-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Outdoor festival crowd against a warm stage glow",
  },
  {
    id: "wedding-arch",
    src: "/marketing/img/mkt-wedding-arch-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Wedding arch florals and draped fabric against open sky",
  },
  {
    id: "wedding-petals",
    src: "/marketing/img/mkt-wedding-petals-01.jpg",
    width: 700,
    height: 1050,
    orientation: "portrait",
    subject: "Couple kissing under falling petals, wedding party around",
  },
];

/**
 * Rendered reel loops. CANDIDATES ONLY so far (rendered from the bootstrap set for the hero
 * substrate lab round); finals re-render from the generated set when it lands. Boundaries were extracted from planReel for the exact recipe (transition
 * midpoints; frame-exact at 24fps).
 */
export const MARKETING_REELS: readonly MarketingReel[] = [
  {
    id: "hero-candidate-01",
    src: "/marketing/reels/hero-candidate-01.mp4",
    poster: "/marketing/posters/hero-candidate-01.jpg",
    orientation: "portrait",
    durationSeconds: 13.083333333333334,
    shotBoundaries: [0, 2.375, 4.5, 6.541666666666667, 8.666666666666666, 10.75],
    recipe: {
      styleId: "classic",
      seed: 73,
      clipIds: [
        "wedding-golden",
        "party-balloons",
        "festival-crowd",
        "wedding-petals",
        "party-dj",
        "wedding-toast",
      ],
      sourceBitrate: 4_000_000,
      finish: "ffmpeg scale=720:1280 b:v 2200k yuv420p +faststart -an",
      renderedAt: "2026-08-25",
    },
  },
  {
    id: "hero-candidate-02",
    src: "/marketing/reels/hero-candidate-02.mp4",
    poster: "/marketing/posters/hero-candidate-02.jpg",
    orientation: "landscape",
    durationSeconds: 8.25,
    shotBoundaries: [0, 2.1666666666666665, 4.125, 6],
    recipe: {
      styleId: "golden",
      seed: 73,
      clipIds: ["festival-lights", "festival-crowd", "concert-confetti", "party-dj"],
      sourceBitrate: 4_000_000,
      finish: "ffmpeg scale=1280:720 b:v 2200k yuv420p +faststart -an",
      renderedAt: "2026-08-25",
    },
  },
];

const IMAGE_BY_ID = new Map(MARKETING_IMAGES.map((m) => [m.id, m]));

/** Lookup that throws on a bad id, so a typo fails a test instead of rendering a broken frame. */
export function marketingImage(id: string): MarketingImage {
  const entry = IMAGE_BY_ID.get(id);
  if (!entry) throw new Error(`Unknown marketing image id: ${id}`);
  return entry;
}

/** Cheap membership test for schema refinements (blog frontmatter `cover`) — same Map as the
 *  lookup above, so there is still exactly one id registry. Client-safe like the rest of this file. */
export function isMarketingImageId(id: string): boolean {
  return IMAGE_BY_ID.has(id);
}
