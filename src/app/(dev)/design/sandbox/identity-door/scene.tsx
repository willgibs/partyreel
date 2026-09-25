"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

/**
 * THE FRAMES EVERY DIRECTION DRAWS IN (`reel-cut/scene.tsx`'s layout, the
 * manifest's own instruction): one stage of the door is one 1440 frame above
 * three 375 frames, so the laptop and the hand are read together and a
 * direction is judged across a whole stretch of her walk, never one screen.
 *
 * ★ STACKED, NEVER ALL IN ONE ROW. A 1440 frame beside three phones is 2,613 px,
 * which the board's column clips; stacked, the widest thing on the stage is the
 * one laptop and the three phones (1,173 px) sit under it whole.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK ON MOUNT,
 * and nothing mounts a Radix portal: a portal opened inside a portalled lab
 * frame renders on the LAB PAGE's document, not the phone being judged. The
 * door, its menu and its sheets are QUOTED markup (`door.tsx`, `steps.tsx`).
 *
 * ★ AND THE JSX RUNS IN THE BOARD'S REALM, ONLY ITS DOM LANDS IN THE FRAME
 * (`reel-front.css`'s finding). So every motion on this board is CSS
 * (`identity-door.css`), which the frame's own engine drives and its own
 * `prefers-reduced-motion` stills; nothing here times an animation from JS.
 */

export const PHONE = { w: 375, h: 812 } as const;
export const DESK = { w: 1440, h: 900 } as const;

export type Reader = (root: HTMLElement, win: Window) => string | null;

function Screen({
  id,
  w,
  h,
  title,
  measure,
  children,
}: {
  id: string;
  w: number;
  h: number;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState("measuring");
  return (
    <Frame id={id} w={w} h={h} title={title} caption={said}>
      <Measured probe={measure} deps={[id]} onMeasure={setSaid}>
        {children}
      </Measured>
    </Frame>
  );
}

export type PhoneScene = {
  /** What this moment of her walk is: "the chooser". */
  title: string;
  measure: Reader;
  node: ReactNode;
};

/**
 * One stage of one direction, whole: the laptop above, three moments of the
 * phone beneath. Every caption is read off its own frame's document.
 */
export function Scenes({
  id,
  title,
  laptop,
  measure,
  phones,
}: {
  id: string;
  title: string;
  laptop: ReactNode;
  measure: Reader;
  phones: readonly PhoneScene[];
}) {
  return (
    <Fit w={DESK.w}>
      <div className="flex flex-col gap-6">
        <Screen
          id={`${id}-1440`}
          w={DESK.w}
          h={DESK.h}
          title={`${title}, at a laptop`}
          measure={measure}
        >
          {laptop}
        </Screen>
        <div className="flex items-start gap-6">
          {phones.map((p, i) => (
            <Screen
              key={i}
              id={`${id}-375-${i}`}
              w={PHONE.w}
              h={PHONE.h}
              title={`In a hand, ${p.title}`}
              measure={p.measure}
            >
              {p.node}
            </Screen>
          ))}
        </div>
      </div>
    </Fit>
  );
}
