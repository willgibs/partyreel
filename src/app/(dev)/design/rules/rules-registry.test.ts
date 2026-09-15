import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARTIFACT_VERSION,
  collectRules,
  discoverContractFiles,
  discoverPolicies,
  DIRECTIVE_WINDOW,
} from "../../../../../scripts/design-rules/collect.mjs";
import { renderLibraryMd } from "../../../../../scripts/design-rules/library-md.mjs";
import { POLICY_TESTS as HAND_LIST } from "../_data/links";
import {
  POLICY_TESTS as DERIVED,
  POLICY_VIEWS,
  uncitedDesignPolicies,
} from "../_data/policies";
import {
  RULES_ARTIFACT,
  type ComponentRecord,
  type RulesArtifact,
} from "./rules";

/**
 * THE FRESHNESS GUARD: the committed artifact equals what the collector sees
 * right now, and `docs/design/library.md` equals what the renderer makes of
 * it. A contract test's title edited, a `@policy:` directive added, a
 * component file created, a bible rule reworded, a `for` line changed: any of
 * them fails this until `pnpm design:rules` is run. Compared by VALUE with the
 * line numbers left out, so formatting above an it() cannot fail it; a
 * directive naming a missing file throws in the collector with the path.
 */
describe("the rules artifact", () => {
  const fresh = collectRules(process.cwd()) as RulesArtifact;
  const contractFiles = discoverContractFiles(process.cwd()) as {
    file: string;
    targets: string[];
  }[];

  it("collected a real index, not an empty walk", () => {
    expect(fresh.components.length).toBeGreaterThan(50);
    expect(contractFiles.length).toBeGreaterThanOrEqual(8);
    for (const { file } of contractFiles) {
      expect(
        fresh.components.some((c) => c.contracts.some((k) => k.file === file)),
        `${file} carries the directive but no it() title reached a component`,
      ).toBe(true);
    }
  });

  it("carries the collector's version", () => {
    expect(RULES_ARTIFACT.version).toBe(ARTIFACT_VERSION);
    expect(fresh.version).toBe(ARTIFACT_VERSION);
  });

  it("has a unique id per component and a unique title per contract", () => {
    const ids = fresh.components.map((c) => c.id);
    expect(new Set(ids).size, "two components share an id").toBe(ids.length);
    for (const c of fresh.components) {
      const keys = c.contracts.map((k) => `${k.suite.join("/")}/${k.title}`);
      expect(new Set(keys).size, `${c.file}: a contract title repeats`).toBe(
        keys.length,
      );
    }
  });

  it("matches the collector (else run `pnpm design:rules`)", () => {
    const shape = (components: ComponentRecord[]) =>
      components.map((c) => ({
        ...c,
        contracts: c.contracts.map(({ line: _line, ...k }) => k),
      }));
    expect(
      shape(RULES_ARTIFACT.components),
      "the committed artifact is stale: run `pnpm design:rules`",
    ).toEqual(shape(fresh.components));
  });

  it("carries the policies, compared the same way", () => {
    const shape = (policies: RulesArtifact["policies"]) =>
      policies.map(({ line: _line, ...p }) => p);
    expect(fresh.policies.length).toBeGreaterThan(5);
    expect(
      shape(RULES_ARTIFACT.policies),
      "the committed policies are stale: run `pnpm design:rules`",
    ).toEqual(shape(fresh.policies));
  });
});

/**
 * THE POLICY DIRECTIVE. Phase 0 listed the policies by hand in `_data/links.ts`
 * because nothing in the tree said which tests were policies. The directive
 * says it in the file itself, so this holds the two halves honest: a policy
 * test that forgot the line, and the hand list that is now owed a delete.
 */
