"use client";

import { useCallback, useMemo, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { Home } from "./homes";
import {
  CANVAS,
  type Decay,
  type Density,
  DEFAULT_LOOK,
  type EntranceId,
  facts,
  type HomeId,
  type Look,
  type Mode,
  type PhoneId,
  scriptFor,
  type SizeId,
  specOf,
  stillAt,
} from "./looks";
import { IMAGE_TRAIL } from "./spec";
import { type Drive, TrailLayer, TrailPause } from "./trail-layer";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is a whole screen of the real
 * site with the trail behind its words.
 *
 * ★ A FRAME, BECAUSE THE HEADLINE IS A `vw` CLAMP. `text-title` reads the
 * BROWSER's width, so a 375 div on a wide page would draw the 1440 headline and
 * the composition would be judged against the wrong lockup. `Frame` portals the
 * screen into a same-origin iframe, the only real viewport the lab has.
 *
 * ★ THE POINTER IS SCRIPTED IN THE PICTURE AND LIVE ON THE DESK. A headless
 * capture has no cursor and `lab:demo` emulates reduced motion on top of that,
 * so every still here is a replay of one declared hand (`scriptFor`), which is
 * the same composition the loop then carries on from. Move your own cursor over
 * any frame and it takes over.
 *
 * ★ A STAGED DECISION WEARS WHAT IT WAITS ON. Every preview is a function of the
 * board's state: the decay is drawn at the density picked, the entrance at both,
 * and all of them on whichever home the dock is showing (`Preview`,
 * exploration.ts).
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT. The step hides the options it is not
 * showing with `data-paused`, which lives in THIS document; the trail runs
 * inside the frame's, so the host reads its own ancestors and hands the answer
 * down (`TrailPause`).
 */

const lookOf = (s: BoardState): Look => ({
  density: (s.density ?? DEFAULT_LOOK.density) as Density,
  decay: (s.decay ?? DEFAULT_LOOK.decay) as Decay,
  entrance: (s.entrance ?? DEFAULT_LOOK.entrance) as EntranceId,
  size: (s.size ?? DEFAULT_LOOK.size) as SizeId,
});

const homeOf = (s: BoardState): HomeId => (s.home ?? "privacy") as HomeId;

/** What a phone's answer does to the loop. The desktop is always `pointer`:
 *  the paths keep the hero alive and a real cursor takes over. */
const PHONE_DRIVE: Record<PhoneId, Drive | null> = {
  touch: "hand",
  walks: "path",
  still: "still",
  none: null,
};

/** The numbers under each screen, measured off the engine it draws. */
function captionFor(look: Look, mode: Mode, home: HomeId) {
  const f = facts(look, mode, home);
  return `${f.lit} photographs lit at the busiest instant · one every ${f.beat} ms at the scripted hand · ${f.density} px of travel between them · ${f.size} px wide · ${(f.life / 1000).toFixed(1)} s each · ${f.nodes} nodes`;
}

/**
 * ★ A HAND-DRIVEN TRAIL'S STILL IS ONE DRAG, NOT A WHOLE PATH. Under `hand`
 * nothing walks by itself, so the resting composition should be what a single
 * finger stroke leaves behind, which is a third of the scripted hand rather
 * than all of it. Without this, "it follows a finger" and "a still composition"
 * draw the identical picture and a reviewer is asked to choose between two
 * tiles that look the same (`lab:demo` prints exactly that).
 */
const STILL_OF_A_DRAG = 0.34;

function Trail({
  look,
  mode,
  drive,
  home,
}: {
  look: Look;
  mode: Mode;
  drive: Drive;
  home: HomeId;
}) {
  const spec = useMemo(() => specOf(look, mode, home), [look, mode, home]);
  const paths = useMemo(() => [scriptFor(mode)], [mode]);
  const at = useMemo(
    () =>
      Math.round(
        stillAt(look, mode) * (drive === "hand" ? STILL_OF_A_DRAG : 1),
      ),
    [look, mode, drive],
  );
  return <TrailLayer spec={spec} source={{ paths, drive, stillAt: at }} />;
}

function Screens({
  look,
  home,
  phone,
  phoneOnly = false,
}: {
  look: Look;
  home: HomeId;
  phone?: PhoneId;
  phoneOnly?: boolean;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const isPaused = useCallback(
    () =>
      document.hidden || Boolean(host.current?.closest('[data-paused="true"]')),
    [],
  );
  const phoneDrive = phone ? PHONE_DRIVE[phone] : "path";
  const id = `${look.density}-${look.decay}-${look.entrance}-${look.size}-${home}-${phone ?? "x"}`;

  return (
    <TrailPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {!phoneOnly && (
          <Frame
            id={`itr-desk-${id}`}
            w={CANVAS.desktop.w}
            h={CANVAS.desktop.h}
            title="1440"
            caption={captionFor(look, "desktop", home)}
          >
            <Home
              id={home}
              mode="desktop"
              trail={
                <Trail look={look} mode="desktop" drive="pointer" home={home} />
              }
            />
          </Frame>
        )}
        <Frame
          id={`itr-phone-${id}`}
          w={CANVAS.phone.w}
          h={CANVAS.phone.h}
          title="375"
          caption={
            phoneDrive === null
              ? "no trail below 640 px: the page as it ships today"
              : captionFor(look, "phone", home)
          }
        >
          <Home
            id={home}
            mode="phone"
            trail={
              phoneDrive === null ? null : (
                <Trail
                  look={look}
                  mode="phone"
                  drive={phoneDrive}
                  home={home}
                />
              )
            }
          />
        </Frame>
      </div>
    </TrailPause.Provider>
  );
}

const at = (s: BoardState, over: Partial<Look>, home?: HomeId) => (
  <Screens look={{ ...lookOf(s), ...over }} home={home ?? homeOf(s)} />
);

const PREVIEWS: PreviewsFor<typeof IMAGE_TRAIL> = {
  "density.d60": (s) => at(s, { density: "d60" }),
  "density.d100": (s) => at(s, { density: "d100" }),
  "density.d140": (s) => at(s, { density: "d140" }),
  "decay.quick": (s) => at(s, { decay: "quick" }),
  "decay.linger": (s) => at(s, { decay: "linger" }),
  "decay.long": (s) => at(s, { decay: "long" }),
  "entrance.slide": (s) => at(s, { entrance: "slide" }),
  "entrance.drift": (s) => at(s, { entrance: "drift" }),
  "entrance.flick": (s) => at(s, { entrance: "flick" }),
  "size.s180": (s) => at(s, { size: "s180" }),
  "size.s240": (s) => at(s, { size: "s240" }),
  "size.s300": (s) => at(s, { size: "s300" }),
  "home.privacy": (s) => at(s, {}, "privacy"),
  "home.close": (s) => at(s, {}, "close"),
  "home.notfound": (s) => at(s, {}, "notfound"),
  "home.bank": (s) => at(s, {}, "bank"),
  "phone.touch": (s) => (
    <Screens look={lookOf(s)} home={homeOf(s)} phone="touch" phoneOnly />
  ),
  "phone.walks": (s) => (
    <Screens look={lookOf(s)} home={homeOf(s)} phone="walks" phoneOnly />
  ),
  "phone.still": (s) => (
    <Screens look={lookOf(s)} home={homeOf(s)} phone="still" phoneOnly />
  ),
  "phone.none": (s) => (
    <Screens look={lookOf(s)} home={homeOf(s)} phone="none" phoneOnly />
  ),
};

export function ImageTrailBoard() {
  return <ExplorationBoard spec={IMAGE_TRAIL} previews={PREVIEWS} />;
}
