import { requireDesignKey } from "@/lib/design-gate/server";
import { cn } from "@/lib/utils";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section, Sub } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { POLICY_VIEWS } from "@/app/(dev)/design/_data/policies";
import {
  BIBLE,
  BIBLE_GROUP_LABEL,
  BIBLE_GROUPS,
  type BibleRule,
} from "@/app/(dev)/design/rules/bible";
import {
  health,
  LEVELS,
  type LevelDef,
} from "@/app/(dev)/design/rules/influences";
import {
  policiesByScope,
  POLICY_SCOPE_LABEL,
} from "@/app/(dev)/design/rules/rules";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

import { LevelBadge, LevelVerdict } from "./level-badge";

/**
 * THE RULES (the Library x Lab round, 2026-09-15; the "less is more" reset,
 * 2026-09-12 before it). One page answers one question: WHAT BINDS ME?
 *
 * It opens with the nine levels, because that is the answer: two of them bind
 * and the other seven do not, and an agent who cannot tell them apart obeys
 * all nine and builds small (Will, 2026-09-12: 400+ rules produced
 * "incredibly repetitive" designs and "a fear in new agents where it feels
 * safer to aim small").
 *
 * The contracts LEFT this page in this round: a contract binds one component
 * and is read on that component's page, beside the thing it guards. Stacking a
 * hundred of them under twenty-two laws was most of what made the law look
 * long.
 *
 * The health strip at the foot is computed, never remembered: the rule set
 * auditing itself, which is the 2026-09-01 ruling made mechanical.
 */
