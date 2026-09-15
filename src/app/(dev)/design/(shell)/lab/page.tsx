import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { readTrackStates, trackAlias } from "@/app/(dev)/design/_data/tracks";
import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { SANDBOX, SURFACE_LABEL } from "@/app/(dev)/design/touchpoints";

/**
 * THE DESK (the review wave, 2026-09-14; on the shell since the Library x Lab
 * round): one page for Will's parallel reviews. Every standing board with
 * its question, the track (or tracks) building it (from the manifests in
 * docs/tracks/), and where to look: a track's own preview alias while it is
 * open or handed off, this deployment once it is in. The lab-desk track turns
 * it into the review session (every open ask in order, one message at the
 * end); this version renders the same files and adds nothing of its own.
 */
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const tracks = readTrackStates();

  const rows = SANDBOX.map((r) => {
    // A board is usually built by the track of the same name; a board built by
    // several tracks at once (the hero's rounds) names them on the registry.
    const names = r.board?.tracks ?? [r.id];
    const built = names.map((name) => {
      const track = tracks.get(name);
      const live = track && track.status !== "integrated";
      return {
        name,
        track,
        // The track's own preview, where the work is while it is open. An
        // external URL, keyed here because LabLink keys internal links only.
        there: live
          ? withDesignKey(`${trackAlias(name)}/design/lab/${r.id}`, key)
          : null,
      };
    });
    return {
      ruling: r,
      spec: boardSpec(r.id),
      built,
      anyLive: built.some((b) => b.there !== null),
    };
  });

  const live = [...tracks.values()].filter((t) => t.status !== "integrated");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The desk"
        description="Every standing board, what it asks, and where the work is. A board still being built lives on its track's own preview; once integrated it lives here. What waits on you is the asks the boards carry; the assets you have been asked for are in docs/ASSETS.md."
      />
      <StatRow
        stats={[
          ["standing boards", rows.length],
          ["boards with a spec", rows.filter((r) => r.spec).length],
          ["live tracks", live.length],
        ]}
      />

      <Section
        id="boards"
        title="Every open board"
        blurb="In registry order; the board page's Prev and Next follow the same order."
      >
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map(({ ruling, spec, built, anyLive }) => (
            <li key={ruling.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <LabLink
                  href={`/design/lab/${ruling.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {ruling.title}
                </LabLink>
                <Tag>{SURFACE_LABEL[ruling.surface]}</Tag>
                {built.map((b) => (
                  <Tag key={b.name}>
                    {b.track ? `${b.name} · ${b.track.status}` : "standing"}
                  </Tag>
                ))}
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {spec ? spec.question : `${ruling.board?.note}.`}
              </p>
              {spec && spec.asks.length > 0 && (
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Asks: </span>
                  {spec.asks.map((a) => a.question).join(" · ")}
                </p>
              )}
              <p className="mt-1.5 flex flex-wrap gap-x-4 text-[11px]">
                {built.map(
                  (b) =>
                    b.there && (
                      <a
                        key={b.name}
                        href={b.there}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {built.length > 1
                          ? `${b.name} on its preview`
                          : "on its preview"}
                      </a>
                    ),
                )}
                <LabLink
                  href={`/design/lab/${ruling.id}`}
                  className="underline underline-offset-2"
                >
                  {anyLive
                    ? "here (the stub until it lands)"
                    : "open the board"}
                </LabLink>
                <Ref to={{ kind: "record", id: ruling.id }} quiet>
                  the record
                </Ref>
                {built.map((b) => (
                  <Ref key={b.name} to={{ kind: "track", name: b.name }} quiet>
                    {built.length > 1 ? `manifest: ${b.name}` : "the manifest"}
                  </Ref>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
