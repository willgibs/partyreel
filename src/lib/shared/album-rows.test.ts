/**
 * THE ROWS ENGINE'S CONTRACT (`album-columns` r1: `layout=justified`, and his
 * question beside it: "will this ever lead to gaps, particularly on the right
 * side if all widths don't balance to 100%?").
 *
 * Property tests over seeded albums: every rule is checked on a few hundred
 * albums of a real party's shapes (mostly phone portraits, some landscapes, a
 * few 9:16 clips) at every step and at widths from a phone to a cinema display,
 * because a justified layout is exactly the kind of thing that holds on the
 * three albums someone thought of and breaks on the fourth.
 */
import { describe, expect, it } from "vitest";

import {
  ROW_FALLBACK_RATIO,
  ROW_MAX_RATIO,
  ROW_MIN_RATIO,
} from "@/lib/media/tile-aspect";

import {
  bandFor,
  capFor,
  DEFAULT_ROW_STEP,
  FEATURE_MIN_RATIO,
  FEATURE_SCALE,
  layoutRows,
  perRowFor,
  pickFeatures,
  reflowRows,
  ROW_CLASSES,
  type Reflow,
  type Row,
  type RowItem,
  type RowsLayout,
  type RowStep,
} from "./album-rows";

/** A small, fast, seeded generator (mulberry32): the same album every run. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What a party album is made of: mostly phone portraits. */
const PARTY: readonly [ratio: number, share: number][] = [
  [3 / 4, 0.5],
  [9 / 16, 0.1],
  [4 / 3, 0.22],
  [16 / 9, 0.05],
  [1, 0.05],
  [2 / 3, 0.04],
  [3 / 2, 0.04],
];

function album(n: number, r: () => number, prefix = "m"): RowItem[] {
  return Array.from({ length: n }, (_, i) => {
    let u = r();
    let ratio = 1;
    for (const [v, p] of PARTY) {
      if (u < p) {
        ratio = v;
        break;
      }
      u -= p;
    }
    return { id: `${prefix}${i}`, ratio };
  });
}

const STEPS: RowStep[] = [0, 1, 2];
/** A phone, a big phone, a tablet, a laptop, a desk, a wide monitor. */
const WIDTHS = [335, 390, 560, 728, 984, 1400, 1880, 2520];
const GAP = 4;

const params = (width: number, step: RowStep) => ({
  width,
  gap: GAP,
  perRow: perRowFor(width, step),
});

/** A row, as the bytes a render would read: identity for "did it move". */
const bytes = (row: Row) =>
  `${row.ids.join(",")}@${row.height}:${row.widths.join(",")}`;

const flat = (layout: RowsLayout) => layout.rows.flatMap((row) => row.ids);

describe("no row ever leaves a gap at the right edge", () => {
  it("fills the box with every justified row, within half a pixel, at any width", () => {
    let rows = 0;
    // Ten albums a step (six when there were five steps): the same few
    // thousand rows checked, now over three steps.
    for (const width of [...WIDTHS, 333.5, 1399.25, 1917.75])
      for (const step of STEPS)
        for (let s = 0; s < 10; s++) {
          const layout = layoutRows(
            album(60, rng(s * 31 + step), "a"),
            params(width, step),
          );
          for (const row of layout.rows) {
            expect(row.justified).toBe(true);
            const used =
              row.widths.reduce((a, b) => a + b, 0) +
              (row.ids.length - 1) * GAP;
            expect(
              Math.abs(used - width),
              `${width}px, step ${step}`,
            ).toBeLessThanOrEqual(0.5);
            // Whole pixels, one per photo, every one of them there.
            expect(row.widths).toHaveLength(row.ids.length);
            for (const w of row.widths)
              expect(Number.isInteger(w) && w > 0).toBe(true);
            expect(Number.isInteger(row.height) && row.height > 0).toBe(true);
            rows++;
          }
        }
    expect(rows).toBeGreaterThan(5000);
  });

  it("lays every photograph exactly once, in order", () => {
    const items = album(200, rng(7));
    for (const width of WIDTHS) {
      const layout = layoutRows(items, params(width, DEFAULT_ROW_STEP));
      expect(flat(layout)).toEqual(items.map((it) => it.id));
    }
  });
});

