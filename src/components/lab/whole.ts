/**
 * THE WHOLE STAGE (lab-focus, 2026-09-29): every frame of the shown option on
 * the first screen, scaled to fit above the dock, with no scroll to reach it.
 *
 * ★ WILL'S NOTE IS THE SPEC. Opening a question he wants the drawn options,
 * and he met "a Jackson Pollock painting of text" first: at 1440 the frames
 * started below the fold and the dock cut them, and at 375 the stage began two
 * screens down. So a step draws its stage in the room left under the question
 * and its options, and scales the WHOLE option to fit that room: a picture he
 * judges at a glance, with 1:1 one press away for a detail.
 *
 * ★ THE STAGE SCALES WHAT THE BOARD DREW; IT NEVER REDRAWS IT. A board lays
 * its frames out itself (four phones in a row, laptops stacked, a row that
 * wraps), and this finds the scale at which that drawing fits. One thing is
 * the stage's to choose: the WIDTH the drawing is laid out at, because a row
 * that wraps is one row at a desk's aspect and three rows of two at a phone's.
 * So it tries the widths between the drawing's narrowest and widest natural
 * layouts, measures the height each gives, and keeps the width that draws it
 * largest (`bestTrial`).
 *
 * ★ AND A STACK OF FRAMES MAY STAND IN A ROW. A board stacks laptops, and a
 * phone-width lab stacks phones, because at 1:1 a row of them is drawn at a
 * fifth of their size or behind a sideways scroll; whole, the stack is the
 * shape that draws them smallest (four phones stacked at 375 came out 43 px
 * wide, measured on locked-door; a laptop over its phones at 29%, on
 * demo-framing). So a column of frames (with whole lines between, a lede or a
 * note) is laid out as a row that wraps (`reflow`), and the width search
 * chooses how many share a row: the same frames, in the same reading order,
 * as large as the room allows. 1:1 draws the board's own column untouched.
 *
 * ★ EVERY OPTION ON ONE SCALE. The options of a question share the room, and
 * blinking between two (`x`) compares like with like only when both are drawn
 * at the same scale, so the zoom is the smallest any option needs.
 *
 * ★ MEASURED UNSCALED, NEVER BY UNDOING THE ZOOM. `zoom` on an element that
 * holds an iframe lands a frame or two after it is set (probed in Chrome 154:
 * 13 to 36 ms, where a plain div takes it at once), so switching it off to
 * measure reads the old picture. `offsetWidth` and `offsetHeight` answer in the
 * element's own, unscaled pixels whatever its zoom, and a width set under a
 * zoom lays out at once, so every trial is read under the zoom already worn.
 */

export type Size = { w: number; h: number };

/** One view at one trial width: its natural height there, and the room it has. */
export type ViewTrial = { h: number; room: Size };

/** One width the drawing was laid out at, and what every option did there. */
export type Trial = { width: number; views: readonly ViewTrial[] };

/** A near tie is a tie: under this, two widths draw the same size. */
const TIE = 0.004;

/**
 * The zoom a trial is drawn at: the largest that fits every option in its room,
 * never above 1:1 (a small drawing is shown at its true size, not blown up).
 */
export function zoomFor(t: Trial): number {
  let k = 1;
  for (const v of t.views) {
    if (t.width > 0) k = Math.min(k, v.room.w / t.width);
    if (v.h > 0) k = Math.min(k, v.room.h / v.h);
  }
  return Math.max(0, k);
}

/**
 * THE WIDTH THAT DRAWS THE OPTION LARGEST. A near tie goes to the wider width:
 * the same scale with fewer wrapped rows reads closer to what the board drew.
 */
export function bestTrial(
  trials: readonly Trial[],
): { width: number; k: number } | null {
  let best: { width: number; k: number } | null = null;
  for (const t of trials) {
    const k = zoomFor(t);
    if (
      !best ||
      k > best.k + TIE ||
      (Math.abs(k - best.k) <= TIE && t.width > best.width)
    )
      best = { width: t.width, k };
  }
  return best;
}

/**
 * The widths worth trying, from the drawing's narrowest natural layout to its
 * widest: evenly spaced by ratio (a wrap point is as likely at a phone's width
 * as at a laptop's), with the room's own width among them when it falls
 * inside, since a drawing that fits the room at 1:1 is the common case.
 */
