"use client";

import type { ReactNode } from "react";

import { Frame } from "@/components/lab";

/**
 * THE FRAME EVERY OPTION DRAWS IN. Both sizes stacked, always (album-motion's
 * shape, not seed-avatar's picked-one-at-a-time knob): the brief asks every
 * option "at 375 and 1440", and a board that shows both without a control to
 * lose is one fewer knob a reviewer has to remember to press before judging.
 */
export const SIZES = {
  desktop: { w: 1440, h: 620 },
  phone: { w: 375, h: 700 },
} as const;
export type SceneMode = keyof typeof SIZES;

export function Scene({
  id,
  mode,
  h,
  caption,
  children,
}: {
  id: string;
  mode: SceneMode;
  /** Overrides this size's default height (a taller phone scene for `where`). */
  h?: number;
  caption?: ReactNode;
  children: ReactNode;
}) {
  const { w, h: defaultH } = SIZES[mode];
  return (
    <Frame
      id={id}
      w={w}
      h={h ?? defaultH}
      title={mode === "desktop" ? "1440" : "375"}
      caption={caption}
    >
      <div className="relative flex h-full min-h-full flex-col overflow-hidden bg-background text-foreground">
        {children}
      </div>
    </Frame>
  );
}

/** Desktop over phone, one option's whole picture. */
export function TwoUp({
  id,
  desktop,
  phone,
  captionDesktop,
  captionPhone,
  phoneH,
}: {
  id: string;
  desktop: ReactNode;
  phone: ReactNode;
  captionDesktop?: ReactNode;
  captionPhone?: ReactNode;
  phoneH?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Scene id={`${id}-desktop`} mode="desktop" caption={captionDesktop}>
        {desktop}
      </Scene>
      <Scene id={`${id}-phone`} mode="phone" h={phoneH} caption={captionPhone}>
        {phone}
      </Scene>
    </div>
  );
}
