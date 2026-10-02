import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE INTEGRATION GATE'S DEV SERVER STARTS ON AN EMPTY DEV CACHE (crumbs-43, gate 123).
 *
 * Turbopack's persistent dev cache (`.next/dev`) warmed on one tree and served on another whose client graph moved
 * can hand a page a chunk that names a dynamic import's chunk list by the OLD tree's name; the HMR subscription to
 * that name answers `restart`, and the page reloads itself for ever. Gate 123 met it on launch-prep 9b0465d6 plus
 * crumbs-43: the merge went red on a doc and was resolved by hand, so it never reached merge-lane.sh's
 * `rm -rf .next/dev` (which sits on its typecheck path); gate-lane.sh's server then reused gate 122's cache, warmed
 * on the tree without the lane, and the lab's event-ready frame reloaded under every lab:demo step ("Cannot read
 * properties of undefined (reading 'dock')", the harness's handle gone with each reload). The same tree pressed
 * clean on an empty cache, every time. So the gate empties the cache itself, after stopping whatever held its port
 * and before starting its own server, whichever way its merge was made.
 *
 * docs/systems/testing-verification.md holds the gotcha for any dev server moved between trees.
 */
const GATE = join(process.cwd(), "usher/kit/gate-lane.sh");

/** The script's lines, a whole-line comment read as blank, so a commented-out removal is no removal. */
function codeLines(path: string): string[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => (/^\s*#/.test(line) ? "" : line.trim()));
}

describe("the integration gate's dev server", () => {
  const lines = codeLines(GATE);
  const start = lines.findIndex((line) => /\(pnpm dev -p \$PORT\b/.test(line));
  const stop = lines
    .slice(0, Math.max(start, 0))
    .findLastIndex((line) => /lsof -ti tcp:\$PORT \| xargs -r kill\b/.test(line));

  it("is started by the gate after it stops whatever held its port", () => {
    expect(start, "gate-lane.sh no longer starts `pnpm dev -p $PORT`").toBeGreaterThan(-1);
    expect(stop, "gate-lane.sh no longer stops its port before its server").toBeGreaterThan(-1);
  });

  it("starts on an empty .next/dev, removed between that stop and the start", () => {
    const between = lines.slice(stop + 1, start);
    expect(between.some((line) => /^rm -rf \.next\/dev(?:$|[\s;&|])/.test(line))).toBe(true);
  });
});
