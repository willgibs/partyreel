import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import type { ExportSummary, ExportTypeFilter } from "@/lib/export/build-manifest";

/**
 * THE STAND-IN CONTENT for `export-flow`: one wedding, four albums, and the
 * numbers the dialog's foot is made of.
 *
 * ★ EVERY NUMBER HERE IS A BYTE COUNT, NEVER A STRING. The dialog's foot is
 * `formatBytes(bytes)` over a sum of buckets, so a fixture that wrote "2.6 GB"
 * would be a claim the board could not check. These carry counts and bytes, the
 * real `ExportSummary` shape the summary endpoint returns, and every caption on
 * the board is read back off the laid-out DOM (board.tsx).
 *
 * ★ NO NEW ASSET. Every tile is one of the bootstrap stills every other board
 * reuses (`MARKETING_IMAGES`), so there is nothing to ask Will for and nothing
 * to track (2026-09-17/18).
 */

export const EVENT = {
  name: "Mia & Theo's Wedding",
  /** The album's own address, which is what the `link` option offers. */
  url: "partyreel.com/e/mia-and-theo",
} as const;

/** One photograph off an iPhone, and one 40 second clip, in bytes. */
const PHOTO = 4_410_000;
const VIDEO = 98_200_000;

const bucket = (count: number, each: number) => ({ count, bytes: count * each });

const summary = (
  photos: number,
  videos: number,
  hiddenPhotos = 0,
  hiddenVideos = 0,
): ExportSummary => ({
  shown: { photo: bucket(photos, PHOTO), video: bucket(videos, VIDEO) },
  hidden: {
    photo: bucket(hiddenPhotos, PHOTO),
    video: bucket(hiddenVideos, VIDEO),
  },
});

export type AlbumId = "wedding" | "small" | "over" | "teaser";

export type Album = {
  readonly id: AlbumId;
  /** What the dock calls it. */
  readonly label: string;
  readonly summary: ExportSummary;
  /** What the guest who is looking added themselves, for the `mine` option. */
  readonly mine: ExportSummary;
  /** How many tiles the ground draws behind the dialog. */
  readonly tiles: number;
};

/**
 * FOUR ALBUMS, BECAUSE THE DIALOG IS FOUR DIFFERENT OBJECTS IN THEM. A wedding
 * is the ordinary case; twelve photographs is the case the cap copy never
 * applies to; 2,440 items is where the refusal fires; nine photographs and no
 * video at all is the teaser, whose third chip cannot answer.
 */
export const ALBUMS: Record<AlbumId, Album> = {
  wedding: {
    id: "wedding",
    label: "A wedding, 148 items",
    summary: summary(126, 22, 6, 1),
    mine: summary(11, 3),
    tiles: 18,
  },
  small: {
    id: "small",
    label: "A small album, 12",
    summary: summary(12, 0),
    mine: summary(4, 0),
    tiles: 12,
  },
  over: {
    id: "over",
    label: "Over the limit, 2,440",
    summary: summary(2280, 160, 0, 0),
    mine: summary(31, 4),
    tiles: 18,
  },
  teaser: {
    id: "teaser",
    label: "A teaser, 9 photographs",
    summary: summary(9, 0),
    // Two of their own: anonymous uploads are open on this event, so a visitor
    // who has not signed in can still have added something.
    mine: summary(2, 0),
    tiles: 9,
  },
};

export const albumOf = (v: string | undefined): Album =>
  v === "small" || v === "over" || v === "teaser" ? ALBUMS[v] : ALBUMS.wedding;

/* ── the dialog's own arithmetic, copied from the shipped component ──────── */

/**
 * ★ `bucketFor` AND `totalFor` ARE PRIVATE TO `export-dialog.tsx`, so they are
 * reproduced here rather than imported, and reproduced EXACTLY: every count and
 * size on this board is the sum the shipped dialog would show for the same
 * summary. If the dialog's arithmetic ever changes, this is the copy that has
 * to move with it (there is no seam to import, and adding one is an edit to a
 * shipped file this lane does not own).
 */
function bucketFor(
  s: ExportSummary,
  type: "photo" | "video",
  includeHidden: boolean,
) {
  const shown = s.shown[type];
  if (!includeHidden) return shown;
  const h = s.hidden[type];
  return { count: shown.count + h.count, bytes: shown.bytes + h.bytes };
}

export function totalFor(
  s: ExportSummary,
  types: ExportTypeFilter,
  includeHidden: boolean,
) {
  const photo = bucketFor(s, "photo", includeHidden);
  const video = bucketFor(s, "video", includeHidden);
  if (types === "photo") return photo;
  if (types === "video") return video;
  return {
    count: photo.count + video.count,
    bytes: photo.bytes + video.bytes,
  };
}

export const hasHidden = (s: ExportSummary) =>
  s.hidden.photo.count + s.hidden.video.count > 0;

/* ── the tiles behind the dialog ─────────────────────────────────────────── */

const RATIOS: readonly [number, number][] = [
  [4, 5],
  [1, 1],
  [3, 4],
  [4, 3],
  [16, 10],
  [3, 2],
  [2, 3],
  [5, 4],
];

function tile(i: number, overrides: Partial<GridMedia> = {}): GridMedia {
  const img = MARKETING_IMAGES[i % MARKETING_IMAGES.length];
  const [width, height] = RATIOS[i % RATIOS.length];
  return {
    id: `xf-${i}`,
    type: "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: "approved",
    width,
    height,
    likeCount: 0,
    createdAt: "2026-08-15T18:00:00.000Z",
    ...overrides,
  };
}

export const TILES: GridMedia[] = Array.from({ length: 18 }, (_, i) => tile(i));

/** Which of the album's tiles this guest took, for the `mine` and `picked` options. */
export const MINE = new Set(["xf-1", "xf-4", "xf-7", "xf-9", "xf-12", "xf-15"]);
