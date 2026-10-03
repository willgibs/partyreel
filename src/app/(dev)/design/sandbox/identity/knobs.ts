import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the drawings so `spec.ts` can
 * declare them without importing React into a module the registry hands to a
 * server page.
 *
 * ★ IN USE FIRST (Will: "including a couple in UI examples to get a feel for
 * both in use"). The system is shown on a real screen by default, caught in
 * use, and its atoms in every state are one press away; the room and the edge
 * open on the sheet of every pop-out and surface, paper beside the room, and
 * their screens are one press away, in the room. Every frame comes at 1440
 * and at 375; Ground picks the system's screens' one (a desk's sheet draws
 * both).
 *
 * ★ ONE PLACES KNOB PER ASK, EACH UNDER ITS OWN ID AND NAME (Show, At night,
 * Lit): the three ask about different things, so each shows its own places,
 * and the kit refuses two different knobs under one id (`exploration.ts`).
 */
export const SHOW: Control = {
  id: "show",
  label: "Show",
  options: [
    { id: "account", label: "Account and billing" },
    { id: "door", label: "Settings' door" },
    { id: "gate", label: "The guest's door" },
    { id: "actions", label: "Every action" },
    { id: "fields", label: "Every field" },
  ],
  default: "account",
};

export const SHOW_IDS = [
  "account",
  "door",
  "gate",
  "actions",
  "fields",
] as const;
export type ShowId = (typeof SHOW_IDS)[number];
export const showOf = (v: unknown): ShowId =>
  (SHOW_IDS as readonly unknown[]).includes(v) ? (v as ShowId) : "account";

/** The room's places: every pop-out (paper beside it), the guest's Add at night, a host's menu. */
export const NIGHT: Control = {
  id: "night",
  label: "At night",
  options: [
    { id: "layers", label: "Every pop-out" },
    { id: "add", label: "The guest's Add" },
    { id: "menu", label: "A host's menu" },
  ],
  default: "layers",
};

export const NIGHT_IDS = ["layers", "add", "menu"] as const;
export type NightId = (typeof NIGHT_IDS)[number];
export const nightOf = (v: unknown): NightId =>
  (NIGHT_IDS as readonly unknown[]).includes(v) ? (v as NightId) : "layers";

/**
 * The edge's places, both in the room (a light surface takes no edge, so paper
 * has only the display's pop-outs to show, and the sheet draws those beside
 * the room): every surface with its loupes, and a host's menu over Account's
 * cards. ★ ONE PIXEL NEEDS ITS SCALE: a whole screen at a desk is drawn at
 * about half size on a step, where an edge is under a pixel, so the loupes
 * carry the comparison and the screen its overall feel (`lab:demo` read the
 * guest's Add at 1440 as one picture under all three, and it left).
 */
export const LIT: Control = {
  id: "lit",
  label: "Lit",
  options: [
    { id: "layers", label: "Every surface" },
    { id: "menu", label: "A host's menu" },
  ],
  default: "layers",
};

export const LIT_IDS = ["layers", "menu"] as const;
export type LitId = (typeof LIT_IDS)[number];
export const litOf = (v: unknown): LitId =>
  (LIT_IDS as readonly unknown[]).includes(v) ? (v as LitId) : "layers";

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
