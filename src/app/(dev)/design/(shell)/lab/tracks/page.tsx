import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import {
  type TrackState,
  trackAlias,
  trackList,
} from "@/app/(dev)/design/_data/tracks";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

/**
 * THE TRACKS (the Library x Lab round, 2026-09-15): every lp/<track> branch
 * with a manifest, rendered from the manifests. A reader wants three things
 * here, in this order: what is running now, what each one is for, and where to
 * look. So a live track leads with its Goal sentence and its handoff's "look
 * at first" line, both lifted from the file (_data/tracks.ts) rather than
 * written again; the integrated ones collapse to a list, because their work is
 * already in the lab and their manifest is history.
 */
export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const tracks = trackList();
  const open = tracks.filter((t) => t.status === "open");
  const handedOff = tracks.filter((t) => t.status === "handed-off");
  const done = tracks.filter((t) => t.status === "integrated");

  const boardOf = (name: string) =>
    SANDBOX.find((r) => r.id === name || r.board?.tracks?.includes(name));

  const card = (t: TrackState) => {
    const board = boardOf(t.track);
    return (
      <li
        key={t.track}
        className="rounded-xl border border-border bg-card px-4 py-3"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <LabLink
            href={`/design/lab/tracks/${t.track}`}
            className="text-sm font-medium hover:underline"
          >
            {t.track}
          </LabLink>
          <Tag>{t.status}</Tag>
          {t.rounds > 0 && <Tag>{`round ${t.rounds}`}</Tag>}
          {board && (
            <LabLink
              href={`/design/lab/${board.id}`}
              className="text-[11px] text-muted-foreground underline underline-offset-2"
            >
              {board.title}
            </LabLink>
          )}
          {t.status === "handed-off" && (
            <a
              href={withDesignKey(`${trackAlias(t.track)}/design/lab`, key)}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-muted-foreground underline underline-offset-2"
            >
              its preview
            </a>
          )}
        </div>
        {t.goal && (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {t.goal}
          </p>
        )}
        {t.lookAtFirst && (
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed">
            <span className="text-muted-foreground">Look at first: </span>
            {t.lookAtFirst}
          </p>
        )}
      </li>
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Tracks"
        description="Every branch with a manifest under docs/tracks: what it claims, what it is for, what it handed off. Rendered from the manifests, so nothing here is a second copy of one."
      />
      <StatRow
        stats={[
          ["open", open.length],
          ["handed off", handedOff.length],
          ["integrated", done.length],
        ]}
      />

      <Section
        id="open"
        title="Open"
        blurb="Building now, on their own branches. Their work lives on their own previews until it is integrated."
      >
        <ul className="space-y-2">
          {open.length ? (
            open.map(card)
          ) : (
            <li className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              None open.
            </li>
          )}
        </ul>
      </Section>

      {handedOff.length > 0 && (
        <Section
          id="handed-off"
          title="Handed off"
          blurb="Finished, waiting for the next integration window. Each one's preview is built."
        >
          <ul className="space-y-2">{handedOff.map(card)}</ul>
        </Section>
      )}

      <Section
        id="integrated"
        title="Integrated"
        blurb="Merged into launch-prep: their work is in the lab you are reading, and the manifest is the record of how it got here."
      >
        <ul className="flex flex-wrap gap-1.5">
          {done.map((t) => (
            <li key={t.track}>
              <LabLink
                href={`/design/lab/tracks/${t.track}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] transition-colors duration-150 hover:bg-muted/40"
              >
                {t.track}
                {t.rounds > 1 && (
                  <span className="text-muted-foreground">{`${t.rounds} rounds`}</span>
                )}
              </LabLink>
            </li>
          ))}
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
