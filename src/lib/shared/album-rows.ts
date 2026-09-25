/**
 * THE ALBUM'S JUSTIFIED ROWS — the engine (`album-columns`, Will's round-1
 * picks: `layout=justified`, `scale=ceiling`, `phone=step-three`,
 * `control=slider`). Pure: no DOM, no React, so every rule below is a node
 * test away.
 *
 * ★ NO ROW EVER LEAVES A GAP AT THE RIGHT EDGE (his question on `justified`:
 * "will this ever lead to gaps, particularly on the right side...? Gaps make it
 * feel very unbalanced"). The greedy pack every justified gallery ships (fill
 * a row until the next photo overshoots, stretch it, leave the last row
 * ragged) is what makes those gaps. This picks the breaks the way a typesetter
 * justifies a paragraph: over the WHOLE album, the partition whose rows sit
 * closest to the target height, every row filling the box exactly. The
 * paragraph's last line, the oldest row, justifies too; it alone may run
 * taller than the band, up to a hard cap, which is what lets the leftovers
 * land somewhere without bending every other row. Only an album too small to
 * fill one row at that cap is not justified: one row at the cap, centred,
 * balanced rather than ragged.
 *
 * ★ AN ARRIVAL IS LOCAL, AND THAT IS NOT FREE. The optimum is global: re-run
 * on each arrival, the paths from a new head need not merge with the old ones
 * (a uniform 3:4 album shifts almost every row), which is the whole album
 * moving under a guest's thumb, the exact thing `live=land` refused. So the
 * full layout runs only on load, a resize, a step change and a filter;
 * everything else re-solves a WINDOW pinned at its edges (`reflowRows`): an
 * arrival at the growing end takes the new photos and the three rows beside
 * them, a hide or a mid-album insert takes its row and its neighbours, and a
 * window stretches by one row at most when its best answer still breaks the
 * band. No more than four old rows ever move, and never a row the reader is
 * looking at for a change outside it (`HeldRows`).
 *
 * ★ STEPS ARE PHOTOS PER ROW, NEVER PIXELS (`control=slider`: "3-5 fixed
 * steps... a fine pixel slider means images may not cleanly fill the gallery
 * edge to edge"). A pixel height means a different number of photographs on
 * every screen, and two steps can collapse into one; a count keeps all three
 * distinct at any width (`ROW_CLASSES`). Past a desk, wider screens grow the
 * rows rather than add photographs (`scale=ceiling`).
 *
 * O(n·k): the break search only walks rows that could still sit in the band,
 * so 1,145 photographs lay out in well under the frame budget.
 */
import {
  ROW_FALLBACK_RATIO,
  ROW_MAX_RATIO,
  ROW_MIN_RATIO,
} from "@/lib/media/tile-aspect";

/** Which end of the list is fixed. A newest-first album grows at its head,
 *  so its OLDEST end is the anchor; an oldest-first sort anchors its start. */
export type RowAnchor = "start" | "end";

/**
 * How a featured photograph's row is laid (the rhythm): `double` runs its row
 * at twice the target height, led by it; `solo` gives it the whole row alone,
 * cropped to a wide band when it would otherwise stand taller than that.
 */
export type RowFeature = "double" | "solo";

export type RowItem = {
  readonly id: string;
  /** width / height. Sanitized here too (clamped, a fallback for garbage). */
  readonly ratio: number;
  /** A feature row leads with this photograph (the rhythm's own pick). */
  readonly feature?: boolean;
};

export type RowsParams = {
  /** The box's content width, px. Fractional is fine. */
  readonly width: number;
  /** The gap between two tiles in a row, px (rows are spaced by the same). */
  readonly gap: number;
  /** The step's photographs per row (`perRowFor`). */
  readonly perRow: number;
  /** Defaults to "end": a newest-first album. */
  readonly anchor?: RowAnchor;
  /** How a featured row is laid; ignored when no item is featured. */
  readonly feature?: RowFeature;
};

export type Row = {
  readonly ids: readonly string[];
  /** Whole pixels, one per id. A justified row's sum plus its gaps is the box width within half a pixel. */
  readonly widths: readonly number[];
  /** Whole pixels, the same for every tile in the row. */
  readonly height: number;
  /** Fills the box: every row but a tiny album's. */
  readonly justified: boolean;
  /** Led by a featured photograph (the rhythm). */
  readonly feature: boolean;
};

