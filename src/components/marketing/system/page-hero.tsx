import type { CSSProperties, ReactNode } from "react";

import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { Eyebrow } from "./eyebrow";
import { Reveal } from "./reveal";

/**
 * THE PAGE HERO LOCKUP: eyebrow, heading, subhead, actions, in that order, on
 * one shared rhythm: the identity pages "share
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
 * it), a 0.85-ish leading plus `py-[0.08em]` put the box top 0.125em ABOVE the
 * cap, while the box bottom lands 0.094em ABOVE the descender. So a uniform
 * `gap-6` reads ~44px over the name and only ~9px under it: too loose, then too
 * tight, from one honest value. That is the "hero spacing is off" Will flagged.
 *
 * The round's build answered it with per-pair margins (mt-1/mt-5/mt-8) on that
 * one page, which lands correct pixels but leaves the page sharing no spacing
 * convention with the lane, and hands the next page the same puzzle. So the gap
 * stays uniform and the DISPLAY STEP TRIMS ITSELF: a negative top margin takes
 * back the overhang so the shared gap measures from the CAP.
 *
 * ★ THE TRIM TRACKS THE LEADING (Will, 2026-09-18, `display-trim=clamped`).
 * The overhang is two things added together: the half-leading, which follows
 * the step's line height, and the face's own ascender-to-cap distance, which is
 * a constant in `em`. The step's leading is itself a clamp (tighter at 1440
 * than at a phone), so the flat `-0.12em` this used to be was right at 1440
 * only and left a sliver of air over the caps at 375. `calc((1em - 1lh) / 2 -
 * 0.19em)` separates them: the first term is minus the half-leading at
 * whatever width is drawing (`1lh` is this element's own line height), the
 * second is the constant, fitted so 1440 keeps exactly the -0.12em it shipped
 * with. A phone therefore trims more (about -0.18em), never less.
 * ★ Mind the SIGN: the board's tile drew `(1lh - 1em) / 2 - 0.05em`, which
 * agrees at 1440 and trims LESS at a phone (about -0.06em), the opposite of
 * what it claimed; page-hero-contract.test.ts pins this form.
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

/**
 * The heading + its optical trim, per step. Add a step, do not inline one.
 *
 * ★ THE SIZE IS A LADDER TOKEN, NEVER A NUMBER HERE.
 * `text-display`, `text-hero` and `text-title` each carry their own
 * font-size, line-height and letter-spacing as one clamp through (375, phone)
 * and (1440, desktop), declared once in `src/app/theme.css`. The four-breakpoint
 * ramps this table used to hold are gone: a step is a pair, not a list of
 * sizes, and a ramp could only ever jump at a breakpoint. What stays in the
 * table is what is NOT the size: the optical trims, the balance and the nowrap.
 */
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
   * that way, since /press took this step.
   */
  display: {
    heading:
      "mkt-name mt-[calc((1em-1lh)/2-0.19em)] py-[0.08em] text-display whitespace-nowrap",
    /**
     * ★ LEFT-ALIGNED ONLY, and never folded back into `heading`. This is the
     * optical SIDE BEARING: at 160px a capital carries visible space inside
     * its own glyph box, so a flush-left masthead hangs right of the column it
     * should align to. On a CENTRED heading the same value is simply wrong —
     * there is no edge to align to, and it drags the whole line off centre by
     * half its value, since centring splits the margin between the two sides.
     * It was unconditional until 2026-08-29, which is why /about's centred
     * wordmark shipped 3.6px left of centre from milestone-9 until the gate.
     *
     * It has NO consumer today (both mastheads are centred). Kept because the
     * correction is real and the next flush-left one will need it; without it
     * written down here, that page discovers a hanging masthead and invents a
     * magic number for it.
     */
    leadIn: "[margin-inline-start:-0.045em]",
  },
  /** The cinema register: the `hero` step (its two ends live in theme.css). */
  xl: { heading: "text-hero" },
  /** The `title` step, shared with /help and the six feature heroes. */
  lg: { heading: "text-title text-balance" },
};

/**
 * THE NAMED ENTRANCES. The feature-pages round settled the first two
 * (2026-09-01); a later pass named the third: "every page
 * does not need to have a single templated hero... but maintaining common
 * design systems around the hero variations we do create is deeply
 * encouraged, so please ensure we don't have tons of very minor variants."
 *
 *  - "rise": the standard `[data-mkt-reveal]` staggered rise. The identity
 *    pages (/about, /press) and /pricing arrive this way.
 *  - "cut": the `[data-mkt-cut]` hard film cut. Every cinema-family hero
 *    (the six feature pages, the hub, /how-it-works, /events).
 *  - "blur": the texts-reveal blur-rise (`.mkt-line` under a `TextsReveal`,
 *    which is class-keyed, so the lockup wraps in that island instead of
 *    `Reveal`). The utility trio: /help, /contact, /careers. The h1 is NEVER
 *    a line: `.mkt-line` rests at opacity 0, which is the LCP hole below, so
 *    the slots around the title do the arriving and the title holds at
 *    paint. `.mkt-line` also forces display:block, so the actions row rides
 *    inside a block wrapper in this register.
 *
 * A new hero either uses one of these or adds a NAMED register here, never
 * an unnamed tweak. Either way the H1 never moves (the LCP rule below), so
 * switching registers changes what the slots AROUND the title do and
 * nothing else.
 */
export type HeroEntrance = "rise" | "cut" | "blur";

