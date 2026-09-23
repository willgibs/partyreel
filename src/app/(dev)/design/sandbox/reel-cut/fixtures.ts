import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * ONE WEDDING, ONE GUEST, AND ONE CUT SHE IS MAKING OF IT.
 *
 * ★ THE WORLD IS `media-viewer`'S, NOT A NEW ONE. Maya and Jay's wedding,
 * hosted by Maya, 14 June: the album `media-viewer` opens a photograph inside
 * and `guest-capture` walks Priya into. She is the guest here too, one beat
 * later than either of them finds her: she has watched the event's live reel,
 * and she has tapped "Make your own". What moves between options is the ROOM
 * and the act, never the album, so a decision is never secretly a decision
 * about which photographs she picked.
 *
 * ★ A CUT IS LOCAL AND THE POOL IS THE REEL'S. Nothing on this board writes:
 * a cut's membership is a selection on her own device (`reel_items` and the
 * three reel RPCs die with the Studio), and the pool is the reel-eligible
 * album, so a cut is never cut from cuts. Theo's cut is in the album at index
 * 7 with `reelEligible: false` and is therefore ABSENT from every pool below:
 * the album holds 26 items and the creator offers 25. The board measures that
 * gap rather than asserting it.
 *
 * ★ NOTHING HERE TOUCHES A ROW, AN RPC OR AN ENCODE. A clip's url is a local
 * marketing still standing in for the presigned R2 preview the real gallery
 * payload hands the engine, and `buildReelProps` is pure (no second presign,
 * no RPC), so the props below are the same shape the shipped player renders
 * and the encoder steps. `ReelProvider`, `useReelConfig` and `runClientEncode`
 * are never imported: they fire real writes and a real PUT on any event id
 * they are handed, which is the one thing a preview may never do.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE BOOTSTRAP STILLS, RE-SHAPED (the rule every
 * board over this album follows): eleven of the twelve are 3:2 landscapes,
 * which a party album is not, so each is DECLARED at a shape a phone actually
 * shoots and `object-cover` crops it exactly as it crops a real upload. No new
 * asset, no rights to track (Will, 2026-09-17).
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
  /** Paid (Pro), so "Add to the album" exists and a cut of hers is unmarked. */
  paid: true,
  guests: 9,
  /** What the album holds, cuts included. The creator's pool is smaller. */
  items: 26,
} as const;

/** The guest making the cut, and the host who meets this board once. */
export const PRIYA = { key: "g-priya", name: "Priya" } as const;
export const HOST = { key: "host", name: "Maya" } as const;

/**
 * THE ALBUM. Twenty-six items: twenty-five the reel plays and one cut Theo
 * already added, which the live reel skips and no creator may cut from.
 * Two are hidden by Maya, so the host's own pool carries the blocked tile
 * `blocked` asks about and a guest's pool simply never contains them.
 */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPP";
const ORDER = [
  2, 9, 0, 7, 11, 4, 5, 1, 3, 6, 8, 10, 0, 4, 2, 9, 10, 1, 6, 5, 7, 11, 3, 8, 1,
  7,
] as const;
/**
 * Maya hid these two. A guest never sees them at all.
 *
 * ★ NEITHER SITS IN THE POOL'S FIRST COLUMN, and that is deliberate rather
 * than pretty: `blocked`'s tooltip option stands centred over its tile, and a
 * tooltip on a column-zero tile is cut in half by the frame's own left edge.
 * The capture caught it; the fixture answers it, so the option is judged on
 * what it says rather than on where it happened to land.
 */
const HIDDEN = new Set([5, 18]);
/** Priya's own uploads, which is what the "Only mine" fill resolves to. */
const MINE = new Set([1, 6, 13, 19, 23]);
/** Theo's cut, already in the album: `reelEligible: false`, so no pool holds it. */
const CUT_IN_ALBUM = 7;
/** Videos in the album (their poster still draws in a cut). */
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

const UPLOADERS = ["Ruby", "Theo", "Priya", "Sam", "Maya"] as const;

/** `reelEligible` is not on `GridMedia` yet (the expand migration adds it and
 *  `toGridItems` carries it): the board keeps it beside the item rather than
 *  inventing a column, so nothing here pretends a shipped type has moved. */