export type RowsLayout = {
  readonly width: number;
  readonly gap: number;
  readonly perRow: number;
  readonly anchor: RowAnchor;
  readonly feature: RowFeature;
  /**
   * The target row height, px. Fixed between full layouts, so a local reflow
   * answers to the same target as the rows it sits beside.
   */
  readonly target: number;
  /** The items as laid (sanitized), in display order. */
  readonly items: readonly RowItem[];
  readonly rows: readonly Row[];
  /** Too small to fill one row at the cap: one row, centred. */
  readonly tiny: boolean;
};

/* ── The steps ──────────────────────────────────────────────────────────── */

/**
 * THREE STEPS, EVERYWHERE (his `steps` note on round two: "We could reduce the
 * amount of steps on a phone to 3 max (effectively 1 item, 2 items, 3 items per
 * row) so 4-5 items per row doesn't force us to load in a ton of media at
 * once... This may even justify 3 steps max on desktop too, your call!"; the
 * Orchestrator's call extended it to every width). Fewer, further-apart stops
 * also read as a real choice on the slider rather than a nudge.
 */
export const ROW_STEP_COUNT = 3;
export type RowStep = 0 | 1 | 2;
/** The middle step: 2 a row on a phone, 3 on a tablet, 5 at a desk. */
export const DEFAULT_ROW_STEP: RowStep = 1;

/**
 * PHOTOGRAPHS PER ROW, BY THE ALBUM BOX'S OWN WIDTH, AT EACH OF THE THREE
 * STEPS (largest photographs first). The box, never the window: the host's
 * feed and the guest's album sit in different chrome, and a count is only
 * honest against the width it is laid in.
 *
 * - Under 480, a phone: 1, 2 or 3 (his own three).
 * - From 480 through a tablet: 2, 3 or 4 (`phone=step-three`, and his note:
 *   "The additional conditional third column would benefit tablet
 *   breakpoints").
 * - A tablet on its side or a small laptop: 3, 4 or 6, so the step from tablet
 *   to desk is never a jump from 3 straight to 5.
 * - From 1280, a desk: 3, 5 or 8, and eight is the ceiling (`scale=ceiling`):
 *   a 2560 monitor shows the same eight, bigger.
 */
export const ROW_CLASSES: readonly {
  readonly min: number;
  readonly perRow: readonly [number, number, number];
}[] = [
  { min: 0, perRow: [1, 2, 3] },
  { min: 480, perRow: [2, 3, 4] },
  { min: 900, perRow: [3, 4, 6] },
  { min: 1280, perRow: [3, 5, 8] },
];

export function isRowStep(n: unknown): n is RowStep {
  return n === 0 || n === 1 || n === 2;
}

/** The step's photographs per row at this box width. */
export function perRowFor(width: number, step: RowStep): number {
  let cls = ROW_CLASSES[0];
  for (const c of ROW_CLASSES) if (width >= c.min) cls = c;
  return cls.perRow[isRowStep(step) ? step : DEFAULT_ROW_STEP];
}

/* ── The band, the cap, the target ──────────────────────────────────────── */

/**
 * THE SOFT BAND, as a multiple of the target either way: a row inside
 * target × [1/hi, hi] costs its squared log distance from the target; outside
 * it the cost climbs steeply. It widens as rows hold fewer photographs, because
 * one photograph more or less moves a two-photo row by half and an eight-photo
 * row by an eighth: a band that suits the desk would be unreachable on a phone.
 */
export function bandFor(perRow: number): number {
  return 1 + 1.15 / Math.max(1, perRow) ** 0.8;
}

/**
 * THE HARD CAP, as a multiple of the target: no row ever stands taller. It is
 * what bounds the oldest row (the one row allowed past the band) and what
 * decides that an album is tiny.
 */
export function capFor(perRow: number): number {
  return bandFor(perRow) * 1.3;
}

/**
 * A row the break search stops extending below: adding photographs only
 * shortens a row, so once one is this far under the target no longer row can
 * be any good. It is what makes the search O(n·k) rather than O(n²).
 */
const FLOOR = 0.4;

/** How much steeper the cost climbs outside the band. */
const BAND_PENALTY = 40;

/** The oldest row's taller side costs a quarter: the paragraph's last line. */
const ANCHOR_SLACK = 0.25;

/** A feature row's height, as a multiple of the plain target, at most. */
export const FEATURE_SCALE = 2;

/**
 * A featured photograph that cannot stand at least this much taller than a
 * plain row is laid plain: a feature row no bigger than its neighbours is no
 * feature. On a phone at one or one and a half a row, every photograph is
 * already alone, so this is what quietly turns the rhythm off there.
 */
const FEATURE_MIN_GAIN = 1.3;

/**
 * What honouring a feature is worth: a featured photograph laid plain costs
 * this, about what one badly-out-of-band row costs. So the search keeps every
 * feature it can, but never bends the rows around one past the band to do it,
 * and a pick that cannot be honoured (two landscapes a portrait apart, the
 * oldest photograph at a dense step) is simply laid plain rather than sinking
 * the album.
 */
