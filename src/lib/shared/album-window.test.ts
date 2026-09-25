/**
 * THE WINDOW'S ARITHMETIC (the album-window lane). What is held: the rows a
 * view mounts are exactly the rows that meet it plus the overscan, the spacers
 * put every mounted row at the top the prefix sum gives it, and an anchor keeps
 * the photograph a reader is looking at on the very pixel it sat on, through a
 * head arrival, a hide above, a mid-album insert and a step change, on real
 * engine layouts.
 */
import { describe, expect, it } from "vitest";

import { layoutRows, perRowFor, reflowRows, type RowItem } from "./album-rows";
import {
  albumHeight,
  anchoredViewTop,
  anchorShift,
  holdForMomentum,
  MOMENTUM_IDLE_MS,
  mountedRanges,
  OVERSCAN,
  rowAt,
  rowBottom,
  rowTops,
  sameRanges,
  spacerHeights,
  topAnchor,
  windowRange,
} from "./album-window";

const GAP = 4;
const rows = (heights: number[]) =>
  heights.map((height, r) => ({ height, ids: [`r${r}a`, `r${r}b`] }));

/** A seeded party album (mostly phone portraits), as the engine's own tests deal them. */
function album(n: number, seed: number, prefix = "m"): RowItem[] {
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shapes = [0.75, 0.75, 0.75, 0.5625, 1.333, 1.333, 1, 1.778];
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i}`,
    ratio: shapes[Math.floor(r() * shapes.length)],
  }));
}

describe("the prefix sum and the binary search", () => {
  const laid = rows([100, 200, 150, 50]);
  const tops = rowTops(laid, GAP);

  it("puts every row at the sum of the heights and gaps above it", () => {
    expect([...tops]).toEqual([0, 104, 308, 462, 516]);
    expect(albumHeight(tops, GAP)).toBe(512);
    expect(rowBottom(tops, 1, GAP)).toBe(304);
  });

  it("finds the row under any y, the gap under a row answering that row", () => {
    expect(rowAt(tops, -500)).toBe(0);
    expect(rowAt(tops, 0)).toBe(0);
    expect(rowAt(tops, 99)).toBe(0);
    expect(rowAt(tops, 102)).toBe(0); // the gap under row 0
    expect(rowAt(tops, 104)).toBe(1);
    expect(rowAt(tops, 461)).toBe(2);
    expect(rowAt(tops, 9999)).toBe(3);
  });

  it("agrees with a linear scan on a whole album", () => {
    const layout = layoutRows(album(400, 3), {
      width: 1400,
      gap: GAP,
      perRow: 5,
    });
    const t = rowTops(layout.rows, GAP);
    for (let y = -100; y < albumHeight(t, GAP) + 100; y += 37) {
      let linear = 0;
      for (let r = 0; r < layout.rows.length; r++) if (t[r] <= y) linear = r;
      expect(rowAt(t, y)).toBe(linear);
    }
  });
});

describe("the window", () => {
  const laid = rows(Array.from({ length: 100 }, () => 96)); // 100 rows, a row every 100px
  const tops = rowTops(laid, GAP);

  it("mounts one viewport behind and two ahead, in whole rows", () => {
    expect(OVERSCAN).toEqual({ behind: 1, ahead: 2 });
    // The view shows 2000..2800: the window reaches 1200..4400.
    expect(windowRange(tops, { top: 2000, height: 800 })).toEqual([12, 44]);
  });

  it("clamps at both ends and mounts nothing for no rows", () => {
    expect(windowRange(tops, { top: -300, height: 800 })).toEqual([0, 21]);
    // At the foot: the rows behind, and the last row, however far past it.
    expect(windowRange(tops, { top: 9700, height: 800 })).toEqual([89, 99]);
    expect(windowRange(tops, { top: 99_000, height: 800 })).toEqual([99, 99]);
    expect(windowRange(rowTops([], GAP), { top: 0, height: 800 })).toBeNull();
  });

  it("keeps a pinned row mounted anywhere, merging what touches", () => {
    expect(mountedRanges([10, 20], [])).toEqual([[10, 20]]);
    expect(mountedRanges([10, 20], [3])).toEqual([
      [3, 3],
      [10, 20],
    ]);
    expect(mountedRanges([10, 20], [21, 15])).toEqual([[10, 21]]);
    expect(mountedRanges(null, [4])).toEqual([[4, 4]]);
    expect(sameRanges([[1, 2]], [[1, 2]])).toBe(true);
    expect(sameRanges([[1, 2]], [[1, 3]])).toBe(false);
  });

  it("stands spacers so every mounted row lands on its prefix-sum top", () => {
    const laidOut = layoutRows(album(300, 11), {
      width: 1400,
      gap: GAP,
      perRow: 5,
    });
    const t = rowTops(laidOut.rows, GAP);
    const ranges = mountedRanges([20, 30], [5]);
    const { before, between, after } = spacerHeights(t, ranges, GAP);
    // Walk the column the DOM would build: spacer, rows with a gap between
    // each, spacer, rows, spacer. Every row's top must be the prefix sum's.
    let y = before;
    ranges.forEach(([a, b], i) => {
      for (let r = a; r <= b; r++) {
        expect(y, `row ${r}`).toBeCloseTo(t[r], 6);
        y += laidOut.rows[r].height + (r < b ? GAP : 0);
      }
      y += i < between.length ? between[i] : after;
    });
    expect(y).toBeCloseTo(albumHeight(t, GAP), 6);
  });

  it("mounts every row of a short album with no spacer at all", () => {
    const t = rowTops(rows([100, 100]), GAP);
    const ranges = mountedRanges(windowRange(t, { top: 0, height: 800 }));
    expect(ranges).toEqual([[0, 1]]);
    expect(spacerHeights(t, ranges, GAP)).toEqual({
      before: 0,
      between: [],
      after: 0,
    });
  });
});

describe("the anchor keeps the photograph a reader is looking at on its pixel", () => {
  const P = { width: 1400, gap: GAP, perRow: perRowFor(1400, 1) };

  /** Where `id`'s row top sits relative to the view's top, in a layout. */
  const screenY = (
    layout: ReturnType<typeof layoutRows>,
    id: string,
    viewTop: number,
  ) => {
    const t = rowTops(layout.rows, GAP);
    const r = layout.rows.findIndex((row) => row.ids.includes(id));
    return t[r] - viewTop;
  };

  it("holds through a head arrival while the reader is deep", () => {
    for (let s = 0; s < 20; s++) {
      let items = album(600, s);
      let layout = layoutRows(items, P);
      const viewTop = albumHeight(rowTops(layout.rows, GAP), GAP) / 2 + s * 13;
      const anchors = topAnchor(
        layout.rows,
        rowTops(layout.rows, GAP),
        GAP,
        viewTop,
      );
      const target = anchors[0];
      const before = screenY(layout, target.id, viewTop);
      items = [...album(1 + (s % 3), s + 99, `n${s}.`), ...items];
      layout = reflowRows(layout, items, P).layout;
      const next = anchoredViewTop(
        anchors,
        layout.rows,
        rowTops(layout.rows, GAP),
      )!;
      expect(screenY(layout, target.id, next)).toBeCloseTo(before, 6);
    }
  });

  it("holds through a hide above, a mid-album insert and a hide of the anchor itself", () => {
    const items = album(500, 7);
    const layout = layoutRows(items, P);
    const tops = rowTops(layout.rows, GAP);
    const viewTop = tops[60] + 17;
    const anchors = topAnchor(layout.rows, tops, GAP, viewTop);
    const first = anchors[0].id;

    // A hide ten rows above.
    const hidden = layout.rows[50].ids[0];
    const afterHide = reflowRows(
      layout,
      items.filter((it) => it.id !== hidden),
      P,
    ).layout;
    const v1 = anchoredViewTop(
      anchors,
      afterHide.rows,
      rowTops(afterHide.rows, GAP),
    )!;
    expect(screenY(afterHide, first, v1)).toBeCloseTo(
      screenY(layout, first, viewTop),
      6,
    );

    // A late approval landing mid-album, above the reader.
    const at = items.findIndex((it) => it.id === layout.rows[40].ids[0]);
    const inserted = reflowRows(
      layout,
      [...items.slice(0, at), ...album(1, 5, "late"), ...items.slice(at)],
      P,
    ).layout;
    const v2 = anchoredViewTop(
      anchors,
      inserted.rows,
      rowTops(inserted.rows, GAP),
    )!;
    expect(screenY(inserted, first, v2)).toBeCloseTo(
      screenY(layout, first, viewTop),
      6,
    );

    // The anchor photograph itself hidden: the next candidate holds instead.
    const gone = reflowRows(
      layout,
      items.filter((it) => it.id !== first),
      P,
    ).layout;
    const v3 = anchoredViewTop(anchors, gone.rows, rowTops(gone.rows, GAP));
    expect(v3).not.toBeNull();
    const survivor = anchors.find((a) => a.id !== first)!;
    expect(screenY(gone, survivor.id, v3!)).toBeCloseTo(survivor.offset, 6);
  });

  it("holds a focal point through a step change: the pinched photograph stays under the fingers", () => {
    const items = album(400, 21);
    const sparse = layoutRows(items, { ...P, perRow: perRowFor(1400, 0) });
    const dense = layoutRows(items, { ...P, perRow: perRowFor(1400, 2) });
    const ts = rowTops(sparse.rows, GAP);
    const r = 30;
    const id = sparse.rows[r].ids[1];
    const viewTop = ts[r] - 200;
    // The fingers at 40% down the photograph, 260px below the view's top.
    const focal = { id, fraction: 0.4, offset: 260 };
    const td = rowTops(dense.rows, GAP);
    const next = anchoredViewTop([focal], dense.rows, td)!;
    const rd = dense.rows.findIndex((row) => row.ids.includes(id));
    expect(td[rd] + 0.4 * dense.rows[rd].height - next).toBeCloseTo(260, 6);
    expect(viewTop).toBeLessThan(ts[r]);
  });

  it("skips what is not a photograph, and answers nothing for nothing", () => {
    const laid = [
      { height: 100, ids: ["rows-head:stack", "a"] },
      { height: 100, ids: ["b"] },
    ];
    const t = rowTops(laid, GAP);
    const anchors = topAnchor(
      laid,
      t,
      GAP,
      10,
      (id) => !id.startsWith("rows-head:"),
    );
    expect(anchors.map((a) => a.id)).toEqual(["a", "b"]);
    expect(anchors[0].offset).toBe(-10);
    expect(topAnchor([], rowTops([], GAP), GAP, 0)).toEqual([]);
    expect(
      anchoredViewTop([{ id: "zz", offset: 0, fraction: 0 }], laid, t),
    ).toBeNull();
  });

  it("starts from the next row when the view's top falls in a gap", () => {
    const laid = rows([100, 100, 100]);
    const t = rowTops(laid, GAP);
    expect(topAnchor(laid, t, GAP, 102)[0].id).toBe("r1a");
  });
});

describe("the anchor's shift is a difference, not a position", () => {
  it("equals the scroll that brings the anchor back to its pixel, whatever the view", () => {
    const P = { width: 900, gap: GAP, perRow: perRowFor(900, 1) };
    let items = album(300, 44);
    const before = layoutRows(items, P);
    const tb = rowTops(before.rows, GAP);
    items = [...album(2, 45, "head."), ...items];
    const after = reflowRows(before, items, P).layout;
    const ta = rowTops(after.rows, GAP);
    const n = before.rows.length;
    expect(n).toBeGreaterThan(40);
    for (const viewTop of [tb[20], tb[20] + 33, tb[n - 5] - 5]) {
      const anchors = topAnchor(before.rows, tb, GAP, viewTop);
      const shift = anchorShift(
        anchors,
        { rows: before.rows, tops: tb },
        { rows: after.rows, tops: ta },
      )!;
      const kept = anchoredViewTop(anchors, after.rows, ta)!;
      expect(viewTop + shift).toBeCloseTo(kept, 6);
    }
    expect(
      anchorShift(
        [{ id: "nobody", offset: 0, fraction: 0 }],
        { rows: before.rows, tops: tb },
        { rows: after.rows, tops: ta },
      ),
    ).toBeNull();
  });
});

describe("a touch scroll is never moved mid-flick", () => {
  it("holds a shifting change until the scroll has been still for the idle beat", () => {
    expect(MOMENTUM_IDLE_MS).toBe(150);
    expect(holdForMomentum({ touch: true, shift: 300, sinceScroll: 40 })).toBe(
      true,
    );
    expect(holdForMomentum({ touch: true, shift: 300, sinceScroll: 150 })).toBe(
      false,
    );
    // Nothing to write, nothing to wait for; and a mouse or trackpad never waits.
    expect(holdForMomentum({ touch: true, shift: 0.2, sinceScroll: 10 })).toBe(
      false,
    );
    expect(holdForMomentum({ touch: false, shift: 300, sinceScroll: 10 })).toBe(
      false,
    );
  });
});
