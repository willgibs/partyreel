import {
  columnsFor,
  type HerShot,
  layoutSheet,
  sheetCapFor,
} from "@/lib/disposable/contact-sheet";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";

import { DEVELOPS_AT, type Photo } from "./fixtures";

/**
 * WHERE EVERYTHING STANDS, BY PRODUCTION'S OWN ARITHMETIC (pure: no DOM). The
 * sheet is `contact-sheet.ts`'s (its columns, its cap and `layoutSheet`'s
 * squares), the album is `album-rows.ts`'s (its photographs a row at the box's
 * width and its rhythm), so a develop drawn here starts on the sheet the album
 * draws tonight and ends on the rows it draws in the morning.
 *
 * ★ THE ONLY MEASURING IS THE DRAWING'S: a square's place on screen is read off
 * the frame once it lays out (`develop.tsx`), never predicted from here, so the
 * square a photograph grows out of is the square drawn, to the pixel.
 */

/* ── the page's boxes (production's numbers, `event-experience.tsx`) ───────── */

/** The album's box: the window less its gutter (`px-3 sm:px-5`). */
export const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);

/** The gap between two photographs, and between two rows (`--gap-gallery`). */
export const GAP = 3;

/** The sheet's own gap (`.wait-sheet`), and the squares' corners. */
export const SHEET_GAP = 3;

/** The well's width at which the count stands beside the sheet (`gallery-empty-state-sheet.tsx`). */
const SIDE_BY_SIDE_PX = 1024;

/** The sheet's width inside its well: the well less its padding, and the count's column at a desk. */
export function sheetWidthIn(well: number): number {
  return well >= SIDE_BY_SIDE_PX ? well - 64 - (224 + 40) : well - 32;
}

export const wideWell = (well: number) => well >= SIDE_BY_SIDE_PX;

/* ── the sheet ───────────────────────────────────────────────────────────── */

export type SheetCell = {
  key: string;
  kind: "theirs" | "hers";
  photo: Photo;
};

export type SheetPlan = {
  columns: number;
  cells: SheetCell[];
  /** Older squares folded into the "+N" at its head (none on a sheet with room for all). */
  folded: number;
  /** Everyone's, hers included: the sync's count. */
  count: number;
  hers: number;
};

/** The develop's instant: nothing on the sheet is warm by morning. */
const DEVELOP_MS = Date.parse(DEVELOPS_AT);

/** Her shots as her tracker publishes them (`HerShots`): her own pictures, when she took each. */
export function herShots(roll: readonly Photo[]): HerShot[] {
  return roll
    .filter((p) => p.mine)
    .map((p) => ({
      key: p.id,
      at: p.at,
      src: p.picture.src,
      video: p.video !== undefined,
      sending: false,
    }));
}

/**
 * THE SHEET AS THE ALBUM DREW IT AT THE DEVELOP: everyone's from the count and
 * its minutes, hers at hers (`layoutSheet`), capped as production caps it (or
 * whole, where `cap` is null: the darkroom's sheet has the screen to itself),
 * each square given the photograph it is.
 */
export function planSheet(
  roll: readonly Photo[],
  columns: number,
  cap: number | null,
): SheetPlan {
  const minutes = new Map<number, number>();
  for (const p of roll) minutes.set(p.at, (minutes.get(p.at) ?? 0) + 1);
  const limit = cap ?? roll.length + 3;
  const full = layoutSheet({
    waiting: { count: roll.length, minutes: [...minutes.entries()] },
    hers: herShots(roll),
    cap: limit,
    nowMs: DEVELOP_MS,
  });
  // A capped sheet gives its first cells to the fold's chip, so the rows stay the cap's (the drawing's own rule).
  const sheet =
    full.folded > 0
      ? layoutSheet({
          waiting: { count: roll.length, minutes: [...minutes.entries()] },
          hers: herShots(roll),
          cap: limit - 3,
          nowMs: DEVELOP_MS,
        })
      : full;

  // Everyone's squares are numbers: each takes the next photograph of its own minute that is not hers.
  const theirs = new Map<number, Photo[]>();
  for (const p of roll)
    if (!p.mine) theirs.set(p.at, [...(theirs.get(p.at) ?? []), p]);
  const byId = new Map(roll.map((p) => [p.id, p]));
  // The folded squares are the oldest: spend their minutes' photographs first.
  const foldedPhotos = roll.slice(0, sheet.folded).filter((p) => !p.mine);
  for (const p of foldedPhotos) {
    const list = theirs.get(p.at);
    if (list) list.splice(list.indexOf(p), 1);
  }
  const cells: SheetCell[] = sheet.cells.map((cell) => {
    if (cell.kind === "hers") {
      const photo = byId.get(cell.key.slice(2))!;
      return { key: cell.key, kind: "hers", photo };
    }
    const list = theirs.get(cell.minute) ?? [];
    const photo = list.shift() ?? roll[roll.length - 1]!;
    return { key: cell.key, kind: "theirs", photo };
  });
  return {
    columns,
    cells,
    folded: sheet.folded,
    count: sheet.count,
    hers: sheet.hers,
  };
}

