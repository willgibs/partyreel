import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Both modules are `server-only` (node:fs at request time); the unit project
// has no react-server condition.
vi.mock("server-only", () => ({}));

import {
  ITEM_VERDICTS,
  LIBRARY_VERDICTS,
  optionId,
} from "@/components/lab/board-spec";

import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { entries } from "@/testing/source-tree";

import {
  currentSitting,
  latestRound,
  type Ledger,
  LedgerSchema,
  LIBRARY_LEDGER,
  LibraryLedgerSchema,
  libraryAnswers,
  type Note,
  readLedger,
  REVIEWS_DIR,
  saidOnBoard,
  saidOnNoBoard,
  sittingIn,
  WINDOW_LEDGER,
  windowNotesFor,
} from "./ledger";
import { boardStatus } from "./status";

// The catalog's entry ids, read the way lab:review reads them (the TS parse
// of the same files holds that reader in gallery.test.ts): importing the
// registry itself would mount every production component in a node test.
const { readLibraryEntries } =
  (await import("../../../../../scripts/lab-review.mjs")) as {
    readLibraryEntries: (root: string) => Set<string> | null;
  };
const CATALOG_IDS = readLibraryEntries(process.cwd()) ?? new Set<string>();

/**
 * THE LEDGER READER'S GUARD. The ledgers are written by the Orchestrator from
 * Will's own message and never by the lab, so the reader's whole job is to
 * fail LOUDLY on a file that does not parse and to keep the join honest: an
 * answer refers to an ask by id, and the ask's text lives in the board's spec.
 *
 * The check that matters most is the last one: every stored choice is one of
 * the options its ask declares. A ledger that says `model=registers` for an
 * ask whose options are `pairs | ramps` is an answer nobody can act on, and it
 * would otherwise sit there looking answered.
 *
 * ★ WHAT THE WINDOW HOLDS IS NEVER ASSERTED ON (Will, 2026-09-29). The record's
 * own edits (an Orchestrator folding a note into its doc and deleting it here)
 * must not be able to fail a test, and this file used to require that the live
 * window hold board-less notes, the very thing that made them bind every board.
 * The sitting is proved on ledgers built here; the live files are held to what
 * any ledger must satisfy (its shape, its dates) and to invariants that hold
 * whatever they contain.
 */
const dir = join(process.cwd(), REVIEWS_DIR);
const all = entries(dir)
  .map((entry) => entry.name)
  .filter((f) => f.endsWith(".json"));
// The Library's ledger is a second shape in the same directory (no board, no
// rounds), so it is checked against its own schema rather than the board one.
const files = all.filter((f) => f !== `${LIBRARY_LEDGER}.json`);

