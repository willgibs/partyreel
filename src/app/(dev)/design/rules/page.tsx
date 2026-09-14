import Link from "next/link";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";
import { cn } from "@/lib/utils";

import { RefHeader, RefSection } from "../reference/reference-ui";
import { SANDBOX } from "../touchpoints";
import {
  BIBLE,
  BIBLE_GROUP_LABEL,
  BIBLE_GROUPS,
  type BibleRule,
} from "./bible";
import {
  CONTRACTED,
  componentTitle,
  countContracts,
  type ComponentRecord,
} from "./rules";

// THE RULES (the "less is more" reset, 2026-09-12). Two things and nothing
// else: THE BIBLE, twenty-two hand-authored rules that are the whole of the
// design law (bible.ts), and THE CONTRACTS, each component's functional guards
// (a test tagged @contract-for), shown on the component they belong to. The
// first version of this page rendered 433 rules derived from every guard
// test's titles and every star run in two docs, with a verdict island for a
// review Will did not have time for; his ruling replaced it with this. Nothing
// here reads the filesystem: the artifact is committed and pinned fresh.
//
// The second edition (Will's review, 2026-09-14) added a status per rule: a
// rule under exploration links the board writing what it inherits, so this
// page is also the map of what is open.
export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);
  const counts = countContracts();
  const cwd = process.cwd();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · the rules"
        title="The bible"
        blurb="The whole of the design law: twenty-two rules, Will's, each with why it holds, how it is enforced and, after his review, where it stands. A component's functional contract lives on the component, below. Everything else on the site is precedent: judge it from the ground up, elevate what points the right way and rework what does not."
      />

      <div className="mt-6 grid grid-cols-3 gap-2">
        {(
          [
            ["rules in the bible", BIBLE.length],
            ["components with a contract", counts.contracted],
            ["contracts", counts.contracts],
          ] as [string, number][]
        ).map(([label, n]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="font-heading text-2xl">{n}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {BIBLE_GROUPS.map((group) => (
        <RefSection key={group} title={BIBLE_GROUP_LABEL[group]}>
          <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {BIBLE.filter((r) => r.group === group).map((rule) => (
              <BibleRow key={rule.id} rule={rule} cwd={cwd} link={link} />
            ))}
          </ol>
        </RefSection>
      ))}

      <RefSection
        title={`Component contracts (${counts.contracts})`}
        blurb="A contract keeps a component working: its structure, its accessibility, its single sources, its engine. It never freezes a look. A test opts in with one header line, @contract-for, and its titles land here on the component it names; a test without the line is a test, not a rule."
      >
        <div className="space-y-4">
          {CONTRACTED.map((c) => (
            <ContractBlock key={c.id} component={c} cwd={cwd} link={link} />
          ))}
        </div>
      </RefSection>
    </main>
  );
}

function BibleRow({
  rule,
  cwd,
  link,
}: {
  rule: BibleRule;
  cwd: string;
  link: (href: string) => string;
}) {
  return (
    <li id={rule.id} className="px-4 py-3">
      <p className="text-sm">
        <span className="mr-2 text-[11px] text-muted-foreground tabular-nums">
          {rule.n}
        </span>
        <span className="font-medium">{rule.statement}</span>
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {rule.why}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
        <RuleStatus status={rule.status} link={link} />
        <span>
          {rule.ruledBy} · {rule.ruledOn}
        </span>
        <span aria-hidden>·</span>
        {rule.enforcedBy === "review" ? (
          <span>at review</span>
        ) : (
          <span className="inline-flex flex-wrap items-baseline gap-x-2">
            <span>enforced by</span>
            {rule.enforcedBy.map((file) => (
              <SourceLink key={file} file={file} cwd={cwd} />
            ))}
          </span>
        )}
      </p>
    </li>
  );
}

/**
 * Where the rule stands after a review. "under exploration: palette" links the
 * palette board; a track with no board (a sweep) reads as text. Ruled rules
 * render nothing here: the absence is the common case and should stay quiet.
 */
function RuleStatus({
  status,
  link,
}: {
  status: BibleRule["status"];
  link: (href: string) => string;
}) {
  if (!status || status === "ruled") return null;
  const [kind, track] = status.split(": ");
  const board = track && SANDBOX.some((r) => r.id === track);
  return (
    <>
      <span className="rounded-sm bg-foreground px-1.5 py-px text-[10px] font-medium text-background">
        {kind}
        {track ? ": " : ""}
        {board ? (
          <Link
            href={link(`/design/c/${track}`)}
            className="underline underline-offset-2"
          >
            {track}
          </Link>
        ) : (
          track
        )}
      </span>
      <span aria-hidden>·</span>
    </>
  );
}

function ContractBlock({
  component: c,
  cwd,
  link,
}: {
  component: ComponentRecord;
  cwd: string;
  link: (href: string) => string;
}) {
  return (
    <div
      id={`c-${c.id}`}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-medium">
          {componentTitle(c)}{" "}
          <SourceLink
            file={c.file}
            cwd={cwd}
            className="ml-1 text-[11px] font-normal text-muted-foreground"
          />
        </p>
        <p className="flex flex-wrap gap-2 text-[11px]">
          {c.specimens.length > 0 ? (
            c.specimens.map((route) => (
              <Link key={route} href={link(route)} className="underline">
                {route}
              </Link>
            ))
          ) : (
            <span className="text-muted-foreground">
              {c.indexed ? "no specimen" : "not a library component"}
            </span>
          )}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {c.contracts.map((k) => (
          <li
            key={`${k.file}:${k.line}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm"
          >
            <p>
              {k.suite.length > 0 && (
                <span className="text-muted-foreground">
                  {k.suite.join(" › ")} ·{" "}
                </span>
              )}
              {k.title}
            </p>
            <SourceLink
              file={k.file}
              line={k.line}
              cwd={cwd}
              className="text-[11px] text-muted-foreground"
            />
          </li>
        ))}
      </ul>
    </div>
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
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
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
