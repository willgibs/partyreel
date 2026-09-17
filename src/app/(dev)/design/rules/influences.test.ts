import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

// The registry reads markdown through `_data/docs.ts`, which is `server-only`
// (node:fs at request time); the unit project has no react-server condition,
// so the marker module is stubbed out here, the same way docs.test.ts does it.
vi.mock("server-only", () => ({}));

import { POLICY_VIEWS } from "../_data/policies";
import { BIBLE } from "./bible";
import {
  bindsFor,
  health,
  influences,
  influencesByLevel,
  type Level,
  LEVEL_ORDER,
  LEVELS,
} from "./influences";
import { CONTRACTED } from "./rules";

const README = "docs/design/README.md";
const GUIDANCE = "docs/design/guidance.md";
const SKILLS_DIR = ".agents/skills";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

/**
 * THE AUTHORITY MODEL'S GUARD. Two things it holds and nothing else: that the
 * levels a badge renders are exactly the levels the README defines (one home
 * for the rule, per Will's ruling that the library must show the whole working
 * rule set with no hidden influences), and that `bindsFor` answers the
 * question an agent actually asks: what do I obey on THIS board, with THESE
 * paths? It never pins prose, a look or a count.
 */
describe("the levels", () => {
  const table = read(README)
    .split("\n")
    .filter((l) =>
      /^\|\s*(law|contract|policy|program|guidance|precedent|proposal|ruling|landmine)\b/.test(
        l,
      ),
    )
    .map((l) => l.split("|").map((c) => c.trim()));

  it("are the nine the README defines, in the README's order", () => {
    expect(
      table.map((row) => row[1]),
      `${README} defines a different level set; a level is added only by Will's ruling, which edits the README first`,
    ).toEqual(LEVEL_ORDER);
  });

  it("wear the badge the README prints", () => {
    for (const row of table) {
      const level = LEVELS.find((l) => l.id === row[1]);
      expect(
        level,
        `${row[1]} is in the README and not in LEVELS`,
      ).toBeTruthy();
      expect(level!.badge, `${row[1]}'s badge`).toBe(row[2]);
    }
  });

  it("say what binds, and only two levels bind unconditionally", () => {
    const binding = LEVELS.filter((l) => l.weight === "binds").map((l) => l.id);
    expect(binding).toEqual(["law", "contract"]);
    for (const level of LEVELS) {
      expect(level.line.length, `${level.id} has no line`).toBeGreaterThan(20);
      expect(
        level.binds.length,
        `${level.id} has no binds line`,
      ).toBeGreaterThan(2);
    }
  });
});

