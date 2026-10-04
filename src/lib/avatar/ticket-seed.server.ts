import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import { mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * HER OWN COLOUR FOR HER OWN HEADER (small-fixes, "the name-only guest's hashvatar"). A name-only guest is painted in
 * the colour of her own guest ROW everywhere she is drawn for others (the guest list, the credit, the host's rooms:
 * `seedFor(guests.id)`), so her own header's disc must wear the SAME colour, and her browser holds only her session
 * token, never the row's id, so the server answers it: the hash, and nothing the browser could use as the id.
 *
 * ★ THE RULE IS THE ONE EVERY OTHER SURFACE USES. A proved row (`verified_at`, with its account) is that account's
 * colour; a typed name's is its own row's. A claim switches the row from the second to the first once, and this
 * follows with no second rule: the guest list reads the same row the same way (`lib/social/cards.ts`).
 *
 * ★ THE TOKEN IS THE CAPABILITY, so the route that asks this has already read it as the viewer's own (`sortTickets`)
 * and let the door pass it; a ticket that names no row answers null (the plain disc), never an error. A failed read
 * THROWS (`mustQuery`), the house posture: the route turns it into "no colour", which a courtesy may.
 */
export async function ticketSeed(input: {
  eventId: string;
  sessionToken: string;
}): Promise<string | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("guests")
      .select("id, user_id, verified_at")
      .eq("session_token", input.sessionToken)
      .eq("event_id", input.eventId)
      .maybeSingle(),
    "ticket seed",
  );
  if (!row) return null;
  const proved = row.verified_at !== null && row.user_id !== null;
  return seedFor(proved ? row.user_id! : row.id);
}
