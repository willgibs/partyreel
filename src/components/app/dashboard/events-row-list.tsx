"use client";

import Link from "next/link";
import { ArrowRight, Images, ListChecks, Lock } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import type { EventListRow } from "@/lib/dashboard/events-view";
import type { PulseTile } from "@/lib/db/queries/pulse";
import { cn } from "@/lib/utils";

/**
 * THE SECOND VIEW: a row, the cover behind it, the counts in columns.
 *
 * The board's ruled `row` shape, built as production rather than imported from
 * the sandbox (round two owns that file and a lane never reaches into it). The
 * cover photograph is the row's own GROUND at 12 percent rather than a card of
 * its own, the newest few sit beside the name so the row still shows the
 * party, and what needs this event ends the row. Eight fit where three cover
 * cards do, which is the whole argument for it: Will expects the cards for a
 * host with a handful of events and this for a host with many.
 *
 * ★ IT LINES UP LIKE A TABLE WITHOUT BEING ONE. He wrote "table", and the
 * sort and the filters live above the list rather than in column headers, so
 * no `ui/table.tsx` ships here. A headed table is a real thing to want later
 * (the admin board may own one); a row that carries its own sort is the
 * smaller honest version and the one this list needs. His to overrule.
 */

const STAT = "flex items-center gap-1.5 tabular-nums";

function Row({
  row,
  tiles,
  action,
}: {
  row: EventListRow;
  tiles: PulseTile[];
  action?: React.ReactNode;
}) {
  const body = (
    <>
      {/* The cover as the row's ground: 12 percent, so the row reads as this
          party's row and the type on top keeps its contrast in both themes. */}
      {row.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={row.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-[0.12]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />

      <div className="relative flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5 truncate font-heading text-card-title">
            {row.href === null && row.kind === "saved" && (
              <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {row.name}
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{row.dateLabel}</span>
            <span className={STAT}>
              <Images className="size-3" aria-hidden />
              {row.items}
            </span>
            {row.statusLabel && <span>{row.statusLabel}</span>}
            {row.byline && <span className="truncate">{row.byline}</span>}
          </span>
        </div>

        {/* The party, still visible: the newest few beside the name. Static —
            this is a management list, not an arrivals strip. */}
        {tiles.length > 0 && (
          <div className="flex shrink-0 gap-1.5">
            {tiles.map((tile) => (
              <span
                key={tile.id}
                data-media-tile
                data-static
                className="relative size-11 overflow-hidden rounded-[var(--radius-tile)]"
              >
                <MediaTile
                  item={{ type: tile.type, url: tile.url, previewUrl: null }}
                  playBadge="none"
                />
              </span>
            ))}
          </div>
        )}

        {/* What needs this event, in the column you can read down. */}
        <div className="flex shrink-0 items-center justify-end sm:w-48">
          {row.pending > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
              <ListChecks className="size-3.5" aria-hidden />
              {row.pending} to review
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {row.needs ?? "Nothing waiting"}
              {row.href && (
                <ArrowRight
                  className="size-3.5 opacity-0 transition-[opacity,translate] duration-150 ease-emphasis group-hover/row:translate-x-0.5 group-hover/row:opacity-70 motion-reduce:transition-none"
                  aria-hidden
                />
              )}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <li className="relative">
      {row.href ? (
        <Link
          href={row.href}
          // ★ NO `data-lit` HERE, THOUGH THE BOARD'S DRAFT HAD ONE. The bright
          // edge is closed to a photo, a player and the QR card (Will's light
          // board ruling): "a card, a menu and a button already have their step
          // and their ring, and an edge on those is a third outline". This row
          // is a card. The lab may draw the hook on anything — it is fenced out
          // of that contract on purpose — and copying it across was the mistake
          // the contract caught.
          className={cn(
            "group/row relative block overflow-hidden rounded-xl border border-border bg-card outline-none transition-transform duration-150 ease-emphasis active:scale-[0.995] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:active:scale-100",
          )}
        >
          {body}
        </Link>
      ) : (
        <div
          className={cn(
            "relative block cursor-default overflow-hidden rounded-xl border border-border bg-card",
            row.kind === "deleted" && "opacity-75 grayscale",
          )}
        >
          {body}
        </div>
      )}
      {/* Unsave / Restore, a sibling of the Link so tapping it never navigates
          (the same construction EventCard's QR chip uses). */}
      {action && (
        <div className="absolute top-2.5 right-2.5 z-10">{action}</div>
      )}
    </li>
  );
}

export function EventsRowList({
  rows,
  newestByEvent,
  actions,
}: {
  rows: EventListRow[];
  newestByEvent: Map<string, PulseTile[]>;
  /** Per-row action element (unsave / restore), keyed by row id. */
  actions?: Map<string, React.ReactNode>;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <Row
          key={`${row.kind}-${row.id}`}
          row={row}
          tiles={newestByEvent.get(row.id) ?? []}
          action={actions?.get(`${row.kind}-${row.id}`)}
        />
      ))}
    </ul>
  );
}
