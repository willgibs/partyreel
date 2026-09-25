"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

/**
 * THE FRAMES EVERY DIRECTION DRAWS IN (`Fit` and `Measured` are the kit's; the
 * read schedule is this board's own, for the engine's late stills).
 *
 * ★ A WHOLE CREATOR IS THREE FRAMES: the laptop on top, and the phone's two
 * moments side by side under it. His note holds in a hand too, so the phone is
 * part of every direction rather than a knob away, and a direction whose phone
 * form needs two moments (a scroll, a band that rises) shows both.
 *
 * ★ STACKED, NEVER ALL IN ONE ROW. A 1440 frame beside two phones is 2,238 px,
 * which the board's column clips, and zooming the row to fit shrank the laptop
 * to half. Stacked, the widest thing on the stage is one 1440 frame and the
 * two phones (774 px) sit under it whole.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK ON
 * MOUNT, and nothing mounts a Radix portal: a portal opened inside a portalled
 * lab frame renders on the LAB PAGE's document, not the phone being judged.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** The engine's stills land late (sequential draws, keyed by the knobs), so the
 *  last read is far out: a caption taken before the stills arrive would
 *  measure an empty box and report it as the truth. */
const ENGINE_TIMERS = [200, 900, 1800, 3600, 6000];

export type Reader = (root: HTMLElement, win: Window) => string | null;

function Screen({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [said, setSaid] = useState("measuring");
  return (
    <Frame id={id} w={w} h={h} title={title} caption={said}>
      <Measured
        probe={measure}
        deps={[id]}
        onMeasure={setSaid}
        timers={ENGINE_TIMERS}
      >
        {children}
      </Measured>
    </Frame>
  );
}

export type PhoneScene = {
  /** What this moment of the phone form is: "choosing a look". */
  title: string;
  measure: Reader;
  node: ReactNode;
};

/**
 * One direction, whole: the laptop above, the phone's moments beneath. Every
 * caption is read off its own frame's document, never asserted.
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
    <Fit w={SCREENS["1440"].w}>
      <div className="flex flex-col gap-6">
        <Screen
          id={`${id}-1440`}
          screen="1440"
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
              screen="375"
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
