import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { MARKETING_CTA, type NavLink } from "@/lib/constants/marketing-nav";

import { DemoCtaLink } from "./demo-cta-link";
import { MonoCaption } from "./mono-caption";
import { SectionShell } from "./section-shell";

type CtaBandProps = {
  heading: ReactNode;
  subhead?: ReactNode;
  /** The solid conversion button. Defaults to the single-sourced MARKETING_CTA. */
  primary?: NavLink;
  /** Optional outline companion (e.g. "Watch a sample reel"). */
  secondary?: NavLink;
  /** Render the recurring demo CTA line under the buttons (DemoCtaLink-gated). */
  demoLink?: boolean;
  /**
   * The cinema-close credit: the Geist Mono production line, alone. One per
   * page at most (it reads as the final frame). Deliberately NO Logo lockup:
   * the footer opens with the brand mark ~250px below, and doubling it read
   * as a mistake (R4-A23) — the mono line carries the film-credit register.
   */
  credit?: boolean;
  reveal?: "cinema" | "standard" | "none";
  className?: string;
};

/**
 * THE one conversion band (Track B system layer; absorbs final-cta.tsx's role —
 * it owned a duplicate H2). Composes SectionShell, so the entrance register and
 * the heading scale stay consistent with every other section.
 */
export function CtaBand({
  heading,
  subhead,
  primary = MARKETING_CTA,
  secondary,
  demoLink = false,
  credit = false,
  reveal = "standard",
  className,
}: CtaBandProps) {
  return (
    <SectionShell
      heading={heading}
      subhead={subhead}
      reveal={reveal}
      className={className}
    >
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          {secondary && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
        {demoLink && <DemoCtaLink />}
      </div>
      {credit && (
        <div className="mt-16 flex flex-col items-center">
          <MonoCaption>A Partyreel production · partyreel.com</MonoCaption>
        </div>
      )}
    </SectionShell>
  );
}
