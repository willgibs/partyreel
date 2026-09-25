/**
 * THE REEL'S DEFAULTS: THE STEPS, THE MOODS, AND THE ENVELOPE THE DATABASE HOLDS AROUND THEM.
 *
 * The steps' one home is `defaults.ts`; the database keeps only an envelope CHECK around them
 * (`events_reel_hold_sec_range`), so a new step needs no migration as long as it sits inside. The
 * envelope is read off the LATEST migration that states it, so a step added outside it fails here
 * rather than at a host's first save.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOLD_SEC,
  HOLD_STEPS_SEC,
  REEL_MOOD_IDS,
  isHoldStep,
  isReelMoodId,
  nearestHoldStep,
  resolveHoldSec,
} from "@/lib/reel/defaults";
import {
  DEFAULT_STYLE_ID,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";

const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "supabase/migrations");

/** The hold envelope's bounds, from the last migration that states the CHECK. */
function holdEnvelope(): { min: number; max: number } {
  let found: { min: number; max: number } | null = null;
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ");
    for (const [, min, max] of sql.matchAll(
      /constraint events_reel_hold_sec_range check \(reel_hold_sec is null or \(reel_hold_sec >= ([0-9.]+) and reel_hold_sec <= ([0-9.]+)\)\)/g,
    )) {
      found = { min: Number(min), max: Number(max) };
    }
  }
  expect(
    found,
    "no migration states events_reel_hold_sec_range",
  ).not.toBeNull();
  return found!;
}

describe("the hold's steps", () => {
  it("are the view's seven, ascending, with the 3 s default among them", () => {
    expect(HOLD_STEPS_SEC).toEqual([1, 1.5, 2.2, 3, 3.6, 5, 7]);
    expect([...HOLD_STEPS_SEC].sort((a, b) => a - b)).toEqual([
      ...HOLD_STEPS_SEC,
    ]);
    expect(new Set(HOLD_STEPS_SEC).size).toBe(HOLD_STEPS_SEC.length);
    expect(DEFAULT_HOLD_SEC).toBe(3);
    expect(isHoldStep(DEFAULT_HOLD_SEC)).toBe(true);
  });

  it("every step sits inside the database's envelope, which is looser than the steps", () => {
    const { min, max } = holdEnvelope();
    for (const step of HOLD_STEPS_SEC) {
      expect(step, `${step} s`).toBeGreaterThanOrEqual(min);
      expect(step, `${step} s`).toBeLessThanOrEqual(max);
    }
    // Room on both sides: a new step is an app change, never a migration.
    expect(min).toBeLessThan(HOLD_STEPS_SEC[0]);
    expect(max).toBeGreaterThan(HOLD_STEPS_SEC[HOLD_STEPS_SEC.length - 1]);
  });
});

describe("isHoldStep: exactly a step, nothing near one", () => {
  it("accepts every step", () => {
    for (const step of HOLD_STEPS_SEC) expect(isHoldStep(step)).toBe(true);
  });

  it("refuses a near miss, zero, a negative, the non-finite and anything not a number", () => {
    for (const value of [
      2.5,
      2.2000001,
      0,
      -1,
      30,
      NaN,
      Infinity,
      -Infinity,
      "3",
      null,
      undefined,
      true,
    ]) {
      expect(isHoldStep(value), String(value)).toBe(false);
    }
  });
});

describe("the moods a host may set", () => {
  it("are the catalog's eight moods, in its order, the default mood among them", () => {
    expect(REEL_MOOD_IDS).toEqual(
      STYLE_CATALOG.filter((entry) => entry.kind === "mood").map(
        (entry) => entry.id,
      ),
    );
    expect(REEL_MOOD_IDS).toHaveLength(8);
    expect(REEL_MOOD_IDS).toContain(DEFAULT_STYLE_ID);
  });

  it("isReelMoodId refuses a treatment, an unknown id and anything not a string", () => {
    for (const id of REEL_MOOD_IDS) expect(isReelMoodId(id)).toBe(true);
    const treatments = STYLE_CATALOG.filter(
      (entry) => entry.kind === "treatment",
    );
    expect(treatments.length).toBeGreaterThan(0);
    for (const entry of treatments)
      expect(isReelMoodId(entry.id), entry.id).toBe(false);
    for (const value of [
      "neon",
      "",
      "Classic",
      " classic",
      null,
      undefined,
      3,
    ]) {
      expect(isReelMoodId(value), String(value)).toBe(false);
    }
  });
});

describe("reading a stored hold", () => {
  it("snaps an odd value to its nearest step, and a non-finite one to the default", () => {
    expect(nearestHoldStep(2.5)).toBe(2.2);
    expect(nearestHoldStep(4.4)).toBe(5);
    expect(nearestHoldStep(0.5)).toBe(1);
    expect(nearestHoldStep(30)).toBe(7);
    expect(nearestHoldStep(NaN)).toBe(DEFAULT_HOLD_SEC);
  });

  it("★ resolveHoldSec reads null as the default, never as the 1 s step", () => {
    // The RPC's generated type says `number`, but the column is NULL until a host sets it.
    expect(resolveHoldSec(null)).toBe(DEFAULT_HOLD_SEC);
    expect(resolveHoldSec(undefined)).toBe(DEFAULT_HOLD_SEC);
    for (const step of HOLD_STEPS_SEC) expect(resolveHoldSec(step)).toBe(step);
    expect(resolveHoldSec(2.5)).toBe(2.2);
  });
});