describe("the influence registry", () => {
  const all = influences();

  it("carries every level with at least one influence", () => {
    for (const [level, items] of influencesByLevel()) {
      expect(
        items.length,
        `no ${level.id} influences reached the registry`,
      ).toBeGreaterThan(0);
    }
  });

  it("has a unique id per influence and a visible home for each", () => {
    const ids = all.map((i) => i.id);
    expect(new Set(ids).size, "two influences share an id").toBe(ids.length);
    for (const i of all) {
      expect(
        i.id.startsWith(`${i.level}:`),
        `${i.id} is not namespaced by its level`,
      ).toBe(true);
      expect(i.visibleAt, `${i.id} is visible nowhere`).toMatch(/^\/design\//);
      expect(i.title.trim().length, `${i.id} has no title`).toBeGreaterThan(0);
    }
  });

  it("indexes every bible rule, every policy and every contracted component", () => {
    const at = (level: Level) => all.filter((i) => i.level === level).length;
    expect(at("law")).toBe(BIBLE.length);
    expect(at("policy")).toBe(POLICY_VIEWS.length);
    expect(at("contract")).toBe(CONTRACTED.length);
  });

  it("names the author of every influence, since half the rule set is agent-written", () => {
    for (const i of all) {
      expect(["Will", "agent", "third-party"]).toContain(i.author);
    }
    // The law is Will's by definition; a policy is an agent's by definition.
    for (const i of all.filter((x) => x.level === "law")) {
      expect(i.author).toBe("Will");
    }
    for (const i of all.filter((x) => x.level === "policy")) {
      expect(i.author).toBe("agent");
    }
  });
});

describe("bindsFor", () => {
  it("binds the whole bible, and marks a board's own rules as its to rewrite", () => {
    const exploring = BIBLE.find((r) =>
      r.status?.startsWith("under exploration: "),
    );
    expect(
      exploring,
      "no rule is under exploration; the marker cannot be proven",
    ).toBeTruthy();
    const board = exploring!.status!.replace("under exploration: ", "");

    const binds = bindsFor({ board });
    expect(binds.law.length).toBe(BIBLE.length);
    const mine = binds.law.filter((l) => l.yours).map((l) => l.rule.id);
    expect(mine).toContain(exploring!.id);

    // Another board does not inherit it.
    const other = bindsFor({ board: `${board}-not-a-board` });
    expect(other.law.some((l) => l.yours)).toBe(false);
  });

  it("binds only the contracts of the components under an owned path", () => {
    const sample = CONTRACTED.find((c) =>
      c.file.startsWith("src/components/shared/"),
    );
    expect(sample).toBeTruthy();
    const binds = bindsFor({ ownedPaths: ["src/components/shared"] });
    expect(binds.contracts.map((c) => c.id)).toContain(
      `contract:${sample!.id}`,
    );
    expect(
      binds.contracts.every((c) =>
        (c.paths ?? []).every((p) => p.startsWith("src/components/shared/")),
      ),
      "a contract outside the claimed lane reached the strip",
    ).toBe(true);
    expect(bindsFor({ ownedPaths: [] }).contracts).toEqual([]);
  });

  it("keeps the global policies on every surface and drops another surface's", () => {
    const binds = bindsFor({ surface: "guest" });
    const scopes = new Set(binds.policies.map((p) => p.scope));
    expect(scopes.has("global")).toBe(true);
    expect(
      binds.policies.some((p) => p.surface === "marketing"),
      "a marketing-only policy reached a guest board",
    ).toBe(false);
  });

  it("leaves out the levels that inform, because obeying them builds small", () => {
    // A standing board (light was the example until its ruling retired it).
    const binds = bindsFor({ board: "rounding", surface: "shared" });
    const levels = new Set(
      [
        ...binds.contracts,
        ...binds.policies,
        ...binds.program,
        ...binds.landmines,
      ].map((i) => i.level),
    );
    for (const informing of ["guidance", "precedent", "proposal", "ruling"]) {
      expect(
        levels.has(informing as Level),
        `${informing} is in the strip`,
      ).toBe(false);
    }
    expect(binds.summary).toMatch(/laws/);
  });
});

describe("guidance", () => {
  const body = read(GUIDANCE);

  it("names every skill directory in the repo", () => {
    const dirs = existsSync(join(process.cwd(), SKILLS_DIR))
      ? readdirSync(join(process.cwd(), SKILLS_DIR)).filter(
          (d) => !d.startsWith("."),
        )
      : [];
    expect(
      dirs.length,
      "no skills are installed; the table has nothing to hold",
    ).toBeGreaterThan(0);
    for (const dir of dirs) {
      expect(
        body.includes(dir),
        `${SKILLS_DIR}/${dir} is installed and ${GUIDANCE} never names it: an invisible influence`,
      ).toBe(true);
    }
  });

  it("holds the anchors the rulings record points at", () => {
    expect(body).toContain("## Boards: the review surface");
  });
});

describe("the health strip", () => {
  const findings = health();

  it("counts each finding against the list it names", () => {
    expect(findings.length).toBeGreaterThan(3);
    for (const f of findings) {
      expect(
        f.note.length,
        `${f.id} says nothing about what to do`,
      ).toBeGreaterThan(20);
      if (f.items.length > 0) expect(f.items.length).toBe(f.count);
    }
  });

  it("reports no design policy that a bible rule fails to cite", () => {
    const uncited = findings.find((f) => f.id === "uncited-policies")!;
    expect(uncited.count, `uncited: ${uncited.items.join(", ")}`).toBe(0);
  });
});
