import type { CSSProperties, ReactNode } from "react";

import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

type PaperHeroProps = {
  eyebrow: string;
  /** The page h1. One per page. */
  heading: ReactNode;
  subhead?: ReactNode;
  /** A fourth reveal slot below the subhead (careers puts its apply Button here). */
  trailing?: ReactNode;
  /**
   * The hairline under the hero. Default true (the shared paper idiom). Pass
   * false on a page that owns a stronger horizontal division of its own and
   * would otherwise compete with it.
   */
  bordered?: boolean;
  className?: string;
};

/**
 * THE PAPER HERO: the (paper) lane's shared opening idiom, extracted. About,
 * press and careers were carrying byte-similar copies of this block, so the
 * ruled marketing H1 ramp (text-4xl sm:text-5xl md:text-6xl lg:text-7xl, ruled
 * site-wide 2026-08-27: titles must OWN their headers) lived in three places
 * and drifted in a fourth.
 *
 * NOT yet adopted by /contact or /blog: contact stops at md:text-6xl with a
 * narrower subhead, and blog runs a tighter gap-5 / py-16 rhythm at a 2xl h1
 * width. Those are real variations, not drift, and they need gap/py/width props
 * this component deliberately does not have yet. Add them when those pages
 * adopt it, not speculatively.
 *
 * ★ THE .mkt-line LANDMINE, in one place so no caller re-derives it:
 * `[data-mkt] .mkt-line` forces `display: block` (the texts-reveal recipe,
 * marketing.css chapter 2) and marketing.css is UNLAYERED, so it outranks any
 * layered Tailwind utility on the same element. Flex utilities on a .mkt-line
 * are silently dead. Constrained children therefore center with `mx-auto`, and
 * inline `trailing` content must be wrapped rather than laid out on the line
 * itself — which is exactly what careers does with its Button.
 */
export function PaperHero({
  eyebrow,
  heading,
  subhead,
  trailing,
  bordered = true,
  className,
}: PaperHeroProps) {
  return (
    <section className={cn(bordered && "border-b", className)}>
      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <TextsReveal className="flex flex-col items-center gap-6">
          <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
            {eyebrow}
          </Eyebrow>
          <h1
            className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            {heading}
          </h1>
          {subhead && (
            <p
              className="mkt-line max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {subhead}
            </p>
          )}
          {trailing && (
            <span className="mkt-line" style={{ "--i": 3 } as CSSProperties}>
              {trailing}
            </span>
          )}
        </TextsReveal>
      </Container>
    </section>
  );
}
