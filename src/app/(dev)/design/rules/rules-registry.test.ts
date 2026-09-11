import { describe, expect, it } from "vitest";

import {
  ARTIFACT_VERSION,
  collectRules,
} from "../../../../../scripts/design-rules/collect.mjs";
import { RULES_ARTIFACT, type RuleRecord, type RulesArtifact } from "./rules";

/**
 * THE FRESHNESS GUARD: the committed rules artifact equals what the collector
 * sees right now. A guard test's title edited, a ★ run added or removed, a
 * component file created: any of them fails this until `pnpm design:rules`
 * is run. Compared by VALUE, never by bytes, so formatting cannot fail it.
 */
describe("the rules artifact", () => {
  const fresh = collectRules(process.cwd()) as RulesArtifact;

  it("collected a real registry, not an empty walk", () => {
    expect(fresh.rules.length).toBeGreaterThan(250);
    expect(fresh.components.length).toBeGreaterThan(50);
    expect(
      fresh.rules.filter((r) => r.source === "doc").length,
    ).toBeGreaterThan(50);
  });

  it("carries the collector's version", () => {
    expect(RULES_ARTIFACT.version).toBe(ARTIFACT_VERSION);
    expect(fresh.version).toBe(ARTIFACT_VERSION);
  });

  it("has a unique id per rule", () => {
    const ids = fresh.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the collector, rule for rule (else run `pnpm design:rules`)", () => {
    const committed = new Map<string, RuleRecord>(
      RULES_ARTIFACT.rules.map((r) => [r.id, r]),
    );
    const current = new Map<string, RuleRecord>(
      fresh.rules.map((r) => [r.id, r]),
    );
    const added = [...current.keys()].filter((id) => !committed.has(id));
    const removed = [...committed.keys()].filter((id) => !current.has(id));
    const changed = [...current.entries()]
      .filter(([id]) => committed.has(id))
      .flatMap(([id, rule]) => {
        const was = committed.get(id)!;
        const fields = (Object.keys(rule) as (keyof RuleRecord)[]).filter(
          (k) => JSON.stringify(rule[k]) !== JSON.stringify(was[k]),
        );
        return fields.length ? [`${id} (${fields.join(", ")})`] : [];
      });
    const drift = { added, removed, changed };
    expect(
      drift,
      "the committed rules artifact is stale: run `pnpm design:rules`",
    ).toEqual({ added: [], removed: [], changed: [] });
  });

  it("matches the collector's component index (else run `pnpm design:rules`)", () => {
    expect(
      RULES_ARTIFACT.components,
      "the committed component index is stale: run `pnpm design:rules`",
    ).toEqual(fresh.components);
  });
});
