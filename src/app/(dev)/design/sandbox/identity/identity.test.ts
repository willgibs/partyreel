import { describe, expect, it } from "vitest";

import { optionId } from "@/components/lab";

import { type AskId, choiceOf, OPTIONS, RECOMMENDED } from "./model";
import { sheetFor, SHEETS_BY_ASK } from "./sheet";
import { BASE_CSS } from "./sheet/base";
import { CALLS_CSS } from "./sheet/calls";
import { ROOM_CSS } from "./sheet/room";
import { IDENTITY } from "./spec";

/**
 * THE BOARD HOLDS TOGETHER: what the spec asks, what the frames draw and what
 * the sheets style are one set of ids; the sheets style atoms alone; the
 * viewfinder's corners appear only as the r3 focus mark; and the seven traits
 * compose rather than overwrite one another.
 */

/** Every option's sheet, each with its ask and option, plus what every mix shares. */
const EVERY_SHEET: { name: string; css: string }[] = [
  { name: "base", css: BASE_CSS },
  { name: "room", css: ROOM_CSS },
  { name: "calls", css: CALLS_CSS },
  ...(Object.keys(SHEETS_BY_ASK) as AskId[]).flatMap((ask) =>
    Object.entries(SHEETS_BY_ASK[ask] as Record<string, string>).map(
      ([option, css]) => ({ name: `${ask}.${option}`, css }),
    ),
  ),
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

/** A rule that answers focus: the real pseudo-class or the specimen's pinned twin. */
const ANSWERS_FOCUS = /focus-visible|data-demo~="focus"/;

/** The hooks of the atoms the traits compose on (`states.ts`'s ATOMS). */
const ATOM_HOOK =
  /\[data-variant\]\[data-size\]|toggle-group-item|data-slot="(input|textarea|select-trigger|switch|checkbox|radio-group-item|slider-thumb|radio-card|tabs-trigger|shutter|code-chip)"\]/;

describe("the identity board", () => {
  it("draws every option the spec asks, and recommends what the frames wear", () => {
    for (const ask of Object.keys(OPTIONS) as AskId[]) {
      const spec = IDENTITY.asks.find((a) => a.id === ask);
      expect(spec, `the spec asks no "${ask}"`).toBeTruthy();
      expect(spec!.options.map(optionId)).toEqual([...OPTIONS[ask]]);
      expect(Object.keys(SHEETS_BY_ASK[ask]).sort()).toEqual(
        [...OPTIONS[ask]].sort(),
      );
      // A frame wears the recommendation for an answer not yet held, so the two agree.
      expect(spec!.recommended).toBe(RECOMMENDED[ask]);
    }
    expect(IDENTITY.asks.map((a) => a.id).sort()).toEqual(
      Object.keys(OPTIONS).sort(),
    );
  });

  it("reads a choice from anything, a part at a time", () => {
    expect(choiceOf({})).toEqual(RECOMMENDED);
    expect(choiceOf({ field: "tone", button: "nonsense" })).toEqual({
      ...RECOMMENDED,
      field: "tone",
    });
  });

  it("lays every pick into one sheet, in the composition's order", () => {
    const css = sheetFor(RECOMMENDED);
    const at = (ask: AskId) =>
      css.indexOf(SHEETS_BY_ASK[ask][RECOMMENDED[ask] as never]);
    // Body first, then toggles, chosen, press, working, focus: the later, more
    // transient state wins a plain property both write (`sheet/index.ts`).
    const order: AskId[] = [
      "field",
      "button",
      "toggles",
      "selected",
      "press",
      "loading",
      "focus",
      "edge",
    ];
    const seen = order.map(at);
    expect(seen.every((i) => i >= 0)).toBe(true);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });

  /**
   * ★ THE SHEET STYLES ATOMS ONLY (the brief): a screen's own part is handed
   * the atom it becomes in the scene (`scene/adopt.ts`), never named by the
   * sheet, so the wiring at the source never inherits a dead selector. r1's
   * sheet named three screen parts by their ARIA labels; this keeps them out.
   */
  it("names no screen part, only atoms", () => {
    for (const { name, css } of EVERY_SHEET) {
      expect(css, name).not.toMatch(/aria-label/);
      expect(css, name).not.toMatch(
        /data-(door|code-door|checklist|review|guest|settings|eh|room)\b/,
      );
    }
  });

  /**
   * ★ THE CORNERS ONLY AS A FOCUS MARK, AND ONLY IN THE R3 MARK (Will, r2:
   * "the corners options here is what inspired my 'not devtool ish' comment
   * ... particularly the corners and loading state, so exclude that moving
   * forward"; r3: "far from sold on the viewfinder focus"). The marks are
   * painted in `--m-c` and nothing else (`marks.ts`), so a rule that inks them
   * must answer focus or keep them hidden (the lock at rest), no working state
   * moves them, and no sheet but the r3 mark draws them at all.
   */
  it("inks the corner marks only for focus, only in the r3 mark, never to show working", () => {
    for (const { name, css } of EVERY_SHEET) {
      for (const { selector, body } of rulesOf(css)) {
        const ink = /--m-c:\s*([^;]+);/.exec(body)?.[1].trim();
        if (!ink || ink === "transparent") continue;
        expect(name, `${name} draws the corner marks`).toBe("focus.corners");
        const hidden = /opacity:\s*0\s*;/.test(body);
        expect(
          ANSWERS_FOCUS.test(selector) || hidden,
          `"${selector}" draws the corner marks outside focus`,
        ).toBe(true);
        expect(selector, "a working state moves the marks").not.toMatch(
          /aria-busy/,
        );
      }
      expect(css, "the autofocus hunt is back").not.toMatch(/vf-hunt/);
    }
  });

  /**
   * ★ ONE FOCUS MARK ON EVERYTHING (his r2 note: "some focuses rings, some
   * corners, which is bad"): every focus option answers focus on a key, a
   * field, a switch, a check, a radio, a slider's thumb and a tab, so no
   * control is left to production's own ring beside the mark he picked.
   */
  it("gives every focus option one mark across every control", () => {
    const kinds = [
      /\[data-variant\]\[data-size\]/,
      /data-slot="input"/,
      /data-slot="switch"/,
      /data-slot="checkbox"/,
      /data-slot="radio-group-item"/,
      /data-slot="slider-thumb"/,
      /data-slot="tabs-trigger"/,
    ];
    for (const [option, css] of Object.entries(SHEETS_BY_ASK.focus)) {
      const focused = rulesOf(css)
        .filter((r) => ANSWERS_FOCUS.test(r.selector))
        .map((r) => r.selector)
        .join(" ");
      for (const kind of kinds)
        expect(focused, `focus.${option} leaves ${kind} unmarked`).toMatch(
          kind,
        );
    }
  });

  /**
   * ★ THE TRAITS COMPOSE (`states.ts`): a box-shadow, a translate or a scale on
   * an atom is one property seven sheets would each take whole, so a trait
   * writes its own layer into its variable and `base.ts` alone draws the
   * property. A trait that wrote one outright would wipe every other trait's
   * layer on that atom (a press would take the focus mark with it).
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
});
