import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  altAnswer,
  altIndex,
  answersFor,
  CHANGE,
  KEEP,
  needsWords,
  OWN,
  RECOMMENDED,
} from "./answers";
import {
  CALLS,
  CALLS_CAP,
  callsByTheme,
  type CallsFile,
  CallsFileSchema,
  LINE,
  openCall,
  questionsOf,
} from "./calls";

/**
 * THE CALLS FILE AND ITS DOOR (calls-desk, 2026-10-07). `docs/calls.json` is Will's list of the decisions built into
 * Partyreel that he cannot see by using it, and it must never run away again the way the calls doc did ("a decision
 * log", days of reading). Two things hold it: this file's rules, which the desk reads it under, and
 * `usher/kit/calls.py`, the only writer the record uses, which refuses whatever breaks them. This holds the real file
 * to the rules, holds the door to its refusals (a field missing, a call past three lines, an id open or used before,
 * the 31st entry), and holds the door and the desk's reader to the same verdict on the same file.
 *
 * The door's cases run on scratch copies in a temporary folder; nothing here writes the repo's own file.
 */
const ROOT = process.cwd();
const DOOR = join(ROOT, "usher", "kit", "calls.py");
const REAL: CallsFile = JSON.parse(
  readFileSync(join(ROOT, "docs", "calls.json"), "utf8"),
);
const copy = (): CallsFile => JSON.parse(JSON.stringify(REAL));

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

/**
 * A scratch repo root holding `data` as its calls file, with every home the real file names as a stub, and the test
 * call's own home beside them. ★ Scar (2026-10-07): only the real file's homes were stubbed, so the day Will's answers
 * retired the last call naming `billing-caps.md`, the door refused the test call for a missing home.
 */
function scratch(data: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "calls-door-"));
  roots.push(root);
  mkdirSync(join(root, "docs", "systems"), { recursive: true });
  for (const e of REAL.entries)
    if (e.kind === "call") writeFileSync(join(root, e.home), "# stub\n");
  writeFileSync(join(root, A_CALL.home), "# stub\n");
  writeFileSync(
    join(root, "docs", "calls.json"),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  return root;
}

/** The door, run on a scratch root. A missing python3 fails loudly here rather than passing silently. */
function door(root: string, ...args: string[]) {
  const r = spawnSync("python3", [DOOR, "--root", root, ...args], {
    encoding: "utf8",
  });
  if (r.error) throw r.error;
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const fileOf = (root: string) =>
  readFileSync(join(root, "docs", "calls.json"), "utf8");

/** An entry written to a file the door's `add` reads. */
function entryFile(root: string, entry: unknown): string {
  const path = join(root, "entry.json");
  writeFileSync(path, JSON.stringify(entry));
  return path;
}

const A_CALL = {
  id: "ZZ9",
  kind: "call",
  theme: "Plans and billing",
  title: "A test call.",
  body: "It does one thing on its own.",
  changeIf: "it should do another.",
  home: "docs/systems/billing-caps.md",
};
const A_QUESTION = {
  id: "ZZ8",
  kind: "question",
  theme: "What Partyreel is",
  title: "A test question?",
  body: "It asks one thing.",
  recommended: "the first way.",
  alternatives: ["a second way"],
};

describe("the calls file", () => {
  it("holds every rule the desk reads it under", () => {
    const parsed = CallsFileSchema.safeParse(REAL);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(CALLS.entries.length).toBeLessThanOrEqual(CALLS_CAP);
  });

  it("keeps every id once: none open twice, none open that was retired", () => {
    const ids = REAL.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => REAL.retired.includes(id))).toEqual([]);
  });

  it("gives every call a home that exists, so a kept call can leave", () => {
    for (const e of REAL.entries)
      if (e.kind === "call")
        expect(existsSync(join(ROOT, e.home)), `${e.id}: ${e.home}`).toBe(true);
  });

  it("keeps a call to three lines", () => {
    for (const e of REAL.entries)
      if (e.kind === "call")
        expect(e.body.length, e.id).toBeLessThanOrEqual(3 * LINE);
  });

  it("passes its own door's check", () => {
    const r = door(ROOT, "check");
    expect(r.status, r.out).toBe(0);
    expect(r.out).toContain("every rule holds");
  });

  it("draws the questions first and the calls by theme, every entry once", () => {
    const drawn = [
      ...questionsOf().map((q) => q.id),
      ...callsByTheme().flatMap((t) => t.calls.map((c) => c.id)),
    ];
    expect(drawn).toEqual(CALLS.entries.map((e) => e.id));
    expect(callsByTheme().map((t) => t.theme)).toEqual(
      CALLS.themes.filter((t) =>
        CALLS.entries.some((e) => e.kind === "call" && e.theme === t),
      ),
    );
  });
});

