"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";

import { CANVAS, type Mode } from "@/components/lab";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import type { ConceptId } from "./concepts";
import { AccessConcept, ApertureConcept, SealConcept } from "./concepts-layer";

/**
 * THE PRIVACY PAGE'S FIRST SCREEN, ROUND THREE: A NEW BACKDROP, THE SAME
 * REAL LOCKUP (2026-09-19).
 *
 * ★ THE LIVE LOCKUP, NOT A DRAWING OF ONE, UNCHANGED FROM ROUND TWO. `PageHero`
 * at scale `lg` with the page's own eyebrow, headline, sentence and actions,
 * pulled up under the transparent header exactly as it ships. Only the
 * `backdrop` slot changes this round: round two's image-trail engine is gone
 * (`TrailLayer`, `paths.ts`, deleted), replaced by one of three still, or
 * nearly still, concepts (`concepts-layer.tsx`).
 *
 * ★ THE PAGE'S RESTRAINT IS OVERTURNED FOR ITS HERO, AND ONLY THERE (carried
 * from round two). The page shipped as the site's quietest, "no stage and no
 * lamp" in its hero, and the curation and privacy pages carry no LAMP on
 * purpose (`docs/systems/design-system.md`, "restraint is their identity").
 * None of the three concepts here is a lamp (no colour, no Aurora): the
 * chrome stays achromatic and the photographs are still the only colour
 * (bible 1), so the restraint holds even while the hero earns its place.
 */
export type HeroSpec = { mode: Mode; concept: ConceptId };

const BACKDROP: Record<ConceptId, (mode: Mode) => ReactNode> = {
  aperture: (mode) => <ApertureConcept mode={mode} />,
  access: (mode) => <AccessConcept mode={mode} />,
  seal: (mode) => <SealConcept mode={mode} />,
};

export function PrivacyHero({ spec }: { spec: HeroSpec }) {
  const page = featurePage("privacy");
  const { mode, concept } = spec;

  return (
    <div
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      // A press inside a preview is looking, not leaving.
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
      style={{ height: CANVAS[mode].h } as CSSProperties}
    >
      <MarketingHeader skin="cinema" overlay />
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={page.h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/features/curation">How curation works</Link>
            </Button>
          </>
        }
        backdrop={BACKDROP[concept](mode)}
        className="relative -mt-[var(--mkt-header-h,4rem)] flex flex-1 flex-col justify-center overflow-clip pt-[var(--mkt-header-h,4rem)]"
      />
    </div>
  );
}
