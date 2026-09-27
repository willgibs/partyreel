import type { Control } from "@/components/lab/board-spec";

/**
 * THE SCREEN KNOB, AS PURE DATA (`reel-story/screens.ts`'s own split): the spec
 * reads it from a server page through the registry, so it lives apart from the
 * React in `scene.tsx`, which a server module must never pull in.
 *
 * Phone first, 1440 on the knob: she confirms on the phone she took the photo
 * with, at the party, so a phone is where she first meets the review.
 */
export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone", size: "phone" },
  "1440": { w: 1440, h: 900, name: "a laptop", size: "desk" },
} as const;

export type ScreenId = keyof typeof SCREENS;

/** The posture a surface takes: in a hand, or at a desk (popups' two sizes). */
export type Size = "phone" | "desk";

export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};
