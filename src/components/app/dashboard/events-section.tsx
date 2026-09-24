"use client";

import { useState } from "react";
import { ArrowDownWideNarrow, LayoutGrid, ListFilter, Rows3 } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setEventsViewAction } from "@/app/(app)/dashboard/actions";
import { trackAttrs } from "@/lib/analytics/events";
import { formatCount } from "@/lib/format/count";
import {
  EVENTS_FILTER_OPTIONS,
  EVENTS_SORT_OPTIONS,
  type EventListRow,
  type EventsFilter,
  type EventsSort,
  type EventsView,
  filterEventRows,
  sortEventRows,
} from "@/lib/dashboard/events-view";
import type { PulseTile } from "@/lib/db/queries/pulse";

/**
 * YOUR EVENTS, IN EITHER OF THE TWO VIEWS HE ASKED FOR.
 *
 * Will, `density=cover` (2026-09-20): "This is not a direct solution. Let's do
 * both. Let's make a toggle opposite 'your events' (aligned right side). That
 * allows hosts to switch between the cover card and row/table view. For fewer
 * events, I'd expect the cover card to be more popular, but for users with
 * more events, I'd expect the table to be more popular with sorting/filtering."
 *
 * So: cover cards by DEFAULT, a toggle on the right of the heading, and the
 * sort and the lens beside it. The bin and the events you added to (the Guest
 * lens: guest by upload, 2026-09-22) are FILTERS of this one list rather than
 * a chip row of their own — the five-chip inbox is what the pulse replaced, and
 * re-growing it here under another name would undo the decision.
 *
 * ★ WHY THIS IS A CLIENT COMPONENT WHEN THE OLD SECTION WAS NOT. The sort and
 * the lens must be INSTANT: this is a management tool, and a filter that costs
 * a server round-trip is a filter the host stops using (the same argument the
 * old FilterChips made, and it kept its state client-side for exactly this).
 * Everything it needs is already resolved server-side and plain — covers and
 * tiles arrive as short-lived presigned URLs, never as R2 keys, which is the
 * invariant that actually matters and is the same one MyUploadsGallery has
 * always relied on.
 *
 * The VIEW is the exception and deliberately so: it rides a cookie set by a
 * Server Action, because it has to be known before the first byte or the host
 * watches the list re-lay-out on every cold load.
 */
export function EventsSection({
  rows,
  newestByEvent,
  initialView,
  siteUrl,
}: {
  /** Hosted, guest and deleted together; the lens decides which show. */
  rows: EventListRow[];
  newestByEvent: Map<string, PulseTile[]>;
  /** Read from the cookie on the server, so the first paint is already right. */
  initialView: EventsView;
  siteUrl: string;
}) {
  const [view, setView] = useState<EventsView>(initialView);
  const [sort, setSort] = useState<EventsSort>("newest");
  const [filter, setFilter] = useState<EventsFilter>("all");

  // A host with nothing at all: the create-first hero (voice-wiring's teaser,
  // composed untouched). Checked against the RAW rows, never the filtered
  // ones, or an empty "Guest" lens would offer to create a first event to a
  // host who has three.
  if (rows.length === 0) return <EventsEmptyTeaser />;

  const shown = sortEventRows(filterEventRows(rows, filter), sort);

  function chooseView(next: string) {
    // radix returns "" when the pressed item is toggled off; a two-way switch
    // has no "neither", so an empty value keeps the current view.
    if (next !== "cards" && next !== "rows") return;
    setView(next);
    // Fire and forget: the UI has already switched, and the cookie is only
    // there so the NEXT cold load paints this view. An await here would make
    // an instant toggle wait on a round-trip for no visible benefit.
    void setEventsViewAction(next);
  }

  // The bin's Restore is the list's one per-row action. A Guest card has none:
  // it stays while the account holds a live upload there and leaves with the
  // last one, so there is nothing to undo from here.
  const actions = new Map<string, React.ReactNode>();
  for (const row of shown) {
    if (row.kind === "deleted") {
      actions.set(`deleted-${row.id}`, <RestoreEventButton eventId={row.id} />);
    }
  }

  return (
    <section aria-label="Your events" className="space-y-3">
      {/* The heading is VISIBLE now (it was sr-only): the toggle is aligned
          right "opposite 'your events'", which needs a 'your events' to be
          opposite. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-heading text-subsection">Your events</h2>

        <div className="flex items-center gap-1.5">
          {/* The lens. In BOTH views on purpose: cover cards are the default,
              so a filter living only in the row view would leave a
              default-view host with no door to their own bin. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ListFilter />
                {EVENTS_FILTER_OPTIONS.find((o) => o.value === filter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(v) => setFilter(v as EventsFilter)}
              >
                {EVENTS_FILTER_OPTIONS.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* The order rides with the rows, which is where he expects it
              ("with sorting/filtering"); the cards keep their one honest
              recency order and stay uncluttered. */}
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
          >
            <ToggleGroupItem
              value="cards"
              aria-label="Cover cards"
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
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
          {filter === "deleted"
            ? "Nothing deleted. Deleted events stay recoverable for 30 days, then they clear automatically."
            : "Nothing here yet. Add a photo to someone else's album and it shows up here."}
        </p>
      ) : view === "rows" ? (
        <EventsRowList
          rows={shown}
          newestByEvent={newestByEvent}
          actions={actions}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((row) => (
            <li key={`${row.kind}-${row.id}`}>
              <EventCard
                variant={row.kind === "deleted" ? "trash" : row.kind}
                href={row.href}
                name={row.name}
                coverUrl={row.coverUrl}
                dateLabel={row.dateLabel}
                itemsLabel={
                  row.kind === "hosted"
                    ? `${formatCount(row.items)} ${row.items === 1 ? "item" : "items"}`
                    : null
                }
                statusLabel={row.statusLabel}
                pendingCount={row.kind === "hosted" ? row.pending : 0}
                byline={row.byline}
                qrSlot={
                  row.qr ? (
                    <EventCardQr
                      eventId={row.id}
                      eventName={row.name}
                      qrToken={row.qr.token}
                      qrStyle={row.qr.style}
                      siteUrl={siteUrl}
                    />
                  ) : undefined
                }
                action={actions.get(`${row.kind}-${row.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
