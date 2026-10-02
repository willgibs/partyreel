import "server-only";

import { readOwnUploads } from "@/lib/db/mutations/guest-media";
import { sortTickets } from "@/lib/guest/session-owner.server";

/**
 * HER WAITING UPLOADS, KNOWN BEFORE THE FIRST PAINT (crumbs-43; ROADMAP, from `voice-wiring`: "a returning guest
 * whose only uploads wait on an empty held album meets the empty state's 'Add the first photo' with her badge beside
 * Invite, since the row's Add returns only for this visit's files (`galleryEmpty`); counting her waiting rows would
 * move the Add a beat after they load, so it wants a layout that does not jump").
 *
 * The album's one Add is the empty state's while nothing of hers is on the way, and the row's once something is (her
 * stack at the album's head, or her tracker's badge counting what waits for the host). Her tracker learns an earlier
 * visit's waiting rows from its own read after mount, so the page answered from this visit's queue alone and drew
 * "Add the first photo" over an album she had already added to. The server knows her rows when it renders: so the
 * page asks here, and the first paint is the layout she keeps, with nothing to move when the tracker's read lands.
 *
 * Asked only where it decides anything (the page's own guard: an empty album that holds uploads for the host, open
 * to hers, never the host's own, never the demo). Her rows are the ticket the request carries, as far as it may
 * speak for a signed-in viewer (`sortTickets`, the owner rule's read side), and her account's: the tracker's own
 * read without its news, so it marks nothing told. Both reads fail closed and captured inside them, which answers
 * "nothing waiting": the layout she had before this read existed.
 */
export async function hasWaitingUploads(input: {
  eventId: string;
  userId: string | null;
  /** The `pr_guest_<eventId>` cookie's ticket, or null. */
  ticket: string | null;
}): Promise<boolean> {
  const ticket = input.ticket
    ? ((await sortTickets(input.userId, [input.ticket])).hers[0] ?? null)
    : null;
  if (ticket === null && input.userId === null) return false;
  const { items } = await readOwnUploads({
    eventId: input.eventId,
    sessionToken: ticket,
    userId: input.userId,
  });
  return items.some((item) => item.status === "pending");
}
