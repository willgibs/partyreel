/**
 * THE TYPE-SCALE BOARD'S LADDERS: five finished sets of heading sizes, as data.
 *
 * Pure TypeScript with no React and no DOM, so the board renders it, the paste
 * generates from it and `ladders.test.ts` proves its laws in node.
 *
 * ── WHY EVERY LADDER CARRIES BOTH ENDS ──
 * A step is not a number, it is a pair: what it is at 375 and what it is at
 * 1440. Today's ladder only LOOKS like a list of sizes because Tailwind's
 * breakpoints hide the phone end inside the class string; written out, the
 * phone end is where it fails. Each end is resolved by hand here, and
 * `fluid()` turns the pair into the clamp a wiring round would bake, which
 * removes the breakpoints for good.
 *
 * ── THE FOUR FAULTS EVERY CANDIDATE IS ANSWERING ──
 * 1. The phone end collapses: today `title` and `chapter` are both 36px and
 *    `display` (52) sits 4px above `hero` (48). Six steps read as three.
 * 2. Line-height is accidental: it arrives with whichever Tailwind size class
 *    the ramp lands on, so it steps 1.0 / 1.11 / 1.2 / 1.33 wherever the ramp
 *    crosses text-5xl, text-4xl, text-3xl. The one place that needed a real
 *    value invented `leading-[1.02]` locally (cinema-hero.tsx).
 * 3. Tracking is a constant: `font-heading` sets -0.03em from 160px down to
 *    16px, against the design system's own written law that letter-spacing and
 *    line-height run inverse to size.
 * 4. The app has no middle: PageHeading 24, CardTitle 16, and between them two
 *    h2 idioms at 14px and 11px that are labels wearing a heading tag.
 *
 * ── ONE SET, TWO REGISTERS (the board's call, and it is argued) ──
 * `display` through `prose` are marketing's rungs, `page` through `card` are
 * the app's, and they are one nine-name set rather than two. Two sets would
 * name every role twice and then have to answer which set a Card wears, since
 * CardTitle is ONE component shipping on /pricing and on the dashboard, and
 * they would duplicate the tracking law, which is a function of size and not
 * of surface. Each card here is therefore a whole-site answer: a reviewer who
 * wants marketing from one card and the app from another says so in his note,
 * and the wiring round composes the two halves into the same nine names.
 */

import { TYPE_SCALE } from "./spec";

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

/** The five cards, by id. The catalog rules on these words. */
export type LadderId = "b" | "c" | "a" | "law" | "today";

export type Ladder = {
  id: LadderId;
  /** The name on the card and in every switch. */
  name: string;
  /** One line on the card: what it is and why it might win. */
  rationale: string;
  /** This ladder's law in one sentence. */
  law: string;
  /** The honest cost of choosing it. */
  cost: string;
  steps: Record<StepId, StepPair | null>;
  /** A step this ladder deliberately folds into another one. */
  aliases?: Partial<Record<StepId, StepId>>;
};

/** Where each step actually lives in production. */
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
  name: "A, tuned",
  rationale:
    "Today's desktop numbers, kept. The phone end unpacked so six steps separate, a named line-height per step, and tracking inverse to size.",
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
  name: "B, rungs",
  rationale:
    "One rung set from 12 to 160, the ratio widening as it climbs. Every step sits on a rung at both ends, and the optics are read off the rung.",
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
 * The app gets an instrument register: 20 / 18 / 16, low contrast, hierarchy
 * carried by weight and colour rather than size, because in the app the
 * photographs are the loud thing and the chrome should get out of their way.
 * The page title comes DOWN from 24, which is the swing to rule on.
 *
 * ★ THE APP'S FLOOR IS WHY THE CARD STEP STOPS AT 16. A Card sets `text-sm` on
 * its whole subtree and CardDescription is `text-sm`, so a 14px CardTitle is
 * exactly the size of the sentence beneath it and the event name a host scans
 * for is separated from its metadata by weight and colour alone. C keeps its
 * quiet title and gains a floor (`APP_BODY_PX`), which the test pins for every
 * ladder here.
 */
