/**
 * YOURS, FOR THE ZIP (`export-flow` r1, `means=mine`: a Yours row at the top of a guest's Download
 * menu). Will's note: it "does support getting any pictures/videos you took live in-app".
 *
 * ★ HER OWN, AS THE SERVER KNOWS IT, NEVER AS THE BROWSER SAYS IT. The set is read here from the two
 * identities a guest page has, the same predicates her Remove is offered by (`guest-media.ts`): the
 * rows her account owns (signed in, `getUser()`'s id), and the unclaimed row this browser's ticket
 * owns (the `pr_guest_<eventId>` cookie, the export route's own read identity, the one its upload
 * gate and closed door already use). No id list from the request ever decides what is hers; the
 * route then intersects this with what she can see, so Yours can only ever narrow the album.
 *
 * ★ A SIGNED-IN ACCOUNT'S YOURS IS HERS, NEVER THE PHONE'S (crumbs-27, the read side of crumbs-26's owner
 * rule): the ticket the phone still holds for the album speaks for her only as far as it is hers, her own row
 * or one the claim takes (`sortTickets`). On a shared phone another guest's name-only ticket is neither, and
 * its photographs would have gone into the zip her Yours row called hers, and into the summary that counted
 * them. Signed out, the ticket is the device's, as it has always been.
 *
 * Both reads fail closed and loudly (an empty list and a captured error, never a thrown page), so
 * a failure costs the Yours row for one menu, never a zip of the wrong photographs.
 */
import "server-only";

import {
  listAccountMediaIds,
  listSessionMediaIds,
} from "@/lib/db/mutations/guest-media";
import { sortTickets } from "@/lib/guest/session-owner.server";

export async function ownMediaIds(input: {
  eventId: string;
  userId: string | null;
  sessionToken: string | null;
}): Promise<Set<string>> {
  const ticket = input.sessionToken
    ? ((await sortTickets(input.userId, [input.sessionToken])).hers[0] ?? null)
    : null;
  const [account, session] = await Promise.all([
    input.userId
      ? listAccountMediaIds({ eventId: input.eventId, userId: input.userId })
      : Promise.resolve<string[]>([]),
    ticket
      ? listSessionMediaIds({
          eventId: input.eventId,
          sessionToken: ticket,
        })
      : Promise.resolve<string[]>([]),
  ]);
  return new Set([...account, ...session]);
}
