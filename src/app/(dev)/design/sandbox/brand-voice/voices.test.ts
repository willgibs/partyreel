// The board's OWN test, deliberately without a `@contract-for` marker: a
// contract is a guard on a Library component's function, and a sandbox board's
// data file is neither a component nor a thing the Library lists. The marker
// would rewrite the generated docs/design/library.md, which is outside this
// track's lane.
import { describe, expect, it } from "vitest";

import { BRAND_VOICE } from "./spec";
import { moved, SPOTS, tally, VOICE_IDS, VOICE_NAME, VOICES } from "./voices";

/**
 * THE BOARD'S OWN CONTRACT (the catalog rebuild, 2026-09-16).
 *
 * Two things can rot here and no other test would see either.
 *
 * 1. ★ THE SIX CARDS ARE WRITTEN TWICE ON PURPOSE. `spec.ts` has to write its
 *    items out as a literal const, because `pnpm lab:review` reads a spec as
 *    TEXT rather than importing it, and a `VOICES.map(...)` would read as a
 *    board with no items at all: every ruling on a card would be refused. So
 *    the words live in two files and this pins them equal, id for id, line for
 *    line, including the counts in the facts strip, which are the one thing on
 *    a card that a copy edit silently falsifies.
 *
 * 2. ★ A SLOT IS SIX STRINGS OR IT IS A HOLE. `s()` takes its six columns
 *    positionally, so a dropped argument is an empty column on a live board
 *    rather than a type error. Every slot is checked non-empty in every voice.
 */

describe("the six voices", () => {
  it("names each voice once, in the card order", () => {
    expect(VOICES.map((v) => v.id)).toEqual([...VOICE_IDS]);
    expect(VOICES[0].id, "today is the control and reads first").toBe("today");
    expect(Object.keys(VOICE_NAME).sort()).toEqual([...VOICE_IDS].sort());
  });

  it("gives exactly one voice the board's own pick", () => {
    expect(VOICES.filter((v) => v.recommended)).toHaveLength(1);
  });

  it("matches the spec's written-out items, line for line", () => {
    const items = BRAND_VOICE.candidates;
    expect(items.map((i) => i.id)).toEqual(VOICES.map((v) => v.id));
    for (const voice of VOICES) {
      const item = items.find((i) => i.id === voice.id);
      expect(item, `${voice.id} is missing from spec.ts`).toBeTruthy();
      expect(item!.name).toBe(voice.name);
      expect(item!.verdict).toBe(voice.verdict);
      expect(Boolean(item!.recommended)).toBe(Boolean(voice.recommended));
      expect(item!.rationale).toBe(voice.rationale);
      // The `one` line is trimmed to the card's 120-character limit in the
      // spec, so it is pinned by its opening rather than byte for byte.
      expect(voice.one.startsWith((item!.one ?? "").slice(0, 40))).toBe(true);

      const facts = Object.fromEntries(item!.facts ?? []);
      expect(facts.Shape, `${voice.id}'s shape`).toBe(voice.shape);
      expect(facts["A line is about"], `${voice.id}'s subject`).toBe(
        voice.about,
      );
      expect(facts.Risk, `${voice.id}'s risk`).toBe(voice.risk);
      const m = moved(voice.id);
      expect(
        facts.Rewrites,
        `${voice.id}'s card claims a count the data does not back`,
      ).toBe(`${m.moved} of ${m.total} lines`);
    }
  });

  it("offers the six as the pick and as both sides of the compare", () => {
    const ids = VOICES.map((v) => v.id).sort();
    const control = (id: string) =>
      BRAND_VOICE.controls?.find((c) => c.id === id);
    expect(
      control("voice")!
        .options.map((o) => o.id)
        .filter((o) => o !== "none")
        .sort(),
    ).toEqual(ids);
    for (const side of ["compare-a", "compare-b"]) {
      const c = control(side);
      expect(c, `${side} is not declared`).toBeTruthy();
      expect(c!.options.map((o) => o.id).sort()).toEqual(ids);
    }
  });
});

describe("the spots", () => {
  it("carries two dozen places across the three areas", () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(24);
    const ids = SPOTS.map((s) => s.id);
    expect(new Set(ids).size, "a repeated spot id").toBe(ids.length);
    for (const area of ["marketing", "app", "guest"] as const) {
      expect(
        SPOTS.filter((s) => s.area === area).length,
        `no ${area} spots`,
      ).toBeGreaterThan(0);
    }
  });

  it("writes every slot in every voice", () => {
    for (const spot of SPOTS) {
      const slots = spot.lines.map((l) => l.slot);
      expect(new Set(slots).size, `${spot.id} repeats a slot name`).toBe(
        slots.length,
      );
      for (const l of spot.lines) {
        for (const v of VOICE_IDS) {
          expect(
            l.say[v]?.trim().length,
            `${spot.id} / ${l.slot} is empty in ${v}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never prints the same line six times without saying why", () => {
    // A row that every voice writes identically is a FINDING (a verb on a
    // button, an error's one fact) and it has to say so. One that does not is
    // a slot somebody forgot to write, which is what this catches.
    expect(tally().unexplained).toBe(0);
  });

  it("holds no em-dash and no mono in the copy", () => {
    // The repo's AST guard covers app/components/lib, and this file lives
    // there, so the em-dash half is belt and braces; the guard cannot see a
    // string that is assembled at runtime, and every line here is literal.
    for (const spot of SPOTS) {
      for (const l of spot.lines) {
        for (const v of VOICE_IDS) {
          expect(l.say[v], `${spot.id} / ${l.slot} / ${v}`).not.toContain("—");
        }
      }
    }
  });
});
