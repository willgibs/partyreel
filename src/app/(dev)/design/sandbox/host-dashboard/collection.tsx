"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  Star,
  Table2,
  X,
} from "lucide-react";

import { CoverCycleProvider } from "@/components/app/dashboard/cover-cycle";
import {
  EventTile,
  type TileSize,
} from "@/components/app/dashboard/event-tile";
import { EventsRowList } from "@/components/app/dashboard/events-row-list";
import { StateDot } from "@/components/app/dashboard/marks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  lensCounts,
} from "@/lib/dashboard/events-view";
import type { HomeView } from "@/lib/dashboard/home-view";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  arrange,
  changed,
  type EventsWay,
  type Facts,
  findIn,
  type Group,
  type Layout,
  PREFS_DEFAULT,
  type Prefs,
  RECENT_FROM,
  recentRows,
  type SortKey,
  SORTS,
  sortLabel,
  STARTER_VIEWS,
  type TileScale,
  type View,
  WHENS,
  yearsOf,
} from "./model";

/**
 * YOUR EVENTS, ROUND THREE (his r2 note on `events`: "a recent row as
 * collapsible (keeps last few quickly accessible), then simply a
 * gallery/table/list with deep sort/filter/display customization for how hosts
 * prefer to organize the rest of their events").
 *
 * ★ ONE COLLECTION, FOUR WAYS TO SHAPE IT. Every option draws the same Recent
 * row and the same three layouts (production's tile in a gallery, a table,
 * production's rows view as the list) over the same filter, sort and group
 * (`model.ts`); what an option changes is where her choices live:
 *  - `menu`: one Display menu, quiet until she opens it;
 *  - `bar`: the layout, the sort and the filters in the open, as chips;
 *  - `views`: her ways of seeing them saved as tabs;
 *  - `find`: one field that takes a name, a year or a word.
 *
 * ★ QUIET BY DEFAULT: covers, the newest first, nothing grouped (his "over-
 * organizing"); the Recent row from seven events (`RECENT_FROM`), and the
 * search from nine (production's `EVENTS_SEARCH_FROM`).
 */

/* ── the shared pieces ────────────────────────────────────────────────── */

const GRID: Record<TileScale | "few", string> = {
  l: "grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]",
  m: "grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))]",
  s: "grid-cols-[repeat(auto-fill,minmax(min(calc(33.333%_-_8px),150px),1fr))]",
  few: "grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))]",
};

