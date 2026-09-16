"use client";

import { Compass } from "lucide-react";

import { GroundBox, type Mode } from "@/components/lab";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ladderById,
  type Ladder,
  optics,
  type Spec,
  STEPS,
  type StepId,
} from "./ladders";
import { TrueScale } from "./true-scale";

/**
 * THE THREE SPECIMENS THIS BOARD JUDGES ON (round seven, 2026-09-16): the
 * ladder as a type specimen, letter spacing on its own, and the dead-link
 * screen's title. Each one is a tile of its step AND the stage under it, so
 * each is drawn once here and rendered by `board.tsx` in whatever state the
 * step is showing.
 *
 * ★ A TYPE CARD IS A TYPE SPECIMEN, AND A SPECIMEN IS NEVER SCALED. Will's
 * round-four note is the whole constraint: "the iframe previews throw off
 * anything related to size; never zoom, scale or transform a specimen whose
 * size is being judged". So every rung here is drawn at the px the ladder
 * declares for the canvas the board is on, in the real heading face, at the
 * rung's OWN leading and tracking, and it CLIPS what does not fit instead of
 * shrinking it. A 160px masthead shows four letters in a card column, which is
 * exactly how a masthead meets the edge of a page; the thing a reviewer
 * compares is the cap height, and that is true to the pixel. `TrueScale`
 * carries that promise into a step's tiles, which the step surface zooms.
 *
 * ★ AND THE WORDS ARE THE SITE'S OWN. A specimen set in "Partyreel Partyreel"
 * is a font sample; a ladder is judged on the copy that actually stands at
 * each step, so the masthead is /about's wordmark, the hero line is the site
 * thesis, and the card title is an event name.
 */

/** The real line that stands at each step in production. */
const WORD: Record<StepId, string> = {
  display: "Partyreel",
  hero: "The whole event, in one album.",
  title: "Help centre",
  chapter: "How it works",
  section: "Every guest is a camera",
  prose: "Why we built it",
  page: "Dashboard",
  subsection: "Your events",
  card: "Mara and Tom",
};

/** The tiered weight the system already documents: page titles 700, card and
 *  section titles 600 (globals.css, the font-heading utility's comment). */
const WEIGHT: Partial<Record<StepId, number>> = { subsection: 600, card: 600 };

const endOf = (mode: Mode) => (mode === "phone" ? "phone" : "desktop");

/* ─────────────────────────── The ladder card ──────────────────────────── */

/**
 * ★ THE MISSING STEP IS DRAWN AS A HOLE. Today and A, tuned have no size
 * between the app's page title and its card title, and the old board argued
 * that in a paragraph. A ruled gap in the card says it in a glance, and it is
 * read off the data (`ladder.steps[id] === null`), so a ladder cannot claim a
 * step it does not carry.
 */
export function LadderSpecimen({
  ladder,
  mode,
  className,
}: {
  ladder: Ladder;
  mode: Mode;
  className?: string;
}) {
  const end = endOf(mode);
  return (
    <TrueScale className={cn("tsc-ladder", className)}>
      {STEPS.map((step, i) => {
        // ★ THE TWO REGISTERS ARE SEPARATED, or the card reads as a broken
        // ladder. Marketing descends to 18 and then the app's page step starts
        // again at 24, which looks like a mistake until you know that the
        // second half is a different half of the site. One hairline says so.
        const opens = step.surface === "app" && STEPS[i - 1]?.surface !== "app";
        const value = ladder.steps[step.id];
        if (!value) {
          return (
            <div
              key={step.id}
              data-opens={opens ? "" : undefined}
              className="tsc-rung tsc-rung-hole"
            >
              <span className="tsc-rung-px">none</span>
              <span className="tsc-rung-gap" aria-hidden />
            </div>
          );
        }
        const spec = value[end];
        return (
          <div
            key={step.id}
            data-opens={opens ? "" : undefined}
            className="tsc-rung"
          >
            <span className="tsc-rung-px">{spec.px}</span>
            <Word step={step.id} spec={spec} />
          </div>
        );
      })}
    </TrueScale>
  );
}

/** One rung's real line, at its own size, leading and tracking. */
function Word({
  step,
  spec,
  ls,
}: {
  step: StepId;
  spec: Spec;
  /** Override the tracking, for the spacing specimen's two halves. */
  ls?: number;
}) {
  return (
    <span
      className="tsc-rung-word font-heading"
      style={{
        fontSize: `${spec.px}px`,
        lineHeight: spec.lh,
        letterSpacing: `${ls ?? spec.ls}em`,
        fontWeight: WEIGHT[step],
      }}
    >
      {WORD[step]}
    </span>
  );
}

/* ───────────────────────── Letter spacing, alone ──────────────────────── */

/** The site's flat heading tracking today (`font-heading`, globals.css). */
const FLAT_LS = -0.03;

