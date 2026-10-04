"use client";

import { startTransition, useRef, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { setEventsDisplayAction } from "@/app/(app)/dashboard/actions";
import { CoverCycleProvider } from "@/components/app/dashboard/cover-cycle";
import { DisplayMenu } from "@/components/app/dashboard/display-menu";
import {
  EventTile,
  type TileSize,
} from "@/components/app/dashboard/event-tile";
import { EventsRowList } from "@/components/app/dashboard/events-row-list";
import { EventsTable } from "@/components/app/dashboard/events-table";
import { RecentRow } from "@/components/app/dashboard/recent-row";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  arrange,
  changed,
  type Display,
  type Group,
  naturalDesc,
  offersDisplay,
  resetChoices,
  type SortKey,
  type TileScale,
  yearsOf,
} from "@/lib/dashboard/display";
import {
  EVENTS_SEARCH_FROM,
  type EventListRow,
  lensCounts,
} from "@/lib/dashboard/events-view";
import { formatCount } from "@/lib/format/count";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { cn } from "@/lib/utils";

/**
 * YOUR EVENTS, SHAPED BY HER (host-dashboard r3, Will 2026-10-04: `events=menu`; his r2 note: "a recent row as
 * collapsible (keeps last few quickly accessible), then simply a gallery/table/list with deep sort/filter/display
 * customization for how hosts prefer to organize the rest of their events"). "Your events N", a search from nine
 * events and one Display button over one collection, under the Recent row; a quiet line under the head says what is
 * set. The defaults are covers, the newest first, nothing grouped or filtered, so a host with ten sees ten covers
 * and nothing to set; a planner with two hundred has every choice in one place.
 *
 * ★ A CLIENT COMPONENT, BECAUSE THE LAYOUT, THE FILTERS, THE SEARCH AND THE ORDER ARE INSTANT: a management tool's
 * filter that costs a round trip is a filter the host stops using. Everything arrives resolved and plain (covers as
 * short-lived presigned urls, never keys; each row's day, date and open decided), her kept choices arrive resolved
 * (`resolveDisplay`, so the first paint is already her layout), and a choice lays the list out at once and is kept
 * on her account beside it (`setEventsDisplayAction`), never before it.
 *
 * Under the stage and this week this is every other event, hers hosted, the ones she added to and (through Show)
 * the bin: the stage's own event is not drawn again below it.
 */

/**
 * WHAT THIS TAB LAST SHOWED OF HER EVENTS, by account. ★ A PAGE THE BROWSER'S BACK BRINGS BACK IS DRAWN FROM BEFORE HER
 * LAST CHOICE: Back restores the dashboard from the client's router cache (the payload the server drew the first time:
 * verified in a browser, the same render stamp and her layout reset), so a layout she chose, an event she pressed into
 * and a press of Back would find the old layout again, and the search she typed gone. This is what the section
 * remembers beside the account's own copy, and a remount reads it first. It is written only in the browser (a handler),
 * so the server and the first hydration never see it, and it names the account, so another host signing in on the same
 * tab never meets hers. The search stays only for a visit's length: it is the walk back and forth between two old
 * events (his r2 note), not a setting.
 */
let remembered: {
  owner: string;
  display: Display;
  query: string;
  at: number;
} | null = null;

/** How long a search is remembered: the walk between two old events, never a stale filter on a later visit. */
const QUERY_KEPT_MS = 10 * 60 * 1000;

/** What a press leaves for a remount to find (a handler's, never a render's: the server never writes it). */
function remember(owner: string, display: Display, query: string): void {
  remembered = { owner, display, query, at: Date.now() };
}

const recallDisplay = (owner: string): Display | null =>
  remembered !== null && remembered.owner === owner ? remembered.display : null;
const recallQuery = (owner: string): string =>
  remembered !== null &&
  remembered.owner === owner &&
  Date.now() - remembered.at < QUERY_KEPT_MS
    ? remembered.query
    : "";

