import type { CSSProperties, ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { Eyebrow } from "./eyebrow";
import { Reveal } from "./reveal";

/**
 * THE PAGE HERO LOCKUP: eyebrow, heading, subhead, actions, in that order, on
 * one shared rhythm. Will's ruling (2026-08-28): the identity pages "share
 * grammar, page picks scale". This owns the grammar; `scale` picks the type.
 *
 * It exists because four pages were about to hand-roll four heroes. /about,
 * press, careers and blog were each built by a separate agent in the same week
 * and each wrote its own eyebrow/heading/subhead stack with its own margins,
 * which is precisely how a lane drifts. (The /about round saw this coming and
 * extracted a `PaperHero` for it, then deleted it again when the page moved
 * grounds. This is that idea, kept.)
 *
 * ── WHY THE GAP IS UNIFORM AND THE DISPLAY STEP IS TRIMMED ──
 *
 * Every hero on the site sets its slots with ONE flex gap: /help's is `gap-6`,
 * the feature heroes' is `gap-5`. That works because a normal heading's box is
 * about its ink. A display line is not, and it is wrong in OPPOSITE directions
 * at each end. Measured off the live 160px wordmark with canvas TextMetrics
 * (Urbanist bold: cap 0.75em over the baseline, the "y" descender 0.25em under
 * it), `leading-[0.85]` plus `py-[0.08em]` put the box top 0.125em ABOVE the
 * cap, while the box bottom lands 0.094em ABOVE the descender. So a uniform
 * `gap-6` reads ~44px over the name and only ~9px under it: too loose, then too
 * tight, from one honest value. That is the "hero spacing is off" Will flagged.
 *
 * The round's build answered it with per-pair margins (mt-1/mt-5/mt-8) on that
 * one page, which lands correct pixels but leaves the page sharing no spacing
 * convention with the lane, and hands the next page the same puzzle. So the gap
 * stays uniform and the DISPLAY STEP TRIMS ITSELF: `-mt-[0.12em]` takes back
 * the top overhang so the shared gap measures from the CAP. It is in `em`, so
 * it holds across the whole clamp rather than at one width.
 *
 * ★ There is deliberately NO bottom trim. The box UNDERSTATES the ink there
 * (the descender hangs below it), so a negative margin would tighten the one
 * end that is already tight; `gap-6` alone leaves the descender ~9px clear.
 * Trimming both ends symmetrically is the intuitive move and it is wrong.
 *
 * ★ Trim the BOX, never the padding. `py-[0.08em]` is load-bearing (a descender
 * clipped by an `overflow-hidden` ancestor is the failure it prevents); the
 * negative margin removes the distance from LAYOUT while the glyph keeps its
 * room.
 *
 * ★ The display step carries TWO optical corrections and they are NOT the same
 * kind of thing. The vertical trim is about the LINE BOX, so it holds at any
 * alignment. The horizontal one (`leadIn`) is about a glyph's SIDE BEARING
 * against a column edge, so it only means anything when there IS an edge to
 * align to: it is gated on `align="left"` rather than baked into the heading
 * class, which is what /press caught when it took this step centred.
 */

export type HeroScale = "display" | "xl" | "lg";

/** The heading + its optical trim, per step. Add a step, do not inline one. */
const HERO_SCALE: Record<
  HeroScale,
  {
    heading: string;
    /** Applied ONLY when align="left". See the display step for why. */
    leadIn?: string;
  }
> = {
  /**
   * A page whose title IS the page (an About page is a title page).
   *
   * ★ ONE OR TWO WORDS (Will's contract, 2026-08-29). `whitespace-nowrap` is
   * load-bearing under a 12vw clamp, and the trim below is reasoned about a
   * SINGLE line's cap and descender, so a title long enough to want a second
   * line has outgrown this step and belongs at `xl`. /about's "Partyreel" and
   * /press's "Media" are what it is for.
   *
   * ★ THE TRACKING SQUEEZE BELONGS TO THE STEP, not to /about. `.mkt-name`
   * (marketing.css) opens the tracking and closes it to the heading face's own
   * -0.03em when the lockup comes into view: any masthead at this size arrives
   * that way. Ruled 2026-08-29 when /press took this step.
   */
  display: {
    heading:
      "mkt-name -mt-[0.12em] py-[0.08em] text-[length:clamp(3.25rem,12vw,10rem)] leading-[0.85] whitespace-nowrap",
    /**
     * ★ LEFT-ALIGNED ONLY, and never folded back into `heading`. This is the
     * optical SIDE BEARING: at 160px a capital carries visible space inside
     * its own glyph box, so a flush-left masthead hangs right of the column it
     * should align to. On a CENTRED heading the same value is simply wrong —
     * there is no edge to align to, and it drags the whole line off centre
     * (measured on /press before the gate: 3.6px, since centring splits the
     * margin between the two sides).
     */
    leadIn: "[margin-inline-start:-0.045em]",
  },
  /** The cinema register (the home hero's ramp). */
  xl: { heading: "text-5xl sm:text-6xl md:text-7xl lg:text-8xl" },
  /** The standard page ramp, shared with /help and the six feature heroes. */
  lg: { heading: "text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl" },
};

export function PageHero({
  scale = "lg",
  align = "center",
  eyebrow,
  heading,
  subhead,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  scale?: HeroScale;
  align?: "center" | "left";
  eyebrow?: ReactNode;
  heading: ReactNode;
  subhead?: ReactNode;
  actions?: ReactNode;
}) {
  // One entrance clock for the whole lockup: each slot takes the next stagger
  // seat, so a hero without an eyebrow does not leave an empty beat.
  let line = 0;
  const mark = () =>
    ({
      "data-mkt-reveal": "",
      style: { "--i": line++ } as CSSProperties,
    }) as const;

  return (
    <section className={className} {...props}>
      <Container>
        <Reveal
          className={cn(
            "flex flex-col gap-6",
            align === "center" ? "items-center text-center" : "items-start",
          )}
        >
          {eyebrow && <Eyebrow {...mark()}>{eyebrow}</Eyebrow>}
          {/* ONE h1 per page, and it is here. SectionShell's `as` prop carries
              the same rule for sections; both exist because /contact once
              shipped with no h1 at all.
              ★ LCP RULE: the H1 never carries a reveal-hidden state, and it
              does not consume a stagger seat. It is the page's LCP element on
              a type-led hero, so gating it behind an in-view callback plus a
              transition delays the largest paint for nothing. The slots around
              it do the arriving; the home hero's ratified shape, and the same
              note sits on qr-hero, attribution-hero and album-link-hero. */}
          <h1
            className={cn(
              "font-heading",
              HERO_SCALE[scale].heading,
              align === "left" && HERO_SCALE[scale].leadIn,
            )}
          >
            {heading}
          </h1>
          {subhead && (
            <p
              {...mark()}
              className={cn(
                "text-lg text-pretty text-muted-foreground",
                align === "center" ? "max-w-xl" : "max-w-2xl",
              )}
            >
              {subhead}
            </p>
          )}
          {/* mt-2 on top of the shared gap: a control row wants a touch more
              air than a text slot, the same offset the feature heroes use. */}
          {actions && (
            <div
              {...mark()}
              className={cn(
                "mt-2 flex flex-col gap-3 sm:flex-row",
                align === "center" ? "items-center" : "items-start",
              )}
            >
              {actions}
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
