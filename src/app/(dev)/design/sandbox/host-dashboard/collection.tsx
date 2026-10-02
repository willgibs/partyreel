"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  LayoutGrid,
  Rows3,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { CoverCycleProvider } from "@/components/app/dashboard/cover-cycle";
import {
  EventTile,
  type TileSize,
} from "@/components/app/dashboard/event-tile";
import { EventsRowList } from "@/components/app/dashboard/events-row-list";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { StateDot } from "@/components/app/dashboard/marks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EVENTS_FILTER_OPTIONS,
  EVENTS_SEARCH_FROM,
  type EventListRow,
  type EventsFilter,
  type EventsView,
  filterEventRows,
  lensCounts,
  searchEventRows,
} from "@/lib/dashboard/events-view";
import type { HomeView } from "@/lib/dashboard/home-view";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  type Display,
  displayGroups,
  type Grouping,
  indexOf,
  type Laid,
  type ListSort,
  NEW_PIECES_FROM,
  type Order,
  recentRows,
  type Show,
  sortList,
} from "./model";

/**
 * YOUR EVENTS, FOUR WAYS (`events`), each drawn from production's own pieces:
 * the rows and groups `buildHomeView` composes, the tile (`EventTile`), the rows
 * view (`EventsRowList`), the lens and the search over production's own filters
 * (`events-view.ts`).
 *
 *  - `built`: production's `EventsSection` itself, untouched.
 *  - `recent`: the events she opened lately in one row over production's
 *    section, which stays mounted while she is away, so a year she opened is
 *    still open when she comes back.
 *  - `display`: one Display menu over the same rows: covers or a list, grouped
 *    by when (every year open), by year or not at all, in her order.
 *  - `index`: what is coming and just past as production's covers, and one list
 *    for the rest, its years as tabs and its columns as the sort.
 *
 * ★ THE PIECES SHOW FROM NINE EVENTS, WITH THE SEARCH (`EVENTS_SEARCH_FROM`):
 * under that a host's every event fits a screen or two, and a Recent row or a
 * menu would only repeat it.
 */

/** A group's grid by how large its tiles draw: production's own fluid columns (`events-section.tsx`). */
const GRID: Record<"large" | "medium" | "small" | "few", string> = {
  large: "grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]",
  medium:
    "grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))]",
  small:
    "grid-cols-[repeat(auto-fill,minmax(min(calc(33.333%_-_8px),150px),1fr))]",
  few: "grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))]",
};

function Tiles({
  rows,
  size,
}: {
  rows: readonly EventListRow[];
  size: Laid["size"];
}) {
  const grid = rows.length <= 2 ? "few" : size;
  const tile: TileSize =
    grid === "few" || grid === "large" ? "lg" : grid === "medium" ? "md" : "sm";
  return (
    <ul className={cn("grid gap-3", GRID[grid])}>
      {rows.map((row) => (
        <li key={`${row.kind}-${row.id}`}>
          <EventTile row={row} size={tile} />
        </li>
      ))}
    </ul>
  );
}

/** A group's head: its name and its count, as production's groups say them. */
function GroupHead({ label, count }: { label: string; count: number }) {
  return (
    <h3 className="flex items-baseline gap-2">
      <span className="font-heading text-card-title">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatCount(count)}
      </span>
    </h3>
  );
}

/** The lens as one row of counts, as production draws it (`events-section.tsx`). */
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

function SearchField({
  query,
  onQuery,
  count,
}: {
  query: string;
  onQuery: (q: string) => void;
  count: number;
}) {
  return (
    <label className="relative flex min-w-0 flex-1 items-center sm:w-64 sm:flex-none">
      <Search
        className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only">Search your events</span>
      <Input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={`Search ${formatCount(count)} events`}
        className="h-8 rounded-full pl-8 text-xs md:text-xs"
      />
    </label>
  );
}