const FEATURE_MISS = 0.35;

/** The mean ratio the target is computed from, bounded so a strange album
 *  cannot ask for absurd rows. An empty album reads a typical phone mix. */
const MEAN_MIN = 0.6;
const MEAN_MAX = 1.6;
const MEAN_EMPTY = 0.88;

/** Clamp a ratio into the row band; garbage takes the fallback. */
export function sanitizeRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return ROW_FALLBACK_RATIO;
  return Math.min(Math.max(ratio, ROW_MIN_RATIO), ROW_MAX_RATIO);
}

/** The album's mean ratio, bounded: the unit a "photograph per row" is counted in. */
export function meanRatio(items: readonly { ratio: number }[]): number {
  if (items.length === 0) return MEAN_EMPTY;
  let sum = 0;
  for (const it of items) sum += sanitizeRatio(it.ratio);
  return Math.min(Math.max(sum / items.length, MEAN_MIN), MEAN_MAX);
}

/**
 * THE TARGET HEIGHT: the height at which `perRow` photographs of the album's
 * mean shape fill the box. Counting in the album's own mean is what makes
 * "about 2 a row" true of a portrait album and a landscape one alike.
 */
export function targetFor(
  width: number,
  gap: number,
  perRow: number,
  mean: number,
): number {
  const gaps = Math.max(0, Math.ceil(perRow) - 1) * gap;
  return Math.max(1, (width - gaps) / (perRow * mean));
}

/* ── The break search ──────────────────────────────────────────────────── */

type Ctx = {
  readonly width: number;
  readonly gap: number;
  readonly target: number;
  readonly band: number; // ln(hi)
  readonly cap: number; // px
  readonly feature: RowFeature;
};

function contextFor(
  width: number,
  gap: number,
  perRow: number,
  target: number,
  feature: RowFeature,
): Ctx {
  return {
    width,
    gap,
    target,
    band: Math.log(bandFor(perRow)),
    cap: target * capFor(perRow),
    feature,
  };
}

/**
 * One row's cost at height `h` against `target`. Squared log distance, so a
 * row twice too tall is exactly as wrong as one half too short, and steeper
 * past the band. The anchor row (the oldest) pays a quarter on its taller
 * side and nothing extra past the band: the paragraph's last line, justified
 * rather than ragged, where the leftovers land. Its shorter side is costed
 * like any row's, so the search never crams photographs into it.
 */
function rowCost(
  h: number,
  target: number,
  band: number,
  anchorRow: boolean,
): number {
  const x = Math.log(h / target);
  if (anchorRow && x > 0) return ANCHOR_SLACK * x * x;
  const over = Math.abs(x) - band;
  return x * x + (over > 0 ? BAND_PENALTY * over * over : 0);
}

/**
 * The height a featured photograph's row aims at, or 0 when it would be no
 * feature (see `FEATURE_MIN_GAIN`): `double` aims at twice the target, or the
 * photograph alone at full width when that is shorter; `solo` is the
 * photograph alone, cropped to twice the target at most.
 */
function featureTarget(ratio: number, ctx: Ctx): number {
  const alone = ctx.width / ratio;
  const t = Math.min(alone, ctx.target * FEATURE_SCALE);
  return t >= ctx.target * FEATURE_MIN_GAIN ? t : 0;
}

/**
 * THE OPTIMAL BREAKS over items[from, to): the start index of every row plus
 * `to`, or null when no partition keeps every row under its cap.
 *
 * `anchorAt` names the row that is the paragraph's last line: "last" for the
 * row ending at `to` (a newest-first album's oldest row), "first" for the row
 * starting at `from` (an oldest-first one's), null for a window pinned on
 * both sides.
 *
 * `featured[i]` is the height a featured photograph's row aims at (0 = not
 * featured). A feature row is one the featured photograph LEADS (and, for
 * `solo`, holds alone); a featured photograph anywhere else is laid plain and
 * the partition pays `FEATURE_MISS` for it.
 */
