import type { CSSProperties } from "react";

import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import {
  resolveStyleEntry,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";

/**
 * The reel angle: the site thesis in the type's own words ("Every wedding ends
 * with a reel.") over the single-sourced hook, routing the reader to /reel.
 *
 * A29: the line used to stand over ~230px of empty black. A section that
 * promises a reel and then shows nothing is the weakest kind of close, so the
 * payoff now PLAYS here — the same poster-first player the home teaser uses, in
 * the portrait shape the flagship treats as the reel's canonical frame. Poster
 * only until tapped (zero video bytes without intent), ambient-pause gated, and
 * reduced-motion safe by the player's own contract.
 *
 * The loop is the manifest's real render, so it is LABELLED as one rather than
 * dressed up as this vertical's own reel (a per-vertical loop needs new media,
 * which the manifest gate owns). Counts render from STYLE_CATALOG /
 * MAX_REEL_SECONDS, never inline numbers.
 */

const BAND_REEL_ID = "hero-candidate-01";

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function ReelAngleBand({
  singular,
  angle,
}: {
  /** The event noun in the headline slot ("wedding", "trip", "event"). */
  singular: string;
  angle: string;
}) {
  const reel = MARKETING_REELS.find((r) => r.id === BAND_REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${BAND_REEL_ID}`);
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;

  return (
    <SectionShell
      width="narrow"
      eyebrow="The highlight reel"
      heading={`Every ${singular} ends with a reel.`}
      subhead={angle}
    >
      {/* The body continues the header's stagger slots (SectionShell spends 0,
          1, 2 on eyebrow + heading + subhead), so the line and the reel it
          promises arrive as one move. */}
      <Reveal>
        <div
          data-mkt-reveal
          style={{ "--i": 3 } as CSSProperties}
          className="mx-auto mt-10 w-full max-w-[260px] sm:max-w-[300px]"
        >
          <InlineReelPlayer reelId={BAND_REEL_ID} sizes="300px" />
          <Caption className="mt-3 text-center tabular-nums">
            A real render · {styleLabel} ·{" "}
            {formatDuration(reel.durationSeconds)}
          </Caption>
        </div>

        <div
          data-mkt-reveal
          style={{ "--i": 4 } as CSSProperties}
          className="mt-8 flex flex-col items-center gap-3 text-center"
        >
          <Caption className="tabular-nums">
            {STYLE_CATALOG.length} styles · {MAX_REEL_SECONDS.free}s free,{" "}
            {MAX_REEL_SECONDS.pro}s on Pro
          </Caption>
          <LearnMoreLink href="/reel">
            See all {STYLE_CATALOG.length} styles
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
