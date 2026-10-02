import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the client files so `spec.ts`
 * can declare it without importing React into a module `registry.ts` hands to
 * a server page (`registry.test.ts`'s own rule).
 *
 * ★ A PHONE FIRST, A LAPTOP ONE PRESS AWAY. Create is used at a desk as often
 * as in a hand, and the three shapes part most at a desk (a card, a room, a
 * split), so every decision carries the knob and draws both. 375 is the
 * default because four phones read whole on a step's stage, where four
 * laptops read as thumbnails until 1:1.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: unknown): ScreenId =>
  v === "1440" ? "1440" : "375";