describe("the words a call is answered in", () => {
  it("offers a question its recommendation, each alternative and his own words; a call keep or change", () => {
    expect(
      answersFor({ kind: "question", alternatives: ["one", "two"] }),
    ).toEqual([RECOMMENDED, "alt1", "alt2", OWN]);
    expect(answersFor({ kind: "question", alternatives: [] })).toEqual([
      RECOMMENDED,
      OWN,
    ]);
    expect(answersFor({ kind: "call" })).toEqual([KEEP, CHANGE]);
  });

  it("numbers the alternatives from one, and reads nothing else as one", () => {
    expect(altAnswer(0)).toBe("alt1");
    expect(altIndex("alt1")).toBe(0);
    expect(altIndex("alt12")).toBe(11);
    for (const no of ["alt0", "alt", "altx", "alt01", "Alt1", "recommended"])
      expect(altIndex(no), no).toBeNull();
  });

  it("needs words for a change and for his own answer only", () => {
    expect([KEEP, CHANGE, RECOMMENDED, "alt1", OWN].filter(needsWords)).toEqual(
      [CHANGE, OWN],
    );
  });

  it("knows an open entry by its id, and nothing once it has left", () => {
    const call = REAL.entries.find((e) => e.kind === "call")!;
    expect(openCall(call.id)).toMatchObject({
      kind: "call",
      answers: [KEEP, CHANGE],
    });
    expect(openCall(REAL.retired[0])).toBeUndefined();
    expect(openCall("")).toBeUndefined();
  });
});

