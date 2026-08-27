import Image from "next/image";
import type { CSSProperties } from "react";

import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  MARKETING_REELS,
  marketingImage,
} from "@/lib/constants/marketing-media";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";

/**
 * The dark payoff beat after the paper spine: the walkthrough's step six made
 * real. Lights down (the chapter cut back to cinema), one poster-first sample
 * render, one door to /reel. Poster-first means zero video bytes until the
 * visitor asks (the InlineReelPlayer contract).
 *
 * R4 fix (B25): this used to be a wide, static rave frame with a play button —
 * it walked away from the wedding the whole page follows, and nothing about it
 * said MONTAGE. It now plays the wedding-family render, phone-shaped the way a
 * reel actually leaves an event, and shows its own ingredients: the real shot
 * count, the real style, the real runtime, and the actual clips the engine cut
 * together. Every number is derived from the render recipe, so a media swap
 * can never strand a stale claim. The poster keeps its honest partyreel.com
 * mark (that IS what a free render looks like; we never fake an unmarked one).
 */

const REEL_ID = "hero-candidate-01";

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function ReelPayoff() {
  const reel = MARKETING_REELS.find((r) => r.id === REEL_ID);
  if (!reel) throw new Error(`Unknown marketing reel id: ${REEL_ID}`);
  const shots = reel.recipe.clipIds.length;
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;

  return (
    <SectionShell
      eyebrow="The payoff"
      heading="And this is how it ends."
      subhead="A real render from the reel engine, built the same way your event's will be."
      reveal="cinema"
    >
      {/* The body cuts in after the header's three lines (0-2), same cinema
          register: the reel lands on a hard cut, then its own timeline. Phone
          shaped, because that is the shape a reel leaves an event in. */}
      <Reveal className="mx-auto mt-12 flex max-w-[19rem] flex-col items-center gap-4">
        <div
          data-mkt-cut
          className="relative w-full"
          style={{ "--i": 3 } as CSSProperties}
        >
          <InlineReelPlayer
            reelId={REEL_ID}
            sizes="(min-width: 640px) 304px, 80vw"
            className="ring-1 ring-white/10"
          />
          {/* Top corner, deliberately: the render's own partyreel.com mark
              lives bottom-right and nothing may sit on top of it. */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-2.5 right-2.5 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[11px] text-white tabular-nums backdrop-blur-sm"
          >
            {formatDuration(reel.durationSeconds)}
          </span>
        </div>

        {/* The reel's own timeline: the exact clips the engine cut together,
            in order. A still frame with a play button never said MONTAGE;
            six frames in a row do. */}
        <span
          aria-hidden
          data-mkt-cut
          className="grid w-full grid-cols-6 gap-1"
          style={{ "--i": 4 } as CSSProperties}
        >
          {reel.recipe.clipIds.map((id) => (
            <span
              key={id}
              className="relative block h-8 overflow-hidden rounded-[3px] ring-1 ring-white/10"
            >
              <Image
                src={marketingImage(id).src}
                alt=""
                fill
                sizes="52px"
                className="object-cover opacity-85"
              />
            </span>
          ))}
        </span>

        <MonoCaption data-mkt-cut style={{ "--i": 4 } as CSSProperties}>
          {shots} shots · {styleLabel} · tap to play
        </MonoCaption>
        <div data-mkt-cut style={{ "--i": 4 } as CSSProperties}>
          <LearnMoreLink href="/reel">Everything about the reel</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
