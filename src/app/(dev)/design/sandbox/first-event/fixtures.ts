import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE HOST, ONE FIRST EVENT: the fixtures every option on this board is drawn
 * on.
 *
 * Rosa finished the welcome ninety seconds ago. She has never made an event.
 * The wedding is in eleven days, the venue puts cards on nine tables, and the
 * only thing standing between her and a hundred guests' photographs is getting
 * a code out of a browser and onto paper. That is the whole of this round.
 *
 * ★ THE TOKEN IS A REAL ONE, 32 HEX, because the code's MODULE COUNT is set by
 * the length of what it encodes and every measured number on this board reads
 * off the rendered code. A short stand-in would draw a sparser code than the
 * product ships and the board would be arguing about the wrong square.
 * `PLACEHOLDER_URL` is the one the shipped wizard previews against
 * (`previewJoinUrl`, 32 zeroes), kept here so the style step can be drawn
 * exactly as it ships: the same density as the real code, and a dead link.
 */

/* ── The host ────────────────────────────────────────────────────────────── */

export const HOST = {
  name: "Rosa Delgado",
  initial: "R",
  /** What she is on when she opens the app for the first time. */
  plan: "Free",
} as const;

/* ── The event she is making ─────────────────────────────────────────────── */

export const EVENT = {
  name: "Rosa & Theo's Wedding",
  /** How the app writes a date (`formatEventDate`'s output shape). */
  dateLabel: "Saturday, 11 October",
  /** What the optional third field would hold, if she filled it in. */
  note: "Anything you shoot tonight, we want it.",
  token: "7b41e9c0d8a24f6e93b5c1027ad4e8f6",
} as const;

/** The link the code encodes: one per event, the qr_token and never the slug. */
export const JOIN_URL = `https://partyreel.com/e/${EVENT.token}`;

/**
 * ★ THE LINK THE SHIPPED WIZARD'S STYLE STEP ACTUALLY PREVIEWS (share-urls.ts,
 * `previewJoinUrl`): 32 zeroes, so the density is right and the destination
 * does not exist. A host who scans the code on step two to see whether it works
 * reaches a 404. That is a seam this board draws rather than describes.
 */
export const PLACEHOLDER_URL = `https://partyreel.com/e/${"0".repeat(32)}`;

/** The pretty alias the slug control offers on the shipped share step. */
export const SLUG_URL = "partyreel.com/rosa-and-theo";

/* ── The event she already has, on the Free plan ─────────────────────────── */

/**
 * The limit decision's world: Rosa is on Free, Free holds one event, and she
 * made this one in June. The wedding would be her second, and today the app
 * lets her fill the whole wizard in before it says so.
 */
export const EXISTING = {
  name: "Theo's 30th",
  dateLabel: "Saturday, 21 June",
  cover: MARKETING_IMAGES[2].src,
  items: 64,
} as const;

/* ── The photographs ─────────────────────────────────────────────────────── */

const shot = (i: number, w: number, h: number, id: string): GridMedia => ({
  id,
  type: "photo",
  url: MARKETING_IMAGES[i % MARKETING_IMAGES.length].src,
  downloadUrl: MARKETING_IMAGES[i % MARKETING_IMAGES.length].src,
  status: "approved",
  width: w,
  height: h,
});

/**
 * THE FIRST ONE. A guest's phone, held upright, at the top of the table: one
 * photograph, and the album is no longer empty. Every option on the last
 * decision is drawn against exactly this arriving.
 */
export const FIRST: GridMedia = shot(0, 1200, 1600, "first");

/** Who took it, as the tile's attribution would read it. */
export const FIRST_BY = "Marta" as const;
