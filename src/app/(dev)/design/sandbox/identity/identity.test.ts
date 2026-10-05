import { describe, expect, it } from "vitest";

import { optionId } from "@/components/lab";

import {
  type AskId,
  choiceOf,
  LOADING_IDS,
  OPTIONS,
  RECOMMENDED,
  SET_IDS,
} from "./model";
import { SET_CSS, sheetFor, WORKING_CSS } from "./sheet";
import { BASE_CSS } from "./sheet/base";
import { CALLS_CSS } from "./sheet/calls";
import { SETTLED_CSS } from "./sheet/settled";
import { IDENTITY } from "./spec";

/**
 * THE BOARD HOLDS TOGETHER: what the spec asks, what the frames draw and what
 * the sheets style are one set of ids; the sheets style atoms alone; every
 * set draws every family on the shared boxes; the layers compose rather than
 * overwrite one another; and a working key keeps its words, never on a track.
 */

const named = (prefix: string, sheets: Record<string, string>) =>
  Object.entries(sheets).map(([id, css]) => ({ name: `${prefix}.${id}`, css }));

/** Every sheet, by name. */
const EVERY_SHEET: { name: string; css: string }[] = [
  { name: "base", css: BASE_CSS },
  { name: "settled", css: SETTLED_CSS },
  { name: "calls", css: CALLS_CSS },
  ...named("set", SET_CSS),
  ...named("loading", WORKING_CSS),
];

/** A stylesheet's flat rules, `selector { body }` (a keyframe's steps come along, harmlessly). */
const rulesOf = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));

/** A selector list's parts, split on the commas outside any parentheses. */
const partsOf = (selector: string) => selector.split(/,(?![^(]*\))/);

/** A part's last compound: the element the rule actually styles. */
const subjectOf = (part: string) =>
  part
    .trim()
    .split(/\s+(?![^(]*\))|>|~|\+/)
    .pop() ?? "";

/** The hooks of the atoms the sets compose on (`states.ts`'s ATOMS). */
const ATOM_HOOK =
  /\[data-variant\]\[data-size\]|toggle-group-item|data-slot="(input|textarea|select-trigger|switch|checkbox|radio-group-item|slider-thumb|radio-card|tabs-trigger|shutter|code-chip)"\]/;