/** The sheet the album draws over its rows, in a well of this width (production's columns and cap). */
export function pageSheet(roll: readonly Photo[], well: number): SheetPlan {
  const columns = columnsFor(sheetWidthIn(well));
  return planSheet(roll, columns, sheetCapFor(columns));
}

/* ── the album ───────────────────────────────────────────────────────────── */

export type Tile = {
  photo: Photo;
  /** Its place in the album, newest first. */
  i: number;
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
};

export type AlbumPlan = {
  tiles: Tile[];
  /** The rows' height, as far as they are laid. */
  height: number;
  perRow: number;
};

/** The visit's seed for the rhythm's picks (`rhythmSeed`): one seed, the same features every draw. */
const RHYTHM_SEED = 7;

/**
 * THE ALBUM'S ROWS AT THIS BOX WIDTH, production's justified rows at its middle
 * step with its rhythm (`GalleryRows`: `rowRhythm="double"`), laid as far down
 * as `depth` px (a frame never needs the whole album).
 */
export function planAlbum(
  album: readonly Photo[],
  width: number,
  depth: number,
): AlbumPlan {
  const perRow = perRowFor(width, 1);
  const base = album.map((p) => ({ id: p.id, ratio: p.ratio }));
  const features = pickFeatures(base, RHYTHM_SEED, perRow);
  const items: RowItem[] = base.map((it) =>
    features.has(it.id) ? { ...it, feature: true } : it,
  );
  const layout = layoutRows(items, {
    width,
    gap: GAP,
    perRow,
    anchor: "end",
    feature: "double",
  });
  const byId = new Map(album.map((p, i) => [p.id, { p, i }]));
  const tiles: Tile[] = [];
  let y = 0;
  for (const [r, row] of layout.rows.entries()) {
    if (y > depth) break;
    let x = 0;
    row.ids.forEach((id, k) => {
      const at = byId.get(id)!;
      const w = row.widths[k]!;
      tiles.push({ photo: at.p, i: at.i, x, y, w, h: row.height, row: r });
      x += w + GAP;
    });
    y += row.height + GAP;
  }
  return { tiles, height: Math.max(0, y - GAP), perRow };
}

/* ── a square growing into its photograph ─────────────────────────────────── */

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * THE FLIP THAT KEEPS ITS PICTURE: a tile laid at its own place and size,
 * scaled down until its shorter side is the square's, clipped to its centre
 * square and moved onto the square. That centre square is exactly what the
 * square showed (both crop the photograph from its centre), so the square IS the
 * tile from the first frame and growing it to `none` never jumps or squeezes.
 */
export function flipFrom(square: Rect, tile: Rect) {
  const m = Math.min(tile.w, tile.h);
  const k = square.w / m;
  const ix = (tile.w - m) / 2;
  const iy = (tile.h - m) / 2;
  return {
    "--tw-dx": `${square.x - tile.x - k * ix}px`,
    "--tw-dy": `${square.y - tile.y - k * iy}px`,
    "--tw-k": `${k}`,
    "--tw-ix": `${ix}px`,
    "--tw-iy": `${iy}px`,
    "--tw-r0": `${3 / k}px`,
  } as const;
}