function solve(
  ratios: readonly number[],
  featured: readonly number[],
  from: number,
  to: number,
  ctx: Ctx,
  anchorAt: "first" | "last" | null,
): { breaks: number[]; features: boolean[]; cost: number } | null {
  const n = to - from;
  if (n <= 0) return { breaks: [from], features: [], cost: 0 };
  const best = new Float64Array(n + 1).fill(Number.POSITIVE_INFINITY);
  const back = new Int32Array(n + 1).fill(-1);
  // Whether the best row ending at j is a feature row.
  const asFeature = new Uint8Array(n + 1);
  best[0] = 0;
  const minFeature = ctx.target * FEATURE_MIN_GAIN;
  const floor = ctx.target * FLOOR;
  for (let j = 1; j <= n; j++) {
    let sum = 0;
    // Featured photographs inside the row (not leading it): each is a miss.
    let missed = 0;
    for (let i = j - 1; i >= 0; i--) {
      const g = from + i;
      if (i < j - 1 && featured[g + 1] > 0) missed++;
      sum += ratios[g];
      const k = j - i;
      const h = (ctx.width - (k - 1) * ctx.gap) / sum;
      if (h < floor && k > 1) break;
      if (best[i] === Number.POSITIVE_INFINITY) continue;
      const anchorRow =
        (anchorAt === "last" && j === n) || (anchorAt === "first" && i === 0);
      const lead = featured[g];
      const base = best[i] + missed * FEATURE_MISS;
      // As a feature row: `solo` alone and predetermined (the row builder
      // crops it); `double` against its own target, capped in proportion, and
      // only while it really stands taller than a plain row.
      if (lead > 0) {
        let feature = Number.POSITIVE_INFINITY;
        if (ctx.feature === "solo" && k === 1) feature = 0;
        else if (
          ctx.feature === "double" &&
          h >= minFeature &&
          h <= (lead * ctx.cap) / ctx.target
        )
          feature = rowCost(h, lead, ctx.band, false);
        if (base + feature < best[j]) {
          best[j] = base + feature;
          back[j] = i;
          asFeature[j] = 1;
        }
      }
      // As a plain row; a featured lead laid plain is a miss.
      if (h > ctx.cap) continue;
      const plain =
        base +
        rowCost(h, ctx.target, ctx.band, anchorRow) +
        (lead > 0 ? FEATURE_MISS : 0);
      if (plain < best[j]) {
        best[j] = plain;
        back[j] = i;
        asFeature[j] = 0;
      }
    }
  }
  if (best[n] === Number.POSITIVE_INFINITY) return null;
  const breaks: number[] = [];
  const features: boolean[] = [];
  for (let j = n; j > 0; j = back[j]) {
    breaks.push(from + j);
    features.push(asFeature[j] === 1);
  }
  breaks.push(from);
  breaks.reverse();
  features.reverse();
  return { breaks, features, cost: best[n] };
}

/**
 * Whole pixels summing exactly to `total`, as close to `exact` as whole pixels
 * get (largest remainder): no seam, no overrun, no tile a pixel off another.
 */
function roundWidths(exact: readonly number[], total: number): number[] {
  const out = exact.map((w) => Math.floor(w));
  let left = total - out.reduce((a, b) => a + b, 0);
  if (left === 0) return out;
  const order = exact
    .map((w, i) => ({ i, frac: w - Math.floor(w) }))
    .sort((a, b) => (left > 0 ? b.frac - a.frac : a.frac - b.frac));
  for (let n = 0; left !== 0 && order.length > 0; n++) {
    const { i } = order[n % order.length];
    if (left > 0) {
      out[i] += 1;
      left -= 1;
    } else if (out[i] > 1) {
      out[i] -= 1;
      left += 1;
    }
  }
  return out;
}

/**
 * Build one row from items[i, j). `lead` is the first photograph's feature
 * target when the search laid this row as a feature row, else 0.
 */
function buildRow(
  items: readonly RowItem[],
  i: number,
  j: number,
  ctx: Ctx,
  lead: number,
): Row {
  const slice = items.slice(i, j);
  const ids = slice.map((it) => it.id);
  if (lead > 0 && ctx.feature === "solo") {
    // Alone across the whole row: its natural height, cropped to a wide band
    // when that would stand taller than twice the target.
    return {
      ids,
      widths: [Math.round(ctx.width)],
      height: Math.max(1, Math.round(lead)),
      justified: true,
      feature: true,
    };
  }
  const featured = lead > 0 && ctx.feature === "double";
  const sum = slice.reduce((a, it) => a + it.ratio, 0);
  const span = ctx.width - (slice.length - 1) * ctx.gap;
  const h = span / sum;
  return {
    ids,
    widths: roundWidths(
      slice.map((it) => it.ratio * h),
      Math.round(span),
    ),
    height: Math.max(1, Math.round(h)),
    justified: true,
    feature: featured,
  };
}

function rowsFrom(
  items: readonly RowItem[],
  solved: { breaks: readonly number[]; features: readonly boolean[] },
  ctx: Ctx,
  featured: readonly number[],
): Row[] {
  const { breaks, features } = solved;
  const rows: Row[] = [];
  for (let b = 0; b + 1 < breaks.length; b++)
    rows.push(
      buildRow(
        items,
        breaks[b],
        breaks[b + 1],
        ctx,
        features[b] ? featured[breaks[b]] : 0,
      ),
    );
  return rows;
}

