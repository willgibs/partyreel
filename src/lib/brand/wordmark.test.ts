import { describe, expect, it } from "vitest";

import {
  WORDMARK_DISPLAY,
  WORDMARK_DISPLAY_FROM,
  WORDMARK_PATH,
  WORDMARK_SMALL,
  wordmarkCutFor,
} from "./wordmark";

/**
 * WHAT THE FINISHED WORDMARK OWES WILL'S DRAWING (brand-marks r1,
 * `wordmark=finished`): his letters byte for byte, only moved apart, and
 * parted so no two touch, by little enough that the word still reads as one
 * bold group ("rather than feel spaced out and spread focus").
 */

/** The outline of each of his ten shapes, as points (his path draws straight lines only). */
function outlines(d: string): [number, number][][] {
  return d.split(/(?=M)/).map((shape) => {
    const pts: [number, number][] = [];
    const tokens = shape.match(/[MLHVZ]|-?\d*\.?\d+/g) ?? [];
    let cmd = "";
    let x = 0;
    let y = 0;
    for (let i = 0; i < tokens.length; ) {
      const t = tokens[i];
      if (/[MLHVZ]/.test(t)) {
        cmd = t;
        i++;
        if (cmd === "Z") pts.push(pts[0]);
        continue;
      }
      if (cmd === "M" || cmd === "L") {
        x = Number(tokens[i]);
        y = Number(tokens[i + 1]);
        i += 2;
        if (cmd === "M") cmd = "L";
      } else if (cmd === "H") x = Number(tokens[i++]);
      else if (cmd === "V") y = Number(tokens[i++]);
      pts.push([x, y]);
    }
    return pts;
  });
}

/** The nearest distance between two outlines, edge to edge. */
function nearest(a: [number, number][], b: [number, number][]): number {
  const toSegment = (
    p: [number, number],
    q: [number, number],
    c: [number, number],
  ) => {
    const vx = q[0] - p[0];
    const vy = q[1] - p[1];
    const len = vx * vx + vy * vy;
    const t = len
      ? Math.max(
          0,
          Math.min(1, ((c[0] - p[0]) * vx + (c[1] - p[1]) * vy) / len),
        )
      : 0;
    return Math.hypot(p[0] + t * vx - c[0], p[1] + t * vy - c[1]);
  };
  let best = Infinity;
  for (let i = 0; i + 1 < a.length; i++)
    for (let j = 0; j + 1 < b.length; j++)
      best = Math.min(
        best,
        toSegment(a[i], a[i + 1], b[j]),
        toSegment(a[i], a[i + 1], b[j + 1]),
        toSegment(b[j], b[j + 1], a[i]),
        toSegment(b[j], b[j + 1], a[i + 1]),
      );
  return best;
}

/** His neighbours, by shape index in his file: P|a, a|r, y|r, e|e, e|l. */
const PAIRS = {
  "P|a": [7, 1],
  "a|r": [1, 0],
  "y|r": [0, 3],
  "e|e": [3, 5],
  "e|l": [5, 9],
} as const;

const gaps = (d: string) => {
  const shapes = outlines(d);
  return Object.fromEntries(
    Object.entries(PAIRS).map(([pair, [a, b]]) => [
      pair,
      nearest(shapes[a], shapes[b]),
    ]),
  ) as Record<keyof typeof PAIRS, number>;
};