/** The three steps the spacing question is decided at: the loudest, the middle
 *  of the marketing range, and the size read most. */
const SPACING_STEPS: StepId[] = ["display", "chapter", "card"];

/**
 * LETTER SPACING, ON ITS OWN. Today's own sizes, once under the flat value the
 * site ships and once under the law that reads the value off the size. No size
 * moves between the two, which is what makes this a ruling that can be taken
 * whichever card wins.
 *
 * ★ IT DRAWS ONE ANSWER AT A TIME, ON PURPOSE. The step puts the two options
 * side by side as tiles, so a specimen that ALSO drew both halves would print
 * the same comparison twice and halve the width each word gets. The value is
 * the state.
 */
export function SpacingSpecimen({
  mode,
  tracking,
}: {
  mode: Mode;
  /** `adopt`: the law. Anything else: the flat value, as it ships. */
  tracking: string;
}) {
  const end = endOf(mode);
  const today = ladderById("today");
  const law = tracking === "adopt";
  // ★ ON PAPER, LIKE THE THING IT IS ABOUT. Tracking is read optically, and
  // light type on the lab's dark chrome spreads: the same value looks looser
  // than it does on the page it ships on. `GroundBox` also marks its subtree a
  // specimen, which is what keeps it out of the reading budget.
  return (
    <GroundBox
      ground="paper"
      className="overflow-hidden rounded-lg p-4 ring-1 ring-foreground/10"
    >
      <TrueScale className="tsc-ladder tsc-spacing">
        {SPACING_STEPS.map((id) => {
          const value = today.steps[id];
          if (!value) return null;
          const spec = value[end];
          const optic = optics(spec.px);
          const ls = law ? optic.ls : FLAT_LS;
          return (
            <div key={id} className="tsc-rung">
              {/* The size and the value it is set at, in the left rail: under
                  the word they read as a caption for the row below. */}
              <span className="tsc-rung-px">
                {spec.px}
                <span className="tsc-rung-note">{ls}em</span>
              </span>
              <Word
                step={id}
                spec={law ? { ...spec, lh: optic.lh } : spec}
                ls={ls}
              />
            </div>
          );
        })}
      </TrueScale>
    </GroundBox>
  );
}

/* ────────────────────────── The dead-link title ───────────────────────── */

/** The shipped 404 h1: `text-3xl sm:text-4xl`, semibold, in Inter. */
const SHIPPED: Record<"phone" | "desktop", Spec> = {
  phone: { px: 30, lh: 1.2, ls: -0.025 },
  desktop: { px: 36, lh: 1.111, ls: -0.025 },
};

/**
 * THE DEAD-LINK SCREEN, AT TRUE SIZE. The production `NotFoundScreen` with the
 * marketing 404's own content, cropped to the block a reader meets: the title
 * is the only page title on the site set in the body font.
 *
 * ★ THE TITLE IS RESTYLED THROUGH THE HOOK THE PASTE USES, not through a prop.
 * `candidateCss` lands `[data-not-found] h1 { ... }`, and `board.css` applies
 * exactly that selector inside this wrapper from the three values below, so
 * what a reviewer sees is the rule a ruling would ship rather than a drawing
 * of it. The size is pinned here rather than left to `sm:`, because a Tailwind
 * prefix inside the lab reads the browser window and not the canvas.
 *
 * ★ AND THE TWO BUTTONS DO NOT NAVIGATE. They are the production `Button` at
 * the production size, without the links under them: a stray press inside a
 * tile would take the whole lab to the marketing home.
 */
export function DeadLinkSpecimen({
  mode,
  ladder,
  onSet,
}: {
  mode: Mode;
  /** The ladder whose marketing prose step the title would join. */
  ladder: Ladder;
  onSet: boolean;
}) {
  const end = endOf(mode);
  const step = ladder.steps.prose ?? ladder.steps.section;
  const spec = onSet && step ? step[end] : SHIPPED[end];
  return (
    <GroundBox
      ground="paper"
      className="overflow-hidden rounded-lg p-6 ring-1 ring-foreground/10"
    >
      <TrueScale className="flex justify-center">
        <div
          className="tsc-404"
          data-on-set={onSet ? "" : undefined}
          style={
            {
              "--tsc-404-size": `${spec.px}px`,
              "--tsc-404-lh": spec.lh,
              "--tsc-404-ls": `${spec.ls}em`,
            } as React.CSSProperties
          }
        >
          <NotFoundScreen
            icon={Compass}
            eyebrow="404"
            title="We lost this page"
            description="The link may be broken or the page may have moved. Let us point you back to Partyreel."
            actions={
              <>
                <Button type="button" size="lg" className="h-11 px-6 text-base">
                  Back home
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 px-6 text-base"
                >
                  Visit the help center
                </Button>
              </>
            }
          />
        </div>
      </TrueScale>
    </GroundBox>
  );
}
