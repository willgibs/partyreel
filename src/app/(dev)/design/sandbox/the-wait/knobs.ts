import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ A PHONE FIRST, A LAPTOP ONE PRESS AWAY. A guest waits on her phone at the
 * party and Maya checks her album from hers between dances, so every frame is
 * 375 by 812 first; the same frames at 1440 by 900 are the knob's other press
 * (the morning after over coffee, a host at her desk).
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

export type ScreenId = "375" | "1440";

export const SCREENS: Record<ScreenId, { w: number; h: number }> = {
  "375": { w: 375, h: 812 },
  "1440": { w: 1440, h: 900 },
};

export const screenOf = (v: unknown): ScreenId =>
  v === "1440" ? "1440" : "375";
