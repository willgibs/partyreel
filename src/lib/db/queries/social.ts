/**
 * Social reads (profiles-social.md data layer): the public profile, owner-private
 * follow/block lists + counts, notification prefs, the guest-side hidden-event
 * set, and the host-keyed event guest list.
 *
 * Privacy invariants encoded here (do not relax in a refactor):
 *   - Follower/following LISTS AND COUNTS are private to the owner (the VSCO
 *     shape). Every "my" read is scoped by the caller's own auth.uid() row set;
 *     there is NO path to anyone else's graph.
 *   - Blocks are private to the blocker; the blocked side can never read them.
 *   - The event guest list renders ONLY when the HOST enabled show_guest_list
 *     (the profiles-social.md host key); anonymous uploads never appear (user_id IS NULL).
 */
import "server-only";

import { cache } from "react";

import type { Database } from "@/lib/db/types";
import {
  resolveNotificationPrefs,
  type NotificationPrefs,
  type NotificationPrefsRow,
} from "@/lib/social/notification-prefs";
import { captureError } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The pre-apply RUNTIME seam (the typing seam's sibling): until the orchestrator
 * applies migration 20260708120000, the social tables/columns/RPC don't exist in
 * the live DB, so these reads fail with undefined-column/table (42703/42P01) or
 * PostgREST schema-cache misses (PGRST202 missing fn, PGRST204/205 missing
 * column/table). The UI surfaces treat that as "feature not provisioned yet" and
 * render their graceful empty/hidden state, so this branch builds AND runs green
 * pre-apply. Real errors (RLS, network, bugs) still throw. Delete the call sites'
 * catch branches only if you want post-apply failures to surface louder.
 */
const MISSING_SCHEMA_CODES = new Set([
  "42703",
  "42P01",
  "PGRST202",
  "PGRST204",
  "PGRST205",
]);
export function isSocialSchemaMissing(error: unknown): boolean {
  const code = (error as { code?: string | null } | null)?.code ?? "";
  const missing = MISSING_SCHEMA_CODES.has(code);
  // The migration is APPLIED (2026-07-08), so this should never fire again: if it
  // does, a refactor broke a real column/table/RPC. Surface it loudly instead of
  // silently downgrading the product; the graceful return still protects the render.
  if (missing) {
    captureError("other", error, { seam: "social_schema_missing", code });
  }
  return missing;
}

/** The public-by-existence card fields (profiles-social.md point 3). */
export type SocialProfileCard = {
  id: string;
  displayName: string | null;
  slug: string | null;
  /** profiles.avatar_updated_at: null = no avatar; else the cache-busting marker. */
  avatarMarker: string | null;
};

export type FollowEntry = SocialProfileCard & { followedAt: string };
export type BlockEntry = SocialProfileCard & { blockedAt: string };

/**
 * Hydrate profile cards for an id list via the ADMIN client. WHY admin:
 * profiles RLS is deliberately own-row (`profiles_select_own`), and these card
 * fields (name/slug/avatar marker) are public by existence per profiles-social.md, so
 * reading them server-side for ids the caller ALREADY holds (their own
 * RLS-scoped follow/block rows, or a show_guest_list-gated uploader set) leaks
 * nothing new. Never pass ids that did not come from such a scoped read.
 * Explicit id-list join (not a PostgREST embed): user_follows/user_blocks carry
 * TWO profiles FKs, so a bare embed would be PGRST201-ambiguous anyway.
 */
async function getProfileCards(
  ids: string[],
): Promise<Map<string, SocialProfileCard>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id, display_name, slug, avatar_updated_at")
    .in("id", ids);
  if (error) throw error;
  return new Map(
    (data ?? []).map(
      (p: {
        id: string;
        display_name: string | null;
        slug: string | null;
        avatar_updated_at: string | null;
      }) => [
        p.id,
        {
          id: p.id,
          displayName: p.display_name,
          slug: p.slug,
          avatarMarker: p.avatar_updated_at,
        },
      ],
    ),
  );
}