describe("heights sit in a soft band around the target", () => {
  it("keeps every row but the oldest inside the band, and the oldest under the cap", () => {
    for (const width of WIDTHS)
      for (const step of STEPS) {
        const perRow = perRowFor(width, step);
        const band = bandFor(perRow);
        for (let s = 0; s < 8; s++) {
          const layout = layoutRows(album(90, rng(s * 97 + width + step)), {
            width,
            gap: GAP,
            perRow,
          });
          const last = layout.rows.length - 1;
          layout.rows.forEach((row, i) => {
            const x = row.height / layout.target;
            // Rounding a height to a whole pixel is allowed its pixel.
            const slack = 1 / layout.target;
            expect(x, `${width}px step ${step}: the cap`).toBeLessThanOrEqual(
              capFor(perRow) + slack,
            );
            if (i === last) return;
            expect(
              Math.max(x, 1 / x),
              `${width}px step ${step}, row ${i} of ${last + 1}`,
            ).toBeLessThanOrEqual(band + slack);
          });
        }
      }
  });

  it("never stands a row taller than the cap, whatever the shapes", () => {
    // Uniform noise across the whole row band, the album no party produces.
    for (const width of WIDTHS)
      for (const step of STEPS) {
        const r = rng(width * 3 + step);
        const items = Array.from({ length: 70 }, (_, i) => ({
          id: `n${i}`,
          ratio: ROW_MIN_RATIO + r() * (ROW_MAX_RATIO - ROW_MIN_RATIO),
        }));
        const layout = layoutRows(items, params(width, step));
        for (const row of layout.rows)
          expect(row.height).toBeLessThanOrEqual(
            Math.round(layout.target * capFor(perRowFor(width, step))) + 1,
          );
      }
  });
});

describe("density steps are photographs per row, never pixels", () => {
  it("keeps all three steps distinct at every width", () => {
    for (let width = 280; width <= 3440; width += 40) {
      const counts = STEPS.map((s) => perRowFor(width, s));
      expect(new Set(counts).size, `${width}px`).toBe(3);
      // Largest photographs first: every step holds more than the one before.
      for (let i = 1; i < counts.length; i++)
        expect(counts[i]).toBeGreaterThan(counts[i - 1]);
    }
  });

  it("puts 2 a row on a phone, 3 through a tablet, and never more than 8 at a desk", () => {
    expect(perRowFor(375, DEFAULT_ROW_STEP)).toBe(2);
    expect(perRowFor(480, DEFAULT_ROW_STEP)).toBe(3);
    expect(perRowFor(768, DEFAULT_ROW_STEP)).toBe(3);
    expect(perRowFor(1440, DEFAULT_ROW_STEP)).toBe(5);
    // His phone steps, whole: one, two or three a row (the round-two note).
    expect(STEPS.map((s) => perRowFor(375, s))).toEqual([1, 2, 3]);
    // The ceiling: a wider screen grows the rows, it never adds photographs.
    expect(perRowFor(1440, 2)).toBe(8);
    expect(perRowFor(2560, 2)).toBe(8);
    expect(perRowFor(3440, 2)).toBe(8);
    const densest = Math.max(...ROW_CLASSES.flatMap((c) => c.perRow));
    expect(densest).toBe(8);
  });

  it("lays about as many photographs a row as the step asks", () => {
    for (const width of WIDTHS)
      for (const step of STEPS) {
        const perRow = perRowFor(width, step);
        let photos = 0;
        let rows = 0;
        for (let s = 0; s < 5; s++) {
          const layout = layoutRows(album(120, rng(s + width)), {
            width,
            gap: GAP,
            perRow,
          });
          photos += layout.rows
            .slice(0, -1)
            .reduce((n, r) => n + r.ids.length, 0);
          rows += layout.rows.length - 1;
        }
        const mean = photos / rows;
        expect(mean / perRow, `${width}px step ${step}`).toBeGreaterThan(0.85);
        expect(mean / perRow, `${width}px step ${step}`).toBeLessThan(1.25);
      }
  });
});

