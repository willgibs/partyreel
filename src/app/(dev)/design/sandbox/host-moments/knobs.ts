import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ HER LAPTOP FIRST, HER PHONE ONE PRESS AWAY. A host runs these moments
 * from either: Settings and the storage list at her desk the week after, the
 * door and the Guests room from her phone in the middle of the party. Every
 * host frame is 1440 by 900 first and 375 by 812 on the knob's other press;
 * a guest's frames are a phone's whatever the knob says (guests add from
 * their phones).
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
