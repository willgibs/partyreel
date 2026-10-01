import type { EventCardFace } from "@/components/app/event-card";
import type { AttendedCovers, PublicProfile } from "@/lib/db/queries/social";

/** One card of a person's grid, as `EventCard` draws it. */
export type PartyCard = {
  id: string;
  name: string;
  eventDate: string | null;
  role: "host" | "guest";
  href: string | null;
  coverUrl: string | null;
  statusLabel: string | null;
  /** What the card shows when it has no cover (`EventCardFace`). */
  empty: EventCardFace;
};

/**
 * THE GRID'S CARDS, BOTH KINDS IN ONE YEAR (Will, `made-of=covers`, 2026-09-19): every hosted event
 * the host published and every attended event its owner chose, merged newest first, so a person's
 * year reads as one year rather than as two lists that happen to share a page.
 *
 * Pure (the page hands it the RPC's payload and the two cover reads), so what each card claims is
 * pinned without a render:
 *   - a HOSTED card links to the album the host published (`display_in_profile`); a password or
 *     private album still gates at the /e/ page, and says which on its pill;
 *   - an ATTENDED card carries no link, because being on a guest list is not a capability grant.
 *     ★ AND NO LINK IS NOT A LOCK: its album is open (the RPC's own gate), so with no cover it wears
 *     the face of what it holds, video alone when every gate held and no photograph covers it
 *     (`getPublicProfileAttendedCoverUrls`), and the plain no-photograph face otherwise. It wore
 *     `EventCard`'s lock, read off its missing link, until crumbs-44.
 */
export function partyCards(
  profile: Pick<PublicProfile, "hosted_events" | "attended_events">,
  hostedCovers: Map<string, string>,
  attended: AttendedCovers,
): PartyCard[] {
  return [
    ...profile.hosted_events.map(
      (event): PartyCard => ({
        id: event.id,
        name: event.name,
        eventDate: event.event_date,
        role: "host",
        href: `/e/${event.custom_slug ?? event.qr_token}`,
        coverUrl: hostedCovers.get(event.id) ?? null,
        statusLabel:
          event.visibility === "password"
            ? "Password"
            : event.visibility === "private"
              ? "Private"
              : null,
        empty: "photo",
      }),
    ),
    ...profile.attended_events.map(
      (event): PartyCard => ({
        id: event.id,
        name: event.name,
        eventDate: event.event_date,
        role: "guest",
        href: null,
        coverUrl: attended.covers.get(event.id) ?? null,
        statusLabel: null,
        empty: attended.videoOnly.has(event.id) ? "video" : "photo",
      }),
    ),
  ].sort((a, b) => {
    if (a.eventDate === b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return a.eventDate < b.eventDate ? 1 : -1;
  });
}
