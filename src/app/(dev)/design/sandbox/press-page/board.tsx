"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { HumanPreview } from "./a-human";
import { Widths } from "./shared";
import { PRESS_PAGE } from "./spec";
import { ArcPreview } from "./the-arc";
import { ClosePreview } from "./the-close";
import { FactsPreview } from "./the-facts";
import { SheetPreview } from "./the-sheet";
import { WordsPreview } from "./the-words";
import { WhoForPreview } from "./who-for";

/**
 * THE PREVIEWS, and nothing else: every option is the real page pieces
 * (PageHero, PressSection, PressSheet, the copy buttons, PRESS_FACTS) at a
 * real size, abbreviated only where the decision is about structure rather
 * than content (`who-for`, `the-arc`). `the-close` reads `a-human`'s live
 * answer off the board's own state, per exploration.ts's function-preview
 * convention for a decision staged behind another.
 */

/* ── 1. Who the page is for ───────────────────────────────────────────── */

const whoForPreview = (variant: "one-page" | "two-doors" | "folded-into-about") => {
  const heights = {
    "one-page": [950, 1700],
    "two-doors": [700, 1350],
    "folded-into-about": [820, 1500],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`who-for-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <WhoForPreview variant={variant} />}
    />
  );
};

/* ── 2. What the sheet shows ──────────────────────────────────────────── */

const sheetPreview = (variant: "eight-plates" | "marks-only" | "brand-in-use") => {
  const heights = {
    "eight-plates": [700, 1150],
    "marks-only": [430, 480],
    "brand-in-use": [1350, 2050],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`sheet-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <SheetPreview variant={variant} />}
    />
  );
};

/* ── 3. How the words hand over ───────────────────────────────────────── */

const wordsPreview = (variant: "paragraph-and-line" | "three-lengths" | "founder-voice") => {
  const heights = {
    "paragraph-and-line": [560, 700],
    "three-lengths": [640, 820],
    "founder-voice": [740, 900],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`words-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <WordsPreview variant={variant} />}
    />
  );
};

/* ── 4. How checkable the facts are ───────────────────────────────────── */

const factsPreview = (variant: "rendered-rows" | "rows-plus-url" | "stat-strip") => {
  const heights = {
    "rendered-rows": [640, 900],
    "rows-plus-url": [680, 940],
    "stat-strip": [560, 820],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`facts-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <FactsPreview variant={variant} />}
    />
  );
};

/* ── 5. Whether anyone is named ───────────────────────────────────────── */

const humanPreview = (variant: "role-only" | "named-contact" | "founder-card") => {
  const heights = {
    "role-only": [200, 220],
    "named-contact": [260, 280],
    "founder-card": [340, 360],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`human-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <HumanPreview variant={variant} />}
    />
  );
};

/* ── 6. How the page closes (reads a-human's live answer) ────────────── */

const CLOSE_HEIGHTS = {
  "as-today": [340, 400],
  "contact-door": [400, 460],
  "inline-form": [520, 560],
} as const;

/** A named function, not an inline arrow, so this preview is not flagged as
 *  an anonymous component (react/display-name): it reads `a-human`'s live
 *  answer off the board's own state, exploration.ts's function-preview
 *  convention for a decision staged behind another. */
function closeEvidence(
  variant: "as-today" | "contact-door" | "inline-form",
  s: BoardState,
) {
  const humanOption = typeof s["a-human"] === "string" ? s["a-human"] : "role-only";
  const [desktopH, phoneH] = CLOSE_HEIGHTS[variant];
  return (
    <Widths
      id={`close-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <ClosePreview variant={variant} humanOption={humanOption} />}
    />
  );
}

const closePreview =
  (variant: "as-today" | "contact-door" | "inline-form") => (s: BoardState) =>
    closeEvidence(variant, s);

/* ── 7. How the page reads, top to bottom ─────────────────────────────── */

const arcPreview = (variant: "today-order" | "facts-words-first" | "one-screen") => {
  const heights = {
    "today-order": [1650, 2650],
    "facts-words-first": [1650, 2650],
    "one-screen": [820, 1850],
  } as const;
  const [desktopH, phoneH] = heights[variant];
  return (
    <Widths
      id={`arc-${variant}`}
      desktopH={desktopH}
      phoneH={phoneH}
      render={() => <ArcPreview variant={variant} />}
    />
  );
};

const PREVIEWS: PreviewsFor<typeof PRESS_PAGE> = {
  "who-for.one-page": whoForPreview("one-page"),
  "who-for.two-doors": whoForPreview("two-doors"),
  "who-for.folded-into-about": whoForPreview("folded-into-about"),

  "the-sheet.eight-plates": sheetPreview("eight-plates"),
  "the-sheet.marks-only": sheetPreview("marks-only"),
  "the-sheet.brand-in-use": sheetPreview("brand-in-use"),

  "the-words.paragraph-and-line": wordsPreview("paragraph-and-line"),
  "the-words.three-lengths": wordsPreview("three-lengths"),
  "the-words.founder-voice": wordsPreview("founder-voice"),

  "the-facts.rendered-rows": factsPreview("rendered-rows"),
  "the-facts.rows-plus-url": factsPreview("rows-plus-url"),
  "the-facts.stat-strip": factsPreview("stat-strip"),

  "a-human.role-only": humanPreview("role-only"),
  "a-human.named-contact": humanPreview("named-contact"),
  "a-human.founder-card": humanPreview("founder-card"),

  "the-close.as-today": closePreview("as-today"),
  "the-close.contact-door": closePreview("contact-door"),
  "the-close.inline-form": closePreview("inline-form"),

  "the-arc.today-order": arcPreview("today-order"),
  "the-arc.facts-words-first": arcPreview("facts-words-first"),
  "the-arc.one-screen": arcPreview("one-screen"),
};

export function PressPageBoard() {
  return <ExplorationBoard spec={PRESS_PAGE} previews={PREVIEWS} />;
}
