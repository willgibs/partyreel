import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

// Both modules are `server-only` (node:fs at request time); the unit project
// has no react-server condition.
vi.mock("server-only", () => ({}));

import {
  ITEM_VERDICTS,
  LIBRARY_VERDICTS,
  optionId,
} from "@/components/lab/board-spec";

import { COMPONENTS } from "@/app/(dev)/design/rules/rules";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

import {
  latestRound,
  LedgerSchema,
  LIBRARY_LEDGER,
  LibraryLedgerSchema,
  libraryRulings,
  readLedger,
  REVIEWS_DIR,
  WINDOW_LEDGER,
  windowNotesFor,
} from "./ledger";
import { boardStatus } from "./status";

/**
 * THE LEDGER READER'S GUARD. The ledgers are written by the Orchestrator from
 * Will's own message and never by the lab, so the reader's whole job is to
 * fail LOUDLY on a file that does not parse and to keep the join honest: an
 * answer refers to an ask by id, and the ask's text lives in the board's spec.
 *
 * The check that matters most is the last one: every stored choice is one of
 * the options its ask declares. A ledger that says `model=registers` for an
 * ask whose options are `pairs | ramps` is a ruling nobody can act on, and it
 * would otherwise sit there looking answered.
 */
const dir = join(process.cwd(), REVIEWS_DIR);
const all = readdirSync(dir).filter((f) => f.endsWith(".json"));
// The Library's ledger is a second shape in the same directory (no board, no
// rounds), so it is checked against its own schema rather than the board one.
const files = all.filter((f) => f !== `${LIBRARY_LEDGER}.json`);

describe("the review ledgers", () => {
  it("has at least the window ledger", () => {
    expect(files).toContain(`${WINDOW_LEDGER}.json`);
  });

  for (const file of files) {
    it(`${file} matches the schema`, () => {
      const parsed = LedgerSchema.safeParse(
        JSON.parse(readFileSync(join(dir, file), "utf8")),
      );
      expect(
        parsed.success ? [] : parsed.error.issues.map((i) => i.message),
        `${file} does not match the ledger schema`,
      ).toEqual([]);
      expect(parsed.success && parsed.data.board).toBe(
        file.replace(/\.json$/, ""),
      );
    });
  }

  it("checks the library ledger against its own schema, when there is one", () => {
    const file = join(dir, `${LIBRARY_LEDGER}.json`);
    if (!all.includes(`${LIBRARY_LEDGER}.json`)) {
      // Nothing has been ruled on in the Library yet; the reader says so
      // rather than throwing, which is what keeps the desk rendering.
      expect(libraryRulings()).toEqual([]);
      return;
    }
    const parsed = LibraryLedgerSchema.safeParse(
      JSON.parse(readFileSync(file, "utf8")),
    );
    expect(
      parsed.success ? [] : parsed.error.issues.map((i) => i.message),
      "_library.json does not match the library ledger schema",
    ).toEqual([]);
    for (const r of libraryRulings()) {
      expect(
        COMPONENTS.some((c) => c.id === r.entry),
        `_library.json rules on "${r.entry}", which is not a library entry`,
      ).toBe(true);
      expect(
        LIBRARY_VERDICTS as readonly string[],
        `_library.json stores "${r.verdict}"`,
      ).toContain(r.verdict);
    }
  });

  it("refuses the library ledger as a board id", () => {
    // Two shapes, two readers: handing one to the other's schema would fail
    // loudly at request time, so the board reader never accepts it at all.
    expect(() => readLedger(LIBRARY_LEDGER)).toThrow(/refusing/);
  });

  it("reads a missing ledger as null rather than throwing", () => {
    expect(readLedger("a-board-that-has-never-been-reviewed")).toBeNull();
  });

  it("refuses a board id that is not one path segment", () => {
    expect(() => readLedger("../secrets")).toThrow(/refusing/);
    expect(() => readLedger("a/b")).toThrow(/refusing/);
  });

  it("takes the highest round, not the last one written", () => {
    const window = readLedger(WINDOW_LEDGER);
    const round = latestRound(window);
    expect(round).not.toBeNull();
    for (const r of window!.rounds) {
      expect(r.n).toBeLessThanOrEqual(round!.n);
    }
  });

  it("gives a board the window notes that name it, and the ones that name nobody", () => {
    const notes = windowNotesFor("palette");
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) {
      expect(n.on == null || n.on === "palette").toBe(true);
    }
    // A board nobody addressed still gets the window-wide notes.
    const global = windowNotesFor("a-board-nobody-addressed");
    expect(global.every((n) => n.on == null)).toBe(true);
    expect(global.length).toBeGreaterThan(0);
  });
});

describe("a board's status", () => {
  it("is derived from the spec minus the ledger, with no spec needed", () => {
    // Phase 0 has no specs registered yet; a board without one reports no asks
    // rather than throwing, so the desk renders during the migration.
    const status = boardStatus(SANDBOX[0].id);
    expect(status.board).toBe(SANDBOX[0].id);
    if (status.spec === null) {
      expect(status.asks).toEqual([]);
      expect(status.complete).toBe(false);
    }
  });

  it("answers every ask from an option that ask declares", () => {
    for (const spec of BOARDS) {
      const status = boardStatus(spec.id);
      for (const row of status.answered) {
        expect(
          row.ask.options.map(optionId),
          `${spec.id}/${row.ask.id}: the ledger stores "${row.answer.choice}", which is not one of the ask's options`,
        ).toContain(row.answer.choice);
      }
      // "Not clear to me" is a null choice with the words that say why.
      for (const row of status.unclear) {
        expect(row.answer.choice).toBeNull();
        expect(
          row.answer.note?.trim().length,
          `${spec.id}/${row.ask.id}: a ? answer with no note`,
        ).toBeGreaterThan(0);
      }
      expect(
        status.orphaned.map((a) => a.ask),
        `${spec.id}: the ledger answers an ask the spec no longer declares`,
      ).toEqual([]);
    }
  });

  it("rules every catalog card with a word the vocabulary has", () => {
    for (const spec of BOARDS) {
      const status = boardStatus(spec.id);
      // A board that declares no catalog offers nothing to rule on, however
      // many candidates it carries.
      if (!spec.catalog) expect(status.items).toEqual([]);
      for (const row of status.ruled) {
        expect(
          ITEM_VERDICTS as readonly string[],
          `${spec.id}/${row.item.id}: the ledger stores "${row.ruling.verdict}"`,
        ).toContain(row.ruling.verdict);
      }
      expect(
        status.orphanedItems.map((i) => i.item),
        `${spec.id}: the ledger rules on a candidate the spec no longer declares`,
      ).toEqual([]);
    }
  });

  it("is complete only once every ask AND every card is answered", () => {
    for (const spec of BOARDS) {
      const status = boardStatus(spec.id);
      if (status.complete) {
        expect(status.open).toEqual([]);
        expect(status.unclear).toEqual([]);
        expect(status.staged).toEqual([]);
        expect(status.openItems).toEqual([]);
      }
    }
  });

  // A staged ask is not open and a moot one is not asked at all (the stepped
  // review, 2026-09-16), so the four buckets have to partition the asks.
  it("sorts every ask into exactly one bucket", () => {
    for (const spec of BOARDS) {
      const s = boardStatus(spec.id);
      expect(
        s.answered.length +
          s.open.length +
          s.unclear.length +
          s.staged.length +
          s.moot.length,
        `${spec.id}: an ask fell into two buckets or none`,
      ).toBe(s.asks.length);
    }
  });
});
