"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at 1440 or 375, with
 * the real host components portalled into it. Never a route: nothing here may
 * reach a session, a Server Function or the network on mount.
 *
 * ★ 1440 FIRST, 375 ON THE KNOB, and that is the opposite of `guest-upload`.
 * A guest is standing at a party holding a phone; a host clearing forty
 * photographs is at a laptop with a cup of tea, which is why every option is
 * judged there first. The phone is still a knob on every decision and not an
 * afterthought: the tile row collapses to two chips at 375 and the queue's
 * columns halve, so an answer that only works at 1440 is a finding.
 */
export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  short,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string;
  /** Caps a composed surface well under the full viewport. */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short ? Math.min(full, 600) : full;
  const [measured, setMeasured] = useState("measuring");

  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );

  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/** The host page's own ground under every scene: the app background, the page
 *  padding the event page really uses, and the foreground colour. */
export function HostGround({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      className={
        screen === "375"
          ? "min-h-full space-y-5 bg-background px-4 py-5 text-foreground"
          : "min-h-full space-y-6 bg-background px-8 py-7 text-foreground"
      }
    >
      {children}
    </div>
  );
}
