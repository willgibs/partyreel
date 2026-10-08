import type { BoardState, Control } from "@/components/lab/exploration";

/**
 * THE KNOBS THE WHOLE IS READ THROUGH, declared once: which moment of the
 * party, whose page, and the ground under it. Every option is a whole design,
 * so every option draws every moment on both sides; the knobs pick which one
 * is on the stage, so its frames stay large enough to judge.
 *
 * ★ A MOMENT IS A STATE OF THE PARTY, NEVER A DATE: before its first photo
 * (Maya's arrival from Create, the morning the code is out), photos landing,
 * after she closes adding (offered once the photos stop, never on a date), and
 * where the page's language reaches beyond it.
 *
 * ★ THE GROUND IS THE THEME: the room is the dark theme and paper the light
 * one. A head with no photograph is still the room on paper (Aperture: the
 * light lives in a piece of the room, never on the page).
 */
export const MOMENT: Control = {
  id: "moment",
  label: "Moment",
  options: [
    { id: "before", label: "Before the first photo" },
    { id: "party", label: "Photos landing" },
    { id: "after", label: "After her close" },
    { id: "reach", label: "Beyond the page" },
  ],
  default: "party",
};

export const SIDE: Control = {
  id: "side",
  label: "Whose page",
  options: [
    { id: "guest", label: "A guest's" },
    { id: "host", label: "Maya's, the host" },
  ],
  default: "guest",
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

export type MomentKey = "before" | "party" | "after" | "reach";
export type Side = "guest" | "host";
export type Ground = "room" | "paper";
export type Screen = "375" | "1440";

/** The two viewports the boards judge on. */
export const SCREENS: Record<Screen, { w: number; h: number }> = {
  "375": { w: 375, h: 812 },
  "1440": { w: 1440, h: 900 },
};

const pick = <T extends string>(
  v: string | undefined,
  ways: readonly T[],
  fallback: T,
): T => (ways.includes(v as T) ? (v as T) : fallback);

export const momentIn = (s: BoardState): MomentKey =>
  pick(s.moment, ["before", "party", "after", "reach"] as const, "party");
export const sideIn = (s: BoardState): Side =>
  pick(s.side, ["guest", "host"] as const, "guest");
export const groundIn = (s: BoardState): Ground =>
  pick(s.ground, ["room", "paper"] as const, "room");
