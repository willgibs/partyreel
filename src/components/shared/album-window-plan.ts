/**
 * THE ROWS' FIRST PAINT, AS ARITHMETIC THE SERVER CAN RUN TOO (the album-guest-wiring lane). The
 * windowed rows (`album-window.tsx`) paint before they can measure their box, so their first paint
 * is laid per width class; this module is that plan, lifted out of the client component so the
 * guest page's server render can ask the one question it needs answered before any byte goes out:
 * which photographs does the first paint draw, so their links can ride the page (`firstPaintIds`).
 * A plan computed twice, once to embed links and once to draw, must be the same plan: one home, and
 * the browser hydrates with the plan the server drew rather than its own (`decodeFirstPaint`).
 *
 * Pure: no DOM, no React.
 */
import { rowRatio } from "@/lib/media/tile-aspect";
import {
  layoutRows,
  meanRatio,
  pickFeatures,
  ROW_CLASSES,
  type RowAnchor,
  type RowFeature,
  type RowItem,
  type RowStep,
} from "@/lib/shared/album-rows";

/** The rhythm: plain rows, or a feature row now and then (`RowFeature`). */
export type RowRhythm = "plain" | RowFeature;

/**
 * THE WIDTH EACH CLASS'S FIRST PAINT IS LAID AT: a phone's album box, a
 * tablet's, a small laptop's, a desk's. The server has no width, but a class's
 * breaks barely depend on it: the engine's cost is a ratio of heights, and the
 * gaps are the only length in it, so the rows laid at the class's nominal width
 * are the rows the measure lays at any width in the class, give or take a
 * marginal row.
 */
export const NOMINAL_WIDTH = [351, 728, 984, 1400] as const;
export const NOMINAL_GAP = 4;

/**
 * HOW MANY PHOTOGRAPHS THE FIRST PAINT DRAWS before the box is measured: six of
 * the densest desk rows, more than a phone's first screens, and the rest a
 * spacer until the window takes over. The server renders exactly these (plus
 * whatever completes the row the last of them sits in, in any class).
 */
export const FIRST_PAINT = 48;

/** Where a head slot's id is kept apart from every photograph's. */
export const HEAD_ID = "rows-head:";

/** Whether a laid id is a photograph (not one of the head's upload tiles). */
export const isPhoto = (id: string) => !id.startsWith(HEAD_ID);

/**
 * THE HEAD SLOT'S NOMINAL SHAPE. What stands at the album's head (the guest's
 * upload stack, a held photograph waiting for the host) has no dimensions the
 * grid can see, so it takes a square: the shape a photograph nobody measured
 * takes too (`ROW_FALLBACK_RATIO`), and the one that crops either orientation
 * least.
 */
const HEAD_RATIO = 1;

/** The class a box width falls in (`ROW_CLASSES`' own breakpoints). */
export function rowClassOf(width: number): number {
  let cls = 0;
  ROW_CLASSES.forEach((c, i) => {
    if (width >= c.min) cls = i;
  });
  return cls;
}

/**
 * ★ A REMEMBERED WIDTH MAKES ONE CLASS EXACT. The album writes the width it
 * last laid its rows at into a small functional cookie (`ALBUM_WIDTH_COOKIE`),
 * and the server lays that width's class at that width instead of the class's
 * nominal one: the first paint's breaks are then the breaks the measure lays, to
 * the row, and nothing on the first screen moves at hydration. Every other class
 * keeps its nominal width, so a window that changed class since still paints
 * its own class's rows. Absent (a first visit, a new device), every class is
 * nominal: the classes themselves are the cold guess.
 */
export function classWidths(remembered?: number | null): number[] {
  const widths: number[] = [...NOMINAL_WIDTH];
  if (
    typeof remembered === "number" &&
    Number.isFinite(remembered) &&
    remembered > 0
  )
    widths[rowClassOf(remembered)] = remembered;
  return widths;
}

/** The list the engine lays: every photograph's row ratio, the rhythm's picks, the head's slots. */
export function rowItemsFor(
  items: readonly {
    id: string;
    width?: number | null;
    height?: number | null;
  }[],
  clampAspect: boolean,
  picks: { seed: number; perRow: number } | null,
  heads: readonly string[],
  anchor: RowAnchor,
): RowItem[] {
  const list: RowItem[] = items.map((m) => ({
    id: m.id,
    ratio: rowRatio(m, clampAspect),
  }));
  if (picks) {
    const featured = pickFeatures(list, picks.seed, picks.perRow);
    for (let i = 0; i < list.length; i++)
      if (featured.has(list[i].id)) list[i] = { ...list[i], feature: true };
  }
  const slots = heads.map((key) => ({ id: HEAD_ID + key, ratio: HEAD_RATIO }));
  return anchor === "end" ? [...slots, ...list] : [...list, ...slots];
}

export type FirstPaintPlan = {
  count: number;
  breaksAfter: Map<string, number[]>;
  rest: string[];
  fill: number[];
};

