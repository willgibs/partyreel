"use client";

import { useCallback, useMemo, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { HOME } from "./field";
import { FieldPause } from "./field-layer";
import { PrivacyHero } from "./hero";
import { PRIVACY_HERO } from "./spec";
import { type Arms, type Gap, type Pace, spirals, type Trail } from "./spirals";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the privacy page's first
 * screen at 1440 and again at 375, in real viewports.
 *
 * ★ A FRAME, BECAUSE THE HEADLINE IS A `vw` CLAMP. `text-title` reads the
 * BROWSER's width, so a 375 div on a wide page would draw the 1440 headline
 * and every keep-out box the spirals are solved around would be wrong. `Frame`
 * portals the composition into a same-origin iframe, the only real viewport the
 * lab has, so the lockup wraps exactly as it will on a phone.
 *
 * ★ A STAGED DECISION WEARS WHAT IT WAITS ON. Every preview is a function of
 * the board's state: the gap is drawn at the pace he picked, the trail at both,
 * the phone at all three (`Preview`, exploration.ts).
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT. The step hides the options it is
 * not showing with `data-paused`, which lives in THIS document; the field runs
 * inside the frame's, so the host reads its own ancestors and hands the answer
 * down (`FieldPause`).
 */

type Look = { pace: Pace; gap: Gap; trail: Trail; arms: Arms };

const look = (s: BoardState): Look => ({
  pace: (s.pace ?? "home") as Pace,
  gap: (s.gap ?? "half") as Gap,
  trail: (s.trail ?? "wake") as Trail,
  arms: (s.phone ?? "cones") as Arms,
});

/** The numbers under each screen, measured off the engine it draws. */
function captionFor(mode: "desktop" | "phone", l: Look) {
  const f = spirals({ mode, ...l });
  return `${f.facts.lit} lit at the busiest instant (the home hero: ${HOME[mode].lit}) · a pair every ${f.pace.beat} ms (home: ${HOME[mode].beat}) · ${f.pace.launch} px a second off the words`;
}

function Screens({ l, phoneOnly = false }: { l: Look; phoneOnly?: boolean }) {
  const host = useRef<HTMLDivElement | null>(null);
  const isPaused = useCallback(
    () =>
      document.hidden || Boolean(host.current?.closest('[data-paused="true"]')),
    [],
  );
  const spec = useMemo(
    () => ({ pace: l.pace, gap: l.gap, trail: l.trail, arms: l.arms }),
    [l.pace, l.gap, l.trail, l.arms],
  );
  const id = `${l.pace}-${l.gap}-${l.trail}-${l.arms}`;

  return (
    <FieldPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {!phoneOnly && (
          <Frame
            id={`pvh-desk-${id}`}
            w={1440}
            h={930}
            title="1440"
            caption={captionFor("desktop", l)}
          >
            <PrivacyHero mode="desktop" spec={spec} />
          </Frame>
        )}
        <Frame
          id={`pvh-phone-${id}`}
          w={375}
          h={760}
          title="375"
          caption={captionFor("phone", l)}
        >
          <PrivacyHero mode="phone" spec={spec} />
        </Frame>
      </div>
    </FieldPause.Provider>
  );
}

const PREVIEWS: PreviewsFor<typeof PRIVACY_HERO> = {
  "pace.home": (s) => <Screens l={{ ...look(s), pace: "home" }} />,
  "pace.under": (s) => <Screens l={{ ...look(s), pace: "under" }} />,
  "pace.over": (s) => <Screens l={{ ...look(s), pace: "over" }} />,
  "gap.half": (s) => <Screens l={{ ...look(s), gap: "half" }} />,
  "gap.edge": (s) => <Screens l={{ ...look(s), gap: "edge" }} />,
  "gap.overlap": (s) => <Screens l={{ ...look(s), gap: "overlap" }} />,
  "trail.wake": (s) => <Screens l={{ ...look(s), trail: "wake" }} />,
  "trail.echoes": (s) => <Screens l={{ ...look(s), trail: "echoes" }} />,
  "trail.none": (s) => <Screens l={{ ...look(s), trail: "none" }} />,
  "phone.spirals": (s) => (
    <Screens l={{ ...look(s), arms: "spirals" }} phoneOnly />
  ),
  "phone.cones": (s) => <Screens l={{ ...look(s), arms: "cones" }} phoneOnly />,
};

export function PrivacyHeroBoard() {
  return <ExplorationBoard spec={PRIVACY_HERO} previews={PREVIEWS} />;
}
