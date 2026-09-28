import type { Control } from "@/components/lab/board-spec";

/**
 * THE TWO SCREENS, AS DATA: the spec (which must stay free of React, for the
 * server-side registry) and the scenes both read them here.
 *
 * ★ 1440 FIRST, 375 ON THE KNOB, the same lean as round one: a host changing
 * plans is at the account page or the dashboard, at a desk, most often; the
 * phone still carries the same plan as a whole screen, so it stays a knob.
 */
export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop", desk: true },
  "375": { w: 375, h: 812, name: "a phone", desk: false },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};
