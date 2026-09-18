import {
  marketingImage,
  MARKETING_IMAGES,
} from "@/lib/constants/marketing-media";

/**
 * WHAT THE GLASS BOARD IS DRAWN OVER: real photographs, never a swatch.
 *
 * ★ THE THREE GROUNDS ARE MEASURED, NOT CHOSEN BY EYE. Every still in the
 * manifest was drawn to a canvas in Chrome and its mean luminance read out
 * (0 is black, 255 is white): the set runs from 50 to 176, and a glass recipe
 * that reads beautifully at 50 can lose its white text entirely at 176. So the
 * board carries a ground knob with the darkest, the middle and the brightest
 * photograph the repo holds, and every recipe is judged over all three.
 *
 * ★ ROW 14 STANDS. The manifest parks the dark, low-key menu-ground photograph
 * for the Higgsfield month (docs/ASSETS.md row 14); until it lands the darkest
 * real photograph in the set is the dark ground, and the board says so on the
 * step rather than faking one with a filter.
 */
export const GROUNDS = {
  dark: {
    id: "concert-confetti",
    label: "The darkest",
    /** Mean luminance of the decoded image, 0 to 255. */
    luma: 50,
    note: "the darkest photograph the repo holds (ASSETS row 14 is still parked)",
  },
  mid: {
    id: "party-dj",
    label: "A middling one",
    luma: 100,
    note: "half lit, half dark: a disco ball over a packed floor",
  },
  bright: {
    id: "wedding-arch",
    label: "The brightest",
    luma: 176,
    note: "open sky behind pale florals: where a transparent pane loses its text",
  },
} as const;

export type GroundId = keyof typeof GROUNDS;

export const groundOf = (v: string | undefined): GroundId =>
  v && v in GROUNDS ? (v as GroundId) : "dark";

export const groundSrc = (g: GroundId) => marketingImage(GROUNDS[g].id);

/**
 * The reel the overlay step plays under its controls.
 *
 * ★ THE LANDSCAPE CANDIDATE, CROPPED TO FILL, AND THAT IS THE HONEST CHOICE.
 * The portrait candidate is rendered from the repo's eleven LANDSCAPE stills,
 * so every one of its cuts carries black bars baked into the file: a reel
 * overlay drawn over it would judge glass over a black band rather than over a
 * photograph. The landscape candidate cropped to the phone's frame is moving
 * photographs edge to edge, which is what a guest's reel will be once the
 * Higgsfield month's portrait set lands and the engine re-renders. `restAt` is
 * the second it parks at under reduced motion, inside its first shot (its
 * boundaries are 0, 2.17, 4.13 and 6).
 */
export const REEL = {
  src: "/marketing/reels/hero-candidate-02.mp4",
  poster: "/marketing/posters/hero-candidate-02.jpg",
  restAt: 1.2,
} as const;

/* ── the album under the chrome ───────────────────────────────────────────── */

export type Tile = {
  id: string;
  src: string;
  /** width / height, as the album lays the tile out. */
  ratio: string;
  kind: "photo" | "video";
  liked: boolean;
  likes: number;
};

/**
 * THE STAND-IN ALBUM. The twelve manifest stills are all the repo holds and
 * eleven are landscapes; a party album is mostly 3:4 portraits off a phone. So
 * each still is DECLARED at one of a camera roll's shapes and cropped to it,
 * which is what a real upload does, and the columns then balance the way a real
 * album's do. The order is scrambled rather than cycled so no still lands
 * beside itself in a two-column phone view (the gallery-width board found that
 * the hard way).
 */
const ORDER = [
  3, 6, 11, 0, 8, 2, 9, 5, 1, 10, 4, 7, 2, 11, 6, 0, 9, 3, 8, 5, 10, 1, 7, 4,
  11, 2, 0, 6, 3, 9, 5, 8, 1, 10, 4, 7, 6, 11, 0, 2,
] as const;

const SHAPES: Record<string, string> = {
  P: "3 / 4",
  T: "9 / 16",
  L: "4 / 3",
  S: "1 / 1",
  F: "4 / 5",
  W: "16 / 9",
};

const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPPWPLTPFPLPSPWLP";

export const ALBUM: Tile[] = [...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
  return {
    id: `gl-${i}`,
    src: img.src,
    ratio: SHAPES[letter],
    // Every fifth is a video, so a play badge appears often enough to judge and
    // never often enough to become the album's texture.
    kind: i % 5 === 3 ? "video" : "photo",
    liked: i % 7 === 2,
    likes: i % 4 === 1 ? (i % 11) + 2 : 0,
  } satisfies Tile;
});

/** The event every scene names. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  guest: "Priya Raman",
  date: "Sat 14 June",
} as const;
