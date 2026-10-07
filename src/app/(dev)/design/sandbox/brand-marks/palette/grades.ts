import { EMBER } from "../icon/light";

/**
 * THE GRADES ON THE TABLE, AS TOKENS PRODUCTION CAN WEAR (`globals.css`'s own
 * names): the room's blacks (`.dark`), the media well (`--gallery`), the plate
 * a piece of the room is made of on paper (the slab, `.surface-ink`, which the
 * foot already wears), paper's whites and its ink (`:root`), the lines, the
 * display on each ground, and the ember's four stops, with the five house
 * lamps relit as the ember at their source (the board's carried call, every
 * grade alike).
 *
 * ★ A GRADE IS ONE PASTE: each block below is exactly what `globals.css`
 * would say, so a frame wearing it is production as that answer lands.
 * Graphite IS production's grade (its paste adds the ember and nothing else),
 * which is what lets the other two be judged against what is built.
 *
 * ★ EVERY TEXT STEP KEEPS ITS FLOOR: the third step (`--faint`) clears 4.5:1
 * on its ground in every grade (`grades.test.ts` reads each pair).
 */

export type GradeId = "graphite" | "black" | "warm";

/** A colour as `oklch()`, the value `globals.css` writes. */
const ok = (l: number, c: number, h: number, a?: number) =>
  `oklch(${l} ${c} ${h}${a === undefined ? "" : ` / ${a}%`})`;

export type Ground = {
  readonly background: string;
  readonly card: string;
  readonly popover: string;
  readonly secondary: string;
  readonly muted: string;
  readonly accent: string;
  readonly foreground: string;
  readonly mutedForeground: string;
  readonly faint: string;
  readonly border: string;
  readonly input: string;
  readonly display: string;
  readonly displayStep: string;
};

export type Grade = {
  readonly id: GradeId;
  readonly paper: Ground;
  readonly room: Ground;
  /** The media well, the deepest dark (`--gallery`). */
  readonly well: string;
  /** A piece of the room on paper: the slab's ground (`.surface-ink`) and its card. */
  readonly plate: { readonly background: string; readonly card: string };
};

/** Production's own grade, value for value (globals.css, :root and .dark). */
const GRAPHITE: Grade = {
  id: "graphite",
  paper: {
    background: ok(0.972, 0.002, 286),
    card: ok(0.993, 0.001, 286),
    popover: ok(0.996, 0.001, 286),
    secondary: ok(0.93, 0.003, 286),
    muted: ok(0.948, 0.003, 286),
    accent: ok(0.912, 0.003, 286),
    foreground: ok(0.14, 0.004, 286),
    mutedForeground: ok(0.43, 0.006, 286),
    faint: ok(0.525, 0.006, 286),
    border: ok(0.14, 0.004, 286, 12),
    input: ok(0.14, 0.004, 286, 22),
    display: ok(0.165, 0.004, 286),
    displayStep: ok(0.235, 0.004, 286),
  },
  room: {
    background: ok(0.085, 0.003, 286),
    card: ok(0.15, 0.004, 286),
    popover: ok(0.175, 0.004, 286),
    secondary: ok(0.21, 0.004, 286),
    muted: ok(0.125, 0.004, 286),
    accent: ok(0.245, 0.004, 286),
    foreground: ok(0.97, 0.002, 286),
    mutedForeground: ok(0.71, 0.006, 286),
    faint: ok(0.59, 0.006, 286),
    border: ok(1, 0, 0, 10),
    input: ok(1, 0, 0, 18),
    display: ok(0.29, 0.005, 286),
    displayStep: ok(0.355, 0.005, 286),
  },
  well: ok(0.065, 0.0045, 286),
  plate: {
    background: ok(0.165, 0.0053, 286),
    card: ok(0.225, 0.006, 286),
  },
};

/**
 * CAMERA BLACK: every dark a step deeper and without hue (a camera body's
 * black, no blue in it), the plate the room's own black so a piece of the
 * room on paper is exactly the room, paper a hair whiter with a white card,
 * the ink and the lines neutral. Each text step is moved with its ground, so
 * the ladder keeps its spacing.
 */
const BLACK: Grade = {
  id: "black",
  paper: {
    background: ok(0.982, 0, 0),
    card: ok(1, 0, 0),
    popover: ok(1, 0, 0),
    secondary: ok(0.935, 0, 0),
    muted: ok(0.957, 0, 0),
    accent: ok(0.92, 0, 0),
    foreground: ok(0.13, 0, 0),
    mutedForeground: ok(0.42, 0, 0),
    faint: ok(0.515, 0, 0),
    border: ok(0.13, 0, 0, 12),
    input: ok(0.13, 0, 0, 22),
    display: ok(0.145, 0, 0),
    displayStep: ok(0.215, 0, 0),
  },
  room: {
    background: ok(0.06, 0, 0),
    card: ok(0.13, 0, 0),
    popover: ok(0.155, 0, 0),
    secondary: ok(0.19, 0, 0),
    muted: ok(0.1, 0, 0),
    accent: ok(0.225, 0, 0),
    foreground: ok(0.975, 0, 0),
    mutedForeground: ok(0.7, 0, 0),
    faint: ok(0.585, 0, 0),
    border: ok(1, 0, 0, 10),
    input: ok(1, 0, 0, 18),
    display: ok(0.27, 0, 0),
    displayStep: ok(0.335, 0, 0),
  },
  well: ok(0.04, 0, 0),
  plate: { background: ok(0.06, 0, 0), card: ok(0.13, 0, 0) },
};

