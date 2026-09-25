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
 * ★ EVERY LIST IS READ WHOLE AND EVERY COUNT IS COUNTED (the 1,000-row round,
 * 2026-09-23; the rules are `read-all.ts`' header). PostgREST answers at most
 * 1,000 rows a request with no error, so the event lists page on their own
 * display order through `readAllPages`, the number of events is a head count
 * (`countActiveEvents`), and the cards' counts and covers come from two SQL
 * functions that answer one jsonb for any number of events, their ids in the
 * POST body (`lib/dashboard/card-facts.ts`).
 *
 * SECURITY: these feed the host UI (incl. the "use client" EventSettingsForm), so
 * the rows are mapped to `HostEvent`, which DROPS `event_password_hash`. We read the
 * hash server-side only to derive `has_password`, then discard it — it must never be
 * serialized into a Client Component payload.
 */
import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  cardStillKeys,
  coverKey,
  parseEventCardStats,
  parseEventCovers,
  parseEventStills,
  type EventCardStats,
} from "@/lib/dashboard/card-facts";
import { mustQuery, QueryFailedError } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import type { Database, Tables } from "@/lib/db/types";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import {
  RECENTLY_DELETED_WINDOW_DAYS,
  binCountdownDays,
} from "@/lib/lifecycle/recently-deleted";
import { presignDownload } from "@/lib/r2/presign";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export type { EventCardStats };

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

/** A page's cursor on a newest-first list: the last row's raw timestamp string and its id. */
type NewestFirst = { at: string; id: string } | null;

