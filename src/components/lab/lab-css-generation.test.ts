import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LAB_CSS_GENERATION } from "./lab-css-generation";

/**
 * The chrome probes the number design.css declares; the two are bumped
 * together when a shell rule changes, and this is what keeps them equal.
 */
describe("the lab stylesheet's generation", () => {
  it("is the same number in design.css and in the chrome", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/(dev)/design/design.css"),
      "utf8",
    );
    const m = /\.lab-shell\s*\{[^}]*--lab-css-generation:\s*(\d+)/.exec(css);
    expect(
      m,
      "design.css declares --lab-css-generation on .lab-shell",
    ).not.toBeNull();
    expect(Number(m![1])).toBe(LAB_CSS_GENERATION);
  });
});
