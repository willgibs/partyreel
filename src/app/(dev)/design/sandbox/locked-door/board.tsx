"use client";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { AlbumHuesProvider, useAlbumHues } from "./guest-page";
import { type Idle, IdleScene, LoopStrip } from "./idle";
import { measureIdle, measureReveal, measureStrip } from "./measure";
import { type Moment, RevealScene } from "./reveal";
import { screenOf, Strip } from "./scene";
import { LOCKED_DOOR } from "./spec";
import type { Reveal } from "./way";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the door as a guest meets
 * it, at the width the Screen knob names, drawn by production's own door page
 * with the round's additions (`reveal.tsx`, `idle.tsx`).
 *
 * ★ A MOMENT IS DRAWN LIVE, THEN IN STILLS. `reveal` plays its moment on a
 * loop (the door at rest, her Continue, the walk, the album), then stands it
 * still three times: the open door at rest, which is also exactly what
 * reduced motion paints, the walk half done, and the album she lands in.
 * `idle` loops the wait and the shut door, stands the shut door still as
 * reduced motion sees it, and lays one loop out in five stills beneath.
 *
 * ★ THE KNOBS MOVE THE WIDTH AND THE MOMENT, NEVER THE ANSWER: Screen swaps the
 * phone for the laptop, and Moment swaps a Public album's welcome for Maya
 * letting Lena in. The walk is the same in both.
 */

const momentOf = (s: BoardState): Moment =>
  s.moment === "let-in" ? "let-in" : "welcome";

/** An option's own name off the spec, so a row's lede and the step agree. */
const LABEL = (ask: string, option: string) => {
  const found = LOCKED_DOOR.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

/** Hues that land after layout, so a lit frame's caption is read again. */
function useAgain(): string {
  return useAlbumHues().map(Math.round).join();
}

/* ── reveal: the open door, and the walk into the album ─────────────────── */

function RevealStrip({ s, reveal }: { s: BoardState; reveal: Reveal }) {
  const screen = screenOf(s);
  const moment = momentOf(s);
  const again = useAgain();
  const key = `ld-reveal-${reveal}-${moment}`;
  const scene = (at?: Parameters<typeof RevealScene>[0]["at"]) => (
    <RevealScene reveal={reveal} moment={moment} screen={screen} at={at} />
  );
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("reveal", reveal)}: as it plays, then still at rest (as reduced motion sees it), half way through, and in the album.`}
      frames={[
        {
          id: `${key}-live`,
          title:
            moment === "welcome"
              ? "The welcome, then Continue, as it plays"
              : "Lena waits, Maya lets her in, as it plays",
          node: scene(),
          measure: measureReveal,
          again,
        },
        {
          id: `${key}-rest`,
          title: "The open door at rest: reduced motion's still",
          node: scene(moment === "welcome" ? "open" : "letin"),
          measure: measureReveal,
          still: true,
          again,
        },
        {
          id: `${key}-mid`,
          title: "Walking through, half way",
          node: scene("mid"),
          measure: measureReveal,
          still: true,
          again,
        },
        {
          id: `${key}-in`,
          title: "In the album",
          node: scene("in"),
          measure: measureReveal,
          still: true,
          again,
        },
      ]}
    />
  );
}

/* ── idle: the door at rest, alive ──────────────────────────────────────── */

function IdleStrip({ s, idle }: { s: BoardState; idle: Idle }) {
  const screen = screenOf(s);
  const key = `ld-idle-${idle}`;
  return (
    <Strip
      screen={screen}
      lede={`${LABEL("idle", idle)}: the wait and the shut door as they loop, the shut door as reduced motion sees it, and one loop in stills.`}
      frames={[
        {
          id: `${key}-wait`,
          title: "Lena waits while Maya decides",
          node: <IdleScene idle={idle} door="wait" />,
          measure: measureIdle,
        },
        {
          id: `${key}-shut`,
          title: "The shut door, a newcomer off the code",
          node: <IdleScene idle={idle} door="shut" />,
          measure: measureIdle,
        },
        {
          id: `${key}-still`,
          title: "The shut door, as reduced motion sees it",
          node: <IdleScene idle={idle} door="shut" />,
          measure: measureIdle,
          still: true,
        },
        {
          id: `${key}-strip`,
          title: "One loop of the shut door, in stills",
          node: <LoopStrip idle={idle} />,
          measure: measureStrip,
        },
      ]}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof LOCKED_DOOR> = {
  "reveal.light": (s) => <RevealStrip s={s} reveal="light" />,
  "reveal.one": (s) => <RevealStrip s={s} reveal="one" />,
  "reveal.through": (s) => <RevealStrip s={s} reveal="through" />,

  "idle.glow": (s) => <IdleStrip s={s} idle="glow" />,
  "idle.pass": (s) => <IdleStrip s={s} idle="pass" />,
  "idle.turn": (s) => <IdleStrip s={s} idle="turn" />,
};

export function LockedDoorBoard() {
  return (
    <AlbumHuesProvider>
      <ExplorationBoard spec={LOCKED_DOOR} previews={PREVIEWS} />
    </AlbumHuesProvider>
  );
}
