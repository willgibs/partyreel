import { describe, expect, it } from "vitest";

import {
  collectSpecimenCode,
  SPECIMENS_VERSION,
} from "./collect-specimens.mjs";
import artifact from "./specimens.generated.json";
import { countSpecimenCode, specimenCode } from "./specimen-code";

/**
 * THE FRESHNESS GUARD of the Code tab. The committed artifact is derived from
 * the entry modules, so the only way it can lie is by being stale: edit a
 * specimen's JSX, forget to regenerate, and the library would show the old
 * markup beside the new render. This fails until they agree.
 *
 *   node "src/app/(dev)/design/gallery/collect-specimens.mjs"
 */
describe("the specimen source artifact", () => {
  it("matches what the collector sees right now", () => {
    const fresh = collectSpecimenCode(process.cwd());
    expect(
      fresh,
      'stale: run  node "src/app/(dev)/design/gallery/collect-specimens.mjs"',
    ).toEqual(artifact);
  });

  it("is the version this module reads", () => {
    expect(artifact.version).toBe(SPECIMENS_VERSION);
  });

  // The entries themselves are TSX that pulls in the whole component library,
  // so this node-project test reads the artifact rather than the registry
  // (gallery.test.ts holds the entry declarations against the components).
  it("gives every declared specimen its own source", () => {
    const missing: string[] = [];
    for (const [id, list] of Object.entries(artifact.code)) {
      list.forEach((_, i) => {
        if (!specimenCode(id, i)) missing.push(`${id}#${i}`);
      });
    }
    expect(
      missing,
      "a specimen the collector could not read (is its `node` declared inline in gallery-demos.tsx?)",
    ).toEqual([]);
    expect(countSpecimenCode()).toBeGreaterThan(80);
  });
});
