import { describe, expect, it } from "vitest";

import { choiceOf, EDGE_IDS, RECOMMENDED, ROOM_IDS, SYSTEM_IDS } from "./model";
import { sheetFor } from "./sheet";
import { EDGE_CSS } from "./sheet/edge";
import { ROOM_CSS } from "./sheet/room";
import { SYSTEM_CSS } from "./sheet/system";
import { IDENTITY } from "./spec";

/**
 * THE BOARD HOLDS TOGETHER: what the spec asks, what the frames draw and what
 * the sheets style are one set of ids, and the sheets style atoms alone, with
 * the corners only ever as a focus mark.
 */
const ASKS = {
  system: { ids: SYSTEM_IDS, css: SYSTEM_CSS },
  room: { ids: ROOM_IDS, css: ROOM_CSS },
  edge: { ids: EDGE_IDS, css: EDGE_CSS },
} as const;

/** Every identity the board can draw. */
const EVERY = SYSTEM_IDS.flatMap((system) =>
  ROOM_IDS.flatMap((room) =>
    EDGE_IDS.map((edge) => sheetFor({ system, room, edge })),
  ),
);

/** A stylesheet's flat rules, `selector { body }` (a keyframe's steps come along, harmlessly). */
const rulesOf = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));

/** A rule that answers focus: the real pseudo-class or the specimen's pinned twin. */
const ANSWERS_FOCUS = /focus-visible|data-demo~="focus"/;

describe("the identity board", () => {
  it("draws every option the spec asks, and recommends what the frames wear", () => {
    for (const [ask, { ids, css }] of Object.entries(ASKS)) {
      const spec = IDENTITY.asks.find((a) => a.id === ask);
      expect(spec, `the spec asks no "${ask}"`).toBeTruthy();
      expect(
        spec!.options.map((o) => (typeof o === "string" ? o : o.id)),
      ).toEqual([...ids]);
      expect(Object.keys(css).sort()).toEqual([...ids].sort());
      // A frame wears the recommendation for an answer not yet held, so the two agree.
      expect(spec!.recommended).toBe(RECOMMENDED[ask as keyof typeof ASKS]);
    }
  });

  it("draws the edge on the room's answer", () => {
    const edge = IDENTITY.asks.find((a) => a.id === "edge");
    expect(edge?.after).toEqual({ ask: "room" });
  });

  it("reads a choice from anything, a part at a time", () => {
    expect(choiceOf({})).toEqual(RECOMMENDED);
    expect(choiceOf({ system: "ink", room: "nonsense" })).toEqual({
      ...RECOMMENDED,
      system: "ink",
    });
  });

  /**
   * ★ THE SHEET STYLES ATOMS ONLY (the brief): a screen's own part is handed
   * the atom it becomes in the scene (`scene/adopt.ts`), never named by the
   * sheet, so the wiring at the source never inherits a dead selector. r1's
   * sheet named three screen parts by their ARIA labels; this keeps them out.
   */
  it("names no screen part, only atoms", () => {
    for (const css of EVERY) {
      expect(css).not.toMatch(/aria-label/);
      expect(css).not.toMatch(
        /data-(door|code-door|checklist|review|guest|settings|eh)\b/,
      );
    }
  });

  /**
   * ★ THE CORNERS ONLY AS A FOCUS MARK (Will, identity r2: "the corners
   * options here is what inspired my 'not devtool ish' comment ...
   * particularly the corners and loading state, so exclude that moving
   * forward"; "don't mind using the viewfinder corners for focus only"). The
   * marks are painted in `--m-c` and nothing else (`marks.ts`), so a rule that
   * inks them must either answer focus or keep them hidden (the lock at rest),
   * and no loading state moves them.
   */
  it("inks the corner marks only for focus, and never to show loading", () => {
    for (const css of EVERY) {
      for (const { selector, body } of rulesOf(css)) {
        const ink = /--m-c:\s*([^;]+);/.exec(body)?.[1].trim();
        if (!ink || ink === "transparent") continue;
        const hidden = /opacity:\s*0\s*;/.test(body);
        expect(
          ANSWERS_FOCUS.test(selector) || hidden,
          `"${selector}" draws the corner marks outside focus`,
        ).toBe(true);
        expect(selector, "a loading state moves the marks").not.toMatch(
          /aria-busy/,
        );
      }
      expect(css, "the autofocus hunt is back").not.toMatch(/vf-hunt/);
    }
  });

  /**
   * ★ ONE FOCUS MARK PER SYSTEM (his note: "some focuses rings, some corners,
   * which is bad"): keys and wells lock with the corners and draw no ring;
   * rings and ink never draw the corners.
   */
  it("gives each system one focus mark across its actions and fields", () => {
    for (const { selector, body } of rulesOf(SYSTEM_CSS.keys))
      if (ANSWERS_FOCUS.test(selector))
        expect(
          body,
          `keys' "${selector}" draws a ring where the lock belongs`,
        ).not.toMatch(/outline-color|outline:\s*[\d.]+px solid/);
    expect(SYSTEM_CSS.rings).not.toMatch(/--m-c/);
    expect(SYSTEM_CSS.ink).not.toMatch(/--m-c/);
    expect(SYSTEM_CSS.ink).not.toMatch(/outline-color/);
  });
});
