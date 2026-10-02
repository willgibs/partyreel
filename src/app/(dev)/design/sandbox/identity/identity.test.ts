import { describe, expect, it } from "vitest";

import {
  ACTIONS_IDS,
  choiceOf,
  FIELDS_IDS,
  LAYERS_IDS,
  RECOMMENDED,
  STATUS_IDS,
  VOICE_IDS,
} from "./model";
import { sheetFor } from "./sheet";
import { ACTIONS_CSS } from "./sheet/actions";
import { FIELDS_CSS } from "./sheet/fields";
import { LAYERS_CSS } from "./sheet/layers";
import { STATUS_CSS } from "./sheet/status";
import { VOICE_CSS } from "./sheet/voice";
import { IDENTITY } from "./spec";

/**
 * THE BOARD HOLDS TOGETHER: what the spec asks, what the frames draw and what
 * the sheets style are one set of ids, and the sheets style atoms alone.
 */
const ASKS = {
  voice: { ids: VOICE_IDS, css: VOICE_CSS },
  actions: { ids: ACTIONS_IDS, css: ACTIONS_CSS },
  fields: { ids: FIELDS_IDS, css: FIELDS_CSS },
  layers: { ids: LAYERS_IDS, css: LAYERS_CSS },
  status: { ids: STATUS_IDS, css: STATUS_CSS },
} as const;

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

  it("stages every atom group behind the voice", () => {
    for (const a of IDENTITY.asks.filter((x) => x.id !== "voice"))
      expect(a.after, `${a.id} waits on the voice`).toEqual({ ask: "voice" });
  });

  it("reads a choice from anything, a part at a time", () => {
    expect(choiceOf({})).toEqual(RECOMMENDED);
    expect(choiceOf({ voice: "instrument", fields: "nonsense" })).toEqual({
      ...RECOMMENDED,
      voice: "instrument",
    });
  });

  /**
   * ★ THE SHEET STYLES ATOMS ONLY (the brief): a screen's own part is handed
   * the atom it becomes in the scene (`scene/adopt.ts`), never named by the
   * sheet, so the wiring at the source never inherits a dead selector. r1's
   * sheet named three screen parts by their ARIA labels; this keeps them out.
   */
  it("names no screen part, only atoms", () => {
    const every = VOICE_IDS.flatMap((voice) =>
      ACTIONS_IDS.flatMap((actions) =>
        FIELDS_IDS.map((fields) =>
          sheetFor({ ...RECOMMENDED, voice, actions, fields }),
        ),
      ),
    ).concat(
      LAYERS_IDS.flatMap((layers) =>
        STATUS_IDS.map((status) =>
          sheetFor({ ...RECOMMENDED, layers, status }),
        ),
      ),
    );
    for (const css of every) {
      expect(css).not.toMatch(/aria-label/);
      expect(css).not.toMatch(
        /data-(door|code-door|checklist|review|guest|settings|eh)\b/,
      );
    }
  });
});
