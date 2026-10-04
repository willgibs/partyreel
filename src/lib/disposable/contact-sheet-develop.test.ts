/**
 * THE DEVELOP, AS DATA (the-wait r2, Will's `arrival=in-place`): the sheet she watched develops where it stood into the
 * album's first rows, once per device, its tempo and easing one set of tokens.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { columnsFor, sheetCapFor } from "@/lib/disposable/contact-sheet";
import {
  DEVELOP_TEMPO,
  developGateScript,
  developLength,
  developMarkKey,
  developMs,
  developVars,
  developVerdict,
  growAt,
  layoutDevelopSheet,
  parseDevelopMark,
  restAt,
  rollOfEntries,
  rowOf,
  sinkAt,
  waveAt,
} from "@/lib/disposable/contact-sheet-develop";
import type { ManifestEntry } from "@/lib/events/album-wire";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
/** An album entry created at `ms` (the wire carries microseconds). */
const entry = (n: number, ms: number): ManifestEntry => [
  id(n),
  4,
  3,
  2,
  ms * 1000,
];

const DEVELOP = Date.parse("2026-10-04T13:00:00Z");
const MIN = 60_000;

describe("the tempo and the easing are tokens, with one home", () => {
  it("★ the board's in-place take, as picked: the wave from 150 ms over 950, the word at 1.25 s, the cover at 1.65 s, the open at 1.75 s, 2.95 s in all", () => {
    expect(DEVELOP_TEMPO.full).toEqual({
      wave: 150,
      spread: 950,
      word: 1250,
      cover: 1650,
      open: 1750,
    });
    // Where nothing grows, the take runs until the album's last photograph has risen, just past the cover.
    expect(developLength("full", 0)).toBe(
      Math.max(2950, restAt(Number.MAX_SAFE_INTEGER) + DEVELOP_TEMPO.ms.tile),
    );
    expect(DEVELOP_TEMPO.full.cover + DEVELOP_TEMPO.ms.cover).toBe(2950);
  });

  it("★ reduced motion is its own pass: every square at once, the word at 0.7 s, the album and the cover at 1.5 s, 2.8 s in all", () => {
    expect(DEVELOP_TEMPO.reduced).toEqual({
      wave: 200,
      spread: 0,
      word: 700,
      cover: 1500,
      open: 1500,
    });
    expect(developLength("reduced", 12)).toBe(2800);
    for (let i = 0; i < 40; i++) expect(waveAt(i, 40, "reduced")).toBe(200);
  });

  it("★ the stylesheet names no duration or curve of its own: every one it reads is a token written for the play", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/guest/gallery-empty-state.css"),
      "utf8",
    );
    const develop = css.slice(css.indexOf("THE DEVELOP (the-wait r2"));
    const code = develop.replace(/\/\*[\s\S]*?\*\//g, "");
    // Nothing timed by a number: only the tokens (a keyframe's percentages are its shape, not its tempo).
    expect(code).not.toMatch(/\b\d+m?s\b/);
    const vars = developVars("full");
    // The parts' own moments and boxes are written on each part (`--develop-at`, the square a tile grows from), and the
    // box's height by the stage as the sheet lays out.
    const inline = new Set([
      "--develop-at",
      "--develop-fx",
      "--develop-fy",
      "--develop-fw",
      "--develop-fh",
      "--develop-sheet-h",
    ]);
    const read = [...code.matchAll(/var\((--develop-[\w-]+)/g)].map(
      (m) => m[1]!,
    );
    expect(read.length).toBeGreaterThan(10);
    for (const name of read)
      expect(inline.has(name) || name in vars, `${name} is no token`).toBe(
        true,
      );
  });

  it("names every duration and curve as the stylesheet reads it, in both passes, only the moments differing", () => {
    const full = developVars("full");
    const reduced = developVars("reduced");
    expect(full["--develop-grow-ms"]).toBe("720ms");
    expect(full["--develop-fade-in-ms"]).toBe("400ms");
    expect(full["--develop-grow-ease"]).toBe("var(--ease-in-out-strong)");
    expect(full["--develop-cover-at"]).toBe("1650ms");
    expect(reduced["--develop-cover-at"]).toBe("1500ms");
    expect(Object.keys(reduced).sort()).toEqual(Object.keys(full).sort());
  });
});

