import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import type {
  ExportSummary,
  ExportTypeFilter,
} from "@/lib/export/build-manifest";

/**
 * THE STAND-IN CONTENT for `export-flow`: one wedding, three albums, and the
 * numbers the Download menu's rows are made of.
 *
 * ★ EVERY NUMBER HERE IS A BYTE COUNT, NEVER A STRING. A menu row's hint is
 * `formatCount(count) · formatBytes(bytes)` over a sum of buckets, so a fixture
 * that wrote "2.6 GB" would be a claim the board could not check. These carry
 * counts and bytes, the real `ExportSummary` shape the summary endpoint
 * returns, and every caption on the board is read back off the laid-out DOM
 * (board.tsx).
 *
 * ★ NO NEW ASSET. Every tile is one of the bootstrap stills every other board
 * reuses (`MARKETING_IMAGES`), so there is nothing to ask Will for and nothing
 * to track (2026-09-17/18).
 */

export const EVENT = {
  name: "Mia & Theo's Wedding",
  /** The host's name on the guest page's byline. */
  host: "Mia",
  date: "15 August 2026",
  guests: 34,
  /** The album's own address, which the phone's share sheet names. */
  url: "partyreel.com/e/mia-and-theo",
} as const;

/** One photograph off an iPhone, and one 40 second clip, in bytes. */
const PHOTO = 4_410_000;
const VIDEO = 98_200_000;

const bucket = (count: number, each: number) => ({
  count,
  bytes: count * each,
});

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

export type AlbumId = "wedding" | "small" | "over";

export type Album = {
  readonly id: AlbumId;
  readonly summary: ExportSummary;
  /** What the guest who is looking added herself: View's Yours, and `mine`'s row. */
  readonly mine: ExportSummary;
};

/**
 * THREE ALBUMS, BECAUSE THE MENU IS THREE DIFFERENT OBJECTS IN THEM. A wedding
 * is the ordinary case; twelve photographs is the case where a row counts
 * nothing (no videos); 2,440 items is where the limit disables rows.
 *
 * ★ THE TEASER LEFT WITH `chips` (the identity/reel recheck, 2026-09-22): a
 * teaser viewer is held at an inert backdrop the whole way
 * (docs/systems/guest-flow.md, "no exit"), so she never sees Download.
 */
export const ALBUMS: Record<AlbumId, Album> = {
  wedding: {
    id: "wedding",
    summary: summary(126, 22, 6, 1),
    mine: summary(11, 3),
  },
  small: {
    id: "small",
    summary: summary(12, 0),
    mine: summary(4, 0),
  },
  over: {
    id: "over",
    summary: summary(2280, 160, 0, 0),
    mine: summary(31, 4),
  },
};

export const albumOf = (v: string | undefined): Album =>
  v === "small" || v === "over" ? ALBUMS[v] : ALBUMS.wedding;

/* ── the menu's own arithmetic, copied from the shipped component ────────── */

/**
 * ★ `bucketFor` AND `totalFor` ARE PRIVATE TO `export-dialog.tsx`, so they are
 * reproduced here rather than imported, and reproduced EXACTLY: every count and
 * size on this board is the sum the shipped menu would show for the same
 * summary. If the menu's arithmetic ever changes, this is the copy that has to
 * move with it (there is no seam to import, and adding one is an edit to a
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

/* ── the photographs the album draws ──────────────────────────────────────── */

/** Each still's own shape, as the rows lay it (width over height). */
const RATIOS = [4 / 5, 1, 3 / 4, 4 / 3, 16 / 10, 3 / 2, 2 / 3, 5 / 4];

export type Still = {
  readonly id: string;
  readonly src: string;
  readonly ratio: number;
};

export const STILLS: readonly Still[] = Array.from({ length: 20 }, (_, i) => ({
  id: `xf-${i}`,
  src: MARKETING_IMAGES[i % MARKETING_IMAGES.length].src,
  ratio: RATIOS[i % RATIOS.length],
}));

/** Which of the album's stills this guest ticked, for the `picked` option. */
export const PICKED = new Set([
  "xf-1",
  "xf-4",
  "xf-7",
  "xf-9",
  "xf-12",
  "xf-15",
]);
