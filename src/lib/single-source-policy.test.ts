import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ONE NAME, ONE MODULE. On 2026-09-02 two parallel tracks each single-sourced
 * the over-cap grace days into their own file (lib/lifecycle/over-cap.ts and
 * over-capacity.ts), both green, and only the merge noticed. This pins that an
 * UPPER_SNAKE constant is exported from exactly one module under src/lib.
 * Top-level `export const` declarations only, so re-exports and locals never
 * count. It cannot see a SECOND NAME for the same number; the boot lookup in
 * docs/tracks/README.md is for that.
 */

const LIB = join(process.cwd(), "src", "lib");
const SKIP = /\.test\.tsx?$|(?:^|\/)types\.ts$/;
const DECL = /^export const ([A-Z][A-Z0-9_]{2,})\b/gm;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry) && !SKIP.test(relative(LIB, full)))
      out.push(full);
  }
  return out;
}

const homes = new Map<string, string[]>();
for (const f of walk(LIB)) {
  for (const m of readFileSync(f, "utf8").matchAll(DECL)) {
    homes.set(m[1], [...(homes.get(m[1]) ?? []), relative(LIB, f)]);
  }
}

describe("single-source policy", () => {
  it("scanned the constant homes", () => {
    expect(homes.size).toBeGreaterThan(100);
  });

  it("no UPPER_SNAKE constant is exported from two modules", () => {
    const dups = [...homes].filter(([, files]) => files.length > 1);
    expect(
      dups,
      dups.map(([n, f]) => `${n}: ${f.join(", ")}`).join("\n"),
    ).toEqual([]);
  });
});
