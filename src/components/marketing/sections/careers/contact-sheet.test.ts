/**
 * The contact sheet's derivations, pinned at the careers merge (2026-08-29).
 *
 * The round shipped ~2,900 lines with no tests, and these three facts are the
 * ones whose comments PROMISE they cannot rot while nothing enforces it. Each
 * failure mode below is silent by construction: the page still builds, still
 * renders, and just quietly stops making its argument.
 */
import { describe, expect, it } from "vitest";

import { isMarketingImageId } from "@/lib/constants/marketing-media";

import {
  HERO_SELECTS,
  ROLL_SELECTS,
} from "@/components/marketing/sections/careers/careers-story";
import { SHEET_FRAMES } from "@/components/marketing/sections/careers/contact-sheet";

/** The hero repeats the roll this many times (careers/page.tsx `repeat={3}`). */
const HERO_REPEAT = 3;

describe("the contact sheet's selects", () => {
  it("★ derives the roll's marks to a REAL frame, never to -1", () => {
    // ROLL_SELECTS is KEPT_FRAMES.map(id => SHEET_FRAMES.indexOf(id)), and the
    // comment on it says a literal index list "silently rots the moment
    // SHEET_FRAMES is reordered, and nothing would fail". True - but the
    // derivation has its own silent hole: indexOf returns -1 for a kept frame
    // that is not in the sheet, and a select index of -1 matches no cell, so
    // that mark simply never draws. The page's claim (the four frames circled
    // in the roll are the four that lead the album a screen later) quietly
    // becomes three, with nothing anywhere to notice.
    expect(ROLL_SELECTS).not.toContain(-1);
    expect(ROLL_SELECTS.length).toBeGreaterThan(0);
    // Distinct, or two "kept" frames are circling one photograph.
    expect(new Set(ROLL_SELECTS).size).toBe(ROLL_SELECTS.length);
    for (const i of ROLL_SELECTS) {
      expect(SHEET_FRAMES[i]).toBeDefined();
    }
  });

  it("★ keeps the hero's marks out of the top row and inside the sheet", () => {
    // These are POSITIONAL and hand-numbered, on purpose: the hero repeats the
    // roll, so selecting by id would circle every keeper three times over. The
    // cost is that they encode two facts nothing else knows.
    //
    // (1) Row one sits under the overlay header and the scrim's top fade, which
    //     hid the original marks entirely (Will caught it live). Index 18 is the
    //     first that clears row one at ALL THREE column counts the sheet uses
    //     (5 / 7 / 9), because 2 x 9 = 18.
    // (2) An index past the last cell renders nothing at all.
    const cells = SHEET_FRAMES.length * HERO_REPEAT;
    for (const i of HERO_SELECTS) {
      expect(
        i,
        "a hero mark in row one is hidden by the header",
      ).toBeGreaterThanOrEqual(18);
      expect(i, "a hero mark past the last cell never renders").toBeLessThan(
        cells,
      );
    }
    expect(new Set(HERO_SELECTS).size).toBe(HERO_SELECTS.length);
  });

  it("resolves every sheet frame in the media manifest", () => {
    // marketingImage() THROWS on an unknown id, so a typo already fails the
    // build. This names the invariant instead of leaving it to a stack trace,
    // and it fails in a second rather than at the end of a prerender.
    for (const id of SHEET_FRAMES) {
      expect(isMarketingImageId(id), `${id} is not in the media manifest`).toBe(
        true,
      );
    }
    expect(new Set(SHEET_FRAMES).size, "a duplicated frame").toBe(
      SHEET_FRAMES.length,
    );
  });
});