/**
 * ★ THE FIRST PAINT IS ALREADY THE ENGINE'S ROWS. It used to wrap greedily on
 * the target, and the measured layout then re-broke every row on screen: on a
 * phone whose JavaScript lands a second after the HTML, the whole first screen
 * jumped (a layout shift of 0.76, measured at a 4x throttle). So the server lays
 * the rows once per width class at that class's width (`classWidths`), draws
 * each class's breaks as full-width breaks shown only in their class, and a
 * spacer per class stands for the rest at its laid height, scaled to the box.
 *
 * ★ EVERY BASIS IS ZERO, SO ONLY A DRAWN BREAK ENDS A LINE. Flex wraps a line on
 * its items' bases before it shrinks anything, so a basis anywhere near a
 * photograph's width wrapped a class's row early wherever its bases ran over
 * the box. With zero bases a line is exactly what lies between two breaks, and
 * each photograph's `flex-grow` (its ratio) makes it the engine's row. A last
 * line a class leaves unfinished shares its width with a filler grown by that
 * class's missing ratio (`fill`), so it stands about the target height.
 */
export function firstPaintPlan(
  list: readonly RowItem[],
  step: RowStep,
  rhythm: RowRhythm,
  seed: number,
  anchor: RowAnchor,
  feature: RowFeature,
  widths: readonly number[] = NOMINAL_WIDTH,
): FirstPaintPlan {
  const laid = widths.map((width, c) => {
    const perRow = ROW_CLASSES[c].perRow[step];
    const picks = rhythm === "plain" ? null : pickFeatures(list, seed, perRow);
    const items = picks
      ? list.map((it) => (picks.has(it.id) ? { ...it, feature: true } : it))
      : list;
    return layoutRows(items, {
      width,
      gap: NOMINAL_GAP,
      perRow,
      anchor,
      feature,
    });
  });
  // Every photograph up to the end of the row the last of the first ones sits
  // in, in whichever class that row runs longest.
  let count = Math.min(list.length, FIRST_PAINT);
  for (const layout of laid) {
    let end = 0;
    for (const row of layout.rows) {
      if (end >= FIRST_PAINT) break;
      end += row.ids.length;
    }
    count = Math.max(count, Math.min(list.length, end));
  }
  const breaksAfter = new Map<string, number[]>();
  const rest: string[] = [];
  const fill: number[] = [];
  const mean = meanRatio(list);
  laid.forEach((layout, c) => {
    let end = 0;
    let height = 0;
    // What a row needs to stand at the target height, in ratio: a line short
    // of it takes the balance as filler.
    const full = ROW_CLASSES[c].perRow[step] * mean;
    // An album too small to fill a row is one centred row at the cap: no
    // break, so its line keeps about the target height rather than stretching
    // a photograph or two across the whole box.
    if (layout.tiny) {
      rest.push("0px");
      fill.push(Math.max(0, full - list.reduce((n, it) => n + it.ratio, 0)));
      return;
    }
    // ★ THE FIRST ROW THE FIRST PAINT CANNOT FINISH ENDS ITS BREAKS: that row is
    // its unfinished last line, and every row after it is the spacer's. A
    // shorter row further down (a feature row holds fewer) used to "fit" again,
    // so it was given a break past the last photograph drawn, the filler was
    // sized for the wrong photographs and the spacer lost that row's height.
    let open = true;
    for (const row of layout.rows) {
      if (!open || end + row.ids.length > count) {
        open = false;
        height += row.height + NOMINAL_GAP;
        continue;
      }
      end += row.ids.length;
      const last = row.ids[row.ids.length - 1];
      breaksAfter.set(last, [...(breaksAfter.get(last) ?? []), c]);
    }
    let unfinished = 0;
    for (let i = end; i < count; i++) unfinished += list[i].ratio;
    fill.push(unfinished > 0 ? Math.max(0, full - unfinished) : 0);
    rest.push(`calc(${height / widths[c]} * 100cqw)`);
  });
  return { count, breaksAfter, rest, fill };
}

/* ── The plan the server drew, handed to the hydration ───────────────────── */

/**
 * ★ THE SERVER'S PLAN IS THE PLAN THE BROWSER HYDRATES WITH. The engine prices
 * a row with logs and powers, which ECMAScript lets every engine round its own
 * way: Node's V8 and a browser's disagree in the last bit on 5 to 10% of inputs
 * (measured: `Math.log`, `**` and `Math.exp`, Node 22 against Chrome 153), and
 * on an album of near-identical shapes (every phone's 4:3) a last bit decides a
 * near-tie between two partitions. So one plan laid twice, in the server's
 * render and again in the hydration, differed on about one load in ten on the
 * scale probe: a React hydration error, and the album thrown away and drawn
 * again. The render writes the plan it drew onto the grid (`encodeFirstPaint`,
 * a few hundred bytes) and the hydration reads it back (`decodeFirstPaint`)
 * whenever it was laid for this very list and these parameters
 * (`firstPaintKey`); anything else lays its own plan, as before.
 */