/** Profiles I follow, newest first. Owner-private: [] when signed out. */
export async function getMyFollowing(): Promise<FollowEntry[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_follows")
    .select("followee_id, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    if (isSocialSchemaMissing(error)) return []; // pre-apply
    throw error;
  }

  const rows = (data ?? []) as { followee_id: string; created_at: string }[];
  const cards = await getProfileCards(rows.map((r) => r.followee_id));
  return rows.flatMap((r) => {
    const card = cards.get(r.followee_id);
    return card ? [{ ...card, followedAt: r.created_at }] : [];
  });
}

/** Profiles following me, newest first. Owner-private: [] when signed out. */
export async function getMyFollowers(): Promise<FollowEntry[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("followee_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    if (isSocialSchemaMissing(error)) return []; // pre-apply
    throw error;
  }

  const rows = (data ?? []) as { follower_id: string; created_at: string }[];
  const cards = await getProfileCards(rows.map((r) => r.follower_id));
  return rows.flatMap((r) => {
    const card = cards.get(r.follower_id);
    return card ? [{ ...card, followedAt: r.created_at }] : [];
  });
}

/** My follow counts. Owner-private (never exposed on the public profile). */
export async function getMyFollowCounts(): Promise<{
  following: number;
  followers: number;
}> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return { following: 0, followers: 0 };

  const [following, followers] = await Promise.all([
    supabase
      .from("user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", user.id),
    supabase
      .from("user_follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("followee_id", user.id),
  ]);
  if (
    isSocialSchemaMissing(following.error) ||
    isSocialSchemaMissing(followers.error)
  ) {
    return { following: 0, followers: 0 }; // pre-apply
  }
  if (following.error) throw following.error;
  if (followers.error) throw followers.error;
  return {
    following: following.count ?? 0,
    followers: followers.count ?? 0,
  };
}

/**
 * Whether I follow this profile (the follow-button state). NOTE: under a block
 * this is false BY DESIGN (block severed the row), and followUser stays a
 * silent no-op, so the button never confirms a block exists.
 */
export async function isFollowing(profileId: string): Promise<boolean> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return false;

  const { count, error } = await supabase
    .from("user_follows")
    .select("followee_id", { count: "exact", head: true })
    .eq("follower_id", user.id)
    .eq("followee_id", profileId);
  if (error) {
    if (isSocialSchemaMissing(error)) return false; // pre-apply
    throw error;
  }
  return (count ?? 0) > 0;
}

/** Profiles I blocked, newest first. Blocker-private. */
export async function getMyBlocks(): Promise<BlockEntry[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    if (isSocialSchemaMissing(error)) return []; // pre-apply
    throw error;
  }

  const rows = (data ?? []) as { blocked_id: string; created_at: string }[];
  const cards = await getProfileCards(rows.map((r) => r.blocked_id));
  return rows.flatMap((r) => {
    const card = cards.get(r.blocked_id);
    return card ? [{ ...card, blockedAt: r.created_at }] : [];
  });
}

/**
 * My effective notification prefs. Rows are LAZY (absent = all defaults), so
 * this always resolves through resolveNotificationPrefs; R5 send paths must
 * consult this, never the raw row.
 */
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return resolveNotificationPrefs(null);

  const { data, error } = await supabase
    .from("notification_prefs")
    .select(
      "notify_reel_ready, notify_album_shared, notify_new_uploads_digest, notify_new_follower, marketing_opt_in",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    if (isSocialSchemaMissing(error)) return resolveNotificationPrefs(null);
    throw error;
  }
  return resolveNotificationPrefs(data as NotificationPrefsRow | null);
}

