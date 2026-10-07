import type { Control } from "@/components/lab/exploration";

/**
 * THE TWO KNOBS EVERY QUESTION SHARES, declared once (`refuseCollisions`
 * refuses two different knobs under one id): the screen a surface is read at
 * and the ground it stands on.
 *
 * ★ A PHONE FIRST: a guest meets the album, the Add, the door and the camera
 * on the phone in her hand, so the board opens there; a laptop is a press
 * away. The camera is a phone's whatever this says (nobody films a party at a
 * desk).
 *
 * ★ THE GROUND IS THE THEME. The room is the dark theme and paper the light
 * one; Aperture's whole answer to paper is what changes between them, so a
 * question whose surface follows the theme carries this knob. The camera and
 * Create's room are dark in both themes and leave it out.
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

export type Screen = "375" | "1440";
export type Ground = "room" | "paper";

/** The two viewports the boards judge on, the sizes `lab:demo` measures. */
export const SCREENS: Record<Screen, { w: number; h: number }> = {
  "375": { w: 375, h: 812 },
  "1440": { w: 1440, h: 900 },
};

/** A knob's value off a preview's state, the default where it says nothing. */
export const screenOf = (v: string | undefined): Screen =>
  v === "1440" ? "1440" : "375";
export const groundOf = (v: string | undefined): Ground =>
  v === "paper" ? "paper" : "room";
