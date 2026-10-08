import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ A DESK FIRST, A PHONE ONE PRESS AWAY: the icon is judged where it lives,
 * and the two frames that are pages rather than phones (its sizes, and the
 * press kit beside the wordmark) are laid out at either width; a home screen
 * and a launcher are always a phone.
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
