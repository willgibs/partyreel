import { describe, expect, it } from "vitest";

import { optionLabel, optionMeans } from "@/components/lab/board-spec";

import { HOME } from "./field";
import {
  ARMS,
  centreOf,
  facts,
  GAPS,
  type HeroSpec,
  keepOut,
  PACES,
  PATHS,
  pathsOf,
  SPACING,
  specOf,
  TRAILS,
} from "./paths";
import { PRIVACY_HERO } from "./spec";

/**
 * ROUND TWO'S WORDS AGAINST THE ENGINE'S NUMBERS.
 *
 * Every figure a tile states is measured here on the real paths inside the real
 * canvas, so a retune turns THIS red rather than reaching Will as a tile that
 * says one thing and shows another. Round one's `spirals.test.ts` did the same
 * job for the mechanism it replaced.
 *
 * It also holds the two structural promises the board makes in words: that the
 * pace and the gap are separate questions (answering one does not move the
 * other), and that nothing is ever born on top of the lockup.
 */

const BASE: HeroSpec = {
  mode: "desktop",
  pace: "over",
  gap: "tight",
  trail: "linger",
  path: "spiral",
  arms: "same",
};

/** The board writes a thousands separator, because a reviewer reads these. */
const fmt = (n: number) => n.toLocaleString("en-US");

const tile = (ask: string, option: string) => {
  const a = PRIVACY_HERO.asks.find((x) => x.id === ask)!;
  const o = a.options.find(
    (x) => (typeof x === "string" ? x : x.id) === option,
  )!;
  return `${optionLabel(o)} ${optionMeans(o) ?? ""}`;
};

describe("the pace tiles", () => {
  it("state the beat and the count the engine really draws", () => {
    for (const pace of PACES) {
      const f = facts({ ...BASE, pace });
      expect(tile("pace", pace), `pace ${pace} beat`).toContain(
        `${f.armBeat} ms`,
      );
      expect(tile("pace", pace), `pace ${pace} lit`).toContain(`${f.lit}`);
    }
  });

  it("is OVER the home hero at both options, which is the whole note", () => {
    for (const pace of PACES) {
      const f = facts({ ...BASE, pace });
      expect(f.armBeat, `pace ${pace}`).toBeLessThan(HOME.desktop.beat);
      expect(f.lit, `pace ${pace}`).toBeGreaterThanOrEqual(HOME.desktop.lit);
    }
    // And the two are a real notch apart rather than the same answer twice.
    expect(facts({ ...BASE, pace: "rush" }).armBeat).toBeLessThan(
      facts({ ...BASE, pace: "over" }).armBeat * 0.85,
    );
  });

  it("quotes the home hero's own numbers, read off the shipped engine", () => {
    expect(tile("pace", "over")).toContain(`${fmt(HOME.desktop.beat)} ms`);
    expect(PRIVACY_HERO.context).toContain(fmt(HOME.desktop.beat));
    expect(PRIVACY_HERO.context).toContain(String(HOME.desktop.lit));
  });
});

describe("the gap tiles", () => {
  it("state the spacing and the source speed each option really uses", () => {
    for (const gap of GAPS) {
      const f = facts({ ...BASE, gap });
      expect(f.gap).toBe(Math.round(200 * SPACING[gap]));
      expect(tile("gap", gap), `gap ${gap}`).toContain(`${f.gap} px`);
    }
    expect(tile("gap", "stack")).toContain(
      `${facts({ ...BASE, gap: "stack" }).speed} px a second`,
    );
  });

  it("starts at round one's tightest and only goes tighter", () => {
    // "the gap starts at overlapping and goes tighter": 0.75 was round one's
    // `overlap`, and the id is kept so the ledger joins across the two rounds.
    expect(SPACING.overlap).toBe(0.75);
    expect(SPACING.tight).toBeLessThan(SPACING.overlap);
    expect(SPACING.stack).toBeLessThan(SPACING.tight);
  });

  it("keeps the pace and the gap SEPARATE, which the context promises", () => {
    // The source's speed is derived from the two, so answering the gap tighter
    // slows the point rather than speeding the hero up. Within a tenth.
    const beats = GAPS.map((gap) => facts({ ...BASE, gap }).armBeat);
    for (const b of beats) expect(b / beats[0]).toBeCloseTo(1, 1);
    const speeds = GAPS.map((gap) => facts({ ...BASE, gap }).speed);
    expect(speeds[0]).toBeGreaterThan(speeds[2]);
  });
});

