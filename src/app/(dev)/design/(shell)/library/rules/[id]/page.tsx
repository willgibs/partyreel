import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { BIBLE, BIBLE_GROUP_LABEL } from "@/app/(dev)/design/rules/bible";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

/**
 * ONE RULE'S PERMALINK (the Library x Lab round, 2026-09-15): the statement,
 * why it holds, how it is enforced (each policy a link), where it stands, and
 * prev/next in bible order. The lab-rules track adds the proposal it
 * inherits and the board that argues it.
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
  const board = track && SANDBOX.some((r) => r.id === track);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={`${rule.n}. ${rule.statement}`}
        description={rule.why}
        badges={
          <>
            <Tag>{BIBLE_GROUP_LABEL[rule.group]}</Tag>
            <Tag>law</Tag>
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
            "Enforced by",
            rule.enforcedBy === "review" ? (
              "review"
            ) : (
              <span key="e" className="inline-flex flex-wrap gap-x-2">
                {rule.enforcedBy.map((f) => (
                  <Ref key={f} to={f} quiet />
                ))}
              </span>
            ),
          ],
          ...(board
            ? [
                [
                  "Under exploration on",
                  <Ref key="b" to={{ kind: "board", id: track }} quiet>
                    {track}
                  </Ref>,
                ] as [string, React.ReactNode],
              ]
            : []),
        ]}
      />
      <Callout kind="will" className="mt-6">
        A bible rule always binds. It changes only by Will&apos;s ruling; a rule
        that blocks better work is a finding for your manifest, and the better
        thing is built in the lab.
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