describe("an arrival moves at most four rows", () => {
  it("re-solves only the window at the head and carries every other row byte for byte", () => {
    let arrivals = 0;
    for (const width of [335, 390, 728, 1400, 2520])
      for (const step of STEPS)
        for (let s = 0; s < 4; s++) {
          const r = rng(s * 13 + width + step);
          let items = album(70, r, "o");
          let layout = layoutRows(items, params(width, step));
          for (let k = 0; k < 12; k++) {
            // Mostly one at a time; sometimes a guest's batch of three.
            const fresh = album(r() < 0.2 ? 3 : 1, r, `n${s}.${k}.`);
            items = [...fresh, ...items];
            const next = reflowRows(layout, items, params(width, step));
            arrivals++;
            expect(next.kind).toBe("local");
            expect(next.windows).toHaveLength(1);
            const [a, b] = next.windows[0];
            // The window starts at the head and holds at most four old rows.
            expect(a).toBe(0);
            expect(b - a + 1).toBeLessThanOrEqual(4);
            // Everything below it is the very same rows, in the same order.
            const below = layout.rows.slice(b + 1).map(bytes);
            const after = next.layout.rows.map(bytes);
            expect(after.slice(after.length - below.length)).toEqual(below);
            expect(flat(next.layout)).toEqual(items.map((it) => it.id));
            for (const row of next.layout.rows)
              expect(row.justified).toBe(true);
            layout = next.layout;
          }
        }
    expect(arrivals).toBeGreaterThan(400);
  });

  it("keeps the rows it re-solves under the cap and close to the band", () => {
    for (const width of [390, 1400])
      for (const step of STEPS) {
        const perRow = perRowFor(width, step);
        const r = rng(width + step * 7);
        let items = album(60, r, "o");
        let layout = layoutRows(items, { width, gap: GAP, perRow });
        for (let k = 0; k < 40; k++) {
          items = [...album(1, r, `n${k}.`), ...items];
          layout = reflowRows(layout, items, {
            width,
            gap: GAP,
            perRow,
          }).layout;
          layout.rows.forEach((row, i) => {
            const x = row.height / layout.target;
            expect(x).toBeLessThanOrEqual(capFor(perRow) + 1 / layout.target);
            if (i === layout.rows.length - 1) return;
            // The band is soft: a window of four rows cannot always find a
            // partition inside it, and it may miss by a few percent.
            expect(Math.max(x, 1 / x)).toBeLessThanOrEqual(
              bandFor(perRow) * 1.06,
            );
          });
        }
      }
  });

  it("places an older photograph approved late with its own neighbours, locally", () => {
    for (const width of [390, 1400])
      for (let s = 0; s < 10; s++) {
        const r = rng(s + width * 11);
        const items = album(80, r);
        const layout = layoutRows(items, params(width, DEFAULT_ROW_STEP));
        const at = 10 + Math.floor(r() * 60);
        const next = reflowRows(
          layout,
          [...items.slice(0, at), ...album(1, r, "late"), ...items.slice(at)],
          params(width, DEFAULT_ROW_STEP),
        );
        expect(next.kind).toBe("local");
        const moved = next.windows.reduce((n, [a, b]) => n + b - a + 1, 0);
        expect(moved).toBeLessThanOrEqual(4);
      }
  });
});

describe("a hide re-solves only its window", () => {
  it("moves the hidden photograph's row and its neighbours, and nothing else", () => {
    let hides = 0;
    // Five albums a step (three over five steps): the same hundreds of hides.
    for (const width of [335, 728, 1400, 2520])
      for (const step of STEPS)
        for (let s = 0; s < 5; s++) {
          const r = rng(s * 7 + width + step);
          let items = album(80, r);
          let layout = layoutRows(items, params(width, step));
          for (let k = 0; k < 8; k++) {
            const victim = items[Math.floor(r() * items.length)].id;
            const rowOfVictim = layout.rows.findIndex((row) =>
              row.ids.includes(victim),
            );
            items = items.filter((it) => it.id !== victim);
            const next = reflowRows(layout, items, params(width, step));
            hides++;
            expect(next.kind).toBe("local");
            const [a, b] = next.windows[0];
            expect(b - a + 1).toBeLessThanOrEqual(4);
            // Its own row and its neighbours, stretched by one row at most.
            expect(a).toBeGreaterThanOrEqual(Math.max(0, rowOfVictim - 2));
            expect(b).toBeLessThanOrEqual(rowOfVictim + 2);
            const before = layout.rows.map(bytes);
            const after = next.layout.rows.map(bytes);
            expect(after.slice(0, a)).toEqual(before.slice(0, a));
            const tail = before.slice(b + 1);
            expect(after.slice(after.length - tail.length)).toEqual(tail);
            layout = next.layout;
          }
        }
    expect(hides).toBeGreaterThan(400);
  });
});

