import { Trash2 } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  getEventCoverUrls,
  type DeletedHostEvent,
} from "@/lib/db/queries/events";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { formatEventDate } from "@/lib/utils";

/**
 * The Trash tab as a STREAMED boundary (Phase 5 S1). It receives the
 * deleted-events promise (created un-awaited in the page body) and presigns
 * the bin covers inside the boundary. The tab LABEL stays a static "Trash":
 * the count used to stream into the trigger, but a Suspense boundary inside
 * the radix <button> breaks streaming/hydration (see page.tsx).
 */
export async function TrashTab({
  deletedPromise,
}: {
  deletedPromise: Promise<DeletedHostEvent[]>;
}) {
  const deletedEvents = await deletedPromise;

  if (deletedEvents.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Nothing here"
        description="Deleted events stay recoverable for 30 days, then they're cleared automatically."
      />
    );
  }

  const coverUrls = await getEventCoverUrls(deletedEvents.map((e) => e.id));

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deletedEvents.map((event) => (
        <li key={event.id}>
          <EventCard
            href={null}
            name={event.name}
            dateLabel={
              event.event_date
                ? formatEventDate(event.event_date)
                : "No date set"
            }
            coverUrl={coverUrls.get(event.id) ?? null}
            badges={
              <Badge variant="outline">
                {binCountdownLabel(event.countdownDays)}
              </Badge>
            }
            action={<RestoreEventButton eventId={event.id} />}
          />
        </li>
      ))}
    </ul>
  );
}
