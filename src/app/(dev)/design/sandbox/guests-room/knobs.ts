import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ HER PHONE FIRST, HER LAPTOP ONE PRESS AWAY. The night is when people wait
 * at her door, and she answers them from the phone in her hand; the laptop is
 * the week before (the invite list) and the morning after. The room is the
 * same width in both (a phone's screen, a desk's 448px panel), so the laptop
 * adds the hub behind it and a card beside the name rather than a sheet.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, her phone" },
    { id: "1440", label: "1440, her laptop" },
  ],
  default: "375",
};

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> =
  {
    "1440": { w: 1440, h: 900, name: "her laptop" },
    "375": { w: 375, h: 812, name: "her phone" },
  };

export const screenOf = (v: unknown): ScreenId =>
  v === "1440" ? "1440" : "375";
