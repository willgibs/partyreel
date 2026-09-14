/**
 * THE TYPE-SCALE BOARD'S LADDERS (the review wave, 2026-09-14).
 *
 * Four ladders in one shape: today's, resolved from the shipped classes, and
 * three candidates. Pure data plus two helpers, so the board renders it, the
 * token table prints it and ladders.test.ts can prove its laws without a DOM.
 *
 * ── WHY EVERY LADDER CARRIES BOTH ENDS ──
 * A step is not a number, it is a pair: what it is at 375 and what it is at
 * 1440. Today's ladder only looks like a list of sizes because Tailwind's
 * breakpoints hide the phone end inside the class string; written out, the
 * phone end is where it fails. The board resolves each end by hand (the stage
 * is a zoomed canvas, so `sm:`/`lg:` read the browser, not the canvas, exactly
 * as the home-hero board's LADDER had to), and `fluid()` turns the same pair
 * into the clamp the wiring round bakes, which removes the breakpoints for good.
 *
 * ── WHAT THE BOARD FOUND, AND WHY THE CANDIDATES DIFFER ──
 * 1. The phone end collapses: today, `title` and `chapter` are both 36px and
 *    `display` (52) sits 4px above `hero` (48). Six steps read as three.
 * 2. Line-height is accidental: it arrives with whichever Tailwind size class
 *    the ramp lands on, so it steps 1.0 / 1.11 / 1.2 / 1.33 wherever the ramp
 *    happens to cross text-5xl, text-4xl, text-3xl. The one place that needed a
 *    real value invented `leading-[1.02]` locally (cinema-hero.tsx:257).
 * 3. Tracking is a constant: `font-heading` sets -0.03em from 160px down to
 *    16px, against the design system's own written law that letter-spacing and
 *    line-height run inverse to size (design-system.md, "Icon + small-type
 *    rules"). Every candidate implements the law the system already states.
 * 4. The app has no middle: PageHeading 24, CardTitle 16, and then two h2
 *    idioms at 14px and 11px that are labels wearing a heading tag.
 */

export type StepId =
  | "display"
  | "hero"
  | "title"
  | "chapter"
  | "section"
  | "prose"
  | "page"
  | "subsection"
  | "card";

export type Surface = "marketing" | "app";

/** One step at one end of the ladder: size in px, unitless leading, em tracking. */
export type Spec = { px: number; lh: number; ls: number };
export type StepPair = { phone: Spec; desktop: Spec };

export type LadderId = "today" | "a" | "b" | "c";

export type Ladder = {
  id: LadderId;
  name: string;
  /** One line on the board: what it is and why it might win. */
  rationale: string;
  /** This ladder's law in one sentence, printed with the specimen. */
  law: string;
  /** The honest cost of choosing it, printed beside the law. */
  cost: string;
  steps: Record<StepId, StepPair | null>;
  /** A step this ladder deliberately folds into another one. */
  aliases?: Partial<Record<StepId, StepId>>;
};

/** Where each step actually lives in production, so a stage can name itself. */
export const STEPS: {
  id: StepId;
  surface: Surface;
  label: string;
  where: string;
}[] = [
  {
    id: "display",
    surface: "marketing",
    label: "Display",
    where: "the masthead, one or two words (PageHero scale=display)",
  },
  {
    id: "hero",
    surface: "marketing",
    label: "Hero",
    where: "the cinema hero, the home (PageHero scale=xl)",
  },
  {
    id: "title",
    surface: "marketing",
    label: "Title",
    where: "/help and the six feature pages (PageHero scale=lg)",
  },
  {
    id: "chapter",
    surface: "marketing",
    label: "Chapter",
    where: "a chapter opener or closing anchor (SectionShell scale=lg)",
  },
  {
    id: "section",
    surface: "marketing",
    label: "Section",
    where: "the body section h2 (SectionShell default, about 70 sites)",
  },
  {
    id: "prose",
    surface: "marketing",
    label: "Prose",
    where: "the paper prose section: /about's story, /press's sections",
  },
  {
    id: "page",
    surface: "app",
    label: "Page",
    where: "every app and admin h1 (PageHeading)",
  },
  {
    id: "subsection",
    surface: "app",
    label: "Subsection",
    where: "the app's missing middle: today a 14px h2 doing a label's job",
  },
  {
    id: "card",
    surface: "app",
    label: "Card",
    where: "CardTitle, app and marketing",
  },
];

