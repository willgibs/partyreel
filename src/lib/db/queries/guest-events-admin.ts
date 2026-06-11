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

import type { GuestEvent, GuestMediaRow } from "@/lib/db/queries/guest-events";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import {
  resolveUploaderIdentity,
  type UploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";

export async function getApprovedMediaForUnlock(
  eventId: string,
): Promise<GuestMediaRow[]> {
  if (!(await isUnlocked(eventId))) return [];

  const { data, error } = await createAdminClient()
    .from("media")
    .select("id, type, original_key, width, height, duration_seconds")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    width: m.width,
    height: m.height,
    duration_seconds: m.duration_seconds,
  }));
}

/**
 * Server-capped TEASER for the gated gallery: the newest `limit` approved PHOTOS plus the TOTAL count
 * of approved photos (for the "+N more" affordance), in ONE round trip via PostgREST `count: "exact"`.
 *
 * SELF-GUARDED by visibility, mirroring getApprovedMediaForUnlock: a password event requires the
 * unlock cookie (so a careless caller can't dump a locked album's teaser), an open event's photos are
 * already public, and anything else (private) returns nothing. The teaser is a strict SUBSET of what
 * the viewer could otherwise see, so it leaks strictly less.
 */
export async function getApprovedPhotoTeaser(
  event: Pick<GuestEvent, "id" | "visibility">,
  limit: number,
): Promise<{ rows: GuestMediaRow[]; total: number }> {
  if (event.visibility === "password") {
    if (!(await isUnlocked(event.id))) return { rows: [], total: 0 };
  } else if (event.visibility !== "open") {
    return { rows: [], total: 0 };
  }

  const { data, count, error } = await createAdminClient()
    .from("media")
    .select("id, type, original_key, width, height, duration_seconds", {
      count: "exact",
    })
    .eq("event_id", event.id)
    .eq("status", "approved")
    .eq("type", "photo")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return {
    rows: (data ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      original_key: m.original_key,
      width: m.width,
      height: m.height,
      duration_seconds: m.duration_seconds,
    })),
    total: count ?? 0,
  };
}

/**
 * Header stats for the guest page (Phase 4): the approved media count + how many
 * distinct people contributed (distinct uploader guests, +1 if the host uploaded
 * anything). One admin select of guest_id over approved rows — NUMBERS ONLY ever
 * leave this function (no identities; the contributor count is as benign as the
 * media count).
 *
 * Visibility posture: open events are public; a LOCKED password event still gets
 * counts — that's the ratified entry tease ("N photos are waiting" over the ghost
 * grid; cardinality only, zero media URLs pre-unlock). Private never reaches here
 * (the page early-returns), but returns zeros defensively.
 */
export async function getGalleryStats(
  event: Pick<GuestEvent, "id" | "visibility">,
): Promise<{ approvedTotal: number; contributorCount: number }> {
  if (event.visibility !== "open" && event.visibility !== "password") {
    return { approvedTotal: 0, contributorCount: 0 };
  }
  const { data, error } = await createAdminClient()
    .from("media")
    .select("guest_id")
    .eq("event_id", event.id)
    .eq("status", "approved");
  if (error) throw error;
  const rows = data ?? [];
  const guests = new Set<string>();
  let hostUploaded = false;
  for (const r of rows) {
    if (r.guest_id) guests.add(r.guest_id);
    else hostUploaded = true;
  }
  return {
    approvedTotal: rows.length,
    contributorCount: guests.size + (hostUploaded ? 1 : 0),
  };
}

/**
 * The host's avatar URL for an event's "Hosted by" byline, or null if the host has no avatar.
 * Server-only admin read (the guest page has no JWT): resolve events.host_id, then the host's
 * profiles.avatar_updated_at, then build the URL (reuses getAvatarUrl; a null marker → null).
 * The anon get_event_by_qr_token RPC stays UNCHANGED (no contract change): host_id is never
 * returned as a separate field. It appears only inside the avatar's stable public Storage URL PATH
 * (avatars/<host_id>/avatar.webp) — a non-PII UUID embedded in a URL like any object id, and only
 * for hosts who set BOTH a name + avatar. Callers gate this on a set host name (the byline hides
 * without one), so it's a no-op for nameless hosts.
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
  return getAvatarUrl(ev.host_id, prof?.avatar_updated_at ?? null);
}

/**
 * Per-media uploader identity for an event, keyed by media id (Phase 2 attribution). A server-only
 * ADMIN read because `profiles` is own-row-RLS (`profiles_select_own`) -> a host's normal client
 * can't read guests' names; the admin client is REQUIRED (mirrors getHostAvatarUrl). Returns the
 * full identity INCLUDING email; the GUEST call sites must copy only name/isHost/isAnonymous onto
 * the client (never email). Two batched reads: the host's name (for host uploads), then all media
 * with the uploader's guest + profile. The CASE logic is the pure resolveUploaderIdentity().
 */
export async function getUploaderIdentities(
  eventId: string,
): Promise<Map<string, UploaderIdentity>> {
  const admin = createAdminClient();

  // The host's display name — attributed to host uploads (media.guest_id IS NULL). One read.
  let hostName: string | null = null;
  const { data: ev } = await admin
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .maybeSingle();
  if (ev?.host_id) {
    const { data: hp } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", ev.host_id)
      .maybeSingle();
    hostName = hp?.display_name ?? null;
  }

  // All media for the event with the uploader's guest + linked profile, one batched read.
  const { data, error } = await admin
    .from("media")
    .select(
      "id, guest_id, guests!media_guest_id_fkey(user_id, email, profiles!guests_user_id_fkey(display_name))",
    )
    .eq("event_id", eventId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<UploaderRow & { id: string }>;
  const map = new Map<string, UploaderIdentity>();
  for (const row of rows) map.set(row.id, resolveUploaderIdentity(row, hostName));
  return map;
}