export function firstPaintKey(
  list: readonly RowItem[],
  step: RowStep,
  rhythm: RowRhythm,
  seed: number,
  anchor: RowAnchor,
  feature: RowFeature,
  widths: readonly number[],
): string {
  // Two 32-bit string hashes over every id and shape: integer arithmetic, so
  // every engine agrees (a shape is a quotient of two integers, exact anywhere).
  let a = 0x811c9dc5;
  let b = 5381;
  const mix = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193) >>> 0;
      b = (Math.imul(b, 33) + c) >>> 0;
    }
  };
  for (const it of list) mix(`${it.id}:${it.ratio}${it.feature ? "*" : ";"}`);
  return [
    list.length,
    a.toString(36),
    b.toString(36),
    step,
    rhythm,
    seed,
    anchor,
    feature,
    widths.join(","),
  ].join("|");
}

/** The plan as the grid carries it: its key, count, breaks by position, rests and fills. */
export function encodeFirstPaint(
  plan: FirstPaintPlan,
  list: readonly RowItem[],
  key: string,
): string {
  const breaks: [number, number[]][] = [];
  list.slice(0, plan.count).forEach((it, i) => {
    const classes = plan.breaksAfter.get(it.id);
    if (classes) breaks.push([i, classes]);
  });
  return JSON.stringify({
    k: key,
    n: plan.count,
    b: breaks,
    r: plan.rest,
    f: plan.fill,
  });
}

/** The plan a grid carried, when it was laid for `key`; else null (lay your own). */
export function decodeFirstPaint(
  wire: string | null | undefined,
  list: readonly RowItem[],
  key: string,
): FirstPaintPlan | null {
  if (!wire) return null;
  let o: { k?: unknown; n?: unknown; b?: unknown; r?: unknown; f?: unknown };
  try {
    o = JSON.parse(wire);
  } catch {
    return null;
  }
  const count = o?.n;
  if (
    o?.k !== key ||
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > list.length ||
    !Array.isArray(o.b) ||
    !Array.isArray(o.r) ||
    !o.r.every((s) => typeof s === "string") ||
    !Array.isArray(o.f) ||
    !o.f.every((n) => typeof n === "number")
  )
    return null;
  const breaksAfter = new Map<string, number[]>();
  for (const entry of o.b as unknown[]) {
    if (!Array.isArray(entry)) return null;
    const [i, classes] = entry as [unknown, unknown];
    if (
      typeof i !== "number" ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= count ||
      !Array.isArray(classes) ||
      !classes.every((c) => Number.isInteger(c))
    )
      return null;
    breaksAfter.set(list[i].id, classes as number[]);
  }
  return {
    count,
    breaksAfter,
    rest: o.r as string[],
    fill: o.f as number[],
  };
}

/**
 * THE PHOTOGRAPHS THE FIRST PAINT DRAWS, for a newest-first album with no head
 * (the guest page's server render: the upload tiles exist only on the device
 * that is uploading). The page mints exactly these ids' links into the render,
 * so every tile the first paint draws has its picture from the first byte.
 */
export function firstPaintIds(
  items: readonly {
    id: string;
    width?: number | null;
    height?: number | null;
  }[],
  opts: {
    step: RowStep;
    rhythm: RowRhythm;
    seed: number;
    width?: number | null;
  },
): string[] {
  if (items.length === 0) return [];
  const feature: RowFeature = opts.rhythm === "plain" ? "double" : opts.rhythm;
  const widths = classWidths(opts.width);
  // The rhythm's picks count photographs per row, which differs by class: the
  // plan picks per class itself, so the list goes in plain here, exactly as
  // the client's first paint hands it over.
  const list = rowItemsFor(items, false, null, [], "end");
  const plan = firstPaintPlan(
    list,
    opts.step,
    opts.rhythm,
    opts.seed,
    "end",
    feature,
    widths,
  );
  return list.slice(0, plan.count).map((it) => it.id);
}

/* ── The remembered width ─────────────────────────────────────────────────── */

/**
 * THE SMALL FUNCTIONAL COOKIE THE FIRST PAINT READS (`classWidths`): the width
 * the album last laid its rows at, in whole pixels. A layout hint and nothing
 * else (no identity, no preference), so it is written from the browser the
 * moment the rows are laid, and path-scoped to the surface that laid it: the
 * guest album's box and the host's feed sit in different chrome, and one
 * cookie shared between them would hand each the other's width.
 */
export const ALBUM_WIDTH_COOKIE = "pr_album_w";

/** A width off the cookie, or null when it is not one a real album box could be. */
export function parseAlbumWidth(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 200 && n <= 8000 ? n : null;
}

/** Remember the width the rows were laid at, for this surface's next first paint. */
export function rememberAlbumWidth(width: number, path: string): void {
  if (typeof document === "undefined") return;
  const px = Math.round(width);
  if (parseAlbumWidth(String(px)) === null) return;
  const cookie = `${ALBUM_WIDTH_COOKIE}=${px}`;
  if (document.cookie.split("; ").includes(cookie)) return;
  document.cookie = `${cookie}; Path=${path}; Max-Age=31536000; SameSite=Lax`;
}
