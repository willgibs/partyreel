import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { listSpecs } from "@/app/(dev)/design/_data/docs";
import { POLICY_VIEWS } from "@/app/(dev)/design/_data/policies";
import { BIBLE, BIBLE_GROUP_LABEL } from "@/app/(dev)/design/rules/bible";
import { LEVEL_BY_ID } from "@/app/(dev)/design/rules/influences";
import { getRuling, SANDBOX } from "@/app/(dev)/design/touchpoints";

import { LevelBadge } from "../level-badge";

/**
 * ONE RULE'S PERMALINK (the Library x Lab round, 2026-09-15). A rule is the
 * only level that always binds, so its page says four things and stops: the
 * rule, why it holds, what actually enforces it, and whether anything is
 * currently rewriting what it inherits.
 *
 * The last of those is the one that changes how an agent reads it today. A
 * rule marked `under exploration: <board>` is interim law: its board is
 * writing the values or the doctrine underneath it, and the agent on that
 * board may rewrite the rule itself. So the board, its proposal and its record
 * entry are gathered here rather than left for the reader to find.
 */
export default async function RulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { id } = await params;
  const i = BIBLE.findIndex((r) => r.id === id);
  if (i === -1) notFound();
  const rule = BIBLE[i];
  const prev = BIBLE[i - 1];
  const next = BIBLE[i + 1];

  const [kind, track] = (rule.status ?? "").split(": ");
  const board = track && SANDBOX.some((r) => r.id === track) ? track : null;
  const proposal = board
    ? (listSpecs().find((s) => s.slug === board) ?? null)
    : null;
  const ruling = board ? getRuling(board) : undefined;
  const enforcing =
    rule.enforcedBy === "review"
      ? []
      : rule.enforcedBy.map((file) => ({
          file,
          policy: POLICY_VIEWS.find((p) => p.file === file) ?? null,
        }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={`${rule.n}. ${rule.statement}`}
        description={rule.why}
        badges={
          <>
            <LevelBadge level={LEVEL_BY_ID.law} />
            <Tag>{BIBLE_GROUP_LABEL[rule.group]}</Tag>
            {rule.status && rule.status !== "ruled" && (
              <Tag badge="exploring">
                {kind}
                {track ? `: ${track}` : ""}
              </Tag>
            )}
          </>
        }
        meta={[
          ["Ruled by", `${rule.ruledBy} · ${rule.ruledOn}`],
          [
            "Source",
            <Ref
              key="src"
              to={{
                kind: "source",
                file: "src/app/(dev)/design/rules/bible.ts",
              }}
              quiet
            />,
          ],
        ]}
      />

      <Section
        id="enforcement"
        title="What enforces it"
        blurb={
          rule.enforcedBy === "review"
            ? "Nothing mechanical. A human eye is the whole enforcement, so this rule drifts silently between reviews: read it before you touch its surface, and say on your board where you departed."
            : "The policies that check some of it. A policy never checks the whole of a rule; the rest is read."
        }
      >
        {rule.enforcedBy === "review" ? (
          <Callout kind="note">
            Held at review. That is honest rather than a gap to fix with a test:
            some of the law is about taste, and a test that pinned it would pin
            a look, which a contract may never do.
          </Callout>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {enforcing.map(({ file, policy }) => (
              <li key={file} className="px-4 py-2.5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  {policy ? (
                    <Ref to={`policy:${policy.id}`} className="font-medium">
                      {policy.title}
                    </Ref>
                  ) : (
                    <span className="font-medium">{file}</span>
                  )}
                  <Ref
                    to={{ kind: "source", file }}
                    quiet
                    className="text-[11px]"
                  />
                </p>
                {policy && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Refuses {policy.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {rule.status && rule.status !== "ruled" && (
        <Section
          id="status"
          title={
            kind === "retiring" ? "Leaving the bible" : "Under exploration"
          }
          blurb={
            kind === "retiring"
              ? `Read, not obeyed. The rule goes when ${track} lands.`
              : `The statement above is the interim law. ${track} is writing what it inherits: its values, or its doctrine.`
          }
        >
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
            {board && (
              <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
                <span className="w-24 shrink-0 text-[11px] text-muted-foreground">
                  The board
                </span>
                <Ref to={{ kind: "board", id: board }} className="font-medium">
                  {ruling?.title ?? board}
                </Ref>
              </li>
            )}
            {proposal && (
              <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
                <span className="w-24 shrink-0 text-[11px] text-muted-foreground">
                  It inherits
                </span>
                <span className="min-w-0">
                  <Ref
                    to={{ kind: "proposal", slug: proposal.slug }}
                    className="font-medium"
                  >
                    {proposal.title}
                  </Ref>
                  <span className="block text-[11px] text-muted-foreground">
                    A proposal, not law until Will rules on it.
                  </span>
                </span>
              </li>
            )}
            {ruling && (
              <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
                <span className="w-24 shrink-0 text-[11px] text-muted-foreground">
                  The record
                </span>
                <Ref to={{ kind: "record", id: ruling.id }}>
                  what has been ruled so far
                </Ref>
              </li>
            )}
            {!board && track && (
              <li className="px-4 py-2.5 text-muted-foreground">
                {track} is a track, not a standing board: read its manifest at{" "}
                <Ref to={{ kind: "track", name: track }} quiet />.
              </li>
            )}
          </ul>
        </Section>
      )}

      <Callout kind="will" className="mt-10">
        A bible rule always binds. It changes only by Will&apos;s ruling; a rule
        that blocks better work is a finding for your manifest, and the better
        thing is built in the lab first (bible 22).
      </Callout>

      <Pager
        prev={
          prev && {
            href: `/design/library/rules/${prev.id}`,
            label: `${prev.n}. ${prev.statement}`,
          }
        }
        next={
          next && {
            href: `/design/library/rules/${next.id}`,
            label: `${next.n}. ${next.statement}`,
          }
        }
      />
    </div>
  );
}