const C: Ladder = {
  id: "c",
  name: "C, registers",
  rationale:
    "Two registers rather than one ladder. Marketing turns editorial and much louder at the top; the app turns instrument and goes quieter, weight carrying the rank.",
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
    subsection: pair(s(18, 1.35, -0.01), s(18, 1.35, -0.01)),
    card: pair(s(16, 1.4, -0.006), s(16, 1.4, -0.006)),
  },
};

/* ───────────────── The tracking law, as a function of size ───────────────── */

/**
 * "Letter-spacing and line-height run inverse to size" is the design system's
 * own written rule and `font-heading`'s flat -0.03em is what does not implement
 * it. The law is a FUNCTION of size, so it can be applied to the sizes the site
 * already ships: B's rung table IS that function sampled at fifteen points, and
 * `optics()` reads between the samples so any size has a law value.
 */
export function optics(px: number): { lh: number; ls: number } {
  const exact = OPTICS[px];
  if (exact) return exact;
  const first = OPTICS[RUNGS[0]];
  const last = OPTICS[RUNGS[RUNGS.length - 1]];
  if (px <= RUNGS[0]) return first;
  if (px >= RUNGS[RUNGS.length - 1]) return last;
  const above = RUNGS.find((r) => r > px)!;
  const below = RUNGS[RUNGS.indexOf(above) - 1];
  const t = (px - below) / (above - below);
  const a = OPTICS[below];
  const b = OPTICS[above];
  return {
    lh: Number((a.lh + (b.lh - a.lh) * t).toFixed(3)),
    ls: Number((a.ls + (b.ls - a.ls) * t).toFixed(4)),
  };
}

/** A step re-optic'd: the same size, the law's leading and tracking. */
const lawful = (spec: Spec): Spec => ({ px: spec.px, ...optics(spec.px) });

/**
 * Today's sizes under the law: the smallest thing this board can ship, and the
 * only card that moves no size at all. Its paste sets no font-size anywhere,
 * which is what makes the tracking ask answerable on its own.
 */
export const LAW_ONLY: Ladder = {
  id: "law",
  name: "The spacing law alone",
  rationale:
    "Today's sizes, every one of them, with leading and tracking running inverse to size instead of a flat -0.03em.",
  law: "Leading and tracking are read off the size, so no step chooses its own optics.",
  cost: "Only the tracking fault is fixed: the phone end still collapses and the app still has no middle.",
  steps: Object.fromEntries(
    STEPS.map((step) => {
      const value = TODAY.steps[step.id];
      return [
        step.id,
        value
          ? { phone: lawful(value.phone), desktop: lawful(value.desktop) }
          : null,
      ];
    }),
  ) as Record<StepId, StepPair | null>,
};

/**
 * THE CATALOG'S ORDER IS THE BOARD'S OWN RANKING, strongest first, with today
 * last as the control rather than as the default. `spec.ts` writes the same
 * five out as cards and `ladders.test.ts` pins the two lists equal id for id.
 */
export const LADDERS: Ladder[] = [B, C, A, LAW_ONLY, TODAY];

/** What the board would ship. */
export const RECOMMENDED: LadderId = "b";

