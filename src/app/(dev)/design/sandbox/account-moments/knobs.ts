import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S ONE KNOB, AS PURE DATA: split from the drawings so `spec.ts`
 * declares it without importing React into a module the registry hands to a
 * server page (`registry.test.ts`'s own rule).
 *
 * ★ HER PHONE FIRST, HER LAPTOP ONE PRESS AWAY. These are a guest's moments
 * as much as a host's: Priya follows Maya from the album on her phone the
 * night of the wedding, blocks from a page she opened there, and opens her
 * own page from the same menu. Tidying Connections is the one she is likelier
 * to do at a desk, and every frame draws at either width.
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

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> =
  {
    "1440": { w: 1440, h: 900, name: "a laptop" },
    "375": { w: 375, h: 812, name: "a phone" },
  };

export const screenOf = (v: unknown): ScreenId =>
  v === "1440" ? "1440" : "375";