describe("the timeline", () => {
  it("★ the squares come up in the night's order, a touch uneven, inside the wave", () => {
    const n = 60;
    const waves = Array.from({ length: n }, (_, i) => waveAt(i, n, "full"));
    for (const w of waves) {
      expect(w).toBeGreaterThanOrEqual(150);
      expect(w).toBeLessThanOrEqual(150 + 950 + 35);
    }
    // The last square comes up well after the first: an order, not a flash.
    expect(waves[n - 1]! - waves[0]!).toBeGreaterThan(800);
    // The same sheet always develops the same way.
    expect(waveAt(17, n, "full")).toBe(waves[17]);
    // One square alone comes up at the wave's start.
    expect(waveAt(0, 1, "full")).toBe(150);
  });

  it("the first screen's squares grow one after another from just after the open, and the album rises after them", () => {
    expect(growAt(0)).toBe(1790);
    expect(growAt(3) - growAt(2)).toBe(60);
    // The regular open's own steps, after the develop's open: 45 ms apart, never more than 540 ms behind the first.
    expect(restAt(0)).toBe(1750 + 480);
    expect(restAt(1) - restAt(0)).toBe(45);
    expect(restAt(400)).toBe(restAt(0) + 540);
    // Each row of the sheet sinks a beat after the one above it.
    expect(sinkAt(2) - sinkAt(1)).toBe(24);
  });

  it("a play runs until its last square has grown, its last tile risen and the cover come up", () => {
    const grown = growAt(13) + DEVELOP_TEMPO.ms.grow;
    expect(developLength("full", 14)).toBe(Math.max(2950, grown));
    expect(developLength("full", 14)).toBeGreaterThan(developLength("full", 2));
  });
});

describe("the roll is what developed", () => {
  const entries = [
    entry(9, DEVELOP + 5 * MIN), // added the morning after: never on the sheet
    entry(8, DEVELOP),
    entry(7, DEVELOP - 1 * MIN),
    entry(6, DEVELOP - 30 * MIN),
    entry(5, DEVELOP - 300 * MIN), // an earlier roll this device saw develop
  ];

  it("★ the photographs created at or before the develop time, newest first as the album holds them", () => {
    expect(rollOfEntries(entries, DEVELOP, null)).toEqual([
      id(8),
      id(7),
      id(6),
      id(5),
    ]);
  });

  it("★ a develop the host set again after one had come develops only what was added since the one this device saw", () => {
    expect(rollOfEntries(entries, DEVELOP, DEVELOP - 120 * MIN)).toEqual([
      id(8),
      id(7),
      id(6),
    ]);
  });

  it("nothing when everything came after the develop", () => {
    expect(rollOfEntries([entry(1, DEVELOP + MIN)], DEVELOP, null)).toEqual([]);
  });
});

describe("the develop's sheet is the sheet that stood all night", () => {
  const roll = Array.from({ length: 30 }, (_, i) => id(30 - i)); // newest first
  const phone = 351 - 32;

  it("★ the night's order, oldest first, at the wait's own columns, hers known by id", () => {
    const plan = layoutDevelopSheet({
      roll,
      hers: new Set([id(3), id(29)]),
      sheetWidth: phone,
    });
    expect(plan.columns).toBe(columnsFor(phone));
    expect(plan.cells.map((c) => c.id)).toEqual([...roll].reverse());
    expect(plan.folded).toBe(0);
    expect(plan.count).toBe(30);
    expect(plan.hers).toBe(2);
    expect(plan.cells.filter((c) => c.hers).map((c) => c.id)).toEqual([
      id(3),
      id(29),
    ]);
  });

  it("★ capped as the wait caps it: the oldest fold into one '+N' that takes the first three cells, the newest kept", () => {
    const big = Array.from({ length: 200 }, (_, i) => id(200 - i));
    const plan = layoutDevelopSheet({
      roll: big,
      hers: new Set(),
      sheetWidth: phone,
    });
    const cap = sheetCapFor(plan.columns);
    expect(plan.cells).toHaveLength(cap - 3);
    expect(plan.folded).toBe(200 - (cap - 3));
    // The newest are the ones kept: they grow into the album's first rows.
    expect(plan.cells.at(-1)!.id).toBe(id(200));
    // The chip stands at the head, so the first square drawn sits after its three cells.
    expect(rowOf(plan, 0)).toBe(Math.floor(3 / plan.columns));
    expect(rowOf(plan, plan.columns - 3)).toBe(1);
  });

  it("a long album's roll counts past the page in hand: the sheet says the whole roll and folds what it does not hold", () => {
    const plan = layoutDevelopSheet({
      roll: roll.slice(0, 10),
      hers: new Set(),
      sheetWidth: phone,
      count: 1200,
    });
    expect(plan.count).toBe(1200);
    expect(plan.cells).toHaveLength(10);
    expect(plan.folded).toBe(1190);
  });
});

