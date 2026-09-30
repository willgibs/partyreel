import {
  AVG_PHOTO_BYTES,
  MEGABYTE,
  PLANS,
  TIER_NAMES,
  VIDEO_BYTES_PER_MIN,
} from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, THE DESK'S OWN, SHOT ON A DISPOSABLE (Maya and Jay's, hosted by
 * Maya, 14 June), and the guest the guest boards already follow: Priya, with
 * a confirmed email.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every guest board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * another board's fixtures would tie this board's life to a folder it does
 * not own.
 *
 * ★ TWO MOMENTS, NEVER TWO WORLDS. The party at 10:40 pm (142 shots from 12
 * guests, Priya six into her 24) and the morning after (214 shots from 14
 * guests, developed at 9 am). Every decision draws one of the two, so a flip
 * between options moves the thing asked and nothing else.
 *
 * ★ THE STILLS ARE THE TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible 9:
 * no new asset, nothing to track the rights of), at their own ratios. Each
 * one stands in for the live camera's picture or for a developed shot.
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  /** The date a disposable's back would print on every frame: 'YY M D. */
  stamp: "'26 6 14",
  address: "partyreel.com/e/maya-jay",
} as const;

export const HOST = { displayName: EVENT.host, seed: "dm-maya" } as const;
export const PRIYA = { name: "Priya", seed: "dm-priya" } as const;

/** The roll, as settled: 24 shots each, developed at 9 the next morning. */
export const ROLL = {
  shots: 24,
  develops: "9 am",
} as const;

/** 10:40 pm at the party. */
export const PARTY = {
  time: "10:40 pm",
  shots: 142,
  guests: 12,
  /** Priya's own, so far. */
  hers: 6,
  /** Until 9 am, from 10:40 pm. */
  until: "10 h 20 min",
} as const;

/** Her shots left at 10:40 pm. */
export const LEFT = ROLL.shots - PARTY.hers;

/** The morning after, once it has developed. */
export const MORNING = {
  time: "9:02 am",
  shots: 214,
  guests: 14,
  /** Priya's own, by the end of the night. */
  hers: 21,
  /** Of the 214, the videos: a paid event's, with the host's Videos switch on. */
  videos: 9,
} as const;

/* ── what a shot weighs, off tiers.ts (its one home) ─────────────────────── */

const PASS = PLANS.find((p) => p.id === "event_pass")!;
export const EVENT_PASS = {
  name: TIER_NAMES.event_pass,
  /** "$24", from its "$24 one-time" label. */
  price: PASS.priceLabel.split(" ")[0],
  gb: Math.round(PASS.storageBytes / 1024 ** 3),
} as const;

/** The camera's longest video (the carried call `ten`). */
export const VIDEO_SECONDS = 10;

/**
 * A video's room in photos, off the estimates tiers.ts already makes (1080p
 * at 30 fps, a 24 MP HEIF photo): 10 seconds is about 10.8 MB, three photos.
 */
export const VIDEO_PHOTOS = Math.round(
  ((VIDEO_BYTES_PER_MIN / 60) * VIDEO_SECONDS) / AVG_PHOTO_BYTES,
);
export const VIDEO_MB = Math.round(
  ((VIDEO_BYTES_PER_MIN / 60) * VIDEO_SECONDS) / MEGABYTE,
);

/* ── the stills ──────────────────────────────────────────────────────────── */

/** A still, by its marketing id, as the rows and the cameras draw it. */
export type Still = { id: string; src: string; width: number; height: number };

const still = (id: string): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, width: m.width, height: m.height };
};

/** What the camera is pointed at: the toast under the string lights. */
export const SCENE = still("wedding-toast");

/** Her seventh shot's next subject, framed the moment after (the dance floor). */
export const NEXT_SCENE = still("party-dj");

/** The roll, developed: newest first, the way the album's rows lay it. */
export const ROLL_STILLS: readonly Still[] = [
  "wedding-toast",
  "party-dj",
  "wedding-petals",
  "reception-table",
  "wedding-golden",
  "concert-confetti",
  "wedding-rings",
  "reception-hall",
  "wedding-arch",
  "party-balloons",
].map(still);

/**
 * PRIYA'S SIX, newest first, each with the minute it was taken. One of them
 * is a video on a paid event (`video`), which the video decisions draw.
 */
export type Shot = {
  id: string;
  still: Still;
  time: string;
  /** Seconds, for a video. */
  video?: number;
};

export const HER_SHOTS: readonly Shot[] = [
  { id: "s6", still: still("wedding-petals"), time: "10:33" },
  { id: "s5", still: still("reception-table"), time: "10:18" },
  { id: "s4", still: still("party-dj"), time: "9:55", video: 6 },
  { id: "s3", still: still("wedding-rings"), time: "9:20" },
  { id: "s2", still: still("party-balloons"), time: "8:47" },
  { id: "s1", still: still("wedding-arch"), time: "8:12" },
];

/** The guests whose shots land while Priya is in the waiting room. */
export const ARRIVALS = ["Theo", "Ana", "Sam", "Jo", "Leah"] as const;