/**
 * ★ A CHANGE OUTSIDE THE ROWS IN VIEW NEVER RE-LAYS THEM (build 10's red-team, the album-fixes
 * lane): a guest deep in the scale probe at 1440 watched a hide above the view take 6 of 8
 * photographs in view off screen, because the hide's window reached the row at the view's top and a
 * feature row re-formed in it. The box hands the engine the rows in view (`HeldRows`); these hold it
 * to them on the albums a guest and a host lay: party shapes and the probe's uniform landscapes, the
 * rhythm on, from a phone to a wide desk.
 */
describe("a change outside the rows in view never re-lays them", () => {
  const featured = (items: RowItem[], seed: number, perRow: number) => {
    const picks = pickFeatures(items, seed, perRow);
    return items.map((it) =>
      picks.has(it.id) ? { ...it, feature: true } : it,
    );
  };
  /** The scale probe: every photograph a 320x240 landscape, so any of them may lead a feature row. */
  const probe = (n: number, prefix = "p"): RowItem[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `${prefix}${i}`,
      ratio: 4 / 3,
    }));
  type Case = {
    p: ReturnType<typeof params> & { feature: "double" };
    r: () => number;
    items: RowItem[];
    layout: RowsLayout;
    /** The rows in view: a few rows somewhere past the head. */
    held: [number, number];
  };
  function* albums(): Generator<Case> {
    for (const width of [351, 728, 1400, 2520])
      for (const step of STEPS)
        for (let s = 0; s < 6; s++) {
          const p = { ...params(width, step), feature: "double" as const };
          const r = rng(s * 31 + width * 3 + step);
          const shapes = s % 2 === 0 ? album(140, r) : probe(140);
          const items = featured(shapes, s + 1, p.perRow);
          const layout = layoutRows(items, p);
          const n = layout.rows.length;
          const first = 5 + Math.floor(r() * (n - 14));
          yield {
            p,
            r,
            items,
            layout,
            held: [first, first + 1 + Math.floor(r() * 3)],
          };
        }
  }
  const pick = <T>(r: () => number, list: readonly T[]) =>
    list[Math.floor(r() * list.length)];
  const without = (items: RowItem[], id: string) =>
    items.filter((it) => it.id !== id);
  /** Whether any window of a reflow re-solved one of these old rows. */
  const touched = (next: Reflow, [h0, h1]: readonly [number, number]) =>
    next.windows.some(([a, b]) => a <= h1 && b >= h0);

  it("a hide above them re-lays only rows above them, a feature row re-forming included", () => {
    let hides = 0;
    let reached = 0;
    for (const { p, r, items, layout, held } of albums()) {
      const [h0] = held;
      const before = layout.rows.map(bytes);
      // The rows just above the view are where a window used to reach into it.
      for (const q of [h0 - 1, h0 - 2, h0 - 3]) {
        const victim = pick(r, layout.rows[q].ids);
        const list = without(items, victim);
        const next = reflowRows(layout, list, p, held);
        hides++;
        if (touched(reflowRows(layout, list, p), held)) reached++;
        expect(next.kind).toBe("local");
        expect(next.windows.every(([, b]) => b < h0)).toBe(true);
        // Every row from the view's first down is the very same row.
        const after = next.layout.rows.map(bytes);
        expect(after.slice(after.length - (before.length - h0))).toEqual(
          before.slice(h0),
        );
        expect(flat(next.layout)).toEqual(list.map((it) => it.id));
        // Under the cap: a feature row's own, at most twice a plain row's.
        for (const row of next.layout.rows)
          expect(row.height / layout.target).toBeLessThanOrEqual(
            capFor(p.perRow) * (row.feature ? FEATURE_SCALE : 1) +
              1 / layout.target,
          );
      }
    }
    expect(hides).toBeGreaterThan(200);
    // The pin bites: without the rows in view, a good share of these re-laid one of them.
    expect(reached).toBeGreaterThan(hides / 5);
  });

  it("a hide below them re-lays only rows below them", () => {
    for (const { p, r, items, layout, held } of albums()) {
      const [, h1] = held;
      const before = layout.rows.map(bytes);
      for (const q of [h1 + 1, h1 + 2]) {
        const list = without(items, pick(r, layout.rows[q].ids));
        const next = reflowRows(layout, list, p, held);
        expect(next.kind).toBe("local");
        expect(next.windows.every(([a]) => a > h1)).toBe(true);
        expect(next.layout.rows.slice(0, h1 + 1).map(bytes)).toEqual(
          before.slice(0, h1 + 1),
        );
        expect(flat(next.layout)).toEqual(list.map((it) => it.id));
      }
    }
  });

  it("a restore on their edge joins the row outside them", () => {
    for (const { p, r, items, layout, held } of albums()) {
      const [h0, h1] = held;
      const before = layout.rows.map(bytes);
      const back = featured(
        r() < 0.5 ? album(1, r, "back") : probe(1, "back"),
        7,
        p.perRow,
      );
      // Between the last photograph above the view and the first in it.
      const top = items.findIndex((it) => it.id === layout.rows[h0].ids[0]);
      const above = [...items.slice(0, top), ...back, ...items.slice(top)];
      const up = reflowRows(layout, above, p, held);
      expect(up.kind).toBe("local");
      const upRows = up.layout.rows.map(bytes);
      expect(upRows.slice(upRows.length - (before.length - h0))).toEqual(
        before.slice(h0),
      );
      expect(flat(up.layout)).toEqual(above.map((it) => it.id));
      // Between the last photograph in the view and the first below it.
      const end = items.findIndex((it) => it.id === layout.rows[h1 + 1].ids[0]);
      const below = [...items.slice(0, end), ...back, ...items.slice(end)];
      const down = reflowRows(layout, below, p, held);
      expect(down.kind).toBe("local");
      expect(down.layout.rows.slice(0, h1 + 1).map(bytes)).toEqual(
        before.slice(0, h1 + 1),
      );
      expect(flat(down.layout)).toEqual(below.map((it) => it.id));
    }
  });

  it("an arrival at the head re-lays only the rows above a view just past it", () => {
    let arrivals = 0;
    let letGo = 0;
    for (const { p, r, items, layout } of albums()) {
      const held: [number, number] = [1, 3];
      const fresh = featured(album(r() < 0.3 ? 3 : 1, r, "new"), 9, p.perRow);
      const list = [...fresh, ...items];
      const next = reflowRows(layout, list, p, held);
      arrivals++;
      expect(next.kind).toBe("local");
      if (next.windows[0][1] !== 0) {
        // The head row alone could not take them under its cap (a portrait
        // landing on a feature row of two landscapes): the view is let go,
        // exactly as if nothing were held, and never the album.
        expect(next).toEqual(reflowRows(layout, list, p));
        letGo++;
        continue;
      }
      expect(next.windows).toEqual([[0, 0]]);
      const before = layout.rows.map(bytes);
      const after = next.layout.rows.map(bytes);
      expect(after.slice(after.length - (before.length - 1))).toEqual(
        before.slice(1),
      );
    }
    expect(arrivals).toBeGreaterThan(60);
    expect(letGo).toBeLessThanOrEqual(arrivals / 20);
  });

  it("a change too big to be local re-solves the side it touched whole, never the rows in view", () => {
    for (const { p, r, items, layout } of albums()) {
      const n = layout.rows.length;
      if (n < 24) continue;
      const held: [number, number] = [n - 8, n - 6];
      // A host's bulk hide of a dozen photographs spread above a guest's view.
      const gone = new Set<string>();
      while (gone.size < 12)
        gone.add(pick(r, layout.rows[Math.floor(r() * (n - 9))].ids));
      const list = items.filter((it) => !gone.has(it.id));
      expect(reflowRows(layout, list, p).reason).toBe("bulk");
      const next = reflowRows(layout, list, p, held);
      expect(next.kind).toBe("local");
      expect(next.windows).toEqual([[0, n - 9]]);
      const before = layout.rows.map(bytes);
      const after = next.layout.rows.map(bytes);
      expect(after.slice(after.length - 8)).toEqual(before.slice(n - 8));
      expect(flat(next.layout)).toEqual(list.map((it) => it.id));
    }
  });

  it("a change IN a row they see re-justifies around it, exactly as without them", () => {
    for (const { p, r, items, layout, held } of albums()) {
      const [h0, h1] = held;
      const q = h0 + Math.floor(r() * (h1 - h0 + 1));
      const list = without(items, pick(r, layout.rows[q].ids));
      expect(reflowRows(layout, list, p, held)).toEqual(
        reflowRows(layout, list, p),
      );
    }
  });

  it("a side that cannot be laid under its cap lets the view go before the album", () => {
    // The head row left with one photograph, beside a view from row 1: alone,
    // a landscape stands far past the cap, and a window may not reach row 1.
    const p = { ...params(1400, DEFAULT_ROW_STEP), feature: "double" as const };
    const items = probe(80);
    const layout = layoutRows(items, p);
    const [keep, ...drop] = layout.rows[0].ids;
    const list = items.filter((it) => !drop.includes(it.id));
    expect(keep).toBeDefined();
    const free = reflowRows(layout, list, p);
    expect(free.kind).toBe("local");
    expect(reflowRows(layout, list, p, [1, 3])).toEqual(free);
  });

  it("ignores a range that names no rows", () => {
    const p = params(1400, DEFAULT_ROW_STEP);
    const items = album(80, rng(3));
    const layout = layoutRows(items, p);
    const list = without(items, layout.rows[4].ids[0]);
    const free = reflowRows(layout, list, p);
    for (const bad of [
      [-1, 2],
      [3, 2],
      [2, layout.rows.length],
      [1.5, 3],
    ] as [number, number][])
      expect(reflowRows(layout, list, p, bad)).toEqual(free);
  });
});

