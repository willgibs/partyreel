import { contrast, hex } from "@/lib/avatar/gradient";

import { EMBER } from "../icon/light";

/**
 * PRODUCTION'S GRADE, AS THE TOKENS IT WEARS, AND THE PLATE ON THE TABLE
 * (`globals.css`'s own names, block for block): paper (`:root,
 * .surface-paper`), the room (`.dark`), the mat, the slab a piece of the room
 * on paper is made of (`.surface-ink`, which the foot wears), the display's
 * screen on each ground (`--display*`), the media well (`--gallery*`), the
 * atoms' set (THE HOUSE SET'S GROUNDS), and the ember's four stops, with the
 * five house lamps relit as the ember at their source (the board's carried
 * call).
 *
 * ★ THE GRADE IS PRODUCTION'S, VALUE FOR VALUE (the carried call `grade`):
 * drawn as three grades (graphite, camera black, warm dark), production's
 * room stood the same in all three, its black already at the floor, so the
 * creative director's pass made the grade a call and asked the one visible
 * decision left: what the plate is, `lifted` (production's slab, the grade as
 * it stands) or the room's own black (`room`). `grades.test.ts` holds the
 * lifted paste to globals.css token for token.
 *
 * ★ A PASTE IS WHOLE: every token a ground declares that carries the grade is
 * restated in the block that declares it, so no part stands on a
 * half-changed ground (design-system.md's grounds: a token left out resolves
 * to the ground beneath), and the room's blocks restate every token paper's
 * do (a paste is adopted after every sheet, so a token declared on `:root`
 * alone would lay paper's value over the room on an `<html class="dark">`).
 *
 * ★ EVERY TEXT STEP KEEPS ITS FLOOR, by computation (`floors` below, read on
 * the sheet): `--faint` clears 4.5:1 on its ground and its card on either
 * plate, with `--muted-foreground` well above it; the one place under it is
 * production's own, the room's display under a held row.
 *
 * Two of production's literals are a grade's too and are not tokens: the
 * marketing sheet's body grounds (`marketing.css`, `body:has(...)`, restated
 * here) and the browser bar's tint (`themeColor` below: the root and cinema
 * layouts and the 404 write it as a hex).
 */

export type PlateId = "lifted" | "room";

/** A colour as `globals.css` writes it: `oklch(l c h)`, or with `a` an alpha in percent (a line). */
export type Tone = {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly a?: number;
};

const ok = (l: number, c: number, h: number, a?: number): Tone =>
  a === undefined ? { l, c, h } : { l, c, h, a };

/** The same colour at an alpha: a line is its ground's ink, or its white, at a few percent. */
const at = (t: Tone, a: number): Tone => ({ l: t.l, c: t.c, h: t.h, a });

/** The value as `globals.css` writes it. */
export const cssOf = (t: Tone) =>
  `oklch(${t.l} ${t.c} ${t.h}${t.a === undefined ? "" : ` / ${t.a}%`})`;

/** A ground's surfaces, its three inks and its lines (each ground block's own set). */
export type Ground = {
  readonly background: Tone;
  readonly muted: Tone;
  readonly card: Tone;
  readonly popover: Tone;
  readonly secondary: Tone;
  readonly accent: Tone;
  readonly foreground: Tone;
  readonly mutedForeground: Tone;
  readonly faint: Tone;
  /** The words on the ink key (`--primary` is the ground's ink). */
  readonly primaryForeground: Tone;
  readonly border: Tone;
  readonly input: Tone;
  /** The focus halo's bloom: the ink at an alpha on paper, a light on a dark ground. */
  readonly haloBloom: Tone;
};

/** The display's screen as one ground declares it (`--display*`). */
export type Screen = {
  readonly display: Tone;
  readonly step: Tone;
  readonly foreground: Tone;
  readonly muted: Tone;
  readonly faint: Tone;
  readonly edge: Tone;
  readonly input: Tone;
  readonly cursor: Tone;
  readonly light: Tone;
};

/** `.surface-mat`: paper's set-apart ground (declared, worn nowhere yet). */
export type Mat = {
  readonly background: Tone;
  readonly card: Tone;
  readonly popover: Tone;
  readonly muted: Tone;
  readonly secondary: Tone;
  readonly accent: Tone;
  readonly faint: Tone;
};

