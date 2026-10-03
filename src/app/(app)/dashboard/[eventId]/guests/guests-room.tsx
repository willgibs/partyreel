"use client";

import { useEffect, useMemo, useRef } from "react";

import { AtTheDoor } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { GuestsInvite } from "@/app/(app)/dashboard/[eventId]/guests/guests-invite";
import { InvitedSection } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import type { GuestsRoomData } from "@/app/(app)/dashboard/[eventId]/guests/room.server";
import { BlockedSection } from "@/components/app/event-blocks/blocked-section";
import { GuestList } from "@/components/social/guest-list";
import type { Door } from "@/lib/event/door/door";

/**
 * THE GUESTS ROOM, as it stands over the hub (event-header r2, `rooms=over`): At the door heads it (`queue=room`: Let
 * in and Decline on each newcomer who waits), then every guest who added photos with a confirmed guest's address under
 * the name and Block the quiet last line of each look, then Invited (`editor=both`), then Blocked at the foot
 * (`blocked=foot`). Its title is the panel's (`room-panel.tsx`), as Settings' is, so the room draws no heading of its
 * own; Invite is its main action while it is empty and a quiet one after (`GuestsInvite`).
 *
 * ★ EACH SECTION HOLDS ITS OWN ANSWERED ROWS ONLY UNTIL THE ROOM IS READ AGAIN: every act here revalidates the hub
 * that holds the room, and the hub's render reads the room afresh while its address names it, so the next `data` is
 * the truth (`at-the-door.tsx`'s note says why that is the rule).
 *
 * ★ A LINK INTO A SECTION LANDS ON IT (Settings' door page: "Manage in Guests" is `#invited`, "Let them in from
 * Guests" `#at-the-door`): the hub hands the room the section its link named (`takeAnchor`), and the room brings it
 * into view once it has drawn, inside the panel's own scroller, never the page under it.
 */
export function GuestsRoom({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  door,
  data,
  anchor = null,
  onEverything,
}: {
  eventId: string;
  eventName: string;
  /** The permanent link: what the code encodes. */
  joinUrl: string;
  qrStyle: string;
  /** The door as it stands: the invite list says whether it is the way in. */
  door: Door;
  data: GuestsRoomData;
  /** The section the room's opener named (`at-the-door`, `invited`), brought into view once. */
  anchor?: string | null;
  /** The code card's Everything: the share kit, opened in this room's place. */
  onEverything?: () => void;
}) {
  const emails = useMemo(() => new Map(data.emails), [data.emails]);
  // ★ INVITE IS THE ROOM'S MAIN ACTION WHILE IT IS EMPTY, and a quiet one after (`editor=both`).
  const empty =
    data.items.length === 0 &&
    data.doorTotal === 0 &&
    data.invited.length === 0;
  const invite = (
    <GuestsInvite
      eventId={eventId}
      eventName={eventName}
      joinUrl={joinUrl}
      qrStyle={qrStyle}
      prominent={empty}
      onEverything={onEverything}
    />
  );

  const root = useRef<HTMLDivElement>(null);
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || !anchor) return;
    landed.current = true;
    const target = root.current?.querySelector<HTMLElement>(
      `#${CSS.escape(anchor)}`,
    );
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({
      block: "start",
      behavior: still ? "auto" : "smooth",
    });
  }, [anchor]);

  return (
    <div ref={root} data-guests-room="" className="space-y-6">
      {empty ? null : <div className="flex justify-end">{invite}</div>}
      <AtTheDoor
        eventId={eventId}
        people={data.atTheDoor}
        total={data.doorTotal}
      />
      {empty ? (
        <div
          data-guests-empty=""
          className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5"
        >
          <p className="text-sm text-muted-foreground">
            Nobody has added photos yet. Invite your guests: they scan the code
            or open the link, and add from their own phones.
          </p>
          {invite}
        </div>
      ) : (
        <GuestList items={data.items} emails={emails} blockFrom={{ eventId }} />
      )}
      <InvitedSection
        eventId={eventId}
        invited={data.invited}
        listIsTheDoor={door === "invite"}
      />
      <BlockedSection eventName={eventName} people={data.blocked} />
    </div>
  );
}
