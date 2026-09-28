import type { Control } from "@/components/lab/board-spec";

/**
 * THE BOARD'S TWO KNOBS, AS PURE DATA: split from the client files (the
 * hero-card board's pattern) so `spec.ts` can declare them without importing
 * React into a module `registry.ts` hands to a server page.
 *
 * ★ 375 FIRST, 1440 ON EVERY KNOB (the board's `phone-first` call). In a hand
 * settings is its own screen under a back arrow, the longest form in the app
 * with nothing above it, so every row a structure keeps costs a scroll there;
 * at a desk it is the panel beside the album, and the knob draws that too.
 * Each frame is the device's own screen, because "the whole of it fits one
 * screen" is only true at a real height.
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

/**
 * WHICH PLAN MAYA IS ON, for the one question a plan changes: videos are the
 * only thing settings still locks on Free once Will's pricing shift lands
 * (`pricing-wiring`), so the lock is judged on Free and the knob shows the
 * same place on Pro, where it has to read as nothing at all or as a control
 * that works.
 */
export const PLAN: Control = {
  id: "plan",
  label: "Plan",
  options: [
    { id: "free", label: "Free" },
    { id: "pro", label: "Pro" },
  ],
  default: "free",
};

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;

export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";
