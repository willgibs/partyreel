import { BIBLE, type BibleRule } from "@/app/(dev)/design/rules/bible";
import {
  POLICIES,
  policyId,
  type PolicyRecord,
  type PolicyScope,
} from "@/app/(dev)/design/rules/rules";

/**
 * THE POLICIES, DERIVED (the Library x Lab round, 2026-09-15). Phase 0 kept a
 * hand-written `POLICY_TESTS` map in `_data/links.ts` because the collector
 * could not yet see a policy; it can now (`// @policy:` in a test's header),
 * so this module is the one home and the hand list is owed a delete.
 *
 * `links.ts` is a shared file, so the swap is an Orchestrator change asked for
 * in the lab-rules Handoff; until it lands, `rules-registry.test.ts` holds the
 * hand list equal to `POLICY_TESTS` below, so the two cannot drift.
 *
 * Pure and isomorphic like `links.ts` itself: no node imports, no React, no
 * server-only, so the client chrome may read it.
 */

/** The policy id (a file stem) to its repo-relative test path. */
export const POLICY_TESTS: Record<string, string> = Object.fromEntries(
  POLICIES.map((p) => [policyId(p.file), p.file]),
);

export type PolicyView = PolicyRecord & {
  /** The file stem: the anchor on /design/library/policies. */
  id: string;
  /** The bible rules whose `enforcedBy` names this file. */
  citedBy: BibleRule[];
};

const CITED_BY = new Map<string, BibleRule[]>();
for (const rule of BIBLE) {
  if (rule.enforcedBy === "review") continue;
  for (const file of rule.enforcedBy) {
    CITED_BY.set(file, [...(CITED_BY.get(file) ?? []), rule]);
  }
}

/**
 * Every policy with its id and the rules that cite it. Ordered by scope (the
 * declared order of `POLICY_SCOPES`) and then by title, which is how the
 * library and `library.md` both read them.
 */
export const POLICY_VIEWS: PolicyView[] = POLICIES.map((p) => ({
  ...p,
  id: policyId(p.file),
  citedBy: CITED_BY.get(p.file) ?? [],
}));

export function policyView(id: string): PolicyView | undefined {
  return POLICY_VIEWS.find((p) => p.id === id);
}

/**
 * A DESIGN policy nobody points at. `engineering` is exempt by construction (a
 * keyframe collision is not a design decision); anything else that no bible
 * rule cites is a finding, not a rule, and `rules-registry.test.ts` fails on
 * it. Exported so the library can show the same list it fails on.
 */
export function uncitedDesignPolicies(): PolicyView[] {
  return POLICY_VIEWS.filter(
    (p) => p.scope !== "engineering" && p.citedBy.length === 0,
  );
}

/** Every policy that holds a line on this scope: its own, plus the global ones. */
export function policiesInScope(scope: PolicyScope | null): PolicyView[] {
  if (!scope) return POLICY_VIEWS;
  return POLICY_VIEWS.filter((p) => p.scope === scope || p.scope === "global");
}
