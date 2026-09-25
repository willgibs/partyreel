/**
 * THE ROWS' FIRST PAINT, AS THE SERVER RUNS IT (album-window-plan.ts): the photographs the first
 * paint draws are the ones the page mints links for, so the two must be one plan; a remembered width
 * makes its own class exact and leaves the others nominal; the cookie is read defensively.
 */
import { describe, expect, it } from "vitest";

import { layoutRows, ROW_CLASSES } from "@/lib/shared/album-rows";

import {
  classWidths,
  decodeFirstPaint,
  encodeFirstPaint,
  FIRST_PAINT,
  firstPaintIds,
  firstPaintKey,
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

/**
 * THE SERVER'S PLAN, HANDED TO THE HYDRATION (`encodeFirstPaint`, `decodeFirstPaint`): the engine's
 * logs and powers round differently in the server's engine and a browser's, so the browser hydrates
 * with the plan the server drew, whenever it was drawn for the very same list and parameters.
 */
describe("the first paint's plan on the grid", () => {
  const items = album(300);
  const list = rowItemsFor(items, false, null, [], "end");
  const widths = classWidths(351);
  const keyOf = (l = list, seed = 7, w = widths) =>
    firstPaintKey(l, 1, "double", seed, "end", "double", w);
  const plan = firstPaintPlan(list, 1, "double", 7, "end", "double", widths);

  it("keys the whole list and every parameter, in arithmetic every engine agrees on", () => {
    expect(keyOf()).toBe(
      keyOf(rowItemsFor(album(300), false, null, [], "end")),
    );
    const swapped = [...list];
    [swapped[250], swapped[251]] = [swapped[251], swapped[250]];
    const reshaped = list.map((it, i) =>
      i === 299 ? { ...it, ratio: 0.75 } : it,
    );
    for (const other of [
      keyOf(list.slice(1)),
      keyOf(swapped),
      keyOf(reshaped),
      keyOf(list, 8),
      keyOf(list, 7, classWidths(360)),
      firstPaintKey(list, 2, "double", 7, "end", "double", widths),
      firstPaintKey(list, 1, "plain", 7, "end", "double", widths),
    ])
      expect(other).not.toBe(keyOf());
  });

  it("breaks only the photographs it draws: a shorter row past the first unfinished one is the spacer's", () => {
    // Feature rows hold fewer photographs, so a row past the unfinished one could "fit" again.
    for (const seed of [7, 11, 1234, 99991]) {
      const p = firstPaintPlan(
        list,
        1,
        "double",
        seed,
        "end",
        "double",
        widths,
      );
      const drawn = new Set(list.slice(0, p.count).map((it) => it.id));
      for (const id of p.breaksAfter.keys()) expect(drawn.has(id)).toBe(true);
    }
  });

  it("round-trips exactly: the breaks by photograph, the count, the rests and the fills", () => {
    const wire = encodeFirstPaint(plan, list, keyOf());
    const back = decodeFirstPaint(wire, list, keyOf());
    expect(back).toEqual(plan);
    // A few hundred bytes on the grid, not the album.
    expect(wire.length).toBeLessThan(1200);
  });

  it("is refused for another list or other parameters, and when it is not a plan at all", () => {
    const wire = encodeFirstPaint(plan, list, keyOf());
    expect(decodeFirstPaint(wire, list, keyOf(list, 8))).toBeNull();
    expect(
      decodeFirstPaint(wire, list.slice(1), keyOf(list.slice(1))),
    ).toBeNull();
    expect(decodeFirstPaint(null, list, keyOf())).toBeNull();
    expect(decodeFirstPaint("{not json", list, keyOf())).toBeNull();
    const o = JSON.parse(wire);
    const forged = (patch: object) =>
      decodeFirstPaint(JSON.stringify({ ...o, ...patch }), list, keyOf());
    expect(forged({ n: list.length + 1 })).toBeNull();
    expect(forged({ b: [[o.n, [0]]] })).toBeNull();
    expect(forged({ b: [["0", [0]]] })).toBeNull();
    expect(forged({ r: [1, 2, 3, 4] })).toBeNull();
    expect(forged({ f: ["1"] })).toBeNull();
  });
});