/** Each photograph's feature target at these parameters (0 = laid plain). */
function featureTargets(items: readonly RowItem[], ctx: Ctx): number[] {
  return items.map((it) => (it.feature ? featureTarget(it.ratio, ctx) : 0));
}

/** One centred row at the cap: the album too small to fill a row. */
function tinyRow(items: readonly RowItem[], cap: number): Row {
  return {
    ids: items.map((it) => it.id),
    widths: items.map((it) => Math.max(1, Math.round(it.ratio * cap))),
    height: Math.max(1, Math.round(cap)),
    justified: false,
    feature: false,
  };
}

function sanitize(items: readonly RowItem[]): RowItem[] {
  return items.map((it) => ({
    id: it.id,
    ratio: sanitizeRatio(it.ratio),
    ...(it.feature ? { feature: true } : {}),
  }));
}

/** Whether the whole list, as one row, would stand taller than the cap. */
function isTiny(items: readonly RowItem[], ctx: Ctx): boolean {
  if (items.length === 0) return false;
  const sum = items.reduce((a, it) => a + it.ratio, 0);
  const h = (ctx.width - (items.length - 1) * ctx.gap) / sum;
  return h > ctx.cap;
}

/* ── The full layout ───────────────────────────────────────────────────── */

/**
 * THE FULL LAYOUT: the optimal breaks over the whole album. On load, a resize,
 * a step change and a filter, and nowhere else (see the head comment).
 */
export function layoutRows(
  input: readonly RowItem[],
  params: RowsParams,
): RowsLayout {
  const items = sanitize(input);
  const anchor = params.anchor ?? "end";
  const feature = params.feature ?? "double";
  const width = Math.max(1, params.width);
  const gap = Math.max(0, params.gap);
  const target = targetFor(width, gap, params.perRow, meanRatio(items));
  const ctx = contextFor(width, gap, params.perRow, target, feature);
  const base = {
    width,
    gap,
    perRow: params.perRow,
    anchor,
    feature,
    target,
    items,
  };
  if (items.length === 0) return { ...base, rows: [], tiny: false };
  if (isTiny(items, ctx))
    return { ...base, rows: [tinyRow(items, ctx.cap)], tiny: true };
  const ratios = items.map((it) => it.ratio);
  const featured = featureTargets(items, ctx);
  const solved = solve(
    ratios,
    featured,
    0,
    items.length,
    ctx,
    anchor === "end" ? "last" : "first",
  );
  // Not reachable for a list that is not tiny (one row of everything is
  // always under the cap then), but a layout is never allowed to throw.
  if (!solved) return { ...base, rows: [tinyRow(items, ctx.cap)], tiny: true };
  return { ...base, rows: rowsFrom(items, solved, ctx, featured), tiny: false };
}

/* ── The local reflow ──────────────────────────────────────────────────── */

export type Reflow = {
  readonly layout: RowsLayout;
  /**
   * `none`: nothing changed. `local`: only `windows` were re-solved. `full`:
   * the album was laid afresh (`reason` says why).
   */
  readonly kind: "none" | "local" | "full";
  /** The OLD rows each re-solved window replaced, as inclusive index ranges. */
  readonly windows: readonly (readonly [number, number])[];
  readonly reason?:
    | "first"
    | "params"
    | "empty"
    | "tiny"
    | "reorder"
    | "bulk"
    | "infeasible";
};

/**
 * THE ROWS A READER CAN SEE, as the OLD layout's row indices, first and last
 * (inclusive): what a change outside them must never re-lay (`reflowRows`).
 */
export type HeldRows = readonly [first: number, last: number];

/** More old rows than this in play at once is a filter, not a trickle. */
const MAX_LOCAL_ROWS = 8;
/** An arrival takes the new photographs and this many rows beside them. */
const ARRIVAL_ROWS = 3;
/** A window may stretch to this many old rows, and never further. */
const MAX_WINDOW_ROWS = 4;

function sameParams(layout: RowsLayout, params: RowsParams): boolean {
  return (
    layout.width === Math.max(1, params.width) &&
    layout.gap === Math.max(0, params.gap) &&
    layout.perRow === params.perRow &&
    layout.anchor === (params.anchor ?? "end") &&
    layout.feature === (params.feature ?? "double")
  );
}

function full(
  items: readonly RowItem[],
  params: RowsParams,
  reason: NonNullable<Reflow["reason"]>,
): Reflow {
  return {
    layout: layoutRows(items, params),
    kind: "full",
    windows: [],
    reason,
  };
}

