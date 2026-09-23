/**
 * Social reads (profiles-social.md data layer): the public profile, owner-private
 * follow/block lists + counts, notification prefs, the guest-side shown-event
 * opt-in set, the host-keyed event guest list, and the ONE count of an event's guests.
 *
 * ★ A PERSON IS A GUEST OF AN EVENT ONLY THROUGH AN UPLOAD OF THEIRS (guest by upload, Will
 * 2026-09-22). Every "who is a guest here" read in this module goes through `getEventGuests` (an
 * APPROVED upload, what other people see), and every "which events has this account added to"
 * read goes through `myLiveUploads` (any LIVE upload, the account's own view). A `guests` row is
 * the device's upload ticket and is never read as attendance on its own.
 *
 * Privacy invariants encoded here (do not relax in a refactor):
 *   - Follower/following LISTS AND COUNTS are private to the owner (the VSCO
 *     shape). Every "my" read is scoped by the caller's own auth.uid() row set;
 *     there is NO path to anyone else's graph.
 *   - Blocks are private to the blocker; the blocked side can never read them.
 *   - The event guest list renders ONLY when the HOST enabled show_guest_list
 *     (the profiles-social.md host key); a nameless upload never appears, and a named guest who
 *     proved no email is listed as a plain name with the mark, never as a profile card.
 *   - ★ NO ADDRESS EVER LEAVES THIS MODULE (the guest identity round, 2026-09-22). `guests` reads
 *     here name their columns, and `pending_email` is never one of them: the unproved address a
 *     guest types at the door is inert, and the host sees a badge, never an address. The column is
 *     outside the host's PostgREST grant as a belt, and social.guest-identity.test.ts pins the
 *     SELECT so an admin-client read here can never widen past it.
 *   - A public profile publishes NOTHING until its owner chooses (his "Nothing until chosen"):
 *     `profile_shown_events` is an opt-IN, and the empty set is the default rather than a failure.
 */
import "server-only";

import { cache } from "react";

import {
  guestEventCardProps,
  sortGuestEventCards,
  type GuestEventCardData,
} from "@/lib/dashboard/guest-events";
import type { Database } from "@/lib/db/types";
import {
  resolveEventGuests,
  type EventGuests,
  type GuestRowFacts,
} from "@/lib/events/event-guests";
import {
  resolveNotificationPrefs,
  type NotificationPrefs,
  type NotificationPrefsRow,
} from "@/lib/social/notification-prefs";
import { captureError } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
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

/**
 * PostgREST clamps every response to `max_rows` (1000 on this project), so a list that can outgrow
 * one page is read to exhaustion. The first page asks for an exact count, which makes the common
 * case (everything fits) a single round trip; a longer set pages on by what actually came back, in
 * a stable order the caller's query sets.
 */