/** A group's grid, by how large its tiles draw: fluid columns, so a wide window holds more, never bigger. */
const GRID: Record<TileScale | "few", string> = {
  l: "grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]",
  m: "grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))]",
  s: "grid-cols-[repeat(auto-fill,minmax(min(calc(33.333%_-_8px),150px),1fr))]",
  // A group of one or two draws them a third of a desk wide rather than a fifth, so a host with a
  // couple of events meets covers, not thumbnails in an empty row.
  few: "grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))]",
};

function Tiles({
  rows,
  scale,
  actions,
}: {
  rows: readonly EventListRow[];
  scale: TileScale;
  actions: ReadonlyMap<string, React.ReactNode>;
}) {
  const grid = rows.length <= 2 && scale !== "s" ? "few" : scale;
  const tile: TileSize =
    grid === "few" || grid === "l" ? "lg" : grid === "m" ? "md" : "sm";
  return (
    <ul className={cn("grid gap-3", GRID[grid])}>
      {rows.map((row) => (
        <li key={`${row.kind}-${row.id}`}>
          <EventTile
            row={row}
            size={tile}
            action={actions.get(`${row.kind}-${row.id}`)}
          />
        </li>
      ))}
    </ul>
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
  display,
  actions,
  onSort,
}: {
  groups: readonly Group[];
  display: Display;
  actions: ReadonlyMap<string, React.ReactNode>;
  onSort: (sort: SortKey) => void;
}) {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  return (
    // The hosted tiles take turns dissolving to their next still, one per beat, in reading order
    // (`cover-cycle.tsx`, his `pulse` note).
    <CoverCycleProvider>
      <div
        data-arranged={display.layout}
        data-count={total}
        className="space-y-7"
      >
        {groups.map((g) => {
          const body =
            display.layout === "gallery" ? (
              <Tiles rows={g.rows} scale={display.scale} actions={actions} />
            ) : display.layout === "table" ? (
              <EventsTable
                rows={g.rows}
                sort={display.sort}
                desc={display.desc}
                onSort={onSort}
                actions={actions}
              />
            ) : (
              <EventsRowList rows={g.rows} actions={actions} />
            );
          // A named group (a year) is a region with a head; the whole list is not a second "Your events".
          return g.label ? (
            <section key={g.id} aria-label={g.label} className="space-y-3">
              <GroupHead label={g.label} count={g.rows.length} />
              {body}
            </section>
          ) : (
            <div key={g.id}>{body}</div>
          );
        })}
      </div>
    </CoverCycleProvider>
  );
}

