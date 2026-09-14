import Link from "next/link";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import { ModeShell } from "../mode-shell";
import { SANDBOX, SURFACE_LABEL } from "../touchpoints";
import { readTrackStates, trackAlias } from "./tracks";

// THE DESK (the review wave, 2026-09-14): one page for Will's parallel reviews.
// Every standing board with its question, the track (or tracks) building it
// (from the manifests in docs/tracks/), and where to look: a track's own
// preview alias while it is open or handed off, the integration alias once it
// is in. The durable record is docs/tracks/orchestrator.md (In flight, Waiting
// on Will); this page renders the same files and adds nothing of its own.
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);
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
        // The track's own preview, where the work is while it is open.
        there: live ? link(`${trackAlias(name)}/design/c/${r.id}`) : null,
      };
    });
    return {
      ruling: r,
      built,
      anyLive: built.some((b) => b.there !== null),
      // The board on this deployment (the launch-prep alias carries the
      // integrated version; a stub until the track lands).
      here: link(`/design/c/${r.id}`),
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
          {rows.map(({ ruling, built, anyLive, here }) => (
            <li key={ruling.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{ruling.title}</p>
                <span className="text-[11px] text-muted-foreground">
                  {SURFACE_LABEL[ruling.surface]}
                </span>
                {built.map((b) => (
                  <span
                    key={b.name}
                    className="rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground"
                  >
                    {b.track
                      ? `track ${b.name} · ${b.track.status}`
                      : "standing"}
                  </span>
                ))}
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {ruling.board?.note}.
              </p>
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
                <Link href={here} className="underline underline-offset-2">
                  {anyLive
                    ? "here (the stub until it lands)"
                    : "open the board"}
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