/** Event ids I hid from my own public profile (profiles-social.md point 2). */
export async function getMyHiddenEventIds(): Promise<string[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profile_hidden_events")
    .select("event_id")
    .eq("user_id", user.id);
  if (error) {
    if (isSocialSchemaMissing(error)) return []; // pre-apply
    throw error;
  }
  return ((data ?? []) as { event_id: string }[]).map((r) => r.event_id);
}

// ── The public profile (/u/[slug]) ───────────────────────────────────────────

/** Keys mirror the get_public_profile jsonb payload (snake_case, like GuestEvent). */
export type PublicProfileHostedEvent = {
  id: string;
  name: string;
  event_date: string | null;
  visibility: Database["public"]["Enums"]["event_visibility"];
  /** The album link capability. Present because the HOST chose display_in_profile
   *  (publishing the link is the point: link-in-bio); password/private events
   *  still gate entry at the /e/ page. */
  qr_token: string;
  custom_slug: string | null;
};

export type PublicProfileAttendedEvent = {
  id: string;
  name: string;
  event_date: string | null;
  // Deliberately NO qr_token: attendance is not a capability grant (the RPC
  // never hands out an album link the host didn't publish). The id IS returned
  // and is safe to hold: it opens nothing on its own, and the cover presign
  // below re-proves every gate before it turns one into a picture.
};

export type PublicProfile = {
  id: string;
  slug: string;
  display_name: string | null;
  /** The one line a person writes about themselves (migration 20260919120000). */
  bio: string | null;
  avatar_updated_at: string | null;
  created_at: string;
  hosted_events: PublicProfileHostedEvent[];
  attended_events: PublicProfileAttendedEvent[];
};

/**
 * The logged-out-visible public profile read (the anon get_public_profile RPC;
 * the 4th member of the accepted anon-read set). null = no such handle; we
 * never distinguish "no user" from "user without a slug" (don't leak existence).
 * Composition lives IN the RPC per the ADR: hosted events the host displays +
 * attended events (show_guest_list on, approved upload) minus the owner's
 * profile_hidden_events.
 */
const getPublicProfileCached = cache(
  async (slug: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_profile", {
      p_slug: slug,
    });
    if (error) {
      if (isSocialSchemaMissing(error)) return null;
      throw error;
    }
    return (data as PublicProfile | null) ?? null;
  },
);

export async function getPublicProfile(
  slug: string,
): Promise<PublicProfile | null> {
  // Normalize BEFORE the cache boundary: generateMetadata passes the raw slug and
  // the page lowercases, so without this they would miss each other's per-request
  // cache() entry and issue the RPC twice (the RPC lower(trim())s regardless).
  return getPublicProfileCached(slug.trim().toLowerCase());
}

/**
 * Cover URLs for a public profile's HOSTED events, keyed by event id — the /u/
 * page's grid art. OPEN events only (the saved-events masking rule: password
 * media is entry-gated, private is locked), so a presign happens only where a
 * public thumbnail is already allowed on the album itself. Admin read because
 * the viewer may be anonymous; the id list came from the display_in_profile-
 * gated RPC, so nothing new leaks. Same newest-approved-photo rule as
 * getEventCoverUrls (photo-only is load-bearing there; same reason here).
 */
export async function getPublicProfileCoverUrls(
  events: PublicProfileHostedEvent[],
): Promise<Map<string, string>> {
  const openIds = events
    .filter((e) => e.visibility === "open")
    .map((e) => e.id);
  return adminCoverUrls(openIds);
}

/**
 * Cover URLs for the events this person ATTENDED — the other half of the /u/
 * grid since Will's `made-of=covers` (2026-09-19): "rather than a separate
 * 'also at' section, maybe we could just have host/guest UI on each event card
 * to denote within a single group".
 *
 * ★ IT RE-PROVES ALL THREE GATES BEFORE IT PRESIGNS, and that is the whole
 * function. get_public_profile already applied them (the host's show_guest_list
 * key, visibility = 'open', the guest's own profile_hidden_events) and a caller
 * that passed its payload straight through would be correct today — but this
 * turns an event id into a PHOTOGRAPH from someone else's album, so it proves
 * the scope itself rather than inheriting it from whoever called. One extra
 * round trip on a page that already does several; a presign is the wrong place
 * to be clever.
 *
 * Cheap by construction: both reads are id-scoped `.in()` lookups on the set
 * the RPC already narrowed, and an empty set short-circuits before either.
 * Admin client because the viewer may be anonymous (events RLS is host-only).
 */
