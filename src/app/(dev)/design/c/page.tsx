import Link from "next/link";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { ModeShell } from "../mode-shell";
import { SANDBOX, SURFACE_LABEL } from "../touchpoints";
import { readTrackStates, trackAlias } from "./tracks";

// THE DESK (the review wave, 2026-09-14): one page for Will's parallel reviews.
// Every standing board with its question, the track building it (from its
// manifest in docs/tracks/), and where to look: the track's own preview alias
// while it is open or handed off, the integration alias once it is in. The
// durable record is docs/tracks/orchestrator.md (In flight, Waiting on Will);
// this page renders the same files and adds nothing of its own.
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);
  const tracks = readTrackStates();

  const rows = SANDBOX.map((r) => {
    const track = tracks.get(r.id);
    const live = track && track.status !== "integrated";
    return {
      ruling: r,
      track,
      // The board on this deployment (the launch-prep alias carries the
      // integrated version; a stub until the track lands).
      here: link(`/design/c/${r.id}`),
      // The track's own preview, where the work is while it is open.
      there: live ? link(`${trackAlias(r.id)}/design/c/${r.id}`) : null,
    };
  });

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-20">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Sandbox · the desk
        </p>
        <h1
          data-dir-display
          className="mt-1 text-3xl tracking-tight text-balance"
        >
          Every open board
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each board asks one question and ends in the choices you make. A board
          still being built lives on its track&apos;s own preview; once
          integrated it lives here. The record of what waits on you is
          docs/tracks/orchestrator.md; the assets you have been asked for are in
          docs/ASSETS.md.
        </p>

        <ol className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map(({ ruling, track, here, there }) => (
            <li key={ruling.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{ruling.title}</p>
                <span className="text-[11px] text-muted-foreground">
                  {SURFACE_LABEL[ruling.surface]}
                </span>
                <span className="rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                  {track
                    ? `track ${track.track} · ${track.status}`
                    : "standing"}
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {ruling.board?.note}.
              </p>
              <p className="mt-1.5 flex flex-wrap gap-x-4 text-[11px]">
                {there && (
                  <a
                    href={there}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    on its preview
                  </a>
                )}
                <Link href={here} className="underline underline-offset-2">
                  {there ? "here (the stub until it lands)" : "open the board"}
                </Link>
                <span className="text-muted-foreground">
                  the record: docs/decisions/design-record.md#{ruling.id}
                </span>
              </p>
            </li>
          ))}
        </ol>
      </main>
    </ModeShell>
  );
}