const s = (px: number, lh: number, ls: number): Spec => ({ px, lh, ls });
const pair = (p: Spec, d: Spec): StepPair => ({ phone: p, desktop: d });

/* ─────────────────────────── Today, resolved ─────────────────────────── */

/**
 * The shipped ladder with the class strings resolved by hand at each end.
 * display: clamp(3.25rem, 12vw, 10rem) pins to its floor at 375 (12vw is 45px)
 * and to its ceiling at 1440 (12vw is 173px), so the fluid middle never runs on
 * either canvas the site is judged at. Line-heights are Tailwind's defaults for
 * the class the ramp lands on; tracking is the font-heading constant.
 */
const TODAY: Ladder = {
  id: "today",
  name: "Today",
  rationale:
    "The shipped ladder, both ends written out. Five marketing steps, two app steps, one tracking value for all of them.",
  law: "One face, one tracking value, and whatever line-height the size class happened to carry.",
  cost: "At 375 the ladder has three distinct sizes doing the work of six.",
  steps: {
    display: pair(s(52, 0.85, -0.03), s(160, 0.85, -0.03)),
    hero: pair(s(48, 1.0, -0.03), s(96, 1.0, -0.03)),
    title: pair(s(36, 1.111, -0.03), s(72, 1.0, -0.03)),
    chapter: pair(s(36, 1.111, -0.03), s(60, 1.0, -0.03)),
    section: pair(s(30, 1.2, -0.03), s(48, 1.0, -0.03)),
    prose: pair(s(24, 1.333, -0.03), s(30, 1.2, -0.03)),
    page: pair(s(24, 1.333, -0.03), s(24, 1.333, -0.03)),
    subsection: null,
    card: pair(s(16, 1.375, -0.03), s(16, 1.375, -0.03)),
  },
};

/* ───────────────────────────── A: tuned ──────────────────────────────── */

/**
 * The smallest change that could be right. Every desktop number the site
 * already ships is kept (160 / 96 / 72 / 60 / 48 / 30 / 24 / 16), because if
 * today's system points at the perfect version then this is it. Three things
 * change: the phone end is unpacked so all six marketing steps separate, every
 * step names its own line-height instead of inheriting one, and tracking runs
 * inverse to size. The app is untouched on purpose, which is A's honest cost:
 * it still has no step between the page title and the card title.
 */
const A: Ladder = {
  id: "a",
  name: "A. Tuned",
  rationale:
    "Today's desktop numbers, kept. The phone end unpacked so six steps separate, a named line-height per step, and tracking that runs inverse to size.",
  law: "Keep the sizes the site already has; fix the phone end, the leading and the tracking.",
  cost: "The app keeps its hole: page 24, card 16, nothing in between, so the 14px h2s stay labels in a heading tag.",
  steps: {
    display: pair(s(64, 0.88, -0.04), s(160, 0.86, -0.045)),
    hero: pair(s(44, 1.0, -0.03), s(96, 0.94, -0.04)),
    title: pair(s(36, 1.05, -0.028), s(72, 0.98, -0.035)),
    chapter: pair(s(30, 1.12, -0.025), s(60, 1.04, -0.032)),
    section: pair(s(26, 1.2, -0.022), s(48, 1.08, -0.03)),
    prose: pair(s(21, 1.3, -0.018), s(30, 1.2, -0.024)),
    page: pair(s(24, 1.25, -0.02), s(24, 1.25, -0.02)),
    subsection: null,
    card: pair(s(16, 1.35, -0.012), s(16, 1.35, -0.012)),
  },
};

/* ───────────────────────────── B: rungs ──────────────────────────────── */

