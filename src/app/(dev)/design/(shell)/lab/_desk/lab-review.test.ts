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

import { optionId } from "@/components/lab/board-spec";

import { BOARDS } from "@/app/(dev)/design/sandbox/registry";

import { composeMessage } from "./review-message";
import { SAMPLE_BOARD } from "./sample-spec";

/**
 * THE TRANSCRIPT SCRIPT. `pnpm lab:review`
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
  asks: {
    id: string;
    question: string | null;
    options: string[];
    recommended: string | null;
  }[];
  catalog: boolean;
  items: string[] | null;
  calls: string[];
};
type Entry = {
  kind: "board" | "library";
  board: string;
  round: number;
  answers: { ask: string; choice: string | null; note?: string }[];
  items: { item: string; verdict: string; note?: string }[];
  calls: { call: string; answer: string; note?: string }[];
  entries: { entry: string; verdict: string; note?: string }[];
  notes: { text: string }[];
  line: number;
};
type Failure = {
  line: number;
  column: number;
  message: string;
  display: string;
};
type LabReview = {
  readSpec(id: string, source: string): Spec;
  readSpecs(root: string): Map<string, Spec>;
  parseMessage(text: string): Entry[];
  parseLine(raw: string, lineNo?: number): Entry | null;
  validate(
    entries: Entry[],
    specs: Map<string, Spec>,
    library?: Set<string> | null,
  ): Failure[];
  readLibraryEntries(root: string): Set<string> | null;
  run(
    text: string,
    options: { root: string; by?: string; at?: string; dry?: boolean },
  ): {
    ok: boolean;
    errors: Failure[];
    summary: string[][];
    boards?: string[];
    drift?: string | null;
  };
  mask(src: string): string;
  buildOf(text: string): string | null;
  buildDrift(text: string, root: string): string | null;
};

const lab = (await import(SCRIPT)) as LabReview;

const SPEC_FILE = join(__dirname, "sample-spec.ts");
const BOARD = SAMPLE_BOARD.id;
const ROUND = SAMPLE_BOARD.round.n;

let root = "";
const ledgerFile = (board: string) =>
  join(root, "docs", "reviews", `${board}.json`);
const readLedger = (board: string) =>
  JSON.parse(readFileSync(ledgerFile(board), "utf8")) as {
    board: string;
    rounds: {
      n: number;
      opened: string;
      answers: {
        ask: string;
        choice: string | null;
        note?: string;
        by: string;
      }[];
      notes: { on: string | null; text: string }[];
      items: { item: string; verdict: string; note?: string; by: string }[];
      calls: { call: string; answer: string; note?: string; by: string }[];
    }[];
  };
const readLibrary = () =>
  JSON.parse(readFileSync(ledgerFile("_library"), "utf8")) as {
    entries: { entry: string; verdict: string; note?: string; by: string }[];
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
  // The catalog's five family modules, which is what a `review library:`
  // line is checked against. Copied rather than stubbed: a hand-written
  // fixture would stop proving that the real ids resolve.
  for (const family of [
    "components",
    "patterns",
    "compositions",
    "foundations",
    "marketing",
  ]) {
    const dir = join(root, "src", "app", "(dev)", "design", "(shell)", "library", family);
    mkdirSync(dir, { recursive: true });
    copyFileSync(
      join(
        process.cwd(),
        `src/app/(dev)/design/(shell)/library/${family}/gallery-demos.tsx`,
      ),
      join(dir, "gallery-demos.tsx"),
    );
  }
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
    // The scanner reads option IDS: a labelled option's label and meaning are
    // prose, and must never pass as a choice.
    expect(spec.asks.map((a) => a.options)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.options.map(optionId)),
    );
    expect(spec.asks.map((a) => a.recommended)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.recommended),
    );
    expect(spec.asks.map((a) => a.question)).toEqual(
      SAMPLE_BOARD.asks.map((a) => a.question),
    );
    // The catalog half: the opt-in, and the ids read through `candidates:
    // ITEMS` to the const in the same file.
    expect(spec.catalog).toBe(Boolean(SAMPLE_BOARD.catalog));
    expect(spec.items).toEqual(SAMPLE_BOARD.candidates.map((c) => c.id));
  });

  it("finds the specs under a sandbox and skips a directory without one", () => {
    const specs = lab.readSpecs(root);
    expect([...specs.keys()]).toEqual([BOARD]);
  });

  it("reads every standing spec off disk as the registry exports it", () => {
    // The sample proves the scanner on one file; this holds it to the twelve
    // real ones, whichever option form each is on, so a spec the scanner
    // misreads cannot silently refuse (or accept) a real review line.
    const sandbox = join(
      process.cwd(),
      "src",
      "app",
      "(dev)",
      "design",
      "sandbox",
    );
    for (const board of BOARDS) {
      const spec = lab.readSpec(
        board.id,
        readFileSync(join(sandbox, board.id, "spec.ts"), "utf8"),
      );
      expect(spec.round, `${board.id}: round`).toBe(board.round.n);
      expect(
        spec.asks.map((a) => a.id),
        `${board.id}: ask ids`,
      ).toEqual(board.asks.map((a) => a.id));
      expect(
        spec.asks.map((a) => a.options),
        `${board.id}: option ids`,
      ).toEqual(board.asks.map((a) => a.options.map(optionId)));
      expect(
        spec.asks.map((a) => a.recommended),
        `${board.id}: recommended`,
      ).toEqual(board.asks.map((a) => a.recommended));
      expect(spec.catalog, `${board.id}: catalog`).toBe(Boolean(board.catalog));
      // A catalog board must be readable off the page, or no ruling on its
      // cards can ever be validated.
      if (board.catalog) {
        expect(spec.items, `${board.id}: items`).toEqual(
          board.candidates.map((c) => c.id),
        );
      }
    }
  });

  it("resolves `candidates: ITEMS` one hop, past the type annotation's []", () => {
    const source = `
      const ITEMS: readonly Candidate<"one">[] = [
        { id: "a", name: "A", one: "the first" },
        { id: "b", name: "B" },
      ];
      export const B = defineBoard({
        id: "hopped",
        round: { n: 1, date: "2026-09-16", changed: "x" },
        candidates: ITEMS,
        catalog: { section: "one", control: "pick" },
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    const spec = lab.readSpec("hopped", source);
    expect(spec.catalog).toBe(true);
    expect(spec.items).toEqual(["a", "b"]);
  });

  it("reads a mapped candidates list as no items at all", () => {
    // A `.map` over another module is the shape that bit the palette board.
    // Reading it as an empty list would accept any item id for ever, so it
    // reads as null and `validate` tells the author to write them out.
    const source = `
      export const B = defineBoard({
        id: "mapped",
        round: { n: 1, date: "2026-09-16", changed: "x" },
        candidates: PALETTES.map((p) => ({ id: p.id, name: p.name })),
        catalog: { section: "one" },
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    expect(lab.readSpec("mapped", source).items).toBeNull();
  });

  it("reads no catalog when a board only carries candidates", () => {
    const source = `
      export const B = defineBoard({
        id: "plain",
        round: { n: 1, date: "2026-09-16", changed: "x" },
        candidates: [{ id: "a", name: "A" }],
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    const spec = lab.readSpec("plain", source);
    expect(spec.catalog).toBe(false);
    expect(spec.items).toEqual(["a"]);
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

  it("reads a labelled option's id and never its label or meaning", () => {
    const source = `
      export const B = defineBoard({
        id: "labelled",
        round: { n: 1, date: "2026-09-15", changed: "x" },
        asks: [
          {
            id: "which",
            question: "Which one?",
            options: [
              { id: "a", label: "The first one", means: "It has an id: inside its prose." },
              "b",
              { label: "Label first", id: "c" },
            ],
            recommended: "a",
            evidence: "one",
          },
        ],
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    const spec = lab.readSpec("labelled", source);
    expect(spec.asks[0].options).toEqual(["a", "b", "c"]);
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
        {
          board: BOARD,
          round: ROUND,
          ask: "grain",
          choice: "five",
          note: 'he said "five"',
        },
        { board: BOARD, round: ROUND, ask: "default", choice: "always" },
      ],
      [{ board: BOARD, round: ROUND, text: "a; semicolon inside a note" }],
      [
        { board: BOARD, round: ROUND, item: "as-data", verdict: "keep" },
        {
          board: BOARD,
          round: ROUND,
          item: "as-prose",
          verdict: "kill",
          note: "nobody reads it",
        },
      ],
    );
    const entries = lab.parseMessage(message);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("board");
    expect(entries[0].board).toBe(BOARD);
    expect(entries[0].round).toBe(ROUND);
    expect(entries[0].answers.map((a) => [a.ask, a.choice, a.note])).toEqual([
      ["grain", "five", 'he said "five"'],
      ["default", "always", undefined],
    ]);
    expect(entries[0].items.map((i) => [i.item, i.verdict, i.note])).toEqual([
      ["as-data", "keep", undefined],
      ["as-prose", "kill", "nobody reads it"],
    ]);
    expect(entries[0].notes[0].text).toBe("a; semicolon inside a note");
    expect(lab.validate(entries, lab.readSpecs(root))).toEqual([]);
  });

  it("parses the Library's own line, which carries no round", () => {
    const message = composeMessage(
      [],
      [],
      [],
      [
        { entry: "masonry", verdict: "redesign", note: "the columns fight" },
        { entry: "button", verdict: "keep" },
      ],
    );
    expect(message).toBe(
      'review library: masonry=redesign "the columns fight"; button=keep',
    );
    const entries = lab.parseMessage(message);
    expect(entries[0].kind).toBe("library");
    expect(entries[0].entries.map((r) => [r.entry, r.verdict])).toEqual([
      ["masonry", "redesign"],
      ["button", "keep"],
    ]);
    expect(
      lab.validate(entries, lab.readSpecs(root), lab.readLibraryEntries(root)),
    ).toEqual([]);
  });

  it("records 'not clear to me' as a null choice, and only with a note", () => {
    const specs = lab.readSpecs(root);
    const entry = lab.parseLine(
      `review ${BOARD} r${ROUND}: grain=? "what is a grain?"`,
    ) as Entry;
    expect(entry.answers[0]).toMatchObject({
      ask: "grain",
      choice: "?",
      note: "what is a grain?",
    });
    expect(lab.validate([entry], specs)).toEqual([]);
    const bare = lab.parseLine(`review ${BOARD} r${ROUND}: grain=?`) as Entry;
    expect(lab.validate([bare], specs)[0].message).toContain("needs a note");
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
    expect(option.column).toBe(`review ${BOARD} r${ROUND}: grain=`.length + 1);

    const twice = at(`review ${BOARD} r${ROUND}: grain=five; grain=three`);
    expect(twice.message).toContain("answered twice");
  });

  it("names the line and column of every refusal on a catalog", () => {
    const specs = lab.readSpecs(root);
    const library = lab.readLibraryEntries(root);
    const at = (line: string) =>
      lab.validate([lab.parseLine(line) as Entry], specs, library)[0];
    const head = `review ${BOARD} r${ROUND}: `;

    const unknown = at(`${head}item:nope=keep`);
    expect(unknown.message).toContain("is not an item");
    // The refusal lists the ids that ARE on the board, so the fix is visible.
    expect(unknown.message).toContain("as-data");
    expect(unknown.column).toBe(`${head}item:`.length + 1);

    const word = at(`${head}item:as-data=redesign`);
    expect(word.message).toContain("is not a verdict");
    expect(word.column).toBe(`${head}item:as-data=`.length + 1);

    const twice = at(`${head}item:as-data=keep; item:as-data=kill`);
    expect(twice.message).toContain("ruled twice");

    const entry = at("review library: not-a-component=keep");
    expect(entry.message).toContain("is not a library entry");
    expect(entry.column).toBe("review library: ".length + 1);

    const libraryWord = at("review library: button=refine");
    expect(libraryWord.message).toContain("is not a library verdict");
  });

  it("refuses an item on a board with no catalog, and one it cannot read", () => {
    const specs = new Map([
      [
        "plain",
        { id: "plain", round: 1, asks: [], catalog: false, items: ["a"] },
      ],
      [
        "mapped",
        { id: "mapped", round: 1, asks: [], catalog: true, items: null },
      ],
    ]) as unknown as Map<string, Spec>;
    const refuse = (line: string) =>
      lab.validate([lab.parseLine(line) as Entry], specs)[0].message;
    expect(refuse("review plain r1: item:a=keep")).toContain(
      "declares no catalog",
    );
    expect(refuse("review mapped r1: item:a=keep")).toContain(
      "write the items out",
    );
  });

  it("refuses a library line when there is no catalog to check it against", () => {
    expect(
      lab.validate(
        [lab.parseLine("review library: button=keep") as Entry],
        new Map(),
        null,
      )[0].message,
    ).toContain("no catalog");
  });

  it("refuses a malformed line where it went wrong", () => {
    expect(() => lab.parseLine("light r4: a=b")).toThrowError(
      /must start with/,
    );
    expect(() => lab.parseLine(`review ${BOARD} 4: a=b`)).toThrowError(/r4/);
    expect(() => lab.parseLine(`review ${BOARD} r1: a`)).toThrowError(/"="/);
    expect(() =>
      lab.parseLine(`review ${BOARD} r1: a=b "unclosed`),
    ).toThrowError(/closing quote/);
    expect(() => lab.parseLine(`review ${BOARD} r1:`)).toThrowError(
      /no answer, no ruling and no note/,
    );
    expect(() => lab.parseLine("review library:")).toThrowError(/no ruling/);
    expect(() => lab.parseLine(`review ${BOARD} r1: item:a`)).toThrowError(
      /"="/,
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

  it("lands a ? answer as choice null with the note beside it", () => {
    const result = lab.run(`review ${BOARD} r${ROUND}: notes=? "which note?"`, {
      root,
      at: "2026-09-15T14:30:00Z",
    });
    expect(result.ok).toBe(true);
    const answer = readLedger(BOARD).rounds[0].answers.find(
      (a) => a.ask === "notes",
    );
    expect(answer).toMatchObject({ choice: null, note: "which note?" });
  });

  it("records a verdict on a catalog card, and overwrites it in the round", () => {
    const first = lab.run(
      `review ${BOARD} r${ROUND}: item:as-data=keep "the shape"; item:as-prose=kill`,
      { root, at: "2026-09-15T14:40:00Z" },
    );
    expect(first.ok).toBe(true);
    const round = readLedger(BOARD).rounds[0];
    expect(round.items.map((i) => [i.item, i.verdict, i.note])).toEqual([
      ["as-data", "keep", "the shape"],
      ["as-prose", "kill", undefined],
    ]);
    lab.run(`review ${BOARD} r${ROUND}: item:as-data=refine`, {
      root,
      at: "2026-09-15T14:45:00Z",
    });
    const again = readLedger(BOARD).rounds[0].items;
    expect(again.filter((i) => i.item === "as-data")).toHaveLength(1);
    expect(again[0]).toMatchObject({ verdict: "refine" });
    // The replacement drops the old note with the old verdict.
    expect(again[0].note).toBeUndefined();
  });

  it("writes the Library's rulings to their own file, one per entry", () => {
    const result = lab.run(
      'review library: masonry=redesign "the columns fight the phone"',
      { root, at: "2026-09-16T09:00:00Z" },
    );
    expect(result.ok).toBe(true);
    expect(result.boards).toEqual(["_library"]);
    expect(readLibrary().entries).toEqual([
      {
        entry: "masonry",
        verdict: "redesign",
        note: "the columns fight the phone",
        by: "Will",
        at: "2026-09-16T09:00:00Z",
      },
    ]);
    lab.run("review library: masonry=keep", {
      root,
      at: "2026-09-16T09:05:00Z",
    });
    const entries = readLibrary().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ verdict: "keep" });
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

/**
 * THE CARRIED CALLS (lab-tides, 2026-09-19; landed by the Orchestrator at the
 * merge). `call:<id>=yes|no "a note"` answers a call a lane carried on its
 * own recommendation (`BoardSpec.carried`), riding an ordinary board line
 * beside an ask or an item. It is modelled on `item:` at every point: checked
 * before the ask clause so a colon inside the id is never swallowed,
 * validated against the spec (the fixture's own two calls, `base` and
 * `layers`, from `sample-spec.ts`), and written to the ledger as its own
 * `calls` array beside `answers` and `items`.
 */
