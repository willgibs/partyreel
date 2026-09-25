import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING ALBUM, AS A GUEST WHO HAS ADDED TO IT SEES IT (round 3).
 *
 * Maya and Jay's wedding again (rounds 1 and 2, and `reel-cut`'s own world),
 * seen by Priya, the lab's guest (`guest-capture`, `identity-claims`): the
 * twenty-eight photographs and videos her phone shows at the album's head a
 * moment after her own last pick landed.
 *
 * ★ HER PHOTOGRAPHS ARRIVE THE WAY UPLOADS REALLY DO, IN A BURST. Round 2 put
 * this guest's own photographs every ninth tile, so no two ever touched, and a
 * ring drawn outside each one never met another: the one case his note
 * foresaw ("neighboring uploads from the same user would have overlapping
 * rings") was never on the board. Here a pick of five lands together at the
 * head, side by side and wrapping onto the next row at both widths, and three
 * singles from earlier in the night sit further down among everyone else's.
 *
 * ★ OVER BRIGHT AND DARK PHOTOGRAPHS ON PURPOSE. The burst alternates an open
 * sky and a lit table with a nightclub floor and a blue concert, and one of
 * the five is a clip wearing the play mark, so every mark is judged where it
 * is hardest to read and beside the tile mark it has to live with.
 *
 * ★ THE PHOTOGRAPHS ARE THE THIRTEEN MARKETING STILLS, RE-SHAPED (the
 * fixtures' standing rule): each tile is declared at a shape a phone produces
 * and `MediaTile`'s object-cover crops the still to it, as the real album
 * crops a real upload. Named by id, so the stills' own swap (the Higgsfield
 * month keeps every id) changes the pictures and never this file.
 */

export const EVENT = { name: "Maya & Jay", host: "Maya" } as const;

/** The guest looking at the album, whose own uploads carry the mark. */
export const GUEST = "Priya";

/** The shapes a phone's camera roll holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;
type Shape = keyof typeof SHAPES;

type Row = {
  who: string;
  shape: Shape;
  still: string;
  /** A clip: the still is its poster and the tile wears the play mark. */
  clip?: boolean;
};

/**
 * NEWEST FIRST, as the album shows it. Priya's pick of five heads it; her
 * singles are the eighth, fifteenth and twenty-second tiles. No still sits
 * beside or directly under a copy of itself at two a row or five.
 */
const ROWS: readonly Row[] = [
  { who: GUEST, shape: "L", still: "reception-table" },
  { who: GUEST, shape: "P", still: "party-dj" },
  { who: GUEST, shape: "W", still: "concert-confetti", clip: true },
  { who: GUEST, shape: "P", still: "wedding-arch" },
  { who: GUEST, shape: "S", still: "wedding-rings" },
  { who: "Tom", shape: "P", still: "festival-crowd" },
  { who: GUEST, shape: "P", still: "wedding-golden" },
  { who: "Maya", shape: "L", still: "wedding-toast" },
  { who: "Sam", shape: "T", still: "reception-hall" },
  { who: "Leah", shape: "P", still: "party-balloons" },
  { who: "Dan", shape: "P", still: "wedding-petals" },
  { who: "Aunt Bev", shape: "L", still: "festival-lights" },
  { who: "Nina", shape: "F", still: "wedding-arch" },
  { who: "Ife", shape: "P", still: "party-dj" },
  { who: GUEST, shape: "P", still: "festival-crowd" },
  { who: "Tom", shape: "W", still: "wedding-rings" },
  { who: "Leah", shape: "P", still: "concert-confetti" },
  { who: "Maya", shape: "S", still: "reception-table" },
  { who: "Sam", shape: "P", still: "wedding-golden" },
  { who: "Dan", shape: "L", still: "party-balloons" },
  { who: "Nina", shape: "P", still: "reception-hall", clip: true },
  { who: GUEST, shape: "P", still: "wedding-toast" },
  { who: "Aunt Bev", shape: "P", still: "wedding-petals" },
  { who: "Ife", shape: "L", still: "festival-crowd" },
  { who: "Tom", shape: "P", still: "wedding-arch" },
  { who: "Leah", shape: "T", still: "party-dj" },
  { who: "Maya", shape: "P", still: "concert-confetti" },
  { who: "Sam", shape: "L", still: "wedding-rings" },
];

const STILL = new Map(MARKETING_IMAGES.map((m) => [m.id, m.src]));

/** The album, in the shape every album grid is handed. */
export const ALBUM: GridMedia[] = ROWS.map((row, i) => {
  const [w, h] = SHAPES[row.shape];
  const src = STILL.get(row.still) ?? MARKETING_IMAGES[0].src;
  return {
    id: `mv3-${i}`,
    type: row.clip ? "video" : "photo",
    url: src,
    // A clip's tile is its poster (`MediaTile` draws `previewUrl` for a
    // video), so no video file is fetched to draw a mark beside it.
    previewUrl: row.clip ? src : undefined,
    downloadUrl: src,
    status: "approved",
    width: w * 400,
    height: h * 400,
    durationSeconds: row.clip ? 6 : undefined,
    uploaderName: row.who,
    isHost: row.who === EVENT.host,
  } satisfies GridMedia;
});

/**
 * THE GUEST'S OWN, the set a real album hands the grid as `mineIds` (the
 * server's answer about this viewer's uploads, `gallery-live.tsx`).
 */
export const MINE_IDS: ReadonlySet<string> = new Set(
  ALBUM.filter((m) => m.uploaderName === GUEST).map((m) => m.id),
);

/** How many of the head's tiles are one pick of hers, landed together. */
export const BURST = ROWS.findIndex((r) => r.who !== GUEST);
