import type { Control } from "@/components/lab/board-spec";

/**
 * THE BOARD'S TWO KNOBS, AS PURE DATA: split from the client files so
 * `spec.ts` can declare them without importing React into a module
 * `registry.ts` hands to a server page (`registry.test.ts`'s own rule).
 *
 * ★ 375 FIRST. A disposable is shot standing up at a party, so every guest
 * frame is a phone and only a phone. The host's two surfaces (Create and
 * Settings) are set up at a desk as often as in a hand, so the decision about
 * them carries this knob and draws both.
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

/**
 * SHOTS EACH, on the price decision: the roll's length is what a Free event's
 * room is spent on, so every estimate is drawn at the length the knob holds.
 * 24 is the default (the carried call `shots`); 10 is a dinner, 36 a long
 * roll.
 */
export const SHOTS: Control = {
  id: "shots",
  label: "Shots each",
  options: [
    { id: "10", label: "10 each" },
    { id: "24", label: "24 each" },
    { id: "36", label: "36 each" },
  ],
  default: "24",
};

export const shotsOf = (v: unknown): number =>
  v === "10" ? 10 : v === "36" ? 36 : 24;