describe("the carried calls", () => {
  it("reads the fixture's carried ids off disk", () => {
    const spec = lab.readSpec(BOARD, readFileSync(SPEC_FILE, "utf8"));
    expect(spec.calls).toEqual(SAMPLE_BOARD.carried!.map((c) => c.id));
  });

  it("reports no carried calls for a spec that declares none", () => {
    const source = `
      export const B = defineBoard({
        id: "no-calls",
        round: { n: 1, date: "2026-09-16", changed: "x" },
        sections: [{ id: "one", title: "One", lede: "l" }],
      });
    `;
    expect(lab.readSpec("no-calls", source).calls).toEqual([]);
  });

  it("parses a call: clause beside an ask, checked before the ask clause", () => {
    const entry = lab.parseLine(
      `review ${BOARD} r${ROUND}: grain=five; call:base=no "keep it"`,
    ) as Entry;
    expect(entry.answers.map((a) => a.ask)).toEqual(["grain"]);
    expect(entry.calls.map((c) => [c.call, c.answer, c.note])).toEqual([
      ["base", "no", "keep it"],
    ]);
  });

  it('refuses a word that is not "yes" or "no"', () => {
    expect(() =>
      lab.parseLine(`review ${BOARD} r${ROUND}: call:base=maybe`),
    ).toThrowError(/"maybe" is not an answer to a carried call \(yes, no\)/);
  });

  it("validates a call's id against the spec's carried list", () => {
    const specs = lab.readSpecs(root);
    const refusal = lab.validate(
      [lab.parseLine(`review ${BOARD} r${ROUND}: call:nope=yes`) as Entry],
      specs,
    )[0];
    expect(refusal.message).toContain("is not a call");
    expect(refusal.message).toContain("base, layers");
  });

  it("refuses the same call id answered twice on one line", () => {
    const specs = lab.readSpecs(root);
    const refusal = lab.validate(
      [
        lab.parseLine(
          `review ${BOARD} r${ROUND}: call:base=no; call:base=yes`,
        ) as Entry,
      ],
      specs,
    )[0];
    expect(refusal.message).toContain("answered twice");
  });

  it("records a call in the ledger, and overwrites it in the round", () => {
    const first = lab.run(
      `review ${BOARD} r${ROUND}: call:base=no "keep it"`,
      { root, at: "2026-09-19T21:00:00Z" },
    );
    expect(first.ok).toBe(true);
    expect(first.summary.find((r) => r[1] === "call:base")).toEqual([
      `${BOARD} r${ROUND}`,
      "call:base",
      "no",
      "new",
    ]);
    const round = readLedger(BOARD).rounds.find((r) => Number(r.n) === ROUND)!;
    expect(round.calls).toEqual([
      {
        call: "base",
        answer: "no",
        note: "keep it",
        by: "Will",
        at: "2026-09-19T21:00:00Z",
      },
    ]);

    lab.run(`review ${BOARD} r${ROUND}: call:base=yes`, {
      root,
      at: "2026-09-19T21:05:00Z",
    });
    const again = readLedger(BOARD).rounds.find(
      (r) => Number(r.n) === ROUND,
    )!.calls;
    expect(again.filter((c) => c.call === "base")).toHaveLength(1);
    expect(again[0]).toMatchObject({ answer: "yes" });
    // The replacement drops the old note with the old answer, as an item's does.
    expect(again[0].note).toBeUndefined();
  });

  it("treats a repeated call answer as an unchanged no-op", () => {
    const line = `review ${BOARD} r${ROUND}: call:layers=no "a round of its own"`;
    const first = lab.run(line, { root, at: "2026-09-19T21:10:00Z" });
    expect(first.summary.find((r) => r[1] === "call:layers")?.[3]).toBe("new");
    const again = lab.run(line, { root, at: "2026-09-19T21:15:00Z" });
    expect(again.summary.find((r) => r[1] === "call:layers")?.[3]).toBe(
      "unchanged",
    );
    // Not re-stamped: a re-send is not a new decision.
    const round = readLedger(BOARD).rounds.find((r) => Number(r.n) === ROUND)!;
    expect(round.calls.find((c) => c.call === "layers")).toMatchObject({
      answer: "no",
      note: "a round of its own",
    });
  });

  it("accepts a call the fixture no longer declares, when it only repeats the ledger", () => {
    const ledger = readLedger(BOARD);
    ledger.rounds
      .find((r) => Number(r.n) === ROUND)!
      .calls.push({ call: "withdrawn-call", answer: "yes", by: "Will" });
    writeFileSync(ledgerFile(BOARD), `${JSON.stringify(ledger, null, 2)}\n`);

    const echo = lab.run(`review ${BOARD} r${ROUND}: call:withdrawn-call=yes`, {
      root,
      at: "2026-09-19T21:20:00Z",
    });
    expect(echo.ok).toBe(true);
    expect(echo.summary.find((r) => r[1] === "call:withdrawn-call")?.[3]).toBe(
      "unchanged",
    );

    const fresh = lab.run(`review ${BOARD} r${ROUND}: call:withdrawn-call=no`, {
      root,
      at: "2026-09-19T21:25:00Z",
    });
    expect(fresh.ok).toBe(false);
    expect(fresh.errors[0].message).toContain("is not a call");
  });
});

