import { Check } from "lucide-react";
import type { CSSProperties } from "react";

import { ReelFrame } from "@/components/marketing/frames";
import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { HIGHLIGHT_REEL } from "@/lib/constants/features";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import {
  resolveStyleEntry,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";

/**
 * The /features reel band (B2): the namesake payoff told in the page's own split
 * idiom, with a REAL engine render looping inside the player frame (ReelFrame's
 * media slot + the ambient poster-first loop; the substrate ruling's honesty
 * argument). Copy comes from HIGHLIGHT_REEL (features.ts, number-free); the
 * counts render HERE from their single sources (STYLE_CATALOG / MAX_REEL_SECONDS)
 * so a catalog or tier change propagates without a copy edit. The deep story
 * (WYSIWYG proof, watermark table, the style wall) belongs to /reel.
 */

const BAND_REEL_ID = "hero-candidate-02";

export function FeaturesReelBand() {
  // Direct manifest lookup (not inline-reel-player's requireReel: that module is
  // "use client", so its plain-function exports can't be called server-side).
  const reel = MARKETING_REELS.find((r) => r.id === BAND_REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${BAND_REEL_ID}`);
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;

  let line = 0;
  const mark = () => ({
    "data-mkt-reveal": "",
    style: { "--i": line++ } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        mediaSide="start"
        media={
          <div>
            <ReelFrame
              media={
                <AmbientReelVideo
                  reel={reel}
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="h-full w-full"
                />
              }
            />
            <MonoCaption className="mt-3 text-center">
              A real render · {styleLabel} style
            </MonoCaption>
          </div>
        }
      >
        <Reveal className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow {...mark()}>{HIGHLIGHT_REEL.eyebrow}</Eyebrow>
            <h2
              {...mark()}
              className="font-heading text-3xl text-balance sm:text-4xl"
            >
              {HIGHLIGHT_REEL.title}.
            </h2>
            <p {...mark()} className="text-pretty text-muted-foreground">
              {HIGHLIGHT_REEL.body}
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHT_REEL.points.map((point) => (
              <li
                key={point}
                {...mark()}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-foreground"
                  strokeWidth={1.5}
                />
                {point}
              </li>
            ))}
          </ul>
          <div {...mark()} className="flex flex-col gap-3">
            <MonoCaption>
              {STYLE_CATALOG.length} styles · {MAX_REEL_SECONDS.free}s free,{" "}
              {MAX_REEL_SECONDS.pro}s on Pro
            </MonoCaption>
            <LearnMoreLink href="/reel">
              See all {STYLE_CATALOG.length} styles
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
