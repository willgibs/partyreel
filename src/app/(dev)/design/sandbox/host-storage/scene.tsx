"use client";

import { type ReactNode } from "react";

import { Fit, Frame } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN: a real viewport at 1440 or 375, with
 * the real host pieces portalled into it. Never a route: nothing here may
 * reach a session, a Server Function or the network on mount.
 *
 * ★ 1440 FIRST, 375 ON THE KNOB, the same lean as `host-curation`. A host
 * checking what is eating their storage is at the account page or the
 * dashboard, at a desk, most often mid plan-switch; the phone still has to
 * carry the same list and the same sheet, so it stays a knob on every
 * decision rather than an afterthought.
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
  short,
  tall,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  caption?: React.ReactNode;
  /** Caps a composed surface well under the full viewport. */
  short?: boolean;
  /** A surface taller than the screen (a page that scrolls): grows the frame
   *  rather than clipping it, so nothing this board draws is cut off. */
  tall?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short ? Math.min(full, 560) : tall ? full + 480 : full;

  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={caption}
      >
        {children}
      </Frame>
    </Fit>
  );
}

/** The host page's own ground under every scene: the app background, the page
 *  padding the account and dashboard pages really use, and the foreground
 *  colour. */
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
