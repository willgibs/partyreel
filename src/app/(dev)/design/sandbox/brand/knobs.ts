import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ THE DECK AT A DESK FIRST, ON A PHONE ONE PRESS AWAY. An agency presents
 * on a screen, so every vision is a deck of 1440 by 900 slides first; the
 * same slides laid out for a phone (375 wide, each as tall as it needs) are
 * the knob's other press, for reading the board where Will reads it on the go.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Read on",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> =
  {
    "1440": { w: 1440, h: 900, name: "at a desk" },
    "375": { w: 375, h: 812, name: "on a phone" },
  };

export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";
