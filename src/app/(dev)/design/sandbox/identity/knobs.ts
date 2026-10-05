import type { Control } from "@/components/lab/exploration";

/**
 * THE BOARD'S KNOBS, AS PURE DATA: split from the drawings so `spec.ts` can
 * declare them without importing React into a module the registry hands to a
 * server page.
 *
 * ★ A SET OPENS ON A COMPOSITE REAL SCREEN (the r5 brief: "Each option's
 * first frame is a composite real screen; its specimen sheet is one press
 * away"). Settings' door holds every family a set answers at once: a field
 * typed in, the ink key and the quietest Cancel, the segments and radio cards
 * that are chosen, a switch; at a desk it stands over the hub, whose album
 * toolbar is a row of quiet keys. The other five real screens and the two
 * sheets of every state are one press away.
 *
 * ★ PAPER AND THE ROOM SIDE BY SIDE, AT A PHONE, BY DEFAULT. Two phones stand
 * at the scale one does, so both grounds cost nothing; a laptop is one press
 * away, both grounds side by side unless one is asked for.
 */
export const SHOW: Control = {
  id: "show",
  label: "Show",
  options: [
    { id: "door", label: "Settings' door" },
    { id: "dates", label: "Settings' dates" },
    { id: "account", label: "Account" },
    { id: "create", label: "Create" },
    { id: "gate", label: "The guest's door" },
    { id: "album", label: "The album" },
    { id: "rows", label: "Settings' first page" },
    { id: "actions", label: "Every action" },
    { id: "fields", label: "Every field" },
  ],
  default: "door",
};

export const SHOW_IDS = [
  "door",
  "dates",
  "account",
  "create",
  "gate",
  "album",
  "rows",
  "actions",
  "fields",
] as const;
export type ShowId = (typeof SHOW_IDS)[number];
export const showOf = (v: unknown): ShowId =>
  (SHOW_IDS as readonly unknown[]).includes(v) ? (v as ShowId) : "door";

/**
 * WHERE A KEY IS SEEN WORKING (the loading ask): first the three it works on
 * side by side (a primary, a quiet key, a field checking what was typed),
 * each moving beside its still as reduced motion leaves it; then the real
 * screens where a wait happens, each caught working.
 */
export const WHERE: Control = {
  id: "where",
  label: "Where",
  options: [
    { id: "working", label: "All three, moving and still" },
    { id: "create", label: "Create's Continue" },
    { id: "gate", label: "The guest's Unlock" },
    { id: "account", label: "Account's Save" },
    { id: "door", label: "Settings' password" },
  ],
  default: "working",
};

export const WHERE_IDS = [
  "working",
  "create",
  "gate",
  "account",
  "door",
] as const;
export type WhereId = (typeof WHERE_IDS)[number];
export const whereOf = (v: unknown): WhereId =>
  (WHERE_IDS as readonly unknown[]).includes(v) ? (v as WhereId) : "working";

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