/** The worst plain row's distance from the target, in the band's own units (<= 1 is inside). */
function worstBand(
  rows: readonly Row[],
  ctx: Ctx,
  skipAnchor: Row | null,
): number {
  let worst = 0;
  for (const r of rows) {
    // A feature row answers to its own target; the anchor row to the cap.
    if (r === skipAnchor || r.feature) continue;
    worst = Math.max(
      worst,
      Math.abs(Math.log(r.height / ctx.target)) / ctx.band,
    );
  }
  return worst;
}

/**
 * THE LOCAL REFLOW: the previous layout and the new list in, only what has to
 * move moved. Falls back to a full layout whenever the change is not local:
 * the parameters changed, the order of what stayed changed, most of the album
 * changed, or the window cannot be laid under its cap.
 *
 * ★ A CHANGE OUTSIDE THE ROWS IN VIEW NEVER RE-LAYS THEM (`held`, the
 * album-fixes lane). A window takes its row's neighbours on both sides, so a
 * hide in the row just above the reader's view used to re-lay the row at the
 * view's top too: the scroll that pays for the rows above kept that row's top
 * edge still while its photographs re-broke under the reader (a feature row
 * re-forming took 6 of 8 photographs in view off screen at a desk). Given the
 * rows in view, a change entirely above or below them keeps to its own side: a
 * window re-lays and stretches only away from them (keeping its size by
 * reaching further off), a run landing on their edge joins the row outside
 * them, and a change too big to be local re-solves each side it touched whole
 * rather than the album. So every row the reader sees is the same row, and the
 * anchor's scroll moves nothing on screen. A change IN a row they see
 * re-justifies around it as before, and a side that cannot be laid under its
 * cap drops the hold rather than the album.
 */