/**
 * THE BUILD STAMP SURVIVES THE ROUND TRIP (2026-09-17).
 *
 * The desk stamps a paste with the commit it was composed on, so the batch that
 * once arrived a round behind (Will, 2026-09-17) can be told apart from one
 * composed on the tree. The shape is a `#` line, which this grammar has always
 * skipped, and that is the whole reason it is safe: what is pinned here is that
 * the stamp changes NOTHING about what gets recorded.
 */
describe("a stamped paste", () => {
  it("records exactly what the same paste records unstamped", () => {
    const line = `review ${BOARD} r${ROUND}: grain=three`;
    const stamped = lab.run(`# build 6f25638\n${line}`, { root, dry: true });
    const bare = lab.run(line, { root, dry: true });
    expect(stamped.ok).toBe(true);
    expect(stamped.summary).toEqual(bare.summary);
  });

  it("reads the build out of the message, and nothing out of a bare one", () => {
    expect(lab.buildOf("# build 6f25638\nreview x r1: a=b")).toBe("6f25638");
    expect(lab.buildOf("review x r1: a=b")).toBeNull();
    // A comment that is not a stamp stays a comment.
    expect(lab.buildOf("# a note to self\nreview x r1: a=b")).toBeNull();
  });

  it("says nothing about drift when the paste carries no build", () => {
    expect(lab.buildDrift("review x r1: a=b", process.cwd())).toBeNull();
  });
});

