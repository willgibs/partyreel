import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, AND THE FILES ONE GUEST JUST PICKED.
 *
 * Every picture on this board is the same open event, so what moves between
 * options is the UPLOAD and never the album: Maya and Jay's wedding, hosted by
 * Maya, 24 photographs from 19 guests before this guest taps Add. The album is
 * settled law here and no option touches it: the chrome is the shipped column,
 * the columns are the shipped `GALLERY_COLUMNS` rule (`gallery-width`, ruled
 * 2026-09-18) and the tile is the shipped `MediaTile`.
 *
 * ★ NOTHING HERE IS A REAL UPLOAD. A picked file's `url` is a local marketing
 * still standing in for the object URL `LiveGallery` mints from the real File,
 * so no preview on this board reads a disk, presigns, joins, PUTs or touches
 * any row. The one thing that had to be modelled rather than faked is whether
 * the BROWSER can draw a file at all, which is `drawable`: a `.mov` from an
 * iPhone, or a HEIC outside Safari, renders nothing in the pending tile today,
 * and that blank is one of the things `warning` asks about.
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE MARKETING STILLS, RE-SHAPED. They are the
 * only stills the repo holds (the real set is the Higgsfield month's) and
 * eleven of the twelve are 3:2 landscapes, which a party album is not. Each is
 * DECLARED at one of the shapes a phone actually shoots and `MediaTile`'s
 * object-cover crops it, exactly as the real album crops a real upload.
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

/** 12 portraits, 2 tall, 5 landscapes, 2 squares, 2 at 4:5, 1 wide. */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSL";

/**
 * ★ THE ORDER SPREADS THE REPEATS AS FAR AS TWELVE STILLS ALLOW. Twelve of them
 * over 24 album tiles plus a dozen uploads repeat whatever the order, and where
 * the repeats LAND is the only part an author controls: CSS columns balance by
 * HEIGHT, so at 375's two columns the second starts wherever the halfway mark
 * falls and a naive stride puts the same bouquet at the top of both. This order
 * pushes copies apart rather than promising none are adjacent, which with this
 * pack is not a promise anyone can keep. The real album (the Higgsfield
 * month's) needs none of this.
 */
const ORDER = [
  2, 9, 0, 7, 11, 4, 5, 1, 3, 6, 8, 10, 0, 4, 2, 9, 10, 1, 6, 5, 7, 11, 3, 8,
] as const;

const still = (i: number) => MARKETING_IMAGES[i % MARKETING_IMAGES.length];

const shaped = (letter: string): [number, number] => {
  const [w, h] = SHAPES[letter as ShapeKey];
  return [w * 400, h * 400];
};

/** The album before this guest adds anything: 24 approved photographs. */
export const ALBUM: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = still(ORDER[i]);
  const [width, height] = shaped(letter);
  return {
    id: `gu-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width,
    height,
  } satisfies GridMedia;
});

/** The event, as every guest surface names it. */
export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  /** Rendered through the product's own `formatEventDate`. */
  date: "2026-06-14",
  guests: 19,
  description:
    "Everything from the ceremony, the lawn and the long night after.",
  /** The host's per-event cap (events.max_upload_bytes), as the refusal says it. */
  cap: "500 MB",
} as const;

/**
 * ONE FILE A GUEST PICKED. The shape the queue would hold, plus the two things
 * a queue item cannot know and a design question needs: whether the browser can
 * draw it, and what the server would say if it refused.
 */
export type Picked = {
  id: string;
  /** A local still, standing in for the object URL a real File would mint. */
  url: string;
  kind: "photo" | "video";
  /** The natural shape, so the tile reserves its box before anything decodes. */
  width: number;
  height: number;
  /** What the file is called and how big, for the sentences a refusal needs. */
  name: string;
  size: string;
  /** False when the browser renders nothing for it (a .mov, a HEIC off Safari). */
  drawable?: boolean;
};

const pick = (
  i: number,
  letter: string,
  rest: Omit<Picked, "id" | "url" | "width" | "height">,
): Picked => {
  const img = still(i);
  const [width, height] = shaped(letter);
  return { id: `pick-${i}-${letter}`, url: img.src, width, height, ...rest };
};

/**
 * THE FOUR FILES THIS GUEST PICKED: three photographs off the camera roll and
 * one clip of the first dance. The clip is the one the browser cannot draw, so
 * every option that shows this batch also shows what today does with it.
 */
export const PICKED: Picked[] = [
  pick(3, "P", { kind: "photo", name: "IMG_4182.HEIC", size: "3.8 MB" }),
  pick(7, "L", { kind: "photo", name: "IMG_4183.HEIC", size: "4.1 MB" }),
  pick(1, "T", {
    kind: "video",
    name: "IMG_4184.MOV",
    size: "212 MB",
    drawable: false,
  }),
  pick(10, "P", { kind: "photo", name: "IMG_4186.HEIC", size: "3.4 MB" }),
];

/**
 * THE FILE THAT TAKES A WHILE: the first dance, 212 MB, minutes on venue Wi-Fi.
 * It is the same clip as the batch's third file, in the container the browser
 * CAN draw, so the question of how a slow upload reads is asked without the
 * blank tile that `warning` is separately about.
 */
export const CLIP: Picked = {
  ...pick(1, "T", { kind: "video", name: "IMG_4184.MP4", size: "212 MB" }),
  id: "clip",
};

/** The dozen a guest picks when they clear the night off their camera roll. */
export const DOZEN: Picked[] = [
  ...PICKED,
  pick(5, "P", { kind: "photo", name: "IMG_4187.HEIC", size: "3.9 MB" }),
  pick(8, "S", { kind: "photo", name: "IMG_4188.HEIC", size: "2.7 MB" }),
  pick(0, "F", { kind: "photo", name: "IMG_4189.HEIC", size: "4.4 MB" }),
  pick(11, "P", { kind: "photo", name: "IMG_4190.HEIC", size: "3.1 MB" }),
  pick(2, "L", { kind: "photo", name: "IMG_4191.HEIC", size: "3.6 MB" }),
  pick(6, "P", { kind: "photo", name: "IMG_4192.HEIC", size: "4.0 MB" }),
  pick(9, "W", { kind: "photo", name: "IMG_4193.HEIC", size: "5.2 MB" }),
  pick(4, "P", { kind: "photo", name: "IMG_4194.HEIC", size: "3.3 MB" }),
];

/**
 * The photograph this guest added a moment ago, landed and approved. Drawn from
 * a still the album's own first screen does not already hold, so it reads as
 * theirs rather than as a repeat re-entering.
 */
export const LANDED: GridMedia = {
  id: "gu-landed",
  type: "photo",
  url: still(3).src,
  downloadUrl: still(3).src,
  status: "approved",
  width: 1200,
  height: 1600,
};

/**
 * A PICKED FILE THAT LANDED: the same photograph, now an ordinary album row.
 * A batch mid-run has both on screen at once, and drawing only the ones still
 * going is how a caption comes to claim twelve where nine are shown.
 */
export const landedFrom = (file: Picked): GridMedia => ({
  id: `landed-${file.id}`,
  type: "photo",
  url: file.url,
  downloadUrl: file.url,
  status: "approved",
  width: file.width,
  height: file.height,
});

/** The three refusals a guest actually meets, in the server's own words. */
export const REFUSALS = {
  big: {
    knob: "Over this event's cap",
    /** presign-upload/route.ts, the per-event cap branch: the precise one. */
    said: `Files for this event are capped at ${EVENT.cap}.`,
    short: "Too big for this event",
  },
  type: {
    knob: "A video on a photos-only event",
    /** presign-upload/route.ts, the photos-only branch. */
    said: "This event accepts photos only.",
    short: "This event takes photos only",
  },
  drop: {
    knob: "The connection dropped",
    /** uploader.ts, the transport-failure branch: the vague one. */
    said: "Your connection dropped. Check your signal and try again.",
    short: "Your connection dropped",
  },
} as const;

export type RefusalId = keyof typeof REFUSALS;

export const refusalOf = (v: string | undefined): RefusalId =>
  v === "type" ? "type" : v === "drop" ? "drop" : "big";