describe("★ when it plays: her first open after the develop, once per device", () => {
  const base = {
    developsAtMs: DEVELOP,
    nowMs: DEVELOP + 40 * MIN,
    mark: null,
    roll: 24,
    full: true,
    door: false,
    reelAsked: false,
  };

  it("plays on the first open after the develop, however late", () => {
    expect(developVerdict(base)).toBe("plays");
    expect(developVerdict({ ...base, nowMs: DEVELOP + 9 * 86_400_000 })).toBe(
      "plays",
    );
  });

  it("★ Monday's open is plain: the mark says this device saw it develop", () => {
    expect(developVerdict({ ...base, mark: DEVELOP })).toBe("none");
  });

  it("★ a develop the host moved later plays again; one this device saw is never replayed", () => {
    expect(developVerdict({ ...base, mark: DEVELOP - 86_400_000 })).toBe(
      "plays",
    );
  });

  it("never before the develop, never with nothing in the roll, never at a teaser, a lock or the demo", () => {
    expect(developVerdict({ ...base, nowMs: DEVELOP - 1 })).toBe("none");
    expect(developVerdict({ ...base, developsAtMs: null })).toBe("none");
    expect(developVerdict({ ...base, roll: 0 })).toBe("none");
    expect(developVerdict({ ...base, full: false })).toBe("none");
  });

  it("★ a first open the door or the reel took is spent unplayed: that was her arrival", () => {
    expect(developVerdict({ ...base, door: true })).toBe("spent");
    expect(developVerdict({ ...base, reelAsked: true })).toBe("spent");
    // Spent once is spent: the door on a later open has nothing to spend.
    expect(developVerdict({ ...base, door: true, mark: DEVELOP })).toBe("none");
  });

  it("reads a mark and a develop time as instants, whatever the wire spells, and nothing it cannot read", () => {
    expect(parseDevelopMark(String(DEVELOP))).toBe(DEVELOP);
    expect(parseDevelopMark(null)).toBeNull();
    expect(parseDevelopMark("junk")).toBeNull();
    expect(developMs("2026-10-04T13:00:00+00:00")).toBe(
      developMs("2026-10-04T13:00:00.000Z"),
    );
    expect(developMs(null)).toBeNull();
    expect(developMs("not a time")).toBeNull();
    expect(developMarkKey("e1")).toBe("pr_develop:e1");
  });
});

describe("★ the gate holds the cover and the album before the first paint, and lets go if the page never takes it up", () => {
  /** Runs the gate's script against a stand-in document, storage and clock. */
  function run(stored: string | null) {
    const attrs = new Map<string, string>();
    const documentElement = {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      getAttribute: (k: string) => attrs.get(k) ?? null,
      removeAttribute: (k: string) => attrs.delete(k),
    };
    const store = new Map<string, string>(
      stored === null ? [] : [[developMarkKey("e1"), stored]],
    );
    const win: Record<string, unknown> = {};
    const timers: (() => void)[] = [];
    const script = developGateScript({
      eventId: "e1",
      developsAtMs: DEVELOP,
      releaseMs: 6000,
    });
    new Function("document", "window", "localStorage", "setTimeout", script)(
      { documentElement },
      win,
      { getItem: (k: string) => store.get(k) ?? null },
      (fn: () => void) => timers.push(fn),
    );
    return { attrs, win, fire: () => timers.forEach((fn) => fn()) };
  }

  it("holds where this device has not seen the develop", () => {
    const { attrs, win } = run(null);
    expect(attrs.get("data-develop")).toBe("held");
    expect(win.__prDevelop).toMatchObject({ claimed: false, released: false });
  });

  it("does nothing where it has, or for an earlier develop's mark it holds", () => {
    expect(run(String(DEVELOP)).attrs.size).toBe(0);
    expect(run(String(DEVELOP - 1)).attrs.get("data-develop")).toBe("held");
  });

  it("★ lets go, and says so, when nothing took it up in time; a page that took it up keeps it", () => {
    const left = run(null);
    left.fire();
    expect(left.attrs.has("data-develop")).toBe(false);
    expect(left.win.__prDevelop).toMatchObject({ released: true });

    const taken = run(null);
    (taken.win.__prDevelop as { claimed: boolean }).claimed = true;
    taken.fire();
    expect(taken.attrs.get("data-develop")).toBe("held");
  });

  it("never throws where storage is refused", () => {
    const script = developGateScript({ eventId: "e1", developsAtMs: DEVELOP });
    expect(() =>
      new Function("document", "window", "localStorage", script)(
        { documentElement: {} },
        {},
        {
          getItem: vi.fn(() => {
            throw new Error("denied");
          }),
        },
      ),
    ).not.toThrow();
  });
});