/**
 * WARM DARK, THE EMBER'S ROOM: the room's blacks, its lines and its words
 * take a breath of the ember (hue 55, chroma under a hundredth: a warmth felt
 * beside graphite, never seen as brown on its own), the well and the plate
 * with them; paper stays production's gallery white.
 */
const WARM: Grade = {
  id: "warm",
  paper: GRAPHITE.paper,
  room: {
    background: ok(0.09, 0.0065, 55),
    card: ok(0.155, 0.008, 55),
    popover: ok(0.18, 0.008, 55),
    secondary: ok(0.215, 0.008, 55),
    muted: ok(0.13, 0.007, 55),
    accent: ok(0.25, 0.008, 55),
    foreground: ok(0.965, 0.008, 80),
    mutedForeground: ok(0.71, 0.014, 70),
    faint: ok(0.6, 0.012, 65),
    border: ok(0.97, 0.03, 80, 10),
    input: ok(0.97, 0.03, 80, 18),
    display: ok(0.29, 0.01, 55),
    displayStep: ok(0.355, 0.01, 55),
  },
  well: ok(0.07, 0.006, 55),
  plate: { background: ok(0.165, 0.009, 55), card: ok(0.225, 0.01, 55) },
};

export const GRADES: Record<GradeId, Grade> = {
  graphite: GRAPHITE,
  black: BLACK,
  warm: WARM,
};

export const gradeOf = (v: unknown): GradeId =>
  v === "black" || v === "warm" ? v : "graphite";

/** The ember's four stops, as tokens. */
export const EMBER_TOKENS = EMBER.map((s) => ok(s.l, s.c, s.h));

/**
 * The five house lamps relit as the ember (the carried call): spread along
 * its four stops, amber to the deep end, so every shipped lamp glows as one.
 */
export const LAMPS_AS_EMBER = [0, 0.25, 0.5, 0.75, 1].map((t) => {
  let i = 0;
  while (i < EMBER.length - 2 && t > EMBER[i + 1].t) i++;
  const A = EMBER[i];
  const B = EMBER[i + 1];
  const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)));
  const d = ((B.h - A.h + 540) % 360) - 180;
  return ok(
    Math.round((A.l + (B.l - A.l) * u) * 1000) / 1000,
    Math.round((A.c + (B.c - A.c) * u) * 1000) / 1000,
    Math.round(A.h + d * u),
  );
});

const block = (g: Ground) =>
  [
    `--background: ${g.background};`,
    `--card: ${g.card};`,
    `--popover: ${g.popover};`,
    `--secondary: ${g.secondary};`,
    `--muted: ${g.muted};`,
    `--accent: ${g.accent};`,
    `--foreground: ${g.foreground};`,
    `--card-foreground: ${g.foreground};`,
    `--popover-foreground: ${g.foreground};`,
    `--secondary-foreground: ${g.foreground};`,
    `--accent-foreground: ${g.foreground};`,
    `--primary: ${g.foreground};`,
    `--primary-foreground: ${g.background};`,
    `--brand: ${g.foreground};`,
    `--brand-foreground: ${g.background};`,
    `--ring: ${g.foreground};`,
    `--muted-foreground: ${g.mutedForeground};`,
    `--faint: ${g.faint};`,
    `--border: ${g.border};`,
    `--input: ${g.input};`,
    `--display: ${g.display};`,
    `--display-step: ${g.displayStep};`,
  ].join(" ");

/**
 * THE PASTE A FRAME WEARS: the grade's grounds where `globals.css` declares
 * them (paper on `:root` and `.surface-paper`, the room on `.dark`, the slab
 * on `.surface-ink`), the well, the ember's stops and the lamps relit. Every
 * alias a ground reads (`--primary`, `--brand`, `--ring`) is restated beside
 * what it aliases, since a `var()` in a custom property resolves where it is
 * declared.
 */
export function gradePaste(grade: Grade): string {
  const ember = EMBER_TOKENS.map((t, i) => `--ember-${i + 1}: ${t};`).join(" ");
  const lamps = LAMPS_AS_EMBER.map((t, i) => `--lamp-${i + 1}: ${t};`).join(
    " ",
  );
  const room = grade.room;
  return [
    `:root, .surface-paper { ${block(grade.paper)} --gallery: ${grade.well}; ${ember} ${lamps} }`,
    `.dark { ${block(room)} }`,
    `.surface-ink { --background: ${grade.plate.background}; --card: ${grade.plate.card}; --muted: ${grade.plate.card}; --primary-foreground: ${grade.plate.background}; --brand-foreground: ${grade.plate.background}; --foreground: ${room.foreground}; --card-foreground: ${room.foreground}; --muted-foreground: ${room.mutedForeground}; --faint: ${room.faint}; --border: ${room.border}; --input: ${room.input}; }`,
  ].join("\n");
}
