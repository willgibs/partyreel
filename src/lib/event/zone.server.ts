/**
 * THE PARTY'S ZONE, FOR A GUEST'S RENDER (event-zone): one read of `events.time_zone` on the service role, as the guest
 * path's own reads are (a guest reads no table, and the id is the door's own read, never a client's), once a request.
 * The zone never leaves the server: the page hands the browser the instant it names (`zone-morning.ts`).
 *
 * ★ A READ THAT FAILS IS THE FALLBACK, AND SAID: the album turns in UTC (`partyZoneOf`) rather than the page failing
 * over an order, and the failure reaches Sentry, never a silence. A schema without the column (a build ahead of its
 * migration) is such a failure. A row with no zone is no failure: it is test data from before the column.
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