describe("the anchor end", () => {
  it("lands the leftovers in the oldest row: the last for newest-first, the first for oldest-first", () => {
    // Twenty-four identical portraits at five a row: four too many for four
    // rows, one short of five. Only the anchor row may run taller than the
    // band to hold them, so where the four land is the anchor's whole job.
    const portraits = Array.from({ length: 24 }, (_, i) => ({
      id: `p${i}`,
      ratio: 0.75,
    }));
    const p = { width: 1400, gap: GAP, perRow: 5 };
    const end = layoutRows(portraits, { ...p, anchor: "end" });
    const start = layoutRows(portraits, { ...p, anchor: "start" });
    expect(end.rows.map((row) => row.ids.length)).toEqual([5, 5, 5, 5, 4]);
    expect(start.rows.map((row) => row.ids.length)).toEqual([4, 5, 5, 5, 5]);
    // Still a full row, edge to edge, just taller.
    const last = end.rows[end.rows.length - 1];
    expect(last.justified).toBe(true);
    expect(last.height).toBeGreaterThan(end.rows[0].height);
  });

  it("lets only the anchor row leave the band", () => {
    for (let s = 0; s < 40; s++) {
      const items = album(47, rng(s + 500));
      const p = params(1400, DEFAULT_ROW_STEP);
      const band = bandFor(p.perRow);
      const end = layoutRows(items, { ...p, anchor: "end" });
      const start = layoutRows(items, { ...p, anchor: "start" });
      for (const row of end.rows.slice(0, -1))
        expect(row.height / end.target).toBeLessThanOrEqual(
          band + 1 / end.target,
        );
      for (const row of start.rows.slice(1))
        expect(row.height / start.target).toBeLessThanOrEqual(
          band + 1 / start.target,
        );
    }
  });

  it("grows an oldest-first album at its tail, leaving its head alone", () => {
    for (const width of [390, 1400])
      for (let s = 0; s < 8; s++) {
        const r = rng(s * 5 + width);
        const p = {
          ...params(width, DEFAULT_ROW_STEP),
          anchor: "start" as const,
        };
        let items = album(60, r);
        let layout = layoutRows(items, p);
        for (let k = 0; k < 10; k++) {
          items = [...items, ...album(1, r, `t${k}.`)];
          const next = reflowRows(layout, items, p);
          expect(next.kind).toBe("local");
          const [a, b] = next.windows[0];
          expect(b).toBe(layout.rows.length - 1);
          expect(b - a + 1).toBeLessThanOrEqual(4);
          expect(next.layout.rows.slice(0, a).map(bytes)).toEqual(
            layout.rows.slice(0, a).map(bytes),
          );
          layout = next.layout;
        }
      }
  });
});

