"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import { HERO_REEL } from "@/components/marketing/sections/reel/style-facets";
import { Caption } from "@/components/marketing/system/caption";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

/**
 * THE /reel HERO, `reel-hero.tsx`'s markup with two slots: its heading (the
 * `line` ask draws each line there) and the demo line beside the button (the
 * `beside` ask draws each mark there). Everything else is the page as it
 * ships, the engine's own loop beside it; the cinema cut is dropped because
 * the frame is judged at rest.
 */
export function ReelHeroDrawn({
  heading,
  demo,
}: {
  heading: string;
  demo: ReactNode;
}) {
  return (
    <section className="overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-5 lg:col-span-7">
            <Eyebrow>The highlight reel</Eyebrow>
            <h1 data-hero-line className="font-heading text-title text-balance">
              {heading}
            </h1>
            <p className="max-w-xl text-copy text-pretty text-muted-foreground">
              Your guests are already capturing the best of it. The album plays
              it all back as a reel from the second photo, and nobody has to
              edit a thing.
            </p>
            <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button asChild size="cta">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              {demo}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px]">
              <AmbientReelVideo
                reel={HERO_REEL}
                sizes="320px"
                className="rounded-2xl border bg-black ring-1 ring-foreground/5"
              />
              <Caption className="mt-3 text-center">
                Recorded from the reel&rsquo;s own engine
              </Caption>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
