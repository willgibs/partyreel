import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import {
  MarketingNavDesktop,
  MarketingNavMobile,
  type MarketingSkin,
} from "./marketing-nav";

/**
 * The marketing header (Track B chrome). Always-glass: bg-background/80 +
 * backdrop-blur reads dark automatically inside the cinema wrapper (the tokens
 * flip, the chrome doesn't care). `skin` threads to the nav for THE PORTAL RULE
 * (see marketing-nav.tsx) — it defaults to paper so the root app/not-found.tsx
 * (which renders this outside any marketing group) needs no knowledge of skins.
 * Height rides --mkt-header-h (marketing.css, the one chrome-height knob that
 * SectionShell/MDX scroll margins share); the 4rem fallback keeps the root 404
 * sane, where marketing.css never loads.
 */
export function MarketingHeader({ skin = "paper" }: { skin?: MarketingSkin }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-[var(--mkt-header-h,4rem)] items-center justify-between gap-4">
        <Link href="/" aria-label="Partyreel home" className="shrink-0">
          <Logo />
        </Link>
        <MarketingNavDesktop className="hidden md:flex" skin={skin} />
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <MarketingNavMobile className="md:hidden" skin={skin} />
        </div>
      </Container>
    </header>
  );
}
