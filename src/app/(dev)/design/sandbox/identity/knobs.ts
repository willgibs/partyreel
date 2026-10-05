import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the drawings so `spec.ts` can
 * declare them without importing React into a module the registry hands to a
 * server page.
 *
 * ★ A TRAIT OPENS WHERE IT LIVES (Will, r2: "including a couple in UI
 * examples to get a feel for both in use"; r4's brief: every trait on real
 * screens, never specimens alone). Show's first place is each trait's own
 * screen, caught in its moment (a field typed in on Settings' dates, a key
 * held down at Create's foot, the door's Unlock working); the five real
 * screens and the two sheets of every state are one press away, each caught
 * in the same trait's moment.
 *
 * ★ PAPER AND THE ROOM SIDE BY SIDE, AT A PHONE, BY DEFAULT. A step draws the
 * whole option on the first screen: two phones stand at the same scale one
 * does (the stage is as tall as a phone allows, and two are narrower than the
 * room), so both grounds cost nothing; a laptop is one press away, one ground
 * at a time unless both are asked for.
 */
export const SHOW: Control = {
  id: "show",
  label: "Show",
  options: [
    { id: "home", label: "Its own screen" },
    { id: "settings", label: "Settings" },
    { id: "create", label: "Create" },
    { id: "add", label: "The Add" },
    { id: "door", label: "The door" },
    { id: "account", label: "Account" },
    { id: "actions", label: "Every action" },
    { id: "fields", label: "Every field" },
  ],
  default: "home",
};

export const SHOW_IDS = [
  "home",
  "settings",
  "create",
  "add",
  "door",
  "account",
  "actions",
  "fields",
] as const;
export type ShowId = (typeof SHOW_IDS)[number];
export const showOf = (v: unknown): ShowId =>
  (SHOW_IDS as readonly unknown[]).includes(v) ? (v as ShowId) : "home";

/**
 * THE EDGE'S NINE SCREENS (Will, r3: "Could you give me more real UI to see
 * examples of each? The host menu gives me exactly one instance"): every
 * place a layer stands over the page, each drawn on paper and in the room;
 * and a tenth, a new host's dashboard, where the carried call `hand-cards`
 * (A4) is seen (its teaser is lit in no option).
 */
export const LIT: Control = {
  id: "lit",
  label: "Lit",
  options: [
    { id: "dashboard", label: "The dashboard's Display" },
    { id: "settings", label: "Settings over the hub" },
    { id: "add", label: "The guest's Add" },
    { id: "confirm", label: "A delete confirm" },
    { id: "toasts", label: "Toasts over the album" },
    { id: "door", label: "The door's held sheet" },
    { id: "style", label: "The reel's Style menu" },
    { id: "menu", label: "The account menu" },
    { id: "tooltip", label: "A tooltip" },
    { id: "start", label: "A new host's dashboard" },
  ],
  default: "dashboard",
};

export const LIT_IDS = [
  "dashboard",
  "settings",
  "add",
  "confirm",
  "toasts",
  "door",
  "style",
  "menu",
  "tooltip",
  "start",
] as const;
export type LitId = (typeof LIT_IDS)[number];
export const litOf = (v: unknown): LitId =>
  (LIT_IDS as readonly unknown[]).includes(v) ? (v as LitId) : "dashboard";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export const screenOf = (v: unknown): 1440 | 375 => (v === "1440" ? 1440 : 375);

export const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "both", label: "Both" },
    { id: "paper", label: "Paper" },
    { id: "room", label: "Room" },
  ],
  default: "both",
};

export type GroundsId = "both" | "paper" | "room";
export const groundsOf = (v: unknown): GroundsId =>
  v === "paper" || v === "room" ? v : "both";
