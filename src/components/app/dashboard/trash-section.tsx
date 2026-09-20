import { EventCard } from "@/components/app/event-card";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import type { DeletedHostEvent } from "@/lib/db/queries/events";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { formatEventDate } from "@/lib/utils";

/**
 * ★ RETIRED FROM PRODUCTION, KEPT ON DISK (home-wiring, 2026-09-20). The bin is
 * a LENS on the events list now, not a section of its own: "Deleted" is one of
 * the three values of the list's filter, and it draws the same rows and cards
 * every other event does (`density=cover`, "let's do both"). Nothing in the app
 * renders this any more.
 *
 * It stays, with its props intact, because the LAB imports it and a wiring lane
 * never deletes a module a board draws.
 *
 * The Trash filter of the single feed (Phase 5 S2b) — a VERBATIM lift of the old
 * deleted-events tab. A utility filter (reached only via its chip), so empty is a
 * plain message, NOT a teaser: nothing to onboard here. Server-renderable.
 */
export function TrashSection({
  deletedEvents,
  coverUrls,
}: {
  deletedEvents: DeletedHostEvent[];
  coverUrls: Map<string, string>;
}) {
  if (deletedEvents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        Nothing in your trash. Deleted events stay recoverable for 30 days, then
        they clear automatically.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deletedEvents.map((event) => (
        <li key={event.id}>
          <EventCard
            variant="trash"
            href={null}
            name={event.name}
            coverUrl={coverUrls.get(event.id) ?? null}
            dateLabel={
              event.event_date
                ? formatEventDate(event.event_date)
                : "No date set"
            }
            statusLabel={binCountdownLabel(event.countdownDays)}
            action={<RestoreEventButton eventId={event.id} />}
          />
        </li>
      ))}
    </ul>
  );
}
