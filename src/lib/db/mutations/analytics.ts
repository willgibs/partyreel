/**
 * Link-analytics recording (Phase 6 cut #3). Best-effort + service-role: increments the
 * aggregate `link_stats` counter for an event via the locked-down `record_link_hit` RPC
 * (REVOKED from anon/authenticated — only the admin client may call it). Like
 * `touchHostActive`, this is invoked from the guest pages' `after()` callback, so it must
 * NEVER throw or block the guest flow. Stores only a count — no IP/user-agent/identity.
 */
import "server-only";

import type { Database } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

type LinkHitKind = Database["public"]["Enums"]["link_hit_kind"];

export async function recordLinkHit(
  eventId: string,
  kind: LinkHitKind,
): Promise<void> {
  try {
    await createAdminClient().rpc("record_link_hit", {
      p_event_id: eventId,
      p_kind: kind,
    });
  } catch {
    // Analytics is best-effort — swallow failures so a recording hiccup never
    // breaks the guest page that scheduled it.
  }
}
