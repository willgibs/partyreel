import { describe, expect, it } from "vitest";

import { groupRowsByDir, type LibraryRow } from "./index-list";

const row = (id: string, dir: string): LibraryRow => ({
  id,
  title: id,
  href: `/design/library/${id}`,
  file: `${dir}/${id}.tsx`,
  dir,
  specimens: 0,
  variants: 0,
  contracts: 0,
  play: false,
});

/**
 * The library index groups its rows by directory for the `key={dir}` React
 * needs unique. The rules artifact lists a directory's files in several runs,
 * so the grouping must merge rows that share a directory even when other
 * directories sit between them (2026-09-20: `src/components/shared` came in
 * five runs and the page threw on the duplicate key).
 */
describe("groupRowsByDir", () => {
  it("merges rows sharing a directory into one group even when they are not adjacent", () => {
    const rows = [
      row("a", "src/components/ui"),
      row("b", "src/components/shared"),
      row("c", "src/components/app"),
      row("d", "src/components/shared"),
      row("e", "src/components/shared"),
      row("f", "src/components/ui"),
    ];
    const groups = groupRowsByDir(rows);
    const dirs = groups.map(([dir]) => dir);
    expect(new Set(dirs).size).toBe(dirs.length);
    expect(groups.find(([dir]) => dir === "src/components/shared")?.[1].map((r) => r.id)).toEqual(["b", "d", "e"]);
    expect(groups.find(([dir]) => dir === "src/components/ui")?.[1].map((r) => r.id)).toEqual(["a", "f"]);
  });

  it("keeps the order in which a directory first appears", () => {
    const rows = [row("a", "z"), row("b", "m"), row("c", "a"), row("d", "z")];
    expect(groupRowsByDir(rows).map(([dir]) => dir)).toEqual(["z", "m", "a"]);
  });

  it("returns no group for no rows", () => {
    expect(groupRowsByDir([])).toEqual([]);
  });
});
