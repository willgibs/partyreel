import artifact from "./rules.generated.json";
import { COMPONENT_NOTES, type ComponentNote } from "./component-notes";

/**
 * THE REGISTRY, read side (the "less is more" reset, 2026-09-12).
 * `rules.generated.json` is what the collector (scripts/design-rules/
 * collect.mjs) derives from code: the component index and each component's
 * contracts. The bible is bible.ts, hand-authored. Nothing here touches the
 * filesystem: the lab pages are dynamic, and the Vercel bundle only carries
 * what an import can see.
 */

export type ContractRecord = {
  /** The it() title, verbatim. */
  title: string;
  /** The describe path, outermost first. */
  suite: string[];
  /** Repo-relative, POSIX: the contract test. */
  file: string;
  /** 1-based; for the source link only, never compared. */
  line: number;
};

export type ComponentRecord = {
  /** The file stem (its parent's name prefixed when two stems collide); the anchor. */
  id: string;
  file: string;
  names: string[];
  /** The library routes whose page imports the file. */
  specimens: string[];
  /** In one of the library's directories, so the index lists it and a specimen is owed. */
  indexed: boolean;
  contracts: ContractRecord[];
};

/** A policy's reach; `engineering` is the carve-out that needs no bible rule. */
export type PolicyScope =
  | "global"
  | "marketing"
  | "guest"
  | "host"
  | "shared"
  | "lab"
  | "engineering";

export const POLICY_SCOPES: PolicyScope[] = [
  "global",
  "marketing",
  "guest",
  "host",
  "shared",
  "lab",
  "engineering",
];

export const POLICY_SCOPE_LABEL: Record<PolicyScope, string> = {
  global: "Everywhere",
  marketing: "The marketing site",
  guest: "The guest surface",
  host: "The host app",
  shared: "Shared components",
  lab: "The lab",
  engineering: "Engineering (not design)",
};

export type PolicyRecord = {
  /** Repo-relative, POSIX: the test that holds the line. */
  file: string;
  scope: PolicyScope;
  /** The `@policy:` title, or the file stem as a sentence. */
  title: string;
  /** The `@refuses:` line: what a red gate on this file means. */
  summary: string;
  /** 1-based; the line the directive sits on. */
  line: number;
};

export type RulesArtifact = {
  version: number;
  components: ComponentRecord[];
  policies: PolicyRecord[];
};

export const RULES_ARTIFACT = artifact as RulesArtifact;
export const COMPONENTS: ComponentRecord[] = RULES_ARTIFACT.components;

/**
 * Every `@policy:` test, in file order. The level between a contract (one
 * component's function) and precedent (what merely shipped): an agent-written
 * line held across the whole tree, and provisional by construction, since an
 * agent wrote it (Will, 2026-09-01: "a good rule that prevents bad choices, or
 * a bad system that prevents good choices?").
 */
export const POLICIES: PolicyRecord[] = RULES_ARTIFACT.policies;

/** The policy id the library anchors on and `policy:<id>` refs resolve: the file stem. */
export function policyId(file: string): string {
  return (file.split("/").pop() ?? file).replace(/\.test\.tsx?$/, "");
}

export function policiesByScope(): [PolicyScope, PolicyRecord[]][] {
  return POLICY_SCOPES.map(
    (scope) =>
      [scope, POLICIES.filter((p) => p.scope === scope)] as [
        PolicyScope,
        PolicyRecord[],
      ],
  ).filter(([, list]) => list.length > 0);
}

/** The files in the library's directories: what the /design index lists. */
export const INDEXED: ComponentRecord[] = COMPONENTS.filter((c) => c.indexed);

/** Every component with a contract, indexed or not. */
export const CONTRACTED: ComponentRecord[] = COMPONENTS.filter(
  (c) => c.contracts.length > 0,
);

export function componentNote(file: string): ComponentNote | undefined {
  return COMPONENT_NOTES[file];
}

/** The exported names, or the file name when a module exports none in caps. */
export function componentTitle(c: ComponentRecord): string {
  return c.names.join(", ") || (c.file.split("/").pop() ?? c.file);
}

export function groupByDirectory(
  components: ComponentRecord[] = INDEXED,
): [string, ComponentRecord[]][] {
  const groups = new Map<string, ComponentRecord[]>();
  for (const c of components) {
    const dir = c.file.slice(0, c.file.lastIndexOf("/"));
    groups.set(dir, [...(groups.get(dir) ?? []), c]);
  }
  return [...groups.entries()];
}

/** Counts each contract once: a test that names two components (the glow engine and its filter) is one guard, shown on both. */
export function countContracts() {
  const seen = new Set(
    CONTRACTED.flatMap((c) => c.contracts.map((k) => `${k.file}:${k.line}`)),
  );
  const contracts = seen.size;
  const contractFiles = new Set(
    CONTRACTED.flatMap((c) => c.contracts.map((k) => k.file)),
  ).size;
  return {
    components: COMPONENTS.length,
    indexed: INDEXED.length,
    contracted: CONTRACTED.length,
    contracts,
    contractFiles,
    policies: POLICIES.length,
  };
}
