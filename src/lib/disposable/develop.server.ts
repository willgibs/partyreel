/**
 * DEVELOP IS A WRITE (docs/systems/disposable-mode.md): `develop_due(event)` brings an album's sealed rows to its
 * event's answer when time has passed them (the develop time reached with nobody saving) or a straggler disagrees,
 * which moves the album's versions and rings the doorbell once, so every open page hears. A lazy predicate alone would
 * reach nobody: the guest poll's quiet path reads one row and answers 304.
 *
 * Who runs it, and when:
 *  - THE ALBUM'S FIRST READ THAT NEEDS IT: `get_event_by_qr_token` answers `develop_due` (two index probes), and the
 *    sync route and the page's seed call `developIfDue` before they read the versions, so a parked phone's next poll
 *    develops the album for everyone. Only an album due a develop pays the call.
 *  - THE DAILY SWEEP (`develop_due_sweep`, `lib/lifecycle/sweeps/develop.ts`), for an album nobody reads.
 * A host's save of the develop time needs no call: the database rewrites the album's rows in that same save
 * (`events_develops_rewrite`), so Develop now, right away and a new time land with the save itself.
 *
 * ★ BEST EFFORT ON A READ. A develop that fails (a deadlock among bulk media writes, an outage) is reported and the
 * read goes on: the guest reads are lazy (a row past its develop time already reads visible), and the next read, or the
 * sweep, develops it. A read never fails because a develop did.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { QueryFailedError } from "@/lib/db/must-query";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `develop_due` arrives with migration 20261002200000 and `types.ts`
 * learns it at the regeneration, so the call goes through this untyped client (drop the cast then). Before the apply
 * the call fails, which every caller here already answers as a develop that did not happen.
 */
function untypedAdmin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

/** `develop_due(event)`: how many sealed rows it moved. Throws a `QueryFailedError` on a failed call. */
export async function developDue(eventId: string): Promise<number> {
  const { data, error } = await untypedAdmin().rpc("develop_due", {
    p_event_id: eventId,
  });
  if (error) throw new QueryFailedError("disposable: develop_due", error);
  return typeof data === "number" && Number.isInteger(data) ? data : 0;
}

/** The events a request already developed, so two reads of one request ask once (keyed on the event object). */
const asked = new WeakSet<object>();

/**
 * The album's read asks its event first: when the read said a develop is due, develop before reading, once per event
 * object (a request's reads share the one its door resolved). Best effort (the header).
 */
export async function developIfDue(event: {
  id: string;
  develop_due?: boolean;
}): Promise<void> {
  if (!event.develop_due || asked.has(event)) return;
  asked.add(event);
  try {
    await developDue(event.id);
  } catch (error) {
    captureError("media", error, {
      seam: "develop_due_on_read",
      eventId: event.id,
    });
  }
}
