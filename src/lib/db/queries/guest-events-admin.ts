/**
 * Admin-read path for PASSWORD-protected events. The anon media RPCs gate on
 * `visibility = 'open'`, so a password event's media never flows through them; once
 * the guest proves the password (the signed unlock cookie), the server reads the
 * media via the service-role admin client (which bypasses the gate).
 *
 * SELF-GUARDED: the unlock-cookie check lives INSIDE this privileged path (not just
 * upstream of it), so a careless caller can't pass an arbitrary event id and dump a
 * locked album. Returns [] unless THIS request holds a valid unlock cookie for the
 * event. Mirrors the blessed admin-from-guest-page pattern (mutations/analytics.ts
 * `recordLinkHit`), but reads media, so it carries its own gate.
 *
 * Only ever call this for a `password` event that resolved via the normal RPC; never
 * for `open` (use the anon RPC) or `private` (stays locked).
 */
import "server-only";

import type { GuestMediaRow } from "@/lib/db/queries/guest-events";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getApprovedMediaForUnlock(
  eventId: string,
): Promise<GuestMediaRow[]> {
  if (!(await isUnlocked(eventId))) return [];

  const { data, error } = await createAdminClient()
    .from("media")
    .select("id, type, original_key")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
  }));
}
