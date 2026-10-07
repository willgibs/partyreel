"use client";

import type { ReactElement } from "react";

import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { GuestPeek } from "@/components/social/guest-peek";
import type { BlockedPerson } from "@/lib/events/event-blocks";

import { PhotosCard } from "./card-photos";
import { StandingCard } from "./card-standing";
import { EVENT, type Guest, listItem } from "./fixtures";

/**
 * A PERSON'S CARD, three ways (the `card` ask), opened from a name in the room
 * the `rows` answer drew:
 *
 *  - `today`: production's own look (`GuestPeek`), as the room hands it today:
 *    no viewer id, so no Follow; the page's door where there is a page; the
 *    quiet Block last. A name at the door or in Blocked opens nothing.
 *  - `photos` (`card-photos.tsx`): the look picked at popups r1, built whole,
 *    their photographs leading it.
 *  - `standing` (`card-standing.tsx`): their night here and that standing's
 *    act, opened from every name in the room.
 *
 * ★ ONE CARD, BOTH SIDES OF THE ALBUM: the guest's own list opens the same
 * look with the host's lines left out (the address, the standing's acts,
 * Block), as `GuestPeek` takes them as props today. These frames are the host's.
 *
 * ★ A CARD AT THE NAME AT A DESK, THE SHEET IN A HAND (popups r1's `peek`):
 * every candidate keeps production's two shapes (`look.tsx`).
 */

export type CardWay = "today" | "photos" | "standing";

export type Who =
  | { kind: "in"; guest: Guest }
  | { kind: "door"; person: DoorPerson }
  | { kind: "blocked"; person: BlockedPerson };

/**
 * Whether a name in this standing opens a card under the `card` answer: today's
 * look and the photos card open from the people in alone, the standing card
 * from every name. A room draws a name that opens none as plain words, never a
 * press that does nothing.
 */
export const opensCard = (way: CardWay, kind: Who["kind"]): boolean =>
  kind === "in" || way === "standing";

/**
 * Whether the door's Decline stands on its row. ★ THE STANDING CARD TAKES IT:
 * every name at the door opens a card that offers Decline where a decline is
 * explained, so the row keeps Let in alone; under today's look and the photos
 * card a name at the door opens nothing, and Decline stays on the row.
 */
export const declineOnRow = (way: CardWay): boolean => way !== "standing";

/** The name that opens a card, wrapped in the card the `card` answer draws (or bare, where it opens none). */
export function PersonCard({
  way,
  who,
  children,
}: {
  way: CardWay;
  who: Who;
  children: ReactElement;
}) {
  if (way === "standing")
    return <StandingCard who={who}>{children}</StandingCard>;
  if (who.kind !== "in") return children;
  if (way === "photos")
    return <PhotosCard guest={who.guest}>{children}</PhotosCard>;
  return (
    <GuestPeek
      item={listItem(who.guest)}
      email={who.guest.email}
      canFollow={false}
      block={{
        target: who.guest.unverified
          ? { kind: "row", guestId: who.guest.id }
          : { kind: "account", eventId: EVENT.id, userId: who.guest.id },
      }}
    >
      {children}
    </GuestPeek>
  );
}