const PAGE = 1000;
type Page<T> = PromiseLike<{
  data: T[] | null;
  count?: number | null;
  error: unknown;
}>;
async function readAll<T>(
  page: (from: number, to: number) => Page<T>,
): Promise<T[]> {
  const first = await page(0, PAGE - 1);
  if (first.error) throw first.error;
  const rows = [...(first.data ?? [])];
  const total = first.count ?? rows.length;
  while (rows.length < total) {
    const next = await page(rows.length, rows.length + PAGE - 1);
    if (next.error) throw next.error;
    const batch = next.data ?? [];
    if (batch.length === 0) break;
    rows.push(...batch);
  }
  return rows;
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

/**
 * Event ids I have CHOSEN to publish on my own public profile.
 *
 * ★ THE INVERSION (the guest identity round, Will 2026-09-22: "Nothing until chosen"). This used to
 * be `getMyHiddenEventIds` over `profile_hidden_events`, an opt-OUT: every event you attended was
 * public until you went and hid it, which published people who had never asked to be published. The
 * opt-IN table `profile_shown_events` replaces it, and the empty set is now the DEFAULT rather than
 * a failure to act. `profile_hidden_events` stays on disk until a later migration drops it, and
 * NOTHING reads or writes it any more.
 */
export async function getMyShownEventIds(): Promise<string[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profile_shown_events")
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
 * attended events (show_guest_list on, an approved upload, the guest VERIFIED)
 * intersected with the owner's own profile_shown_events opt-in — so a profile
 * publishes nothing at all until its owner chooses (the guest identity round).
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
 * page's grid art. OPEN events only (the album's own masking rule: password
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
 * ★ IT RE-PROVES THE OWNER'S FOUR GATES BEFORE IT PRESIGNS, and that is the
 * whole function. get_public_profile already applied them (the host's
 * show_guest_list key, visibility = 'open', the guest's own profile_shown_events,
 * and an APPROVED upload of the owner's on a PROVED row: guest by upload,
 * 2026-09-22, where a person is a guest only through an upload) and a caller that
 * passed its payload straight through would be correct today — but this turns an
 * event id into a PHOTOGRAPH from someone else's album, so it proves the scope
 * itself rather than inheriting it from whoever called. A presign is the wrong
 * place to be clever. The VIEWER's gates (the album's confirmed-email and upload
 * doors) are the RPC's alone: this read takes no viewer, so the covers inherit
 * them through the ids the RPC returned.
 *
 * Cheap by construction: every read is an id-scoped lookup on the set the RPC
 * already narrowed, and an empty set short-circuits before the next.
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

    // Gate 3: the guest's own CHOICE. Inverted by the guest identity round (2026-09-22): an event
    // is published because its owner put a row in `profile_shown_events`, never because they failed
    // to hide it, so the set that survives is the INTERSECTION and an empty answer is the correct
    // default for someone who has chosen nothing. Scoped to THIS profile's rows, never the viewer's
    // (the viewer may be anonymous; the choice belongs to the page's owner). Admin read:
    // profile_shown_events RLS is owner-only.
    const { data: shown, error: shownError } = await admin
      .from("profile_shown_events")
      .select("event_id")
      .eq("user_id", profileId)
      .in("event_id", [...allowed]);
    if (shownError) throw shownError;
    const chosen = new Set((shown ?? []).map((row) => row.event_id));
    for (const id of [...allowed]) if (!chosen.has(id)) allowed.delete(id);
    if (allowed.size === 0) return new Map();

    // Gate 4: the owner is a guest there, as the public line requires: an APPROVED upload of theirs
    // on a PROVED row (`verified_at`, never a bare user id). A choice survives the owner's last
    // removal (profile_shown_events keeps it), and this gate is what hides the picture meanwhile.
    const attended = await readAll<{ event_id: string }>(
      (from, to) =>
        admin
          .from("media")
          .select(
            "event_id, guests!media_guest_id_fkey!inner(user_id, verified_at)",
            { count: "exact" },
          )
          .in("event_id", [...allowed])
          .eq("status", "approved")
          .eq("guests.user_id", profileId)
          .not("guests.verified_at", "is", null)
          .order("id", { ascending: true })
          .range(from, to) as unknown as Page<{ event_id: string }>,
    );
    const proved = new Set(attended.map((row) => row.event_id));
    for (const id of [...allowed]) if (!proved.has(id)) allowed.delete(id);
    if (allowed.size === 0) return new Map();

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

// ── The events you added to (guest by upload) ───────────────────────────────

type MediaStatus = Database["public"]["Enums"]["media_status"];

/** One live upload of mine, with the facts of the guest row it rides on. */
type MyLiveUpload = {
  eventId: string;
  status: MediaStatus;
  createdAt: string;
  /** The row is a PROVED identity (`verified_at`), which is what may attend in public. */
  verified: boolean;
};

/**
 * EVERY LIVE UPLOAD OF MINE, the one read behind "the events you added to" (guest by upload, Will
 * 2026-09-22: "Uploaded 1 photo? You're a guest."). A LIVE upload is any status but `removed`:
 * pending, approved or hidden. Both of this module's account lists are views of it, so they can
 * never disagree about which events a person has put something into:
 *   - the dashboard's Guest cards take ANY live upload (it is the person's own list);
 *   - the Account page's "show on my profile" switches take an APPROVED upload on a PROVED row,
 *     because those switches decide what other people see, and the public line needs exactly that.
 *
 * One read: media inner-joined to its guest row (the single FK `media_guest_id_fkey`, the embed
 * `getUploaderIdentities` already rides) and filtered on the row's owner, so only the account's own
 * rows are ever read and no id list travels in the URL. Admin client: `guests` has no client grant
 * at all, and `media` is host-scoped RLS. The caller passes the id `getUser()` verified.
 */
async function myLiveUploads(userId: string): Promise<MyLiveUpload[]> {
  const rows = await readAll<{
    event_id: string;
    status: MediaStatus;
    created_at: string;
    guests: { verified_at: string | null } | null;
  }>((from, to) =>
    createAdminClient()
      .from("media")
      .select(
        "event_id, status, created_at, guests!media_guest_id_fkey!inner(user_id, verified_at)",
        { count: "exact" },
      )
      .eq("guests.user_id", userId)
      .neq("status", "removed")
      .order("id", { ascending: true })
      .range(from, to) as unknown as Page<{
      event_id: string;
      status: MediaStatus;
      created_at: string;
      guests: { verified_at: string | null } | null;
    }>,
  );
  return rows.map((r) => ({
    eventId: r.event_id,
    status: r.status,
    createdAt: r.created_at,
    verified: Boolean(r.guests?.verified_at),
  }));
}

export type AttendedEventSetting = {
  id: string;
  name: string;
  event_date: string | null;
  /** In my profile_shown_events set: I have chosen to publish this one. Default FALSE. */
  shownOnProfile: boolean;
};

/**
 * The events I ADDED PHOTOS TO that my profile could show, for the per-event "show this on my
 * profile" switches: an APPROVED upload on a PROVED row (`verified_at`), at an event I do not host.
 * That is exactly what the RPC's attended arm requires of the page's owner, MINUS the host-side
 * gates (show_guest_list, visibility, the album's viewer gates), deliberately: the choice is MY key
 * and must stay settable whatever the host does, so flipping show_guest_list on later never
 * surprises a guest who chose to publish, or one who never did. A switch for an event whose line
 * could never show (a typed name, nothing approved) would be a switch that does nothing, so it is
 * not offered. Admin read (see `myLiveUploads`), scoped hard to the caller's own rows.
 */
export async function getMyAttendedEvents(): Promise<AttendedEventSetting[]> {
  const { user } = await getRequestAuth();
  if (!user) return [];

  const admin = createAdminClient();
  try {
    const uploads = await myLiveUploads(user.id);
    const eventIds = [
      ...new Set(
        uploads
          .filter((u) => u.verified && u.status === "approved")
          .map((u) => u.eventId),
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
    const shown = new Set(await getMyShownEventIds());
    return (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      event_date: e.event_date,
      shownOnProfile: shown.has(e.id),
    }));
  } catch (error) {
    if (isSocialSchemaMissing(error)) return [];
    throw error;
  }
}

/**
 * THE EVENTS YOU ADDED TO, as the dashboard's Guest cards (guest by upload, Will 2026-09-22:
 * "uploading to an event is now effectively saving"). Every event where this account holds a live
 * upload, excluding deleted events and events it hosts (those are its own cards), newest first by
 * its own latest live upload. A card leaves the moment its last live upload does, because this list
 * is read from the uploads themselves.
 *
 * Masked by the album's own rules (`guestEventCardProps`, lib/dashboard/guest-events.ts): a private
 * album blank and locked, a password album linked with no cover, and covers only for OPEN albums,
 * through `adminCoverUrls` (the newest approved photograph, the same rule every other card uses).
 * Admin reads, scoped hard to the caller's own rows.
 */
export async function getMyGuestEventCards(): Promise<GuestEventCardData[]> {
  const { user } = await getRequestAuth();
  if (!user) return [];

  const admin = createAdminClient();
  try {
    const uploads = await myLiveUploads(user.id);
    const latest = new Map<string, string>();
    for (const u of uploads) {
      const seen = latest.get(u.eventId);
      if (!seen || u.createdAt > seen) latest.set(u.eventId, u.createdAt);
    }
    if (latest.size === 0) return [];

    const eventsRes = await admin
      .from("events")
      .select("id, name, event_date, visibility, qr_token, host_id")
      .in("id", [...latest.keys()])
      .neq("host_id", user.id)
      .is("deleted_at", null);
    if (eventsRes.error) throw eventsRes.error;
    const events = eventsRes.data ?? [];
    if (events.length === 0) return [];

    const hostIds = [...new Set(events.map((e) => e.host_id))];
    const [hostsRes, covers] = await Promise.all([
      admin.from("profiles").select("id, display_name").in("id", hostIds),
      adminCoverUrls(
        events.filter((e) => e.visibility === "open").map((e) => e.id),
      ),
    ]);
    if (hostsRes.error) throw hostsRes.error;
    const hostNames = new Map(
      (hostsRes.data ?? []).map((h) => [h.id, h.display_name] as const),
    );

    return sortGuestEventCards(
      events.map((e) =>
        guestEventCardProps(
          {
            eventId: e.id,
            name: e.name,
            eventDate: e.event_date,
            visibility: e.visibility,
            qrToken: e.qr_token,
            hostName: hostNames.get(e.host_id) ?? null,
            lastUploadAt: latest.get(e.id) as string,
          },
          covers.get(e.id) ?? null,
        ),
      ),
    );
  } catch (error) {
    if (isSocialSchemaMissing(error)) return [];
    throw error;
  }
}

// ── Who is a guest here: the one count, and the list built on it ─────────────────────

/**
 * THE ONE COUNT (guest by upload, Will 2026-09-22: "Uploaded 1 photo? You're a guest."). Every
 * surface that says how many guests an event has, or lists them, reads this and nothing else: the
 * hub's Guests card and header (host), the album's "N photos & videos from M guests" (guest), and
 * the guest list itself. A guest is somebody with an APPROVED upload here (what other people see is
 * what the album shows); a confirmed guest counts once per person, a named unconfirmed one once per
 * row, never the host and never a nameless row (`resolveEventGuests`, lib/events/event-guests.ts).
 *
 * ★ TWO QUERIES KEYED ON `event_id`, NEVER AN `.in()` OF GUEST IDS: a party's row count is
 * unbounded, and an id list rides the URL, so the old shape (rows first, then their media by id)
 * grew its request with the party. Both sets are read to exhaustion past PostgREST's row cap.
 * Admin client: `guests` has no client grant and `media` is host-scoped RLS; every caller runs this
 * AFTER its own access gate (the hub's ownership, the album's resolved access), and only numbers or
 * names the album already shows ever leave it. An event that is missing or deleted has no guests.
 */
export const getEventGuests = cache(async function getEventGuests(
  eventId: string,
): Promise<EventGuests> {
  // cache(): request-scoped, because the album page asks twice in one render (its header's count
  // and its guest list), and the answer cannot change between them.
  const admin = createAdminClient();
  const [eventRes, approved, rows] = await Promise.all([
    admin
      .from("events")
      .select("host_id")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle(),
    readAll<{ guest_id: string | null }>(
      (from, to) =>
        admin
          .from("media")
          .select("guest_id", { count: "exact" })
          .eq("event_id", eventId)
          .eq("status", "approved")
          .not("guest_id", "is", null)
          .order("id", { ascending: true })
          .range(from, to) as unknown as Page<{ guest_id: string | null }>,
    ),
    // ★ `verified_at` and `display_name` are NOT granted to `authenticated` (guests has no client
    // grant at all), which is why this read is on the admin client; and the SELECT names its four
    // columns and no address (social.guest-identity.test.ts pins it).
    readAll<GuestRowFacts>(
      (from, to) =>
        admin
          .from("guests")
          .select("id, user_id, display_name, verified_at", { count: "exact" })
          .eq("event_id", eventId)
          .order("id", { ascending: true })
          .range(from, to) as unknown as Page<GuestRowFacts>,
    ),
  ]);
  if (eventRes.error) throw eventRes.error;
  if (!eventRes.data) return { verifiedUserIds: [], unverifiedRows: [] };

  return resolveEventGuests({
    hostId: eventRes.data.host_id,
    approvedGuestIds: new Set(
      approved.flatMap((m) => (m.guest_id ? [m.guest_id] : [])),
    ),
    rows,
  });
});

export type GuestListEntry = SocialProfileCard;

/**
 * A NAMED GUEST WHO NEVER PROVED AN EMAIL (Will, `unproven=shown-marked` + "Listed, with the
 * mark", 2026-09-21). There is no profile behind them, so there is no card, no handle and no
 * avatar to hydrate — only the name they typed at the door, and the `id` is their GUEST ROW's,
 * never a user id. The `kind` tag is what lets a caller split the union; a profile entry carries
 * no tag, so `"kind" in entry` is the discriminator and the two existing callers are untouched.
 */
export type UnverifiedGuestListEntry = {
  kind: "unverified";
  id: string;
  displayName: string;
};

export type GuestListItem = GuestListEntry | UnverifiedGuestListEntry;

/**
 * The named "Guests (N)" list for an event, built on the one count (`getEventGuests`), so the list
 * and every number beside it are the same people: every guest with an APPROVED upload, confirmed
 * ones as profile cards (keyed on `verified_at`, never on a bare `user_id`, so an unconfirmed
 * sign-up never passes as a proven person), and never the host.
 *
 * ★ `includeUnverified` (the identity reshape, 2026-09-21) appends the guests who typed a name at
 * the door and never proved an email, AFTER the profile cards, one entry per GUEST ROW. One per
 * row and not per person on purpose: without an account there is nothing to de-duplicate BY, and
 * two people who both typed "Sam" are two people (Will's to overrule). It is OFF by default so
 * every `withAvatarUrls` caller keeps the narrow type it already has; the guest album and the
 * Guests room opt in, and split the union before hydration (lib/social/cards.ts).
 *
 * Returns null when the host has NOT enabled show_guest_list, so callers can't accidentally render
 * a list the host key doesn't authorize; [] means "on, but no named guests yet".
 *
 * WHY the admin client: this is server-side composition for BOTH surfaces (the host event page
 * after getUser() ownership, and the guest /e/ page after the qr_token capability + password gate).
 * Neither anon nor authenticated has (or should get) table reads across guests/profiles, and the
 * show_guest_list re-check HERE is the authorization: the host key gates the data, not the caller's
 * row access. Callers MUST have already passed their surface's access gate; never call this with an
 * unvalidated event id. No block filtering: the guest list is an event surface keyed by the host,
 * not a social graph surface (blocks shape follows only, profiles-social.md).
 */
export async function getEventGuestList(
  eventId: string,
): Promise<GuestListEntry[] | null>;
export async function getEventGuestList(
  eventId: string,
  options: { includeUnverified: true },
): Promise<GuestListItem[] | null>;
export async function getEventGuestList(
  eventId: string,
  options?: { includeUnverified?: boolean },
): Promise<GuestListItem[] | null> {
  const includeUnverified = options?.includeUnverified ?? false;
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

  const guests = await getEventGuests(eventId);

  // Explicit id-list hydration of the PEOPLE (never a PostgREST embed: the PGRST201 landmine),
  // sorted by the name a viewer reads.
  const cards = await getProfileCards(guests.verifiedUserIds);
  const profiles: GuestListItem[] = guests.verifiedUserIds
    .flatMap((id) => {
      const card = cards.get(id);
      return card ? [card] : [];
    })
    .sort((a, b) =>
      (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
        sensitivity: "base",
      }),
    );

  if (!includeUnverified) return profiles;

  // Appended AFTER the cards, sorted among themselves: the people with a profile lead the list,
  // and the named-but-unproven follow, each carrying the mark their entry renders. A nameless row
  // (minted before the reshape) has nothing to list and never appears (the one count drops it).
  const unverified: UnverifiedGuestListEntry[] = guests.unverifiedRows
    .map((row) => ({
      kind: "unverified" as const,
      id: row.id,
      displayName: row.displayName,
    }))
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      }),
    );

  return [...profiles, ...unverified];
}

// ── The host's card (the follow moment after a guest's first upload) ───────────────────

export type HostCard = {
  id: string;
  slug: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * The host of an event, as a card a GUEST may see: id, handle, name, avatar, and nothing else.
 *
 * It backs the capture flow's follow moment (Will, `collision=offer`, 2026-09-21: keep the photos
 * and the event on a profile, then follow the host and the guests). The field list IS the
 * allow-list — the host's email, tier, storage and counts are all one `select("*")` away on this
 * same row, so it names its four columns and returns a hand-built object rather than a DB row.
 * Every field here is already public on /u/[slug] and on the "Hosted by" byline.
 *
 * Admin-read for the same reason getEventGuestList is: `profiles` is own-row RLS, so a guest's
 * client cannot read the host's card, and the event id the caller passes must already have cleared
 * that surface's access gate. Returns null for a deleted event or a host with no row.
 */
export async function getHostCard(eventId: string): Promise<HostCard | null> {
  const admin = createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event?.host_id) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, slug, display_name, avatar_updated_at")
    .eq("id", event.host_id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.display_name,
    avatarUrl: await getAvatarUrl(profile.id, profile.avatar_updated_at),
  };
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
