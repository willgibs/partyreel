import type { Control } from "@/components/lab/exploration";

/**
 * THE KNOBS THE QUESTIONS SHARE, declared once (`refuseCollisions` refuses
 * two different knobs under one id): the screen a surface is read at and the
 * ground it stands on.
 *
 * ★ A PHONE FIRST: a guest meets her party's faces on the phone in her hand,
 * so the guest's questions open there and a laptop is a press away. The host
 * runs her party from her laptop first, so her hub opens at a desk (`DESK`).
 *
 * ★ THE GROUND IS THE THEME. The room is the dark theme and paper the light
 * one. A cover is the room on both (it stands on a photograph), so only a
 * question whose row can sit on the page itself carries the knob.
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

export const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "room", label: "In the room (dark)" },
    { id: "paper", label: "On paper (light)" },
  ],
  default: "room",
};

/** The host's own knob: her hub opens at a laptop, where she runs her party. */
export const DESK: Control = {
  id: "desk",
  label: "Her screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export type Screen = "375" | "1440";
export type Ground = "room" | "paper";

/** The two viewports the boards judge on, the sizes `lab:demo` measures. */
export const SCREENS: Record<Screen, { w: number; h: number }> = {
  "375": { w: 375, h: 812 },
  "1440": { w: 1440, h: 900 },
};

/** A knob's value off a preview's state, the default where it says nothing. */
export const screenOf = (v: string | undefined, fallback: Screen = "375") =>
  v === "1440" || v === "375" ? (v as Screen) : fallback;
export const groundOf = (v: string | undefined): Ground =>
  v === "paper" ? "paper" : "room";
