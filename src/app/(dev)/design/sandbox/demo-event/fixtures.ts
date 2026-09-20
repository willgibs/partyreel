import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE DEMO EVENT, AS THE THING A PROSPECTIVE HOST OPENS.
 *
 * ★ KEPT WHOLE FOR A CROSS-BOARD READER, ROUND TWO. This round's own board
 * only needs `DEMO_URL` (see `doors.tsx`); round one's masonry (`PARTIES`,
 * `ADDED`, the searched tile order) served six questions now ruled and wired
 * whole by `demo-wiring`. It stays here, unchanged, because `guest-shape`'s
 * own round two quotes `DEMO` and the `Party` type (`welcome.tsx`, "the demo's
 * own arrival") to draw its four shells on the demo's real words: a lane never
 * breaks a module another standing board imports, and this board owns this
 * file's directory. Trim it once `guest-shape` retires.
 *
 * Every picture on this board is one party, so what moves between options is
 * the SHAPE of the demo and never its contents. The party is a wedding with 33
 * photographs from 23 guests, which is the demo Will described rather than the
 * one that is live: "the existing demo content will be completely replaced
 * prior to launch to feel more full and real" (docs/design/rulings.md,
 * 2026-09-19). The `event` decision asked whether it stayed one party at all,
 * so two more are declared below at the same shape.
 *
 * ★ THE DEMO EVENT IS A REAL ROW AND THIS IS NOT IT. The live demo is a
 * curated event behind `NEXT_PUBLIC_DEMO_QR_TOKEN`; nothing on this board
 * reads it, touches it or depends on it being configured, which is also why
 * every door here is handed its URL as a prop rather than reading `lib/demo`.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE MARKETING STILLS, RE-SHAPED. They are the
 * only stills the repo holds (the real curated set is the Higgsfield month's)
 * and eleven of the twelve are 3:2 landscapes, which a party album is not: a
 * guest's phone shoots 3:4 portraits most of the time, then the odd landscape,
 * a 9:16 screen-height shot, a square. Each still is DECLARED at one of those
 * shapes and `MediaTile`'s object-cover crops it, exactly as a real album crops
 * a real upload. Without this the masonry reads as a brick wall of landscapes.
 */

/** The shapes a phone's camera roll actually holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/**
 * 17 portraits at 3:4, 3 tall at 9:16, 6 landscapes, 3 squares, 2 at 4:5 and 2
 * wide at 16:9: about two thirds of the roll stands up, as a phone shoots it.
 */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPPWPLTPFP";

/**
 * ★ THE ORDER IS SEARCHED, NOT CHOSEN, AND ELEVEN STILLS CARRY THE ALBUM. The
 * twelfth is held back for the photograph a visitor adds (`ADDED` below), so
 * the tile that lands at the top is one the album does not already hold and
 * reads as new rather than as a repeat re-entering. Eleven stills over 33
 * tiles is three copies of each whatever the order, and where the repeats LAND
 * is the only part an author controls: CSS columns balance by HEIGHT, so a
 * column starts wherever the running total crosses the balance point and not
 * at item 17. This order was searched over 200,000 shuffles against a model of
 * that balancing at BOTH of the board's layouts (two columns of 165px in an
 * 812px screen, six of 230px in a 900px one), scoring every pair of equal
 * stills VISIBLE ON THE FIRST SCREEN by how near their boxes are in two
 * dimensions. Measured on the winner: no repeat at all shares the first screen
 * at a phone, and at a laptop, where six columns put most of the album in one
 * window, the nearest pair is 374px apart. The curated set needs none of this.
 */
const ORDER = [
  9, 1, 3, 5, 3, 4, 0, 4, 8, 10, 5, 3, 8, 9, 0, 1, 8, 6, 10, 4, 2, 7, 10, 0, 5,
  6, 7, 2, 1, 2, 7, 9, 6,
] as const;

/** The eleven stills the album is drawn from; the twelfth is `ADDED`'s. */
const ALBUM_STILLS = 11;

const tiles = (prefix: string, offset: number): GridMedia[] =>
  [...ROLL].map((letter, i) => {
    const img = MARKETING_IMAGES[(ORDER[i] + offset) % ALBUM_STILLS];
    const [w, h] = SHAPES[letter as keyof typeof SHAPES];
    return {
      id: `${prefix}-${i}`,
      type: "photo",
      url: img.src,
      downloadUrl: img.src,
      status: "approved",
      width: w * 400,
      height: h * 400,
    } satisfies GridMedia;
  });

/** Which party the demo is. One today; round one's `event` question asked
 *  about three. */
export type PartyId = "wedding" | "birthday" | "office";

export type Party = {
  name: string;
  host: string;
  /** Rendered through the product's own `formatEventDate`. */
  date: string;
  guests: number;
  description: string;
  /** The word a door uses for it: "a real wedding album". */
  kind: string;
  /** The one photograph a card of this party shows (marketing-media id). */
  cover: string;
  items: GridMedia[];
};

/**
 * ★ THE THREE PARTIES ARE ONE SET OF STILLS, OFFSET, AND THAT WAS THE POINT OF
 * ROUND ONE'S ASSET ASK. The repo holds twelve photographs and most of them
 * are weddings, so a birthday drawn from a different slice of the same twelve
 * is a stand-in and nothing more; each party names its own COVER so at least
 * the card a visitor chose from was plausible.
 */
export const PARTIES: Record<PartyId, Party> = {
  wedding: {
    name: "Nora & Sam's Wedding",
    host: "Nora",
    date: "2026-06-13",
    guests: 23,
    description:
      "Everything from the ceremony, the lawn and the long night after.",
    kind: "a real wedding album",
    cover: "wedding-arch",
    items: tiles("de-w", 0),
  },
  birthday: {
    name: "Ravi's 40th",
    host: "Priya",
    date: "2026-05-02",
    guests: 17,
    description: "One backyard, one playlist, and a cake that did not survive.",
    kind: "a real birthday album",
    cover: "party-balloons",
    items: tiles("de-b", 4),
  },
  office: {
    name: "Northside Summer Party",
    host: "Dana",
    date: "2026-07-18",
    guests: 41,
    description: "The whole company on a rooftop, from the toast to the taxis.",
    kind: "a real company party",
    cover: "reception-hall",
    items: tiles("de-o", 8),
  },
};

export const partyOf = (v: string | undefined): PartyId =>
  v === "birthday" ? "birthday" : v === "office" ? "office" : "wedding";

/** The party the demo is today, and the one `guest-shape`'s own round two
 *  quotes for its demo-arrival shell. */
export const DEMO: Party = PARTIES.wedding;

/**
 * THE PHOTOGRAPH A VISITOR ADDS. The demo's upload is simulated: a local
 * object URL ramps for about 480ms, always answers "approved", and nothing is
 * written (`use-upload-queue.ts`, `simulateUpload`). This is that tile,
 * declared as a phone's 3:4 portrait on a still the album's first screen does
 * not already hold, so it read as new rather than as a repeat re-entering.
 */
export const ADDED: GridMedia = {
  id: "de-added",
  type: "photo",
  url: MARKETING_IMAGES[ALBUM_STILLS].src,
  downloadUrl: MARKETING_IMAGES[ALBUM_STILLS].src,
  status: "approved",
  width: 1200,
  height: 1600,
};

/**
 * The URL every door on this board encodes and points at. A FIXTURE: the live
 * demo's address is composed from an env var (`lib/demo.ts`), and a board that
 * read it would draw nothing in a checkout without the variable set. `/demo`
 * is the short path Will ruled for the code (river-card, `opens=short`), and
 * it is 25 modules against the event link's 33, which is what makes the plates
 * below scannable at the sizes they ship at.
 */
export const DEMO_URL = "https://partyreel.com/demo";
