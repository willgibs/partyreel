"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import type { TypeFixture } from "./fixtures";
import { Hero, HeroMedia, type HeroShape } from "./hero";

/**
 * DECISION 7: THE PHONE, staged behind the hero's theme.
 *
 * A "media and motion forward" identity has one hard test, and it is not 1440.
 * At 375 the shipped type page spends its whole first screen on words: the
 * eyebrow, an h1 at the `title` step's phone end, a four-line subhead, two
 * stacked buttons and the demo line. The first photograph is below all of it.
 * Every option here is the SAME theme with the same lockup, and the only thing
 * that moves is where the media sits against the fold.
 *
 * ★ THE FOLD IS DRAWN, and it is the real one: 812 px, an iPhone's viewport
 * with the browser chrome already taken off. The scene's measured caption says
 * how far down the first photograph actually lands, so the claim above each
 * option is checkable against the picture beneath it.
 */
export type PhoneShape = "words" | "media" | "split";

/** The lockup's own copy, laid out for a half screen rather than a page. */
function ShortLockup({
  type,
  onMedia = false,
}: {
  type: TypeFixture;
  onMedia?: boolean;
}) {
  return (
    <Container className="flex flex-col items-center gap-5 py-8 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Events
      </p>
      <h1 className="font-heading text-title text-balance">{type.headline}</h1>
      <p
        className={
          onMedia
            ? "text-lg text-balance text-foreground"
            : "text-lg text-balance text-muted-foreground"
        }
      >
        {type.subhead.split(". ")[0]}.
      </p>
      <div className="mt-1 flex w-full flex-col items-center gap-3">
        <Button asChild size="cta" className="w-full">
          <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
        </Button>
        <DemoCtaLink />
      </div>
    </Container>
  );
}

export function PhonePreview({
  shape,
  heroShape,
  type,
}: {
  shape: PhoneShape;
  heroShape: HeroShape;
  type: TypeFixture;
}): ReactNode {
  // Today's arrangement, drawn by the real hero at 375: the whole lockup, then
  // the media under it.
  if (shape === "words") return <Hero shape={heroShape} type={type} />;

  // The media takes the screen and the words stand on it. The plate is the
  // ruled treatment for copy over a photograph (`legibility=plate`), and at 375
  // it goes edge to edge by the sheet's own rule. `fill` is what lets the three
  // object themes be a ground here rather than a small thing near the top.
  if (shape === "media")
    return (
      <div className="relative min-h-[812px]">
        <HeroMedia
          shape={heroShape}
          type={type}
          fill
          className="absolute inset-x-0 top-0 h-[812px]"
        />
        <div className="bkd relative">
          <div className="bkd-content">
            <div className="bkd-plate py-2">
              <ShortLockup type={type} onMedia />
            </div>
          </div>
        </div>
      </div>
    );

  // Half and half: the words in the top of the screen, the media locked to the
  // bottom of it, so a reader meets both before scrolling and neither is small.
  return (
    <div className="flex min-h-[812px] flex-col">
      <div className="pt-6">
        <ShortLockup type={type} />
      </div>
      <div className="mt-auto pb-8">
        <HeroMedia shape={heroShape} type={type} />
      </div>
    </div>
  );
}
