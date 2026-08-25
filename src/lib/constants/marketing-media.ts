/**
 * THE marketing media manifest (Track B, F2) — the ONE source every marketing surface reads for
 * curated media, demo fixtures, and rendered reel loops. Nothing under `public/marketing/` may be
 * referenced except through an entry here, and nothing may live there without one (both directions
 * are pinned by marketing-media.test.ts). Why: the interim set is license-audited per entry, and
 * Will's FINAL media lands later as a pure swap (replace files + entries; components never change).
 *
 * Reel entries carry their full render recipe: the engine is deterministic per
 * (clips, styleId, seed, orientation), so any recorded loop re-renders byte-for-byte after a media
 * swap (the T2.5 cluster-5 convention). Shot boundaries are exact 1/24s multiples, in seconds; the
 * hero derives its active shot STATELESSLY from video.currentTime against them.
 *
 * PROVENANCE: the bootstrap 12 were copied from public/design/ (the dev lab pack). Their license
 * line is deliberately honest about the gap; final hero loops must re-render from batch-OK'd media
 * BEFORE milestone-4 ships (the plan's provenance gate).
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
  credit: {
    /** License or provenance status. Never empty; "…unverified" entries block the M4 gate. */
    license: string;
    author?: string;
    sourceUrl?: string;
    /** ISO date the file was retrieved, for batch-sourced entries. */
    retrieved?: string;
  };
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
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "reception-table",
    src: "/marketing/img/mkt-reception-table-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Reception long table, glassware and bright florals",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "party-balloons",
    src: "/marketing/img/mkt-party-balloons-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Pastel balloons with ribbons at a birthday party",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "concert-confetti",
    src: "/marketing/img/mkt-concert-confetti-01.jpg",
    width: 800,
    height: 534,
    orientation: "landscape",
    subject: "Confetti falling over a night concert crowd, blue light",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "wedding-rings",
    src: "/marketing/img/mkt-wedding-rings-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Hands with wedding rings over a peach bouquet",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "reception-hall",
    src: "/marketing/img/mkt-reception-hall-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Banquet hall with blue and white streamers, yellow flowers",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "party-dj",
    src: "/marketing/img/mkt-party-dj-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "DJ over a packed nightclub floor, disco ball and smoke",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "wedding-toast",
    src: "/marketing/img/mkt-wedding-toast-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Champagne toast at a reception under string lights",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "festival-lights",
    src: "/marketing/img/mkt-festival-lights-01.jpg",
    width: 800,
    height: 600,
    orientation: "landscape",
    subject: "Festival arena in rainbow lasers and glitter",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "festival-crowd",
    src: "/marketing/img/mkt-festival-crowd-01.jpg",
    width: 900,
    height: 600,
    orientation: "landscape",
    subject: "Outdoor festival crowd against a warm stage glow",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "wedding-arch",
    src: "/marketing/img/mkt-wedding-arch-01.jpg",
    width: 900,
    height: 601,
    orientation: "landscape",
    subject: "Wedding arch florals and draped fabric against open sky",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
  {
    id: "wedding-petals",
    src: "/marketing/img/mkt-wedding-petals-01.jpg",
    width: 700,
    height: 1050,
    orientation: "portrait",
    subject: "Couple kissing under falling petals, wedding party around",
    credit: { license: "unsplash (per lab-pack comment; provenance unverified)" },
  },
];

/** Rendered reel loops. Empty until the first render session records its recipes (Track B F4). */
export const MARKETING_REELS: readonly MarketingReel[] = [];

const IMAGE_BY_ID = new Map(MARKETING_IMAGES.map((m) => [m.id, m]));

/** Lookup that throws on a bad id, so a typo fails a test instead of rendering a broken frame. */
export function marketingImage(id: string): MarketingImage {
  const entry = IMAGE_BY_ID.get(id);
  if (!entry) throw new Error(`Unknown marketing image id: ${id}`);
  return entry;
}
