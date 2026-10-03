import { redirect } from "next/navigation";

import { roomHref } from "@/lib/event/sections";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

/**
 * THE GUESTS ROOM STANDS OVER THE HUB NOW (Will, event-header r2 `rooms=over`), and this route survives as a DOOR to
 * it, as `/settings` does for Settings: `/dashboard/<id>/guests` (and its `#at-the-door`, `#invited`) sits in browser
 * histories, mails, the sign-in's return and Settings' own links, so it redirects to the hub with the room open. A
 * press on one of those links inside the hub never comes here at all: the hub opens the room in place
 * (`event-share-provider.tsx`'s `useRoomLinks`). It reads nothing on the way; the hub decides whether the event is
 * hers. What the room reads is `room.server.ts`'s, and what it draws `guests-room.tsx`'s.
 */
export default async function EventGuestsRedirect({ params }: PageProps) {
  const { eventId } = await params;
  redirect(roomHref(eventId, "guests"));
}
