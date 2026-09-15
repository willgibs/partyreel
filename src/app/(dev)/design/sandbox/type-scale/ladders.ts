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

/** Every block the board can paste at the real site: the four ladders, the
 *  tracking law on its own (round two made it adoptable without the sizes), and
 *  round four's PAIR, which is a marketing ladder and an app ladder chosen
 *  separately and composed into one block. */
export type PasteId = LadderId | "law" | "pair";

export type Ladder = {
  id: PasteId;
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
 * The app gets an instrument register: 20 / 18 / 16 (round one proposed
 * 20 / 16 / 14 and round two rebuilt the bottom of it, below), low contrast,
 * hierarchy carried by weight and colour rather than size, because in the app
 * the photographs are the loud thing and the chrome should get out of their
 * way. The page title comes DOWN from 24, which is the swing to rule on.
 */
const C: Ladder = {
  id: "c",
  name: "C. Registers",
  rationale:
    "Two registers rather than one ladder. Marketing becomes editorial and much louder at the top; the app becomes an instrument and goes quieter, with weight carrying the hierarchy.",
  law: "Marketing and the app share the face and the tracking law and nothing else.",
  cost: "Two ladders to maintain, a 200px masthead that only holds one or two words, and an app page title that drops below today's.",
  // The app register is round two's: 20 / 18 / 16, with the card step held at
  // the floor. See the steps below for what was reconsidered and why.
  aliases: { prose: "section" },
  steps: {
    display: pair(s(80, 0.84, -0.05), s(200, 0.82, -0.05)),
    hero: pair(s(52, 0.98, -0.042), s(120, 0.88, -0.045)),
    title: pair(s(40, 1.05, -0.036), s(80, 0.95, -0.04)),
    chapter: pair(s(32, 1.12, -0.03), s(56, 1.04, -0.034)),
    section: pair(s(26, 1.2, -0.026), s(40, 1.1, -0.03)),
    prose: pair(s(26, 1.2, -0.026), s(40, 1.1, -0.03)),
    /**
     * ★ ROUND TWO'S RECONSIDERATION (the brief asked for it from the ground
     * up). Round one proposed 20 / 16 / 14. The page title at 20 SURVIVED:
     * judged on the real dashboard, an app title is a locator rather than a
     * headline, and 20 reads composed next to a 14px body. The card title at
     * 14 did NOT. A Card sets `text-sm` on its whole subtree and
     * CardDescription is `text-sm`, so a 14px CardTitle is exactly the size of
     * the sentence beneath it: on the dashboard, where the event name is the
     * one thing a host scans for, the title is then separated from its
     * metadata by weight and colour alone. The site already ships that
     * register deliberately (`Card size="sm"` steps the title down to 14), and
     * a compact variant is not a default.
     *
     * So C keeps its quiet title and gains a FLOOR, which is the law round two
     * adds and `ladders.test.ts` now pins for every ladder: no heading in the
     * app is smaller than the body text it sits above (14px inside a card), so
     * the card step stops at 16 and the section step takes 18. C is still the
     * loudest claim on the board (a page title below today's 24); it is no
     * longer the one that reads cheap.
     */
    page: pair(s(20, 1.3, -0.014), s(20, 1.3, -0.014)),
    subsection: pair(s(18, 1.35, -0.01), s(18, 1.35, -0.01)),
    card: pair(s(16, 1.4, -0.006), s(16, 1.4, -0.006)),
  },
};

/**
 * ROUND THREE: THE STRONGEST FIRST. The wave's first two rounds listed the
 * ladders in the order they were written (today, then A, B, C), which made the
 * board a menu. A board that has walked its own candidates should say which one
 * it would ship, so the order is now the board's own ranking and today's is
 * last, as the control rather than as the default.
 */
export const LADDERS: Ladder[] = [B, C, A, TODAY];

/** What the board would ship, and what BOTH ladder asks default to. */
export const RECOMMENDED: LadderId = "b";

export function ladderById(id: LadderId): Ladder {
  const found = LADDERS.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown ladder: ${id}`);
  return found;
}

/* ─────────────────────── What each ladder actually fixes ──────────────────── */

/**
 * Today's four faults, as the four columns of the glance table. Each is
 * COMPUTED from the ladder data rather than declared beside it, so a candidate
 * cannot claim a fix it does not make and a tick on the board is a measurement.
 */
export type Fix = "phone" | "leading" | "tracking" | "middle";

export const FIXES: {
  id: Fix;
  label: string;
  fault: string;
  /** The register the fault belongs to, so each half of the glance shows its
   *  own faults rather than a row that can never be true of it. */
  surfaces: Surface[];
}[] = [
  {
    id: "phone",
    label: "The phone end",
    fault: "at 375 today has three distinct sizes doing the work of six",
    surfaces: ["marketing"],
  },
  {
    id: "leading",
    label: "Named leading",
    fault: "line-height arrives with whichever size class the ramp lands on",
    surfaces: ["marketing", "app"],
  },
  {
    id: "tracking",
    label: "Tracking by size",
    fault: "a 160px masthead and a 16px card title share one -0.03em",
    surfaces: ["marketing", "app"],
  },
  {
    id: "middle",
    label: "The app's middle",
    fault: "between the page title and the card title the app has no step",
    surfaces: ["app"],
  },
];

/** Tailwind's own line-heights for the size classes today's ramps land on.
 *  A ladder NAMES its leading when its values are not all borrowed from here. */
const BORROWED_LEADING = new Set([0.85, 1, 1.111, 1.2, 1.333, 1.375]);

export function fixes(ladder: Ladder, surface?: Surface): Record<Fix, boolean> {
  // A folded step is the step it folds into, so counting it twice would make a
  // ladder look as though it tracked two things at one value.
  const named = STEPS.filter(
    (s) =>
      ladder.steps[s.id] &&
      ladder.aliases?.[s.id] === undefined &&
      (!surface || s.surface === surface),
  );
  const phoneSizes = named
    .filter((s) => s.surface === "marketing")
    .map((s) => ladder.steps[s.id]!.phone.px);
  const leadings = named.flatMap((s) => [
    ladder.steps[s.id]!.phone.lh,
    ladder.steps[s.id]!.desktop.lh,
  ]);
  const tracking = new Set(named.map((s) => ladder.steps[s.id]!.desktop.ls));
  return {
    phone:
      phoneSizes.length > 0 && new Set(phoneSizes).size === phoneSizes.length,
    leading: leadings.some((lh) => !BORROWED_LEADING.has(lh)),
    // ROUND FOUR: the law is per-step, so "fixed" is every live step carrying
    // its OWN value, not a count that only reads right for a six-step register.
    // The app register is two or three steps; the old `>= 5` could never be
    // true of it, and round four asks the two registers separately.
    tracking: tracking.size > 1 && tracking.size === named.length,
    middle: Boolean(ladder.steps.subsection),
  };
}

/**
 * How much of the site a ladder actually moves at one canvas, counted rather
 * than claimed. A. Tuned keeps every desktop size today ships, so at 1440 it
 * moves NOTHING but the leading and the tracking, and a reviewer toggling to it
 * on a desktop would otherwise read a working control as a broken one.
 */
export function moved(
  ladder: Ladder,
  end: "phone" | "desktop",
  surface?: Surface,
): { moved: number; of: number; added: number } {
  let count = 0;
  let of = 0;
  let added = 0;
  for (const step of STEPS) {
    if (surface && step.surface !== surface) continue;
    const mine = ladder.steps[step.id];
    const now = TODAY.steps[step.id];
    if (!mine) continue;
    if (!now) {
      added += 1;
      continue;
    }
    of += 1;
    if (mine[end].px !== now[end].px) count += 1;
  }
  return { moved: count, of, added };
}

/* ───────────────────── The four rulings, and the board's own ──────────────── */

/**
 * ROUND THREE: FOUR ASKS, EACH A ONE-WORD ANSWER, EACH WITH THE BOARD'S OWN.
 *
 * Round two asked six. Two of them stopped earning their place: the app's floor
 * asked Will to rule on a 14px card title that C no longer proposes (round two
 * rebuilt C to 20 / 18 / 16 and `ladders.test.ts` pins the floor for every
 * ladder, so there is nothing left to choose), and the face pairing asked him
 * to rule on a question the board answers with evidence rather than with a
 * choice. Both are stated as departures instead; a ruling that is already made
 * is not an ask.
 *
 * `answer` is what the board would ship; `overrule` is the one thing that would
 * change its mind, so a disagreement is also a few words.
 */
export const ASKS: {
  ask: string;
  answer: string;
  because: string;
  overrule: string;
}[] = [
  {
    ask: "The marketing ladder: B rungs, C registers, A tuned or today",
    answer: "B",
    because:
      "One rung set from 12 to 160 with the ratio widening as it climbs, every step sitting on a rung at both ends and reading its leading and its tracking off the rung. Today's desktop ladder is an unevenly rounded version of it already, so this is the ladder the site is a rough draft of.",
    overrule:
      "C, if the front of the site should read as a poster: 200 over 120 rather than 160 over 100, and the prose tier folded away.",
  },
  {
    ask: "The app ladder: B rungs, C registers, A tuned or today",
    answer: "B",
    because:
      "The app gets the middle tier it has never had, so the three h2s that are labels wearing a heading tag become a heading, and the page title grows from 24 on a phone to 28 on a desktop instead of standing still at both.",
    overrule:
      "C, if the chrome should go quieter than today rather than louder: a 20px title, with weight and colour carrying the rank under it.",
  },
  {
    ask: "The tracking law: adopt, or keep the flat -0.03em",
    answer: "Adopt",
    because:
      "It is a function of size, so it moves no size and can be taken whichever ladder wins, and it is the only one of today's faults that today's numbers can fix by themselves.",
    overrule:
      "Keep the constant, if one value for every heading is the simplicity worth paying a loose masthead and a tight card title for.",
  },
  {
    ask: "The 404's h1: put it on the ladder, or leave it off",
    answer: "On the ladder",
    because:
      "It is the only page title on the site in Inter, and it is not an edge case: the marketing 404, the app 404, the admin 404 and every dead guest link.",
    overrule:
      "Leave it off, and the exception becomes documented rather than swept.",
  },
];

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];

/**
 * An ask's position, in words, READ OFF `ASKS` rather than typed beside it.
 *
 * ★ Round three cut two asks and the generated paste went on calling the 404
 * "the fifth ask", so a reviewer reading the block he is about to apply hunted
 * for a question that no longer existed. A number about a list belongs to the
 * list: every place that names an ask's position calls this, so cutting or
 * reordering `ASKS` moves all of them at once.
 */
export function askOrdinal(startsWith: string): string {
  const i = ASKS.findIndex((a) => a.ask.startsWith(startsWith));
  return i >= 0 && i < ORDINALS.length ? ORDINALS[i] : "unnumbered";
}

/** The 404 ask, which three places name by position (the paste's comment, the
 *  departure and the stage that shows it). */
export const ASK_404 = "The 404's h1";

/* ────────────────── Where a paste can be walked, and where not ───────────── */

/**
 * THE PAGES A CANDIDATE CAN ACTUALLY BE WALKED ON.
 *
 * ★ Round three's cold walk found two dead links in round two's list. The
 * candidate's `<style>` is rendered by a design island, and the island mounts
 * in exactly three places: the lab layout, the two marketing layouts and the
 * app layout. `/admin` mounts none, and `/nothing-here` resolves to the ROOT
 * `app/not-found.tsx`, which sits outside both marketing and the app, so both
 * links looked like a broken paste rather than a missing island. The 404 link
 * is a MARKETING 404 now (an unknown event slug renders
 * `(marketing)/(cinema)/not-found.tsx`, inside the island's layout).
 */
export const WALK: { href: string; label: string }[] = [
  { href: "/", label: "the home" },
  { href: "/pricing", label: "/pricing" },
  { href: "/features/curation", label: "a feature page" },
  { href: "/help", label: "/help" },
  { href: "/about", label: "/about, on paper" },
  { href: "/contact", label: "/contact" },
  { href: "/dashboard", label: "the dashboard" },
  // ROUND FOUR: both of these were on the NO_ISLAND list until the Orchestrator
  // landed the two one-line mounts round three's handoff asked for. admin and
  // (guest) now carry AppDesignIsland, so an applied block reaches the portal
  // and the guest album in a real tab, which is the only way the app register
  // can be walked signed in.
  { href: "/admin", label: "the admin portal" },
  { href: "/events/not-a-real-event", label: "a marketing 404" },
];

/** The surfaces no paste reaches, named on the board so a reviewer never reads
 *  a missing island as a broken block. Each is one line for the wiring round. */
export const NO_ISLAND: { where: string; why: string }[] = [
  {
    where: "the root 404",
    why: "app/not-found.tsx renders outside both marketing and the app, so it mounts no island at all; the marketing 404 in the walk wears the paste instead",
  },
];

/**
 * ROUND FOUR, and worth carrying past this board: the two surfaces round three
 * could not reach are reachable now. `admin/layout.tsx` and `(guest)/layout.tsx`
 * both mount `AppDesignIsland`, which is exactly the one-line change this
 * board's round-three handoff and the floating-surfaces and rounding boards all
 * asked for. Every board in the wave can now be walked on the portal and on a
 * guest album; only the root 404 is still outside every island, and that one is
 * structural rather than a missing mount.
 */
export const ISLANDS_LANDED =
  "admin and the guest routes mount a design island now, so a block reaches the portal and the album in a tab. Only the root 404 is still outside every island.";

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
  /** Which register the row came from, so one table can show a chosen pair. */
  surface: Surface;
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
      surface: step.surface,
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

/* ───────────────── The tracking law, as a function of size ───────────────── */

/**
 * ROUND TWO: the law on its own (the third ask). "Letter-spacing and
 * line-height run inverse to size" is the design system's own written rule and
 * `font-heading`'s flat -0.03em is what does not implement it. Round one showed
 * the law inside three candidates, where adopting it meant adopting a ladder
 * too. It does not: the law is a FUNCTION of size, so it can be applied to the
 * sizes the site already ships.
 *
 * B's rung table IS that function, sampled at fifteen points; `optics()` reads
 * between the samples so any size has a law value, and `LAW_ONLY` below is
 * today's ladder with nothing changed but its leading and its tracking.
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
 * Today's sizes under the law. Not a fifth ladder and never in `LADDERS`: it is
 * the paste for "adopt the law, rule on the sizes later", and it is the only
 * block on this board that moves no size at all.
 */
export const LAW_ONLY: Ladder = {
  id: "law",
  name: "The law alone",
  rationale:
    "Today's sizes, every one of them, with leading and tracking running inverse to size instead of a flat -0.03em. The smallest thing the board can ship.",
  law: "Leading and tracking are read off the size, so no step chooses its own optics.",
  cost: "None of today's three faults are fixed except the tracking one: the phone end still collapses and the app still has no middle.",
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

/* ──────────────────── The app's floor (round two's law) ──────────────────── */

/**
 * A Card sets `text-sm` on its whole subtree and CardDescription is `text-sm`,
 * so 14px is the body size a card title sits on top of. Round two's
 * reconsideration of C turned that into a law the test pins for every ladder:
 * an app heading is never smaller than the body under it, because below that
 * line the hierarchy is carried by weight and colour alone and a host scanning
 * a dashboard for an event name has nothing to aim at.
 */
export const APP_BODY_PX = 14;

/* ─────────────── The paste: a candidate on the real site ──────────────── */

/**
 * WHERE EACH STEP LANDS IN PRODUCTION, as a selector.
 *
 * Round two's job was to make each candidate a real paste rather than a stage,
 * so every step names the hook it has TODAY. Three kinds appear:
 *  - a real hook: `.mkt-name` and `[data-slot="card-title"]` are named things;
 *  - the ramp's top class: a step whose only signature is its Tailwind ramp is
 *    matched by that ramp's widest class (`[class~="lg:text-7xl"]`). That is a
 *    FEATURE here, not a hack: the four heroes that hand-roll the same ramp
 *    (the home's cinema hero, qr-hero, reel-hero, events/[slug]) carry the same
 *    class and move with the step, which is exactly what the ruling would do;
 *  - no hook at all: the app's section heading is a label inside an h2 and has
 *    no class worth matching, so the paste leaves it alone and says so.
 *
 * Tailwind's utilities live in `@layer utilities`, so any unlayered rule beats
 * them whatever its specificity; the two selectors that have to beat
 * marketing.css (unlayered, (0,3,0) on `.mkt-name`) match its shape and win on
 * order, since the candidate style element is rendered after every stylesheet.
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
    note: "the prose head: /about, /press, /help's sections, /contact, and the stat numerals on /help, which already ship at this step",
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

const px3 = (n: number) => Number(n.toFixed(2));

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
 * `setCandidateCss` renders it as a style element after every stylesheet on
 * every page with a key-gated island, so this is the candidate on the real
 * home, the real /help and the real dashboard rather than on a stage. It is
 * generated from the same data the stages render, so the two can never drift.
 *
 * The `law` block sets no font-size anywhere: that is what makes the third ask
 * answerable on its own.
 */
export function candidateCss(ladder: Ladder): string {
  const withSizes = ladder.id !== "law";
  const out: string[] = [];
  out.push(`/* The type scale: ${ladder.name}.
   ${ladder.law}
   Generated by the type-scale board from ladders.ts, which is the same data its
   stages render. Token names are Tailwind v4's font-size shape, so the bake is
   one @theme block and a baked step becomes one utility class.
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

  if (!ladder.steps.subsection) {
    out.push(`/* The app's section heading has NO step in this ladder, and no hook either:
   production writes it as an 11px uppercase label inside an h2 (the dashboard,
   the event feed) or a 14px one (admin metrics, announcements). The paste
   leaves it exactly as it ships; the board's stage 10 is where it is judged. */`);
  } else {
    out.push(`/* Subsection: the app's section heading. It has no hook today (an 11px
   uppercase label inside an h2 on the dashboard, 14px in admin), so this step
   cannot reach the real page from a paste. It needs the one-line hook the
   board's handoff asks for; stage 10 shows what it does. */`);
  }

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
 * The same ladder as the `@theme` block the wiring round bakes into theme.css.
 * Tailwind v4 reads `--text-x--line-height` and `--text-x--letter-spacing` as
 * that size's defaults, so `class="text-title"` sets all three and the three
 * four-breakpoint ramps in page-hero, section-shell and page-heading collapse
 * to one class each.
 */
export function themeBlock(ladder: Ladder): string {
  return `@theme {\n${tokenLines(ladder, true)}\n}\n`;
}

/* ══════════════════════ ROUND FOUR: THE PAIR ══════════════════════════ */

/**
 * WILL'S RULING TO MAKE, AND THE BOARD'S CALL ON THE SHAPE.
 *
 * "Marketing and app will have different type scales. Your call on separating
 * them into two distinct sets or combining them all into one. I'd like to
 * select them separately in the lab." (Will, 2026-09-15.)
 *
 * The board's call is ONE SET, TWO REGISTERS, and it is argued rather than
 * assumed, because the alternative is real. Two distinct sets would name the
 * same nine roles twice (`--text-mkt-card` and `--text-app-card`) and then have
 * to answer which one a Card wears, since `CardTitle` is ONE component that
 * ships on a pricing page and on the dashboard. It would also duplicate the
 * tracking law, which is a function of size and not of surface: a 40px heading
 * wants the same tracking whichever side of the product it is on, which is the
 * whole of the third ask.
 *
 * One set keeps the bake at one `@theme` block and a baked step at one class,
 * and the two registers are simply which rungs each half of the ladder stands
 * on: `display` through `prose` are marketing's, `page` through `card` are the
 * app's. Nothing in the set is computed from anything else in it, which is
 * exactly why the two halves can be RULED separately, and why the lab selects
 * them separately: a pair is a real, shippable block, not a compromise between
 * two ladders.
 *
 * The one seam worth naming: `card` sits in the app register and marketing's
 * cards follow it. That is deliberate, and it is the floor law's doing (no app
 * heading below the 14px body a Card sets on its own subtree); a marketing card
 * title has never wanted to be louder than that.
 */
export const REGISTER_CALL = {
  headline: "One token set, two registers",
  body: "Nine names, one @theme block, and the register is which rungs each half stands on: display through prose are marketing's, page through card are the app's. Two distinct sets would name every role twice and then have to answer which set a Card wears, since CardTitle is one component that ships on /pricing and on the dashboard, and it would duplicate the tracking law, which is a function of size and not of surface. Nothing in the set is computed from anything else in it, so the two halves are ruled separately without the set splitting: that is what the two switches in the dock are.",
} as const;

/** The register a step belongs to, read off STEPS so there is one statement. */
export const SURFACE: Record<StepId, Surface> = Object.fromEntries(
  STEPS.map((s) => [s.id, s.surface]),
) as Record<StepId, Surface>;

/** A marketing ladder and an app ladder, chosen separately (round four). */
export type Pair = { marketing: LadderId; app: LadderId };

/** Both switches open on what the board would ship. */
export const DEFAULT_PAIR: Pair = { marketing: RECOMMENDED, app: RECOMMENDED };

export const SURFACE_LABEL: Record<Surface, string> = {
  marketing: "Marketing",
  app: "The app",
};

/**
 * The pair as ONE ladder, which is what makes the call above concrete: a pair
 * composes into a single nine-step set with a single `@theme` block and a
 * single paste, so choosing the two halves separately costs the system nothing.
 * When both halves are the same ladder the composition IS that ladder, id and
 * all, so a paste of B alone is byte-identical to a paste of the pair (B, B).
 */
export function composePair(p: Pair): Ladder {
  const m = ladderById(p.marketing);
  const a = ladderById(p.app);
  if (p.marketing === p.app) return m;
  const steps = {} as Record<StepId, StepPair | null>;
  const aliases: Partial<Record<StepId, StepId>> = {};
  for (const step of STEPS) {
    const from = step.surface === "marketing" ? m : a;
    steps[step.id] = from.steps[step.id];
    const alias = from.aliases?.[step.id];
    if (alias) aliases[step.id] = alias;
  }
  return {
    id: "pair",
    name: `${m.name} + ${a.name}`,
    rationale: `${m.name} across marketing and ${a.name} across the app, composed into one nine-step set.`,
    law: `Marketing on ${m.name}, the app on ${a.name}. One set, two registers.`,
    cost: `Marketing pays: ${m.cost} The app pays: ${a.cost}`,
    steps,
    ...(Object.keys(aliases).length ? { aliases } : {}),
  };
}

/* ═════════════ ROUND FOUR: THE REAL PAGES, AT TRUE PIXELS ═════════════ */

/**
 * THE JUDGED SURFACE IS THE REAL PAGE NOW.
 *
 * Will, on this board: "This is currently un-reviewable with the iframes
 * because, despite it maintaining the same scale at a smaller size, I can't
 * actually judge the font sizes in usage themselves scaled down", and "I'd
 * also like ... more UI previews themselves". The thing that was wrong was the
 * ZOOM, not the frame: a frame at 1440 renders 1440 true pixels. So round four
 * replaced four reconstructions (the home sections, a feature page, /about, the
 * hero lockup) with the ROUTES themselves, each in a frame exactly the canvas
 * wide, with the selected pair injected straight into the frame's document.
 *
 * Three things a reconstruction could never do, and all three matter to a type
 * ruling:
 *  1. The breakpoints are the CANVAS's. A `sm:`/`lg:` prefix inside a stage
 *     reads the browser window (the shell's own warning); inside a frame at 375
 *     it reads 375, so the phone end is the page's real phone end.
 *  2. The CLAMP is evaluated, not resolved by hand. Every `vw` in the generated
 *     block measures the frame, so the frame shows the token the wiring round
 *     bakes rather than the board's arithmetic about it.
 *  3. Everything on the page moves, including the sixteen hand-rolled headings
 *     no hook reaches, so the reach of the ruling is visible instead of
 *     described.
 *
 * ★ NO `?key=` ON A FRAME, ON PURPOSE. The key mounts the marketing motion
 * tuner, whose panel would sit on top of the page being judged, and it mounts
 * CandidateStyle, which would put a stale APPLIED block under the live pair.
 * The board injects the pair itself, last in the frame's head.
 */
export const REAL_PAGES: {
  id: string;
  href: string;
  label: string;
  /** Why this page is on the board: the step it is here to settle. */
  why: string;
  /** What the pair does NOT move here, so a still heading reads as the page. */
  reach?: string;
  /** The guest album, whose href is the demo token the board reads from env. */
  demo?: true;
}[] = [
  {
    id: "home",
    href: "/",
    label: "The home arc, top to bottom",
    why: "The display step, the hero step, and the chapter and section tiers across fifteen sections and three grounds. Scroll it inside the frame: this is the whole arc at the pixels it ships.",
    reach:
      "the four feature-family sections and the footer ship a hand-rolled 30 / 36 that no hook reaches",
  },
  {
    id: "pricing",
    href: "/pricing",
    label: "/pricing",
    why: "The title step over plan cards, where the card step and the section step meet a dense table.",
  },
  {
    id: "feature",
    href: "/features/curation",
    label: "A feature page",
    why: "The title step as six pages wear it, over the section tier and a card row.",
    reach: "its four section headings are the hand-rolled 30 / 36",
  },
  {
    id: "help",
    href: "/help",
    label: "/help",
    why: "The same title step on a dense index, plus the stat numerals that ship at the prose step since the mono face left.",
  },
  {
    id: "article",
    href: "/help/who-can-see-your-event",
    label: "A help article",
    why: "The one long-form reading surface on the site: the title step over body prose, where a tight tracking shows first.",
  },
  {
    id: "about",
    href: "/about",
    label: "/about, on paper",
    why: "The masthead at the display step over the prose tier, on the only paper ground marketing has. C folds the prose tier away and this is where that costs something.",
  },
  {
    id: "album",
    href: "",
    demo: true,
    label: "The guest album",
    why: "The surface most people who ever see Partyreel see, and the one no host signs in to. Its heading is an app heading on a guest page, so the app register is what re-lays it.",
    reach:
      "its header is a guest heading rather than a PageHeading, so the app register reaches its album title and not its wordmark",
  },
];
