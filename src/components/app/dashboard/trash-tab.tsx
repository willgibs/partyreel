"use client";

import { use } from "react";
import { Trash2 } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { RestoreEventButton } from "@/components/app/restore-event-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import type { TrashTabData } from "@/lib/db/queries/dashboard-tabs";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { formatEventDate } from "@/lib/utils";

/** The Trash tab as a use()-client section (Phase 5 S1 redo). The label stays
 *  a static "Trash": a Suspense boundary inside the radix trigger <button>
 *  was one of the stranded shapes (see /design/stream-probe). */
export function TrashTab({ promise }: { promise: Promise<TrashTabData> }) {
  const { events: deletedEvents, covers } = use(promise);

  if (deletedEvents.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Nothing here"
        description="Deleted events stay recoverable for 30 days, then they're cleared automatically."
      />
    );
  }

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
            coverUrl={covers[event.id] ?? null}
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
