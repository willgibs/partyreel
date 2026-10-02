import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the client files so `spec.ts`
 * can declare them without importing React into a module `registry.ts` hands
 * to a server page (`registry.test.ts`'s own rule).
 *
 * ★ 375 FIRST. A disposable is shot standing up at a party, so every camera
 * frame is a phone and only a phone. The waiting room and the developed
 * album are also opened at a desk (the morning after, a laptop), so those two
 * decisions carry the Screen knob and draw both.
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

export const screenOf = (v: unknown): "375" | "1440" =>
  v === "1440" ? "1440" : "375";

/**
 * THE COLOUR LOOKS, round one's three (Warm, Cool, B&W, the host's pick):
 * read only where the look decision draws its "three colour looks" option,
 * so each can be judged on the twelve lights in turn. Warm is the default
 * because it is the disposable's own cast.
 */
export const STOCK: Control = {
  id: "stock",
  label: "The colour look",
  options: [
    { id: "warm", label: "Warm" },
    { id: "cool", label: "Cool" },
    { id: "mono", label: "B&W" },
  ],
  default: "warm",
};

export type StockId = "warm" | "cool" | "mono";

export const stockOf = (v: unknown): StockId =>
  v === "cool" ? "cool" : v === "mono" ? "mono" : "warm";
