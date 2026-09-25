"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import {
  CARD_COPY_SCRIM,
  FeatureDoor,
} from "@/components/marketing/sections/features/shared/feature-door";
import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import {
  formatReelSeconds,
  HERO_REEL,
} from "@/components/marketing/sections/reel/style-facets";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

import { ArrivalChip, BarChip } from "./parts";
import { CinemaRoom, linesLabel, linesOf, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * THE REEL'S CARD, IN THE THREE PLACES ITS LINE LIVES.
 *
 * Production feeds the hub's reel door, the related row's reel door and the
 * /reel hero from one constant (`GOLDEN_LINES.reelThesis`, with a second,
 * longer line on the hub). Round two draws the card as its own string and, as
 * the brief's ground, the /reel hero heading takes it: so every option is drawn
 * three times, in the order a reader meets it. The hub's lead door, the room it
 * opens (the /reel hero, heading only changed), and the same door in
 * /features/sharing's related row beside the album's and privacy's real doors,
 * where its chip stands next to the album's live dot.
 *
 * ★ THE DOOR IS REDRAWN ON `feature-door.tsx`'s OWN PIECES (its classes, its
 * exported `CARD_COPY_SCRIM`, the poster it shows), because `doorFor("reel")`
 * takes no line from outside; the two neighbours are the shipped `FeatureDoor`
 * itself. The hero is `reel-hero.tsx`'s markup with the heading as a prop, the
 * shipped loop and caption beside it.
 */

export type CardId = "as-it-happens" | "cut-together" | "joins";

type CardWords = { line: string; chip: ReactNode };

export const CARD_WORDS: Record<CardId, CardWords> = {
  "as-it-happens": {
    line: "Your event, playing as it happens.",
    chip: <BarChip />,
  },
  "cut-together": {
    line: "Everyone's photos, cut together live.",
    chip: <BarChip />,
  },
  joins: {
    line: "Every new photo joins it in seconds.",
    // The line is the arrival, so the chip is the arrival beat the view
    // really draws (`arrivalLabel`: a name and the count behind it).
    chip: <ArrivalChip name="Theo Calder" extra={2} />,
  },
};

/** The reel poster the shipped door shows: the landscape render (feature-door.tsx). */
const DOOR_POSTER = MARKETING_REELS.find((r) => r.id === "hero-candidate-02")!;

function ReelDoor({
  aspect,
  line,
  chip,
}: {
  aspect: "wide" | "portrait";
  line: string;
  chip: ReactNode;
}) {
  const wide = aspect === "wide";
  return (
    <div className="h-full">
      <Link
        href="/reel"
        className={cn(
          "mkt-learn group relative block overflow-hidden rounded-xl bg-muted",
          wide ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-4/5",
          "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
          "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        )}
      >
        <Image
          src={DOOR_POSTER.poster}
          alt=""
          fill
          sizes={wide ? "1024px" : "340px"}
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={CARD_COPY_SCRIM}
        />
        <span aria-hidden className="absolute top-3 left-3">
          {chip}
        </span>
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5",
            wide && "sm:max-w-xl sm:p-7",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-1.5 font-heading text-white",
              wide ? "text-subhead" : "text-subsection",
            )}
          >
            The highlight reel
            <LearnChevron />
          </span>
          <span
            data-card-line
            className={cn(
              "text-sm leading-relaxed text-balance text-white/70",
              wide ? "max-w-lg" : "max-w-[84%]",
            )}
          >
            {line}
          </span>
        </span>
      </Link>
    </div>
  );
}

/**
 * The /reel hero, verbatim but for the heading (and a subhead stand-in: the
 * shipped one describes the stored render the reel-sweep lane retells, so it
 * is judged here for its size, never its words).
 */
function ReelHeroDrawn({ line }: { line: string }) {
  return (
    <section className="overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-5 lg:col-span-7">
            <Eyebrow>The highlight reel</Eyebrow>
            <h1 data-hero-line className="font-heading text-title text-balance">
              {line}
            </h1>
            <p className="max-w-xl text-copy text-pretty text-muted-foreground">
              Made from every photo and video your guests add, with nothing to
              render or wait for. Anyone can switch its look, or make a clip of
              their own.
            </p>
            <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
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
                sizes="320px"
                className="rounded-2xl border bg-black ring-1 ring-foreground/5"
              />
              <Caption className="mt-3 text-center tabular-nums">
                A real Partyreel reel ·{" "}
                {formatReelSeconds(HERO_REEL.durationSeconds)}
              </Caption>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Place({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-dashed border-white/15 px-4 py-2 sm:px-8">
      <Caption>{children}</Caption>
    </div>
  );
}

export function CardDrawing({ id, screen }: { id: CardId; screen: ScreenId }) {
  const words = CARD_WORDS[id];
  const phone = screen === "375";
  return (
    <CinemaRoom>
      <div onClickCapture={stopLinks}>
        <Place>/features, the hub&rsquo;s lead door</Place>
        <SectionShell reveal="none" className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <ReelDoor aspect="wide" line={words.line} chip={words.chip} />
          </div>
        </SectionShell>
        <Place>/reel, the room the door opens</Place>
        <ReelHeroDrawn line={words.line} />
        <Place>/features/sharing, the related row</Place>
        <SectionShell reveal="none" className="py-10 sm:py-14">
          <div
            className={cn(
              "mx-auto grid max-w-5xl gap-4",
              phone ? "max-w-sm" : "sm:grid-cols-3",
            )}
          >
            {!phone && <FeatureDoor slug="album" aspect="portrait" />}
            {!phone && <FeatureDoor slug="privacy" aspect="portrait" />}
            <ReelDoor aspect="portrait" line={words.line} chip={words.chip} />
          </div>
        </SectionShell>
      </div>
    </CinemaRoom>
  );
}

export function cardPreview(s: BoardState, id: CardId) {
  const screen = screenOf(s.screen);
  return (
    <Scene
      id={`card-${id}`}
      screen={screen}
      title="The reel's card and the room it opens"
      measure={(root, win) => {
        const lines = [...root.querySelectorAll("[data-card-line]")];
        const hero = root.querySelector("[data-hero-line]");
        if (lines.length < 2 || !hero) return null;
        return `The hub's door takes ${linesLabel(linesOf(lines[0], win))}, the /reel heading ${linesLabel(linesOf(hero, win))}, the related row's door ${linesLabel(linesOf(lines[1], win))}.`;
      }}
    >
      <CardDrawing id={id} screen={screen} />
    </Scene>
  );
}
