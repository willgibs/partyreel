import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { listSpecs, readDoc } from "@/app/(dev)/design/_data/docs";
import { readTrackStates } from "@/app/(dev)/design/_data/tracks";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

import { proposalStatus } from "./status";

/**
 * THE PROPOSALS (the Library x Lab round, 2026-09-15): every board's settled
 * argument under docs/specs. Split by the only distinction that changes how
 * one is read: a proposal whose board still stands is live, and the board is
 * where you answer it; a proposal whose board has gone is the argument behind
 * something already in the site. Phase 0 printed each one's status line as raw
 * markdown with its asterisks, cut at the file's hard wrap; it reads as one
 * whole clause here (status.ts).
 */
export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const tracks = readTrackStates();
  const specs = listSpecs().map((s) => {
    const board = SANDBOX.find((r) => r.id === s.slug);
    const builders = board?.board?.tracks ?? (board ? [board.id] : []);
    return {
      ...s,
      status: proposalStatus(readDoc(`docs/specs/${s.slug}.md`).body),
      board,
      live: builders.some((n) => {
        const t = tracks.get(n);
        return t && t.status !== "integrated";
      }),
    };
  });
  const standing = specs.filter((s) => s.board);
  const settled = specs.filter((s) => !s.board);

  const row = (s: (typeof specs)[number]) => (
    <li
      key={s.slug}
      className="rounded-xl border border-border bg-card px-4 py-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <LabLink
          href={`/design/lab/proposals/${s.slug}`}
          className="text-sm font-medium hover:underline"
        >
          {s.title}
        </LabLink>
        <Tag badge="proposal" />
        {s.live && <Tag>being built</Tag>}
        {s.board && (
          <LabLink
            href={`/design/lab/${s.board.id}`}
            className="text-[11px] text-muted-foreground underline underline-offset-2"
          >
            its board
          </LabLink>
        )}
      </div>
      {s.status && (
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {s.status}
        </p>
      )}
    </li>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Proposals"
        description="Every board's settled argument under docs/specs, rendered from the repo. A proposal is not law until Will rules on it; a bible rule that inherits one says so on its page."
      />
      <StatRow
        stats={[
          ["proposals", specs.length],
          ["boards still standing", standing.length],
        ]}
      />
      <Callout kind="not-law" className="mt-6">
        These documents argue; the bible binds. The asks are on the board, and
        the desk queues them.
      </Callout>

      <Section
        id="standing"
        title="Boards still standing"
        blurb="The argument behind a board that is still open. Read it before you contradict it, and answer it on the board."
      >
        <ul className="space-y-2">
          {standing.length ? (
            standing.map(row)
          ) : (
            <li className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              None: every proposal here outlived its board.
            </li>
          )}
        </ul>
      </Section>

      {settled.length > 0 && (
        <Section
          id="settled"
          title="Settled"
          blurb="The board has gone and the argument stayed. History, and the reason a shipped thing is shaped as it is."
        >
          <ul className="space-y-2">{settled.map(row)}</ul>
        </Section>
      )}
      <Pager />
    </div>
  );
}