/** The media well and its words (`--gallery*`), the same on every ground. */
export type Gallery = {
  readonly well: Tone;
  readonly foreground: Tone;
  readonly muted: Tone;
  readonly border: Tone;
};

/**
 * The atoms' set (THE HOUSE SET'S GROUNDS): only the values that carry the
 * grade. Its `color-mix()` tokens read the ground's own ink and follow it.
 */
export type Atoms = {
  readonly paper: {
    readonly well: Tone;
    readonly wellIn: Tone;
    readonly wellRim: Tone;
    readonly wellRimUp: Tone;
    readonly keyLine: Tone;
    readonly keyLineUp: Tone;
    readonly afloatLine: Tone;
    readonly thumbSeam: Tone;
  };
  /** `.surface-ink, .dark`: one block for the slab and the room. */
  readonly dark: {
    readonly well: Tone;
    readonly wellIn: Tone;
    readonly wellRim: Tone;
    readonly wellRimUp: Tone;
    readonly wellLip: Tone;
    readonly keyLine: Tone;
    readonly keyLineUp: Tone;
    readonly afloatLine: Tone;
    readonly thumb: Tone;
    readonly thumbSeam: Tone;
  };
  /** `.surface-display`: its own literals (a chosen row's wash, the halo's bloom) and the atoms on it. */
  readonly screen: {
    readonly accent: Tone;
    readonly haloBloom: Tone;
    readonly wellRim: Tone;
    readonly wellRimUp: Tone;
    readonly wellLip: Tone;
    readonly keyLine: Tone;
    readonly keyLineUp: Tone;
    readonly thumb: Tone;
  };
};

export type Grade = {
  readonly id: PlateId;
  readonly paper: Ground;
  readonly room: Ground;
  /** A piece of the room on paper: the slab's ground (`.surface-ink`), the foot's and every leaf's. */
  readonly slab: Ground;
  readonly mat: Mat;
  readonly display: { readonly paper: Screen; readonly room: Screen };
  readonly gallery: Gallery;
  readonly atoms: Atoms;
};

/* ── GRAPHITE: production's grade, transcribed ───────────────────────────── */

/** A white at an alpha: the lines on a dark ground. */
const WHITE = ok(1, 0, 0);
const BLACK_INK = ok(0, 0, 0);

const G_PAPER_INK = ok(0.14, 0.004, 286);

/**
 * PRODUCTION'S OWN GRADE, VALUE FOR VALUE (globals.css: `:root,
 * .surface-paper`, `.dark`, `.surface-mat`, `.surface-ink`,
 * `.surface-display` and the house set's three blocks), and the `lifted`
 * plate. ★ Transcribed, never tuned: a change here is a change to what the
 * room's own black is judged against.
 */
