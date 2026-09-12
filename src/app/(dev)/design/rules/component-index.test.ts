import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COMPONENT_DIRS } from "../../../../../scripts/design-rules/collect.mjs";
import { COMPONENT_NOTES } from "./component-notes";
import { COMPONENTS, INDEXED } from "./rules";

/**
 * THE COVERAGE GUARD of the library: every component file in the library's
 * directories is rendered by a page or excused with a reason, a reason goes
 * once the specimen exists, and every contract points at a file that is
 * still there.
 */
const ROOT = process.cwd();

describe("the component index", () => {
  it("renders every component in the library, or says why not", () => {
    const missing = INDEXED.filter(
      (c) => c.specimens.length === 0 && !COMPONENT_NOTES[c.file]?.unspecimened,
    ).map((c) => c.file);
    expect(
      missing,
      "a component without a specimen (or an unspecimened reason)",
    ).toEqual([]);
  });

  it("keeps its reasons for files that exist and still lack a specimen", () => {
    const byFile = new Map(COMPONENTS.map((c) => [c.file, c]));
    for (const [file, note] of Object.entries(COMPONENT_NOTES)) {
      const c = byFile.get(file);
      expect(
        c,
        `COMPONENT_NOTES names a file the index does not know: ${file}`,
      ).toBeTruthy();
      if (note.unspecimened) {
        expect(
          c!.specimens,
          `${file} has a specimen now; drop its unspecimened reason`,
        ).toEqual([]);
      }
    }
  });

  it("indexes exactly the library's directories, and the rest only for their contracts", () => {
    for (const c of COMPONENTS) {
      const dir = c.file.slice(0, c.file.lastIndexOf("/"));
      if (c.indexed) {
        expect(
          COMPONENT_DIRS,
          `${c.file} is indexed outside the library`,
        ).toContain(dir);
      } else {
        expect(
          c.contracts.length,
          `${c.file} is neither in the library nor named by a contract`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("lists every contract on a file that exists", () => {
    for (const c of COMPONENTS) {
      expect(existsSync(join(ROOT, c.file)), `${c.file} is gone`).toBe(true);
      for (const k of c.contracts) {
        expect(existsSync(join(ROOT, k.file)), `${k.file} is gone`).toBe(true);
      }
    }
  });
});