describe("the door, usher/kit/calls.py", () => {
  it("refuses the 31st entry, and writes nothing", () => {
    // A full list, the real entries first: the real file empties as Will answers (scar, 2026-10-07: it held 30 the
    // day this was written and 8 once he answered, and the 31st was then the 9th).
    const full = copy();
    // Padded in the last entry's theme, so the list keeps the themes' order.
    const theme = full.entries.at(-1)?.theme ?? A_CALL.theme;
    for (let n = 0; full.entries.length < CALLS_CAP; n++)
      if (!full.retired.includes(`ZY${n}`))
        full.entries.push({
          ...A_CALL,
          id: `ZY${n}`,
          theme,
        } as CallsFile["entries"][number]);
    const root = scratch(full);
    const before = fileOf(root);
    const r = door(root, "add", entryFile(root, A_CALL));
    expect(r.status).not.toBe(0);
    expect(r.out).toContain(`past the cap of ${CALLS_CAP}`);
    expect(fileOf(root)).toBe(before);
  });

  it("retires an answered entry for good: off the list, its id never used again", () => {
    const data = copy();
    const gone = data.entries.find((e) => e.kind === "call")!.id;
    const root = scratch(data);
    const r = door(root, "retire", gone);
    expect(r.status, r.out).toBe(0);
    const after = JSON.parse(fileOf(root)) as CallsFile;
    expect(after.entries.map((e) => e.id)).not.toContain(gone);
    expect(after.retired).toContain(gone);
    // The same id, added again, is a reused id; retired again, it is gone already.
    const back = door(root, "add", entryFile(root, { ...A_CALL, id: gone }));
    expect(back.status).not.toBe(0);
    expect(back.out).toContain("used before");
    expect(door(root, "retire", gone).out).toContain("retired already");
    expect(door(root, "retire", "QQ1").out).toContain("is not open");
  });

  describe("on a list with room", () => {
    const roomy = () => {
      const data = copy();
      data.entries = data.entries.filter((e) => e.id !== data.entries[0].id);
      return data;
    };

    it("refuses an entry missing a field, an unknown field and an empty one", () => {
      const root = scratch(roomy());
      const before = fileOf(root);
      const { home: _home, ...homeless } = A_CALL;
      for (const [entry, says] of [
        [homeless, "home is missing"],
        [{ ...A_CALL, colour: "red" }, "colour is not a field of a call"],
        [{ ...A_CALL, changeIf: " " }, "changeIf is empty"],
        [{ ...A_QUESTION, alternatives: undefined }, "alternatives is missing"],
        [{ ...A_CALL, kind: "design" }, 'kind is "question" or "call"'],
      ] as const) {
        const r = door(root, "add", entryFile(root, entry));
        expect(r.status, says).not.toBe(0);
        expect(r.out).toContain(says);
      }
      expect(fileOf(root)).toBe(before);
    });

    it("refuses a call past three lines, and takes one of exactly three", () => {
      const root = scratch(roomy());
      const long = door(
        root,
        "add",
        entryFile(root, { ...A_CALL, body: "x".repeat(3 * LINE + 1) }),
      );
      expect(long.status).not.toBe(0);
      expect(long.out).toContain("past 3 lines");
      const fits = door(
        root,
        "add",
        entryFile(root, { ...A_CALL, body: "x".repeat(3 * LINE) }),
      );
      expect(fits.status, fits.out).toBe(0);
    });

    it("refuses an id already open, one used before, and one that is not an id", () => {
      const data = roomy();
      const root = scratch(data);
      for (const [id, says] of [
        [data.entries[0].id, "open already"],
        [data.retired[0], "used before"],
        ["x1", "an id is one to three capitals and a number"],
      ]) {
        const r = door(root, "add", entryFile(root, { ...A_CALL, id }));
        expect(r.status, id).not.toBe(0);
        expect(r.out).toContain(says);
      }
    });

    it("refuses a theme the file does not list and a home that is not a system doc", () => {
      const root = scratch(roomy());
      expect(
        door(root, "add", entryFile(root, { ...A_CALL, theme: "Design" })).out,
      ).toContain("is not one of");
      expect(
        door(
          root,
          "add",
          entryFile(root, { ...A_CALL, home: "docs/ROADMAP.md" }),
        ).out,
      ).toContain("docs/systems/<doc>.md");
      expect(
        door(
          root,
          "add",
          entryFile(root, { ...A_CALL, home: "docs/systems/nowhere.md" }),
        ).out,
      ).toContain("does not exist");
    });

    it("places a question after the questions and a call at the end of its theme", () => {
      const data = roomy();
      data.entries = data.entries.filter((e) => e.id !== data.entries[0].id);
      const root = scratch(data);
      expect(door(root, "add", entryFile(root, A_QUESTION)).status).toBe(0);
      const timing = { ...A_CALL, theme: "An event's life and timing" };
      expect(door(root, "add", entryFile(root, timing)).status).toBe(0);
      const after = (JSON.parse(fileOf(root)) as CallsFile).entries;
      const kinds = after.map((e) => e.kind);
      expect(after[kinds.lastIndexOf("question")].id).toBe(A_QUESTION.id);
      const lastTiming = after.findLastIndex(
        (e) => e.kind === "call" && e.theme === timing.theme,
      );
      expect(after[lastTiming].id).toBe(timing.id);
      expect(CallsFileSchema.safeParse(JSON.parse(fileOf(root))).success).toBe(
        true,
      );
    });
  });

  it("agrees with the desk's reader on every file it judges", () => {
    const tweak = (f: (d: CallsFile) => void) => {
      const d = copy();
      f(d);
      return d;
    };
    const firstCall = (d: CallsFile) =>
      d.entries.find((e) => e.kind === "call")!;
    // A question to bend, the real file's first or the test's own once Will has answered every one (scar, 2026-10-07).
    const firstQuestion = (d: CallsFile) => {
      if (!d.entries.some((e) => e.kind === "question"))
        d.entries.push({
          ...A_QUESTION,
          id: "ZZ7",
        } as CallsFile["entries"][number]);
      return d.entries.find((e) => e.kind === "question")!;
    };
    const cases: [string, CallsFile][] = [
      ["the real file", copy()],
      [
        "a body of three lines",
        tweak((d) => void (firstCall(d).body = "x".repeat(3 * LINE))),
      ],
      [
        "a body past three lines",
        tweak((d) => void (firstCall(d).body = "x".repeat(3 * LINE + 1))),
      ],
      [
        "a title past one line",
        tweak((d) => void (firstCall(d).title = "x".repeat(LINE + 1))),
      ],
      [
        "an untrimmed field",
        tweak((d) => void (firstCall(d).changeIf = "padded ")),
      ],
      [
        "five alternatives",
        tweak(
          (d) =>
            void (firstQuestion(d).alternatives = ["a", "b", "c", "d", "e"]),
        ),
      ],
      [
        "an alternative twice",
        tweak((d) => void (firstQuestion(d).alternatives = ["a", "a"])),
      ],
      [
        "an unknown field",
        tweak((d) => void Object.assign(firstCall(d), { colour: "red" })),
      ],
      [
        "a theme not listed",
        tweak((d) => void (firstCall(d).theme = "Design")),
      ],
      ["a malformed id", tweak((d) => void (firstCall(d).id = "l2"))],
      [
        "an id open and retired",
        tweak((d) => void d.retired.push(firstCall(d).id)),
      ],
      [
        "an id open twice",
        tweak((d) => void d.entries.push({ ...firstCall(d) })),
      ],
      ["a call before a question", tweak((d) => void d.entries.reverse())],
      [
        "the 31st entry",
        tweak((d) => void d.entries.push({ ...firstCall(d), id: "ZZ9" })),
      ],
    ];
    for (const [what, data] of cases) {
      const desk = CallsFileSchema.safeParse(data).success;
      const r = door(scratch(data), "check");
      expect(r.status === 0, `${what}: the door says ${r.out}`).toBe(desk);
    }
  });
});
