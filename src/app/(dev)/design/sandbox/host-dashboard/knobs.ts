import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S TWO KNOBS, AS PURE DATA: split from the drawings so `spec.ts`
 * can declare them without importing React into a module the registry hands
 * to a server page.
 *
 * ★ THE MOMENT MOVES "TODAY", NEVER THE EVENTS. Maya's 30th is Friday 2
 * October 2026 and Jo's forty keep their own dates; the knob only says which
 * day the host opens the dashboard on, so every option is read on the same
 * three days: a week before, the night itself, and the morning after. The
 * night is the default because it is the day the dashboard is most different
 * from page to page (a party live, a planner's busiest evening), and the day a
 * guest-powered product exists for.
 */
export const MOMENT: Control = {
  id: "moment",
  label: "The day",
  options: [
    { id: "before", label: "A week before" },
    { id: "night", label: "On the night" },
    { id: "after", label: "The morning after" },
  ],
  default: "night",
};

export type MomentId = "before" | "night" | "after";

export const momentOf = (v: unknown): MomentId =>
  v === "before" ? "before" : v === "after" ? "after" : "night";

/**
 * ★ A LAPTOP FIRST, A PHONE ON THE KNOB. Forty events are managed at a desk,
 * and the redesign is judged there first; the same page in a hand is one
 * press away, because a host on the night opens it from a phone.
 */
export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export type ScreenId = "1440" | "375";

export const SCREENS: Record<ScreenId, { w: number; h: number }> = {
  "1440": { w: 1440, h: 900 },
  "375": { w: 375, h: 812 },
};

export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";
