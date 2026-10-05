import type { Control } from "@/components/lab/exploration";

/**
 * THE SCREEN EVERY HOST FRAME IS DRAWN AT: a phone first (most hosts shape a
 * party from the phone in their hand), a laptop a press away. The guest's
 * camera is a phone's whatever this says: nobody shoots a party at a desk.
 * One knob, shared by every decision (`configs`), so the dock draws it once
 * and a link keeps it (`?screen=1440`).
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

export type Screen = "375" | "1440";

/** The two viewports the boards judge on, the sizes `lab:demo` measures. */
export const SCREENS: Record<Screen, { w: number; h: number }> = {
  "375": { w: 375, h: 812 },
  "1440": { w: 1440, h: 900 },
};

/** The knob's value off a preview's state, a phone where it says nothing. */
export const screenOf = (value: string | undefined): Screen =>
  value === "1440" ? "1440" : "375";
