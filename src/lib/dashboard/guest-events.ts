import type { Database } from "@/lib/db/types";
import { doorOf } from "@/lib/event/door/door";
import { formatEventDate } from "@/lib/utils";

/**
 * THE EVENTS YOU ADDED TO, AS DASHBOARD CARDS (guest by upload, Will 2026-09-22: "uploading to an
 * event is now effectively saving").
 *
 * A person reaches an event they did not host through their own uploads and nothing else: every
 * event where their account holds a live upload (pending, approved or hidden) is a Guest card on
 * their dashboard, and the card leaves when their last live upload does. The read is
 * `getMyGuestEventCards` (lib/db/queries/social.ts, admin client); this module is the pure half,
 * kept server-free so it is unit-testable and safe to import anywhere.
 *
 * ★ THE MASKING IS THE ALBUM'S OWN, because a card is a window onto somebody else's album and must
 * never show more than the album would. The album's door is `doorOf(visibility, gate)`:
 *   - ONLY ME: blank and locked. No name, no date, no host, no link and no cover, whatever is passed
 *     in: the host has closed the album to everyone, the guest included.
 *   - A PASSWORD, OR A GATE (the host lets each person in, an invite list, only people already in):
 *     named and linked, but never a cover, because media behind a door must never leak as a
 *     thumbnail. ★ A GATE NEVER LOCKS THIS CARD: a card is for someone with a live upload there, who
 *     is past the door by construction (a waiting guest cannot upload), and a gate stops newcomers,
 *     never the guests inside, so her album still opens (event-settings r1's doors, where a gated
 *     album is stored private: read without its gate, a card went dark the moment the host chose
 *     "only people already in" after the party).
 *   - OPEN: named, linked, and a cover from the album's newest approved photograph.
 * A cover is presigned server-side and passed in; raw R2 keys never reach this module.
 */

export type GuestEventRow = {
  eventId: string;
  name: string;
  eventDate: string | null;
  visibility: Database["public"]["Enums"]["event_visibility"];
  /** A private album's gate (`readEventGates`), or none: a private album without one is Only me. */
  gate?: string | null;
  qrToken: string;
  /** The host's display name, for the byline; null when they set none. */
  hostName: string | null;
  /** This account's newest live upload here: the card's recency in the list. */
  lastUploadAt: string;
};

export type GuestEventCardData = {
  eventId: string;
  /** The recency key "Newest" sorts on: your latest live upload at this event. */
  lastUploadAt: string;
  /** `/e/<qr_token>` while the album can be opened at all; null draws a locked card. */
  href: string | null;
  name: string;
  dateLabel: string;
  /** "Hosted by X" when known and the album is not private. */
  byline: string | null;
  coverUrl: string | null;
  accessible: boolean;
  passwordProtected: boolean;
};

export function guestEventCardProps(
  row: GuestEventRow,
  coverUrl: string | null,
): GuestEventCardData {
  const door = doorOf(row.visibility, row.gate);
  const accessible = door !== "private";
  const passwordProtected = door === "password";
  return {
    eventId: row.eventId,
    lastUploadAt: row.lastUploadAt,
    accessible,
    href: accessible ? `/e/${row.qrToken}` : null,
    name: accessible ? row.name || "Untitled event" : "Private event",
    dateLabel: accessible
      ? row.eventDate
        ? formatEventDate(row.eventDate)
        : "No date set"
      : "The host made this event private",
    byline:
      accessible && row.hostName?.trim()
        ? `Hosted by ${row.hostName.trim()}`
        : null,
    // Defense in depth: whatever the caller passed, only an OPEN album ever shows a cover.
    coverUrl: door === "open" ? coverUrl : null,
    passwordProtected,
  };
}

/** Newest first by your own latest live upload (a stable sort keeps ties in the incoming order). */
export function sortGuestEventCards(
  cards: GuestEventCardData[],
): GuestEventCardData[] {
  return [...cards].sort((a, b) =>
    a.lastUploadAt < b.lastUploadAt
      ? 1
      : a.lastUploadAt > b.lastUploadAt
        ? -1
        : 0,
  );
}
