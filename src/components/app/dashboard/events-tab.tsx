import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { UnsaveButton } from "@/components/app/unsave-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventCoverUrls, listEvents } from "@/lib/db/queries/events";
import { getSavedEventCards } from "@/lib/db/queries/saved-events";
import { formatEventDate } from "@/lib/utils";

/**
 * The merged Events tab as a STREAMED boundary (Phase 5 S1): hosted + saved
 * interleaved by recency, covers presigned INSIDE the boundary so the batch
 * never blocks the shell. Logic moved verbatim from the page (Phase 4's
 * merge semantics: hosted sort by created_at, saved by saved_at; ISO strings
 * compare lexically = chronologically).
 */
export async function EventsTab() {
  const [events, savedCards] = await Promise.all([
    listEvents(),
    getSavedEventCards(),
  ]);
  const coverUrls = await getEventCoverUrls(events.map((e) => e.id));

  const mergedEvents = [
    ...events.map((event) => ({
      kind: "hosted" as const,
      sortDate: event.created_at,
      event,
    })),
    ...savedCards.map((card) => ({
      kind: "saved" as const,
      sortDate: card.savedAt,
      card,
    })),
  ].sort((a, b) =>
    a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0,
  );

  if (mergedEvents.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No events yet"
        description="Create an event to collect photos from your guests, or open any event link and tap Save to keep it here."
        action={
          <Button asChild>
            <Link href="/dashboard/new">
              <CalendarPlus /> Create your first event
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mergedEvents.map((item) =>
        item.kind === "hosted" ? (
          <li key={`h-${item.event.id}`}>
            <EventCard
              kind="hosted"
              href={`/dashboard/${item.event.id}`}
              name={item.event.name}
              dateLabel={
                item.event.event_date
                  ? formatEventDate(item.event.event_date)
                  : "No date set"
              }
              coverUrl={coverUrls.get(item.event.id) ?? null}
              badges={
                <>
                  <Badge
                    variant={
                      item.event.accepting_uploads ? "secondary" : "outline"
                    }
                  >
                    {item.event.accepting_uploads ? "Open" : "Closed"}
                  </Badge>
                  <Badge variant="outline">
                    {item.event.visibility === "open"
                      ? "Public album"
                      : item.event.visibility === "password"
                        ? "Password"
                        : "Private"}
                  </Badge>
                  {item.event.moderation_mode === "hold_for_approval" && (
                    <Badge variant="outline">Reviewing</Badge>
                  )}
                </>
              }
            />
          </li>
        ) : (
          <li key={`s-${item.card.eventId}`}>
            <EventCard
              kind="saved"
              href={item.card.href}
              name={item.card.name}
              dateLabel={item.card.dateLabel}
              byline={item.card.byline}
              coverUrl={item.card.coverUrl}
              badges={
                item.card.accessible && item.card.passwordProtected ? (
                  <Badge variant="outline">Password</Badge>
                ) : null
              }
              action={<UnsaveButton eventId={item.card.eventId} />}
            />
          </li>
        ),
      )}
    </ul>
  );
}