describe("a tiny album sits centred", () => {
  it("lays an album too small to fill a row at the cap as one centred row at the cap", () => {
    for (const width of WIDTHS)
      for (const step of STEPS) {
        const p = params(width, step);
        let n = 1;
        let layout = layoutRows([{ id: "p0", ratio: 0.75 }], p);
        while (layout.tiny && n < 20) {
          const row = layout.rows[0];
          expect(layout.rows).toHaveLength(1);
          expect(row.justified).toBe(false);
          expect(row.height).toBe(Math.round(layout.target * capFor(p.perRow)));
          // It fits with room to spare, so the grid centres it.
          const used =
            row.widths.reduce((a, b) => a + b, 0) + (row.ids.length - 1) * GAP;
          expect(used).toBeLessThan(width);
          n++;
          layout = layoutRows(
            Array.from({ length: n }, (_, i) => ({ id: `p${i}`, ratio: 0.75 })),
            p,
          );
        }
        // The first album that can fill a row does, edge to edge.
        expect(layout.tiny).toBe(false);
        expect(layout.rows.every((row) => row.justified)).toBe(true);
      }
  });

  it("lays nothing for nothing", () => {
    const layout = layoutRows([], params(1400, DEFAULT_ROW_STEP));
    expect(layout.rows).toEqual([]);
    expect(layout.tiny).toBe(false);
  });
});

