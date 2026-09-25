import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * ONE WEDDING, ONE GUEST, AND ONE CLIP SHE IS MAKING OF IT.
 *
 * ★ THE WORLD IS `media-viewer`'S, NOT A NEW ONE. Maya and Jay's wedding,
 * hosted by Maya, 14 June: the album `media-viewer` opens a photograph inside
 * and `guest-capture` walks Priya into. She has watched the live reel and
 * tapped "Make your own". What moves between options is where the moments and
 * the looks live, never the album, so a direction is never secretly a
 * decision about which photographs she picked.
 *
 * ★ A CLIP IS LOCAL AND THE POOL IS THE REEL'S. Nothing on this board writes:
 * a clip's membership is a selection on her own device, and the pool is the
 * reel-eligible album, so a clip is never made from clips. Theo's clip is in
 * the album at index 7 with `reelEligible: false` and is therefore absent from
 * every pool: the album holds 26 items, the host's pool 25, and Priya's 23,
 * because the two Maya hid are not in a guest's pool at all.
 *
 * ★ NOTHING HERE TOUCHES A ROW, AN RPC OR AN ENCODE. A moment's url is a local
 * marketing still standing in for the presigned R2 preview the real gallery
 * payload hands the engine, and `buildReelProps` is pure, so the props below
 * are the shape the shipped player renders and the encoder steps.
 * `ReelProvider`, `useReelConfig` and `runClientEncode` are never imported:
 * they fire real writes and a real PUT on any event id they are handed.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE BOOTSTRAP STILLS, RE-SHAPED: eleven of the
 * twelve are 3:2 landscapes, which a party album is not, so each is DECLARED
 * at a shape a phone actually shoots and `object-cover` crops it exactly as it
 * crops a real upload. No new asset, no rights to track.
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

/** The event, in the words every surface of it carries. */
export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "2026-06-14",
  /** What the album holds, clips included. The creator's pool is smaller. */
  items: 26,
} as const;

/** Who is making the clip: `maker` on the board's knob. */
export type Maker = "guest" | "host";
export const PRIYA = { key: "g-priya", name: "Priya" } as const;
export const HOST = { key: "g-maya", name: "Maya" } as const;

/**
 * THE ALBUM. Twenty-six items: twenty-five the reel plays and one clip Theo
 * already added, which the live reel skips and no creator may take. Two are
 * hidden by Maya, so her own pool carries the dimmed "Hidden · Show" tile and
 * a guest's pool simply never contains them.
 */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPP";
const ORDER = [
  2, 9, 0, 7, 11, 4, 5, 1, 3, 6, 8, 10, 0, 4, 2, 9, 10, 1, 6, 5, 7, 11, 3, 8, 1,
  7,
] as const;
/** Maya hid these two. Neither sits in a grid's first column, so a caption on
 *  one is never cut by the frame's own left edge. */
const HIDDEN = new Set([5, 18]);
/** Priya's own uploads: what "Only mine" resolves to for her. */
const MINE = new Set([1, 6, 13, 19, 23]);
/** Maya's own uploads: what "Only mine" resolves to for the host. */
const MAYAS = new Set([4, 9, 14, 24]);
/** Theo's clip, already in the album: `reelEligible: false`, so no pool holds it. */
const CLIP_IN_ALBUM = 7;
/** Videos in the album (their poster still draws in a clip, silently). */
const VIDEOS = new Set([11, 21]);
const LIKES: Record<number, number> = {
  0: 12,
  2: 7,
  3: 9,
  6: 4,
  9: 14,
  13: 3,
  16: 6,
  19: 5,
  23: 8,
};

const UPLOADERS = ["Ruby", "Theo", "Sam", "Ines"] as const;

/** `reelEligible` is not on `GridMedia` (the reel lanes carry it beside the
 *  item), so the board keeps it beside the item rather than inventing a column. */
export type AlbumItem = GridMedia & { reelEligible: boolean };

