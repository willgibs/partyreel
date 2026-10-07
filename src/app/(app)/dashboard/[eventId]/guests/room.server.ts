import "server-only";

import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import {
  waitedShort,
  whenShort,
} from "@/app/(app)/dashboard/[eventId]/guests/words";
import type { GuestListItem } from "@/components/social/guest-list";
import { seedFor } from "@/lib/avatar/seed";
import { getDoorQueue, getInviteList } from "@/lib/db/queries/event-doors";
import { getEventBlocks } from "@/lib/db/queries/event-blocks";
import { getConfirmedGuestAddresses } from "@/lib/db/queries/guest-addresses";
import {
  readHostGuestFacts,
  readHostRelations,
  readQuietCards,
} from "@/lib/db/queries/guest-look";
import {
  countWaitingGuestShots,
  getEventGuestList,
} from "@/lib/db/queries/social";
import { askedAgo } from "@/lib/event/door/words";
import { deletedUntil, type BlockedPerson } from "@/lib/events/event-blocks";
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
 * addresses and what each person added re-prove inside their own reads; the blocks are the host's own RLS read.
 *
 * ★ A SEALED ALBUM'S LIST IS EMPTY WHILE ITS ROLL IS SHOT (crumbs-81): a guest whose only approved shots wait for the
 * develop joins the list at the develop, not before (the one count's rule, `getEventGuests`), so the room reads the
 * number of shots that wait beside it (`waiting`) and says so, in place of telling a host whose guests have filled a
 * roll that nobody has added a photo. One read with the rest, so the two can never describe different rooms.
 *
 * ★ ONE CALM ROW FOR EVERY PERSON (guests-room r1, `rows=list`): each guest's row says what they added, who added most
 * leading, and their card says since when (`added`); the people past the door with nothing in the album yet, whom the
 * guest list never names (someone let in at the door who has added nothing), are held at the guests' foot as in with
 * nothing added yet (`quiet`); and the host's own relations among them decide the Follow her card offers. Each is the
 * host's own read (`guest-look.ts`), keyed on the event.
 *
 * ★ PLAIN DATA ALL THE WAY DOWN, because it crosses to the client as a Server Function's answer as well as a page's
 * prop: the addresses and what each added ride as pairs and become Maps in the room, and every time is said here, in
 * the host's zone, so the room's first paint and its client agree.
 */
export type GuestsRoomData = {
  /** When this was read (the server's clock, ms): the room keeps the newer of two reads. */
  readAt: number;
  items: GuestListItem[];
  /**
   * Approved shots of guests still under their seal (an album with a develop time ahead): their guests join `items` when
   * it develops. Zero for an album that holds nothing back.
   */
  waiting: number;
  /** A confirmed guest's address by card id, as pairs (a Map once it lands). */
  emails: [string, string][];
  /*
   * ★ THE ROW'S FACTS BELOW ARE OPTIONAL TO A READER (guests-room r1): the read always says them, and a room handed a
   * read without them (a stand-in, a test's) draws its rows with nothing counted, nobody quiet and no Follow.
   */
  /**
   * What each listed person added (approved and visible, by kind) and since when, in the host's zone ("6:03 PM"), by
   * list id, as pairs. A person the read could not count has no pair, and reads as nothing counted.
   */
  added?: [string, { photos: number; videos: number; since: string }][];
  /** People past the door with nothing in the album yet, after the guests, hydrated as the list's own entries are. */
  quiet?: GuestListItem[];
  /** Whom the host follows, among the people listed (her card's Follow reads Following for them). */
  following?: string[];
  /** Whom a block parts from the host either way, among them: no Follow is offered across one. */
  barred?: string[];
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
  // The clock every word of this read is said against, read once, so a row's "2 min" and a card's "since" agree.
  const readAt = Date.now();
  const [entries, waiting, blocked, queue, invited, facts] = await Promise.all([
    // Opts INTO the unverified union: this room is the host's own full read, unlike the album's guest-facing caller
    // (the identity reshape, 2026-09-21: unproven=shown-marked, never hidden from the one person the mark exists for).
    getEventGuestList(eventId, { includeUnverified: true }),
    countWaitingGuestShots(eventId),
    getEventBlocks(eventId, {
      // A block's when as its row says it beside the name: tonight's time, or an earlier day's date.
      since: (iso) => whenShort(iso, zone, readAt),
      until: (iso) => deletedUntil(iso, zone),
    }),
    getDoorQueue(eventId),
    getInviteList(eventId),
    readHostGuestFacts(eventId),
  ]);
  const atTheDoor: DoorPerson[] = queue.people.map((person) => ({
    guestId: person.guestId,
    userId: person.userId,
    name: person.name,
    email: person.email,
    asked: askedAgo(person.askedAt, readAt),
    waited: waitedShort(person.askedAt, readAt),
    // Her account's colour where she has one, else her own guest row's (a name-only newcomer: the colour every
    // other surface gives her, which turns once to her account's when she claims it), never her name.
    seed: seedFor(person.userId ?? person.guestId),
  }));

  // The union splits before hydration (lib/social/cards.ts owns why): only a profile card has an avatar to resolve,
  // so `withAvatarUrls` runs on that half alone; the unverified half rejoins as-is, after it, matching the query's own
  // cards-then-unverified order. Only a profile card can carry an address (an unverified entry's id is its guest
  // row's, and a name nobody proved never shows one), so only the cards' ids are asked for: the listed guests' and the
  // quiet accounts'.
  const { cards, unverified } = splitGuestList(entries);
  const quietIds = facts.quiet.accounts;
  const listedIds = cards.map((card) => card.id);
  const [hydrated, quietCards, emails, relations] = await Promise.all([
    withAvatarUrls(cards),
    readQuietCards(quietIds).then(withAvatarUrls),
    getConfirmedGuestAddresses(eventId, [...listedIds, ...quietIds]),
    readHostRelations([...listedIds, ...quietIds]),
  ]);
  const byName = (a: string | null, b: string | null) =>
    (a ?? "").localeCompare(b ?? "", undefined, { sensitivity: "base" });

  return {
    readAt,
    items: [...hydrated, ...unverified],
    waiting,
    emails: [...emails],
    added: [...facts.added].map(([id, a]) => [
      id,
      {
        photos: a.photos,
        videos: a.videos,
        since: whenShort(a.firstAt, zone, readAt),
      },
    ]),
    // The quiet read as the list reads: the confirmed by name, then the typed names, each with its own colour.
    quiet: [
      ...quietCards.sort((a, b) => byName(a.displayName, b.displayName)),
      ...facts.quiet.rows
        .map((row) => ({
          kind: "unverified" as const,
          id: row.guestId,
          displayName: row.name,
          seed: seedFor(row.guestId),
        }))
        .sort((a, b) => byName(a.displayName, b.displayName)),
    ],
    following: relations.following,
    barred: relations.barred,
    atTheDoor,
    doorTotal: queue.total,
    invited: invited.map((i) => ({ email: i.email, joined: i.joined })),
    blocked,
  };
}
