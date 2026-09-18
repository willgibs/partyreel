"use client";

import { useCallback, useMemo, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { TrailPause } from "../image-trail/trail-layer";
import { PrivacyHero } from "./hero";
import {
  type Arms,
  CANVAS,
  facts,
  type Gap,
  type HeroSpec,
  type Mode,
  type Pace,
  type PathId,
  type Trail,
} from "./paths";
import { PRIVACY_HERO } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the privacy page's first screen
 * at 1440 and again at 375, in real viewports.
 *
 * ★ A FRAME, BECAUSE THE HEADLINE IS A `vw` CLAMP. `text-title` reads the
 * BROWSER's width, so a 375 div on a wide page would draw the 1440 headline and
 * every keep-out the paths are solved around would be wrong. `Frame` portals the
 * composition into a same-origin iframe, the only real viewport the lab has, so
 * the lockup wraps exactly as it will on a phone.
 *
 * ★ A STAGED DECISION WEARS WHAT IT WAITS ON. Every preview is a function of the
 * board's state: the figure is drawn at the pace he picked, the gap at both, the
 * trail at all three (`Preview`, exploration.ts).
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT. The step hides the options it is not
 * showing with `data-paused`, which lives in THIS document; the trail runs inside
 * the frame's, so the host reads its own ancestors and hands the answer down
 * (`TrailPause`).
 */

const look = (s: BoardState, mode: Mode): HeroSpec => ({
  mode,
  pace: (s.pace ?? "over") as Pace,
  path: (s.path ?? "spiral") as PathId,
  gap: (s.gap ?? "tight") as Gap,
  trail: (s.trail ?? "linger") as Trail,
  arms: (s.phone ?? "strips") as Arms,
});

/** The numbers under each screen, measured off the engine it draws, with the
 *  shipped home hero's beside them. */
function captionFor(spec: HeroSpec) {
  const f = facts(spec);
  return `${f.lit} lit at the busiest instant (the home hero: ${f.home.lit}) · a photograph every ${f.armBeat} ms on each arm (home: a pair every ${f.home.beat}) · ${f.gap} px apart · the point at ${f.speed} px a second · ${(f.life / 1000).toFixed(1)} s each · ${f.nodes} nodes`;
}

function Screens({
  s,
  phoneOnly = false,
}: {
  s: BoardState;
  phoneOnly?: boolean;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const isPaused = useCallback(
    () =>
      document.hidden || Boolean(host.current?.closest('[data-paused="true"]')),
    [],
  );
  const desk = useMemo(() => look(s, "desktop"), [s]);
  const phone = useMemo(() => look(s, "phone"), [s]);
  const id = `${desk.pace}-${desk.path}-${desk.gap}-${desk.trail}-${desk.arms}`;

  return (
    <TrailPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {!phoneOnly && (
          <Frame
            id={`pvh-desk-${id}`}
            w={CANVAS.desktop.w}
            h={CANVAS.desktop.h}
            title="1440"
            caption={captionFor(desk)}
          >
            <PrivacyHero spec={desk} />
          </Frame>
        )}
        <Frame
          id={`pvh-phone-${id}`}
          w={CANVAS.phone.w}
          h={CANVAS.phone.h}
          title="375"
          caption={captionFor(phone)}
        >
          <PrivacyHero spec={phone} />
        </Frame>
      </div>
    </TrailPause.Provider>
  );
}

/** One option's picture: the board's state with this option worn. `BoardState`
 *  is a record of required strings, so the patch is spelled as one too. */
const at = (s: BoardState, over: Record<string, string>) => (
  <Screens s={{ ...s, ...over }} />
);

const PREVIEWS: PreviewsFor<typeof PRIVACY_HERO> = {
  "pace.over": (s) => at(s, { pace: "over" }),
  "pace.rush": (s) => at(s, { pace: "rush" }),
  "path.spiral": (s) => at(s, { path: "spiral" }),
  "path.wander": (s) => at(s, { path: "wander" }),
  "gap.overlap": (s) => at(s, { gap: "overlap" }),
  "gap.tight": (s) => at(s, { gap: "tight" }),
  "gap.stack": (s) => at(s, { gap: "stack" }),
  "trail.quick": (s) => at(s, { trail: "quick" }),
  "trail.linger": (s) => at(s, { trail: "linger" }),
  "trail.long": (s) => at(s, { trail: "long" }),
  "phone.same": (s) => <Screens s={{ ...s, phone: "same" }} phoneOnly />,
  "phone.strips": (s) => <Screens s={{ ...s, phone: "strips" }} phoneOnly />,
};

export function PrivacyHeroBoard() {
  return <ExplorationBoard spec={PRIVACY_HERO} previews={PREVIEWS} />;
}
