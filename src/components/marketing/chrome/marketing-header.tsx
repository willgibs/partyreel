import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";

import { HeaderShell } from "./header-shell";
import { MarketingNavDesktop, type MarketingSkin } from "./marketing-nav";
import { MarketingNavMobile } from "./mobile-menu";
import { HeaderActions } from "./session-hint";

/**
 * The marketing header (Track B chrome). `skin` threads to the nav for THE
 * PORTAL RULE (see mobile-menu.tsx) — it defaults to paper so the root
 * app/not-found.tsx (which renders this outside any marketing group) needs no
 * knowledge of skins. `overlay` (cinema pages) starts the header TRANSPARENT
 * over the hero's media wall and CROSSFADES to glass on scroll via HeaderShell
 * (an inert layer, never a filter on the bar itself — see its header note);
 * the solid variant is the classic always-glass sticky bar, and both now LEAVE
 * while the reader is scrolling away and come back the moment the scroll
 * reverses (header-shell.tsx says how, and why the height knob is untouched).
 * Height rides --mkt-header-h (marketing.css, the one chrome-height knob that
 * SectionShell/MDX scroll margins share); the 4rem fallback keeps the root 404
 * sane, where marketing.css never loads.
 *
 * This file stays a SERVER component: the only personal thing in the bar is
 * the right cluster, and that is one client island (session-hint.tsx) rather
 * than a "use client" boundary around the whole header, so the logo, the
 * panels' content and ~50 prerendered routes keep shipping as they are.
 */
export function MarketingHeader({
  skin = "paper",
  overlay = false,
}: {
  skin?: MarketingSkin;
  overlay?: boolean;
}) {
  return (
    <HeaderShell overlay={overlay}>
      <Container className="flex h-[var(--mkt-header-h,4rem)] items-center justify-between gap-4">
        <Link href="/" aria-label="Partyreel home" className="shrink-0">
          <Logo />
        </Link>
        {/* Desktop panels render in-flow (no skin prop needed since the
            NavigationMenu flip); the mobile menu still portals and threads
            `skin` for THE PORTAL RULE. */}
        <MarketingNavDesktop className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <HeaderActions />
          <MarketingNavMobile className="md:hidden" skin={skin} />
        </div>
      </Container>
    </HeaderShell>
  );
}
