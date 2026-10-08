"use client";

import { useId } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { CoverCycleProvider } from "@/components/app/dashboard/cover-cycle";
import { EventTile } from "@/components/app/dashboard/event-tile";
import { useWide } from "@/components/app/dashboard/use-wide";
import { PhotoImg } from "@/components/app/photo-img";
import type { EventListRow } from "@/lib/dashboard/events-view";
import { cn } from "@/lib/utils";

/**
 * THE RECENT ROW, COLLAPSIBLE (host-dashboard r3, Will 2026-10-03: "a recent row as collapsible (keeps last few
 * quickly accessible)"): the events she opened lately, newest first, one row of covers at a desk and a swipe strip
 * in a hand; folded, a line of their small covers, each still a press away. Never the stage's event or one in This
 * week, which already stand above it (`recentRowsOf`), and drawn from seven events, below which every event is on
 * her first screen anyway.
 *
 * Whether it is folded is her own press, kept with her choices on her account (a row she folded must not spring
 * back open every visit), and it is the one choice the Display menu does not hold.
 */

/** A cover as a small round pill's face: its photograph, or its date as a tile wears it. */
function Face({ row }: { row: EventListRow }) {
  return (
    <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
      {row.coverUrl ? (
        <PhotoImg
          src={row.coverUrl}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : row.face ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-micro font-medium text-muted-foreground uppercase">
            {row.face.month}
          </span>
          <span className="text-micro font-semibold tabular-nums">
            {row.face.day}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function RecentRow({
  rows,
  folded,
  onFold,
}: {
  rows: readonly EventListRow[];
  folded: boolean;
  onFold: (folded: boolean) => void;
}) {
  const id = useId();
  const wide = useWide();
  return (
    <section
      data-recent={rows.length}
      data-recent-open={folded ? undefined : ""}
      aria-labelledby={id}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <h2 id={id} className="text-label text-muted-foreground uppercase">
          Recent
        </h2>
        {folded && (
          <ul
            aria-label="Recent, folded"
            className="flex min-w-0 gap-1.5 overflow-hidden"
          >
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href ?? "#"}
                  title={row.name}
                  className="flex h-7 focus-halo items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs outline-none hover:bg-muted/70"
                >
                  <Face row={row} />
                  <span className="max-w-32 truncate">{row.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          aria-expanded={!folded}
          onClick={() => onFold(!folded)}
          className="ml-auto flex h-7 focus-halo items-center gap-1 rounded-full px-2.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
        >
          {folded ? "Show" : "Hide"}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-150 ease-emphasis motion-reduce:transition-none",
              !folded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>
      {!folded && (
        // The covers take turns dissolving to their next still (`cover-cycle.tsx`), apart from the list's own.
        <CoverCycleProvider>
          <ul className="-mx-3 flex snap-x snap-mandatory scroll-px-3 [scrollbar-width:none] gap-2 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0">
            {rows.map((row) => (
              <li
                key={row.id}
                className="w-[44%] shrink-0 snap-start sm:w-auto"
              >
                <EventTile row={row} size={wide ? "md" : "sm"} />
              </li>
            ))}
          </ul>
        </CoverCycleProvider>
      )}
    </section>
  );
}
