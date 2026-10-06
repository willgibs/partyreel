import { marketingImage } from "@/lib/constants/marketing-media";
import { ROLL_SHOTS } from "@/lib/disposable/roll";

/**
 * ONE PARTY, ONE GUEST, ONE NIGHT OF PHOTOGRAPHS: Maya & Jay's wedding (the
 * site's own fictional album, the one every board follows), Priya the guest
 * whose night the four moments are.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so its fixtures are retyped here.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset), local files, so nothing here waits on a network or a presign.
 */

export const HOST = { name: "Maya", seed: "guest-moments-maya" } as const;
export const PRIYA = { name: "Priya", seed: "guest-moments-priya" } as const;

/** A day `days` from today, as the calendar prints it (`YYYY-MM-DD`), in the reader's clock. */
function dayFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** An instant tomorrow at an hour of the reader's clock: the develop the camera counts to. */
function tomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const WEDDING = {
  name: "Maya & Jay's Wedding",
  /** Tonight: every moment here is the party's own night. */
  date: dayFromToday(0),
  /** 9 am the morning after: production's own default (`defaultDevelopAt`). */
  developsAt: tomorrowAt(9),
} as const;

export type Photo = {
  /** Unique on the board: a still may stand twice under two keys. */
  key: string;
  src: string;
  /** Width over height, as the album's rows lay it. */
  ratio: number;
  /** Where the photograph's subject sits, for a crop. */
  focus: string;
};

const photo = (id: string, key = id, focus = "50% 50%"): Photo => {
  const m = marketingImage(id);
  return { key, src: m.src, ratio: m.width / m.height, focus };
};

/**
 * THE ALBUM AS PRIYA OPENS IT, NEWEST FIRST (production's own order): what
 * the guests have sent by the dancing, the toast at the top.
 */
export const ALBUM: readonly Photo[] = [
  photo("wedding-toast"),
  photo("reception-hall"),
  photo("reception-table"),
  photo("wedding-golden", "wedding-golden", "45% 45%"),
  photo("wedding-petals", "wedding-petals", "50% 30%"),
  photo("wedding-rings"),
  photo("wedding-arch", "wedding-arch", "50% 40%"),
  photo("festival-lights"),
];

/** Priya's first photo of the night, and her third an hour on. */
export const HER_FIRST = photo("party-balloons", "priya-first");
export const HER_THIRD = photo("party-dj", "priya-third");
/** Her second, between them: already in the album when the third lands. */
export const HER_SECOND = photo("festival-crowd", "priya-second");

/**
 * SIX FROM THE OTHER GUESTS AT ONCE: what one tick of the album's batch
 * (`ALBUM_BATCH_MS`, about 15 s) brings at the dance floor's peak. The last
 * is the slow one, a photograph not drawn yet when the batch lands.
 */
export const BATCH: readonly Photo[] = [
  photo("concert-confetti", "batch-1"),
  photo("party-dj", "batch-2"),
  photo("festival-crowd", "batch-3"),
  photo("party-balloons", "batch-4"),
  photo("wedding-golden", "batch-5", "45% 45%"),
  photo("festival-lights", "batch-6"),
];

/** The cover's stills, which are the reel's opening pass (production reads them off the reel's take). */
export const COVER: readonly Photo[] = [
  ALBUM[3]!,
  ALBUM[0]!,
  ALBUM[4]!,
  ALBUM[1]!,
];

/** The reel's first photograph: the cover's first still, which the take opens on. */
export const REEL_FIRST = COVER[0]!;

/** The camera's live picture: the toast under the string lights. */
export const IN_THE_FINDER = ALBUM[0]!;

/** Her shots on the camera, newest last: what Your shots lists (all sealed till the develop). */
export const HER_SHOTS: readonly Photo[] = [
  photo("wedding-arch", "shot-1", "50% 40%"),
  photo("wedding-rings", "shot-2"),
  photo("reception-table", "shot-3"),
  photo("wedding-toast", "shot-4"),
  photo("party-dj", "shot-5"),
  photo("concert-confetti", "shot-6"),
];

/** Her roll: production's own size unless a host names another (`ROLL_SHOTS`). */
export const ROLL = ROLL_SHOTS;

/** The album's count, as its cover says it. */
export const ALBUM_COUNT = 142;
