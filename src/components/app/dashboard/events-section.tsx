"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ChevronDown,
  LayoutGrid,
  Rows3,
  Search,
} from "lucide-react";

import { CoverCycleProvider } from "@/components/app/dashboard/cover-cycle";
import {
  EventTile,
  type TileSize,
} from "@/components/app/dashboard/event-tile";
import { EventsRowList } from "@/components/app/dashboard/events-row-list";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setEventsViewAction } from "@/app/(app)/dashboard/actions";
import { trackAttrs } from "@/lib/analytics/events";
import {
  EVENTS_FILTER_OPTIONS,
  EVENTS_SEARCH_FROM,
  EVENTS_SORT_OPTIONS,
  type EventListRow,
  type EventSeason,
  type EventsFilter,
  type EventsSort,
  type EventsView,
  filterEventRows,
  lensCounts,
  searchEventRows,
  sortEventRows,
} from "@/lib/dashboard/events-view";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * YOUR EVENTS, GROUPED BY WHEN (host-dashboard r1, `events=seasons`: "the freshest drawn largest"), in
 * either of the two views he asked for (`density=cover`, Will 2026-09-20: "Let's do both... For fewer
 * events, I'd expect the cover card to be more popular, but for users with more events, I'd expect the
 * table to be more popular with sorting/filtering").
 *
 * Under the stage this is everything else: the stage's own event is not drawn a second time right under
 * itself. The gallery groups by when (`seasonsOf`, decided on the server): coming up, just past, earlier
 * this year, then each year folded into one line whose thumbnails open their events and whose Show
 * opens the year in place. The rows view is the sortable list, one toggle away, the choice remembered.
 *
 * ★ HIS NOTE ON THE PICK IS THE DIRECTION FOR WHAT COMES NEXT: "a host may have custom preferences on
 * (such as filter, sort, gallery vs table/list, etc)... the host isn't always having to scroll to the
 * very bottom if they're trying to bounce between old events back-to-back". So everything a host can
 * already choose stays one press away (the lens, the view, the order) and a planner's search arrives
 * past eight events; his r2 explores the customizable collection whole.
 *
 * ★ A CLIENT COMPONENT, BECAUSE THE LENS, THE SEARCH AND THE ORDER ARE INSTANT: a management tool's
 * filter that costs a round trip is a filter the host stops using. Everything arrives resolved and plain
 * (covers as short-lived presigned urls, never keys; groups and marks decided). The VIEW rides a cookie a
 * Server Action sets, because it has to be known before the first byte or the list re-lays itself out
 * on every cold load.
 */

/** A group's grid, by how large its tiles draw: fluid columns, so a wide window holds more, never bigger. */
const GRID: Record<"large" | "medium" | "small" | "few", string> = {
  large: "grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]",
  medium:
    "grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))]",
  small:
    "grid-cols-[repeat(auto-fill,minmax(min(calc(33.333%_-_8px),150px),1fr))]",
  // A group of one or two draws them a third of a desk wide rather than a fifth, so a host with a
  // couple of events meets covers, not thumbnails in an empty row.
  few: "grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))]",
};

function TileGrid({
  rows,
  size,
  few,
  actions,
}: {
  rows: readonly EventListRow[];
  size: "large" | "medium" | "small";
  few?: boolean;
  actions?: ReadonlyMap<string, React.ReactNode>;
}) {
  const grid = few && rows.length <= 2 ? "few" : size;
  const tile: TileSize =
    grid === "few" || grid === "large" ? "lg" : grid === "medium" ? "md" : "sm";
  return (
    <ul className={cn("grid gap-3", GRID[grid])}>
      {rows.map((row) => (
        <li key={`${row.kind}-${row.id}`}>
          <EventTile
            row={row}
            size={tile}
            action={actions?.get(`${row.kind}-${row.id}`)}
          />
        </li>
      ))}
    </ul>
  );
}

/** One thumbnail on a folded year's line: its cover, or its month and day. */
function Thumb({ row }: { row: EventListRow }) {
  const face = (
    <>
      {row.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={row.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : row.face ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-micro text-muted-foreground uppercase">
            {row.face.month}
          </span>
          <span className="mt-0.5 text-caption font-medium tabular-nums">
            {row.face.day}
          </span>
        </span>
      ) : null}
    </>
  );
  const box =
    "relative block size-11 overflow-hidden rounded-[var(--radius-tile)] bg-muted";
  return row.href ? (
    <Link
      href={row.href}
      aria-label={row.name}
      title={row.name}
      className={cn(
        box,
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {face}
    </Link>
  ) : (
    <span aria-label={row.name} title={row.name} className={box}>
      {face}
    </span>
  );
}

/**
 * A YEAR, FOLDED INTO ONE LINE: its name and count, a row of its covers (each opens its event, so an
 * old party is one press from the top of the page), and Show, which opens the year in place.
 */
function FoldedYear({
  season,
  rows,
}: {
  season: EventSeason;
  rows: readonly EventListRow[];
}) {
  const [open, setOpen] = useState(false);
  const id = `season-${season.id}`;
  return (
    <section
      data-season={season.id}
      data-folded={open ? undefined : rows.length}
      aria-label={season.label}
      className="space-y-3 border-t border-border pt-4"
    >
      <div className="flex items-center gap-4">
        <h3 className="w-12 shrink-0 font-heading text-card-title tabular-nums sm:w-16">
          {season.label}
        </h3>
        <ul
          aria-label={`${season.label}, its covers`}
          className={cn(
            // Whole thumbnails only: the ones that would wrap are cut with the second line.
            "flex h-11 min-w-0 flex-1 flex-wrap gap-1.5 overflow-hidden",
            open && "invisible",
          )}
        >
          {rows.slice(0, 24).map((row) => (
            <li key={row.id}>
              <Thumb row={row} />
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-full"
        >
          {open ? "Fold" : `Show ${formatCount(rows.length)}`}
          <ChevronDown
            className={cn(
              "transition-transform duration-150 ease-emphasis motion-reduce:transition-none",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </div>
      <div id={id} hidden={!open}>
        {open && <TileGrid rows={rows} size="small" />}
      </div>
    </section>
  );
}

function Group({
  season,
  rows,
}: {
  season: EventSeason;
  rows: readonly EventListRow[];
}) {
  if (season.size === "folded")
    return <FoldedYear season={season} rows={rows} />;
  return (
    <section
      data-season={season.id}
      aria-label={season.label}
      className="space-y-3"
    >
      <h3 className="flex items-baseline gap-2">
        <span className="font-heading text-card-title">{season.label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCount(rows.length)}
        </span>
      </h3>
      <TileGrid rows={rows} size={season.size} few />
    </section>
  );
}

/** The lens as one row of counts: every lens and its number at once, a lens with nothing left out. */
function LensRow({
  counts,
  filter,
  onChange,
}: {
  counts: Record<EventsFilter, number>;
  filter: EventsFilter;
  onChange: (next: EventsFilter) => void;
}) {
  const lenses = EVENTS_FILTER_OPTIONS.filter(
    (o) => o.value === "all" || o.value === filter || counts[o.value] > 0,
  );
  return (
    <ToggleGroup
      type="single"
      value={filter}
      // Radix answers "" when the pressed lens is pressed again; a lens always shows something.
      onValueChange={(v) => v && onChange(v as EventsFilter)}
      aria-label="Show"
      className="max-w-full [scrollbar-width:none] overflow-x-auto rounded-full bg-muted p-0.5"
    >
      {lenses.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          aria-label={`${o.label}, ${formatCount(counts[o.value])}`}
          className="h-7 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:bg-transparent data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-lift"
        >
          {o.label}
          <span className="font-normal text-muted-foreground tabular-nums">
            {formatCount(counts[o.value])}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function EventsSection({
  rows,
  seasons,
  initialView,
  title,
}: {
  /** Hosted (the stage's own left out), guest and deleted together; the lens decides which show. */
  rows: EventListRow[];
  /** The groups by when, in order, each its rows' ids in its own order (the server's `seasonsOf`). */
  seasons: EventSeason[];
  /** Read from the cookie on the server, so the first paint is already right. */
  initialView: EventsView;
  /** "Everything else" under a stage, "Your events" without one. */
  title: string;
}) {
  const [view, setView] = useState<EventsView>(initialView);
  const [sort, setSort] = useState<EventsSort>("newest");
  const [filter, setFilter] = useState<EventsFilter>("all");
  const [query, setQuery] = useState("");

  if (rows.length === 0) return null;

  const counts = lensCounts(rows);
  const shown = searchEventRows(filterEventRows(rows, filter), query);
  const searching = query.trim().length > 0;
  const searchable = counts.all >= EVENTS_SEARCH_FROM;

  function chooseView(next: string) {
    // Radix answers "" when the pressed item is pressed again; a two-way switch has no "neither".
    if (next !== "cards" && next !== "rows") return;
    setView(next);
    // Fire and forget: the view has switched, and the cookie only paints the NEXT cold load this way.
    void setEventsViewAction(next);
  }

  // The bin's Restore is the list's one per-row act. A Guest tile has none: it stays while the account
  // holds a live upload there and leaves with the last one.
  const actions = new Map<string, React.ReactNode>();
  for (const row of shown) {
    if (row.kind === "deleted")
      actions.set(`deleted-${row.id}`, <RestoreEventButton eventId={row.id} />);
  }

  // The gallery by when: each group's rows in its own order, through the lens and the search.
  const byKey = new Map(shown.map((r) => [`${r.kind}-${r.id}`, r]));
  const groups = seasons
    .map((season) => ({
      season,
      rows: season.ids
        .map((id) =>
          byKey.get(`${season.id === "guest" ? "guest" : "hosted"}-${id}`),
        )
        .filter((r): r is EventListRow => Boolean(r)),
    }))
    .filter((g) => g.rows.length > 0);

  const empty =
    filter === "deleted"
      ? "Nothing deleted. A deleted event stays here for 30 days, then clears for good."
      : searching
        ? `No event's name holds “${query.trim()}”.`
        : filter === "guest"
          ? "Add a photo to someone else's album and it shows up here."
          : "Nothing else yet.";

  return (
    <section aria-label={title} data-events-view={view} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="font-heading text-subsection">{title}</h2>
          <LensRow counts={counts} filter={filter} onChange={setFilter} />
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5",
            // The search takes a phone's whole row; without it the toggle rides beside the lens.
            searchable ? "w-full sm:w-auto" : "ml-auto",
          )}
        >
          {searchable && (
            <label className="relative flex min-w-0 flex-1 items-center sm:w-64 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">Search your events</span>
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${formatCount(counts.all)} events`}
                className="h-8 rounded-full pl-8 text-xs md:text-xs"
              />
            </label>
          )}
          {/* The order rides with the rows, where he expects it ("with sorting/filtering"); the gallery
              keeps its one order, by when. */}
          {view === "rows" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ArrowDownWideNarrow />
                  {EVENTS_SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => setSort(v as EventsSort)}
                >
                  {EVENTS_SORT_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={chooseView}
            variant="outline"
            size="sm"
            aria-label="How your events are shown"
            className="ml-auto sm:ml-0"
          >
            <ToggleGroupItem
              value="cards"
              aria-label="By when"
              {...trackAttrs("cta_click", {
                cta: "events-view-cards",
                location: "dashboard",
              })}
            >
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="rows"
              aria-label="Rows"
              {...trackAttrs("cta_click", {
                cta: "events-view-rows",
                location: "dashboard",
              })}
            >
              <Rows3 />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : view === "rows" ? (
        <EventsRowList rows={sortEventRows(shown, sort)} actions={actions} />
      ) : (
        // The hosted tiles take turns dissolving to their next still, one per beat, in reading order
        // (`cover-cycle.tsx`, his `pulse` note).
        <CoverCycleProvider>
          {searching || filter === "deleted" ? (
            <TileGrid rows={shown} size="medium" few actions={actions} />
          ) : (
            <div className="space-y-7">
              {groups.map((g) => (
                <Group key={g.season.id} season={g.season} rows={g.rows} />
              ))}
            </div>
          )}
        </CoverCycleProvider>
      )}
    </section>
  );
}
