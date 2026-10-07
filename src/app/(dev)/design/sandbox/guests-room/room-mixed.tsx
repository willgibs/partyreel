"use client";

import type { CardWay } from "./card";
import { FacesGuests } from "./room-faces";
import { ListBlocked, ListDoor, ListInvited } from "./room-list";

/**
 * ROWS, AND THE GUESTS AS FACES (the `rows` ask's `mixed`): each section in the
 * shape its job wants. Where a person waits on an act or a list is a tool (At
 * the door, Invited, Blocked), the calm rows of `room-list.tsx`: who, the
 * address as proof, the act on the same line. Where the room is her party (the
 * guests who added photos), the contact sheet of `room-faces.tsx`: everyone at
 * once, each name under its face, a face opening their card, where their
 * address and photos are.
 *
 * ★ THE TWO HALVES ARE THE OTHER OPTIONS' OWN SECTIONS, never copies, so the
 * mixed room can never drift from what the two whole rooms draw.
 */
export function MixedRoom({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" data-gr-rows="mixed" className="space-y-8">
      <ListDoor card={card} />
      <FacesGuests card={card} />
      <ListInvited />
      <ListBlocked card={card} />
    </div>
  );
}