export function trialWidths(
  min: number,
  max: number,
  room?: number,
  steps = 14,
): number[] {
  const lo = Math.max(1, Math.round(min));
  const hi = Math.max(lo, Math.round(max));
  const out = new Set<number>([lo, hi]);
  if (hi > lo) {
    const ratio = Math.pow(hi / lo, 1 / steps);
    for (let i = 1; i < steps; i++)
      out.add(Math.round(lo * Math.pow(ratio, i)));
  }
  if (room && room > lo && room < hi) out.add(Math.round(room));
  return [...out].sort((a, b) => a - b);
}

/* ── the DOM half ─────────────────────────────────────────────────────── */

/** What a fit left on the stage, so a re-run that changes nothing writes nothing. */
export type Fitted = { width: number; k: number };

/**
 * The views on a stage and the box each scales: `[data-lab-view]` holds the
 * option, `[data-lab-fit]` inside it is what is laid out and zoomed.
 */
function parts(box: HTMLElement): { view: HTMLElement; wrap: HTMLElement }[] {
  const out: { view: HTMLElement; wrap: HTMLElement }[] = [];
  for (const view of box.querySelectorAll<HTMLElement>(
    ":scope > [data-lab-view]",
  )) {
    const wrap = view.querySelector<HTMLElement>(":scope > [data-lab-fit]");
    if (wrap) out.push({ view, wrap });
  }
  return out;
}

const px = (v: string) => Number.parseFloat(v) || 0;

/** An element's words, spaces aside. */
const letters = (el: Element) => (el.textContent ?? "").replace(/\s+/g, "");

/**
 * A child that is frames and nothing else: the kit's `Frame` (a `<figure>`),
 * a box around one (a `Fit`), or a row of them (a board's phones), whose only
 * words are the frames' own names and captions.
 */
function framesOnly(el: Element): boolean {
  if (el.tagName === "FIGURE") return true;
  const figures = el.querySelectorAll("figure");
  if (figures.length === 0) return false;
  let inFrames = 0;
  for (const figure of figures) inFrames += letters(figure).length;
  return letters(el).length === inFrames;
}

/**
 * MARKS EVERY STACK AND ROW OF FRAMES A DRAWING HOLDS, so design.css lets it
 * wrap (`data-lab-reflow`):
 *  - a `flex-col` with two or more children that are frames and nothing else
 *    becomes a row that wraps, and each child that is not (a lede, a note, a
 *    loop's score) keeps a line of its own (`data-lab-line`), so what stood
 *    between two frames still does;
 *  - a flex row whose every child is frames wraps where it runs out of room.
 * Anything else is the board's own arrangement and is left as it drew it.
 */
function reflow(wrap: HTMLElement): void {
  const boxes = new Set<Element>();
  for (const figure of wrap.querySelectorAll("figure"))
    for (
      let el = figure.parentElement;
      el && el !== wrap;
      el = el.parentElement
    )
      boxes.add(el);
  // A box the board has since redrawn without its frames stands as it drew
  // it again: a mark left behind would wrap a row that is no stack of frames.
  for (const el of wrap.querySelectorAll("[data-lab-reflow]"))
    if (!boxes.has(el)) unmark(el);
  for (const box of boxes) {
    let as = box.getAttribute("data-lab-reflow");
    if (as === null) {
      const cs = getComputedStyle(box);
      if (!/flex/.test(cs.display)) continue;
      as = cs.flexDirection.startsWith("column") ? "column" : "row";
    }
    const kids = [...box.children];
    const frames = kids.filter(framesOnly).length;
    if (frames < 2 || (as === "row" && frames < kids.length)) {
      unmark(box);
      continue;
    }
    box.setAttribute("data-lab-reflow", as);
    for (const kid of kids)
      if (framesOnly(kid)) kid.removeAttribute("data-lab-line");
      else kid.setAttribute("data-lab-line", "");
  }
}

/** One box back as the board drew it. */
function unmark(box: Element): void {
  if (!box.hasAttribute("data-lab-reflow")) return;
  box.removeAttribute("data-lab-reflow");
  for (const kid of box.children) kid.removeAttribute("data-lab-line");
}

/** Undoes `reflow`, for the 1:1 page, where the board's column stands. */
function unreflow(box: HTMLElement): void {
  for (const el of box.querySelectorAll("[data-lab-reflow]")) unmark(el);
}

