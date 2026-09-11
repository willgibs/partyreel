import artifact from "./rules.generated.json";
import {
  COMPONENT_NOTES,
  FILE_ANNOTATIONS,
  RULE_ANNOTATIONS,
  type FileAnnotation,
  type RuleAnnotation,
  type Scope,
  type Verdict,
} from "./annotations";

/**
 * THE RULES REGISTRY, read side. `rules.generated.json` is what the collector
 * (scripts/design-rules/collect.mjs) derives from the guard tests and the ★
 * runs in the design docs; `annotations.ts` is the hand layer (scope,
 * provenance, Will's verdicts). This module joins the two for the page and
 * for the guards, and nothing here touches the filesystem: the lab pages are
 * dynamic, and the Vercel bundle only carries what an import can see.
 */

export type RuleSource = "test" | "doc";

export type RuleRecord = {
  id: string;
  source: RuleSource;
  /** Repo-relative, POSIX. */
  file: string;
  /** 1-based; for the source link only, never part of the id. */
  line: number;
  /** The describe path (outermost first), or [heading anchor] for a doc rule. */
  suite: string[];
  /** The it() title, or the ★ run's headline. */
  title: string;
  /** Doc rules: the run after its headline; tests: null. */
  body: string | null;
  /** ★ is 1, ★★ is 2. */
  emphasis: 1 | 2;
  /** The title held a template hole or an .each table. */
  dynamic: boolean;
  skipped: boolean;
  provenance: {
    dates: string[];
    adrs: string[];
    ruledBy: "will" | "unknown";
    quote: string | null;
  };
  /** Doc rules: test basenames the run names, the prose-to-test join. */
  pins: string[];
};

export type ComponentRecord = {
  file: string;
  names: string[];
  /** The library routes whose page imports the file. */
  specimens: string[];
};

export type RulesArtifact = {
  version: number;
  rules: RuleRecord[];
  components: ComponentRecord[];
};

export const RULES_ARTIFACT = artifact as RulesArtifact;
export const RULES: RuleRecord[] = RULES_ARTIFACT.rules;
export const COMPONENTS: ComponentRecord[] = RULES_ARTIFACT.components;

export const SCOPES: Scope[] = [
  "global",
  "marketing",
  "shared",
  "lab",
  "app",
  "data-integrity",
  "tooling",
];

/** The design scopes render open; the rest render collapsed. */
export const DESIGN_SCOPES = new Set<Scope>([
  "global",
  "marketing",
  "shared",
  "lab",
]);

export const SCOPE_LABEL: Record<Scope, string> = {
  global: "Global",
  marketing: "Marketing",
  shared: "Shared",
  lab: "The lab",
  app: "The app",
  "data-integrity": "Data integrity",
  tooling: "Tooling",
};

const fileAnnotationByFile = new Map<string, FileAnnotation>(
  FILE_ANNOTATIONS.map((a) => [a.file, a]),
);
const ruleAnnotationById = new Map<string, RuleAnnotation>(
  RULE_ANNOTATIONS.map((a) => [a.id, a]),
);

export function fileAnnotation(file: string): FileAnnotation | undefined {
  return fileAnnotationByFile.get(file);
}

export function ruleAnnotation(id: string): RuleAnnotation | undefined {
  return ruleAnnotationById.get(id);
}

/** A doc rule belongs to the scope of the doc it sits in. */
const DOC_SCOPE: Record<string, Scope> = {
  "docs/systems/design-system.md": "global",
  "docs/systems/marketing-content.md": "marketing",
};

export function scopeOf(rule: RuleRecord): Scope {
  const own = ruleAnnotationById.get(rule.id)?.scope;
  if (own) return own;
  if (rule.source === "doc") return DOC_SCOPE[rule.file] ?? "global";
  return fileAnnotationByFile.get(rule.file)?.scope ?? "tooling";
}

export function verdictOf(rule: RuleRecord): Verdict {
  return ruleAnnotationById.get(rule.id)?.verdict ?? "unreviewed";
}

/** Who ruled it: the annotation's word first, then what the comments say. */
export function ruledByOf(rule: RuleRecord): "will" | "agent" | "unknown" {
  if (rule.provenance.ruledBy === "will") return "will";
  if (rule.source === "test") {
    return fileAnnotationByFile.get(rule.file)?.ruledBy ?? "unknown";
  }
  return "unknown";
}

/** Test basenames -> the test rules' files, for the prose-to-test join. */
export function pinnedFilesOf(rule: RuleRecord): string[] {
  if (!rule.pins.length) return [];
  const files = new Set(
    RULES.filter((r) => r.source === "test").map((r) => r.file),
  );
  return rule.pins
    .map((basename) => [...files].find((f) => f.endsWith("/" + basename)))
    .filter((f): f is string => Boolean(f));
}

export type ScopeGroup = {
  scope: Scope;
  files: {
    file: string;
    annotation: FileAnnotation | undefined;
    rules: RuleRecord[];
  }[];
  /** Doc rules whose pins resolve to none of this scope's files. */
  proseOnly: RuleRecord[];
};

/** The page's shape: scope -> file -> rules, with unpinned prose set aside. */
export function groupByScope(rules: RuleRecord[] = RULES): ScopeGroup[] {
  const groups = new Map<Scope, ScopeGroup>();
  for (const scope of SCOPES)
    groups.set(scope, { scope, files: [], proseOnly: [] });
  const byFile = new Map<string, RuleRecord[]>();
  const pinnedDocs = new Map<string, RuleRecord[]>();
  for (const rule of rules) {
    if (rule.source === "test") {
      byFile.set(rule.file, [...(byFile.get(rule.file) ?? []), rule]);
      continue;
    }
    const targets = pinnedFilesOf(rule);
    if (targets.length) {
      for (const t of targets)
        pinnedDocs.set(t, [...(pinnedDocs.get(t) ?? []), rule]);
    } else {
      groups.get(scopeOf(rule))?.proseOnly.push(rule);
    }
  }
  for (const [file, fileRules] of byFile) {
    const scope = fileAnnotationByFile.get(file)?.scope ?? "tooling";
    groups.get(scope)?.files.push({
      file,
      annotation: fileAnnotationByFile.get(file),
      rules: [...fileRules, ...(pinnedDocs.get(file) ?? [])],
    });
  }
  for (const g of groups.values())
    g.files.sort((a, b) => a.file.localeCompare(b.file));
  return SCOPES.map((s) => groups.get(s)!);
}

export type RuleCounts = {
  total: number;
  fromTests: number;
  prose: number;
  proseOnly: number;
  unreviewed: number;
  byVerdict: Record<Verdict, number>;
  byScope: Record<Scope, number>;
};

export function countRules(rules: RuleRecord[] = RULES): RuleCounts {
  const byVerdict: Record<Verdict, number> = {
    unreviewed: 0,
    keep: 0,
    merge: 0,
    drop: 0,
  };
  const byScope = Object.fromEntries(SCOPES.map((s) => [s, 0])) as Record<
    Scope,
    number
  >;
  let fromTests = 0;
  let proseOnly = 0;
  for (const rule of rules) {
    byVerdict[verdictOf(rule)] += 1;
    byScope[scopeOf(rule)] += 1;
    if (rule.source === "test") fromTests += 1;
    else if (!pinnedFilesOf(rule).length) proseOnly += 1;
  }
  return {
    total: rules.length,
    fromTests,
    prose: rules.length - fromTests,
    proseOnly,
    unreviewed: byVerdict.unreviewed,
    byVerdict,
    byScope,
  };
}

export function componentNote(file: string) {
  return COMPONENT_NOTES[file];
}
