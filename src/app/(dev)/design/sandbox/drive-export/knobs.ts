import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ HER LAPTOP FIRST, HER PHONE ONE PRESS AWAY. A host sends an album the
 * morning after, usually at a desk, so every frame is 1440 by 900 first; the
 * same frames at 375 by 812 are the knob's other press (she checks a send from
 * her phone, and a phone's Take it home covers the screen).
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

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> =
  {
    "1440": { w: 1440, h: 900, name: "a laptop" },
    "375": { w: 375, h: 812, name: "a phone" },
  };

export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";
