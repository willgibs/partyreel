"use client";

import { AtTheDoor } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { GuestsInvite } from "@/app/(app)/dashboard/[eventId]/guests/guests-invite";
import { InvitedSection } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import { BlockedSection } from "@/components/app/event-blocks/blocked-section";
import { GuestList } from "@/components/social/guest-list";

import { INERT_DOOR, INERT_INVITES } from "./acts";
import {
  AT_THE_DOOR,
  BLOCKED,
  EMAILS,
  EVENT,
  GUEST_ITEMS,
  INVITED,
} from "./fixtures";

/**
 * THE ROOM AS PRODUCTION DRAWS IT (`guests-room.tsx`'s order and classes, its
 * parts production's own): Invite aside, At the door (`at-the-door.tsx`),
 * everyone who added photos (`GuestList`: past twelve, its row of faces that
 * opens the names in a second panel), Invited (`invited-section.tsx`, the list
 * being the door) and Blocked at the foot (`blocked-section.tsx`). The door's
 * and the list's acts answer and change nothing; Blocked's own Let in and the
 * Block in a name's look are production's, and reach a server that refuses
 * them (no such event).
 */
export function TodayRoom() {
  return (
    <div data-guests-room="" className="space-y-6">
      <div className="flex justify-end">
        <GuestsInvite
          eventId={EVENT.id}
          eventName={EVENT.name}
          joinUrl={EVENT.joinUrl}
          qrStyle={EVENT.qrStyle}
          prominent={false}
          onEverything={() => {}}
        />
      </div>
      <AtTheDoor
        eventId={EVENT.id}
        people={[...AT_THE_DOOR]}
        total={AT_THE_DOOR.length}
        door="invite"
        acts={INERT_DOOR}
      />
      <GuestList
        items={GUEST_ITEMS}
        emails={EMAILS}
        blockFrom={{ eventId: EVENT.id }}
      />
      <InvitedSection
        eventId={EVENT.id}
        invited={INVITED}
        listIsTheDoor
        acts={INERT_INVITES}
      />
      <BlockedSection eventName={EVENT.name} people={BLOCKED} />
    </div>
  );
}