export type AlbumItem = GridMedia & { reelEligible: boolean };

export const ALBUM: AlbumItem[] = [...ROLL].map((letter, i) => {
  const img = still(ORDER[i]);
  const [width, height] = shaped(letter);
  const mine = MINE.has(i);
  const isCut = i === CUT_IN_ALBUM;
  return {
    id: `cut-${i}`,
    type: VIDEOS.has(i) || isCut ? "video" : "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: HIDDEN.has(i) ? "hidden" : "approved",
    width,
    height,
    uploaderName: mine ? PRIYA.name : UPLOADERS[i % UPLOADERS.length],
    uploaderKey: mine ? PRIYA.key : `g-${i % 5}`,
    isHost: false,
    likeCount: LIKES[i],
    createdAt: "2026-06-14T21:00:00.000Z",
    reelEligible: !isCut,
  } satisfies AlbumItem;
});

export const BY_ID = new Map(ALBUM.map((m) => [m.id, m]));

/** What the creator may ever offer: the reel-eligible album, cuts excluded. */
export const POOL: AlbumItem[] = ALBUM.filter((m) => m.reelEligible);

/** What PRIYA's pool is: the same, minus what Maya hid (a guest never sees it). */
export const GUEST_POOL: AlbumItem[] = POOL.filter(
  (m) => m.status === "approved",
);

/**
 * THE THREE FILLS a cut starts from (his concept: "start from what the reel is
 * playing, only yours, or the whole album"). The words are placeholders and
 * the copy round's to settle; the SETS are the real rule.
 *
 * `reel` is the take the live reel is playing right now, capped to the length,
 * which is why it is eight and not twenty-five.
 */
export const FILLS = ["reel", "mine", "all"] as const;
export type FillId = (typeof FILLS)[number];

export const FILL_LABEL: Record<FillId, string> = {
  reel: "The reel's picks",
  mine: "Only mine",
  all: "Everything",
};

/** The reel's current take, in its order: eight moments, spread across guests. */
const REEL_TAKE = [
  "cut-3",
  "cut-13",
  "cut-0",
  "cut-21",
  "cut-9",
  "cut-6",
  "cut-16",
  "cut-24",
];

export function fillIds(fill: FillId, pool: readonly AlbumItem[]): string[] {
  if (fill === "reel") {
    const inPool = new Set(pool.map((m) => m.id));
    return REEL_TAKE.filter((id) => inPool.has(id));
  }
  if (fill === "mine")
    return pool.filter((m) => m.uploaderKey === PRIYA.key).map((m) => m.id);
  return pool.map((m) => m.id);
}

/** The cut Priya is working on: the fill she landed on, and her settings. */
export const CUT = {
  fill: "reel" as FillId,
  styleId: "classic",
  seed: 918_273,
  seconds: 30,
  orientation: "portrait" as Orientation,
  cover: null as string | null,
} as const;

/** The fourteen looks, in the catalog's own display order: eight moods, six
 *  treatments. The live reel offers the eight; this wall is the cut's own. */
export const STYLES = STYLE_CATALOG;

/**
 * The props the engine draws, for one look. Pure, and the same builder the
 * shipped composer calls, over fixtures. `clips` truncates to the first few for
 * a thumb, which is pixel-honest because `planReel` seeds by index, so a prefix
 * plans identically to the full cut's prefix (the shipped rail's own note).
 */
export function propsFor(
  styleId: string,
  opts: {
    clips?: number;
    orientation?: Orientation;
    ids?: readonly string[];
    watermark?: boolean;
  } = {},
): ReelProps {
  const base = buildReelProps({
    orderedIds: [...(opts.ids ?? fillIds(CUT.fill, GUEST_POOL))],
    byId: BY_ID,
    styleId,
    seed: CUT.seed,
    orientation: opts.orientation ?? CUT.orientation,
    coverMediaId: CUT.cover,
    lengthSeconds: CUT.seconds,
    // A paid cut carries no mark; `mark` draws the free case and asks for it.
    watermark: opts.watermark ?? false,
  });
  return opts.clips
    ? { ...base, clips: base.clips.slice(0, opts.clips) }
    : base;
}
