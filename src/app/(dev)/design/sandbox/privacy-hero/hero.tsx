"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { CANVAS, type Mode } from "@/components/lab";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import type { VeilId } from "./veils";
import { VEIL_LAYER } from "./veil-layers";

/**
 * THE PRIVACY PAGE'S FIRST SCREEN, ROUND FOUR: A VEIL BEHIND THE REAL LOCKUP
 * (2026-09-29).
 *
 * ★ THE LIVE LOCKUP, NOT A DRAWING OF ONE. `PageHero` at scale `lg` with the
 * page's own eyebrow, headline, sentence and actions (the actions at `cta`,
 * as `features/privacy/page.tsx` ships them), pulled up under the
 * transparent header. Only the `backdrop` slot changes between options.
 *
 * ★ THE HEADER IS PINNED AS THE TOP OF THE PAGE DRAWS IT (hero-card's pin,
 * the kit's open ROADMAP line). The real header reads the LAB page's scroll,
 * so a reader who scrolled down to these frames met every first screen with
 * no header, or with its glass fading in; the scoped rule below undoes both
 * inside this scene and nowhere else, so the veil is judged under the nav it
 * will actually sit under.
 *
 * ★ THE PAGE'S RESTRAINT IS OVERTURNED FOR ITS HERO, AND ONLY THERE (carried
 * from rounds two and three). The page shipped as the site's quietest, "no
 * stage and no lamp"; none of the veils is a lamp (no colour but the
 * photographs', bible 6), so the chrome stays achromatic while the hero earns
 * its place.
 */
/** The screen, the veil, and the still under it (a media-manifest id). */
export type HeroSpec = { mode: Mode; veil: VeilId; photo: string };

const PIN =
  "[data-pvh-scene] header[data-hidden]{translate:none!important}[data-pvh-scene] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}";

export function PrivacyHero({ spec }: { spec: HeroSpec }) {
  const page = featurePage("privacy");
  const { mode, veil, photo } = spec;

  return (
    <div
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      data-pvh-scene=""
      // A press inside a preview is looking, not leaving.
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
      style={{ height: CANVAS[mode].h } as CSSProperties}
    >
      <style>{PIN}</style>
      <MarketingHeader skin="cinema" overlay />
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={page.h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button asChild size="cta">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/features/curation">How curation works</Link>
            </Button>
          </>
        }
        backdrop={VEIL_LAYER[veil]({ mode, photo })}
        className="relative -mt-[var(--mkt-header-h,4rem)] flex flex-1 flex-col justify-center overflow-clip pt-[var(--mkt-header-h,4rem)]"
      />
    </div>
  );
}
