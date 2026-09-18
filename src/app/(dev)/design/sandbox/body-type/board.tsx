"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BODY_TYPE } from "./spec";
import {
  AppSurfaces,
  ButtonSurfaces,
  cls,
  fluid,
  GuestPage,
  LabelSurfaces,
  LeadingSurfaces,
  type LeadingRule,
  leadingOf,
  MarketingSection,
  type Probe,
  SmallSurfaces,
  step,
  TypeFrame,
  widthOf,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: one real surface per option, at a real
 * viewport, wearing the candidate that option would land.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE, for two reasons. The
 * width is a knob six decisions share, so each picture reads `s.width`. And the
 * LINE-HEIGHT RULE is a decision of its own, so every other decision is drawn
 * wearing whichever rule is in play: without that, a size question would vary
 * two things at once and answer neither. The step hands `evidence` the state
 * with every decided answer worn, so going back to the guest's step after
 * answering the leading redraws it under the rule he picked rather than under
 * the one the board assumed.
 *
 * ★ THE CANDIDATE IS AIMED AT PRODUCTION CLASSES, NOT AT MARKUP OF OUR OWN.
 * `text-[15px]` is the class 24 guest and marketing sites already wear, so a
 * rule aimed at it moves exactly the sites the ruling would move, including
 * inside components this board imports rather than copies (`EventCard`,
 * `FeedSectionHeader`, `Button`, `Card`). Nothing under src/components is
 * edited, and no option needs a wrapper class invented for it.
 */

/* The production classes each step would replace. */
const READ = cls("text-[15px]");
const SM = cls("text-sm");
const XS = cls("text-xs");
const P11 = cls("text-[11px]");
const P10 = cls("text-[10px]");
const P9 = cls("text-[9px]");
/** A button carries `text-sm` in its own base class, so the app's step has to
 *  say it does not mean the buttons: that is the buttons' own decision. */
const NOT_BUTTON = ':not([data-slot="button"])';

/* The sizes the other decisions are drawn at, read off the answers so far. */
const readingSize = (s: BoardState) => Number(s.reading ?? "16");
const workingSize = (s: BoardState) => Number(s.working ?? "14");
const captionSize = (s: BoardState) => Number(s.caption ?? "12");
const rule = (s: BoardState): LeadingRule => leadingOf(s.leading);

/** The app's working step, wherever it is not a button. */
const working = (s: BoardState, size = workingSize(s)) =>
  step(`${SM}${NOT_BUTTON}`, size, "working", rule(s));

/** The caption step, which is also the floor: every small size lands on it. */
const caption = (s: BoardState, size = captionSize(s)) =>
  step(
    [XS, P11, P10, P9].map((c) => `${c}${NOT_BUTTON}`).join(","),
    size,
    "working",
    rule(s),
  );

/** Marketing's step: the lede sets no size of its own, so it is named directly. */
const MKT = '[data-bt="mkt-lede"],[data-bt="mkt-body"]';
const marketing = (s: BoardState) => {
  const pick = s.marketing ?? "fluid";
  if (pick === "fluid") return fluid(MKT, 16, 18, "reading", rule(s));
  return step(MKT, Number(pick), "reading", rule(s));
};

/* ── the probes: what each caption reads off the frame ───────────────────── */

const GUEST_PROBES: readonly Probe[] = [
  { label: "the description", sel: '[data-bt="guest-description"]' },
  { label: "the name over it", sel: "h1" },
];
const APP_PROBES: readonly Probe[] = [
  { label: "the dashboard", sel: '[data-bt="app-stat"]' },
  { label: "the table", sel: '[data-bt="admin-table"]' },
];
const MKT_PROBES: readonly Probe[] = [
  { label: "the lede", sel: '[data-bt="mkt-lede"]' },
  { label: "the paragraph", sel: '[data-bt="mkt-body"]' },
];
const SMALL_PROBES: readonly Probe[] = [
  { label: "a card pill", sel: `${P10}` },
  { label: "a feed label", sel: `${P11}` },
  { label: "a table's head", sel: '[data-bt="table-head"]' },
];
const LABEL_PROBES: readonly Probe[] = [
  { label: "the eyebrow", sel: '[data-bt="eyebrow"]', track: true },
  { label: "the app's label", sel: '[data-bt="app-label"]', track: true },
];
const BUTTON_PROBES: readonly Probe[] = [
  { label: "cta", sel: '[data-size="cta"]' },
  { label: "default", sel: '[data-size="default"]' },
  { label: "sm", sel: '[data-size="sm"]' },
];
const LEADING_PROBES: readonly Probe[] = [
  { label: "the lede", sel: '[data-bt="mkt-lede"]' },
  { label: "the paragraph", sel: '[data-bt="mkt-body"]' },
  { label: "the table", sel: '[data-bt="admin-table"]' },
];

/* ── the pictures ────────────────────────────────────────────────────────── */

/** A guest's page is a phone whatever the knob says, so it takes no width. */
const guest = (s: BoardState, size: number) => (
  <TypeFrame
    id={`guest-${size}`}
    width="375"
    title="The guest's event page"
    css={step(READ, size, "reading", rule(s))}
    probes={GUEST_PROBES}
  >
    <GuestPage />
  </TypeFrame>
);

const app = (s: BoardState, size: number) => (
  <TypeFrame
    id={`app-${size}`}
    width={widthOf(s.width)}
    title="The dashboard, and the admin's jobs table"
    css={working(s, size)}
    probes={APP_PROBES}
    tall
  >
    <AppSurfaces width={widthOf(s.width)} />
  </TypeFrame>
);

const mkt = (s: BoardState, pick: string) => (
  <TypeFrame
    id={`mkt-${pick}`}
    width={widthOf(s.width)}
    title="A feature section"
    css={marketing({ ...s, marketing: pick })}
    probes={MKT_PROBES}
  >
    <MarketingSection />
  </TypeFrame>
);

const small = (s: BoardState, size: number) => (
  <TypeFrame
    id={`small-${size}`}
    width={widthOf(s.width)}
    title="Event cards, two feed headers and a table's head"
    css={working(s) + caption(s, size)}
    probes={SMALL_PROBES}
    short
  >
    <SmallSurfaces width={widthOf(s.width)} />
  </TypeFrame>
);

/**
 * The label pair, written after the floor so it wins where the two disagree:
 * an uppercase label IS one of the small sizes the floor rule catches, and the
 * pair is the answer for that subset.
 */
const label = (s: BoardState, size: number, track: number) => (
  <TypeFrame
    id={`label-${size}-${track}`}
    width={widthOf(s.width)}
    title="Every uppercase label on the site"
    css={
      working(s) +
      caption(s) +
      step(
        `${cls("uppercase")}${NOT_BUTTON}`,
        size,
        "working",
        rule(s),
        `letter-spacing:${track}em;`,
      )
    }
    probes={LABEL_PROBES}
    short
  >
    <LabelSurfaces width={widthOf(s.width)} />
  </TypeFrame>
);

/**
 * The buttons. `own` is the site as built, so it passes an empty candidate for
 * the buttons themselves and only dresses the copy around them.
 */
const BUTTON_CSS = {
  ladder: (s: BoardState) =>
    step(
      '[data-size="xs"],[data-size="sm"]',
      captionSize(s),
      "working",
      rule(s),
    ) +
    step(
      '[data-size="default"],[data-size="lg"]',
      workingSize(s),
      "working",
      rule(s),
    ) +
    step('[data-size="cta"]', readingSize(s), "reading", rule(s)),
  own: () => "",
  one: (s: BoardState) =>
    step('[data-slot="button"]', workingSize(s), "working", rule(s)),
} as const;

const buttons = (s: BoardState, pick: keyof typeof BUTTON_CSS) => (
  <TypeFrame
    id={`buttons-${pick}`}
    width={widthOf(s.width)}
    title="Every button size, where each one ships"
    css={working(s) + caption(s) + BUTTON_CSS[pick](s)}
    probes={BUTTON_PROBES}
    short
  >
    <ButtonSurfaces width={widthOf(s.width)} />
  </TypeFrame>
);

/**
 * The leading. ONLY THE RULE changes between the three, because every size in
 * the picture is one he has already answered: a question that varied the size
 * and the leading at once would answer neither.
 */
const leading = (s: BoardState, pick: LeadingRule) => {
  const at: BoardState = { ...s, leading: pick };
  return (
    <TypeFrame
      id={`leading-${pick}`}
      width={widthOf(s.width)}
      title="A feature section over the admin's table"
      css={
        // ★ THE READING RULE GOES FIRST AND MARKETING'S OVERRIDES IT. A
        // feature paragraph wears `text-[15px]`, the same class 12 guest sites
        // wear, so the two rules collide and the later one wins on source
        // order. Written the other way round this frame drew marketing's copy
        // at the guest's size and the caption under it said so (measured,
        // 2026-09-18). The sweep has the same problem and splits those 24
        // sites by surface.
        step(READ, readingSize(at), "reading", rule(at)) +
        marketing(at) +
        working(at) +
        caption(at)
      }
      probes={LEADING_PROBES}
    >
      <LeadingSurfaces />
    </TypeFrame>
  );
};

const PREVIEWS: PreviewsFor<typeof BODY_TYPE> = {
  "reading.15": (s) => guest(s, 15),
  "reading.16": (s) => guest(s, 16),
  "reading.17": (s) => guest(s, 17),
  "working.14": (s) => app(s, 14),
  "working.15": (s) => app(s, 15),
  "working.13": (s) => app(s, 13),
  "marketing.16": (s) => mkt(s, "16"),
  "marketing.18": (s) => mkt(s, "18"),
  "marketing.fluid": (s) => mkt(s, "fluid"),
  "caption.12": (s) => small(s, 12),
  "caption.11": (s) => small(s, 11),
  "caption.10": (s) => small(s, 10),
  "label.12-14": (s) => label(s, 12, 0.14),
  "label.11-14": (s) => label(s, 11, 0.14),
  "label.12-08": (s) => label(s, 12, 0.08),
  "buttons.ladder": (s) => buttons(s, "ladder"),
  "buttons.own": (s) => buttons(s, "own"),
  "buttons.one": (s) => buttons(s, "one"),
  "leading.length": (s) => leading(s, "length"),
  "leading.ratio": (s) => leading(s, "ratio"),
  "leading.two": (s) => leading(s, "two"),
};

export function BodyTypeBoard() {
  return <ExplorationBoard spec={BODY_TYPE} previews={PREVIEWS} />;
}
