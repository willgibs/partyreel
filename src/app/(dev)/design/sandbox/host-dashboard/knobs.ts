import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * can declare it without importing React into a module the registry hands to
 * a server page (`registry.test.ts`'s own rule).
 *
 * ★ A LAPTOP FIRST, A PHONE ONE PRESS AWAY. Forty events are managed at a
 * desk, and a planner bouncing between old albums is at one; the same page in
 * a hand is the knob's other press, because a host opens it from a phone too.
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

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number }> = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
};

export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";