describe("the wordmark's two cuts", () => {
  it("move his shapes and change none of them", () => {
    // Every shape of a cut is his own, moved: the same commands in the same
    // order, every y his, every x his plus one amount for the whole shape.
    const his = WORDMARK_PATH.split(/(?=M)/);
    const numbers = (shape: string) =>
      [...shape.matchAll(/-?\d*\.?\d+/g)].map((m) => Number(m[0]));
    const commands = (s: string) => s.replace(/[-\d.\s,]+/g, " ").trim();
    for (const cut of [WORDMARK_DISPLAY, WORDMARK_SMALL]) {
      const shapes = cut.d.split(/(?=M)/);
      expect(shapes, cut.id).toHaveLength(10);
      shapes.forEach((shape, i) => {
        expect(commands(shape)).toBe(commands(his[i]));
        const mine = numbers(shape);
        const theirs = numbers(his[i]);
        const moved = mine.map((n, k) => Math.round((n - theirs[k]) * 1000));
        // An M and an L carry x then y, an H an x alone: every non-zero move
        // in a shape is the same one, and never to the left.
        const moves = new Set(moved.filter(Boolean));
        expect(moves.size, `${cut.id} shape ${i}`).toBeLessThanOrEqual(1);
        for (const m of moves) expect(m).toBeGreaterThan(0);
      });
    }
  });

  it("part the three pairs he drew touching, the small cut a step more than the display", () => {
    const drawn = gaps(WORDMARK_PATH);
    const display = gaps(WORDMARK_DISPLAY.d);
    const small = gaps(WORDMARK_SMALL.d);
    // As drawn, the y's arm meets the r's stem, the e's kiss at their waists
    // and the P rides the a: under a unit, a third of a pixel at 22px.
    for (const pair of ["P|a", "y|r", "e|e"] as const) {
      expect(drawn[pair], pair).toBeLessThan(1);
      // A hair from 48px up: a unit and more, a pixel's seam at 48px.
      expect(display[pair], pair).toBeGreaterThanOrEqual(1);
      // The bars' cut: near two units, a seam at 22px in every pixel phase.
      expect(small[pair], pair).toBeGreaterThanOrEqual(1.8);
    }
    // The two open pairs keep his white in the display cut, and take the
    // others' breath in the small one, so the white stays even.
    for (const pair of ["a|r", "e|l"] as const) {
      expect(display[pair]).toBeCloseTo(drawn[pair], 2);
      expect(small[pair]).toBeGreaterThan(drawn[pair]);
    }
  });

  it("stay one bold group: never tracked out", () => {
    // Will's note on the pick is the rule: "the wordmark should present as a
    // singular group ... rather than feel spaced out and spread focus". No
    // seam in either cut reaches the width of his own counters' white (5 to
    // 6.3 units across the x-height), and the word grows by under 3%.
    for (const cut of [WORDMARK_DISPLAY, WORDMARK_SMALL]) {
      for (const [pair, gap] of Object.entries(gaps(cut.d)))
        expect(gap, `${cut.id} ${pair}`).toBeLessThan(3.5);
      expect(cut.width / 308, cut.id).toBeLessThan(1.03);
    }
    expect(WORDMARK_SMALL.width).toBeGreaterThan(WORDMARK_DISPLAY.width);
    expect(WORDMARK_DISPLAY.width).toBeGreaterThan(308);
  });

  it("box each cut to its own width, 64 tall", () => {
    for (const cut of [WORDMARK_DISPLAY, WORDMARK_SMALL]) {
      expect(cut.viewBox).toBe(`0 0 ${cut.width} 64`);
      expect(cut.aspect).toBeCloseTo(cut.width / 64, 6);
      const xs = outlines(cut.d)
        .flat()
        .map(([x]) => x);
      expect(Math.max(...xs)).toBeLessThanOrEqual(cut.width);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    }
  });

  it("draws the small cut under 48px and the display cut from 48px up", () => {
    expect(WORDMARK_DISPLAY_FROM).toBe(48);
    expect(wordmarkCutFor(16)).toBe(WORDMARK_SMALL);
    expect(wordmarkCutFor(22)).toBe(WORDMARK_SMALL);
    expect(wordmarkCutFor(47.9)).toBe(WORDMARK_SMALL);
    expect(wordmarkCutFor(48)).toBe(WORDMARK_DISPLAY);
    expect(wordmarkCutFor(400)).toBe(WORDMARK_DISPLAY);
  });
});