describe("the policy directive", () => {
  const policies = discoverPolicies(process.cwd()) as {
    file: string;
    scope: string;
    title: string;
    summary: string;
    line: number;
  }[];

  it("is on every file the hand list still calls a policy", () => {
    const claimed = policies.map((p) => p.file);
    const missing = Object.values(HAND_LIST).filter(
      (f) => !claimed.includes(f),
    );
    expect(
      missing,
      "a policy test with no `// @policy: <scope>` header; the collector cannot see it",
    ).toEqual([]);
  });

  it("holds the hand list in links.ts to what the tree actually says", () => {
    // The swap (links.ts re-exporting `_data/policies.ts`) is a shared-file
    // change asked of the Orchestrator in the lab-rules Handoff. Until it
    // lands, the hand list may lag the derived one by a NEW policy, but it may
    // never name a path the directive does not: a `policy:<id>` ref that
    // resolves to the wrong file is worse than one that resolves to none.
    for (const [id, file] of Object.entries(HAND_LIST)) {
      expect(
        DERIVED[id],
        `links.ts calls ${id} a policy and the tree does not: ${file}`,
      ).toBe(file);
    }
    const unlisted = Object.keys(DERIVED).filter((id) => !(id in HAND_LIST));
    expect(
      unlisted.length,
      `${unlisted.length} policies the hand list has never heard of; the delete is overdue`,
    ).toBeLessThanOrEqual(2);
  });

  it("refuses a design policy no bible rule cites", () => {
    expect(
      uncitedDesignPolicies().map((p) => `${p.id} (${p.file})`),
      "a policy nothing points at is an agent's habit wearing a rule's badge: cite it from a bible rule, scope it `engineering`, or delete it",
    ).toEqual([]);
    expect(POLICY_VIEWS.length).toBe(policies.length);
  });

  it("says in one sentence what each policy refuses", () => {
    for (const p of policies) {
      expect(
        p.summary.length,
        `${p.file} has an empty @refuses`,
      ).toBeGreaterThan(20);
      expect(p.title.length, `${p.file} has an empty title`).toBeGreaterThan(2);
    }
  });
});

/**
 * THE HEADER WINDOW. A directive below it used to be silently invisible:
 * `sandbox/media-kit/plan.test.ts` carried a real `@contract-for` at line 247
 * and the board's JSX guard never reached the library. The collector now
 * throws with the path and the line, proven here on a throwaway tree rather
 * than by breaking the real one.
 */
describe("a directive past the header window", () => {
  function tree(body: string): string {
    const root = mkdtempSync(join(tmpdir(), "design-rules-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src", "late.test.ts"), body);
    return root;
  }

  it("throws with the path and the line", () => {
    const padding = Array.from(
      { length: DIRECTIVE_WINDOW + 2 },
      (_, i) => `// line ${i + 1}`,
    ).join("\n");
    const root = tree(
      `${padding}\n// @contract-for: src/late.test.ts\ndescribe("x", () => {});\n`,
    );
    expect(() => discoverPolicies(root)).toThrow(/late\.test\.ts:\d+/);
    expect(() => discoverPolicies(root)).toThrow(/past the header window/);
  });

  it("accepts the same directive inside the window", () => {
    const root = tree(
      `// @policy: lab · A throwaway\n// @refuses: nothing at all, this tree exists only in a temp directory.\n`,
    );
    expect(discoverPolicies(root)).toEqual([
      {
        file: "src/late.test.ts",
        scope: "lab",
        title: "A throwaway",
        summary: "nothing at all, this tree exists only in a temp directory.",
        line: 1,
      },
    ]);
  });

  it("refuses an unknown scope and a policy with nothing to refuse", () => {
    expect(() =>
      discoverPolicies(
        tree("// @policy: everywhere\n// @refuses: something long enough.\n"),
      ),
    ).toThrow(/unknown scope/);
    expect(() =>
      discoverPolicies(tree("// @policy: global · No refuses line\n")),
    ).toThrow(/@refuses/);
  });
});

/**
 * THE LIBRARY AS ONE FILE. `docs/design/library.md` is the rule set an agent
 * in a worktree can grep, and a stale copy is worse than none: it would read
 * like law while saying something the tree no longer does.
 */
describe("docs/design/library.md", () => {
  const committed = readFileSync(
    join(process.cwd(), "docs/design/library.md"),
    "utf8",
  );

  it("is what the renderer makes of the tree right now", () => {
    const rendered = renderLibraryMd(
      process.cwd(),
      collectRules(process.cwd()),
    ) as string;
    expect(
      committed,
      "docs/design/library.md is stale: run `pnpm design:rules`",
    ).toBe(rendered);
  });

  it("carries every policy and the whole rule set's sections", () => {
    for (const p of POLICY_VIEWS) {
      expect(committed, `${p.file} is missing from library.md`).toContain(
        p.file,
      );
    }
    for (const heading of [
      "## What binds you",
      "## The law",
      "## The policies",
      "## Guidance",
      "## The components",
      "## The standing boards",
    ]) {
      expect(committed).toContain(heading);
    }
  });
});
