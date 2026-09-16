"use client";

import { cn } from "@/lib/utils";

import type { Mode } from "@/components/lab";

import { optics, STEPS, type Ladder, type StepId } from "./ladders";

/**
 * THE LADDER, AS A SPECIMEN (the catalog rebuild, 2026-09-16).
 *
 * ★ A TYPE CARD IS A TYPE SPECIMEN, AND A SPECIMEN IS NEVER SCALED. Will's
 * round-four note is the whole constraint: "the iframe previews throw off
 * anything related to size; never zoom, scale or transform a specimen whose
 * size is being judged". So every rung here is drawn at the px the ladder
 * declares for the canvas the dock is on, in the real heading face, at the
 * rung's OWN leading and tracking, and the card CLIPS what does not fit
 * instead of shrinking it. A 160px masthead shows four letters in a card
 * column, which is exactly how a masthead meets the edge of a page; the thing
 * a reviewer compares across five cards is the cap height, and that is true to
 * the pixel.
 *
 * ★ THE MISSING STEP IS DRAWN AS A HOLE. Today and A, tuned have no size
 * between the app's page title and its card title, and the old board argued
 * that in a paragraph. A ruled gap in the card says it in a glance, and it is
 * read off the data (`ladder.steps[id] === null`), so a ladder cannot claim a
 * step it does not carry.
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

export function LadderSpecimen({
  ladder,
  mode,
  className,
}: {
  ladder: Ladder;
  mode: Mode;
  className?: string;
}) {
  const end = mode === "phone" ? "phone" : "desktop";
  return (
    <div className={cn("tsc-ladder", className)}>
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
            <span
              className="tsc-rung-word font-heading"
              style={{
                fontSize: `${spec.px}px`,
                lineHeight: spec.lh,
                letterSpacing: `${spec.ls}em`,
                fontWeight: WEIGHT[step.id],
              }}
            >
              {WORD[step.id]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * LETTER SPACING, ON ITS OWN (the third ruling, and the only ask on this
 * section). The same two words at the two ends of the ladder, once at the flat
 * value the site ships and once at the value the law reads off the size. No
 * size moves between the halves, which is what makes it a ruling that can be
 * taken whichever card wins.
 */
export function TrackingStrip({ mode }: { mode: Mode }) {
  const big = mode === "phone" ? 64 : 160;
  const small = 16;
  const rows: { px: number; word: string; where: string }[] = [
    { px: big, word: "Partyreel", where: "the masthead on /about" },
    { px: small, word: "Mara and Tom", where: "a card title, app and pricing" },
  ];
  return (
    <div className="tsc-law">
      {rows.map((row) => (
        <div key={row.px} className="tsc-law-row">
          <p className="tsc-law-label">
            {row.px}px, {row.where}
          </p>
          <div className="tsc-law-pair">
            {[
              { id: "flat", ls: -0.03, name: "One value for every heading" },
              {
                id: "law",
                ls: optics(row.px).ls,
                name: "Spacing that follows the size",
              },
            ].map((half) => (
              <div key={half.id} className="tsc-law-half">
                <span
                  className="tsc-rung-word font-heading"
                  style={{
                    fontSize: `${row.px}px`,
                    lineHeight: optics(row.px).lh,
                    letterSpacing: `${half.ls}em`,
                  }}
                >
                  {row.word}
                </span>
                <p className="tsc-law-name">
                  {half.name}, {half.ls}em
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
