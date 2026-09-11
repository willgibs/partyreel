import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";
import { cn } from "@/lib/utils";

import { RefHeader, RefSection } from "../reference/reference-ui";
import { RULINGS, SURFACE_LABEL } from "../touchpoints";
import { RULE_ANNOTATIONS, type Scope } from "./annotations";
import {
  DESIGN_SCOPES,
  RULES,
  SCOPE_LABEL,
  countRules,
  groupByScope,
  ruledByOf,
  scopeOf,
  verdictOf,
  type RuleRecord,
  type ScopeGroup,
} from "./rules";
import {
  VerdictControl,
  VerdictIsland,
  type VerdictEntry,
} from "./verdict-island";

// THE RULES (the library phase, 2026-09-11). Every rule the repo actually
// enforces, derived from code by scripts/design-rules/collect.mjs: the guard
// tests' titles, the star runs in the two design docs, and the lab's own
// rulings, each with its scope, its provenance and Will's verdict. Will's
// brief: the full set of working rules visible in the library rather than
// hidden in the docs, so a maze of agent-invented one-offs can be seen and
// pruned; the rules that survive enforce global consistency. Nothing here
// reads the filesystem: the artifact is committed and pinned fresh.
export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);
  const counts = countRules();
  const groups = groupByScope();
  const cwd = process.cwd();
  const committed = Object.fromEntries(
    RULE_ANNOTATIONS.map((a) => [
      a.id,
      {
        verdict: a.verdict,
        note: a.note ?? "",
        mergeInto: a.mergeInto ?? "",
      } satisfies VerdictEntry,
    ]),
  );
  const dropped = RULE_ANNOTATIONS.filter((a) => a.droppedOn);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · the rules"
        title="The rules"
        blurb="Every rule a test or a design doc actually enforces, derived from code, with where it lives, who set it and when, and your verdict. A green test proves a rule is checked, not that the check has teeth; a prose-only rule is one nothing enforces. Keep what holds the whole product together; merge a case into its rule; drop the one-offs."
      />

      <Counters counts={counts} />

      <VerdictIsland committed={committed}>
        {groups.map((group) =>
          DESIGN_SCOPES.has(group.scope) ? (
            <ScopeSection key={group.scope} group={group} cwd={cwd} />
          ) : (
            <details key={group.scope} className="pt-10">
              <summary className="cursor-pointer text-sm font-semibold">
                {SCOPE_LABEL[group.scope]}{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {counts.byScope[group.scope]} · not design rules; enforced all
                  the same
                </span>
              </summary>
              <ScopeBody group={group} cwd={cwd} />
            </details>
          ),
        )}

        <RefSection
          title={`Rulings (${RULINGS.length})`}
          blurb="The lab's own record, one line each; the long form is docs/decisions/design-record.md. These are history, not rules: a ruling that no test or doc enforces is worth noticing."
        >
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {RULINGS.map((r) => {
              const count = rulesForRuling(r.lives).length;
              return (
                <div
                  key={r.id}
                  id={`r-${r.id}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 py-2.5 text-sm last:border-0"
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {SURFACE_LABEL[r.surface]} · {r.ruled}
                  </p>
                  <p className="basis-full text-muted-foreground">{r.why}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {count === 0
                      ? "enforced by nothing"
                      : `${count} enforced rule${count === 1 ? "" : "s"}`}{" "}
                    ·{" "}
                    <a
                      href={link(`/design/record#${r.id}`)}
                      className="underline"
                    >
                      the record
                    </a>
                  </p>
                </div>
              );
            })}
          </div>
        </RefSection>

        {dropped.length > 0 && (
          <details className="pt-10">
            <summary className="cursor-pointer text-sm font-semibold">
              Dropped{" "}
              <span className="font-mono text-[11px] text-muted-foreground">
                {dropped.length} · the code is gone, the guard expects it absent
              </span>
            </summary>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
              {dropped.map((a) => (
                <div
                  key={a.id}
                  className="border-b border-border px-4 py-2.5 text-sm last:border-0"
                >
                  <p className="font-medium">{a.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {a.id} · dropped {a.droppedOn}
                  </p>
                  {a.note && <p className="text-muted-foreground">{a.note}</p>}
                </div>
              ))}
            </div>
          </details>
        )}
      </VerdictIsland>
    </main>
  );
}

/** Rules that live where a ruling says its rule lives (prefix on the path, the anchor for a doc). */
function rulesForRuling(lives: string[]): RuleRecord[] {
  return RULES.filter((rule) =>
    lives.some((entry) => {
      const [path, anchor] = entry.split("#");
      if (rule.source === "doc") {
        return rule.file === path && (!anchor || rule.suite[0] === anchor);
      }
      const prefix = path.replace(/\.[jt]sx?$/, "");
      return rule.file.startsWith(prefix);
    }),
  );
}

function Counters({ counts }: { counts: ReturnType<typeof countRules> }) {
  const cells: [string, number][] = [
    ["rules", counts.total],
    ["enforced by a test", counts.fromTests],
    ["stated in prose", counts.prose],
    ["prose only", counts.proseOnly],
    ["unreviewed", counts.unreviewed],
    ["keep", counts.byVerdict.keep],
    ["merge", counts.byVerdict.merge],
    ["drop", counts.byVerdict.drop],
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map(([label, n]) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-4 py-3"
        >
          <p className="font-heading text-2xl">{n}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
      <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-4">
        {(Object.entries(counts.byScope) as [Scope, number][]).map(
          ([scope, n]) => (
            <span
              key={scope}
              className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {SCOPE_LABEL[scope]} {n}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function ScopeSection({ group, cwd }: { group: ScopeGroup; cwd: string }) {
  const n =
    group.files.reduce((s, f) => s + f.rules.length, 0) +
    group.proseOnly.length;
  return (
    <RefSection
      title={`${SCOPE_LABEL[group.scope]} (${n})`}
      blurb={
        group.scope === "global"
          ? "Rules every surface obeys: the token and stylesheet contracts, the copy policy, the single sources."
          : group.scope === "marketing"
            ? "The marketing site's own contracts: the sheet, the heroes, the voice, the legal shell, the mocks that quote the app."
            : group.scope === "shared"
              ? "The shared primitives: the spill engine and its placements, the consent line, the sampler."
              : "The lab holding itself honest: the library pins, the registries, this page."
      }
    >
      <ScopeBody group={group} cwd={cwd} />
    </RefSection>
  );
}

function ScopeBody({ group, cwd }: { group: ScopeGroup; cwd: string }) {
  return (
    <div className="mt-4 space-y-4">
      {group.files.map(({ file, annotation, rules }) => (
        <div
          key={file}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2.5">
            <SourceLink
              file={file}
              cwd={cwd}
              className="text-[13px] font-medium"
            />
            {annotation && (
              <p className="max-w-3xl text-xs text-muted-foreground">
                {annotation.guards}
                <span className="font-mono">
                  {" "}
                  ·{" "}
                  {annotation.ruledBy === "will" ? "Will" : annotation.ruledBy}
                  {annotation.ruledOn ? ` · ${annotation.ruledOn}` : ""}
                </span>
              </p>
            )}
          </div>
          <ul className="divide-y divide-border">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} cwd={cwd} />
            ))}
          </ul>
        </div>
      ))}
      {group.proseOnly.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dashed border-border">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-[13px] font-medium">Prose only (not enforced)</p>
            <p className="text-xs text-muted-foreground">
              Star rules in the docs that no test pins. Each is a claim an agent
              or Will wrote down; the question for each is whether it is a rule
              at all.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {group.proseOnly.map((rule) => (
              <RuleRow key={rule.id} rule={rule} cwd={cwd} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RuleRow({ rule, cwd }: { rule: RuleRecord; cwd: string }) {
  const verdict = verdictOf(rule);
  const who = ruledByOf(rule);
  const prov = [
    who === "will" ? "Will" : who === "agent" ? "an agent" : "unsigned",
    ...rule.provenance.dates.slice(-1),
    ...rule.provenance.adrs,
  ].join(" · ");
  const text = rule.source === "doc" ? rule.body : rule.provenance.quote;
  return (
    <li id={rule.id} className="px-4 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {rule.source === "doc" && (
              <span className="mr-1 text-muted-foreground" aria-hidden>
                {rule.emphasis === 2 ? "★★" : "★"}
              </span>
            )}
            {rule.suite.length > 0 && rule.source === "test" && (
              <span className="text-muted-foreground">
                {rule.suite.join(" › ")} ·{" "}
              </span>
            )}
            {rule.title}
            {rule.dynamic && (
              <span className="ml-1.5 rounded-full border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
                per item
              </span>
            )}
            {rule.skipped && (
              <span className="ml-1.5 rounded-full border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
                skipped
              </span>
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
            <span className={cn(who === "unknown" && "text-destructive")}>
              {prov}
            </span>
            <span aria-hidden>·</span>
            <SourceLink file={rule.file} line={rule.line} cwd={cwd} />
            <span aria-hidden>·</span>
            <span>{SCOPE_LABEL[scopeOf(rule)]}</span>
            {verdict !== "unreviewed" && (
              <>
                <span aria-hidden>·</span>
                <span className="text-foreground">{verdict}</span>
              </>
            )}
          </p>
          {text && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[11px] text-muted-foreground">
                {rule.source === "doc"
                  ? "the rule in full"
                  : "the nearest comment"}
              </summary>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {text}
              </p>
            </details>
          )}
        </div>
        <VerdictControl id={rule.id} />
      </div>
    </li>
  );
}

/** The path, monospace, opening in the editor on Will's machine and on GitHub. */
function SourceLink({
  file,
  line,
  cwd,
  className,
}: {
  file: string;
  line?: number;
  cwd: string;
  className?: string;
}) {
  const at = line ? `${file}:${line}` : file;
  const vscode = `vscode://file${cwd}/${file}${line ? `:${line}` : ""}`;
  const gh = `https://github.com/willgibs/partyreel/blob/launch-prep/${file}${line ? `#L${line}` : ""}`;
  return (
    <span
      className={cn("inline-flex items-baseline gap-1.5 font-mono", className)}
    >
      <a href={vscode} className="break-all hover:underline">
        {at}
      </a>
      <a
        href={gh}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] text-muted-foreground hover:underline"
      >
        gh
      </a>
    </span>
  );
}
