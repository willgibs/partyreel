/**
 * THE EVENT AS NOBODY IN PARTICULAR SEES IT, for its share card (`/e/<token>/card`).
 *
 * The card is cached by the edge and shared between viewers, so it may say only what it says to
 * everyone. `getEventByQrToken` answers THIS request, through its session: to an account the event
 * blocked, the event reads as private (the closed door, `closed-door.server.ts`). Build 17's
 * red-team caught the card drawn from that personal answer behind a public cache: a blocked fetch
 * left an open album unfurling nameless for an hour, and before one, the blocked viewer got the named
 * card while her page said private.
 *
 * So this asks the same resolver, `get_event_by_qr_token` (a token or a custom slug, the deleted
 * filter), with no caller at all (`createAnonClient`): no session means no block can mask the event
 * and no ownership can unredact it, and the RPC redacts a private event's name exactly as it does for
 * a signed-out visitor.
 */
import "server-only";

import { createAnonClient } from "@/lib/supabase/anon";

/**
 * The name the event's card may draw: an open or a password event's own (a password event's name is
 * link-shared, never the secret), or null for a private, unknown or deleted one. The same answer for
 * every viewer, by construction. A failed read throws: a card that errors is never cached, where a
 * card that guessed would be served to everyone for an hour.
 */
export async function getEventCardName(token: string): Promise<string | null> {
  const { data, error } = await createAnonClient().rpc(
    "get_event_by_qr_token",
    { p_qr_token: token },
  );
  if (error) throw error;
  const row = data?.[0];
  // The visibility check is the belt: the RPC already nulls a private event's name for this caller.
  if (!row || row.visibility === "private") return null;
  return row.name?.trim() ? row.name : null;
}