export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const scopes = policiesByScope();
  const findings = health().filter((f) => f.id !== "uncontracted");
  const binding = LEVELS.filter((l) => l.weight !== "informs");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="What binds you"
        description="Everything that influences design work on Partyreel, levelled. Two levels bind: the bible, and the contracts of the components under a path you own. A third binds mechanically inside its scope. The rest inform, and an agent that obeys all of them builds small."
        badges={
          <>
            <Tag>{BIBLE.length} laws</Tag>
            <Tag>{POLICY_VIEWS.length} policies</Tag>
            <Tag badge="updated">levelled</Tag>
          </>
        }
        meta={[
          [
            "As one file",
            <Ref key="f" to="docs/design/library.md" quiet>
              docs/design/library.md
            </Ref>,
          ],
          [
            "The levels",
            <Ref key="r" to="docs/design/README.md" quiet>
              docs/design/README.md
            </Ref>,
          ],
        ]}
      />

      <StatRow
        stats={[
          ["levels", LEVELS.length],
          ["that bind", binding.length],
          ["laws", BIBLE.length],
          ["policies", POLICY_VIEWS.length],
        ]}
      />

      <Section
        id="levels"
        title="The levels"
        blurb="Nine kinds of influence, in authority order. Each definition lives in one place, docs/design/README.md, and is read from there, so the prose a human reads and the badge an agent sees cannot disagree."
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {LEVELS.map((level) => (
            <LevelRow key={level.id} level={level} />
          ))}
        </ul>
        <Callout kind="will" className="mt-4">
          A bible rule that blocks better work is a finding for your manifest,
          not a wall (bible 22). A policy that does is the same, and weaker
          still: an agent wrote it. Everything below GUIDANCE exists to be read
          and rebuilt.
        </Callout>
      </Section>

      <Section
        id="law"
        title="The law"
        blurb="The whole of it: twenty-two rules, Will's, each with why it holds, what enforces it and where it stands. A rule under exploration links the board writing what it inherits; its statement is the interim law."
        aside={
          <span className="text-[11px] text-muted-foreground">
            hand-authored, never derived
          </span>
        }
      >
        <div className="space-y-2">
          {BIBLE_GROUPS.map((group) => (
            <Sub
              key={group}
              id={`law-${group.replace(/\s+/g, "-")}`}
              title={BIBLE_GROUP_LABEL[group]}
            >
              <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {BIBLE.filter((r) => r.group === group).map((rule) => (
                  <BibleRow key={rule.id} rule={rule} />
                ))}
              </ol>
            </Sub>
          ))}
        </div>
      </Section>

      <Section
        id="policies"
        title="The policies"
        blurb="A test that holds a line across the whole tree, grouped by how far it reaches. Each names the bible rules that cite it: a design policy no rule cites fails the gate, because a policy nothing points at is an agent's habit wearing a rule's badge."
        aside={
          <LabLink
            href="/design/library/policies"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            what each refuses, and the landmines
          </LabLink>
        }
      >
        <div className="space-y-2">
          {scopes.map(([scope, list]) => (
            <Sub
              key={scope}
              id={`policies-${scope}`}
              title={POLICY_SCOPE_LABEL[scope]}
              blurb={
                scope === "engineering"
                  ? "Not design at all, so no bible rule is owed a citation of them."
                  : undefined
              }
            >
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {list.map((p) => {
                  const view = POLICY_VIEWS.find((v) => v.file === p.file);
                  return (
                    <li key={p.file} className="px-4 py-2.5">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <LabLink
                          href={`/design/library/policies#${view?.id ?? ""}`}
                          className="font-medium hover:underline"
                        >
                          {p.title}
                        </LabLink>
                        <span className="text-[11px] text-muted-foreground">
                          {p.file}:{p.line}
                        </span>
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
                        {view && view.citedBy.length > 0 ? (
                          <>
                            <span>cited by</span>
                            {view.citedBy.map((r) => (
                              <Ref
                                key={r.id}
                                to={{ kind: "rule", id: r.id }}
                                quiet
                              >
                                bible {r.n}
                              </Ref>
                            ))}
                          </>
                        ) : (
                          <span>
                            {scope === "engineering"
                              ? "no rule owed"
                              : "cited by no bible rule"}
                          </span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Sub>
          ))}
        </div>
      </Section>

      <Section
        id="health"
        title="The rule set's own health"
        blurb="Computed from the registry, not remembered. Zero is not the goal for every line; being able to see the number is."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {findings.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <p className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "font-heading text-2xl tabular-nums",
                    f.count === 0 && "text-muted-foreground",
                  )}
                >
                  {f.count}
                </span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {f.note}
              </p>
              {f.items.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-foreground/70">
                  {f.items.slice(0, 5).map((item) => (
                    <li key={item} className="truncate" title={item}>
                      {item}
                    </li>
                  ))}
                  {f.items.length > 5 && (
                    <li className="text-muted-foreground">
                      and {f.items.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Pager />
    </div>
  );
}

const SCROLL_MT = "scroll-mt-[calc(var(--lab-topbar-h,0px)+12px)]";

function LevelRow({ level }: { level: LevelDef }) {
  return (
    <li
      id={`level-${level.id}`}
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3",
        SCROLL_MT,
      )}
    >
      <span className="flex w-24 shrink-0 items-baseline">
        <LevelBadge level={level} />
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm">{level.line}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {level.binds}
        </p>
      </div>
      <LevelVerdict level={level} />
    </li>
  );
}

/**
 * A rule, one row. The statement is the rule; the why is the argument; the
 * status is the only thing that can change how it binds today, so it sits
 * first on the meta line rather than last.
 */
function BibleRow({ rule }: { rule: BibleRule }) {
  const [kind, track] = (rule.status ?? "").split(": ");
  const board = track && SANDBOX.some((r) => r.id === track);

  return (
    <li id={rule.id} className={cn("px-4 py-3", SCROLL_MT)}>
      <p className="text-sm">
        <span className="mr-2 text-[11px] text-muted-foreground tabular-nums">
          {rule.n}
        </span>
        <LabLink
          href={`/design/library/rules/${rule.id}`}
          className="font-medium hover:underline"
        >
          {rule.statement}
        </LabLink>
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {rule.why}
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        {rule.status && rule.status !== "ruled" && (
          <span className="rounded-sm bg-foreground px-1.5 py-px text-[10px] font-medium text-background">
            {kind}
            {track ? ": " : ""}
            {board ? (
              <LabLink
                href={`/design/lab/${track}`}
                className="underline underline-offset-2"
              >
                {track}
              </LabLink>
            ) : (
              track
            )}
          </span>
        )}
        <span>
          {rule.ruledBy} · {rule.ruledOn}
        </span>
        <span aria-hidden>·</span>
        {rule.enforcedBy === "review" ? (
          <span>held at review, nothing tests it</span>
        ) : (
          <span className="inline-flex flex-wrap items-baseline gap-x-2">
            <span>enforced by</span>
            {rule.enforcedBy.map((file) => (
              <Ref key={file} to={file} quiet />
            ))}
          </span>
        )}
      </p>
    </li>
  );
}
