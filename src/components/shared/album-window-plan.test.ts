/**
 * THE ROWS' FIRST PAINT, AS THE SERVER RUNS IT (album-window-plan.ts): the photographs the first
 * paint draws are the ones the page mints links for, so the two must be one plan; a remembered width
 * makes its own class exact and leaves the others nominal; the cookie is read defensively.
 */
import { describe, expect, it } from "vitest";

import { layoutRows, ROW_CLASSES } from "@/lib/shared/album-rows";

import {
  classWidths,
  FIRST_PAINT,
  firstPaintIds,
  firstPaintPlan,
  NOMINAL_GAP,
  NOMINAL_WIDTH,
  parseAlbumWidth,
  rowClassOf,
  rowItemsFor,
} from "./album-window-plan";

const album = (n: number, ratio = 4 / 3) =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${i}`,
    width: Math.round(480 * ratio),
    height: 480,
  }));

describe("firstPaintIds", () => {
  it("is exactly the first paint's photographs, in album order", () => {
    const items = album(300);
    const opts = { step: 1 as const, rhythm: "double" as const, seed: 7 };
    const ids = firstPaintIds(items, { ...opts, width: null });
    const plan = firstPaintPlan(
      rowItemsFor(items, false, null, [], "end"),
      opts.step,
      opts.rhythm,
      opts.seed,
      "end",
      "double",
    );
    expect(ids).toEqual(items.slice(0, plan.count).map((m) => m.id));
    // At least the first paint's floor, and never the whole album.
    expect(ids.length).toBeGreaterThanOrEqual(FIRST_PAINT);
    expect(ids.length).toBeLessThan(300);
  });

  it("an album smaller than a first paint is drawn, and linked, whole", () => {
    expect(
      firstPaintIds(album(12), {
        step: 2,
        rhythm: "plain",
        seed: 0,
        width: null,
      }),
    ).toHaveLength(12);
  });

  it("an empty album asks for nothing", () => {
    expect(
      firstPaintIds([], { step: 1, rhythm: "double", seed: 0, width: null }),
    ).toEqual([]);
  });
});

describe("classWidths: the remembered width", () => {
  it("cold, every class is laid at its nominal width", () => {
    expect(classWidths(null)).toEqual([...NOMINAL_WIDTH]);
  });

  it("makes its own class exact, and only its own", () => {
    expect(classWidths(366)).toEqual([366, 728, 984, 1400]);
    expect(classWidths(1512)).toEqual([351, 728, 984, 1512]);
    expect(rowClassOf(899)).toBe(1);
    expect(rowClassOf(900)).toBe(2);
  });

  it("the exact class's first paint breaks where the measure breaks", () => {
    // A phone album box of 366 (a 390 phone): the plan's class-0 rows ARE the engine's rows at 366.
    const items = album(60, 0.75);
    const list = rowItemsFor(items, false, null, [], "end");
    const plan = firstPaintPlan(
      list,
      1,
      "plain",
      0,
      "end",
      "double",
      classWidths(366),
    );
    const measured = layoutRows(list, {
      width: 366,
      gap: NOMINAL_GAP,
      perRow: ROW_CLASSES[0].perRow[1],
      anchor: "end",
      feature: "double",
    });
    const planned: string[] = [];
    for (const [id, classes] of plan.breaksAfter)
      if (classes.includes(0)) planned.push(id);
    // The engine's own row ends, for every row the first paint draws whole.
    const engine: string[] = [];
    let end = 0;
    for (const row of measured.rows) {
      if (end + row.ids.length > plan.count) break;
      end += row.ids.length;
      engine.push(row.ids[row.ids.length - 1]);
    }
    expect(planned.length).toBeGreaterThan(3);
    expect(planned).toEqual(engine);
  });
});

describe("parseAlbumWidth", () => {
  it("reads a real album box's width and nothing else", () => {
    expect(parseAlbumWidth("1400")).toBe(1400);
    expect(parseAlbumWidth("366")).toBe(366);
    for (const bad of [undefined, null, "", "abc", "12.5", "-4", "0", "99999"])
      expect(parseAlbumWidth(bad as string | null | undefined)).toBeNull();
  });
});