export const ALBUM: AlbumItem[] = [...ROLL].map((letter, i) => {
  const img = still(ORDER[i]);
  const [width, height] = shaped(letter);
  const who = MINE.has(i) ? PRIYA : MAYAS.has(i) ? HOST : null;
  const isClip = i === CLIP_IN_ALBUM;
  return {
    id: `m${i}`,
    type: VIDEOS.has(i) || isClip ? "video" : "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: HIDDEN.has(i) ? "hidden" : "approved",
    width,
    height,
    uploaderName: who ? who.name : UPLOADERS[i % UPLOADERS.length],
    uploaderKey: who ? who.key : `g-${i % UPLOADERS.length}`,
    isHost: who === HOST,
    likeCount: LIKES[i],
    createdAt: "2026-06-14T21:00:00.000Z",
    reelEligible: !isClip,
  } satisfies AlbumItem;
});

export const BY_ID = new Map(ALBUM.map((m) => [m.id, m]));

/** What the HOST's creator offers: the reel-eligible album, hidden included
 *  (dimmed and captioned, never takeable). */
export const POOL: AlbumItem[] = ALBUM.filter((m) => m.reelEligible);

/** What a GUEST's creator offers: the same, minus what Maya hid. */
export const GUEST_POOL: AlbumItem[] = POOL.filter(
  (m) => m.status === "approved",
);

export const poolFor = (maker: Maker): readonly AlbumItem[] =>
  maker === "host" ? POOL : GUEST_POOL;

/**
 * THE THREE FILLS a clip starts from ("start from what the reel is playing,
 * only yours, or the whole album"). The words are placeholders and a copy
 * round's to settle; the SETS are the real rule.
 *
 * `reel` is the take the live reel is playing right now, capped to the length,
 * which is why it is eight and not twenty-three.
 */
export const FILLS = ["reel", "mine", "all"] as const;
export type FillId = (typeof FILLS)[number];

export const FILL_LABEL: Record<FillId, string> = {
  reel: "The reel's picks",
  mine: "Only mine",
  all: "Everything",
};

/** The reel's current take, in its order: eight moments, spread across guests. */
const REEL_TAKE = ["m3", "m13", "m0", "m21", "m9", "m6", "m16", "m24"];

/**
 * A fill's members, in order. ★ ALWAYS OVER THE APPROVED POOL, whoever is
 * making it: a hidden photograph is never in a clip (the reel does not play
 * it), so the host's extra tiles change what she SEES, never what is in.
 */
export function fillIds(fill: FillId, maker: Maker = "guest"): string[] {
  if (fill === "reel") return [...REEL_TAKE];
  if (fill === "mine") {
    const key = maker === "host" ? HOST.key : PRIYA.key;
    return GUEST_POOL.filter((m) => m.uploaderKey === key).map((m) => m.id);
  }
  return GUEST_POOL.map((m) => m.id);
}

/** The clip Priya is working on: her settings, which no option moves. */
export const CLIP = {
  seed: 918_273,
  seconds: 30,
  orientation: "portrait" as Orientation,
  cover: null as string | null,
} as const;

/** The fourteen looks, in the catalog's own display order: eight moods, six
 *  treatments. The live reel offers the eight; a clip offers all fourteen. */
export const STYLES = STYLE_CATALOG;

/**
 * The props the engine draws, for one look. Pure, and the same builder the
 * shipped composer calls. `clips` truncates to the first few for a thumb,
 * which is pixel-honest because `planReel` seeds by index, so a prefix plans
 * identically to the full clip's prefix (the shipped rail's own note).
 */
export function propsFor(
  styleId: string,
  opts: {
    ids: readonly string[];
    clips?: number;
    watermark?: boolean;
  },
): ReelProps {
  const base = buildReelProps({
    orderedIds: [...opts.ids],
    byId: BY_ID,
    styleId,
    seed: CLIP.seed,
    orientation: CLIP.orientation,
    coverMediaId: CLIP.cover,
    lengthSeconds: CLIP.seconds,
    // A paid event's clip carries no mark; a free event's is stamped by the
    // engine's own dispatch layer, never drawn by this board.
    watermark: opts.watermark ?? false,
  });
  return opts.clips
    ? { ...base, clips: base.clips.slice(0, opts.clips) }
    : base;
}
