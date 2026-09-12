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

export type RulesArtifact = {
  version: number;
  components: ComponentRecord[];
};

export const RULES_ARTIFACT = artifact as RulesArtifact;
export const COMPONENTS: ComponentRecord[] = RULES_ARTIFACT.components;

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
  };
}