/** The head every redrawn collection shares: its title and lens, the search and the option's own control. */
function Head({
  title,
  counts,
  filter,
  onFilter,
  query,
  onQuery,
  control,
}: {
  title: string;
  counts: Record<EventsFilter, number>;
  filter: EventsFilter;
  onFilter: (f: EventsFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  control?: React.ReactNode;
}) {
  const searchable = counts.all >= EVENTS_SEARCH_FROM;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
        <h2 className="font-heading text-subsection">{title}</h2>
        <LensRow counts={counts} filter={filter} onChange={onFilter} />
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5",
          searchable ? "w-full sm:w-auto" : "ml-auto",
        )}
      >
        {searchable && (
          <SearchField query={query} onQuery={onQuery} count={counts.all} />
        )}
        {control}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

/* ── built, and Recent over it ────────────────────────────────────────── */

/**
 * THE RECENT ROW: the events she opened lately, newest first, one row of
 * covers at a desk and one swipe in a hand. It is not a strip of what is new
 * (Just arrived went for being that): every cover in it is an event she chose.
 */
function RecentRow({
  rows,
  wide,
}: {
  rows: readonly EventListRow[];
  wide: boolean;
}) {
  return (
    <section
      data-hd-recent={rows.length}
      aria-labelledby="hd-recent"
      className="space-y-3"
    >
      <h2 id="hd-recent" className="text-label text-muted-foreground uppercase">
        Recent
      </h2>
      <CoverCycleProvider>
        {wide ? (
          <ul className="grid grid-cols-6 gap-3">
            {rows.map((row) => (
              <li key={`${row.kind}-${row.id}`}>
                <EventTile row={row} size="md" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="-mx-3 flex snap-x snap-mandatory scroll-px-3 [scrollbar-width:none] gap-2 overflow-x-auto px-3">
            {rows.map((row) => (
              <li
                key={`${row.kind}-${row.id}`}
                className="w-[42%] shrink-0 snap-start"
              >
                <EventTile row={row} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CoverCycleProvider>
    </section>
  );
}

export function BuiltCollection({
  view,
  initialView,
  mount,
  recent,
  trail,
  wide,
}: {
  view: HomeView;
  initialView: EventsView;
  /** Production's page draws fresh after Back: a new key is that fresh drawing. */
  mount: number;
  /** Draw the Recent row over it (`recent`). */
  recent: boolean;
  trail: readonly string[];
  wide: boolean;
}) {
  const live = view.events.rows.filter((r) => r.kind !== "deleted").length;
  const lately =
    recent && live >= NEW_PIECES_FROM ? recentRows(view, trail) : [];
  return (
    <div data-hd-collection="" className="space-y-7">
      {lately.length > 0 && <RecentRow rows={lately} wide={wide} />}
      <EventsSection
        key={mount}
        rows={view.events.rows}
        seasons={view.events.seasons}
        initialView={initialView}
        title={view.events.title}
      />
    </div>
  );
}

/* ── shown her way ────────────────────────────────────────────────────── */

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
        variant="outline"
        size="sm"
        aria-label={label}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            aria-label={o.label}
            className="gap-1 px-2.5"
          >
            {o.icon}
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const SHOWS: { value: Show; label: string; icon: React.ReactNode }[] = [
  { value: "covers", label: "Covers", icon: <LayoutGrid /> },
  { value: "list", label: "List", icon: <Rows3 /> },
];
const GROUPS: { value: Grouping; label: string }[] = [
  { value: "when", label: "When" },
  { value: "year", label: "Year" },
  { value: "none", label: "None" },
];
const ORDERS: { value: Order; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "waiting", label: "Waiting" },
];

function DisplayMenu({
  display,
  onDisplay,
  open,
  onOpen,
}: {
  display: Display;
  onDisplay: (d: Display) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-hd-display="">
          <SlidersHorizontal /> Display
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 space-y-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Choice
          label="Show"
          value={display.show}
          options={SHOWS}
          onChange={(show) => onDisplay({ ...display, show })}
        />
        <Choice
          label="Group"
          value={display.group}
          options={GROUPS}
          onChange={(group) => onDisplay({ ...display, group })}
        />
        <Choice
          label="Order"
          value={display.order}
          options={ORDERS}
          onChange={(order) => onDisplay({ ...display, order })}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DisplayCollection({
  view,
  days,
  display,
  onDisplay,
  menuOpen,
  onMenuOpen,
}: {
  view: HomeView;
  days: ReadonlyMap<string, string | null>;
  display: Display;
  onDisplay: (d: Display) => void;
  menuOpen: boolean;
  onMenuOpen: (open: boolean) => void;
}) {
  const [filter, setFilter] = useState<EventsFilter>("all");
  const [query, setQuery] = useState("");
  const rows = view.events.rows;
  if (rows.length === 0) return null;
  const counts = lensCounts(rows);
  const shown = searchEventRows(filterEventRows(rows, filter), query);
  const menu = counts.all >= NEW_PIECES_FROM;
  const flat = query.trim().length > 0 || filter === "deleted";
  const groups: Laid[] = flat
    ? [{ id: "found", label: "", size: "medium", rows: shown }]
    : displayGroups(shown, view.events.seasons, days, display);
  return (
    <section
      data-hd-collection=""
      aria-label={view.events.title}
      className="space-y-5"
    >
      <Head
        title={view.events.title}
        counts={counts}
        filter={filter}
        onFilter={setFilter}
        query={query}
        onQuery={setQuery}
        control={
          menu ? (
            <DisplayMenu
              display={display}
              onDisplay={onDisplay}
              open={menuOpen}
              onOpen={onMenuOpen}
            />
          ) : null
        }
      />
      {shown.length === 0 ? (
        <Empty text={`No event's name holds “${query.trim()}”.`} />
      ) : (
        <CoverCycleProvider>
          <div className="space-y-7">
            {groups.map((g) => (
              <section
                key={g.id}
                aria-label={g.label || "Found"}
                className="space-y-3"
              >
                {g.label && <GroupHead label={g.label} count={g.rows.length} />}
                {display.show === "list" && menu ? (
                  <EventsRowList rows={g.rows} />
                ) : (
                  <Tiles rows={g.rows} size={g.size} />
                )}
              </section>
            ))}
          </div>
        </CoverCycleProvider>
      )}
    </section>
  );
}

/* ── covers near, a list for the past ─────────────────────────────────── */

const COLUMNS: { sort: ListSort; label: string }[] = [
  { sort: "name", label: "Event" },
  { sort: "date", label: "Date" },
  { sort: "size", label: "In the album" },
];

/** One line of the list: its cover, its name, its date, its size and what waits. */
function ListRow({
  row,
  date,
  wide,
}: {
  row: EventListRow;
  date: string;
  wide: boolean;
}) {
  const state = row.marks?.state ?? null;
  const body = (
    <>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
        {row.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL in production, a fixture crop here
          <img
            src={row.coverUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{row.name}</span>
        {!wide && (
          <span className="block truncate text-xs text-muted-foreground">
            {date}
          </span>
        )}
      </span>
      {/* The party, still seen at a desk: its next few photographs, as the rows view keeps them. */}
      {wide && row.stills.length > 1 && (
        <span className="flex shrink-0 gap-1" aria-hidden>
          {row.stills.slice(1, 4).map((url) => (
            <span
              key={url}
              className="relative size-7 overflow-hidden rounded-[var(--radius-tile)] bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL in production, a fixture crop here */}
              <img
                src={url}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </span>
          ))}
        </span>
      )}
      {wide && (
        <span className="w-36 shrink-0 text-sm text-muted-foreground tabular-nums">
          {date}
        </span>
      )}
      <span
        className={cn(
          "shrink-0 text-right text-sm text-muted-foreground tabular-nums",
          wide ? "w-28" : "w-14",
        )}
      >
        {row.kind === "guest" ? "Guest" : formatCount(row.items)}
      </span>
      {wide && (
        <span className="flex w-32 shrink-0 items-center justify-end gap-1.5 text-xs">
          {state?.tone === "waiting" && (
            <>
              <StateDot tone="waiting" className="size-1.5" />
              <span className="text-warning">{state.text}</span>
            </>
          )}
        </span>
      )}
    </>
  );
  const line =
    "flex h-13 items-center gap-3 rounded-lg px-2 outline-none hover:bg-muted focus-visible:bg-muted";
  return (
    <li data-hd-row={row.id}>
      {row.href ? (
        <Link href={row.href} className={line}>
          {body}
        </Link>
      ) : (
        <div className={line}>{body}</div>
      )}
    </li>
  );
}

export function IndexCollection({
  view,
  days,
  wide,
  year,
  onYear,
  sort,
  onSort,
}: {
  view: HomeView;
  days: ReadonlyMap<string, string | null>;
  wide: boolean;
  year: string;
  onYear: (y: string) => void;
  sort: ListSort;
  onSort: (s: ListSort) => void;
}) {
  const [filter, setFilter] = useState<EventsFilter>("all");
  const [query, setQuery] = useState("");
  const rows = view.events.rows;
  if (rows.length === 0) return null;
  const counts = lensCounts(rows);
  const shown = searchEventRows(filterEventRows(rows, filter), query);
  const { near, past, years } = indexOf(shown, view.events.seasons, days);
  // Under nine events the list would hold two or three: they stay covers, as built.
  if (counts.all < NEW_PIECES_FROM)
    return (
      <section data-hd-collection="" className="space-y-5">
        <Head
          title={view.events.title}
          counts={counts}
          filter={filter}
          onFilter={setFilter}
          query={query}
          onQuery={setQuery}
        />
        <CoverCycleProvider>
          <div className="space-y-7">
            {near.map((g) => (
              <section key={g.id} className="space-y-3">
                <GroupHead label={g.label} count={g.rows.length} />
                <Tiles rows={g.rows} size={g.size} />
              </section>
            ))}
            {past.length > 0 && <Tiles rows={past} size="medium" />}
          </div>
        </CoverCycleProvider>
      </section>
    );
  const inYear =
    year === "all"
      ? past
      : past.filter((r) => days.get(r.id)?.startsWith(year));
  const list = sortList(inYear, sort, days);
  const dateOf = (r: EventListRow) =>
    r.kind === "guest"
      ? r.dateLabel
      : r.dateLabel.replace("No date set", "No date");
  return (
    <section
      data-hd-collection=""
      aria-label={view.events.title}
      className="space-y-5"
    >
      <Head
        title={view.events.title}
        counts={counts}
        filter={filter}
        onFilter={setFilter}
        query={query}
        onQuery={setQuery}
      />
      <CoverCycleProvider>
        <div className="space-y-7">
          {near.map((g) => (
            <section key={g.id} aria-label={g.label} className="space-y-3">
              <GroupHead label={g.label} count={g.rows.length} />
              <Tiles rows={g.rows} size={g.size} />
            </section>
          ))}
        </div>
      </CoverCycleProvider>
      {past.length > 0 && (
        <section
          data-hd-list={list.length}
          aria-label="Earlier"
          className="space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <GroupHead label="Earlier" count={past.length} />
            <ToggleGroup
              type="single"
              value={year}
              onValueChange={(v) => v && onYear(v)}
              aria-label="Which year"
              className="rounded-full bg-muted p-0.5"
            >
              {["all", ...years].map((y) => (
                <ToggleGroupItem
                  key={y}
                  value={y}
                  className="h-7 rounded-full px-3 text-xs text-muted-foreground hover:bg-transparent data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-lift"
                >
                  {y === "all" ? "All" : y}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div
            role="row"
            className="flex h-8 items-center gap-3 border-b border-border px-2 text-xs text-muted-foreground"
          >
            <span className="size-9 shrink-0" aria-hidden />
            {COLUMNS.filter((c) => wide || c.sort !== "date").map((c) => (
              <button
                key={c.sort}
                type="button"
                onClick={() => onSort(c.sort)}
                aria-pressed={sort === c.sort}
                className={cn(
                  "flex items-center gap-1 outline-none hover:text-foreground focus-visible:text-foreground",
                  c.sort === "name" && "min-w-0 flex-1",
                  c.sort === "date" && "w-36 shrink-0",
                  c.sort === "size" &&
                    cn("shrink-0 justify-end", wide ? "w-28" : "w-14"),
                  sort === c.sort && "text-foreground",
                )}
              >
                {c.sort === "size" && !wide ? "Size" : c.label}
                {sort === c.sort && (
                  <ArrowDown className="size-3" aria-hidden />
                )}
              </button>
            ))}
            {wide && <span className="w-32 shrink-0" aria-hidden />}
          </div>
          <ul className="divide-y divide-border/60">
            {list.map((row) => (
              <ListRow
                key={`${row.kind}-${row.id}`}
                row={row}
                date={dateOf(row)}
                wide={wide}
              />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
