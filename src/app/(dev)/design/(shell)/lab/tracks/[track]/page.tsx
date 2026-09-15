import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { readDoc } from "@/app/(dev)/design/_data/docs";
import { readTrackStates, trackAlias } from "@/app/(dev)/design/_data/tracks";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

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
  const { body, data } = readDoc(file);
  const owns = Array.isArray(data.owns) ? (data.owns as string[]) : [];
  const reads = Array.isArray(data.reads) ? (data.reads as string[]) : [];
  const board = SANDBOX.find(
    (r) => r.id === track || r.board?.tracks?.includes(track),
  );
  const live = state.status !== "integrated";
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={`lp/${track}`}
        description="The manifest, rendered: the claim, the goal, the handoff, the record."
        badges={
          <>
            <Tag badge={live ? undefined : "retired"}>{state.status}</Tag>
            {state.rounds > 0 && <Tag>{`round ${state.rounds}`}</Tag>}
          </>
        }
        meta={[
          ["Source", <Ref key="s" to={{ kind: "source", file }} quiet />],
          ...(board
            ? [
                [
                  "Board",
                  <Ref key="b" to={{ kind: "board", id: board.id }} quiet>
                    {board.title}
                  </Ref>,
                ] as [string, React.ReactNode],
              ]
            : []),
          ...(live && state.preview
            ? [
                [
                  "Preview",
                  <a
                    key="p"
                    href={trackAlias(track)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {trackAlias(track).replace("https://", "")}
                  </a>,
                ] as [string, React.ReactNode],
              ]
            : []),
        ]}
      />
      {(owns.length > 0 || reads.length > 0) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Owns
            </p>
            <ul className="mt-1 space-y-0.5 text-[12px]">
              {owns.map((p) => (
                <li key={p}>
                  <Ref to={p} quiet />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Reads
            </p>
            <ul className="mt-1 space-y-0.5 text-[12px]">
              {reads.map((p) => (
                <li key={p}>
                  <Ref to={p} quiet />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="mt-6">
        <Markdown source={body} from={file} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