/**
 * FITS THE STAGE, synchronously: tries the widths, keeps the best, and wears
 * it. Returns what it wore, or null when the stage has no room yet (a box that
 * has not been laid out, or a tab in the background).
 *
 * `side`: the options stand side by side, each in a column of its own, so each
 * one's room is its own column less the label above it.
 */
export function fitStage(
  box: HTMLElement,
  { side, last }: { side: boolean; last?: Fitted | null },
): Fitted | null {
  const all = parts(box);
  // Nothing drawn (a step off a board's page, a preview that returned null):
  // the stage takes no room at all (design.css, `data-empty`).
  const empty = all.every(({ wrap }) => wrap.offsetHeight === 0);
  box.toggleAttribute("data-empty", empty);
  if (all.length === 0 || empty) return null;
  const cs = getComputedStyle(box);
  const boxW = box.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
  const boxH = box.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
  if (boxW < 8 || boxH < 8) return null;

  // The room each option has. Side by side, a column and the height under its
  // label; flipped, the whole box.
  const rooms: Size[] = all.map(({ view, wrap }) => {
    if (!side) return { w: boxW, h: boxH };
    const head =
      wrap.getBoundingClientRect().top - view.getBoundingClientRect().top;
    return { w: view.clientWidth, h: Math.max(8, boxH - head) };
  });

  for (const { wrap } of all) reflow(wrap);

  // The drawing's narrowest and widest natural layouts, shared by every option.
  let lo = 0;
  let hi = 0;
  for (const { wrap } of all) {
    wrap.style.width = "min-content";
    lo = Math.max(lo, wrap.offsetWidth);
    wrap.style.width = "max-content";
    hi = Math.max(hi, wrap.offsetWidth);
  }
  hi = Math.max(lo, hi);

  const trial = (width: number): Trial => {
    for (const { wrap } of all) wrap.style.width = `${width}px`;
    return {
      width,
      views: all.map(({ wrap }, i) => ({
        h: wrap.offsetHeight,
        room: rooms[i],
      })),
    };
  };

  const widths = trialWidths(lo, hi, rooms[0]?.w);
  const trials = widths.map(trial);
  let best = bestTrial(trials);
  if (!best) return null;

  // ★ A WIDTH-BOUND DRAWING IS PULLED IN TO ITS OWN EDGE. The trial widths are
  // samples, so the best one can hold its row with room to spare, and that
  // spare is scale given away. Halving toward the next narrower sample keeps
  // the rows it has and gives the scale back.
  const at = widths.indexOf(best.width);
  let floor = at > 0 ? widths[at - 1] : lo;
  for (let i = 0; i < 6 && best.width - floor > 2; i++) {
    const mid = Math.round((floor + best.width) / 2);
    const k = zoomFor(trial(mid));
    if (k >= best.k - TIE / 4) best = { width: mid, k: Math.max(k, best.k) };
    else floor = mid;
  }

  // ★ THE FRAMES' NAMES STAY READABLE, so the scale is read twice. A frame's
  // title is set at a reading size divided by the zoom (design.css,
  // `--lab-k`), which changes the drawing's height by a line; two passes
  // settle it, since a line is small beside a frame.
  let k = best.k;
  for (let pass = 0; pass < 2; pass++) {
    for (const { wrap } of all) wrap.style.setProperty("--lab-k", String(k));
    const next = zoomFor(trial(best.width));
    if (Math.abs(next - k) < 0.002) break;
    k = next;
  }

  const kept =
    last && last.width === best.width && Math.abs(last.k - k) < 0.002;
  const wear = kept ? last : { width: best.width, k };
  for (const { wrap } of all) {
    wrap.style.width = `${wear.width}px`;
    wrap.style.setProperty("--lab-k", String(wear.k));
    wrap.style.zoom = String(wear.k);
  }
  return wear;
}

/** Takes everything `fitStage` wore off the stage, for the 1:1 page. */
export function unfitStage(box: HTMLElement): void {
  box.removeAttribute("data-empty");
  unreflow(box);
  for (const { wrap } of parts(box)) {
    wrap.style.removeProperty("width");
    wrap.style.removeProperty("zoom");
    wrap.style.removeProperty("--lab-k");
  }
}