export function PageHero({
  scale = "lg",
  align = "center",
  entrance = "rise",
  eyebrow,
  heading,
  subhead,
  actions,
  backdrop,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  scale?: HeroScale;
  align?: "center" | "left";
  entrance?: HeroEntrance;
  eyebrow?: ReactNode;
  heading: ReactNode;
  subhead?: ReactNode;
  actions?: ReactNode;
  /**
   * THE STAGE: whatever the page puts under its lockup (the album filling, the
   * attribution wall, the link frame), rendered inside the same Container
   * after the type. The hero still owns ONLY the lockup; the page owns the
   * object, its entrance and its lamp. It exists so a page with a stage does
   * not have to hand-roll the lockup to get the two side by side, which is
   * how the six feature heroes drifted apart in the first place.
   */
  children?: ReactNode;
  /**
   * THE BACKDROP: what sits BEHIND the lockup (careers' contact sheet and its
   * scrim), rendered before the Container, which turns `relative` so the type
   * stacks above it. Never in front and never beside: an object beside the
   * lockup is a bespoke hero (/qr, the home), by the same rule.
   */
  backdrop?: ReactNode;
}) {
  // One entrance clock for the whole lockup: each slot takes the next stagger
  // seat, so a hero without an eyebrow does not leave an empty beat. The blur
  // register marks its slots with the `.mkt-line` class (the recipe's shape)
  // instead of a data attribute, and wraps in the class-keyed island.
  let line = 0;
  const blur = entrance === "blur";
  const mark = () =>
    ({
      ...(entrance === "cut"
        ? { "data-mkt-cut": "" }
        : entrance === "rise"
          ? { "data-mkt-reveal": "" }
          : {}),
      style: { "--i": line++ } as CSSProperties,
    }) as const;
  const lineClass = blur ? "mkt-line" : undefined;
  const Lockup = blur ? TextsReveal : Reveal;
  const actionsRow = cn(
    "flex flex-col gap-3 sm:flex-row",
    align === "center" ? "items-center" : "items-start",
  );

  return (
    <section className={className} {...props}>
      {backdrop}
      <Container className={backdrop ? "relative" : undefined}>
        {/* max-w-3xl on the centred lockup is LOAD-BEARING (Will, 2026-09-02):
            every hand-rolled hero this replaced clamped its column to 3xl, so
            a long title broke into two even lines; unclamped, "Everything you
            need, nothing to chase." ran the full Container in one 72px line
            and read worse. The clamp is the grammar, not the page. */}
        <Lockup
          className={cn(
            "flex flex-col gap-6",
            align === "center"
              ? "mx-auto max-w-3xl items-center text-center"
              : "items-start",
          )}
        >
          {eyebrow && (
            <Eyebrow {...mark()} className={lineClass}>
              {eyebrow}
            </Eyebrow>
          )}
          {/* ONE h1 per page, and it is here. SectionShell's `as` prop carries
              the same rule for sections; both exist because /contact once
              shipped with no h1 at all.
              ★ LCP RULE: the H1 never carries a reveal-hidden state, and it
              does not consume a stagger seat. It is the page's LCP element on
              a type-led hero, so gating it behind an in-view callback plus a
              transition delays the largest paint for nothing. The slots around
              it do the arriving; the home hero's ratified shape, and the same
              note sits on qr-hero, attribution-hero and album-link-hero. In
              the blur register this is the line that fixes the trio's LCP
              hole: the h1 is the one child without `.mkt-line`. */}
          <h1
            className={cn(
              "font-heading",
              HERO_SCALE[scale].heading,
              align === "left" && HERO_SCALE[scale].leadIn,
            )}
          >
            {heading}
          </h1>
          {/* text-balance on a CENTRED subhead, not text-pretty (Will,
              2026-09-02): a long first line over a short second reads as a
              broken block, and balanced rows are the cheapest visual win a
              lockup has. Left-aligned copy keeps pretty, where a ragged right
              edge is the natural shape.

              ★ THE SUBHEAD IS ON THE LADDER (Will, 2026-09-19,
              `the-ladder=reading`). It was a flat `text-lg`: 18px at 375 and
              18px at 1440, under an h1 that clamps from 34 to 80, so the
              lockup's own proportion came apart as the window grew (the h1 is
              1.9 times the sub at a phone and was 4.4 times at 1440). `subhead`
              is the step the ladder already had for this exact slot, retuned in
              the same change to his numbers (20 at 375, 22 at 1440; theme.css
              carries the quote). It is the ONE reading slot that moved: a
              page's OPENING paragraph stays at `text-lg`, which is what
              "opening stays 18" means, and the labels and card copy stay where
              `body-type` will find them. */}
          {subhead && (
            <p
              {...mark()}
              className={cn(
                "text-subhead text-muted-foreground",
                lineClass,
                align === "center"
                  ? "max-w-xl text-balance"
                  : "max-w-2xl text-pretty",
              )}
            >
              {subhead}
            </p>
          )}
          {/* mt-2 on top of the shared gap: a control row wants a touch more
              air than a text slot, the same offset the feature heroes use.
              In the blur register the row sits inside the line (a block), so
              `.mkt-line`'s display:block cannot flatten the flex row. */}
          {actions &&
            (blur ? (
              <div {...mark()} className="mkt-line mt-2">
                <div className={actionsRow}>{actions}</div>
              </div>
            ) : (
              <div {...mark()} className={cn("mt-2", actionsRow)}>
                {actions}
              </div>
            ))}
        </Lockup>
        {children}
      </Container>
    </section>
  );
}
