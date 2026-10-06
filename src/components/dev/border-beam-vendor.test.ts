import { describe, expect, it } from "vitest";

import { entries, read } from "@/testing/source-tree";

// The VENDORED border-beam package (src/components/vendor/border-beam) is
// copied in under MIT, and prettier and eslint are both told to leave the
// folder alone, so nothing else in the gate would notice a copy that lost its
// licence notice.

const DIR = "src/components/vendor/border-beam";

describe("the vendored border-beam package", () => {
  it("keeps the MIT notice in every source file", () => {
    // MIT requires the copyright notice to survive in copies of the source.
    // User-facing credit is a separate thing and belongs on the attributions
    // page; this is the licence obligation, and it is not optional.
    const files = entries(DIR)
      .map((entry) => entry.name)
      .filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const f of files) {
      const src = read(`${DIR}/${f}`);
      expect(src, `${f} lost its licence header`).toContain("MIT License");
      expect(src, `${f} lost its attribution`).toContain("Jakub Antalik");
    }
  });
});