export function EventsSection({
  rows,
  today,
  owner,
  initial,
  recent,
}: {
  /** Hosted (the stage's own left out), guest and deleted together; her Show decides which show. */
  rows: EventListRow[];
  /** The viewer's calendar day, what Upcoming and Past are measured from. */
  today: string;
  /** Whose events these are (her profile's id): what this tab remembers is hers alone. */
  owner: string;
  /** Her kept choices, resolved on the server, so the first paint is already her own. */
  initial: Display;
  /** The Recent row's events, decided on the server (none below seven events). */
  recent: EventListRow[];
}) {
  const [display, setDisplay] = useState<Display>(
    () => recallDisplay(owner) ?? initial,
  );
  const [query, setQuery] = useState(() => recallQuery(owner));
  // The search and the Display button's row: where the quiet line's Reset hands the focus (below).
  const controls = useRef<HTMLDivElement>(null);

  if (rows.length === 0) return null;

  /** Lays the list out at once, and keeps the choice for her account beside it. */
  function choose(next: Display) {
    setDisplay(next);
    remember(owner, next, query);
    startTransition(async () => {
      try {
        const answer = await setEventsDisplayAction(next);
        if (!answer.ok) toast.error(answer.message, { id: "events-display" });
      } catch {
        toast.error("Couldn't keep that for your account. Please try again.", {
          id: "events-display",
        });
      }
    });
  }

  const counts = lensCounts(rows);
  const groups = arrange(rows, display, today, query);
  const found = groups.reduce((n, g) => n + g.rows.length, 0);
  const said = changed(display);
  const searching = query.trim().length > 0;
  const searchable = counts.all >= EVENTS_SEARCH_FROM;

  // The bin's Restore is the list's one per-row act. A Guest tile has none: it stays while the account
  // holds a live upload there and leaves with the last one.
  const actions = new Map<string, React.ReactNode>();
  for (const g of groups)
    for (const row of g.rows)
      if (row.kind === "deleted")
        actions.set(
          `deleted-${row.id}`,
          <RestoreEventButton eventId={row.id} />,
        );

  function search(next: string) {
    setQuery(next);
    remember(owner, display, next);
  }

  const onSort = (sort: SortKey) =>
    choose(
      display.sort === sort
        ? { ...display, desc: !display.desc }
        : { ...display, sort, desc: naturalDesc(sort) },
    );

  // What an empty list says, and the one press that gets her out of it.
  const empty = searching
    ? {
        text: `No event's name holds “${query.trim()}”.`,
        act: "Show every event",
        press: () => {
          search("");
          choose(resetChoices(display));
        },
      }
    : display.lens === "deleted"
      ? {
          text: `Nothing deleted. A deleted event stays here for ${RECENTLY_DELETED_WINDOW_DAYS} days, then clears for good.`,
          act: "Show every event",
          press: () => choose(resetChoices(display)),
        }
      : counts.all === 0
        ? {
            text: `No events right now. A deleted event waits in Deleted for ${RECENTLY_DELETED_WINDOW_DAYS} days.`,
            act: "Show Deleted",
            press: () => choose({ ...display, lens: "deleted" }),
          }
        : {
            text: "No event fits what you chose.",
            act: "Show every event",
            press: () => choose(resetChoices(display)),
          };

  return (
    <div data-collection="" className="space-y-7">
      {recent.length > 0 && (
        <RecentRow
          rows={recent}
          folded={display.recent === "folded"}
          onFold={(folded) =>
            choose({ ...display, recent: folded ? "folded" : "open" })
          }
        />
      )}
      <section
        aria-label="Your events"
        data-events={display.layout}
        className="space-y-5"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <h2 className="flex items-baseline gap-2">
              <span className="font-heading text-subsection">Your events</span>
              {/* A space a reader hears and a flex row does not draw: the count has its own gap. */}{" "}
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatCount(counts.all)}
              </span>
            </h2>
            <div
              ref={controls}
              className={cn(
                "flex items-center gap-1.5",
                // The search takes a phone's whole row; without it the button rides alone at the right.
                searchable ? "w-full sm:w-auto" : "ml-auto",
              )}
            >
              {searchable && (
                <label className="relative flex min-w-0 flex-1 items-center sm:w-56 sm:flex-none">
                  <Search
                    className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">Search your events</span>
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => search(e.target.value)}
                    placeholder={`Search ${formatCount(counts.all)} events`}
                    className="h-8 rounded-full pl-8 text-xs md:text-xs"
                  />
                </label>
              )}
              {offersDisplay(rows) && (
                <DisplayMenu
                  display={display}
                  onChange={choose}
                  counts={counts}
                  years={yearsOf(rows, display.year)}
                />
              )}
            </div>
          </div>
          {said.length > 0 && (
            <p
              data-display-said=""
              className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"
            >
              <span>{said.join(" · ")}</span>
              <button
                type="button"
                onClick={() => {
                  choose(resetChoices(display));
                  // ★ RESET HANDS THE FOCUS TO THE DISPLAY BUTTON (red-team 53b's NIT, the menu's own Reset's twin). This
                  // line shows only while something is set, so the press that undoes everything removes the very button
                  // holding the focus, which then fell to the page's body and threw a keyboard user out of her place. The
                  // button is Radix's popover trigger (`aria-haspopup`), the one in this row, and the focus moves before
                  // React commits the line away.
                  controls.current
                    ?.querySelector<HTMLElement>("[aria-haspopup='dialog']")
                    ?.focus({ preventScroll: true });
                }}
                className="font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Reset
              </button>
            </p>
          )}
        </div>

        {found === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            <p>{empty.text}</p>
            <Button variant="outline" size="sm" onClick={empty.press}>
              {empty.act}
            </Button>
          </div>
        ) : (
          <Arranged
            groups={groups}
            display={display}
            actions={actions}
            onSort={onSort}
          />
        )}
      </section>
    </div>
  );
}