export async function getPublicProfileAttendedCoverUrls(
  profileId: string,
  events: PublicProfileAttendedEvent[],
): Promise<Map<string, string>> {
  const ids = events.map((e) => e.id);
  if (ids.length === 0) return new Map();

  const admin = createAdminClient();
  try {
    // Gates 1 and 2: the host's key is still on and the album is still open.
    const { data: open, error } = await admin
      .from("events")
      .select("id")
      .in("id", ids)
      .eq("show_guest_list", true)
      .eq("visibility", "open")
      .is("deleted_at", null);
    if (error) throw error;
    const allowed = new Set((open ?? []).map((e) => e.id));
    if (allowed.size === 0) return new Map();

    // Gate 3: the guest's own hide. Scoped to THIS profile's rows, never the
    // viewer's (the viewer may be anonymous; the hide belongs to the page's
    // owner). Admin read: profile_hidden_events RLS is owner-only.
    const { data: hidden, error: hiddenError } = await admin
      .from("profile_hidden_events")
      .select("event_id")
      .eq("user_id", profileId)
      .in("event_id", [...allowed]);
    if (hiddenError) throw hiddenError;
    for (const row of hidden ?? []) allowed.delete(row.event_id);

    return adminCoverUrls([...allowed]);
  } catch (error) {
    if (isSocialSchemaMissing(error)) return new Map();
    throw error;
  }
}

async function adminCoverUrls(
  eventIds: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (eventIds.length === 0) return urls;

  const { data, error } = await createAdminClient()
    .from("media")
    .select("event_id, original_key")
    .in("event_id", eventIds)
    .eq("status", "approved")
    .eq("type", "photo")
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const coverKey = new Map<string, string>();
  for (const row of data ?? []) {
    if (!coverKey.has(row.event_id))
      coverKey.set(row.event_id, row.original_key);
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
 * Whether a block exists between the two users in EITHER direction — the
 * server-side gate that hides the follow affordance on /u/[slug]. Admin read on
 * purpose: "they blocked me" is invisible to my RLS BY DESIGN, but the page must
 * not offer a follow button that can only silently no-op. The result is used
 * solely to render-or-not (never which direction), so the block stays private.
 */
export async function isBlockedEitherWay(
  viewerId: string,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("user_blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${viewerId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${viewerId})`,
    )
    .limit(1);
  if (error) {
    if (isSocialSchemaMissing(error)) return false;
    throw error;
  }
  return (data ?? []).length > 0;
}

/** Whether *I* blocked this profile (drives the Unblock affordance on /u/). */
export async function hasBlocked(
  viewerId: string,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", viewerId)
    .eq("blocked_id", profileId)
    .limit(1);
  if (error) {
    if (isSocialSchemaMissing(error)) return false;
    throw error;
  }
  return (data ?? []).length > 0;
}

/** My own handle (profiles.slug), for the /account claim control. */
export async function getMyProfileSlug(): Promise<string | null> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    if (isSocialSchemaMissing(error)) return null;
    throw error;
  }
  return (data as { slug: string | null } | null)?.slug ?? null;
}

// ── The account surface (settings reads) ─────────────────────────────────────

export type AttendedEventSetting = {
  id: string;
  name: string;
  event_date: string | null;
  /** In my profile_hidden_events set (the per-event hide toggle is OFF). */
  hiddenFromProfile: boolean;
};

