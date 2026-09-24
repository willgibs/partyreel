import { describe, expect, it } from "vitest";

import { groupRows, type LibraryRow } from "./index-list";

const row = (id: string, group: string): LibraryRow => ({
  id,
  title: id,
  href: `/design/library/${id}`,
  file: `src/components/${id}.tsx`,
  group,
  specimens: 0,
  variants: 0,
  play: false,
});

/**
 * The catalog's index groups its rows by family for the `key={group}` React
 * needs unique, so the grouping must merge rows that share a family even when
 * other families sit between them (a duplicate key once threw on this page).
 */
describe("groupRows", () => {
  it("merges rows sharing a group into one even when they are not adjacent", () => {
    const rows = [
      row("a", "Components"),
      row("b", "Patterns"),
      row("c", "Marketing"),
      row("d", "Patterns"),
      row("e", "Patterns"),
      row("f", "Components"),
    ];
    const groups = groupRows(rows);
    const names = groups.map(([group]) => group);
    expect(new Set(names).size).toBe(names.length);
    expect(
      groups.find(([group]) => group === "Patterns")?.[1].map((r) => r.id),
    ).toEqual(["b", "d", "e"]);
    expect(
      groups.find(([group]) => group === "Components")?.[1].map((r) => r.id),
    ).toEqual(["a", "f"]);
  });

  it("keeps the order in which a group first appears", () => {
    const rows = [row("a", "z"), row("b", "m"), row("c", "a"), row("d", "z")];
    expect(groupRows(rows).map(([group]) => group)).toEqual(["z", "m", "a"]);
  });

  it("returns no group for no rows", () => {
    expect(groupRows([])).toEqual([]);
  });
});
