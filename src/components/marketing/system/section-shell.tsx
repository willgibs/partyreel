import type { CSSProperties, ComponentProps, ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { Eyebrow } from "./eyebrow";
import { Reveal } from "./reveal";

type SectionShellProps = ComponentProps<"section"> & {
  /** Optional anchor target — header/footer links jump here (e.g. "faq"). */
  id?: string;
  eyebrow?: string;
  heading?: ReactNode;
  subhead?: ReactNode;
  /**
   * Heading level. "h1" is for a page's LEAD section only (one per page — it is
   * what fixed /contact's missing h1); everything below stays the default h2.
   */
  as?: "h1" | "h2";
  align?: "center" | "left";
  /** Container clamp: narrow = reading column, wide = showcase bleed. */
  width?: "default" | "narrow" | "wide";
  /**
   * Header entrance register: "standard" (default) = the [data-mkt-reveal]
   * staggered rise; "cinema" = the [data-mkt-cut] hard film cut (loud sections
   * only, per the loud/quiet map); "none" = static (quiet/paper surfaces that
   * want zero theater). CSS (marketing.css chapter 1) owns the motion + the
   * reduced-motion fallback; the Reveal island only flips data-inview.
   */
  reveal?: "cinema" | "standard" | "none";
  /** Extra classes for the inner Container (e.g. width clamps). */
  containerClassName?: string;
  /**
   * Heading tier. "default" is the body-section h2: the ladder's `section`
   * step, 24 at a phone and 52 at 1440. "lg" is the `chapter` step (28/64),
   * which sits above every body section and below the page h1. It is a
   * VOCABULARY item for a chapter's opener or closing anchor, not a chapter
   * template: the pacing principle (design-system.md, "Chapters") wants each
   * such section designed bespoke, and this is just the type step several of
   * those designs share.
   */
  scale?: "default" | "lg";
};

/**
 * ★ ONE CLASS PER TIER, AND IT IS A LADDER STEP (Will's type ruling,
 * 2026-09-17). Each step carries its own size, line-height and letter-spacing
 * as one clamp through (375, phone) and (1440, desktop) — see theme.css. The
 * four-breakpoint ramps that used to live here jumped at every breakpoint and
 * inherited whatever leading the class they landed on happened to carry, which
 * is the fault the ladder answers. Never put a `sm:`/`lg:` size back, and never
 * a `leading-*` or `tracking-*` beside a step: both are read off the size, and
 * either one silently cancels the step's own value.
 */
const HEADING_SCALE: Record<NonNullable<SectionShellProps["scale"]>, string> = {
  default: "text-section",
  lg: "text-chapter",
};

const WIDTH_CLASS: Record<NonNullable<SectionShellProps["width"]>, string> = {
  default: "",
  narrow: "max-w-3xl",
  wide: "max-w-[96rem]",
};

/**
 * The marketing section wrapper (Track B system layer; SUPERSEDES section.tsx —
 * new/rebuilt sections compose from this). Consistent vertical rhythm + the
 * eyebrow / heading / subhead block, with the entrance register built in.
 * `scroll-mt` rides `--mkt-header-h` (the one chrome height knob, marketing.css)
 * so anchor jumps clear the sticky header without a hardcoded h-16 coupling.
 */
export function SectionShell({
  id,
  eyebrow,
  heading,
  subhead,
  as = "h2",
  align = "center",
  width = "default",
  reveal = "standard",
  scale = "default",
  className,
  containerClassName,
  children,
  ...props
}: SectionShellProps) {
  const hasHeader = Boolean(eyebrow || heading || subhead);
  const Heading = as;

  // Per-line entrance mark: the data attribute picks the register, `--i` the
  // stagger slot (marketing.css multiplies it by --mkt-stagger-ms / the cut delay).
  let line = 0;
  const mark = () => {
    if (reveal === "none") return {};
    const attr =
      reveal === "cinema" ? { "data-mkt-cut": "" } : { "data-mkt-reveal": "" };
    return { ...attr, style: { "--i": line++ } as CSSProperties };
  };

  const header = hasHeader ? (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
      )}
    >
      {eyebrow && <Eyebrow {...mark()}>{eyebrow}</Eyebrow>}
      {heading && (
        <Heading
          {...mark()}
          className={cn("font-heading text-balance", HEADING_SCALE[scale])}
        >
          {heading}
        </Heading>
      )}
      {subhead && (
        <p {...mark()} className="text-pretty text-muted-foreground">
          {subhead}
        </p>
      )}
    </div>
  ) : null;

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[calc(var(--mkt-header-h)+1rem)] py-20 sm:py-24",
        className,
      )}
      {...props}
    >
      <Container className={cn(WIDTH_CLASS[width], containerClassName)}>
        {header && (reveal === "none" ? header : <Reveal>{header}</Reveal>)}
        {children}
      </Container>
    </section>
  );
}