describe("the trail tiles", () => {
  it("state the life and the count each option really has", () => {
    for (const trail of TRAILS) {
      const f = facts({ ...BASE, trail });
      const secs = (f.life / 1000).toFixed(1).replace(/\.0$/, "");
      expect(tile("trail", trail), `trail ${trail} life`).toContain(secs);
      expect(tile("trail", trail), `trail ${trail} lit`).toContain(`${f.lit}`);
    }
  });

  it("promises more on screen the longer it lives, and delivers it", () => {
    const lit = TRAILS.map((trail) => facts({ ...BASE, trail }).lit);
    expect(lit[0]).toBeLessThan(lit[1]);
    expect(lit[1]).toBeLessThan(lit[2]);
  });
});

describe("the figure and the phone", () => {
  it("state the count each option really draws", () => {
    for (const path of PATHS) {
      const f = facts({ ...BASE, path });
      expect(tile("path", path), `path ${path}`).toContain(`${f.lit}`);
    }
    for (const arms of ARMS) {
      const f = facts({ ...BASE, mode: "phone", arms });
      expect(tile("phone", arms), `phone ${arms}`).toContain(`${f.lit}`);
    }
  });

  it("draws the wander at the pace that was picked, not slower", () => {
    // A figure that doubles back covers less ground between births than its
    // speed suggests, so it is compensated; without that the figure question
    // would secretly be a second pace question.
    const a = facts({ ...BASE, path: "spiral" }).armBeat;
    const b = facts({ ...BASE, path: "wander" }).armBeat;
    expect(b / a).toBeCloseTo(1, 0);
  });

  it("keeps both phone options inside the column's own bands", () => {
    for (const arms of ARMS) {
      const s: HeroSpec = { ...BASE, mode: "phone", arms };
      for (const path of pathsOf(s)) {
        for (let t = 0; t < 12_000; t += 100) {
          const p = path(t);
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        }
      }
    }
  });
});

describe("the composition", () => {
  it("never births a photograph over a line of type", () => {
    // Two boxes miss the moment ONE axis separates them, so a point is clear
    // when it is outside the keep-out on x OR on y. Walked over both figures,
    // both screens and every pace, because the figure is the thing that could
    // drift back over the words when a number is retuned.
    for (const mode of ["desktop", "phone"] as const) {
      const c = centreOf(mode);
      const k = keepOut(mode);
      for (const path of PATHS) {
        for (const pace of PACES) {
          for (const walk of pathsOf({ ...BASE, mode, path, pace })) {
            for (let i = 0; i < 900; i++) {
              const p = walk(i * 40);
              const dx = Math.abs(p.x - c.x);
              const dy = Math.abs(p.y - c.y);
              expect(
                dx >= k.x || dy >= k.y,
                `${mode}/${path}/${pace} at ${i * 40} ms: ${Math.round(dx)},${Math.round(dy)} inside ${Math.round(k.x)},${Math.round(k.y)}`,
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it("costs a hero a pool that holds what is lit, and no more", () => {
    for (const pace of PACES) {
      for (const trail of TRAILS) {
        const f = facts({ ...BASE, pace, trail });
        expect(f.nodes, `${pace}/${trail}`).toBeGreaterThanOrEqual(f.lit);
        // Two rings of at most the engine's own ceiling.
        expect(f.nodes, `${pace}/${trail}`).toBeLessThanOrEqual(48);
      }
    }
  });

  it("never lets the keeper hold a photograph on a path", () => {
    // The keeper exists for a cursor that stops. A path never stops, so a held
    // photograph would simply be one that will not go.
    expect(specOf(BASE).keeper).toBe(false);
  });
});
