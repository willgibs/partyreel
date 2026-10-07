import type { Control } from "@/components/lab/exploration";

/**
 * THE ONE KNOB THE QUESTIONS SHARE, declared once (`refuseCollisions` refuses
 * two different knobs under one id): the ground the album stands on.
 *
 * ★ A PHONE, ALWAYS: a dead zone is a phone's problem (a laptop at a party is
 * on the venue's wired line or nowhere), so every frame is 375 wide and no
 * question carries a screen knob.
 *
 * ★ THE GROUND IS THE THEME. The room is the dark theme and paper the light
 * one; the cover and the camera are the room on both (they stand on a
 * photograph and on the phone's own black), so only the album's page, its
 * sheets and its foot change with it.
 */
export const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "room", label: "In the room (dark)" },
    { id: "paper", label: "On paper (light)" },
  ],
  default: "room",
};

export type Ground = "room" | "paper";

export const groundOf = (v: string | undefined): Ground =>
  v === "paper" ? "paper" : "room";

/** A phone, the size `lab:demo` measures a step at. */
export const PHONE = { w: 375, h: 812 } as const;