/**
 * Rebuilt from a rung set. Fifteen sizes from 12 to 160, with the ratio
 * widening as it climbs (about 1.12 in the UI range, about 1.25 up top),
 * because one ratio cannot serve a 160px masthead and a 14px label: a single
 * modular scale is either too coarse for UI or too timid for a poster.
 *
 * Today's desktop ladder is an unevenly rounded perfect fourth already
 * (160 / 96 / 72 / 60 / 48 is roughly 160 / 100 / 80 / 64 / 52), so this is the
 * ladder today is a rough draft of.
 *
 * ★ THE LAW IS THE TRAVEL, NOT THE SIZES. Every marketing step moves exactly
 * four rungs between 375 and 1440; every app step moves one, and the card step
 * moves none. That is bible 2 ("marketing may be louder in most things, scale
 * included") written as arithmetic instead of judgement: marketing is not a
 * different ladder, it is a longer journey along the same one.
 */
export const RUNGS = [
  12, 14, 16, 18, 20, 24, 28, 34, 42, 52, 64, 80, 100, 128, 160,
] as const;

/**
 * B reads leading and tracking off the RUNG, never off the step, so a step
 * added later cannot invent its own optics. This is the design system's own
 * small-type rule ("letter-spacing/line-height run inverse to size") as a table.
 */
const OPTICS: Record<number, { lh: number; ls: number }> = {
  12: { lh: 1.45, ls: 0.005 },
  14: { lh: 1.45, ls: 0 },
  16: { lh: 1.4, ls: -0.006 },
  18: { lh: 1.36, ls: -0.01 },
  20: { lh: 1.32, ls: -0.014 },
  24: { lh: 1.26, ls: -0.018 },
  28: { lh: 1.22, ls: -0.02 },
  34: { lh: 1.16, ls: -0.024 },
  42: { lh: 1.1, ls: -0.028 },
  52: { lh: 1.04, ls: -0.032 },
  64: { lh: 0.98, ls: -0.035 },
  80: { lh: 0.94, ls: -0.038 },
  100: { lh: 0.9, ls: -0.042 },
  128: { lh: 0.88, ls: -0.044 },
  160: { lh: 0.86, ls: -0.045 },
};

/** A rung as a full spec. Throws on a size that is not on the ladder, which is
 *  the point: B has no off-ladder numbers. */
export function rung(px: number): Spec {
  const optic = OPTICS[px];
  if (!optic) throw new Error(`${px}px is not a rung`);
  return s(px, optic.lh, optic.ls);
}

const rungPair = (p: number, d: number): StepPair => pair(rung(p), rung(d));

const B: Ladder = {
  id: "b",
  name: "B. Rungs",
  rationale:
    "One rung set from 12 to 160 with the ratio widening as it climbs. Every step sits on a rung at both ends, and leading and tracking are read off the rung, never chosen.",
  law: "Marketing travels four rungs between 375 and 1440, the app travels one, the card step travels none.",
  cost: "The phone middle goes quieter than today (a body section h2 at 24 rather than 30) to buy the top of the ladder its room.",
  steps: {
    display: rungPair(64, 160),
    hero: rungPair(42, 100),
    title: rungPair(34, 80),
    chapter: rungPair(28, 64),
    section: rungPair(24, 52),
    prose: rungPair(18, 34),
    page: rungPair(24, 28),
    subsection: rungPair(18, 20),
    card: rungPair(16, 16),
  },
};

/* ─────────────────────────── C: registers ────────────────────────────── */

/**
 * C says one ladder is the wrong abstraction. Marketing is a poster and the app
 * is an instrument, and they should share the face and the tracking law and
 * nothing else.
 *
 * Marketing gets an editorial register: five steps, high contrast where the
 * poster is (200 over 120 over 80 is roughly 1.6 a step), and a phone end that
 * stays loud, because the phone is where guests actually arrive. The 24/30
 * prose tier is folded into the section step: six marketing steps was two more
 * than the site can tell apart.
 *
 * The app gets an instrument register: 20 / 16 / 14, low contrast, hierarchy
 * carried by weight and colour rather than size, because in the app the
 * photographs are the loud thing and the chrome should get out of their way.
 * The page title comes DOWN from 24, which is the swing to rule on.
 */
