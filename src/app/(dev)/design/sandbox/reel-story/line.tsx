"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import {
  CARD_COPY_SCRIM,
  FeatureDoor,
} from "@/components/marketing/sections/features/shared/feature-door";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { DemoLine } from "./beside";
import { BarChip } from "./parts";
import { ReelHeroDrawn } from "./reel-hero";
import { CinemaRoom, linesLabel, linesOf, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * THE REEL'S LINE, IN THE THREE PLACES IT LIVES.
 *
 * One string at both door sizes and as the /reel heading (round two's carried
 * call, which the wiring round is landing with "Your event, playing as it
 * happens."), so every option is drawn three times, in the order a reader
 * meets it: the hub's lead door, the room it opens (the /reel hero, the
 * heading the only change) and the same door in /features/sharing's related
 * row beside the album's and privacy's real doors.
 *
 * ★ HIS NOTE IS THE BRIEF: "The 'everyone's photos... live' and 'every new
 * photo joins' from the other options also added value beyond this version's
 * 'Your event', which is less clear." So the three new lines each carry what
 * those two said, whose photos and that it grows, and are graded against the
 * working line rather than against each other.
 *
 * ★ THE DOOR IS REDRAWN ON `feature-door.tsx`'s OWN PIECES (its classes, its
 * exported `CARD_COPY_SCRIM`, the poster it shows), because `doorFor("reel")`
 * takes no line from outside; its chip is the view's resting bar, as the
 * wiring round draws it. The neighbours are the shipped `FeatureDoor` itself.
 * The hero is `reel-hero.tsx`'s markup with the heading as a slot.
 */

export type LineId =
  | "as-it-happens"
  | "as-they-land"
  | "new-photo"
  | "two-beats";

/**
 * ★ THE HEADING'S LINE COUNT IS PART OF EACH LINE (measured on the frame,
 * 2026-09-27). At 1440 the /reel heading holds about 38 characters in two
 * lines; "Everyone's photos, playing as they land." and "Every photo your
 * guests add, playing live." both took a third, so the round draws the
 * synthesis at the working line's own length and keeps one longer line, the
 * two beats, for the one that is worth a third line if any is.
 */
export const LINES: Record<LineId, string> = {
  "as-it-happens": "Your event, playing as it happens.",
  "as-they-land": "Everyone's photos, live as they land.",
  "new-photo": "Every new photo plays as it lands.",
  "two-beats": "Everyone's photos, live. Every new one joins.",
};

/** The reel poster the shipped door shows: the landscape render. */
const DOOR_POSTER = MARKETING_REELS.find((r) => r.id === "hero-candidate-02")!;

function ReelDoor({
  aspect,
  line,
}: {
  aspect: "wide" | "portrait";
  line: string;
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
          <BarChip />
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

function Place({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-dashed border-white/15 px-4 py-2 sm:px-8">
      <Caption>{children}</Caption>
    </div>
  );
}

function LineDrawing({ id, screen }: { id: LineId; screen: ScreenId }) {
  const line = LINES[id];
  const phone = screen === "375";
  return (
    <CinemaRoom>
      <div onClickCapture={stopLinks}>
        <Place>/features, the hub&rsquo;s lead door</Place>
        <SectionShell reveal="none" className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <ReelDoor aspect="wide" line={line} />
          </div>
        </SectionShell>
        <Place>/reel, the room the door opens</Place>
        <ReelHeroDrawn heading={line} demo={<DemoLine mark="none" />} />
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
            <ReelDoor aspect="portrait" line={line} />
          </div>
        </SectionShell>
      </div>
    </CinemaRoom>
  );
}

export function linePreview(s: BoardState, id: LineId) {
  const screen = screenOf(s.screen);
  return (
    <Scene
      id={`line-${id}`}
      screen={screen}
      title="The reel's door and the room it opens"
      measure={(root, win) => {
        const lines = [...root.querySelectorAll("[data-card-line]")];
        const hero = root.querySelector("[data-hero-line]");
        if (lines.length < 2 || !hero) return null;
        return `The hub's door takes ${linesLabel(linesOf(lines[0], win))}, the /reel heading ${linesLabel(linesOf(hero, win))}, the related row's door ${linesLabel(linesOf(lines[1], win))}.`;
      }}
    >
      <LineDrawing id={id} screen={screen} />
    </Scene>
  );
}