// cache() = request-scoped dedupe (the guest-events convention; see
// lib/supabase/request-auth for why it can't leak across users). getEvent is
// the real win: generateMetadata + the page render each call it, so one event
// page paid the read twice. The array-arg reads below (getEventCoverUrls,
// getEventCardStats) stay UNcached: cache() keys arguments by reference, so a
// fresh array per call would never hit.
//
// Every live event, newest first, read whole: keyset pages on (created_at
// desc, id desc), the id breaking a tie so no event is skipped or read twice
// across a page boundary. A count of them is `countActiveEvents`, never this
// list's length.
export const listEvents = cache(async function listEvents(): Promise<
  HostEvent[]
> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { rows } = await readAllPages(
    "dashboard: events",
    (after: NewestFirst, limit) => {
      let q = supabase
        .from("events")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (after) {
        q = q.or(
          `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: row.created_at, id: row.id }),
  );
  return rows.map(toHostEvent);
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
 * Presigned cover URLs for the given events, on any client that may run `event_covers`: the
 * newest APPROVED, non-removed PHOTO of each, its preview when it has one (`coverKey`). One
 * request for any number of events, whatever their albums hold; an event with no approved photo
 * is absent (its card falls back to the no-cover surface). The request client reads the host's own
 * events through RLS; the service-role client (the profile and Guest cards in `social.ts`) reads
 * the events a caller has already gated. Keys never reach the browser: every one is presigned here.
 *
 * PHOTO-only is load-bearing: the card renders the cover in an <img>, which
 * cannot display a video file, so a newest-upload-is-a-video event would get a
 * broken (0x0) cover if videos were eligible. (A video-poster cover for
 * photo-less events is a deferred enhancement — it needs a <video> poster, not
 * an <img>.)
 */
export async function readCoverUrls(
  client: SupabaseClient<Database>,
  eventIds: readonly string[],
  label: string,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (eventIds.length === 0) return urls;

  const { data, error } = await client.rpc("event_covers", {
    p_event_ids: [...new Set(eventIds)],
  });
  if (error) throw new QueryFailedError(label, error);

  const entries = await Promise.all(
    [...parseEventCovers(data)].map(
      async ([id, keys]) =>
        [id, await presignDownload({ key: coverKey(keys) })] as const,
    ),
  );
  for (const [id, url] of entries) urls.set(id, url);
  return urls;
}

/** The dashboard cards' covers: `readCoverUrls` on the host's own RLS-scoped client. */
export async function getEventCoverUrls(
  eventIds: string[],
): Promise<Map<string, string>> {
  if (eventIds.length === 0) return new Map();

  const { supabase, user } = await getRequestAuth();
  if (!user) return new Map();

  return readCoverUrls(supabase, eventIds, "dashboard: event covers");
}

/** How many stills a dashboard card dissolves through: its cover and three more. */
export const CARD_STILLS = 4;

/**
 * THE HOSTED CARDS' COVERS AND THEIR CROSSFADE (`reel-host`, Will 2026-09-25: `pulse`, his note:
 * "event cards having a crossfade background would be a cool effect... if they went in order one
 * at a time"). Per event, the stills its card shows in turn: the cover first (`event_covers`, the
 * newest approved photo, its preview when it has one), then the newest previewed photos
 * (`event_stills`), none twice, at most `CARD_STILLS` (`cardStillKeys`). An event with no approved
 * photo is absent, and its card falls back to the no-cover surface.
 *
 * Two jsonb answers for any number of events, the ids in the POST body, run together; every key
 * is presigned here, once (a cover and a still of the same photo are one key), and `stable`, so a
 * refresh inside the half hour hands the card the same urls and the browser its cached images.
 * Keys never reach the browser.
 */
export async function getEventCardStills(
  eventIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (eventIds.length === 0) return out;

  const { supabase, user } = await getRequestAuth();
  if (!user) return out;

  const ids = [...new Set(eventIds)];
  const [covers, stills] = await Promise.all([
    supabase.rpc("event_covers", { p_event_ids: ids }),
    supabase.rpc("event_stills", {
      p_event_ids: ids,
      p_per_event: CARD_STILLS,
    }),
  ]);
  if (covers.error) {
    throw new QueryFailedError("dashboard: event covers", covers.error);
  }
  if (stills.error) {
    throw new QueryFailedError("dashboard: event stills", stills.error);
  }
  const coverKeys = parseEventCovers(covers.data);
  const stillKeys = parseEventStills(stills.data);

  const keysByEvent = new Map<string, string[]>();
  for (const id of ids) {
    const keys = cardStillKeys(
      coverKeys.get(id),
      stillKeys.get(id),
      CARD_STILLS,
    );
    if (keys.length > 0) keysByEvent.set(id, keys);
  }
  const unique = [...new Set([...keysByEvent.values()].flat())];
  const signed = new Map(
    await Promise.all(
      unique.map(
        async (key) =>
          [key, await presignDownload({ key, stable: true })] as const,
      ),
    ),
  );
  for (const [id, keys] of keysByEvent) {
    out.set(id, keys.map((key) => signed.get(key) ?? "").filter(Boolean));
  }
  return out;
}

/**
 * Soft-deleted events still within the recovery window, for the dashboard's "Recently deleted"
 * tab. The INVERSE of listEvents(): `deleted_at IS NOT NULL` and within
 * RECENTLY_DELETED_WINDOW_DAYS (older ones are about to be hard-purged by the cron — don't offer
 * a restore that races it). Newest-deleted first, read whole on (deleted_at desc, id desc). Covers
 * reuse getEventCoverUrls() (a deleted event's media stay non-removed, so it still resolves a
 * cover). RLS (events_host_all) scopes to the host's own rows regardless of deleted_at, so this
 * reads only their deleted events.
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

    const { rows } = await readAllPages(
      "dashboard: recently deleted events",
      (after: NewestFirst, limit) => {
        let q = supabase
          .from("events")
          .select("*")
          .not("deleted_at", "is", null)
          .gte("deleted_at", windowStart)
          .order("deleted_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);
        if (after) {
          q = q.or(
            `deleted_at.lt.${after.at},and(deleted_at.eq.${after.at},id.lt.${after.id})`,
          );
        }
        return q;
      },
      (row) => ({ at: deletedAt(row), id: row.id }),
    );
    return rows.map((row) => ({
      ...toHostEvent(row),
      countdownDays: binCountdownDays(row.purge_at, now),
    }));
  },
);

/** A binned row's deletion stamp: the bin's filter guarantees one, and a cursor without it could not advance. */
function deletedAt(row: { id: string; deleted_at: string | null }): string {
  if (!row.deleted_at) {
    throw new Error(
      `dashboard: recently deleted events: event ${row.id} has no deleted_at`,
    );
  }
  return row.deleted_at;
}

/**
 * Per-event approved + pending counts for the dashboard cards (the "N items" pill and the
 * "N to review" chip), from `event_card_stats`: one jsonb for any number of events, counted in SQL
 * over the host's own media (SECURITY INVOKER, `media_host_all`), `removed_at IS NULL` keeping the
 * recovery bin out. Every asked-for event is in the map, with zeros where nothing counts.
 */
export async function getEventCardStats(
  eventIds: string[],
): Promise<Map<string, EventCardStats>> {
  const stats = new Map<string, EventCardStats>();
  if (eventIds.length === 0) return stats;
  for (const id of eventIds) stats.set(id, { approved: 0, pending: 0 });

  const { supabase, user } = await getRequestAuth();
  if (!user) return stats;

  const { data, error } = await supabase.rpc("event_card_stats", {
    p_event_ids: [...new Set(eventIds)],
  });
  if (error) throw new QueryFailedError("dashboard: event card stats", error);

  for (const [id, s] of parseEventCardStats(data)) {
    if (stats.has(id)) stats.set(id, s);
  }
  return stats;
}

/**
 * THE LIVE REEL'S PROGRESS, PER EVENT: how many items can play, counted only as far as the reel's
 * minimum (0, 1, or `REEL_MINIMUM` meaning "that many or more"), which is all a state needs
 * (`reelState`, `lib/event/reel-progress.ts`). The dashboard's What needs you band and the old
 * Studio route's redirect read it; the hub counts off the album it already holds.
 *
 * ★ "CAN PLAY" IS SPELLED AS THE GUEST'S `isReelEligible` IS: approved and outside the bin, not a
 * clip someone added to the album (`reel_eligible`), and something drawable (a photo, or a video
 * with its poster, since the reel draws a video's still and never its file). A looser "approved"
 * count would tell a host the reel is live on an album whose guests see no reel.
 *
 * One row per event with at most `REEL_MINIMUM` media embedded, the filter a logic tree on the
 * embed (the pulse's newest-per-event shape), so the read is as long as the chunk whatever the
 * albums hold, and an event with nothing that plays comes back with an empty embed. The events are
 * the host's own through RLS; every asked-for id is in the answer, zero where nothing plays.
 */
const PLAYABLE_IN_REEL =
  "and(status.eq.approved,removed_at.is.null,reel_eligible.is.true,or(type.eq.photo,preview_key.not.is.null))";

export async function getReelProgress(
  eventIds: string[],
): Promise<Map<string, number>> {
  const progress = new Map<string, number>();
  if (eventIds.length === 0) return progress;
  for (const id of eventIds) progress.set(id, 0);

  const { supabase, user } = await getRequestAuth();
  if (!user) return progress;

  const rows = await inChunks(
    "host: reel progress",
    eventIds,
    async (chunk) =>
      (await mustQuery(
        supabase
          .from("events")
          .select("id, media!media_event_id_fkey(id)")
          .in("id", chunk)
          .or(PLAYABLE_IN_REEL, { referencedTable: "media" })
          .limit(REEL_MINIMUM, { referencedTable: "media" }),
        "host: reel progress",
      )) ?? [],
  );
  for (const row of rows) {
    if (!progress.has(row.id)) continue;
    progress.set(row.id, Math.min(row.media?.length ?? 0, REEL_MINIMUM));
  }
  return progress;
}
