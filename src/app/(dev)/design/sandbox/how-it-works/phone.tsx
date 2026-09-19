"use client";

import Image from "next/image";
import { useState } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { PhoneShell } from "@/components/marketing/frames";
import { SideChip } from "@/components/marketing/sections/how-it-works/side-chip";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  MARKETING_REELS,
  marketingImage,
} from "@/lib/constants/marketing-media";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { SIX_STEPS } from "./content";
import { type PictureTreatment, StepPicture } from "./picture-treatments";
import { Widths } from "./scene";

/**
 * THE PHONE (staged after THE PICTURES, spec.ts): what changes for a guest
 * holding this page. "div" and "frame" are the payoff's own phone object,
 * a quote of reel-payoff.tsx's timeline-strip structure with only the wrapper
 * swapped (its production file is a `reads`, never edited here). "screens" is
 * the bigger swing: the whole spine, below 375, stops stacking and becomes
 * one step per screen, drawn wearing whichever THE PICTURES round already
 * chose (a staged decision's picture lives in the earlier one's world,
 * exploration.ts).
 */
export type PhoneShape = "div" | "frame" | "screens";

const REEL_ID = "hero-candidate-01";

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function PayoffPhone({ framed }: { framed: boolean }) {
  const reel = MARKETING_REELS.find((r) => r.id === REEL_ID)!;
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;
  const player = (
    <div className="relative w-full">
      <InlineReelPlayer
        reelId={REEL_ID}
        sizes="304px"
        className="ring-1 ring-white/10"
      />
      <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] text-white tabular-nums backdrop-blur-sm">
        {formatDuration(reel.durationSeconds)}
      </span>
    </div>
  );
  return (
    <SectionShell
      eyebrow="The payoff"
      heading="And this is how it ends."
      reveal="none"
    >
      <div
        data-hiw-picture
        className="mx-auto mt-12 flex max-w-[19rem] flex-col items-center gap-4"
      >
        {framed ? (
          <PhoneShell screenClassName="bg-transparent p-0">
            {player}
          </PhoneShell>
        ) : (
          player
        )}
        <span className="grid w-full grid-cols-6 gap-1">
          {reel.recipe.clipIds.map((id) => (
            <span
              key={id}
              className="relative block h-8 overflow-hidden rounded-tile ring-1 ring-white/10"
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
        <Caption className="tabular-nums">
          {reel.recipe.clipIds.length} shots · {styleLabel} · tap to play
        </Caption>
        <LearnMoreLink href="#">Everything about the reel</LearnMoreLink>
      </div>
    </SectionShell>
  );
}

/** The bigger swing: one step, one screen, a dot per step. Six steps proves
 *  the concept without needing a polished gesture handler for a still lab
 *  capture; the resting state is step one, the option a phone opens on. */
function ScreensDeck({ treatment }: { treatment: PictureTreatment }) {
  const [active, setActive] = useState(0);
  const step = SIX_STEPS[active];
  return (
    <div className="flex flex-col items-center gap-5 px-5 py-10">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3">
          <Caption className="text-sm tabular-nums">
            {String(active + 1).padStart(2, "0")} / {SIX_STEPS.length}
          </Caption>
          <SideChip>{step.side}</SideChip>
        </div>
        <h3 className="mt-2.5 font-heading text-subsection">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {step.body}
        </p>
        <div data-hiw-picture className="mt-5">
          <StepPicture moment={step.picture} treatment={treatment} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {SIX_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => setActive(i)}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              i === active ? "bg-foreground" : "bg-foreground/25",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Swipe, or tap a dot, to move through the six steps.
      </p>
    </div>
  );
}

function PhonePage({
  shape,
  treatment,
}: {
  shape: PhoneShape;
  treatment: PictureTreatment;
}) {
  if (shape === "screens") {
    return (
      <div className="surface-paper bg-background text-foreground">
        <ScreensDeck treatment={treatment} />
      </div>
    );
  }
  return (
    <div className="dark bg-background text-foreground">
      <PayoffPhone framed={shape === "frame"} />
    </div>
  );
}

// Measured against the real rendered frames: "frame" ran 972 px at 1440
// against a first shared guess of 950 (PROGRAM.md, "measure every tile before
// it ships"). "screens" draws a fundamentally shorter page than "div"/"frame"
// at 1440 (measured 560 px), so it earns its own desktop height rather than
// sharing theirs.
const DESKTOP_H: Record<PhoneShape, number> = {
  div: 950,
  frame: 1050,
  screens: 650,
};

const PHONE_H: Record<PhoneShape, number> = {
  div: 1100,
  frame: 1150,
  screens: 850,
};

const NOTE: Record<PhoneShape, string> = {
  div: "As today: InlineReelPlayer keeps its plain rounded corner.",
  frame: "The same player, inside the site's real phone bezel.",
  screens: "Below 375 the spine stops stacking: one step, one screen.",
};

function pictureShapeOf(v: string | undefined): PictureTreatment {
  return v === "bespoke" || v === "live" ? v : "site";
}

export function phonePreview(shape: PhoneShape) {
  return function PhonePreview(state: BoardState) {
    const treatment = pictureShapeOf(state.pictures);
    return (
      <Widths
        id={`phone-${shape}`}
        ground={shape === "screens" ? "paper" : "cinema"}
        desktopH={DESKTOP_H[shape]}
        phoneH={PHONE_H[shape]}
        note={NOTE[shape]}
        render={() => <PhonePage shape={shape} treatment={treatment} />}
      />
    );
  };
}
