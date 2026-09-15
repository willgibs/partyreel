import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { composeMessage } from "./review-message";
import { SAMPLE_BOARD } from "./sample-spec";

/**
 * THE TRANSCRIPT SCRIPT (the Library x Lab round, 2026-09-15). `pnpm lab:review`
 * reads a board's spec without importing it (node builtins only, no build
 * step), so the scanner needs a real spec file on disk to be held to: this test
 * copies `sample-spec.ts` into a scratch sandbox and asserts the scanner's
 * reading equals the TypeScript object the same file exports. It also proves
 * the round trip (the session composes, the script parses), the refusals with
 * their line and column, and the all-or-nothing write.
 *
 * NOTHING is written under the repo's own docs/reviews: every write in this
 * file lands in a temp directory. The ledgers are the Orchestrator's to commit.
 *
 * The seven `..` are the price of a script outside `src/`; `@/` only reaches
 * src, and the script must stay runnable by node with no loader.
 */
const SCRIPT = "../../../../../../../scripts/lab-review.mjs";

type Spec = {
  id: string;
  round: number | null;
  asks: { id: string; question: string | null; options: string[]; recommended: string | null }[];
};
type Entry = {
  board: string;
  round: number;
  answers: { ask: string; choice: string; note?: string }[];
  notes: { text: string }[];
  line: number;
};
type Failure = { line: number; column: number; message: string; display: string };
type LabReview = {
  readSpec(id: string, source: string): Spec;
  readSpecs(root: string): Map<string, Spec>;
  parseMessage(text: string): Entry[];
  parseLine(raw: string, lineNo?: number): Entry | null;
  validate(entries: Entry[], specs: Map<string, Spec>): Failure[];
  run(
    text: string,
    options: { root: string; by?: string; at?: string; dry?: boolean },
  ): { ok: boolean; errors: Failure[]; summary: string[][]; boards?: string[] };
  mask(src: string): string;
};

const lab = (await import(SCRIPT)) as LabReview;

const SPEC_FILE = join(__dirname, "sample-spec.ts");
const BOARD = SAMPLE_BOARD.id;
const ROUND = SAMPLE_BOARD.round.n;

let root = "";
const ledgerFile = (board: string) => join(root, "docs", "reviews", `${board}.json`);
const readLedger = (board: string) =>
  JSON.parse(readFileSync(ledgerFile(board), "utf8")) as {
    board: string;
    rounds: {
      n: number;
      opened: string;
      answers: { ask: string; choice: string; note?: string; by: string }[];
      notes: { on: string | null; text: string }[];
    }[];
  };

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "lab-review-"));
  const sandbox = join(root, "src", "app", "(dev)", "design", "sandbox");
  mkdirSync(join(sandbox, BOARD), { recursive: true });
  mkdirSync(join(root, "docs", "reviews"), { recursive: true });
  // The real file, so the scanner is held to a spec an agent actually writes.
  copyFileSync(SPEC_FILE, join(sandbox, BOARD, "spec.ts"));
  // A directory with no spec must simply be skipped, not crash the read.
  mkdirSync(join(sandbox, "no-spec-here"), { recursive: true });
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("the spec scanner", () => {
  it("reads the fixture spec off disk exactly as the module exports it", () => {
    const spec = lab.readSpec(BOARD, readFileSync(SPEC_FILE, "utf8"));
    expect(spec.round).toBe(ROUND);
    expect(spec.asks.map((a) => a.id)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.id),
    );
    expect(spec.asks.map((a) => a.options)).toEqual(
      SAMPLE_BOARD.asks.map((a) => [...a.options]),
    );
    expect(spec.asks.map((a) => a.recommended)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.recommended),
    );
    expect(spec.asks.map((a) => a.question)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.question),
    );
  });

  it("finds the specs under a sandbox and skips a directory without one", () => {
    const specs = lab.readSpecs(root);
    expect([...specs.keys()]).toEqual([BOARD]);
  });

  it("is not fooled by structure that only appears inside prose", () => {
    // The masking scanner's whole reason: a `because` sentence naming another
    // key, a comment holding a fake asks array, an apostrophe, a brace.
    const source = `
      import { defineBoard } from "@/components/lab/board-spec";
      // asks: [{ id: "commented-out", options: ["a", "b"] }]
      export const B = defineBoard({
        id: "tricky",
        /* round: { n: 99 } */
        round: { n: 2, date: "2026-09-15", changed: "asks: nothing" },
        verdict: { recommendation: "the board's call { and a brace }", because: "x" },
        asks: [
          {
            id: "real",
            question: "Does a quoted \\"asks:\\" break it?",
            options: ["yes", "no"],
            recommended: "no",
            because: "A sentence with options: three of them, and a { brace.",
            evidence: "one",
          },
        ],
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    const spec = lab.readSpec("tricky", source);
    expect(spec.round).toBe(2);
    expect(spec.asks).toHaveLength(1);
    expect(spec.asks[0].id).toBe("real");
    expect(spec.asks[0].options).toEqual(["yes", "no"]);
  });

  it("blanks every string and comment while keeping the offsets", () => {
    const src = 'const a = "one"; // two\n/* three */ const b = `four`;';
    const masked = lab.mask(src);
    // Same length, so a key found on the mask is at the same offset in the
    // source; the delimiters stay, so a value's extent is still findable.
    expect(masked).toHaveLength(src.length);
    for (const word of ["one", "two", "three", "four"]) {
      expect(masked).not.toContain(word);
    }
    expect(masked).toContain("const a =");
    expect(masked.indexOf('"')).toBe(src.indexOf('"'));
  });
});

describe("the grammar", () => {
  it("parses what the session composes", () => {
    const message = composeMessage(
      [
        { board: BOARD, round: ROUND, ask: "grain", choice: "five", note: 'he said "five"' },
        { board: BOARD, round: ROUND, ask: "default", choice: "always" },
      ],
      [{ board: BOARD, round: ROUND, text: "a; semicolon inside a note" }],
    );
    const entries = lab.parseMessage(message);
    expect(entries).toHaveLength(1);
    expect(entries[0].board).toBe(BOARD);
    expect(entries[0].round).toBe(ROUND);
    expect(entries[0].answers.map((a) => [a.ask, a.choice, a.note])).toEqual([
      ["grain", "five", 'he said "five"'],
      ["default", "always", undefined],
    ]);
    expect(entries[0].notes[0].text).toBe("a; semicolon inside a note");
    expect(lab.validate(entries, lab.readSpecs(root))).toEqual([]);
  });

  it("ignores a blank line and a comment", () => {
    expect(lab.parseLine("")).toBeNull();
    expect(lab.parseLine("   # a note to self")).toBeNull();
  });

  it("names the line and column of every refusal", () => {
    const specs = lab.readSpecs(root);
    const at = (line: string, lineNo = 1) =>
      lab.validate([lab.parseLine(line, lineNo) as Entry], specs)[0];

    const board = at("review nope r1: grain=five");
    expect(board.column).toBe("review ".length + 1);
    expect(board.message).toContain("not a standing board");

    const round = at(`review ${BOARD} r9: grain=five`);
    expect(round.message).toContain(`round ${ROUND}`);

    const ask = at(`review ${BOARD} r${ROUND}: nope=five`);
    expect(ask.message).toContain("is not an ask");
    expect(ask.column).toBe(`review ${BOARD} r${ROUND}: `.length + 1);

    const option = at(`review ${BOARD} r${ROUND}: grain=seven`);
    expect(option.message).toContain("is not an option");
    expect(option.column).toBe(
      `review ${BOARD} r${ROUND}: grain=`.length + 1,
    );

    const twice = at(`review ${BOARD} r${ROUND}: grain=five; grain=three`);
    expect(twice.message).toContain("answered twice");
  });

  it("refuses a malformed line where it went wrong", () => {
    expect(() => lab.parseLine("light r4: a=b")).toThrowError(/must start with/);
    expect(() => lab.parseLine(`review ${BOARD} 4: a=b`)).toThrowError(/r4/);
    expect(() => lab.parseLine(`review ${BOARD} r1: a`)).toThrowError(/"="/);
    expect(() =>
      lab.parseLine(`review ${BOARD} r1: a=b "unclosed`),
    ).toThrowError(/closing quote/);
    expect(() => lab.parseLine(`review ${BOARD} r1:`)).toThrowError(
      /no answer and no note/,
    );
  });
});

