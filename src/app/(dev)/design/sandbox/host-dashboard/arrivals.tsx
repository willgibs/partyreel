"use client";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import type { DashEvent, Host } from "./fixtures";
import { phaseOf } from "./model";
import { Dot, Eyebrow, Still, useWide } from "./ui";

/**
 * WHAT TAKES JUST ARRIVED'S PLACE, OFF THE STAGE: the party that is live, as
 * its photographs land (on a page with no stage to hold them), and what is
 * new since the host last looked, across every event. These tiles keep the
 * arrival fade (no `data-static`): they are the page's only tiles that
 * literally just arrived, as Just arrived's were.
 */

/** The live party's newest, in one row: only while a party is on its day. */
export function LiveStrip({ host }: { host: Host }) {
  const wide = useWide();
  const live = host.events.find(
    (e) =>
      phaseOf(e.date, host.today) === "live" &&
      e.photos.length > 0 &&
      e.facts.approved > 0,
  );
  if (!live) return null;
  const tiles = live.photos.slice(0, wide ? 12 : 8);
  return (
    <section
      data-hd-live-strip={tiles.length}
      aria-label="Live now"
      className="space-y-2.5"
    >
      <Eyebrow>
        <Dot tone="live" />
        {`Live · ${live.name}`}
        <span className="tracking-normal normal-case">{`${formatCount(live.facts.approved)} photos`}</span>
      </Eyebrow>
      <ul
        className={cn(
          "grid gap-[var(--gap-gallery)]",
          wide ? "grid-cols-12" : "grid-cols-4",
        )}
      >
        {tiles.map((p, i) => (
          <li
            key={p.id}
            data-media-tile
            style={{ "--tile-i": i } as React.CSSProperties}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
          >
            <Still photo={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * SINCE YOU LAST LOOKED: each event with something new since the last visit,
 * newest first, its count and its newest few. Nothing new, nothing drawn.
 *
 * ★ IT NEEDS ONE FACT THE APP DOES NOT KEEP: when the dashboard was last
 * opened (a column on the profile, or the browser's own note). The board
 * names it in the option's cost.
 */
export function SinceStrip({
  host,
  omit = null,
}: {
  host: Host;
  /** The event a stage already shows, whose arrivals the stage holds. */
  omit?: string | null;
}) {
  const wide = useWide();
  const fresh = host.events
    .filter((e) => e.id !== omit && e.facts.fresh > 0 && e.photos.length > 0)
    .sort((a, b) => b.facts.fresh - a.facts.fresh);
  if (fresh.length === 0) return null;
  const total = fresh.reduce((n, e) => n + e.facts.fresh, 0);
  const groups: { event: DashEvent; take: number }[] = fresh
    .slice(0, wide ? 4 : 3)
    .map((e) => ({
      event: e,
      take: Math.min(e.facts.fresh, e.photos.length, wide ? 4 : 4),
    }));
  const where =
    omit === null
      ? ""
      : ` at ${fresh.length === 1 ? "one other party" : `${formatCount(fresh.length)} other parties`}`;
  return (
    <section
      data-hd-since={total}
      aria-label="Since you last looked"
      className="space-y-2.5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>{`Since ${host.lastLooked}`}</Eyebrow>
        <p className="text-xs text-muted-foreground">{`${formatCount(total)} new${where}`}</p>
      </div>
      <ul className={cn("flex", wide ? "flex-row gap-8" : "flex-col gap-3")}>
        {groups.map(({ event, take }) => (
          <li key={event.id} className="min-w-0 space-y-1.5">
            <p className="flex items-baseline gap-2 truncate text-xs">
              <span className="truncate font-medium">{event.name}</span>
              <span className="text-muted-foreground tabular-nums">{`+${formatCount(event.facts.fresh)}`}</span>
            </p>
            <ul className="flex gap-[var(--gap-gallery)]">
              {event.photos.slice(0, take).map((p, i) => (
                <li
                  key={p.id}
                  data-media-tile
                  style={{ "--tile-i": i } as React.CSSProperties}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-[var(--radius-tile)]",
                    wide ? "size-[72px]" : "size-[76px]",
                  )}
                >
                  <Still photo={p} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