const C: Ladder = {
  id: "c",
  name: "C. Registers",
  rationale:
    "Two registers rather than one ladder. Marketing becomes editorial and much louder at the top; the app becomes an instrument and goes quieter, with weight carrying the hierarchy.",
  law: "Marketing and the app share the face and the tracking law and nothing else.",
  cost: "Two ladders to maintain, a 200px masthead that only holds one or two words, and an app page title that drops below today's.",
  aliases: { prose: "section" },
  steps: {
    display: pair(s(80, 0.84, -0.05), s(200, 0.82, -0.05)),
    hero: pair(s(52, 0.98, -0.042), s(120, 0.88, -0.045)),
    title: pair(s(40, 1.05, -0.036), s(80, 0.95, -0.04)),
    chapter: pair(s(32, 1.12, -0.03), s(56, 1.04, -0.034)),
    section: pair(s(26, 1.2, -0.026), s(40, 1.1, -0.03)),
    prose: pair(s(26, 1.2, -0.026), s(40, 1.1, -0.03)),
    page: pair(s(20, 1.3, -0.014), s(20, 1.3, -0.014)),
    subsection: pair(s(16, 1.4, -0.006), s(16, 1.4, -0.006)),
    card: pair(s(14, 1.45, -0.002), s(14, 1.45, -0.002)),
  },
};

export const LADDERS: Ladder[] = [TODAY, A, B, C];

export function ladderById(id: LadderId): Ladder {
  const found = LADDERS.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown ladder: ${id}`);
  return found;
}

/* ──────────────────────────── The token table ─────────────────────────── */

const rem = (px: number) => `${Number((px / 16).toFixed(3))}rem`;
const round = (n: number, places: number) => Number(n.toFixed(places));

/**
 * The pair as the clamp the wiring round bakes. The line passes through
 * (375, phone) and (1440, desktop), so the ladder is continuous from a small
 * phone to a wide desktop and there is no breakpoint to jump at. The fixed
 * ends are rem so a reader who raises their base size raises the whole ladder;
 * only the middle term is viewport-driven.
 *
 * ★ The BOARD never uses these strings: a stage is a zoomed canvas, so a vw
 * inside one measures the browser window, not the canvas. The board resolves
 * each end by hand from the same data. The clamp is what production gets.
 */
export function fluid(phone: number, desktop: number): string {
  if (phone === desktop) return rem(phone);
  const slope = (desktop - phone) / (1440 - 375);
  const vw = round(slope * 100, 2);
  const intercept = round(phone - slope * 375, 2);
  const sign = intercept < 0 ? "-" : "+";
  return `clamp(${rem(phone)}, ${rem(Math.abs(intercept))} ${sign} ${vw}vw, ${rem(desktop)})`;
}

export type TokenRow = {
  token: string;
  size: string;
  lh: string;
  ls: string;
  step: StepId;
};

/**
 * Every step of a ladder as the three custom properties it becomes.
 *
 * SIZE is fluid. LEADING is emitted as an absolute rem length rather than a
 * unitless number, because a unitless line-height cannot be put inside a
 * clamp() and a step whose leading tightens as it grows needs one; it is the
 * ratio multiplied through, so `line-height: var(--text-hero-lh)` is exactly
 * what the board renders. TRACKING stays in em and takes the desktop end: the
 * em unit already rides the fluid size, so the second fluid term would move a
 * 375px masthead by under a third of a pixel and cost a clamp with two
 * negative ends.
 */
export function tokenTable(ladder: Ladder): TokenRow[] {
  const rows: TokenRow[] = [];
  for (const step of STEPS) {
    const value = ladder.steps[step.id];
    if (!value) continue;
    rows.push({
      step: step.id,
      token: `--text-${step.id}`,
      size: fluid(value.phone.px, value.desktop.px),
      lh: fluid(
        round(value.phone.px * value.phone.lh, 2),
        round(value.desktop.px * value.desktop.lh, 2),
      ),
      ls: `${value.desktop.ls}em`,
    });
  }
  return rows;
}

/** The two rows every ladder shares, so the wiring round gets the whole set. */
export const FIXED_TOKENS: { token: string; size: string; note: string }[] = [
  {
    token: "--text-body",
    size: "1rem / 1.55 / 0em",
    note: "Inter, unchanged by every candidate.",
  },
  {
    token: "--text-caption",
    size: "0.75rem / 1.45 / 0.01em",
    note: "the Caption atom; the uppercase Eyebrow keeps its 0.14em.",
  },
];
