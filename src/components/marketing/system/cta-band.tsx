import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { MARKETING_CTA, type NavLink } from "@/lib/constants/marketing-nav";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { DemoCtaLink } from "./demo-cta-link";
import { Caption } from "./caption";
import { SectionShell } from "./section-shell";

type CtaBandProps = {
  heading: ReactNode;
  subhead?: ReactNode;
  /** The solid conversion button. Defaults to the single-sourced MARKETING_CTA. */
  primary?: NavLink;
  /** Optional outline companion (e.g. "Watch a sample reel"). */
  secondary?: NavLink;
  /**
   * Render the recurring demo CTA line at the band's foot, in the credit's
   * place (DemoCtaLink-gated).
   */
  demoLink?: boolean;
  /**
   * The cinema-close credit: the production line, alone. One per page at most
   * (it reads as the final frame). Deliberately NO Logo lockup: the footer
   * opens with the brand mark ~250px below, and doubling it read as a mistake
   * (R4-A23). The line's own quiet register carries the film credit. The demo
   * link takes its place wherever the band carries one (below), so it stands
   * only in a band with no demo line, or when no demo is configured.
   */
  credit?: boolean;
  reveal?: "cinema" | "standard" | "none";
  className?: string;
};

// Stable-enough analytics id from a CTA label ("Start free" -> "start-free").
// Derived (not hardcoded) because pages pass custom primaries/secondaries.
function ctaSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * THE one conversion band (Track B system layer; absorbs final-cta.tsx's role —
 * it owned a duplicate H2). Composes SectionShell, so the entrance register and
 * the heading scale stay consistent with every other section.
 *
 * ★ THE DEMO LINK STANDS AT THE FOOT, IN THE CREDIT'S PLACE (Will, `reel-story`
 * r3: "let's replace the 'A Partyreel production · partyreel.com' further down
 * with this link so its a bit more spaced from the 'Start free' primary CTA
 * button"). So the buttons end the action and the demo is a second, quieter
 * invitation a beat below them, in every band that carries it; the credit it
 * replaced stays for a band without one (none today; the home's close asks for
 * both and the link wins) and comes back if the demo is ever unset, so the
 * close never ends on a gap.
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
  const demo = demoLink && Boolean(DEMO_EVENT_URL);
  return (
    <SectionShell
      heading={heading}
      subhead={subhead}
      reveal={reveal}
      className={className}
    >
      <div className="mt-8 flex flex-col items-center">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="cta">
            <Link
              href={primary.href}
              {...trackAttrs("cta_click", {
                cta: ctaSlug(primary.label),
                location: "cta-band",
              })}
            >
              {primary.label}
            </Link>
          </Button>
          {secondary && (
            <Button asChild size="cta" variant="outline">
              <Link
                href={secondary.href}
                {...trackAttrs("cta_click", {
                  cta: ctaSlug(secondary.label),
                  location: "cta-band",
                })}
              >
                {secondary.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
      {(demo || credit) && (
        <div className="mt-16 flex flex-col items-center">
          {demo ? (
            <DemoCtaLink source="cta-band" />
          ) : (
            <Caption>A Partyreel production · partyreel.com</Caption>
          )}
        </div>
      )}
    </SectionShell>
  );
}