function Tiles({
  rows,
  scale,
}: {
  rows: readonly EventListRow[];
  scale: TileScale;
}) {
  const grid = rows.length <= 2 && scale !== "s" ? "few" : scale;
  const tile: TileSize =
    grid === "few" || grid === "l" ? "lg" : grid === "m" ? "md" : "sm";
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

/** The table's columns, each a sort. */
const COLUMNS: { sort: SortKey; label: string; at: string }[] = [
  { sort: "name", label: "Event", at: "min-w-0 flex-1" },
  { sort: "date", label: "Date", at: "w-44 shrink-0" },
  { sort: "photos", label: "In the album", at: "w-28 shrink-0 justify-end" },
  { sort: "waiting", label: "Waiting", at: "w-32 shrink-0 justify-end" },
];

function Cover({ row, size }: { row: EventListRow; size: string }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
        size,
      )}
    >
      {row.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL in production, a fixture crop here
        <img
          src={row.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : row.face ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-[9px] font-medium text-muted-foreground uppercase">
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

/**
 * THE TABLE: a line an event, its columns the sorts (a press on a head sorts by
 * it, a second press turns it round). At a phone the date folds under the name
 * and the size keeps its column.
 */
function Table({
  rows,
  wide,
  sort,
  desc,
  onSort,
}: {
  rows: readonly EventListRow[];
  wide: boolean;
  sort: SortKey;
  desc: boolean;
  onSort: (s: SortKey) => void;
}) {
  const columns = wide
    ? COLUMNS
    : COLUMNS.filter((c) => c.sort === "name" || c.sort === "photos");
  return (
    <div data-hd-table={rows.length} className="space-y-0.5">
      <div
        role="row"
        className="flex h-8 items-center gap-3 border-b border-border px-2 text-xs text-muted-foreground"
      >
        <span className="size-9 shrink-0" aria-hidden />
        {columns.map((c) => (
          <button
            key={c.sort}
            type="button"
            onClick={() => onSort(c.sort)}
            aria-pressed={sort === c.sort}
            className={cn(
              "flex items-center gap-1 outline-none hover:text-foreground focus-visible:text-foreground",
              c.at,
              !wide && c.sort === "photos" && "w-16",
              sort === c.sort && "text-foreground",
            )}
          >
            {!wide && c.sort === "photos" ? "Size" : c.label}
            {sort === c.sort &&
              (desc ? (
                <ArrowDown className="size-3" aria-hidden />
              ) : (
                <ArrowUp className="size-3" aria-hidden />
              ))}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-border/60">
        {rows.map((row) => {
          const state = row.marks?.state ?? null;
          const body = (
            <>
              <Cover row={row} size="size-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.name}
                </span>
                {!wide && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.kind === "guest" ? row.byline : row.dateLabel}
                  </span>
                )}
              </span>
              {wide && (
                <span className="w-44 shrink-0 truncate text-sm text-muted-foreground tabular-nums">
                  {row.dateLabel.replace("No date set", "No date")}
                </span>
              )}
              <span
                className={cn(
                  "shrink-0 text-right text-sm text-muted-foreground tabular-nums",
                  wide ? "w-28" : "w-16",
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
            <li key={`${row.kind}-${row.id}`} data-hd-row={row.id}>
              {row.href ? (
                <Link href={row.href} className={line}>
                  {body}
                </Link>
              ) : (
                <div className={cn(line, "opacity-70")}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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

/** Her events as she laid them out: each group under its head, in her layout. */
function Arranged({
  groups,
  prefs,
  wide,
  onSort,
  empty,
}: {
  groups: readonly Group[];
  prefs: Prefs;
  wide: boolean;
  onSort: (s: SortKey) => void;
  empty: ReactNode;
}) {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  if (total === 0) return <>{empty}</>;
  return (
    <CoverCycleProvider>
      <div
        data-hd-arranged={prefs.layout}
        data-hd-count={total}
        className="space-y-7"
      >
        {groups.map((g) => (
          <section
            key={g.id}
            aria-label={g.label || "Your events"}
            className="space-y-3"
          >
            {g.label && <GroupHead label={g.label} count={g.rows.length} />}
            {prefs.layout === "gallery" ? (
              <Tiles rows={g.rows} scale={prefs.scale} />
            ) : prefs.layout === "table" ? (
              <Table
                rows={g.rows}
                wide={wide}
                sort={prefs.sort}
                desc={prefs.desc}
                onSort={onSort}
              />
            ) : (
              <EventsRowList rows={[...g.rows]} />
            )}
          </section>
        ))}
      </div>
    </CoverCycleProvider>
  );
}

function Empty({ text, onClear }: { text: string; onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      <p>{text}</p>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Show every event
        </Button>
      )}
    </div>
  );
}

function SearchField({
  query,
  onQuery,
  count,
  className,
}: {
  query: string;
  onQuery: (q: string) => void;
  count: number;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex min-w-0 flex-1 items-center sm:w-56 sm:flex-none",
        className,
      )}
    >
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

function Title({ count }: { count: number }) {
  return (
    <h2 className="flex items-baseline gap-2">
      <span className="font-heading text-subsection">Your events</span>
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatCount(count)}
      </span>
    </h2>
  );
}

/* ── the Recent row, collapsible ──────────────────────────────────────── */

/**
 * RECENT: the events she opened lately, newest first, one row of covers at a
 * desk and a swipe in a hand; folded, a line of their small covers, each still
 * a press away (his "keeps last few quickly accessible").
 */
function RecentRow({
  rows,
  wide,
  open,
  onOpen,
}: {
  rows: readonly EventListRow[];
  wide: boolean;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  return (
    <section
      data-hd-recent={rows.length}
      data-hd-recent-open={open ? "" : undefined}
      aria-labelledby="hd-recent"
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <h2
          id="hd-recent"
          className="text-label text-muted-foreground uppercase"
        >
          Recent
        </h2>
        {!open && (
          <ul className="flex min-w-0 gap-1.5 overflow-hidden" aria-label="Recent, folded">
            {rows.map((row) => (
              <li key={`${row.kind}-${row.id}`}>
                <Link
                  href={row.href ?? "#"}
                  title={row.name}
                  aria-label={row.name}
                  className="flex h-7 items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Cover row={row} size="size-6 rounded-full" />
                  <span className="max-w-32 truncate">{row.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpen(!open)}
          className="ml-auto flex h-7 items-center gap-1 rounded-full px-2.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {open ? "Hide" : "Show"}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-150 ease-emphasis motion-reduce:transition-none",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>
      {open && (
        <CoverCycleProvider>
          {wide ? (
            <ul className="grid grid-cols-4 gap-3">
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
                  className="w-[44%] shrink-0 snap-start"
                >
                  <EventTile row={row} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </CoverCycleProvider>
      )}
    </section>
  );
}

/* ── the choices, as pills ────────────────────────────────────────────── */

const LAYOUTS: { id: Layout; label: string; icon: ReactNode }[] = [
  { id: "gallery", label: "Gallery", icon: <LayoutGrid /> },
  { id: "table", label: "Table", icon: <Table2 /> },
  { id: "list", label: "List", icon: <Rows3 /> },
];

const PILL =
  "h-7 rounded-full px-3 text-xs text-muted-foreground hover:bg-transparent data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-lift";

function Pills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className="flex-wrap justify-start rounded-2xl bg-muted p-0.5"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id} className={PILL}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** What a direction says for a sort: "Newest first", "A to Z". */
function directionWords(sort: SortKey, desc: boolean): string {
  if (sort === "name") return desc ? "Z to A" : "A to Z";
  if (sort === "made") return desc ? "Newest first" : "Oldest first";
  if (sort === "date") return desc ? "Latest first" : "Soonest first";
  if (sort === "opened") return desc ? "Most recent first" : "Least recent";
  return desc ? "Most first" : "Fewest first";
}

/** A sort's natural direction: names A to Z, everything else the most or newest first. */
const naturalDesc = (s: SortKey) => s !== "name";

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-label text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

/**
 * EVERY CHOICE IN ONE PLACE: the layout, the order and its direction, what
 * shows (her lens, a time, a year), the groups, the covers' size. Drawn in the
 * Display menu (`menu`) and in a view's own editor (`views`).
 */
function Choices({
  prefs,
  onPrefs,
  counts,
  years,
}: {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  counts: Record<EventsFilter, number>;
  years: readonly string[];
}) {
  const set = (patch: Partial<Prefs>) => onPrefs({ ...prefs, ...patch });
  const lenses = EVENTS_FILTER_OPTIONS.filter(
    (o) => o.value === "all" || counts[o.value] > 0,
  ).map((o) => ({
    id: o.value,
    label: `${o.label} ${formatCount(counts[o.value])}`,
  }));
  return (
    <div className="space-y-4">
      <Section label="Layout">
        <ToggleGroup
          type="single"
          value={prefs.layout}
          onValueChange={(v) => v && set({ layout: v as Layout })}
          aria-label="Layout"
          className="grid w-full grid-cols-3 gap-1.5"
        >
          {LAYOUTS.map((l) => (
            <ToggleGroupItem
              key={l.id}
              value={l.id}
              className="flex h-14 flex-col gap-1 rounded-xl border border-border text-xs data-[state=on]:border-foreground data-[state=on]:bg-muted"
            >
              {l.icon}
              {l.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>
      <Section label="Order">
        <div className="space-y-1.5">
          <Pills
            label="Sort by"
            value={prefs.sort}
            options={SORTS}
            onChange={(sort) => set({ sort, desc: naturalDesc(sort) })}
          />
          <button
            type="button"
            onClick={() => set({ desc: !prefs.desc })}
            className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {prefs.desc ? (
              <ArrowDown className="size-3.5" aria-hidden />
            ) : (
              <ArrowUp className="size-3.5" aria-hidden />
            )}
            {directionWords(prefs.sort, prefs.desc)}
          </button>
        </div>
      </Section>
      <Section label="Show">
        <div className="space-y-1.5">
          <Pills
            label="Whose"
            value={prefs.lens}
            options={lenses}
            onChange={(lens) => set({ lens })}
          />
          <Pills
            label="When"
            value={prefs.when}
            options={WHENS}
            onChange={(when) => set({ when })}
          />
          {years.length > 1 && (
            <Pills
              label="Year"
              value={prefs.year ?? "all"}
              options={[
                { id: "all", label: "Every year" },
                ...years.map((y) => ({ id: y, label: y })),
              ]}
              onChange={(y) => set({ year: y === "all" ? null : y })}
            />
          )}
        </div>
      </Section>
      <div className="grid grid-cols-2 gap-3">
        <Section label="Group">
          <Pills
            label="Group"
            value={prefs.group}
            options={[
              { id: "none", label: "None" },
              { id: "year", label: "By year" },
            ]}
            onChange={(group) => set({ group })}
          />
        </Section>
        {prefs.layout === "gallery" && (
          <Section label="Covers">
            <Pills
              label="Cover size"
              value={prefs.scale}
              options={[
                { id: "s", label: "S" },
                { id: "m", label: "M" },
                { id: "l", label: "L" },
              ]}
              onChange={(scale) => set({ scale })}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

/* ── 1. one Display menu ──────────────────────────────────────────────── */

function DisplayMenu({
  prefs,
  onPrefs,
  counts,
  years,
  open,
  onOpen,
}: {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  counts: Record<EventsFilter, number>;
  years: readonly string[];
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const n = changed(prefs).length;
  return (
    <Popover open={open} onOpenChange={onOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-hd-display={n}>
          <SlidersHorizontal /> Display
          {n > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background tabular-nums">
              {n}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] space-y-4 p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Choices
          prefs={prefs}
          onPrefs={onPrefs}
          counts={counts}
          years={years}
        />
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Kept for your account, on every device</span>
          {n > 0 && (
            <button
              type="button"
              onClick={() => onPrefs(PREFS_DEFAULT)}
              className="font-medium text-foreground outline-none hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── 2. everything in the open ────────────────────────────────────────── */

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      data-hd-chip=""
      className="flex h-7 items-center gap-1 rounded-full border border-border bg-background pr-1 pl-3 text-xs"
    >
      {label}
      <button
        type="button"
        aria-label={`Clear ${label}`}
        onClick={onClear}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}

function Toolbar({
  prefs,
  onPrefs,
  counts,
  years,
  open,
  onOpen,
}: {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  counts: Record<EventsFilter, number>;
  years: readonly string[];
  open: string | null;
  onOpen: (open: string | null) => void;
}) {
  const set = (patch: Partial<Prefs>) => onPrefs({ ...prefs, ...patch });
  const chips: { label: string; clear: Partial<Prefs> }[] = [];
  if (prefs.lens !== "all")
    chips.push({
      label:
        EVENTS_FILTER_OPTIONS.find((o) => o.value === prefs.lens)?.label ?? "",
      clear: { lens: "all" },
    });
  if (prefs.when !== "any")
    chips.push({
      label: WHENS.find((w) => w.id === prefs.when)!.label,
      clear: { when: "any" },
    });
  if (prefs.year) chips.push({ label: prefs.year, clear: { year: null } });
  return (
    <div
      data-hd-toolbar={chips.length}
      className="flex flex-wrap items-center gap-1.5"
    >
      <ToggleGroup
        type="single"
        value={prefs.layout}
        onValueChange={(v) => v && set({ layout: v as Layout })}
        variant="outline"
        size="sm"
        aria-label="Layout"
      >
        {LAYOUTS.map((l) => (
          <ToggleGroupItem
            key={l.id}
            value={l.id}
            aria-label={l.label}
            className="gap-1 px-2.5"
          >
            {l.icon}
            <span className="max-sm:hidden">{l.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DropdownMenu
        open={open === "sort"}
        onOpenChange={(o) => onOpen(o ? "sort" : null)}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-hd-sort={prefs.sort}>
            {prefs.desc ? <ArrowDown /> : <ArrowUp />}
            {sortLabel(prefs.sort)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={prefs.sort}
            onValueChange={(v) =>
              set({ sort: v as SortKey, desc: naturalDesc(v as SortKey) })
            }
          >
            {SORTS.map((s) => (
              <DropdownMenuRadioItem key={s.id} value={s.id}>
                {s.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={prefs.desc ? "desc" : "asc"}
            onValueChange={(v) => set({ desc: v === "desc" })}
          >
            <DropdownMenuRadioItem value="desc">
              {directionWords(prefs.sort, true)}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="asc">
              {directionWords(prefs.sort, false)}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover
        open={open === "filter"}
        onOpenChange={(o) => onOpen(o ? "filter" : null)}
        modal={false}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" data-hd-filter="">
            <ListFilter /> Filter
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 space-y-3 p-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Section label="Whose">
            <Pills
              label="Whose"
              value={prefs.lens}
              options={EVENTS_FILTER_OPTIONS.filter(
                (o) => o.value === "all" || counts[o.value] > 0,
              ).map((o) => ({
                id: o.value,
                label: `${o.label} ${formatCount(counts[o.value])}`,
              }))}
              onChange={(lens) => set({ lens })}
            />
          </Section>
          <Section label="When">
            <Pills
              label="When"
              value={prefs.when}
              options={WHENS}
              onChange={(when) => set({ when })}
            />
          </Section>
          {years.length > 1 && (
            <Section label="Year">
              <Pills
                label="Year"
                value={prefs.year ?? "all"}
                options={[
                  { id: "all", label: "Every year" },
                  ...years.map((y) => ({ id: y, label: y })),
                ]}
                onChange={(y) => set({ year: y === "all" ? null : y })}
              />
            </Section>
          )}
        </PopoverContent>
      </Popover>
      <Button
        variant={prefs.group === "year" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={prefs.group === "year"}
        onClick={() => set({ group: prefs.group === "year" ? "none" : "year" })}
      >
        By year
      </Button>
      {chips.map((c) => (
        <Chip key={c.label} label={c.label} onClear={() => set(c.clear)} />
      ))}
    </div>
  );
}

/* ── 3. views as tabs ─────────────────────────────────────────────────── */

function ViewTabs({
  views,
  active,
  onActive,
  countOf,
  editOpen,
  onEditOpen,
  prefs,
  onPrefs,
  counts,
  years,
}: {
  views: readonly View[];
  active: string;
  onActive: (id: string) => void;
  countOf: (v: View) => number;
  editOpen: boolean;
  onEditOpen: (open: boolean) => void;
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  counts: Record<EventsFilter, number>;
  years: readonly string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Your views"
        data-hd-views={views.length}
        className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-1 overflow-x-auto border-b border-border"
      >
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={v.id === active}
            onClick={() => onActive(v.id)}
            className={cn(
              "-mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-sm outline-none focus-visible:bg-muted",
              v.id === active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {v.hers && <Star className="size-3" aria-hidden />}
            {v.label}
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCount(countOf(v))}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="-mb-px flex h-9 shrink-0 items-center gap-1 border-b-2 border-transparent px-2 text-sm text-muted-foreground outline-none hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden /> New view
        </button>
      </div>
      <Popover open={editOpen} onOpenChange={onEditOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" data-hd-edit-view="">
            <SlidersHorizontal /> <span className="max-sm:hidden">Edit view</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[22rem] space-y-4 p-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Choices
            prefs={prefs}
            onPrefs={onPrefs}
            counts={counts}
            years={years}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button variant="ghost" size="sm">
              Save as a new view
            </Button>
            <Button size="sm" onClick={() => onEditOpen(false)}>
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ── 4. one field that finds ──────────────────────────────────────────── */

function FindField({
  query,
  onQuery,
  chips,
  suggestions,
  count,
  found,
}: {
  query: string;
  onQuery: (q: string) => void;
  chips: readonly string[];
  suggestions: readonly string[];
  count: number;
  found: number;
}) {
  const add = (word: string) =>
    onQuery(`${query.trim()} ${word.toLowerCase()}`.trim());
  const searching = query.trim().length > 0;
  return (
    <div data-hd-find={found} className="space-y-2">
      <label className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Find an event</span>
        <Input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={`Find any of ${formatCount(count)} by name, year or word`}
          className="h-11 rounded-full pr-24 pl-11 text-sm md:text-sm"
        />
        {searching && (
          <span className="pointer-events-none absolute right-4 text-xs text-muted-foreground tabular-nums">
            {`${formatCount(found)} of ${formatCount(count)}`}
          </span>
        )}
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            data-hd-chip=""
            className="flex h-7 items-center rounded-full bg-foreground px-3 text-xs font-medium text-background"
          >
            {c}
          </span>
        ))}
        {suggestions
          .filter((s) => !chips.some((c) => c.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Plus className="size-3" aria-hidden />
              {s}
            </button>
          ))}
      </div>
    </div>
  );
}

/* ── the collection ───────────────────────────────────────────────────── */

export type CollectionStart = {
  prefs?: Partial<Prefs>;
  query?: string;
  /** The Recent row folded, as she left it. */
  recentFolded?: boolean;
  /** A control drawn open as the frame opens. */
  open?: "display" | "sort" | "filter" | "edit";
  /** `views`: the view on, and the views she made. */
  view?: string;
  views?: readonly View[];
};

export function Collection({
  way,
  view,
  facts,
  trail,
  total,
  wide,
  start = {},
}: {
  way: EventsWay;
  view: HomeView;
  facts: Facts;
  trail: readonly string[];
  /** Every event she has, hosted and added to: what Recent counts from. */
  total: number;
  wide: boolean;
  start?: CollectionStart;
}) {
  const views = [...STARTER_VIEWS, ...(start.views ?? [])];
  const [active, setActive] = useState(start.view ?? "all");
  const [own, setOwn] = useState<Prefs>({ ...PREFS_DEFAULT, ...start.prefs });
  // A view she edited keeps its edit for the visit; a frame may open on one already edited.
  const [edits, setEdits] = useState<Record<string, Prefs>>(() => {
    const on = views.find((v) => v.id === start.view);
    return way === "views" && on && start.prefs
      ? { [on.id]: { ...on.prefs, ...start.prefs } }
      : {};
  });
  const [query, setQuery] = useState(start.query ?? "");
  const [recentOpen, setRecentOpen] = useState(!start.recentFolded);
  const [open, setOpen] = useState<string | null>(start.open ?? null);

  const rows = view.events.rows;
  if (rows.length === 0) return null;
  const counts = lensCounts(rows);
  const years = yearsOf(
    rows.filter((r) => r.kind !== "deleted"),
    facts,
  );
  const lately = total >= RECENT_FROM ? recentRows(view, trail) : [];

  // Each way's prefs: her own (menu, bar, find), or the view's on (views).
  const shown = views.find((v) => v.id === active) ?? views[0]!;
  const prefs = way === "views" ? (edits[shown.id] ?? shown.prefs) : own;
  const setPrefs = (p: Prefs) =>
    way === "views" ? setEdits((e) => ({ ...e, [shown.id]: p })) : setOwn(p);
  const onSort = (s: SortKey) =>
    setPrefs(
      prefs.sort === s
        ? { ...prefs, desc: !prefs.desc }
        : { ...prefs, sort: s, desc: naturalDesc(s) },
    );

  const searchable = counts.all >= EVENTS_SEARCH_FROM;
  let groups: Group[];
  let chips: string[] = [];
  if (way === "find") {
    const found = findIn(rows, query, facts);
    chips = found.chips;
    groups = arrange(found.rows, { ...prefs, lens: "all" }, facts);
  } else if (way === "views") {
    groups = arrange(rows, prefs, facts, query || (shown.query ?? ""));
  } else {
    groups = arrange(rows, prefs, facts, query);
  }
  const found = groups.reduce((n, g) => n + g.rows.length, 0);
  const reset = () => {
    setQuery("");
    setPrefs(way === "views" ? shown.prefs : PREFS_DEFAULT);
  };
  const empty = (
    <Empty
      text={
        query.trim()
          ? `No event matches “${query.trim()}”.`
          : prefs.lens === "deleted"
            ? "Nothing deleted. A deleted event stays here for 30 days, then clears for good."
            : "No event fits what you chose."
      }
      onClear={reset}
    />
  );

  let head: ReactNode;
  if (way === "menu") {
    const said = changed(prefs);
    head = (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Title count={counts.all} />
          <div
            className={cn(
              "flex items-center gap-1.5",
              searchable ? "w-full sm:w-auto" : "ml-auto",
            )}
          >
            {searchable && (
              <SearchField
                query={query}
                onQuery={setQuery}
                count={counts.all}
              />
            )}
            {counts.all > 1 && (
              <DisplayMenu
                prefs={prefs}
                onPrefs={setPrefs}
                counts={counts}
                years={years}
                open={open === "display"}
                onOpen={(o) => setOpen(o ? "display" : null)}
              />
            )}
          </div>
        </div>
        {said.length > 0 && (
          <p
            data-hd-said=""
            className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"
          >
            <span>{said.join(" · ")}</span>
            <button
              type="button"
              onClick={() => setPrefs(PREFS_DEFAULT)}
              className="font-medium text-foreground outline-none hover:underline"
            >
              Reset
            </button>
          </p>
        )}
      </div>
    );
  } else if (way === "bar") {
    head = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Title count={counts.all} />
          {searchable && (
            <SearchField
              query={query}
              onQuery={setQuery}
              count={counts.all}
              className="max-sm:w-full"
            />
          )}
        </div>
        {counts.all > 1 && (
          <Toolbar
            prefs={prefs}
            onPrefs={setPrefs}
            counts={counts}
            years={years}
            open={open}
            onOpen={setOpen}
          />
        )}
      </div>
    );
  } else if (way === "views") {
    const countOf = (v: View) =>
      arrange(rows, edits[v.id] ?? v.prefs, facts, v.query ?? "").reduce(
        (n, g) => n + g.rows.length,
        0,
      );
    const shownViews = views.filter((v) => v.id === "all" || countOf(v) > 0);
    head = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Title count={counts.all} />
          {searchable && (
            <SearchField
              query={query}
              onQuery={setQuery}
              count={counts.all}
              className="max-sm:w-full"
            />
          )}
        </div>
        {counts.all > 1 && (
          <ViewTabs
            views={shownViews}
            active={shown.id}
            onActive={(id) => {
              setActive(id);
              setOpen(null);
            }}
            countOf={countOf}
            editOpen={open === "edit"}
            onEditOpen={(o) => setOpen(o ? "edit" : null)}
            prefs={prefs}
            onPrefs={setPrefs}
            counts={counts}
            years={years}
          />
        )}
      </div>
    );
  } else {
    const suggestions = [
      ...years.slice(0, wide ? 4 : 2),
      "Upcoming",
      "Waiting",
      "Undated",
    ];
    head = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Title count={counts.all} />
          {counts.all > 1 && (
            <div className="flex items-center gap-1.5">
              <ToggleGroup
                type="single"
                value={prefs.layout}
                onValueChange={(v) =>
                  v && setPrefs({ ...prefs, layout: v as Layout })
                }
                variant="outline"
                size="sm"
                aria-label="Layout"
              >
                {LAYOUTS.map((l) => (
                  <ToggleGroupItem key={l.id} value={l.id} aria-label={l.label}>
                    {l.icon}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <DropdownMenu
                open={open === "sort"}
                onOpenChange={(o) => setOpen(o ? "sort" : null)}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {prefs.desc ? <ArrowDown /> : <ArrowUp />}
                    {sortLabel(prefs.sort)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={prefs.sort}
                    onValueChange={(v) =>
                      setPrefs({
                        ...prefs,
                        sort: v as SortKey,
                        desc: naturalDesc(v as SortKey),
                      })
                    }
                  >
                    {SORTS.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id}>
                        {s.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {counts.all >= EVENTS_SEARCH_FROM && (
          <FindField
            query={query}
            onQuery={setQuery}
            chips={chips}
            suggestions={suggestions}
            count={counts.all}
            found={found}
          />
        )}
      </div>
    );
  }

  return (
    <div data-hd-collection="" data-hd-way={way} className="space-y-7">
      {lately.length > 0 && (
        <RecentRow
          rows={lately}
          wide={wide}
          open={recentOpen}
          onOpen={setRecentOpen}
        />
      )}
      <section
        data-hd-events=""
        aria-label="Your events"
        className="space-y-5"
      >
        {head}
        <Arranged
          groups={groups}
          prefs={prefs}
          wide={wide}
          onSort={onSort}
          empty={empty}
        />
      </section>
    </div>
  );
}
