import Link from "next/link";
import type { CSSProperties } from "react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";

import { AmbientReelVideo } from "./ambient-reel-video";
import { HERO_REEL } from "./style-facets";

/**
 * /reel section 1 — the reel hero (LOUD). Will's 2026-08-25 ruling: this H1 is DISTINCT
 * from the home reel-SECTION header; the hero carries the big golden line (reelThesis).
 * ★ THE H1 WAITS FOR `reel-story` ROUND 2 (its `card` ask gives the hub's reel card its own
 * line and, as ground, this heading takes it), so it stays as it is even where it is stale;
 * the subhead under it already tells the live reel. A REAL engine-rendered loop plays
 * poster-first beside it: the honesty argument from the T2.5 substrate ruling made visible
 * in the first viewport, captioned as the recording it is (the live reel never ends, so no
 * duration).
 *
 * Register: the TEXT lines ride the cinema cut (data-mkt-cut inside Reveal, the
 * SectionShell "cinema" grammar hand-marked because the hero is a split layout, not a
 * centered header). The MEDIA column deliberately carries NO reveal mark: the poster is
 * the LCP element and must paint immediately, never behind an in-view gate.
 */
export function ReelHero() {
  // The stagger slot per line (marketing.css multiplies --i by the cut delay).
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <section className="overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-24">
      <Container>
        <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-5 lg:col-span-7">
            <Eyebrow {...cut(0)}>The highlight reel</Eyebrow>
            {/* The H1 never carries a reveal-hidden state (the LCP rule,
                pinned by marketing-h1-policy.test.ts); the slots around it
                do the arriving. */}
            <h1 className="font-heading text-title text-balance">
              {GOLDEN_LINES.reelThesis}.
            </h1>
            <p
              {...cut(2)}
              className="max-w-xl text-copy text-pretty text-muted-foreground"
            >
              {
                "Your guests are already capturing the best of it. The album plays it all back as a reel from the second photo, and nobody has to edit a thing."
              }
            </p>
            <div
              {...cut(3)}
              className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <Button asChild size="cta">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <DemoCtaLink />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px]">
              <AmbientReelVideo
                reel={HERO_REEL}
                preloadPoster
                sizes="320px"
                className="rounded-2xl border bg-black ring-1 ring-foreground/5"
              />
              <Caption className="mt-3 text-center">
                Recorded from the reel&rsquo;s own engine
              </Caption>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