/**
 * A RE-SEND THAT CHANGES NOTHING (lab-tides, 2026-09-19).
 *
 * Will's answers stay in his browser after he pastes a batch, and the store
 * only learns what the ledger holds from the build he is reading: on a stale
 * alias the next paste carries the first batch again. Refusing the whole
 * message for it ("site-chrome is in round 2, not r1") threw away the new
 * answers in the same paste. So a clause that merely repeats the ledger is a
 * no-op, whatever the board has done since, and anything else is judged
 * exactly as it was.
 */
describe("a stale re-send", () => {
  const writeLedger = (board: string, ledger: unknown) =>
    writeFileSync(ledgerFile(board), `${JSON.stringify(ledger, null, 2)}\n`);

  it("repeats an answer the open round already holds as a no-op", () => {
    const line = `review ${BOARD} r${ROUND}: default=always "the same words"`;
    const first = lab.run(line, { root, at: "2026-09-19T10:00:00Z" });
    expect(first.ok).toBe(true);
    expect(first.summary.find((r) => r[1] === "default")?.[3]).toBe("new");

    const again = lab.run(line, { root, at: "2026-09-19T11:00:00Z" });
    expect(again.ok).toBe(true);
    expect(again.summary.find((r) => r[1] === "default")?.[3]).toBe(
      "unchanged",
    );
    // Not re-stamped: a re-send is not a new decision and must not read as one.
    const answer = readLedger(BOARD).rounds[0].answers.find(
      (a) => a.ask === "default",
    );
    expect(answer).toMatchObject({ choice: "always", note: "the same words" });
    expect(again.boards).toEqual([]);
  });

  it("still replaces the answer when he changes his mind", () => {
    const changed = lab.run(`review ${BOARD} r${ROUND}: default=never`, {
      root,
      at: "2026-09-19T12:00:00Z",
    });
    expect(changed.summary.find((r) => r[1] === "default")?.[3]).toBe(
      "replaced",
    );
  });

  it("accepts a line for a round the board has left, when it only repeats it", () => {
    const ledger = readLedger(BOARD);
    ledger.rounds.push({
      n: ROUND - 1,
      opened: "2026-09-14",
      answers: [
        { ask: "grain", choice: "five", note: "then", by: "Will" },
      ] as never,
      notes: [],
      items: [],
    } as never);
    writeLedger(BOARD, ledger);

    const echo = lab.run(`review ${BOARD} r${ROUND - 1}: grain=five "then"`, {
      root,
      at: "2026-09-19T13:00:00Z",
    });
    expect(echo.ok).toBe(true);
    expect(echo.summary[0][3]).toBe("unchanged");

    // A genuinely new answer to a closed round is still refused, by name.
    const fresh = lab.run(`review ${BOARD} r${ROUND - 1}: grain=three`, {
      root,
      at: "2026-09-19T13:05:00Z",
    });
    expect(fresh.ok).toBe(false);
    expect(fresh.errors[0].message).toContain(`not r${ROUND - 1}`);
    expect(fresh.errors[0].message).toContain("grain=three");
  });

  it("accepts an ask the spec no longer declares, when it only repeats it", () => {
    const ledger = readLedger(BOARD);
    ledger.rounds
      .find((r) => Number(r.n) === ROUND)!
      .answers.push({
        ask: "withdrawn",
        choice: "kept",
        by: "Will",
      } as never);
    writeLedger(BOARD, ledger);

    const echo = lab.run(`review ${BOARD} r${ROUND}: withdrawn=kept`, {
      root,
      at: "2026-09-19T14:00:00Z",
    });
    expect(echo.ok).toBe(true);
    expect(echo.summary[0][3]).toBe("unchanged");

    const fresh = lab.run(`review ${BOARD} r${ROUND}: withdrawn=other`, {
      root,
      at: "2026-09-19T14:05:00Z",
    });
    expect(fresh.ok).toBe(false);
    expect(fresh.errors[0].message).toContain("is not an ask on");
  });

  it("accepts a retired board's re-send, and refuses a new answer to it", () => {
    writeLedger("gone", {
      board: "gone",
      rounds: [
        {
          n: 1,
          opened: "2026-09-01",
          answers: [{ ask: "shape", choice: "wide", by: "Will" }],
          notes: [],
          items: [],
        },
      ],
    });
    const echo = lab.run("review gone r1: shape=wide", {
      root,
      at: "2026-09-19T15:00:00Z",
    });
    expect(echo.ok).toBe(true);
    expect(echo.summary[0][3]).toBe("unchanged");

    const fresh = lab.run("review gone r1: shape=narrow", {
      root,
      at: "2026-09-19T15:05:00Z",
    });
    expect(fresh.ok).toBe(false);
    expect(fresh.errors[0].message).toContain("has left the lab");
  });

  it("keeps a typo a typo: a name that was never a board is refused at the name", () => {
    const result = lab.run("review neverwas r1: shape=wide", { root });
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toContain("is not a standing board");
    expect(result.errors[0].column).toBe("review ".length + 1);
  });

  it("does not record the same board note twice", () => {
    const line = `review ${BOARD} r${ROUND}: note: "one remark, once"`;
    lab.run(line, { root, at: "2026-09-19T16:00:00Z" });
    const before = readLedger(BOARD).rounds.find((r) => Number(r.n) === ROUND)!
      .notes.length;
    const again = lab.run(line, { root, at: "2026-09-19T16:05:00Z" });
    expect(again.summary[0][3]).toBe("unchanged");
    expect(
      readLedger(BOARD).rounds.find((r) => Number(r.n) === ROUND)!.notes.length,
    ).toBe(before);
  });
});