describe("a photograph with no dimensions takes the fallback ratio", () => {
  it("lays garbage ratios at the fallback and clamps the extremes into the band", () => {
    const items: RowItem[] = [
      { id: "nan", ratio: Number.NaN },
      { id: "zero", ratio: 0 },
      { id: "neg", ratio: -2 },
      { id: "inf", ratio: Number.POSITIVE_INFINITY },
      { id: "pano", ratio: 9 },
      { id: "sliver", ratio: 0.05 },
      ...album(30, rng(3)),
    ];
    const layout = layoutRows(items, params(1400, DEFAULT_ROW_STEP));
    const ratio = new Map(layout.items.map((it) => [it.id, it.ratio]));
    for (const id of ["nan", "zero", "neg", "inf"])
      expect(ratio.get(id)).toBe(ROW_FALLBACK_RATIO);
    expect(ratio.get("pano")).toBe(ROW_MAX_RATIO);
    expect(ratio.get("sliver")).toBe(ROW_MIN_RATIO);
    // And the album still justifies, every width a real whole pixel.
    for (const row of layout.rows) {
      expect(row.justified).toBe(true);
      for (const w of row.widths)
        expect(Number.isFinite(w) && w > 0).toBe(true);
    }
  });
});

describe("the reflow knows when it is not local", () => {
  const items = album(80, rng(42));
  const p = params(1400, DEFAULT_ROW_STEP);
  const layout = layoutRows(items, p);

  it("answers nothing for nothing", () => {
    const next = reflowRows(
      layout,
      items.map((it) => ({ ...it })),
      p,
    );
    expect(next.kind).toBe("none");
    expect(next.layout).toBe(layout);
  });

  it("lays afresh on a resize or a step change", () => {
    expect(reflowRows(layout, items, { ...p, width: 1300 }).reason).toBe(
      "params",
    );
    expect(reflowRows(layout, items, params(1400, 2)).reason).toBe("params");
    expect(reflowRows(null, items, p).reason).toBe("first");
  });

  it("lays afresh when what stayed changed its order, or most of the album changed", () => {
    const swapped = [...items];
    [swapped[10], swapped[50]] = [swapped[50], swapped[10]];
    expect(reflowRows(layout, swapped, p).reason).toBe("reorder");
    // A filter that keeps every third photograph is not a trickle.
    expect(
      reflowRows(
        layout,
        items.filter((_, i) => i % 3 === 0),
        p,
      ).kind,
    ).toBe("full");
  });
});

