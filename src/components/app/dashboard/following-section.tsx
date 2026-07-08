import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { EventCard } from "@/components/app/event-card";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import type { FollowedEventCard } from "@/lib/db/queries/social";
import { formatEventDate } from "@/lib/utils";

/**
 * The dashboard "Following" section (the profiles+social slice): events by
 * hosts you follow that they PUBLISHED to their profile (display_in_profile) —
 * exactly what their /u/ page shows, delivered to your dashboard. Server-
 * rendered like every other section slot (covers presigned upstream). Reuses
 * the saved-variant EventCard: byline = the host, href = the album link the
 * host published; password/private events still gate at /e/.
 */
export function FollowingSection({ cards }: { cards: FollowedEventCard[] }) {
  if (cards.length === 0) {
    return (
      <EmptySectionTeaser
        heading="Following"
        blurb="Follow a host from their profile page and their shared events show up here."
      />
    );
  }

  return (
    <FeedSection heading="Following">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.eventId}>
            {/* No `variant`: "saved" would stamp the bookmark provenance glyph;
                these cards' provenance IS the section heading. */}
            <EventCard
              href={card.href}
              name={card.name}
              coverUrl={card.coverUrl}
              dateLabel={
                card.event_date
                  ? formatEventDate(card.event_date)
                  : "No date set"
              }
              byline={card.hostName ? `Hosted by ${card.hostName}` : null}
            />
          </li>
        ))}
      </ul>
    </FeedSection>
  );
}
