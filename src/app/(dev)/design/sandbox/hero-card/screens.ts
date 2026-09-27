import type { Control } from "@/components/lab/board-spec";

/**
 * THE ONE SCREEN KNOB, AS PURE DATA: split from `scene.tsx` (a client file) so
 * `spec.ts` can declare it without importing React into a module `registry.ts`
 * hands to a server page (`registry.test.ts`'s own rule).
 *
 * ★ EVERY FRAME IS A REAL VIEWPORT AT ITS OWN WIDTH (`reel-story`'s lesson,
 * carried here whole because that board retires with `demo-doors`): the hero's
 * `lg:` pair, its `vw` type and its 50cqw band all answer the width they lay
 * out in, and only a same-origin iframe claims a width of its own. 1440 first,
 * because the home is read at a desk first; the phone is one press away. The
 * heights are a laptop's and a phone's real screens, because the hero is
 * exactly one screen tall (`cinema-hero.css`'s 100svh).
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