describe("the identity board", () => {
  it("draws every option the spec asks, and recommends what the frames wear", () => {
    for (const ask of Object.keys(OPTIONS) as AskId[]) {
      const spec = IDENTITY.asks.find((a) => a.id === ask);
      expect(spec, `the spec asks no "${ask}"`).toBeTruthy();
      expect(spec!.options.map(optionId)).toEqual([...OPTIONS[ask]]);
      // A frame wears the recommendation for an answer not yet held, so the two agree.
      expect(spec!.recommended).toBe(RECOMMENDED[ask]);
    }
    expect(IDENTITY.asks.map((a) => a.id)).toEqual(Object.keys(OPTIONS));
    expect(Object.keys(SET_CSS).sort()).toEqual([...SET_IDS].sort());
    expect(Object.keys(WORKING_CSS).sort()).toEqual([...LOADING_IDS].sort());
  });

  it("reads a choice from anything, a part at a time", () => {
    expect(choiceOf({})).toEqual(RECOMMENDED);
    expect(choiceOf({ set: "tone", loading: "nonsense" })).toEqual({
      ...RECOMMENDED,
      set: "tone",
    });
  });

  it("lays the base, the set, his picks and working in that order", () => {
    for (const set of SET_IDS)
      for (const loading of LOADING_IDS) {
        const css = sheetFor({ set, loading });
        const seen = [
          BASE_CSS,
          SET_CSS[set],
          SETTLED_CSS,
          WORKING_CSS[loading],
        ].map((part) => css.indexOf(part));
        expect(
          seen.every((i) => i >= 0),
          `${set}/${loading} leaves a part out`,
        ).toBe(true);
        expect([...seen].sort((a, b) => a - b)).toEqual(seen);
      }
  });

  /**
   * ★ THE SHEET STYLES ATOMS ONLY: a screen's own part is handed the atom it
   * becomes in the scene (`scene/adopt.ts`), never named by a sheet, so the
   * wiring at the source never inherits a dead selector.
   */
  it("names no screen part, only atoms", () => {
    for (const { name, css } of EVERY_SHEET) {
      expect(css, name).not.toMatch(/aria-label/);
      expect(css, name).not.toMatch(
        /data-(door|code-door|checklist|review|guest|settings|eh|room|look)\b/,
      );
    }
  });

  /**
   * ★ A SET IS WHOLE (Will, r4: "so I can select a polished set that works
   * best together rather than pick & choose across styles"): every set draws
   * every family, so no frame wears one set's field beside production's
   * button.
   */
  it("draws every family in every set", () => {
    const families = [
      /data-slot="input"/,
      /data-variant="default"/,
      /data-variant="outline"/,
      /data-variant="ghost"/,
      /data-variant="destructive"/,
      /toggle-group-item"\]:is\(\[data-state="on"\]/,
      /data-slot="radio-card"\]:is\(\[data-state="on"\],\[data-state="checked"\]\)/,
      /data-slot="switch"\]:is\(\[data-state="checked"\],\[data-checked\]\)/,
      /data-slot="checkbox"\]\[data-state="checked"\]/,
      /data-slot="radio-group-item"\]\[data-state="checked"\]/,
      /data-slot="slider-thumb"/,
      /data-variant="on-photo"/,
    ];
    for (const [set, css] of Object.entries(SET_CSS))
      for (const family of families)
        expect(css, `set.${set} leaves ${family} to production`).toMatch(
          family,
        );
  });

  /**
   * ★ THE SETS SHARE EVERY BOX (the brief: "differing in a few load-bearing
   * constructions and sharing everything else"): a set builds a part and
   * never moves it, so a screen lays out alike in all four. Heights, widths,
   * paddings and corners on an atom are `base.ts`'s alone.
   */
  it("never lets a set move an atom's box", () => {
    for (const [set, css] of Object.entries(SET_CSS))
      for (const { selector, body } of rulesOf(css)) {
        if (!/(^|[;\s])(height|width|min-height|padding[a-z-]*|border-radius)\s*:/.test(body))
          continue;
        for (const part of partsOf(selector)) {
          const subject = subjectOf(part);
          if (/::/.test(subject)) continue;
          expect(
            ATOM_HOOK.test(subject),
            `set.${set}: "${part.trim()}" moves an atom's box`,
          ).toBe(false);
        }
      }
  });

  /**
   * ★ THE LAYERS COMPOSE (`states.ts`): a box-shadow, a translate or a scale
   * on an atom is one property a set, a press and the halo would each take
   * whole, so each writes its own layer into its variable and `base.ts` alone
   * draws the property. A sheet that wrote one outright would wipe every other
   * layer on that atom (a press would take the halo with it).
   */
  it("lets only the composition draw an atom's shadow, travel and scale", () => {
    for (const { name, css } of EVERY_SHEET) {
      if (name === "base") continue;
      for (const { selector, body } of rulesOf(css)) {
        if (!/(^|[;\s])(box-shadow|translate|scale)\s*:/.test(body)) continue;
        for (const part of partsOf(selector)) {
          const subject = subjectOf(part);
          if (/::/.test(subject)) continue;
          expect(
            ATOM_HOOK.test(subject),
            `${name}: "${part.trim()}" draws an atom's shadow, travel or scale outright; write its --i-* layer`,
          ).toBe(false);
        }
      }
    }
  });

  /**
   * ★ A WORKING KEY KEEPS ITS WORDS, AND NEVER WEARS A TRACK (Will, r4: "the
   * track filling is easy to miss as a quick swipe across the bottom of the
   * button"; "Three lights feels unnatural in the button"). Every working
   * state draws on the key's own `::before` (or a field's status slot and
   * wrapper), never on the key's face, and never hides its words.
   */
  it("draws working beside a key's words, never on its face or over its words", () => {
    for (const [loading, css] of Object.entries(WORKING_CSS))
      for (const { selector, body } of rulesOf(css)) {
        if (!/aria-busy/.test(selector)) continue;
        for (const part of partsOf(selector)) {
          const subject = subjectOf(part);
          if (/::|field-status|> \*|svg/.test(part)) continue;
          if (!ATOM_HOOK.test(subject)) continue;
          expect(
            body,
            `loading.${loading}: "${part.trim()}" paints the key's face`,
          ).not.toMatch(/background/);
          expect(
            body,
            `loading.${loading}: "${part.trim()}" hides the key's words`,
          ).not.toMatch(/color:\s*transparent|font-size:\s*0|opacity:\s*0[;\s]/);
        }
      }
    for (const [loading, css] of Object.entries(WORKING_CSS)) {
      expect(css, `loading.${loading} breathes three lights`).not.toMatch(
        /radial-gradient\(circle/,
      );
    }
  });
});
