import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

// Both modules are `server-only` (node:fs at request time); the unit project
// has no react-server condition.
vi.mock("server-only", () => ({}));

import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

import {
  latestRound,
  LedgerSchema,
  readLedger,
  REVIEWS_DIR,
  WINDOW_LEDGER,
  windowNotesFor,
} from "./ledger";
import { boardStatus, waitingOnWill } from "./status";

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
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

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
          row.ask.options as readonly string[],
          `${spec.id}/${row.ask.id}: the ledger stores "${row.answer.choice}", which is not one of the ask's options`,
        ).toContain(row.answer.choice);
      }
      expect(
        status.orphaned.map((a) => a.ask),
        `${spec.id}: the ledger answers an ask the spec no longer declares`,
      ).toEqual([]);
    }
  });

  it("lists only the boards with something still open", () => {
    const ids = SANDBOX.map((r) => r.id);
    for (const row of waitingOnWill(ids)) {
      expect(row.open).toBeGreaterThan(0);
      expect(row.open).toBeLessThanOrEqual(row.of);
    }
  });
});
