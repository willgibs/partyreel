import { describe, expect, it } from "vitest";

import {
  ARTIFACT_VERSION,
  collectRules,
  discoverContractFiles,
} from "../../../../../scripts/design-rules/collect.mjs";
import {
  RULES_ARTIFACT,
  type ComponentRecord,
  type RulesArtifact,
} from "./rules";

/**
 * THE FRESHNESS GUARD: the committed artifact equals what the collector sees
 * right now. A contract test's title edited, a directive added or removed, a
 * component file created: any of them fails this until `pnpm design:rules`
 * is run. Compared by VALUE with the line numbers left out, so formatting
 * above an it() cannot fail it; a directive naming a missing file throws in
 * the collector with the path in the message.
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
});
