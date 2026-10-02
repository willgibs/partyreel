"use client";

import "@/components/guest/door.css";
import "@/components/guest/door/doorway.css";
import "./locked-door.css";

import { type CSSProperties, useLayoutEffect, useRef } from "react";

import { DOOR_MAIN } from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { ShutDoor } from "@/components/guest/door/shut-door";
import { DoorStage } from "@/components/guest/door/stage";
import { WaitingDoor } from "@/components/guest/door/waiting-step";

import { HOST, LENA } from "./fixtures";
import { GuestPage } from "./guest-page";

/**
 * THE DOOR AT REST, AS A GUEST STANDS AT IT, WITH THE ROUND'S LOOP ON IT.
 *
 * ★ PRODUCTION'S OWN PAGES, WHOLE: the held door is `DoorStage` at a gate,
 * ajar in the house light, with `WaitingDoor` under it (its chooser as
 * door-wiring built it); the shut door is `ShutDoor` in `DOOR_MAIN`, as
 * `e/[token]/page.tsx` renders it for a newcomer signed out. The loop is the
 * board's sheet on production's own pieces (the sill, the floor, the room seen
 * through the ajar door's gap), keyed by `data-ld-idle`, so the option picked
 * is that sheet's rules and nothing a reviewer did not see.
 */

export type Idle = "glow" | "pass" | "turn";

export type AtRest = "wait" | "shut";

/**
 * EACH LOOP'S LENGTH, its one home: the sheet reads it as `--ld-loop`, and the
 * stills say their moments in it. The glow breathes on eight seconds (calm,
 * slower than a resting breath); someone passes once in twelve, crossing in
 * half of it at a walker's pace; the colours take thirty-six to go round, slow enough that no
 * moment of it reads as a change.
 */
export const LOOP_MS: Record<Idle, number> = {
  glow: 8000,
  pass: 12000,
  turn: 36000,
};

const loopVar = (idle: Idle) =>
  ({ "--ld-loop": `${LOOP_MS[idle]}ms` }) as CSSProperties;

export function IdleScene({ idle, door }: { idle: Idle; door: AtRest }) {
  if (door === "wait") {
    return (
      <GuestPage who={LENA}>
        <div
          data-ld-idle={idle}
          className="relative min-h-0 flex-1"
          style={loopVar(idle)}
        >
          <DoorStage
            open
            at="gate"
            door={{ state: "ajar", album: false }}
            modal={false}
          >
            <WaitingDoor hostName={HOST.name} />
          </DoorStage>
        </div>
      </GuestPage>
    );
  }
  return (
    <GuestPage who="stranger">
      <main data-ld-idle={idle} className={DOOR_MAIN} style={loopVar(idle)}>
        <ShutDoor previous={false} signedIn={false} returnTo="/e/ld-maya" />
      </main>
    </GuestPage>
  );
}

/**
 * Where in one loop each still stands, as a share of it: the moments that show
 * the loop's own kind (the light at rest, at its dimmest, back, at its
 * brightest; the shadow at the door's left, its middle and its right, then
 * gone; the colour a quarter of the way round each time).
 */
export const STRIP_AT: Record<Idle, readonly number[]> = {
  glow: [0, 0.25, 0.5, 0.75],
  pass: [0.196, 0.275, 0.354, 0.8],
  turn: [0, 0.25, 0.5, 0.75],
};

/**
 * ONE LOOP, IN STILLS: production's shut doorway four times, each frozen at its
 * moment in the loop (`--ld-at`, the sheet's paused animation), with the time
 * under it from the loop's own length. Two by two in a phone's frame, four in
 * a row in a laptop's, each moment's floor kept to its own cell so no door
 * lights its neighbour's floor.
 */
/**
 * The pieces a loop runs on, which a still freezes (`locked-door.css`'s paused
 * animations, at `--ld-at` of the loop).
 */
const LOOPED = ".door-way, .door-way-sill, .door-way-floor, .door-way-room";

export function LoopStrip({ idle }: { idle: Idle }) {
  const root = useRef<HTMLDivElement>(null);
  // ★ A STILL IS A PICTURE, SO REDUCED MOTION'S GUARD MAY NOT REACH IT. The
  // global guard (`globals.css`) clamps every animation to 0.01ms and one
  // iteration under `prefers-reduced-motion: reduce`, which would carry each
  // paused moment past its end to the rest state, and a reviewer with less
  // motion would read four identical doors. Its rule is `!important` in the
  // base layer, which only a declaration on the element itself outranks, so
  // each frozen piece restates the loop's own length and count there.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    for (const piece of el.querySelectorAll<HTMLElement>(LOOPED)) {
      piece.style.setProperty(
        "animation-duration",
        "var(--ld-loop)",
        "important",
      );
      piece.style.setProperty(
        "animation-iteration-count",
        "infinite",
        "important",
      );
    }
  }, [idle]);
  return (
    <div
      ref={root}
      data-ld-loop-strip={idle}
      className="grid min-h-svh grid-cols-2 content-center gap-x-2 gap-y-10 bg-background px-3 text-foreground sm:grid-cols-4 sm:px-16"
    >
      {STRIP_AT[idle].map((at) => (
        <div
          key={at}
          data-ld-strip-at={at}
          className="flex flex-col items-center overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)] pt-2 pb-1"
          style={{ "--ld-at": at } as CSSProperties}
        >
          <div data-ld-idle={idle} style={loopVar(idle)}>
            <Doorway state="shut" />
          </div>
          <p
            data-ld-strip-time=""
            className="mt-16 text-xs text-muted-foreground tabular-nums"
          >
            {`${(Math.round((at * LOOP_MS[idle]) / 100) / 10).toFixed(1)} s`}
          </p>
        </div>
      ))}
    </div>
  );
}
