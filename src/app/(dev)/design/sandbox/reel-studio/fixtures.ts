import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * ONE WEDDING, ONE REEL, AND NOT ONE BYTE OF PRODUCTION.
 *
 * Every picture on this board is the same event: Maya and Jay's wedding, 148
 * photographs from 19 guests, eight of them already in the reel. What moves
 * between options is the ROOM and the act, never the reel itself, so a decision
 * is never secretly a decision about which photographs are in the cut.
 *
 * ★ NOTHING HERE TOUCHES A ROW, AN RPC OR AN ENCODE. A clip's url is a local
 * marketing still standing in for the presigned R2 preview the real Studio
 * hands the engine. `buildReelProps` is pure (host-app.md: no second presign,
 * no RPC), so the props below are the same shape the shipped player renders and
 * the encoder steps, built from fixtures. `ReelProvider`, `useReelConfig`,
 * `runClientEncode` and every reel API are never imported by this board: they
 * fire real writes on any mounted event id, which is the one thing a preview
 * may never do.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE MARKETING STILLS, RE-SHAPED. They are the
 * only stills the repo holds (the real set is the Higgsfield month's) and
 * eleven of the twelve are 3:2 landscapes, which a party album is not. Each is
 * DECLARED at a shape a phone actually shoots, so the picker's 4:5 tiles crop
 * them exactly as they crop a real upload and `fitClip` frames them in the reel
 * exactly as it frames a real one.
 */

/** The shapes a phone's camera roll holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

type ShapeKey = keyof typeof SHAPES;

const still = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length];

const shaped = (letter: string): [number, number] => {
  const [w, h] = SHAPES[letter as ShapeKey];
  return [w * 400, h * 400];
};

/** The event, as every surface names it. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  date: "2026-06-14",
  guests: 19,
  /** What the album holds; the picker's pool below is its first screen. */
  photos: 148,
} as const;

/**
 * THE POOL the Moments picker draws: the event's visible media, which is
 * approved PLUS hidden (host-app.md's membership predicate). Two are hidden,
 * because a hidden photograph is the tile the reel cannot take and that is a
 * decision on this board.
 */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPFPTLP";
const ORDER = [
  2, 9, 0, 7, 11, 4, 5, 1, 3, 6, 8, 10, 0, 4, 2, 9, 10, 1, 6, 5, 7, 11, 3, 8, 1,
  7, 4, 11, 2, 6,
] as const;
/** Which of the pool are hidden, and which carry a like count a host would read. */
const HIDDEN = new Set([2, 9]);
const LIKES: Record<number, number> = {
  0: 12,
  2: 7,
  3: 9,
  6: 4,
  9: 14,
  12: 3,
  14: 6,
  19: 5,
};

export const POOL: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = still(ORDER[i]);
  const [width, height] = shaped(letter);
  return {
    id: `rs-${i}`,
    type: i === 11 || i === 22 ? "video" : "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: HIDDEN.has(i) ? "hidden" : "approved",
    width,
    height,
    likeCount: LIKES[i],
  } satisfies GridMedia;
});

export const BY_ID = new Map(POOL.map((m) => [m.id, m]));

/**
 * THE CUT: eight moments in the host's order, the way `reel_items` holds them.
 * One of them (`rs-9`) is hidden and still a MEMBER, because the reorder RPC's
 * set-equality guard needs the complete set and the dock draws it dimmed. It
 * drops out of the TIMELINE, which is approved-only, and that divergence is the
 * shipped rule rather than something this board invented.
 */
export const REEL_IDS = [
  "rs-3",
  "rs-9",
  "rs-0",
  "rs-14",
  "rs-5",
  "rs-11",
  "rs-19",
  "rs-6",
];

/** The members in order, hidden included: what the dock and the picker count. */
export const MEMBERSHIP: GridMedia[] = REEL_IDS.map(
  (id) => BY_ID.get(id)!,
).filter(Boolean);

/** Approved only, in order: what actually renders. */
export const TIMELINE = MEMBERSHIP.filter((m) => m.status === "approved");

/** The host's stored reel, as the config row would hold it. */
export const REEL = {
  styleId: "classic",
  seed: 918_273,
  /** Free: the 30 second cap and the server-stamped wordmark. */
  seconds: 30,
  watermark: true,
  cover: null as string | null,
} as const;

/** The fourteen looks, in the catalog's own display order. */
export const STYLES = STYLE_CATALOG;

/**
 * The props the engine draws, for a style. Pure: the same function the shipped
 * Studio calls, over fixture media. `clips` truncates to the first four for a
 * thumb, which is pixel-honest because `planReel` seeds by index, so a prefix
 * plans identically to the full reel's prefix (the shipped rail's note).
 */
export function propsFor(
  styleId: string,
  opts: { clips?: number; orientation?: Orientation } = {},
): ReelProps {
  const base = buildReelProps({
    orderedIds: REEL_IDS,
    byId: BY_ID,
    styleId,
    seed: REEL.seed,
    orientation: opts.orientation ?? "portrait",
    coverMediaId: REEL.cover,
    lengthSeconds: REEL.seconds,
    watermark: REEL.watermark,
  });
  return opts.clips
    ? { ...base, clips: base.clips.slice(0, opts.clips) }
    : base;
}