export function reflowRows(
  prev: RowsLayout | null,
  input: readonly RowItem[],
  params: RowsParams,
  held?: HeldRows | null,
): Reflow {
  if (!prev) return full(input, params, "first");
  if (!sameParams(prev, params)) return full(input, params, "params");
  const items = sanitize(input);
  if (items.length === 0) return full(items, params, "empty");

  const prevItems = prev.items;
  const sameList =
    prevItems.length === items.length &&
    items.every(
      (it, i) =>
        it.id === prevItems[i].id &&
        it.ratio === prevItems[i].ratio &&
        !!it.feature === !!prevItems[i].feature,
    );
  if (sameList) return { layout: prev, kind: "none", windows: [] };
  if (prev.tiny || prev.rows.length === 0) return full(items, params, "tiny");

  const ctx = contextFor(
    prev.width,
    prev.gap,
    prev.perRow,
    prev.target,
    prev.feature,
  );
  if (isTiny(items, ctx)) return full(items, params, "tiny");

  // Where every old photograph sat.
  const rowOf = new Map<string, number>();
  prev.rows.forEach((row, r) => row.ids.forEach((id) => rowOf.set(id, r)));
  const oldItem = new Map(prevItems.map((it) => [it.id, it]));
  const newIds = new Set(items.map((it) => it.id));

  // What stayed must keep its order, or this is a sort, not a trickle.
  const keptNew = items.filter((it) => rowOf.has(it.id)).map((it) => it.id);
  const keptOld = prevItems
    .filter((it) => newIds.has(it.id))
    .map((it) => it.id);
  if (keptNew.length === 0) return full(items, params, "bulk");
  for (let i = 0; i < keptNew.length; i++)
    if (keptNew[i] !== keptOld[i]) return full(items, params, "reorder");

  const lastRow = prev.rows.length - 1;
  // The rows in view (see the head note), when they name real rows.
  const hold =
    held &&
    Number.isInteger(held[0]) &&
    Number.isInteger(held[1]) &&
    held[0] >= 0 &&
    held[0] <= held[1] &&
    held[1] <= lastRow
      ? held
      : null;
  const inHold = (r: number) => !!hold && r >= hold[0] && r <= hold[1];

  const dirty = new Set<number>();
  // A hide, or a photograph whose shape or feature changed: its row.
  for (const old of prevItems) {
    const r = rowOf.get(old.id)!;
    if (!newIds.has(old.id)) dirty.add(r);
  }
  for (const it of items) {
    const old = oldItem.get(it.id);
    if (old && (old.ratio !== it.ratio || !!old.feature !== !!it.feature))
      dirty.add(rowOf.get(it.id)!);
  }

  // Every new photograph belongs to the old row of the kept one before it (or,
  // at the very head, after it), so each window is one contiguous slice.
  const home = new Array<number>(items.length);
  let headArrival = false;
  let tailArrival = false;
  // The runs of new photographs: [first, end), and the kept rows either side.
  const runs: { i: number; j: number; before: number; after: number }[] = [];
  let lastKept = -1;
  for (let i = 0; i < items.length; i++) {
    const r = rowOf.get(items[i].id);
    if (r !== undefined) {
      home[i] = r;
      lastKept = r;
      continue;
    }
    // A run of new photographs: find the kept neighbour after it.
    let j = i;
    while (j < items.length && !rowOf.has(items[j].id)) j++;
    const after = j < items.length ? rowOf.get(items[j].id)! : -1;
    runs.push({ i, j, before: lastKept, after });
    i = j - 1;
  }
  // On the edge of the rows in view: a run between two rows may join either.
  const edge = ({ before, after }: (typeof runs)[number]) =>
    before >= 0 && after >= 0 && inHold(before) !== inHold(after);

  // A change in a row the reader sees re-justifies around it, as it always
  // has: the hold is only for a change wholly outside them.
  const around =
    hold &&
    ![...dirty].some(inHold) &&
    runs.every(
      (run) =>
        edge(run) ||
        (run.before < 0
          ? !inHold(run.after)
          : run.after < 0
            ? !inHold(run.before)
            : !inHold(run.before) && !inHold(run.after)),
    )
      ? hold
      : null;
  const inView = (r: number) => !!around && r >= around[0] && r <= around[1];

  for (const run of runs) {
    const { before, after } = run;
    // Beside the rows in view, a run on their edge joins the row outside them
    // (a restore just below the view).
    const outside = !!around && edge(run);
    const into = before < 0 || (outside && inView(before)) ? after : before;
    for (let m = run.i; m < run.j; m++) home[m] = into;
    if (before < 0) {
      // At the head: the growing end for a newest-first album.
      if (prev.anchor === "end") headArrival = true;
      else dirty.add(after);
    } else if (after < 0) {
      // At the tail: the growing end for an oldest-first album.
      if (prev.anchor === "start") tailArrival = true;
      else dirty.add(before);
    } else if (outside) {
      dirty.add(into);
    } else {
      dirty.add(before);
      dirty.add(after);
    }
  }

  // Each dirty row takes its neighbours; an arrival takes the rows beside it.
  // Beside the rows in view, a window keeps to its own side of them and keeps
  // its size by reaching further away.
  const ranges: [number, number][] = [];
  for (const r of dirty) {
    if (around && r < around[0]) {
      const b = Math.min(r + 1, around[0] - 1);
      ranges.push([Math.max(0, Math.min(r - 1, b - 2)), b]);
    } else if (around && r > around[1]) {
      const a = Math.max(r - 1, around[1] + 1);
      ranges.push([a, Math.min(lastRow, Math.max(r + 1, a + 2))]);
    } else ranges.push([Math.max(0, r - 1), Math.min(lastRow, r + 1)]);
  }
  if (headArrival)
    ranges.push([
      0,
      Math.min(lastRow, ARRIVAL_ROWS - 1, around ? around[0] - 1 : lastRow),
    ]);
  if (tailArrival)
    ranges.push([
      Math.max(0, lastRow - ARRIVAL_ROWS + 1, around ? around[1] + 1 : 0),
      lastRow,
    ]);
  ranges.sort((a, b) => a[0] - b[0]);
  let windows: [number, number][] = [];
  for (const r of ranges) {
    const last = windows[windows.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else windows.push([r[0], r[1]]);
  }
  const inPlay = windows.reduce((n, [a, b]) => n + b - a + 1, 0);
  if (inPlay > MAX_LOCAL_ROWS) {
    if (!around) return full(items, params, "bulk");
    // Too big to be local, beside the rows in view: each side it touched is
    // re-solved whole, so the rows in view still stay.
    const sides: [number, number][] = [];
    if (windows.some(([, b]) => b < around[0])) sides.push([0, around[0] - 1]);
    if (windows.some(([a]) => a > around[1]))
      sides.push([around[1] + 1, lastRow]);
    windows = sides;
  }

  // Where each old row's slice of the NEW list starts and ends.
  const sliceStart = new Array<number>(prev.rows.length + 1).fill(-1);
  for (let i = items.length - 1; i >= 0; i--) sliceStart[home[i]] = i;
  const startOf = (r: number): number => {
    // The first new index belonging to row r or later.
    for (let q = r; q <= lastRow; q++)
      if (sliceStart[q] >= 0) return sliceStart[q];
    return items.length;
  };

  const ratios = items.map((it) => it.ratio);
  const featured = featureTargets(items, ctx);
  const solveWindow = (a: number, b: number) => {
    const from = startOf(a);
    const to = b === lastRow ? items.length : startOf(b + 1);
    const anchorAt =
      prev.anchor === "end" && b === lastRow
        ? "last"
        : prev.anchor === "start" && a === 0
          ? "first"
          : null;
    const solved = solve(ratios, featured, from, to, ctx, anchorAt);
    if (!solved) return null;
    const rows = rowsFrom(items, solved, ctx, featured);
    const anchorRow =
      anchorAt === "last"
        ? rows[rows.length - 1]
        : anchorAt === "first"
          ? rows[0]
          : null;
    return { a, b, rows, worst: worstBand(rows, ctx, anchorRow ?? null) };
  };

  const solvedWindows: { a: number; b: number; rows: Row[] }[] = [];
  for (let w = 0; w < windows.length; w++) {
    const [a, b] = windows[w];
    let best = solveWindow(a, b);
    // Still outside the band: stretch by one row (an arrival's window can
    // only stretch away from the growing end, where the album is), never into
    // a neighbouring window, never into the rows in view and never past four
    // old rows.
    if ((!best || best.worst > 1) && b - a + 1 < MAX_WINDOW_ROWS) {
      const prevWin = solvedWindows[solvedWindows.length - 1];
      const nextWin = windows[w + 1];
      const tries: [number, number][] = [];
      if (b < lastRow && (!nextWin || nextWin[0] > b + 1) && !inView(b + 1))
        tries.push([a, b + 1]);
      if (a > 0 && (!prevWin || prevWin.b < a - 1) && !inView(a - 1))
        tries.push([a - 1, b]);
      for (const [ta, tb] of tries) {
        const t = solveWindow(ta, tb);
        if (t && (!best || t.worst < best.worst)) best = t;
      }
    }
    // A side that cannot be laid under its cap lets the rows in view go before
    // it lets the album go: the reflow again, as if nothing were held.
    if (!best)
      return around
        ? reflowRows(prev, input, params)
        : full(items, params, "infeasible");
    solvedWindows.push({ a: best.a, b: best.b, rows: best.rows });
  }

  const rows: Row[] = [];
  let r = 0;
  for (const win of solvedWindows) {
    for (; r < win.a; r++) rows.push(prev.rows[r]);
    rows.push(...win.rows);
    r = win.b + 1;
  }
  for (; r <= lastRow; r++) rows.push(prev.rows[r]);

  return {
    layout: { ...prev, items, rows, tiny: false },
    kind: "local",
    windows: solvedWindows.map((w) => [w.a, w.b] as const),
  };
}

/* ── The rhythm's picks ────────────────────────────────────────────────── */

/** A landscape, wide enough to lead a feature row. */
export const FEATURE_MIN_RATIO = 1.25;

/** FNV-1a, to a number in [0, 1): stable per (seed, id), nothing else. */
function unit(seed: number, id: string): number {
  let h = (2166136261 ^ Math.floor(seed)) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // One avalanche round, so neighbouring ids do not land near each other.
  // `^` answers a SIGNED int32 in JS: without the final `>>> 0` half the
  // coins came out negative and every one of those was a pick.
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822507) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

/**
 * WHICH PHOTOGRAPHS LEAD A FEATURE ROW (his mosaic note: "the large images
 * being random in flow, not most liked, so they change as new images
 * upload"): a landscape, by a coin that is a pure function of the visit's
 * seed and its own id. So the picks never reshuffle while you look (the same
 * seed answers the same), a new photograph gets the same chance as any other,
 * and a hide changes nobody else's pick. The chance falls as rows hold more
 * photographs (about one row in seven leads with one on a typical album at any
 * step), and the picks nest: a photograph featured at a denser step is
 * featured at every sparser one. Never likes: a guest's payload
 * carries no like counts, and favourites were exactly what he refused.
 *
 * ★ NONE AT ONE A ROW. Every photograph is already alone there, so a feature
 * row would be the same photograph drawn taller than its own neighbours for no
 * reason (the band's `FEATURE_MIN_GAIN` quietly refused most of them already;
 * this refuses them all, by rule rather than by arithmetic).
 */
export function pickFeatures(
  items: readonly { id: string; ratio: number }[],
  seed: number,
  perRow: number,
): Set<string> {
  const out = new Set<string>();
  if (perRow <= 1) return out;
  const chance = Math.min(0.5, 0.48 / perRow);
  for (const it of items)
    if (
      sanitizeRatio(it.ratio) >= FEATURE_MIN_RATIO &&
      unit(seed, it.id) < chance
    )
      out.add(it.id);
  return out;
}
