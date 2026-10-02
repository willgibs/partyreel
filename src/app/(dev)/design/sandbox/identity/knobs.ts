import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S TWO KNOBS, AS PURE DATA: split from the drawings so `spec.ts`
 * can declare them without importing React into a module the registry hands
 * to a server page.
 *
 * ★ THE SPECIMEN FIRST. A family is judged as a sum, and the specimen is the
 * sum laid out: every atom, in its states, on one sheet. The three screens are
 * where the sum is proved on production, one press away. Every frame of both
 * comes at 1440 and at 375.
 */
export const SHOW: Control = {
  id: "show",
  label: "Show",
  options: [
    { id: "specimen", label: "The specimen" },
    { id: "screens", label: "Three screens" },
  ],
  default: "specimen",
};

export type ShowId = "specimen" | "screens";

export const showOf = (v: unknown): ShowId =>
  v === "screens" ? "screens" : "specimen";

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

export const screenOf = (v: unknown): ScreenId =>
  v === "375" ? "375" : "1440";
