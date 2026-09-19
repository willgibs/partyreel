import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LAB_CSS_GENERATION } from "./lab-css-generation";

/**
 * The chrome probes the number design.css declares; the two are bumped
 * together when a shell rule changes, and this is what keeps them equal.
 */
const DESIGN_CSS = "src/app/(dev)/design/design.css";
const css = () => readFileSync(join(process.cwd(), DESIGN_CSS), "utf8");

describe("the lab stylesheet's generation", () => {
  it("is the same number in design.css and in the chrome", () => {
    const m = /\.lab-shell\s*\{[^}]*--lab-css-generation:\s*(\d+)/.exec(
      css(),
    );
    expect(
      m,
      "design.css declares --lab-css-generation on .lab-shell",
    ).not.toBeNull();
    expect(Number(m![1])).toBe(LAB_CSS_GENERATION);
  });
});

/**
 * THE CASCADE SETTLEMENT, PINNED (lab-tides, 2026-09-19).
 *
 * The lab's utilities compile into a SUB-layer of `utilities`, which decides
 * two things at once and they pull against each other: production's classes
 * win on a shared element (round four's fix: a board mounting a real section
 * used to lay it out as its phone version), and a lab-only `<breakpoint>:`
 * utility LOSES to production's unprefixed half of the same pair, which is the
 * "a responsive variant never reaches a frame" three lanes filed as a mystery.
 *
 * Both halves follow from the one `layer(utilities.lab)`, so this pins the line
 * rather than the symptom: changing it is a deliberate act with a whole desk to
 * re-read, not a tidy-up. `/design/lab/sample` draws what it costs.
 */
describe("the lab's utilities", () => {
  it("compile into a sub-layer of utilities, scanning only the lab", () => {
    expect(
      /@import\s+"tailwindcss\/utilities\.css"\s+layer\(utilities\.lab\)\s+source\(none\)/.test(
        css(),
      ),
      "design.css emits the lab's utilities into `utilities.lab`; moving them into `utilities` (or out of a layer) flips which sheet wins on every shared element, and every standing board has to be re-read",
    ).toBe(true);
  });

  it("say where a board's breakpoint goes instead", () => {
    // The rule a board author needs is the one that has to survive an edit:
    // the words may change, the fact that the file states it may not.
    // Whitespace-flattened: the comment is wrapped to the file's column.
    expect(
      css().replace(/\s+/g, " "),
      "design.css owes a board the rule about a lab-only breakpoint utility",
    ).toContain("the board's own sheet, which is unlayered and wins");
  });
});
