"use client";

import Link from "next/link";
import { type CSSProperties, useRef } from "react";

import type { Mode } from "@/components/lab";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import type { Solved } from "../privacy-hero/field";
import { FieldLayer } from "../privacy-hero/field-layer";
import { useFrameFilter } from "./frame-filter";
import type { Room } from "./margins";
import { type AlbumLight, AlbumStage, type Visual } from "./visual";

/**
 * THE ALBUM PAGE'S HERO, ROUND FOUR: the live lockup, the album under it, and
 * a subtle motion in the empty space around the words (the heroes lane,
 * 2026-09-18).
 *
 * Will, asked what the hero becomes: "Let's do a round 4, home hero pace. I
 * know you recommended the no composition, and I'd guess it's because the
 * album below already serves as a visual for the hero and pairing it with a
 * loud animation ... may feel overwhelming. I agree, but feel the area above
 * and to the sides of the H1 lockup will feel too empty with just the album
 * beneath. Maybe we can use a more subtle animation in some of the empty space
 * to help the hero feel more alive & full."
 *
 * ★ THE LIVE LOCKUP, ONE BLOCK. `PageHero` at `lg` (the `title` step, 34 at a
 * phone and 80 at 1440, `headline=lg` as ruled) with the page's own words
 * (`copy=page`), judged for size and wrapping. The motion rides the hero's
 * `backdrop` slot and the album its `children` stage, which are exactly the two
 * places the component offers for a picture; the section runs under the
 * transparent header like the careers hero, so the top of the screen is space
 * the motion may use.
 *
 * ★ THE MOTION IS BEHIND THE ALBUM. The backdrop paints under the page's
 * container, so a photograph that reaches the album's frame slides BEHIND it
 * and is gone: the album takes it in, which is the one thing a motion here has
 * to say.
 *
 * ★ ITS OWN COPY OF THE LAMPS' FIELD. The frame's document has no root layout,
 * so the turbulence field every lamp reads is cloned into it (`useFrameFilter`);
 * without it a lamp renders as hard-edged blobs (glow.tsx's tripwire says why).
 */

export function AlbumHero({
  mode,
  visual,
  light,
  motion,
  room,
  height,
}: {
  mode: Mode;
  visual: Visual;
  light: AlbumLight;
  motion: Solved | null;
  room: Room;
  /** The hero's own height, so the backdrop's canvas is the composition's. */
  height: number;
}) {
  const page = featurePage("album");
  const root = useRef<HTMLDivElement | null>(null);
  useFrameFilter(root);
  return (
    <div
      ref={root}
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      // A press inside a preview is looking, not leaving.
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
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
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </>
        }
        backdrop={motion ? <FieldLayer field={motion} /> : null}
        className="relative -mt-[var(--mkt-header-h,4rem)] overflow-clip"
        style={
          {
            height,
            paddingTop: `calc(var(--mkt-header-h, 4rem) + ${room.top}px)`,
          } as CSSProperties
        }
      >
        <div style={{ marginTop: room.gap }}>
          <AlbumStage mode={mode} visual={visual} light={light} />
        </div>
      </PageHero>
    </div>
  );
}
