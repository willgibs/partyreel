import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { HeaderShell } from "./header-shell";
import { MarketingNavDesktop, type MarketingSkin } from "./marketing-nav";
import { MarketingNavMobile } from "./mobile-menu";

/**
 * The marketing header (Track B chrome). `skin` threads to the nav for THE
 * PORTAL RULE (see mobile-menu.tsx) — it defaults to paper so the root
 * app/not-found.tsx (which renders this outside any marketing group) needs no
 * knowledge of skins. `overlay` (cinema pages) starts the header TRANSPARENT
 * over the hero's media wall and CROSSFADES to glass on scroll via HeaderShell
 * (an inert layer, never a filter on the bar itself — see its header note); the
 * solid variant is the classic always-glass sticky bar. Height rides
 * --mkt-header-h (marketing.css, the one chrome-height knob that SectionShell/
 * MDX scroll margins share); the 4rem fallback keeps the root 404 sane, where
 * marketing.css never loads.
 */
export function MarketingHeader({
  skin = "paper",
  overlay = false,
  className,
}: {
  skin?: MarketingSkin;
  overlay?: boolean;
  /** Extra classes for the sticky bar (see HeaderShell): the token ground. */
  className?: string;
}) {
  return (
    <HeaderShell overlay={overlay} className={className}>
      <Container className="flex h-[var(--mkt-header-h,4rem)] items-center justify-between gap-4">
        <Link href="/" aria-label="Partyreel home" className="shrink-0">
          <Logo />
        </Link>
        {/* Desktop panels render in-flow (no skin prop needed since the
            NavigationMenu flip); the mobile menu still portals and threads
            `skin` for THE PORTAL RULE. */}
        <MarketingNavDesktop className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link
              href="/login"
              {...trackAttrs("cta_click", {
                cta: "log-in",
                location: "header",
              })}
            >
              Log in
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              href={MARKETING_CTA.href}
              {...trackAttrs("cta_click", {
                cta: "start-free",
                location: "header",
              })}
            >
              {MARKETING_CTA.label}
            </Link>
          </Button>
          <MarketingNavMobile className="md:hidden" skin={skin} />
        </div>
      </Container>
    </HeaderShell>
  );
}
