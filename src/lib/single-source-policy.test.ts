import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

/**
 * ONE NAME, ONE MODULE. On 2026-09-02 two parallel tracks each single-sourced
 * the over-cap grace days into their own file (lib/lifecycle/over-cap.ts and
 * over-capacity.ts), both green, and only the merge noticed. This pins that an
 * UPPER_SNAKE constant is exported from exactly one module under src/lib.
 * Top-level `export const` declarations only, so re-exports and locals never
 * count. It cannot see a SECOND NAME for the same number; the boot lookup in
 * docs/tracks/README.md is for that.
 */

const DECL = /^export const ([A-Z][A-Z0-9_]{2,})\b/gm;

const homes = new Map<string, string[]>();
for (const f of sources("src/lib")) {
  for (const m of read(f).matchAll(DECL)) {
    homes.set(m[1], [...(homes.get(m[1]) ?? []), f.slice("src/lib/".length)]);
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
