import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE SCREEN KNOB, AS PURE DATA: split from `scene.tsx` (a client file) so
 * `spec.ts` can declare it without importing React into a module `registry.ts`
 * hands to a server page (`registry.test.ts`'s own rule).
 *
 * ★ EVERY FRAME IS A REAL VIEWPORT AT ITS OWN WIDTH (round 1's lesson). Round
 * one drew each option in a plain box, so every `sm:` and `lg:` inside answered
 * the LAB WINDOW's width: the "375" events column laid out as a desktop grid
 * squeezed into a phone. Round two portals every option into a `Frame` (a
 * same-origin iframe), where a breakpoint and a `vw` clamp read the width the
 * caption names.
 *
 * ★ 1440 FIRST. The home, the hub and an event page are read at a desk first;
 * the phone is one press away. The heights are a phone's and a laptop's real
 * screens, which only the `play` ask uses as they stand (a layer over the page
 * covers exactly one screen); every other frame is as tall as what it draws.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";
