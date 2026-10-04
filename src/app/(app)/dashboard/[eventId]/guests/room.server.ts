import "server-only";

import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import type { GuestListItem } from "@/components/social/guest-list";
import { seedFor } from "@/lib/avatar/seed";
import { getDoorQueue, getInviteList } from "@/lib/db/queries/event-doors";
import { getEventBlocks } from "@/lib/db/queries/event-blocks";
import { getConfirmedGuestAddresses } from "@/lib/db/queries/guest-addresses";
import { getEventGuestList } from "@/lib/db/queries/social";
import { askedAgo } from "@/lib/event/door/words";
import {
  blockedSince,
  deletedUntil,
  type BlockedPerson,
} from "@/lib/events/event-blocks";
import { splitGuestList, withAvatarUrls } from "@/lib/social/cards";

/**
 * WHAT THE GUESTS ROOM SHOWS, read for its host: every guest who added photos, a verified name and an unverified one
 * alike (Will, event-safety `room=always`), with a confirmed guest's address under the name; who waits At the door;
 * the invite list; and the Blocked list at the foot. The room stands over the hub (event-header r2, `rooms=over`), so
 * this is read where the room is: by the hub's own render when its address names the room (a link, a reload, and
 * every act in the room, whose action revalidates the hub that holds it), and by the room's own ask when a card
 * opens it in place (`readGuestsRoomAction`). One read, so the two can never show different rooms.
 *
 * ★ EVERY CALLER HAS PROVED THE HOST FIRST (`getEvent`, RLS): the door's two lists are the service role's, and the
 * addresses re-prove inside `getConfirmedGuestAddresses`; the blocks are the host's own RLS read.
 *
 * ★ PLAIN DATA ALL THE WAY DOWN, because it crosses to the client as a Server Function's answer as well as a page's
 * prop: the addresses ride as pairs and become the list's Map in the room, and every time is said here, in the
 * host's zone, so the room's first paint and its client agree.
 */
export type GuestsRoomData = {
  /** When this was read (the server's clock, ms): the room keeps the newer of two reads. */
  readAt: number;
  items: GuestListItem[];
  /** A confirmed guest's address by card id, as pairs (`GuestList`'s `emails`, a Map once it lands). */
  emails: [string, string][];
  atTheDoor: DoorPerson[];
  /** Everyone waiting, which the list may page short of. */
  doorTotal: number;
  invited: { email: string; joined: boolean }[];
  blocked: BlockedPerson[];
};

export async function readGuestsRoom(
  eventId: string,
  zone: string,
): Promise<GuestsRoomData> {
  const [entries, blocked, queue, invited] = await Promise.all([
    // Opts INTO the unverified union: this room is the host's own full read, unlike the album's guest-facing caller
    // (the identity reshape, 2026-09-21: unproven=shown-marked, never hidden from the one person the mark exists for).
    getEventGuestList(eventId, { includeUnverified: true }),
    getEventBlocks(eventId, {
      since: (iso) => blockedSince(iso, zone),
      until: (iso) => deletedUntil(iso, zone),
    }),
    getDoorQueue(eventId),
    getInviteList(eventId),
  ]);
  // When each asked, said on the server, so the first paint and the client agree.
  const readAt = Date.now();
  const atTheDoor: DoorPerson[] = queue.people.map((person) => ({
    guestId: person.guestId,
    userId: person.userId,
    name: person.name,
    email: person.email,
    asked: askedAgo(person.askedAt, readAt),
    seed: person.userId ? seedFor(person.userId) : null,
  }));

  // The union splits before hydration (lib/social/cards.ts owns why): only a profile card has an avatar to resolve,
  // so `withAvatarUrls` runs on that half alone; the unverified half rejoins as-is, after it, matching the query's own
  // cards-then-unverified order. Only a profile card can carry an address (an unverified entry's id is its guest
  // row's, and a name nobody proved never shows one), so only the cards' ids are asked for.
  const { cards, unverified } = splitGuestList(entries);
  const [hydrated, emails] = await Promise.all([
    withAvatarUrls(cards),
    getConfirmedGuestAddresses(
      eventId,
      cards.map((card) => card.id),
    ),
  ]);

  return {
    readAt,
    items: [...hydrated, ...unverified],
    emails: [...emails],
    atTheDoor,
    doorTotal: queue.total,
    invited: invited.map((i) => ({ email: i.email, joined: i.joined })),
    blocked,
  };
}