export function ladderById(id: LadderId): Ladder {
  const found = LADDERS.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown ladder: ${id}`);
  return found;
}

/**
 * A Card sets `text-sm` on its whole subtree, so 14px is the body size a card
 * title sits on top of and no app heading may go below it: under that line the
 * hierarchy is carried by weight and colour alone.
 */
export const APP_BODY_PX = 14;

/* ──────────────────────────── The generated block ─────────────────────── */

const rem = (px: number) => `${Number((px / 16).toFixed(3))}rem`;
const round = (n: number, places: number) => Number(n.toFixed(places));
const px3 = (n: number) => Number(n.toFixed(2));

/**
 * The pair as the clamp a wiring round bakes. The line passes through
 * (375, phone) and (1440, desktop), so the ladder is continuous from a small
 * phone to a wide desktop and there is no breakpoint to jump at. The fixed
 * ends are rem so a reader who raises their base size raises the whole ladder;
 * only the middle term is viewport-driven.
 */
export function fluid(phone: number, desktop: number): string {
  if (phone === desktop) return rem(phone);
  const slope = (desktop - phone) / (1440 - 375);
  const vw = round(slope * 100, 2);
  const intercept = round(phone - slope * 375, 2);
  const sign = intercept < 0 ? "-" : "+";
  return `clamp(${rem(phone)}, ${rem(Math.abs(intercept))} ${sign} ${vw}vw, ${rem(desktop)})`;
}

/**
 * WHERE EACH STEP LANDS IN PRODUCTION, as a selector. Three kinds appear:
 *  - a real hook: `.mkt-name` and `[data-slot="card-title"]` are named things;
 *  - the ramp's top class: a step whose only signature is its Tailwind ramp is
 *    matched by that ramp's widest class (`[class~="lg:text-7xl"]`). That is a
 *    FEATURE here: the four heroes that hand-roll the same ramp carry the same
 *    class and move with the step, which is what the ruling would do;
 *  - no hook at all: the app's section heading is a label inside an h2 with no
 *    class worth matching, so the paste leaves it alone and says so.
 *
 * Tailwind's utilities live in `@layer utilities`, so any unlayered rule beats
 * them whatever its specificity; the two selectors that have to beat
 * marketing.css (unlayered, (0,3,0) on `.mkt-name`) match its shape and win on
 * order, since the candidate sheet is adopted after every stylesheet.
 */
export const HOOKS: Partial<
  Record<StepId, { selector: string; note: string }>
> = {
  hero: {
    selector: 'h1[class~="font-heading"][class~="lg:text-8xl"]',
    note: "PageHero scale=xl, and the home hero that hand-rolls the same ramp",
  },
  title: {
    selector: 'h1[class~="font-heading"][class~="lg:text-7xl"]',
    note: "PageHero scale=lg: /help, the six feature heroes, qr, reel, an event page",
  },
  chapter: {
    selector: '[class~="font-heading"][class~="lg:text-6xl"]',
    note: "SectionShell scale=lg, and the article titles that stop at this step",
  },
  section: {
    selector: '[class~="font-heading"][class~="lg:text-5xl"]',
    note: "SectionShell default, about 70 sites",
  },
  prose: {
    selector:
      '[class~="font-heading"][class~="sm:text-3xl"]:not([class~="lg:text-5xl"])',
    note: "the prose head: /about, /press, /help's sections, /contact, and the stat numerals on /help",
  },
  page: {
    selector:
      'h1[class~="font-heading"]:is([class~="text-2xl"], [class~="text-3xl"], [class~="text-lg"]):not([class~="lg:text-5xl"])',
    note: "PageHeading and its two size overrides (the event name, the admin bar)",
  },
  card: {
    selector: '[data-slot="card-title"]',
    note: "CardTitle, app and marketing",
  },
};

/** The three custom-property names for a step, in Tailwind v4's own font-size
 *  shape, so the paste and the `@theme` bake use one set of names and a baked
 *  step is a single utility class (`text-display` carries all three). */
export function tokenNames(step: StepId) {
  return {
    size: `--text-${step}`,
    lh: `--text-${step}--line-height`,
    ls: `--text-${step}--letter-spacing`,
  };
}

function tokenLines(ladder: Ladder, withSizes: boolean): string {
  const lines: string[] = [];
  for (const step of STEPS) {
    const value = ladder.steps[step.id];
    if (!value || ladder.aliases?.[step.id]) continue;
    const n = tokenNames(step.id);
    if (withSizes)
      lines.push(`  ${n.size}: ${fluid(value.phone.px, value.desktop.px)};`);
    lines.push(
      `  ${n.lh}: ${fluid(px3(value.phone.px * value.phone.lh), px3(value.desktop.px * value.desktop.lh))};`,
    );
    lines.push(`  ${n.ls}: ${value.desktop.ls}em;`);
  }
  return lines.join("\n");
}

/** The step a folded alias reads from (C's prose is its section step). */
const resolve = (ladder: Ladder, step: StepId): StepId =>
  ladder.aliases?.[step] ?? step;

function stepDecls(ladder: Ladder, step: StepId, withSizes: boolean): string {
  const n = tokenNames(resolve(ladder, step));
  const decls = [
    `  line-height: var(${n.lh});`,
    `  letter-spacing: var(${n.ls});`,
  ];
  if (withSizes) decls.unshift(`  font-size: var(${n.size});`);
  return decls.join("\n");
}

/**
 * THE BLOCK A RULING WOULD LAND, as the site can wear it today.
 *
 * Every frame on the board wears exactly this, and "Apply to the site" hands
 * the same string to every page with a design island, so a frame and a real
 * signed-in tab can never show two different things.
 *
 * The `law` block sets no font-size anywhere: that is what makes the tracking
 * ask answerable on its own.
 */
export function candidateCss(ladder: Ladder): string {
  const withSizes = ladder.id !== "law";
  const out: string[] = [];
  out.push(`/* The type scale: ${ladder.name}.
   ${ladder.law}
   Generated by the type-scale board from ladders.ts, which is the same data its
   cards draw. Token names are Tailwind v4's font-size shape, so the bake is one
   @theme block and a baked step becomes one utility class.
   ${withSizes ? "Sizes, leading and tracking." : "Leading and tracking only: not one size moves."} */`);
  out.push(`:root {\n${tokenLines(ladder, withSizes)}\n}`);

  const display = ladder.steps.display;
  if (display) {
    const n = tokenNames("display");
    out.push(`/* The masthead (PageHero scale=display: /about, /press).
   marketing.css settles .mkt-name at -0.03em from (0,3,0) selectors inside a
   motion query, so the tracking is closed in those same two places and wins on
   order, with nothing forced, and the opening squeeze is left running. */
.mkt-name {
${withSizes ? `  font-size: var(${n.size});\n` : ""}  line-height: var(${n.lh});
}
@media (prefers-reduced-motion: reduce) {
  [data-mkt] .mkt-name {
    letter-spacing: var(${n.ls});
  }
}
@media (prefers-reduced-motion: no-preference) {
  [data-mkt] [data-inview="true"] .mkt-name {
    letter-spacing: var(${n.ls});
  }
}`);
  }

  for (const step of STEPS) {
    if (step.id === "display") continue;
    const hook = HOOKS[step.id];
    const value = ladder.steps[step.id];
    if (!hook || !value) continue;
    out.push(
      `/* ${step.label}: ${hook.note}. */\n${hook.selector} {\n${stepDecls(ladder, step.id, withSizes)}\n}`,
    );
  }

  out.push(`/* The app's section heading has no hook today, whichever ladder wins:
   production writes it as an 11px uppercase label inside an h2 (the dashboard,
   the event feed) or a 14px one (admin metrics, announcements), and there is no
   class worth aiming at. A ladder with a subsection step needs the one-line
   hook the handoff asks for before this paste can reach it. */`);

  const page = ladder.steps.page;
  const prose = ladder.steps.prose ?? ladder.steps.section;
  if (page && prose) {
    out.push(`/* The 404, the one h1 on the site that is not on the ladder: it ships in
   Inter at 600 (not-found-screen.tsx). Here it joins the ladder, at the app's
   page step inside the app and at the prose step on marketing, which is the
   ${askOrdinal(ASK_404)} ask. */
[data-not-found] h1 {
  font-family: var(--font-display, var(--font-sans));
  font-weight: 700;
${stepDecls(ladder, "page", withSizes)}
}
[data-mkt] [data-not-found] h1 {
${stepDecls(ladder, ladder.steps.prose ? "prose" : "section", withSizes)}
}`);
  }

  return out.join("\n\n") + "\n";
}

/**
 * The same ladder as the `@theme` block a wiring round bakes into theme.css.
 * Tailwind v4 reads `--text-x--line-height` and `--text-x--letter-spacing` as
 * that size's defaults, so `class="text-title"` sets all three and the three
 * four-breakpoint ramps in page-hero, section-shell and page-heading collapse
 * to one class each.
 */
export function themeBlock(ladder: Ladder): string {
  return `@theme {\n${tokenLines(ladder, true)}\n}\n`;
}

/* ────────────────────────── The asks, by position ─────────────────────── */

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];

/**
 * An ask's position, in words, READ OFF THE SPEC rather than typed beside it.
 * A hand-typed ordinal goes stale the moment an ask is cut, and a reviewer
 * reading the block he is about to apply then hunts for a question that no
 * longer exists. The import points one way only (this file reads the spec; the
 * spec imports nothing but the kit's types), so the spec stays pure data.
 */
export function askOrdinal(id: string): string {
  const i = TYPE_SCALE.asks.findIndex((a) => a.id === id);
  return i >= 0 && i < ORDINALS.length ? ORDINALS[i] : "unnumbered";
}

/** The 404 ask's id, which the paste's own comment names by position. */
export const ASK_404 = "not-found";

/* ═════════════ The real pages a frame loads, at true pixels ═══════════ */

/**
 * THE JUDGED SURFACE IS THE REAL PAGE.
 *
 * Will, on this board: "I can't actually judge the font sizes in usage
 * themselves scaled down", and "I'd also like more UI previews themselves".
 * The thing that was wrong was the ZOOM, not the frame: a frame at 1440
 * renders 1440 true pixels. So every surface below is a ROUTE in a frame
 * exactly the canvas wide, with the ladder injected into its own document.
 *
 * Three things a reconstruction could never do, and all three matter to a type
 * ruling:
 *  1. The breakpoints are the CANVAS's. A `sm:`/`lg:` prefix inside a stage
 *     reads the browser window; inside a frame at 375 it reads 375, so the
 *     phone end is the page's real phone end.
 *  2. The CLAMP is evaluated, not resolved by hand. Every `vw` in the
 *     generated block measures the frame, so the frame shows the token a
 *     wiring round bakes rather than the board's arithmetic about it.
 *  3. Everything on the page moves, including the headings no hook reaches, so
 *     the reach of the ruling is visible instead of described.
 *
 * ★ NO `?key=` ON A SITE FRAME, ON PURPOSE. The key mounts the marketing
 * motion tuner, whose panel would sit on top of the page being judged, and it
 * mounts CandidateStyle, which would put a stale APPLIED block under the live
 * ladder. The board injects the ladder itself, last in the frame's document.
 * The lab's own SCENE route is the exception: it is gated, so it takes the key
 * the board was opened with.
 */
export type RealPage = {
  id: string;
  /** A site route, or the lab scene's screen id when `scene` is set. */
  href: string;
  label: string;
  /** Why this page is on the board: the step it is here to settle. */
  why: string;
  /** What the ladder does NOT move here, so a still heading reads as the page. */
  reach?: string;
  /** The guest album, whose href is the demo token the board reads from env. */
  demo?: true;
  /** The lab's own screen route: an app surface a frame cannot sign in to. */
  scene?: true;
};

/**
 * THE SIX SURFACES, AND THE STAGE SHOWS ONE AT A TIME (round seven, the
 * stepped review, 2026-09-16).
 *
 * Round six drew three pages twice for the comparison and five more under the
 * pick: eleven frames, six of them off the side of a 1440 window. A step shows
 * ONE page, chosen on its config strip, and the ladder being pressed lands in
 * that page's own document without a reload, so the comparison is the same
 * page re-typing itself in the same place. `against` lays a second copy of it
 * under the first at one canvas width, which is the round-six question
 * settled: two ladders on one real page, no second canvas to scroll to.
 */
export const PAGES: RealPage[] = [
  {
    id: "about",
    href: "/about",
    label: "/about, on paper",
    why: "The masthead over the prose tier C folds away. The board opens here: the biggest type on the site, and a page that holds still under a fade.",
  },
  {
    id: "home",
    href: "/",
    label: "The home arc",
    why: "Four steps, fifteen sections, three grounds, one scroll.",
    reach:
      "The hero's line rotates on its own, so under a fade the two copies land on different words. Read this one a ladder at a time.",
  },
  {
    id: "help",
    href: "/help",
    label: "/help",
    why: "The title step over a dense index.",
  },
  {
    id: "dashboard",
    href: "dashboard",
    scene: true,
    label: "The dashboard",
    why: "The app register, in a document of its own.",
  },
  {
    id: "album",
    href: "",
    demo: true,
    label: "The guest album",
    why: "The surface most people ever see.",
    reach:
      "Nothing here moves: the entry title is written inline, outside both registers.",
  },
  {
    id: "dead",
    href: "/events/not-a-real-event",
    label: "A dead link",
    why: "The one page title on the site set in Inter.",
  },
];

export function pageById(id: string): RealPage {
  return PAGES.find((p) => p.id === id) ?? PAGES[0];
}
