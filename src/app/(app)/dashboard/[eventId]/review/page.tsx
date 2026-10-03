import { redirect } from "next/navigation";

import { roomHref } from "@/lib/event/sections";

// Next 16: params is a Promise — await it.
type PageProps = { params: Promise<{ eventId: string }> };

/**
 * REVIEW STANDS OVER THE HUB NOW (Will, event-header r2 `rooms=over`, 2026-10-03: "This feels phenomenally more
 * fluid, natural, and intuitive"), and this route survives as a DOOR to it, as `/settings` does for Settings.
 *
 * ★ PUBLISHED LINKS ARE THE REASON. `/dashboard/<id>/review` was the room's address for its whole life: in browser
 * histories, a mail's button, the sign-in's return (which carries a path and never a query), the bell and the
 * dashboard's acts until this round. A 404 would be a self-inflicted broken link, so it redirects to the hub with the
 * room open, the same destination spelled the way the hub spells it. It reads nothing on the way: the hub decides
 * whether the event is hers, and draws the not-found when it is not.
 */
export default async function EventReviewRedirect({ params }: PageProps) {
  const { eventId } = await params;
  redirect(roomHref(eventId, "review"));
}
