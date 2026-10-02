import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S THREE KNOBS, AS PURE DATA: split from the drawings so `spec.ts`
 * can declare them without importing React into a module the registry hands
 * to a server page.
 *
 * ★ THE ATOMS FIRST. An option is judged on its atoms in every state, and
 * that sheet is the default; the real screens are where it is proved on
 * production, one press away, one screen at a time so each is drawn large.
 * Every frame comes at 1440 and at 375. An atom sheet draws paper and the
 * room side by side; Ground picks the screens' one.
 */
export const SHOW: Control = {
  id: "show",
  label: "Show",
  options: [
    { id: "atoms", label: "Atoms" },
    { id: "settings", label: "Settings" },
    { id: "add", label: "The Add" },
    { id: "account", label: "Account" },
    { id: "review", label: "Review" },
  ],
  default: "atoms",
};

export const SHOW_IDS = [
  "atoms",
  "settings",
  "add",
  "account",
  "review",
] as const;
export type ShowId = (typeof SHOW_IDS)[number];

export const showOf = (v: unknown): ShowId =>
  (SHOW_IDS as readonly unknown[]).includes(v) ? (v as ShowId) : "atoms";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export const screenOf = (v: unknown): 1440 | 375 => (v === "375" ? 375 : 1440);

export const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "room", label: "Room" },
    { id: "paper", label: "Paper" },
  ],
  default: "room",
};
