"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { StateDot } from "@/components/app/dashboard/marks";
import type { SortKey } from "@/lib/dashboard/display";
import type { EventListRow } from "@/lib/dashboard/events-view";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * THE TABLE (host-dashboard r3, `events=menu`'s second layout; Will 2026-09-20: "for users with more events, I'd
 * expect the table to be more popular with sorting/filtering"): a line an event, its columns the sorts (a press on a
 * head sorts by it, a second press turns it round), the rest of her Display over it. At a phone the date folds under
 * the name and the album's size keeps its column.
 *
 * ★ IT LINES UP LIKE A TABLE WITHOUT BEING ONE: a list of links, the heads buttons, no `ui/table`, since a line is
 * one link into its event and a headed grid's cells could not be. A deleted event's line is no link at all, and its
 * Restore stands at the line's end, in view at a phone too.
 */

/** A table's cover: its photograph, or its date as a tile wears it. */
function Cover({ row }: { row: EventListRow }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
        row.kind === "deleted" && "opacity-75 grayscale",
      )}
    >
      {row.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={row.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : row.face ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-micro font-medium text-muted-foreground uppercase">
            {row.face.month}
          </span>
          <span className="text-xs font-semibold tabular-nums">
            {row.face.day}
          </span>
        </span>
      ) : null}
    </span>
  );
}

function Head({
  sort,
  on,
  desc,
  onSort,
  className,
  children,
}: {
  sort: SortKey;
  on: SortKey;
  desc: boolean;
  onSort: (sort: SortKey) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(sort)}
      aria-pressed={on === sort}
      className={cn(
        "flex items-center gap-1 outline-none hover:text-foreground focus-visible:text-foreground",
        on === sort && "text-foreground",
        className,
      )}
    >
      {children}
      {on === sort &&
        (desc ? (
          <ArrowDown className="size-3" aria-hidden />
        ) : (
          <ArrowUp className="size-3" aria-hidden />
        ))}
    </button>
  );
}

export function EventsTable({
  rows,
  sort,
  desc,
  onSort,
  actions,
}: {
  rows: readonly EventListRow[];
  sort: SortKey;
  desc: boolean;
  onSort: (sort: SortKey) => void;
  /** Per-line act (the bin's Restore), keyed by kind and row id. */
  actions?: ReadonlyMap<string, ReactNode>;
}) {
  const head = { on: sort, desc, onSort };
  return (
    <div data-events-table={rows.length} className="space-y-0.5">
      <div className="flex h-8 items-center gap-3 border-b border-border px-2 text-xs text-muted-foreground">
        <span className="size-9 shrink-0" aria-hidden />
        <Head sort="name" {...head} className="min-w-0 flex-1">
          Event
        </Head>
        <Head sort="date" {...head} className="w-44 shrink-0 max-sm:hidden">
          Date
        </Head>
        <Head
          sort="photos"
          {...head}
          className="w-16 shrink-0 justify-end sm:w-28"
        >
          <span className="sm:hidden">Size</span>
          <span className="max-sm:hidden">In the album</span>
        </Head>
        <Head
          sort="waiting"
          {...head}
          className="w-32 shrink-0 justify-end max-sm:hidden"
        >
          Waiting
        </Head>
      </div>
      <ul className="divide-y divide-border/60">
        {rows.map((row) => {
          const state = row.marks?.state ?? null;
          const action = actions?.get(`${row.kind}-${row.id}`);
          const body = (
            <>
              <Cover row={row} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    row.kind === "deleted" && "text-muted-foreground",
                  )}
                >
                  {row.name}
                </span>
                {/* At a phone the Waiting column folds under the name with the date, so what waits is never lost. */}
                <span className="block truncate text-xs text-muted-foreground sm:hidden">
                  {row.kind === "guest"
                    ? row.byline
                    : row.kind === "deleted"
                      ? row.statusLabel
                      : row.dateLabel.replace("No date set", "No date")}
                  {state?.tone === "waiting" && row.kind === "hosted" && (
                    <span className="text-foreground">
                      {" · "}
                      {state.text}
                    </span>
                  )}
                </span>
              </span>
              <span className="w-44 shrink-0 truncate text-sm text-muted-foreground tabular-nums max-sm:hidden">
                {row.dateLabel.replace("No date set", "No date")}
              </span>
              <span className="w-16 shrink-0 text-right text-sm text-muted-foreground tabular-nums sm:w-28">
                {row.kind === "guest"
                  ? "Guest"
                  : row.kind === "deleted"
                    ? ""
                    : formatCount(row.items)}
              </span>
              <span className="flex w-32 shrink-0 items-center justify-end gap-1.5 text-xs max-sm:hidden">
                {row.kind === "deleted" ? (
                  <span className="text-muted-foreground">
                    {row.statusLabel}
                  </span>
                ) : (
                  state?.tone === "waiting" && (
                    <>
                      {/* The amber is the dot's, as on every mark: amber type is faint on paper. */}
                      <StateDot tone="waiting" className="size-1.5" />
                      <span className="text-foreground">{state.text}</span>
                    </>
                  )
                )}
              </span>
              {action}
            </>
          );
          const line =
            "flex h-13 items-center gap-3 rounded-lg px-2 outline-none hover:bg-muted focus-visible:bg-muted";
          return (
            <li key={`${row.kind}-${row.id}`} data-event-line={row.id}>
              {row.href ? (
                <Link href={row.href} className={line}>
                  {body}
                </Link>
              ) : (
                <div className={cn(line, "hover:bg-transparent")}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
