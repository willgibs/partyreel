import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

import { MarketingNavDesktop, MarketingNavMobile } from "./marketing-nav";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Partyreel home" className="shrink-0">
          <Logo />
        </Link>
        <MarketingNavDesktop className="hidden md:flex" />
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
            <Link href="/login">Get started</Link>
          </Button>
          <MarketingNavMobile className="md:hidden" />
        </div>
      </Container>
    </header>
  );
}