describe("the rhythm's feature rows", () => {
  const withPicks = (items: RowItem[], seed: number, perRow: number) => {
    const picks = pickFeatures(items, seed, perRow);
    return items.map((it) =>
      picks.has(it.id) ? { ...it, feature: true } : it,
    );
  };

  it("picks landscapes by a coin of the visit and the id alone", () => {
    const items = album(400, rng(9));
    const a = pickFeatures(items, 1234, 5);
    // The same visit answers the same, whatever the order it is asked in.
    expect([...pickFeatures([...items].reverse(), 1234, 5)].sort()).toEqual(
      [...a].sort(),
    );
    // A new photograph changes nobody else's pick.
    const grown = pickFeatures(
      [...album(20, rng(10), "new"), ...items],
      1234,
      5,
    );
    for (const id of a) expect(grown.has(id)).toBe(true);
    for (const id of a) {
      const it = items.find((m) => m.id === id)!;
      expect(it.ratio).toBeGreaterThanOrEqual(FEATURE_MIN_RATIO);
    }
    // Another visit, another handful; the same handful would be favourites.
    expect([...pickFeatures(items, 99, 5)].sort()).not.toEqual([...a].sort());
    // The picks nest: a denser step keeps only picks a sparser one made.
    const sparse = pickFeatures(items, 1234, 3);
    for (const id of a) expect(sparse.has(id)).toBe(true);
    // About one in eleven landscapes at five a row: rare, not a pattern.
    const landscapes = items.filter(
      (it) => it.ratio >= FEATURE_MIN_RATIO,
    ).length;
    expect(a.size / landscapes).toBeGreaterThan(0.03);
    expect(a.size / landscapes).toBeLessThan(0.2);
  });

  it("stands every feature row clearly taller, led by its pick, and still fills the box", () => {
    let featureRows = 0;
    for (const feature of ["double", "solo"] as const)
      for (const width of [560, 1400, 2520])
        for (let s = 0; s < 8; s++) {
          const perRow = perRowFor(width, DEFAULT_ROW_STEP);
          const items = withPicks(album(120, rng(s + width)), s + 1, perRow);
          const layout = layoutRows(items, {
            width,
            gap: GAP,
            perRow,
            feature,
          });
          const featured = new Set(
            items.filter((it) => it.feature).map((it) => it.id),
          );
          for (const row of layout.rows) {
            const used =
              row.widths.reduce((a, b) => a + b, 0) +
              (row.ids.length - 1) * GAP;
            expect(Math.abs(used - width)).toBeLessThanOrEqual(0.5);
            if (!row.feature) continue;
            featureRows++;
            expect(featured.has(row.ids[0])).toBe(true);
            expect(row.height / layout.target).toBeGreaterThanOrEqual(1.29);
            if (feature === "solo") expect(row.ids).toHaveLength(1);
          }
        }
    expect(featureRows).toBeGreaterThan(40);
  });

  it("keeps an arrival local with feature rows in the album", () => {
    for (const feature of ["double", "solo"] as const) {
      const perRow = perRowFor(1400, DEFAULT_ROW_STEP);
      const r = rng(77);
      let items = withPicks(album(90, r), 5, perRow);
      let layout = layoutRows(items, {
        width: 1400,
        gap: GAP,
        perRow,
        feature,
      });
      for (let k = 0; k < 20; k++) {
        items = [...withPicks(album(1, r, `f${k}.`), 5, perRow), ...items];
        const next = reflowRows(layout, items, {
          width: 1400,
          gap: GAP,
          perRow,
          feature,
        });
        expect(next.kind).toBe("local");
        const [a, b] = next.windows[0];
        expect(b - a + 1).toBeLessThanOrEqual(4);
        layout = next.layout;
      }
    }
  });

  it("turns itself off where every photograph is already alone (a phone's feed)", () => {
    const perRow = perRowFor(375, 0);
    expect(perRow).toBe(1);
    // By rule, not by arithmetic: one a row picks nobody at all.
    expect(pickFeatures(album(400, rng(4)), 3, perRow).size).toBe(0);
    const items = withPicks(album(80, rng(4)), 3, perRow);
    const layout = layoutRows(items, { width: 335, gap: GAP, perRow });
    expect(layout.rows.some((row) => row.feature)).toBe(false);
  });
});

describe("1,145 photographs lay out in a few milliseconds", () => {
  it("runs the full layout well inside a frame, at the densest and the sparsest step", () => {
    const items = album(1145, rng(1145));
    const time = (width: number, step: RowStep) => {
      layoutRows(items, params(width, step)); // warm
      const runs: number[] = [];
      for (let i = 0; i < 9; i++) {
        const t0 = performance.now();
        layoutRows(items, params(width, step));
        runs.push(performance.now() - t0);
      }
      return runs.sort((a, b) => a - b)[4];
    };
    // Measured at about half a millisecond; a slow CI machine gets headroom.
    expect(time(1400, 2)).toBeLessThan(10);
    expect(time(335, 0)).toBeLessThan(10);
  });
});
