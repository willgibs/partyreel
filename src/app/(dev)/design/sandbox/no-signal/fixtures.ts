import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE NIGHT WITH NO SIGNAL: MAYA & JAY'S WEDDING (the site's own fictional
 * album, the one every board follows), its reception in a vineyard's barn,
 * whose dance floor has a bar of signal on a good minute and whose cellar has
 * none. Priya is the guest whose send the album's questions draw; Sam is the
 * guest on the album's camera whose roll the roll's question draws.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so what this board shares with
 * presence (the wedding, its stills) is retyped here rather than imported.
 *
 * ★ THE STILLS ARE THE BOOTSTRAP TWELVE (`MARKETING_IMAGES`), local files, so
 * nothing here waits on a network or a presign. ★ THE CLOCK IS THE NIGHT'S:
 * every time a frame names is a fixture (the line drops at 11:42 pm and comes
 * back at 12:40 am, in the car park), never the reader's clock.
 */

export const WEDDING = {
  name: "Maya & Jay's Wedding",
  host: { name: "Maya", seed: "maya-lin" },
  photos: 142,
  guests: 38,
  date: "2026-09-12",
  /** The album's own three hues (its stills' sampled light), as production's dock hands the shutter. */
  hues: [52, 67, 248] as const,
} as const;

/** A still's id: one of the bootstrap twelve. */
export type StillId =
  | "wedding-golden"
  | "reception-table"
  | "party-balloons"
  | "concert-confetti"
  | "wedding-rings"
  | "reception-hall"
  | "party-dj"
  | "wedding-toast"
  | "festival-lights"
  | "festival-crowd"
  | "wedding-arch"
  | "wedding-petals";

export type Still = {
  id: StillId;
  src: string;
  /** Width over height. */
  ratio: number;
  /** Where the subject sits, for a crop (`object-position`). */
  focus: string;
};

/**
 * A still, at its own shape or the shape a phone took it in (`ratio`): a party's
 * album is mostly a phone's portrait frames, so most stand-ins here are laid at
 * 3:4 and cropped like the album crops (`object-cover`), never stretched.
 */
export const still = (
  id: StillId,
  focus = "50% 50%",
  ratio?: number,
): Still => {
  const m = marketingImage(id);
  return { id, src: m.src, ratio: ratio ?? m.width / m.height, focus };
};

/** A phone's portrait frame. */
const PORTRAIT = 3 / 4;

/**
 * PRIYA'S THREE, sent together from the dance floor at 11:41 pm: the toast
 * lands, and the line drops as the dance floor goes up, the confetti behind it.
 * Each carries the name her phone gave it, as the failure sheet prints one.
 */
export type Sent = { still: Still; name: string };

export const LANDED: Sent = {
  still: still("wedding-toast", "40% 50%", PORTRAIT),
  name: "IMG_4127.HEIC",
};

export const UNSENT: readonly Sent[] = [
  { still: still("party-dj", "50% 40%", PORTRAIT), name: "IMG_4128.HEIC" },
  {
    still: still("concert-confetti", "50% 50%", PORTRAIT),
    name: "IMG_4129.HEIC",
  },
];

/**
 * THE ONE SHE SENDS AT 11:44 PM, STILL WITH NO CONNECTION (the drop's second
 * moment): whether a container lets a party keep adding is what its `matters`
 * line is about.
 */
export const ONE_MORE: Sent = {
  still: still("festival-crowd", "50% 45%", PORTRAIT),
  name: "IMG_4131.HEIC",
};

/**
 * Where the second photo's bytes stood when the line dropped. ★ A photograph
 * goes up as one PUT (`part-plan.ts`: a single PUT under 100 MB), so a drop at
 * 38% sends it again from the start: no frame draws a bar held at 38%, since
 * that would promise progress the line's return throws away.
 */
export const DROPPED_AT = 38;

/** The album as Priya opens it, newest first (everyone's, before hers land). */
export const ALBUM: readonly Still[] = [
  still("wedding-petals", "50% 30%"),
  still("reception-hall", "50% 50%", PORTRAIT),
  still("wedding-golden", "45% 45%", PORTRAIT),
  still("reception-table"),
  still("wedding-rings", "55% 50%", PORTRAIT),
  still("wedding-arch", "50% 40%", PORTRAIT),
  still("festival-lights"),
  still("party-balloons", "50% 50%", PORTRAIT),
  still("festival-crowd", "50% 50%", PORTRAIT),
  still("wedding-golden", "45% 45%"),
  still("reception-table", "60% 50%", PORTRAIT),
  still("wedding-rings"),
];

/** The cover's still (production dissolves through several; the board holds one). */
export const COVER = still("reception-table", "50% 62%");

/* ── the camera: Sam's roll in the cellar ──────────────────────────────── */

/**
 * SAM'S ROLL: 24 frames, 20 spent and landed before he goes down to the
 * cellar, where he takes six more. The finder is the cellar's tasting table;
 * each shot freezes on a still of its own.
 */
export const ROLL = {
  cap: 24,
  /** Frames spent and landed before the cellar. */
  before: 20,
  /** Shots he presses in the cellar, as many as his roll lets him. */
  cellar: 6,
} as const;

export const FINDER = still("reception-table", "50% 55%");

/** The shots he takes in the cellar, in order, each a still of its own. */
export const CELLAR_SHOTS: readonly Still[] = [
  still("wedding-rings"),
  still("wedding-golden"),
  still("wedding-petals"),
  still("festival-crowd"),
  still("party-balloons"),
  still("reception-hall"),
];

/** The develop: tomorrow at 9 am, the morning after (a fixture, so the camera's sub-line never reads the clock). */
export const DEVELOPS_AT = "2026-09-13T09:00:00-07:00";