describe("the ledgers", () => {
  it("creates a ledger in the README's shape and records the answers", () => {
    const result = lab.run(
      `review ${BOARD} r${ROUND}: grain=five "a hair lifter"; note: "read it all"`,
      { root, at: "2026-09-15T12:00:00Z" },
    );
    expect(result.ok).toBe(true);
    const ledger = readLedger(BOARD);
    expect(ledger.board).toBe(BOARD);
    expect(ledger.rounds[0].n).toBe(ROUND);
    expect(ledger.rounds[0].opened).toBe("2026-09-15");
    expect(ledger.rounds[0].answers[0]).toMatchObject({
      ask: "grain",
      choice: "five",
      note: "a hair lifter",
      by: "Will",
    });
    expect(ledger.rounds[0].notes[0]).toMatchObject({
      on: null,
      text: "read it all",
    });
  });

  it("overwrites the same ask in the same round rather than doubling it", () => {
    lab.run(`review ${BOARD} r${ROUND}: grain=three`, {
      root,
      at: "2026-09-15T13:00:00Z",
    });
    const answers = readLedger(BOARD).rounds[0].answers;
    expect(answers.filter((a) => a.ask === "grain")).toHaveLength(1);
    expect(answers[0].choice).toBe("three");
    // The replacement drops the old note with the old answer.
    expect(answers[0].note).toBeUndefined();
  });

  it("writes nothing at all when any line of the message is bad", () => {
    const before = readFileSync(ledgerFile(BOARD), "utf8");
    const result = lab.run(
      [
        `review ${BOARD} r${ROUND}: default=always`,
        `review ${BOARD} r${ROUND}: notes=nowhere`,
      ].join("\n"),
      { root, at: "2026-09-15T14:00:00Z" },
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0].line).toBe(2);
    expect(readFileSync(ledgerFile(BOARD), "utf8")).toBe(before);
  });

  it("a dry run validates and writes nothing", () => {
    const before = readFileSync(ledgerFile(BOARD), "utf8");
    const result = lab.run(`review ${BOARD} r${ROUND}: default=never`, {
      root,
      dry: true,
      at: "2026-09-15T15:00:00Z",
    });
    expect(result.ok).toBe(true);
    expect(readFileSync(ledgerFile(BOARD), "utf8")).toBe(before);
  });

  it("refuses a board with no spec instead of inventing a ledger", () => {
    const result = lab.run("review ghost r1: a=b", { root });
    expect(result.ok).toBe(false);
    expect(existsSync(ledgerFile("ghost"))).toBe(false);
  });

  it("refuses a file under docs/reviews that is not a ledger", () => {
    // A board that IS a board, whose ledger has been mangled: the script must
    // say so rather than overwrite a file it cannot read.
    const good = readFileSync(ledgerFile(BOARD), "utf8");
    writeFileSync(ledgerFile(BOARD), "{ not json");
    expect(() =>
      lab.run(`review ${BOARD} r${ROUND}: default=always`, { root }),
    ).toThrowError(/not a ledger/);
    writeFileSync(ledgerFile(BOARD), good);
  });
});