const GRAPHITE: Grade = {
  id: "lifted",
  paper: {
    background: ok(0.972, 0.002, 286),
    muted: ok(0.948, 0.003, 286),
    card: ok(0.993, 0.001, 286),
    popover: ok(0.996, 0.001, 286),
    secondary: ok(0.93, 0.003, 286),
    accent: ok(0.912, 0.003, 286),
    foreground: G_PAPER_INK,
    mutedForeground: ok(0.43, 0.006, 286),
    faint: ok(0.525, 0.006, 286),
    primaryForeground: ok(0.985, 0.001, 286),
    border: at(G_PAPER_INK, 12),
    input: at(G_PAPER_INK, 22),
    haloBloom: at(G_PAPER_INK, 10),
  },
  room: {
    background: ok(0.085, 0.003, 286),
    muted: ok(0.125, 0.004, 286),
    card: ok(0.15, 0.004, 286),
    popover: ok(0.175, 0.004, 286),
    secondary: ok(0.21, 0.004, 286),
    accent: ok(0.245, 0.004, 286),
    foreground: ok(0.97, 0.002, 286),
    mutedForeground: ok(0.71, 0.006, 286),
    faint: ok(0.59, 0.006, 286),
    primaryForeground: ok(0.1, 0.003, 286),
    border: at(WHITE, 10),
    input: at(WHITE, 18),
    haloBloom: at(WHITE, 18),
  },
  slab: {
    background: ok(0.165, 0.0053, 286),
    muted: ok(0.225, 0.006, 286),
    card: ok(0.225, 0.006, 286),
    popover: ok(0.27, 0.006, 286),
    secondary: ok(0.315, 0.006, 286),
    accent: ok(0.315, 0.006, 286),
    foreground: ok(0.965, 0.0045, 286),
    mutedForeground: ok(0.715, 0.0105, 286),
    faint: ok(0.615, 0.0075, 286),
    primaryForeground: ok(0.165, 0.0053, 286),
    border: at(WHITE, 12),
    input: at(WHITE, 16),
    haloBloom: at(WHITE, 18),
  },
  mat: {
    background: ok(0.948, 0.003, 286),
    card: ok(0.993, 0.001, 286),
    popover: ok(0.996, 0.001, 286),
    muted: ok(0.93, 0.003, 286),
    secondary: ok(0.912, 0.003, 286),
    accent: ok(0.912, 0.003, 286),
    faint: ok(0.525, 0.006, 286),
  },
  display: {
    paper: {
      display: ok(0.165, 0.004, 286),
      step: ok(0.235, 0.004, 286),
      foreground: ok(0.975, 0.002, 286),
      muted: ok(0.72, 0.005, 286),
      faint: ok(0.62, 0.005, 286),
      edge: at(WHITE, 11),
      input: at(WHITE, 20),
      cursor: at(WHITE, 50),
      light: at(WHITE, 30),
    },
    room: {
      display: ok(0.29, 0.005, 286),
      step: ok(0.355, 0.005, 286),
      foreground: ok(0.975, 0.002, 286),
      muted: ok(0.77, 0.005, 286),
      faint: ok(0.68, 0.005, 286),
      edge: at(WHITE, 12),
      input: at(WHITE, 22),
      cursor: at(WHITE, 55),
      light: at(WHITE, 40),
    },
  },
  gallery: {
    well: ok(0.065, 0.0045, 286),
    foreground: ok(0.965, 0.0045, 286),
    muted: ok(0.715, 0.0105, 286),
    border: at(WHITE, 8),
  },
  atoms: {
    paper: {
      well: ok(0.955, 0.002, 286),
      wellIn: ok(0.985, 0.001, 286),
      wellRim: at(G_PAPER_INK, 8),
      wellRimUp: at(G_PAPER_INK, 15),
      keyLine: at(G_PAPER_INK, 15),
      keyLineUp: at(G_PAPER_INK, 24),
      afloatLine: at(G_PAPER_INK, 9),
      thumbSeam: at(G_PAPER_INK, 9),
    },
    dark: {
      well: ok(0.12, 0.003, 286),
      wellIn: ok(0.14, 0.003, 286),
      wellRim: at(WHITE, 7),
      wellRimUp: at(WHITE, 13),
      wellLip: at(WHITE, 7),
      keyLine: at(WHITE, 15),
      keyLineUp: at(WHITE, 24),
      afloatLine: at(BLACK_INK, 0),
      thumb: ok(0.96, 0.002, 286),
      thumbSeam: at(BLACK_INK, 35),
    },
    screen: {
      accent: at(WHITE, 9),
      haloBloom: at(WHITE, 15),
      wellRim: at(WHITE, 7),
      wellRimUp: at(WHITE, 14),
      wellLip: at(WHITE, 8),
      keyLine: at(WHITE, 16),
      keyLineUp: at(WHITE, 26),
      thumb: ok(0.96, 0.002, 286),
    },
  },
};

/* ── THE ROOM'S OWN BLACK, AS THE PLATE ───────────────────────────────────── */

/**
 * THE ROOM'S OWN BLACK AS THE PLATE: production's grade in every token but
 * the two a piece of the room on paper is made of. The slab (`.surface-ink`,
 * the foot's) takes the room's own ladder, and paper's display (a menu, a
 * toast, a select on a light page) the room's black with the room's dialog
 * for its held row, so each is a window onto the one room rather than an
 * object set on the page. The room itself, paper and every ink stay
 * graphite's, so the two options differ in that one thing.
 */
const ROOM_PLATE: Grade = {
  ...GRAPHITE,
  id: "room",
  slab: GRAPHITE.room,
  display: {
    paper: {
      ...GRAPHITE.display.paper,
      display: GRAPHITE.room.background,
      step: GRAPHITE.room.popover,
    },
    room: GRAPHITE.display.room,
  },
};

