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
 * Both reads fail closed and loudly (an empty list and a captured error, never a thrown page), so
 * a failure costs the Yours row for one menu, never a zip of the wrong photographs.
 */
import "server-only";

import {
  listAccountMediaIds,
  listSessionMediaIds,
} from "@/lib/db/mutations/guest-media";

export async function ownMediaIds(input: {
  eventId: string;
  userId: string | null;
  sessionToken: string | null;
}): Promise<Set<string>> {
  const [account, session] = await Promise.all([
    input.userId
      ? listAccountMediaIds({ eventId: input.eventId, userId: input.userId })
      : Promise.resolve<string[]>([]),
    input.sessionToken
      ? listSessionMediaIds({
          eventId: input.eventId,
          sessionToken: input.sessionToken,
        })
      : Promise.resolve<string[]>([]),
  ]);
  return new Set([...account, ...session]);
}
