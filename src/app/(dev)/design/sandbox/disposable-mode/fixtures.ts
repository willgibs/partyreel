import type { GridMedia } from "@/components/app/media-grid";
import { PLANS, TIER_NAMES } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, THE DESK'S OWN, SHOT ON A DISPOSABLE (Maya and Jay's, hosted by
 * Maya, 14 June), and the guest the guest boards already follow: Priya, with a
 * confirmed email (Require verified emails is the default, and it is what
 * makes her count hers across phones: the carried call `count`).
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * rule, carried by every guest board since). A board's directory is deleted
 * the moment its ruling lands, so importing another board's fixtures would tie
 * this board's life to a folder it does not own.
 *
 * ★ TWO MOMENTS, NEVER TWO WORLDS. The party at 10:40 pm (142 shots from 12
 * guests, Priya six into her 24) and the morning after (214 shots from 14
 * guests). Every decision draws one of the two, so a flip between options
 * moves the thing asked and nothing else.
 *
 * ★ THE STILLS ARE THE TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no
 * new asset, nothing to track the rights of), at their own ratios.
 */

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  /** The date a disposable's back would print on every frame: 'YY M D. */
  stamp: "'26 6 14",
} as const;

export const HOST = { displayName: EVENT.host, seed: "dm-maya" } as const;
export const PRIYA = { name: "Priya", seed: "dm-priya" } as const;

/** The camera's defaults (the Orchestrator's first idea, the carried call `shots`). */
export const ROLL = {
  shots: 24,
  /** When the roll develops by default: the next morning. */
  develops: "9 am",
} as const;

/** 10:40 pm at the party. */
export const PARTY = {
  time: "10:40 pm",
  shots: 142,
  guests: 12,
  /** Priya's own, so far. */
  hers: 6,
} as const;

/** The morning after, once it has developed. */
export const MORNING = {
  time: "9:02 am",
  shots: 214,
  guests: 14,
} as const;

/**
 * WHAT A ROLL WEIGHS, the two sizes the price decision turns on.
 *
 * ★ THE FULL SIZE IS THE BRIEF'S: Will's new Free is 100 MB, "about 30 photos
 * at iPhone defaults", so a phone's photo is about 3 MB (and a 24-shot,
 * 10-guest roll about 700 MB, the brief's own figure).
 *
 * ★ THE LAB SIZE IS MEASURED, NOT GUESSED: the six real test photographs in
 * `partyreel-test-media/images` re-encoded at a 1600 px long edge (JPEG 82)
 * average 254 KB plain and 368 KB with the film grain baked in (the lane's
 * scratch log, `measure-shot.log`). 0.4 MB is that, rounded up, so every
 * estimate below is on the safe side of a real night's noisier shots.
 *
 * ★ FREE'S 100 MB IS pricing-wiring's, NOT tiers.ts's YET: `tiers.ts` still
 * says 2 GB until that lane merges, so the number is written here, once,
 * with its source. The Event Pass is read from `tiers.ts` itself.
 */
export const MB = 1024 * 1024;
export const FREE_BYTES = 100 * MB;
export const FULL_SHOT_BYTES = 3 * MB;
export const LAB_SHOT_BYTES = 0.4 * MB;

const PASS = PLANS.find((p) => p.id === "event_pass")!;
export const EVENT_PASS = {
  name: TIER_NAMES.event_pass,
  /** "$24", from its "$24 one-time" label. */
  price: PASS.priceLabel.split(" ")[0],
  gb: Math.round(PASS.storageBytes / 1024 ** 3),
} as const;

const PRO = PLANS.find((p) => p.id === "pro_100")!;
export const PRO_100 = { name: PRO.name, price: PRO.priceLabel } as const;

/** POV's free line (pov.camera: "Free for events under 10 people"). */
export const POV_FREE_GUESTS = 10;

/** How many shots a Free event develops at a size, rounded to a friendly figure. */
export function freeShots(bytesPerShot: number): number {
  const n = Math.floor(FREE_BYTES / bytesPerShot);
  // Said as a person would: "about 30", "about 250".
  return n >= 100 ? Math.floor(n / 50) * 50 : Math.floor(n / 5) * 5;
}

/** How many whole rolls of `shots` those are. */
export function freeRolls(bytesPerShot: number, shots: number): number {
  return Math.floor(Math.floor(FREE_BYTES / bytesPerShot) / shots);
}

/** A still, by its marketing id, as the rows and the viewfinder draw it. */
export type Still = { id: string; src: string; width: number; height: number };

const still = (id: string): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, width: m.width, height: m.height };
};

/** What the viewfinder is pointed at: the toast under the string lights. */
export const SCENE = still("wedding-toast");

/** Her seventh shot, framed in the viewfinder the moment after (the dance floor). */
export const NEXT_SCENE = still("party-dj");

/**
 * THE ROLL, AS IT DEVELOPS: newest first, the way the album's rows lay it.
 * Nine stills of the wedding; the festival pair stay out (not this party).
 */
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

/** Priya's own six, the ones `waiting=hers` shows her alone. */
export const HER_STILLS: readonly Still[] = [
  "wedding-toast",
  "wedding-petals",
  "reception-table",
  "wedding-rings",
  "party-balloons",
  "wedding-arch",
].map(still);

export const asMedia = (s: Still, i: number): GridMedia => ({
  id: `dm-${s.id}-${i}`,
  type: "photo",
  url: s.src,
  downloadUrl: s.src,
  status: "approved",
  width: s.width,
  height: s.height,
});

/**
 * THE UNDEVELOPED FRAMES, newest first: the time each was taken and its shape
 * (the server knows a shot's size the moment it lands, so a frame can hold the
 * shot's own shape while showing nothing of it). `mine` marks Priya's.
 */
export type Frame = {
  id: string;
  time: string;
  ratio: number;
  mine?: boolean;
};

export const FRAMES: readonly Frame[] = [
  { id: "f142", time: "10:39", ratio: 3 / 2 },
  { id: "f141", time: "10:38", ratio: 2 / 3, mine: true },
  { id: "f140", time: "10:36", ratio: 3 / 2 },
  { id: "f139", time: "10:35", ratio: 3 / 2 },
  { id: "f138", time: "10:33", ratio: 3 / 2, mine: true },
  { id: "f137", time: "10:31", ratio: 2 / 3 },
  { id: "f136", time: "10:30", ratio: 3 / 2 },
  { id: "f135", time: "10:28", ratio: 3 / 2 },
  { id: "f134", time: "10:26", ratio: 3 / 2 },
  { id: "f133", time: "10:25", ratio: 2 / 3 },
];

/** The shots of the last hour, under `reveal=hour`: they develop an hour on. */
export const LAST_HOUR: readonly Frame[] = [
  { id: "h1", time: "10:39", ratio: 3 / 2 },
  { id: "h2", time: "10:38", ratio: 2 / 3, mine: true },
  { id: "h3", time: "10:31", ratio: 3 / 2 },
  { id: "h4", time: "10:12", ratio: 3 / 2 },
];
