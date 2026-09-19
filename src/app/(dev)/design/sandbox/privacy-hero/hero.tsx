"use client";

import Link from "next/link";
import { type CSSProperties, useMemo } from "react";

import { CANVAS, type Mode } from "@/components/lab";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { TrailLayer } from "@/components/shared/trail/trail";
import { type HeroSpec, pathsOf, specOf, stillAt } from "./paths";

/**
 * THE PRIVACY PAGE'S FIRST SCREEN, WITH THE TRAIL BEHIND ITS WORDS.
 *
 * ★ THE LIVE LOCKUP, NOT A DRAWING OF ONE. `PageHero` at scale `lg` (the `title`
 * step: 34 at a phone, 80 at 1440, `headline=lg` as ruled) with the page's own
 * eyebrow, headline, sentence and actions: judged for size and wrapping, never
 * for its words. The trail rides the hero's `backdrop` slot, which is exactly
 * what it exists for, and the section is pulled up under the transparent header
 * like the careers hero, so the photographs run beneath the bar as they do on
 * the home page.
 *
 * ★ THE PAGE'S RESTRAINT IS OVERTURNED FOR ITS HERO, AND ONLY THERE. The page
 * shipped as the site's quietest, "no stage and no lamp" in its hero; Will's
 * note gives the hero the field (docs/design/rulings.md, 2026-09-18). The paper
 * chapter under it is untouched, so the page is loud for one screen and a
 * document after it.
 *
 * ★ ONE SCREEN, THE LOCKUP IN THE MIDDLE OF WHAT IS LEFT UNDER THE BAR. The
 * section is the canvas tall, the header's height is padded back, and the block
 * is centred in the rest, which is the centre the paths are solved around
 * (`CENTRE_Y`).
 *
 * ★ `drive="path"`, NEVER THE POINTER. This is a hero, not a toy: the two arms
 * walk their own figure whether or not anybody's cursor is on the page. The
 * cursor-driven half of the same engine is the `image-trail` board's question.
 */
export function PrivacyHero({ spec }: { spec: HeroSpec }) {
  const page = featurePage("privacy");
  const mode: Mode = spec.mode;
  const trail = useMemo(() => specOf(spec), [spec]);
  const paths = useMemo(() => pathsOf(spec), [spec]);
  const at = useMemo(() => stillAt(spec), [spec]);

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
        backdrop={
          <TrailLayer
            spec={trail}
            source={{ paths, drive: "path", stillAt: at }}
          />
        }
        className="relative -mt-[var(--mkt-header-h,4rem)] flex flex-1 flex-col justify-center overflow-clip pt-[var(--mkt-header-h,4rem)]"
      />
    </div>
  );
}
