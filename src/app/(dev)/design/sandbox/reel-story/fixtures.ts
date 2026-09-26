import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { holdScaleFor } from "@/lib/guest/reel-prefs";
import { DEFAULT_HOLD_SEC } from "@/lib/reel/defaults";
import { DEFAULT_STYLE_ID } from "@/lib/reel/engine/style-registry";
import type { LiveMediaItem } from "@/lib/reel/live/items";

import { EVENT, GALLERY_ITEMS } from "../gallery-fixtures";

/**
 * THE DEMO ALBUM, AS THE LIVE REEL READS IT.
 *
 * ★ THE SAME STAND-IN EVERY REEL-ROUND BOARD PLAYS. `gallery-fixtures.ts` is
 * the one shared album (Mia & Theo's Wedding), never duplicated: eighteen
 * approved items, the same four uploaders. This board draws it as the
 * marketing site's demo album, the framing the event door and the home teaser
 * already give a stand-in today.
 *
 * ★ THE REAL SHAPES, NOT THE MASONRY'S. The gallery fixture declares a tile
 * RATIO per item (4:5, 16:10...) so a grid gets a mix of shapes out of twelve
 * stills; the live reel frames each clip by its real shape (portrait or
 * landscape decides how a mood places it), so this reads each still's own
 * pixels off the manifest instead.
 *
 * ★ LOCAL STILLS, ON PURPOSE. The real demo album's photographs are presigned
 * R2 urls, and R2 answers no CORS to localhost, so on a local lab its reel
 * draws black (measured on /e/<demo>?reel, 2026-09-25). The manifest's stills
 * are same-origin, so every frame here plays on the real engine anywhere.
 *
 * The look is the view's own default: the default mood at the default hold, on
 * the wall surface the view plays at (`live-reel-view.tsx`).
 */

const BY_SRC = new Map(MARKETING_IMAGES.map((img) => [img.src, img]));

/** An evening's uploads, newest first, one every twenty minutes. */
const EVENT_START = Date.parse(`${EVENT.date}T18:00:00.000Z`);

export const DEMO_ITEMS: LiveMediaItem[] = GALLERY_ITEMS.map(
  (m: GridMedia, i) => {
    const still = BY_SRC.get(m.url);
    return {
      id: m.id,
      type: "photo",
      url: m.url,
      previewUrl: m.previewUrl ?? m.url,
      width: still?.width ?? m.width ?? null,
      height: still?.height ?? m.height ?? null,
      status: "approved",
      createdAt: new Date(
        EVENT_START + (GALLERY_ITEMS.length - i) * 1_200_000,
      ).toISOString(),
      uploaderKey: m.uploaderKey ?? null,
      uploaderName: m.uploaderName ?? null,
      isHost: m.isHost ?? false,
    };
  },
);

/** One event id for every source, so every option plays the same take. */
export const DEMO_EVENT_ID = "demo-album";

export const LIVE_STYLE_ID = DEFAULT_STYLE_ID;
export const LIVE_HOLD_SCALE = holdScaleFor(DEFAULT_HOLD_SEC, LIVE_STYLE_ID);

/** The album's counts, read off the fixture (a caption quotes them). */
export const DEMO_COUNTS = {
  items: DEMO_ITEMS.length,
  guests: new Set(DEMO_ITEMS.map((m) => m.uploaderKey)).size,
};

export { EVENT };