/**
 * Events I ATTENDED (signed-in guest rows with >= 1 approved upload, host
 * differs), for the /account per-event hide-from-my-profile toggles. Mirrors the
 * RPC's attended arm MINUS the show_guest_list filter, deliberately: the hide
 * toggle is MY key and must stay settable even while the host's key is off (so
 * flipping show_guest_list on later never surprises a guest who already hid the
 * event). Admin read: events RLS is host-only and guests has no authenticated
 * read; scoped hard to the caller's own guest rows.
 */
export async function getMyAttendedEvents(): Promise<AttendedEventSetting[]> {
  const { user } = await getRequestAuth();
  if (!user) return [];

  const admin = createAdminClient();
  try {
    const { data: guests, error: guestsError } = await admin
      .from("guests")
      .select("id, event_id")
      .eq("user_id", user.id);
    if (guestsError) throw guestsError;
    if (!guests || guests.length === 0) return [];

    const { data: approved, error: mediaError } = await admin
      .from("media")
      .select("guest_id")
      .in(
        "guest_id",
        guests.map((g) => g.id),
      )
      .eq("status", "approved");
    if (mediaError) throw mediaError;

    const approvedGuestIds = new Set((approved ?? []).map((m) => m.guest_id));
    const eventIds = [
      ...new Set(
        guests.filter((g) => approvedGuestIds.has(g.id)).map((g) => g.event_id),
      ),
    ];
    if (eventIds.length === 0) return [];

    const eventsRes = await admin
      .from("events")
      .select("id, name, event_date, host_id")
      .in("id", eventIds)
      .neq("host_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (eventsRes.error) throw eventsRes.error;
    const hidden = new Set(await getMyHiddenEventIds());
    return (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      event_date: e.event_date,
      hiddenFromProfile: hidden.has(e.id),
    }));
  } catch (error) {
    if (isSocialSchemaMissing(error)) return [];
    throw error;
  }
}

// ── The event guest list (the profiles-social.md host key) ─────────────────────────────

export type GuestListEntry = SocialProfileCard;

/**
 * The named "Guests (N)" list for an event: ALL signed-in uploaders with at
 * least one APPROVED media (approved = what the album shows; mirrors the
 * attended-events arm of get_public_profile, so the two surfaces always agree).
 * Anonymous uploads (guests.user_id IS NULL) never appear.
 *
 * Returns null when the host has NOT enabled show_guest_list, so callers can't
 * accidentally render a list the host key doesn't authorize; [] means "on, but
 * no signed-in uploaders yet".
 *
 * WHY the admin client: this is server-side composition for BOTH surfaces (the
 * host event page after getUser() ownership, and the guest /e/ page after the
 * qr_token capability + password gate). Neither anon nor authenticated has (or
 * should get) table reads across guests/profiles, and the show_guest_list
 * re-check HERE is the authorization: the host key gates the data, not the
 * caller's row access. Callers MUST have already passed their surface's access
 * gate; never call this with an unvalidated event id.
 * No block filtering: the guest list is an event surface keyed by the host,
 * not a social graph surface (blocks shape follows only, profiles-social.md).
 */