export const GRADES: Record<PlateId, Grade> = {
  lifted: GRAPHITE,
  room: ROOM_PLATE,
};

export const plateOf = (v: unknown): PlateId =>
  v === "room" ? "room" : "lifted";

/* ── THE EMBER AND THE LAMPS ─────────────────────────────────────────────── */

/** The ember's four stops, as tokens. */
export const EMBER_TOKENS = EMBER.map((s) => cssOf(ok(s.l, s.c, s.h)));

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
  return cssOf(
    ok(
      Math.round((A.l + (B.l - A.l) * u) * 1000) / 1000,
      Math.round((A.c + (B.c - A.c) * u) * 1000) / 1000,
      Math.round(A.h + d * u),
    ),
  );
});

/* ── THE PASTE ───────────────────────────────────────────────────────────── */

const decl = (name: string, t: Tone) => `--${name}: ${cssOf(t)};`;

/** A ground's block, in whole pairs: every foreground a part reads is the ground's ink. */
function groundDecls(g: Ground): string[] {
  const ink = g.foreground;
  return [
    decl("background", g.background),
    decl("foreground", ink),
    decl("card", g.card),
    decl("card-foreground", ink),
    decl("popover", g.popover),
    decl("popover-foreground", ink),
    decl("primary", ink),
    decl("primary-foreground", g.primaryForeground),
    decl("secondary", g.secondary),
    decl("secondary-foreground", ink),
    decl("muted", g.muted),
    decl("muted-foreground", g.mutedForeground),
    decl("faint", g.faint),
    decl("accent", g.accent),
    decl("accent-foreground", ink),
    decl("border", g.border),
    decl("input", g.input),
    decl("ring", ink),
    decl("halo-bloom", g.haloBloom),
    // Restated beside what they alias: a var() in a custom property resolves
    // where it is declared.
    "--brand: var(--primary);",
    "--brand-foreground: var(--primary-foreground);",
  ];
}

function screenDecls(s: Screen): string[] {
  return [
    decl("display", s.display),
    decl("display-step", s.step),
    decl("display-foreground", s.foreground),
    decl("display-muted", s.muted),
    decl("display-faint", s.faint),
    decl("display-edge", s.edge),
    decl("display-input", s.input),
    decl("display-cursor", s.cursor),
    decl("display-light", s.light),
  ];
}

const rule = (selector: string, decls: readonly string[]) =>
  `${selector} { ${decls.join(" ")} }`;

/**
 * THE PASTE A FRAME WEARS: the grade's blocks in globals.css's own order and
 * under its own selectors (so an ink leaf on a mat still wins, as there),
 * the ember's stops and the relit lamps beside the lamp set, and the
 * marketing sheet's two body grounds.
 */
export function gradePaste(grade: Grade): string {
  const { paper, room, slab, mat, display, gallery, atoms } = grade;
  const ember = EMBER_TOKENS.map((t, i) => `--ember-${i + 1}: ${t};`);
  const lamps = LAMPS_AS_EMBER.map((t, i) => `--lamp-${i + 1}: ${t};`);
  return [
    rule(":root, .surface-paper", [
      ...groundDecls(paper),
      ...screenDecls(display.paper),
      decl("gallery", gallery.well),
      decl("gallery-foreground", gallery.foreground),
      decl("gallery-muted", gallery.muted),
      decl("gallery-border", gallery.border),
      ...ember,
      ...lamps,
    ]),
    rule(".dark", [...groundDecls(room), ...screenDecls(display.room)]),
    rule(".surface-mat", [
      decl("background", mat.background),
      decl("card", mat.card),
      decl("popover", mat.popover),
      decl("muted", mat.muted),
      decl("secondary", mat.secondary),
      decl("accent", mat.accent),
      decl("faint", mat.faint),
    ]),
    rule(".surface-ink", groundDecls(slab)),
    rule(".surface-display", [
      decl("accent", atoms.screen.accent),
      decl("halo-bloom", atoms.screen.haloBloom),
    ]),
    rule(".surface-paper, :root", [
      decl("well", atoms.paper.well),
      decl("well-in", atoms.paper.wellIn),
      decl("well-rim", atoms.paper.wellRim),
      decl("well-rim-up", atoms.paper.wellRimUp),
      decl("key-line", atoms.paper.keyLine),
      decl("key-line-up", atoms.paper.keyLineUp),
      decl("afloat-line", atoms.paper.afloatLine),
      decl("thumb-seam", atoms.paper.thumbSeam),
    ]),
    rule(".surface-ink, .dark", [
      decl("well", atoms.dark.well),
      decl("well-in", atoms.dark.wellIn),
      decl("well-rim", atoms.dark.wellRim),
      decl("well-rim-up", atoms.dark.wellRimUp),
      decl("well-lip", atoms.dark.wellLip),
      decl("key-line", atoms.dark.keyLine),
      decl("key-line-up", atoms.dark.keyLineUp),
      decl("afloat-line", atoms.dark.afloatLine),
      decl("thumb", atoms.dark.thumb),
      decl("thumb-seam", atoms.dark.thumbSeam),
    ]),
    rule(".surface-display", [
      decl("well-rim", atoms.screen.wellRim),
      decl("well-rim-up", atoms.screen.wellRimUp),
      decl("well-lip", atoms.screen.wellLip),
      decl("key-line", atoms.screen.keyLine),
      decl("key-line-up", atoms.screen.keyLineUp),
      decl("thumb", atoms.screen.thumb),
    ]),
    `body:has([data-mkt-skin="cinema"]) { background: ${cssOf(room.background)}; }`,
    `body:has([data-mkt-skin="paper"]) { background: ${cssOf(paper.background)}; }`,
  ].join("\n");
}

