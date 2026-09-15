import { notFound } from "next/navigation";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { readDoc } from "@/app/(dev)/design/_data/docs";
import { readTrackStates, trackAlias } from "@/app/(dev)/design/_data/tracks";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

/**
 * ONE TRACK (the Library x Lab round, 2026-09-15). A manifest is written for
 * the Orchestrator and read by a human, and the two want opposite things: the
 * claim and the lane matter at a merge, the goal and the "look at first" line
 * matter to a reviewer. So the reviewer's two lines come first (the goal as
 * the page's own description, the look-at-first as a callout), the lane folds
 * away into a disclosure, and the manifest itself renders whole underneath.
 * Nothing is restated: every line here is the file's.
 */
export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ track: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { track } = await params;
  const state = readTrackStates().get(track);
  if (!state) notFound();
  const file = `docs/tracks/${track}.md`;
  const { body } = readDoc(file);
  const board = SANDBOX.find(
    (r) => r.id === track || r.board?.tracks?.includes(track),
  );
  const live = state.status !== "integrated";
  const lane: [string, string[]][] = [
    ["Owns", state.owns],
    ["Reads", state.reads],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={`lp/${track}`}
        description={
          state.goal ??
          "The manifest, rendered: the claim, the goal, the handoff, the record."
        }
        badges={
          <>
            <Tag badge={live ? undefined : "retired"}>{state.status}</Tag>
            {state.rounds > 0 && <Tag>{`round ${state.rounds}`}</Tag>}
            {board && <Tag>{board.title}</Tag>}
          </>
        }
        meta={[
          ["Source", <Ref key="s" to={{ kind: "source", file }} quiet />],
          ...(state.cut
            ? ([["Cut from", state.cut]] as [string, React.ReactNode][])
            : []),
          ...(state.merged
            ? ([["Merged", state.merged]] as [string, React.ReactNode][])
            : []),
          ...(board
            ? ([
                [
                  "Board",
                  <Ref key="b" to={{ kind: "board", id: board.id }} quiet>
                    {board.title}
                  </Ref>,
                ],
              ] as [string, React.ReactNode][])
            : []),
          ...(live && state.status === "handed-off"
            ? ([
                [
                  "Preview",
                  <a
                    key="p"
                    href={withDesignKey(`${trackAlias(track)}/design/lab`, key)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {trackAlias(track).replace("https://", "")}
                  </a>,
                ],
              ] as [string, React.ReactNode][])
            : []),
        ]}
      />

      {state.lookAtFirst && (
        <Callout kind="note" title="Look at first" className="mt-6">
          {state.lookAtFirst}
        </Callout>
      )}

      {(state.owns.length > 0 || state.reads.length > 0) && (
        <details className="mt-4 rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            The lane: {state.owns.length} owned, {state.reads.length} read
          </summary>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {lane.map(([label, paths]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {label}
                </p>
                <ul className="mt-1 space-y-0.5 text-[12px]">
                  {paths.map((p) => (
                    <li key={p}>
                      <Ref to={p} quiet />
                    </li>
                  ))}
                  {paths.length === 0 && (
                    <li className="text-muted-foreground">none</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-6">
        <Markdown source={body} from={file} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
