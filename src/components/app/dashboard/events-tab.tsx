"use client";

import { use } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { UnsaveButton } from "@/components/app/unsave-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventsTabData } from "@/lib/db/queries/dashboard-tabs";
import { formatEventDate } from "@/lib/utils";

/**
 * The merged Events tab as a use()-CLIENT section (Phase 5 S1 redo): the page
 * body creates the data promise; this unwraps it inside the Suspense boundary
 * - the guest page's PROVEN streaming shape. (Async SERVER children inside
 * the client TabsContent stranded in prod - see /design/stream-probe.)
 * Rendering logic unchanged from the pre-decomposition page.
 */
export function EventsTab({ promise }: { promise: Promise<EventsTabData> }) {
  const { merged, covers } = use(promise);

  if (merged.length === 0) {
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
      {merged.map((item) =>
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
              coverUrl={covers[item.event.id] ?? null}
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
