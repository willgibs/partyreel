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
import { presignAvatarUrl } from "@/lib/r2/avatar-url";
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

/**
 * The host's presigned avatar URL for an event's "Hosted by" byline, or null if the host has
 * no avatar. Server-only admin read (the guest page has no JWT): resolve events.host_id, then
 * the host's profiles.avatar_updated_at, then presign (reuses the Phase-1 helper; a null marker
 * → null). host_id NEVER leaves the server — only the short-lived presigned URL reaches the
 * browser — so the anon get_event_by_qr_token RPC needs no host_id/avatar columns (no contract
 * change, no host-id exposure). Callers gate this on a set host name (the byline hides without
 * one), so it's a no-op for nameless-host events.
 */
export async function getHostAvatarUrl(
  eventId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev?.host_id) return null;

  const { data: prof } = await admin
    .from("profiles")
    .select("avatar_updated_at")
    .eq("id", ev.host_id)
    .maybeSingle();
  return presignAvatarUrl(ev.host_id, prof?.avatar_updated_at ?? null);
}