/* ── WHAT A GRADE MEASURES ───────────────────────────────────────────────── */

/** WCAG's ratio between an ink and its ground (both opaque). */
export const ratio = (ink: Tone, ground: Tone) => contrast(ink, ground);

/** The browser bar's tint per ground: the sRGB of each body, as the layouts' `themeColor` writes it. */
export const themeColor = (g: Grade) => ({
  paper: hex(g.paper.background),
  room: hex(g.room.background),
});

/** One ground's three inks, read on one of its surfaces. */
export type Reading = {
  readonly where: string;
  readonly on: Tone;
  readonly ink: number;
  readonly muted: number;
  readonly faint: number;
};

const read = (
  where: string,
  on: Tone,
  inks: { foreground: Tone; muted: Tone; faint: Tone },
): Reading => ({
  where,
  on,
  ink: ratio(inks.foreground, on),
  muted: ratio(inks.muted, on),
  faint: ratio(inks.faint, on),
});

/**
 * EVERY FLOOR A GRADE MUST CLEAR, read where production reads it: the room
 * and paper on their body, their card and their dialog or mat, the slab on
 * itself and its card, the display on its screen and the step a held row
 * stands on, and the well's words. `--faint` at 4.5:1 is the floor; a
 * display's step in the room is the one place production lets it fall under
 * (globals.css says why: AA there would close the gap to the muted step).
 */
export function floors(g: Grade) {
  const inks = (x: Ground) => ({
    foreground: x.foreground,
    muted: x.mutedForeground,
    faint: x.faint,
  });
  return {
    room: read("the room", g.room.background, inks(g.room)),
    roomCard: read("a card in the room", g.room.card, inks(g.room)),
    roomDialog: read("a dialog in the room", g.room.popover, inks(g.room)),
    paper: read("paper", g.paper.background, inks(g.paper)),
    paperCard: read("a card on paper", g.paper.card, inks(g.paper)),
    mat: read("the mat", g.mat.background, {
      foreground: g.paper.foreground,
      muted: g.paper.mutedForeground,
      faint: g.mat.faint,
    }),
    slab: read("the slab", g.slab.background, inks(g.slab)),
    slabCard: read("a card on the slab", g.slab.card, inks(g.slab)),
    paperScreen: read(
      "the display on paper",
      g.display.paper.display,
      g.display.paper,
    ),
    paperScreenRow: read(
      "its held row, on paper",
      g.display.paper.step,
      g.display.paper,
    ),
    roomScreen: read(
      "the display in the room",
      g.display.room.display,
      g.display.room,
    ),
    roomScreenRow: read(
      "its held row, in the room",
      g.display.room.step,
      g.display.room,
    ),
    well: read("the well", g.gallery.well, {
      foreground: g.gallery.foreground,
      muted: g.gallery.muted,
      faint: g.gallery.muted,
    }),
  } as const satisfies Record<string, Reading>;
}
