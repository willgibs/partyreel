import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { UnsaveButton } from "@/components/app/unsave-button";
import type { EventCardStats, HostEvent } from "@/lib/db/queries/events";
import type { SavedEventCardData } from "@/lib/saved-events/card";
import { formatEventDate } from "@/lib/utils";

// The V3 card's "N items" pill (approved media count).
const itemCountLabel = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

/**
 * The Events section of the single feed (Phase 5 S2b) — a VERBATIM lift of the
 * old merged "Events" tab. Hosted + saved interleaved by recency; each keeps its
 * own renderer (hosted = manage link + QR + stats; saved = byline + unsave + the
 * href-null/locked privacy masking) via the `kind` discriminator. Empty (no
 * created AND no saved) -> the create-first hero teaser, so the feed never voids.
 * Server-renderable (no hooks); the only interactive bit, the QR chip, is its own
 * client slot.
 */
export function EventsSection({
  events,
  savedCards,
  coverUrls,
  eventStats,
  siteUrl,
}: {
  events: HostEvent[];
  savedCards: SavedEventCardData[];
  coverUrls: Map<string, string>;
  eventStats: Map<string, EventCardStats>;
  siteUrl: string;
}) {
  const merged = [
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
  ].sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0));

  if (merged.length === 0) return <EventsEmptyTeaser />;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {merged.map((item) =>
        item.kind === "hosted" ? (
          <li key={`h-${item.event.id}`}>
            <EventCard
              variant="hosted"
              href={`/dashboard/${item.event.id}`}
              name={item.event.name}
              coverUrl={coverUrls.get(item.event.id) ?? null}
              dateLabel={
                item.event.event_date
                  ? formatEventDate(item.event.event_date)
                  : "No date set"
              }
              itemsLabel={itemCountLabel(
                eventStats.get(item.event.id)?.approved ?? 0,
              )}
              statusLabel={item.event.accepting_uploads ? "Open" : "Closed"}
              pendingCount={eventStats.get(item.event.id)?.pending ?? 0}
              qrSlot={
                <EventCardQr
                  eventId={item.event.id}
                  eventName={item.event.name}
                  qrToken={item.event.qr_token}
                  qrStyle={item.event.qr_style}
                  siteUrl={siteUrl}
                />
              }
            />
          </li>
        ) : (
          <li key={`s-${item.card.eventId}`}>
            <EventCard
              variant="saved"
              href={item.card.href}
              name={item.card.name}
              coverUrl={item.card.coverUrl}
              dateLabel={item.card.dateLabel}
              byline={item.card.byline}
              statusLabel={
                item.card.accessible && item.card.passwordProtected
                  ? "Password"
                  : null
              }
              action={<UnsaveButton eventId={item.card.eventId} />}
            />
          </li>
        ),
      )}
    </ul>
  );
}