describe("the review ledgers", () => {
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

    // The window's sitting ends when a board opens a round on a later DAY, and
    // it is judged by comparing these dates as text: a date written any other
    // way ("Sep 29") would sort wrong and keep a sitting open, or close it,
    // for no reason anyone could see on the desk.
    it(`${file} dates every round as a day`, () => {
      const ledger = JSON.parse(readFileSync(join(dir, file), "utf8")) as {
        rounds: { n: number; opened: string }[];
      };
      for (const r of ledger.rounds) {
        expect(
          r.opened,
          `${file} round ${r.n} is opened "${r.opened}", not YYYY-MM-DD`,
        ).toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    });
  }

  it("checks the library ledger against its own schema, when there is one", () => {
    const file = join(dir, `${LIBRARY_LEDGER}.json`);
    if (!all.includes(`${LIBRARY_LEDGER}.json`)) {
      // No Library entry has a verdict yet; the reader says so
      // rather than throwing, which is what keeps the desk rendering.
      expect(libraryAnswers()).toEqual([]);
      return;
    }
    const parsed = LibraryLedgerSchema.safeParse(
      JSON.parse(readFileSync(file, "utf8")),
    );
    expect(
      parsed.success ? [] : parsed.error.issues.map((i) => i.message),
      "_library.json does not match the library ledger schema",
    ).toEqual([]);
    for (const r of libraryAnswers()) {
      expect(
        CATALOG_IDS.has(r.entry),
        `_library.json holds a verdict on "${r.entry}", which is not a library entry`,
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

  it("holds every board's own notes to that board, whatever the window says", () => {
    // ★ THE INVARIANT, ON THE REAL READER (Will, 2026-09-29). A note binds only
    // what it was given on: the live ledgers are read as they stand and the
    // property must hold for any contents, so this fails on the bug and never
    // on a record edit. A board with no notes filed on it hands back none.
    for (const spec of BOARDS) {
      expect(
        windowNotesFor(spec.id).every((n) => n.on === spec.id),
        `${spec.id} was handed a note that names another board, or none`,
      ).toBe(true);
      const status = boardStatus(spec.id);
      const own = status.round?.notes ?? [];
      for (const n of status.notes) {
        expect(
          own.includes(n) || n.on === spec.id,
          `${spec.id}'s status carries "${n.text.slice(0, 40)}", which is not its own`,
        ).toBe(true);
      }
    }
  });
});

/**
 * THE WINDOW'S SITTING, on ledgers built here (Will, 2026-09-29).
 *
 * Three notes he gave on the brand-voice board were filed on no board, were
 * merged into every board's notes, and stayed the window's latest round for
 * twelve days because nothing ever opened a newer one. These tests are that
 * story taken apart: what a board is handed, what the desk shows once, and
 * when a sitting stops being current.
 */
const AT = "2026-09-17T21:00:00Z";
const said = (on: string | null, text: string): Note => ({
  on,
  text,
  by: "Will",
  at: AT,
});
/** A ledger as a file parses: through the schema, so a round's arrays default as they do on disk. */
const ledgerOf = (
  board: string,
  rounds: { n: number; opened: string; notes?: Note[] }[],
): Ledger => LedgerSchema.parse({ board, rounds });
/** The window at one sitting, holding notes on a board, on none, and on another board. */
const sitting17 = ledgerOf(WINDOW_LEDGER, [
  {
    n: 6,
    opened: "2026-09-17",
    notes: [
      said("brand-voice", "on the voice board"),
      said(null, "on no board"),
      said("palette", "on the palette board"),
    ],
  },
]);

describe("the window's sitting", () => {
  it("takes the highest round, not the last one written", () => {
    // Kept from the test this replaces: the latest round is the highest `n`,
    // whatever order the file lists them in. What it ran on (the live window,
    // which had to exist and hold rounds) is gone.
    const window = ledgerOf(WINDOW_LEDGER, [
      { n: 6, opened: "2026-09-17", notes: [said(null, "the newest")] },
      { n: 5, opened: "2026-09-16", notes: [said(null, "an older one")] },
    ]);
    expect(latestRound(window)?.n).toBe(6);
    expect(sittingIn(window, [])?.notes.map((n) => n.text)).toEqual([
      "the newest",
    ]);
  });

  it("hands a board only the notes filed on it, and a board nobody addressed none", () => {
    // The old test said the opposite ("A board nobody addressed still gets the
    // window-wide notes") and was the bug: its reason, that a board must still
    // be answering what he said on the whole window, expired when he said a
    // note binds only what it was given on.
    const sitting = sittingIn(sitting17, []);
    expect(saidOnBoard(sitting, "palette").map((n) => n.text)).toEqual([
      "on the palette board",
    ]);
    expect(saidOnBoard(sitting, "a-board-nobody-addressed")).toEqual([]);
  });

  it("shows what he said on no board on its own, and it is bound to nothing", () => {
    expect(saidOnNoBoard(sittingIn(sitting17, [])).map((n) => n.text)).toEqual([
      "on no board",
    ]);
    // A note with no `on` at all is on no board either (the schema allows both).
    const bare = ledgerOf(WINDOW_LEDGER, [
      {
        n: 1,
        opened: "2026-09-17",
        notes: [{ text: "no on at all", by: "Will", at: AT }],
      },
    ]);
    expect(saidOnNoBoard(sittingIn(bare, [])).map((n) => n.text)).toEqual([
      "no on at all",
    ]);
    expect(saidOnBoard(sittingIn(bare, []), "palette")).toEqual([]);
  });

  it("stays current while every board round is on its day or before it", () => {
    const boards = [
      ledgerOf("a-board", [{ n: 1, opened: "2026-09-16" }]),
      // The sitting's own paste opens rounds the same day it was filed.
      ledgerOf("b-board", [{ n: 2, opened: "2026-09-17" }]),
    ];
    expect(sittingIn(sitting17, boards)?.opened).toBe("2026-09-17");
  });

  it("ends when any board opens a round on a later day, for every note in it", () => {
    // Twelve days is what the old reader allowed. One later round on one board
    // is his next sitting, and the window says nothing to anyone after it: not
    // the notes on no board, and not the ones filed on a board either.
    const boards = [
      ledgerOf("a-board", [{ n: 1, opened: "2026-09-16" }]),
      ledgerOf("b-board", [
        { n: 1, opened: "2026-09-17" },
        { n: 2, opened: "2026-09-18" },
      ]),
    ];
    const later = sittingIn(sitting17, boards);
    expect(later).toBeNull();
    expect(saidOnNoBoard(later)).toEqual([]);
    expect(saidOnBoard(later, "palette")).toEqual([]);
  });

  it("compares days, so an `opened` that carries a time is not a later day than its own", () => {
    // Either side may carry the time: as text, "2026-09-17T21:02:48Z" sorts
    // after "2026-09-17", which would end a sitting on the paste that came
    // with it.
    const day = ledgerOf(WINDOW_LEDGER, [
      { n: 1, opened: "2026-09-17", notes: [said(null, "x")] },
    ]);
    const stamped = ledgerOf(WINDOW_LEDGER, [
      { n: 1, opened: "2026-09-17T21:00:00Z", notes: [said(null, "x")] },
    ]);
    const pasteAt = ledgerOf("a-board", [
      { n: 1, opened: "2026-09-17T21:02:48Z" },
    ]);
    const pasteDay = ledgerOf("a-board", [{ n: 1, opened: "2026-09-17" }]);
    expect(sittingIn(day, [pasteAt])).not.toBeNull();
    expect(sittingIn(stamped, [pasteDay])).not.toBeNull();
    expect(sittingIn(stamped, [pasteAt])).not.toBeNull();
  });

  it("reads no window, or a window with no rounds, as no sitting", () => {
    expect(sittingIn(null, [])).toBeNull();
    expect(sittingIn(ledgerOf(WINDOW_LEDGER, []), [])).toBeNull();
    expect(saidOnNoBoard(null)).toEqual([]);
    expect(saidOnBoard(null, "palette")).toEqual([]);
  });
});

/**
 * THE READER ON A SCRATCH TREE: the sitting is derived from the directory, so
 * the directory's own listing is what is proved here (which files are board
 * ledgers, which are not), on files written for the test.
 */
describe("the sitting read off a directory", () => {
  const roots: string[] = [];
  const tree = (files: Record<string, unknown>): string => {
    const root = mkdtempSync(join(tmpdir(), "ledger-sitting-"));
    roots.push(root);
    mkdirSync(join(root, REVIEWS_DIR), { recursive: true });
    for (const [name, body] of Object.entries(files)) {
      writeFileSync(
        join(root, REVIEWS_DIR, name),
        typeof body === "string" ? body : JSON.stringify(body),
      );
    }
    return root;
  };
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  const window = (opened: string) => ({
    board: WINDOW_LEDGER,
    rounds: [{ n: 1, opened, notes: [said(null, "said on none")] }],
  });
  const board = (id: string, opened: string) => ({
    board: id,
    rounds: [{ n: 1, opened }],
  });

  it("is current on the day its boards were last answered", () => {
    const root = tree({
      "_window.json": window("2026-09-30"),
      "a-board.json": board("a-board", "2026-09-30"),
    });
    expect(currentSitting(root)?.opened).toBe("2026-09-30");
  });

  it("hands a board the notes filed on it and none said on no board, through the real reader", () => {
    // `windowNotesFor` is what the desk's rows and every board's status call:
    // the pure functions above are only as good as this wiring.
    const root = tree({
      "_window.json": {
        board: WINDOW_LEDGER,
        rounds: [
          {
            n: 1,
            opened: "2026-09-30",
            notes: [said(null, "said on none"), said("a-board", "on a-board")],
          },
        ],
      },
      "a-board.json": board("a-board", "2026-09-30"),
      "b-board.json": board("b-board", "2026-09-30"),
    });
    expect(windowNotesFor("a-board", root).map((n) => n.text)).toEqual([
      "on a-board",
    ]);
    expect(windowNotesFor("b-board", root)).toEqual([]);
  });

  it("ends the day after, on the newest board round in the directory", () => {
    const root = tree({
      "_window.json": window("2026-09-30"),
      "a-board.json": board("a-board", "2026-09-30"),
      "b-board.json": board("b-board", "2026-10-01"),
    });
    expect(currentSitting(root)).toBeNull();
  });

  it("reads only the files named like a board as board ledgers, never the Library's or the README", () => {
    // `_library.json` is a second shape (the board reader refuses it as an id
    // and throws) and the README is not JSON at all: a listing that swept
    // either in would blank the desk, not just the sitting.
    const root = tree({
      "_window.json": window("2026-09-30"),
      "_library.json": { entries: [] },
      "README.md": "# not a ledger",
    });
    expect(currentSitting(root)?.opened).toBe("2026-09-30");
  });

  it("reads a tree with no window ledger, or no reviews directory, as no sitting", () => {
    expect(
      currentSitting(tree({ "a-board.json": board("a-board", "2026-09-30") })),
    ).toBeNull();
    const bare = mkdtempSync(join(tmpdir(), "ledger-sitting-"));
    roots.push(bare);
    expect(currentSitting(bare)).toBeNull();
  });

  it("throws, naming the file, on a board ledger that does not parse", () => {
    // A hand edit that breaks a ledger should be loud on the desk, as it always
    // was; the sitting reads every board ledger, so it must not swallow one.
    const root = tree({
      "_window.json": window("2026-09-30"),
      "a-board.json": { board: "a-board", rounds: [{ n: "one" }] },
    });
    expect(() => currentSitting(root)).toThrow(/a-board\.json/);
  });
});

describe("a board's status", () => {
  it("is derived from the spec minus the ledger, with no spec needed", () => {
    // A board without a spec reports no asks rather than throwing, so the desk
    // renders whatever is registered. A made-up id on purpose: the first
    // standing board was the example until boards began retiring faster than
    // new ones arrived, and a zero-board lab must not crash this.
    const status = boardStatus("a-board-with-no-spec");
    expect(status.board).toBe("a-board-with-no-spec");
    expect(status.spec).toBeNull();
    expect(status.asks).toEqual([]);
    expect(status.complete).toBe(false);
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
      // A board that declares no catalog offers nothing to give a verdict on, however
      // many candidates it carries.
      if (!spec.catalog) expect(status.items).toEqual([]);
      for (const row of status.answeredItems) {
        expect(
          ITEM_VERDICTS as readonly string[],
          `${spec.id}/${row.item.id}: the ledger stores "${row.answer.verdict}"`,
        ).toContain(row.answer.verdict);
      }
      expect(
        status.orphanedItems.map((i) => i.item),
        `${spec.id}: the ledger holds a verdict on a candidate the spec no longer declares`,
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
