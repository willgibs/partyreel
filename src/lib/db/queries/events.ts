/**
 * Event reads for the authenticated host. Uses the RLS-scoped server client and
 * re-checks `getUser()` in every function (RLS is the security boundary; the
 * proxy is not — see CLAUDE.md). `events_host_all` already scopes rows to the
 * host, so we never filter by host_id here.
 *
 * Every read filters `deleted_at IS NULL`: soft-deleted rows persist (until the
 * Phase 3 R2 purge) but must never surface, and only deletion frees an event
 * slot (anti-abuse — see tiers.ts).
 *
 * SECURITY: these feed the host UI (incl. the "use client" EventSettingsForm), so
 * the rows are mapped to `HostEvent`, which DROPS `event_password_hash`. We read the
 * hash server-side only to derive `has_password`, then discard it — it must never be
 * serialized into a Client Component payload.
 */
import "server-only";

import { cache } from "react";

import type { Tables } from "@/lib/db/types";
import {
  RECENTLY_DELETED_WINDOW_DAYS,
  binCountdownDays,
} from "@/lib/lifecycle/recently-deleted";
import { presignDownload } from "@/lib/r2/presign";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/** A host event row with the bcrypt password hash dropped + `has_password` derived. */
export type HostEvent = Omit<Tables<"events">, "event_password_hash"> & {
  has_password: boolean;
};

function toHostEvent(row: Tables<"events">): HostEvent {
  // `event_password_hash` is referenced (to derive the boolean) but excluded from
  // `rest`, so the returned object never carries the hash.
  const { event_password_hash, ...rest } = row;
  return { ...rest, has_password: event_password_hash != null };
}

// cache() = request-scoped dedupe (the guest-events convention; see
// lib/supabase/request-auth for why it can't leak across users). getEvent is
// the real win: generateMetadata + the page render each call it, so one event
// page paid the read twice. The array-arg reads below (getEventCoverUrls,
// getEventCardStats) stay UNcached: cache() keys arguments by reference, so a
// fresh array per call would never hit.
export const listEvents = cache(async function listEvents(): Promise<
  HostEvent[]
> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toHostEvent);
});

export const getEvent = cache(async function getEvent(
  id: string,
): Promise<HostEvent | null> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? toHostEvent(data) : null;
});

/** Counts the host's existing (non-deleted) events — the number compared to
 * `MAX_EVENTS[tier]` for the dashboard's "X of N used" + cap gate. */
export async function countActiveEvents(): Promise<number> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Cover image URL per event for the dashboard cards: the newest APPROVED,
 * non-removed PHOTO's `original_key`, presigned inline. One batched query (not
 * N+1); RLS scopes to the host's own media. Events with no approved photo are
 * absent from the map (the card falls back to its no-cover surface). Keys never
 * reach the browser — we presign here.
 *
 * PHOTO-only is load-bearing: the card renders the cover in an <img>, which
 * cannot display a video file, so a newest-upload-is-a-video event would get a
 * broken (0x0) cover if videos were eligible. (A video-poster cover for
 * photo-less events is a deferred enhancement — it needs a <video> poster, not
 * an <img>.)
 */
export async function getEventCoverUrls(
  eventIds: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (eventIds.length === 0) return urls;

  const { supabase, user } = await getRequestAuth();
  if (!user) return urls;

  const { data, error } = await supabase
    .from("media")
    .select("event_id, original_key, preview_key")
    .in("event_id", eventIds)
    .eq("status", "approved")
    .eq("type", "photo")
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // newest-first → the first row seen per event_id is its cover.
  // PREFER the small WebP preview, exactly like MediaTile's `previewUrl ?? url`:
  // a dashboard of event cards was pulling the FULL-RES ORIGINAL for every card
  // on every render, so a phone loading eight cards downloaded tens of MB to
  // paint eight thumbnails. Falls back to the original for pre-preview-era rows
  // (and rows whose preview generation was skipped), so covers never vanish.
  const coverKey = new Map<string, string>();
  for (const row of data ?? []) {
    if (!coverKey.has(row.event_id))
      coverKey.set(row.event_id, row.preview_key ?? row.original_key);
  }
  const entries = await Promise.all(
    [...coverKey].map(
      async ([id, key]) => [id, await presignDownload({ key })] as const,
    ),
  );
  for (const [id, url] of entries) urls.set(id, url);
  return urls;
}

/**
 * Soft-deleted events still within the recovery window, for the dashboard's "Recently deleted"
 * tab. The INVERSE of listEvents(): `deleted_at IS NOT NULL` and within
 * RECENTLY_DELETED_WINDOW_DAYS (older ones are about to be hard-purged by the cron — don't offer
 * a restore that races it). Newest-deleted first. Covers reuse getEventCoverUrls() (a deleted
 * event's media stay non-removed, so it still resolves a cover). RLS (events_host_all) scopes to
 * the host's own rows regardless of deleted_at, so this reads only their deleted events.
 */
/** A soft-deleted event card for the dashboard bin, with the days-until-purge countdown. */
export type DeletedHostEvent = HostEvent & { countdownDays: number };

export const listRecentlyDeletedEvents = cache(
  async function listRecentlyDeletedEvents(): Promise<DeletedHostEvent[]> {
    const { supabase, user } = await getRequestAuth();
    if (!user) return [];

    // One `now` for BOTH the window filter and the per-card countdown — computed HERE (a query, not
    // a component) so the page stays render-pure (no Date.now() in RSC render; react-hooks/purity).
    const now = Date.now();
    const windowStart = new Date(
      now - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
    ).toISOString();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .not("deleted_at", "is", null)
      .gte("deleted_at", windowStart)
      .order("deleted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...toHostEvent(row),
      countdownDays: binCountdownDays(row.purge_at, now),
    }));
  },
);

/** Per-event counts for the stat-forward dashboard card (Phase 5): `approved`
 *  = what's in the album (the "N items" pill); `pending` = the amber
 *  "N to review" chip. */
export type EventCardStats = { approved: number; pending: number };

/**
 * Per-event approved + pending counts for the dashboard cards. ONE select over
 * the host's media (RLS `media_host_all` scopes it to their own events),
 * counted in JS - a host's event-count x media is bounded, so no GROUP BY RPC
 * is needed at this scale (deferred). `removed_at IS NULL` excludes the
 * recovery bin. Events with no media are present in the map with zeros.
 */
export async function getEventCardStats(
  eventIds: string[],
): Promise<Map<string, EventCardStats>> {
  const stats = new Map<string, EventCardStats>();
  if (eventIds.length === 0) return stats;
  for (const id of eventIds) stats.set(id, { approved: 0, pending: 0 });

  const { supabase, user } = await getRequestAuth();
  if (!user) return stats;

  const { data, error } = await supabase
    .from("media")
    .select("event_id, status")
    .in("event_id", eventIds)
    .is("removed_at", null);
  if (error) throw error;

  for (const row of data ?? []) {
    const s = stats.get(row.event_id);
    if (!s) continue;
    if (row.status === "approved") s.approved += 1;
    else if (row.status === "pending") s.pending += 1;
  }
  return stats;
}
