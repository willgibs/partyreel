/**
 * THE PARTY'S ZONE, READ ON THE SERVER (event-zone): one read of `events.time_zone` on the service role, as the guest
 * path's own reads are (a guest reads no table), once a request. The guest page asks it by the id of the door's own
 * read, and hands the browser the zone for words only, never behind a lock (`party-zone.tsx`); the two completes ask
 * it to place a camera's zoneless clock (`wallInPartyZone`), the guest's by its ticket's own event (crumbs-85) and the
 * host's by the body's id (crumbs-86). ★ AN ID NOT YET PROVEN IS SAFE ONLY WHERE THE ZONE STAYS ON THE SERVER: the
 * host's complete never answers with it, and the row it places is `create_media_as_host`'s to refuse unless the event
 * is hers.
 *
 * ★ A READ THAT FAILS IS NO ZONE, AND SAID: a reader handed none falls back rather than failing (the page's words to
 * her own clock, a complete to the browser's reading of the camera's clock, the party's 9 am to `partyZoneOf`'s UTC),
 * and the failure reaches Sentry, never a silence. A schema without the column (a build ahead of its migration) is
 * such a failure. A row with no zone is no failure: it is test data from before the column.
 */
import "server-only";

import { cache } from "react";

import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

export const readPartyZone = cache(async function readPartyZone(
  eventId: string,
): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("events")
      .select("time_zone")
      .eq("id", eventId)
      .maybeSingle();
    if (error) {
      captureError("db", error, { seam: "party_zone", eventId });
      return null;
    }
    return data?.time_zone ?? null;
  } catch (error) {
    captureError("db", error, { seam: "party_zone", eventId });
    return null;
  }
});
