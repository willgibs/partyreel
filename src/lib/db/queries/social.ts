/**
 * Social reads (ADR-0019 data layer): the public profile, owner-private
 * follow/block lists + counts, notification prefs, the guest-side hidden-event
 * set, and the host-keyed event guest list.
 *
 * Privacy invariants encoded here (do not relax in a refactor):
 *   - Follower/following LISTS AND COUNTS are private to the owner (the VSCO
 *     shape). Every "my" read is scoped by the caller's own auth.uid() row set;
 *     there is NO path to anyone else's graph.
 *   - Blocks are private to the blocker; the blocked side can never read them.
 *   - The event guest list renders ONLY when the HOST enabled show_guest_list
 *     (the ADR-0019 host key); anonymous uploads never appear (user_id IS NULL).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import {
  resolveNotificationPrefs,
  type NotificationPrefs,
  type NotificationPrefsRow,
} from "@/lib/social/notification-prefs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { createClient } from "@/lib/supabase/server";

// ── The pre-regen typing seam ────────────────────────────────────────────────
// WHY: src/lib/db/types.ts is GENERATED from the live schema and regenerates
// only when the orchestrator applies migration 20260708120000 at integration
// (subagents never apply DDL), so the social tables/columns/RPCs are invisible
// to the generated types until then. This cast drops to the untyped client for
// exactly those calls; the exported row types below are the local source of
// truth in the meantime. AFTER the regen lands: swap the casts for the typed
// client + Tables<"user_follows"> etc. and delete this seam.
const social = (client: unknown) => client as SupabaseClient;

/** The public-by-existence card fields (ADR-0019 point 3). */
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
 * fields (name/slug/avatar marker) are public by existence per ADR-0019, so
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
  const { data, error } = await social(createAdminClient())
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

  const { data, error } = await social(supabase)
    .from("user_follows")
    .select("followee_id, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

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

  const { data, error } = await social(supabase)
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("followee_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

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
    social(supabase)
      .from("user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", user.id),
    social(supabase)
      .from("user_follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("followee_id", user.id),
  ]);
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

  const { count, error } = await social(supabase)
    .from("user_follows")
    .select("followee_id", { count: "exact", head: true })
    .eq("follower_id", user.id)
    .eq("followee_id", profileId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Profiles I blocked, newest first. Blocker-private. */
export async function getMyBlocks(): Promise<BlockEntry[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await social(supabase)
    .from("user_blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

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

  const { data, error } = await social(supabase)
    .from("notification_prefs")
    .select(
      "notify_reel_ready, notify_album_shared, notify_new_uploads_digest, notify_new_follower, marketing_opt_in",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return resolveNotificationPrefs(data as NotificationPrefsRow | null);
}

/** Event ids I hid from my own public profile (ADR-0019 point 2). */
export async function getMyHiddenEventIds(): Promise<string[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await social(supabase)
    .from("profile_hidden_events")
    .select("event_id")
    .eq("user_id", user.id);
  if (error) throw error;
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
  // never hands out an album link the host didn't publish).
};

export type PublicProfile = {
  id: string;
  slug: string;
  display_name: string | null;
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
export async function getPublicProfile(
  slug: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await social(supabase).rpc("get_public_profile", {
    p_slug: slug,
  });
  if (error) throw error;
  return (data as PublicProfile | null) ?? null;
}

// ── The event guest list (the ADR-0019 host key) ─────────────────────────────

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
 * not a social graph surface (blocks shape follows only, ADR-0019).
 */
export async function getEventGuestList(
  eventId: string,
): Promise<GuestListEntry[] | null> {
  const admin = createAdminClient();

  const { data: event, error: eventError } = await social(admin)
    .from("events")
    .select("show_guest_list")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event || !(event as { show_guest_list: boolean }).show_guest_list) {
    return null;
  }

  // Explicit id-list joins (no embeds): signed-in guest rows -> approved media
  // presence -> profile cards. media stays admin-read with explicit columns
  // (never select("*") on media: the hold columns are host-invisible, ADR-0020).
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