export async function getEventGuestList(
  eventId: string,
): Promise<GuestListEntry[] | null> {
  const admin = createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("show_guest_list")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (eventError && isSocialSchemaMissing(eventError)) return null; // pre-apply
  if (eventError) throw eventError;
  if (!event || !(event as { show_guest_list: boolean }).show_guest_list) {
    return null;
  }

  // Explicit id-list joins (no embeds): signed-in guest rows -> approved media
  // presence -> profile cards. media stays admin-read with explicit columns
  // (never select("*") on media: the hold columns are host-invisible, trust-safety-forensics.md).
  const { data: guests, error: guestsError } = await admin
    .from("guests")
    .select("id, user_id")
    .eq("event_id", eventId)
    .not("user_id", "is", null);
  if (guestsError) throw guestsError;
  if (!guests || guests.length === 0) return [];

  const { data: approved, error: mediaError } = await admin
    .from("media")
    .select("guest_id")
    .in(
      "guest_id",
      guests.map((g) => g.id),
    )
    .eq("status", "approved");
  if (mediaError) throw mediaError;

  const approvedGuestIds = new Set((approved ?? []).map((m) => m.guest_id));
  // De-dupe by user: the same account can hold several guest rows (per-device
  // sessions); the list names PEOPLE, not sessions.
  const userIds = [
    ...new Set(
      guests
        .filter((g) => approvedGuestIds.has(g.id))
        .map((g) => g.user_id as string),
    ),
  ];

  const cards = await getProfileCards(userIds);
  return userIds
    .flatMap((id) => {
      const card = cards.get(id);
      return card ? [card] : [];
    })
    .sort((a, b) =>
      (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
        sensitivity: "base",
      }),
    );
}

/** The host's own view of the two social keys, for the event settings card.
 *  null = the social schema isn't provisioned yet (pre-apply) OR the event
 *  isn't the caller's — either way the card hides. RLS scopes the row. */
export async function getEventSocialSettings(eventId: string): Promise<{
  displayInProfile: boolean;
  showGuestList: boolean;
} | null> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return null;

  const { data, error } = await supabase
    .from("events")
    .select("display_in_profile, show_guest_list")
    .eq("id", eventId)
    .maybeSingle();
  if (error) {
    if (isSocialSchemaMissing(error)) return null;
    throw error;
  }
  if (!data) return null;
  const row = data as {
    display_in_profile: boolean;
    show_guest_list: boolean;
  };
  return {
    displayInProfile: row.display_in_profile,
    showGuestList: row.show_guest_list,
  };
}

// ── The dashboard Following section ──────────────────────────────────────────

export type FollowedEventCard = {
  eventId: string;
  name: string;
  event_date: string | null;
  hostName: string | null;
  /** /e/<custom_slug ?? qr_token> — present because the host PUBLISHED the
   *  event to their profile (display_in_profile); private/password still gate
   *  at the /e/ page, mirroring the public-profile hosted arm. */
  href: string;
  coverUrl: string | null;
};

/**
 * Events by hosts I follow, for the dashboard "Following" chip: the union of my
 * followees' PUBLISHED events (display_in_profile on, not deleted), newest
 * first. The exact set each host's /u/ page shows, so following someone is
 * "their profile, delivered". Covers follow the same open-only masking as the
 * profile grid. Owner-private input (my follow rows) + published-only output,
 * so nothing leaks that /u/ doesn't already show.
 */
export async function getFollowedHostEventCards(): Promise<
  FollowedEventCard[]
> {
  const following = await getMyFollowing();
  if (following.length === 0) return [];
  const hostNames = new Map(following.map((f) => [f.id, f.displayName]));

  try {
    const { data, error } = await createAdminClient()
      .from("events")
      .select(
        "id, name, event_date, visibility, qr_token, custom_slug, host_id, created_at",
      )
      .in("host_id", [...hostNames.keys()])
      .eq("display_in_profile", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as {
      id: string;
      name: string;
      event_date: string | null;
      visibility: Database["public"]["Enums"]["event_visibility"];
      qr_token: string;
      custom_slug: string | null;
      host_id: string;
    }[];
    const covers = await adminCoverUrls(
      rows.filter((r) => r.visibility === "open").map((r) => r.id),
    );
    return rows.map((r) => ({
      eventId: r.id,
      name: r.name,
      event_date: r.event_date,
      hostName: hostNames.get(r.host_id) ?? null,
      href: `/e/${r.custom_slug ?? r.qr_token}`,
      coverUrl: covers.get(r.id) ?? null,
    }));
  } catch (error) {
    if (isSocialSchemaMissing(error)) return [];
    throw error;
  }
}
