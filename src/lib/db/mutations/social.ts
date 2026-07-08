/**
 * Social writes (ADR-0019 data layer): follow/unfollow, block/unblock,
 * notification prefs, guest-side profile hides, and the profile handle.
 *
 * Write-path map (WHY each shape):
 *   - follow/block go through their SECURITY DEFINER RPCs (the ONLY writers:
 *     raw INSERT is not granted). follow_user is block-aware and SILENT under a
 *     block; block_user severs follows both ways atomically.
 *   - unfollow/unblock/hides are plain owner-RLS writes (no side effects, no
 *     cross-tenant reads), so an RPC would be ceremony.
 *   - the profile slug is service-role-only (profiles writes are column-locked
 *     and slug is deliberately NOT in the authenticated grant), written here
 *     after the app-side checks. Pro gate lives HERE, app-side, per the pricing
 *     house pattern: the DB stores a slug for ANY tier so grandfathering /
 *     downgrades never strand a stored handle.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MutationResult } from "@/lib/db/mutations/events";
import type { NotificationPrefs } from "@/lib/social/notification-prefs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { profileSlugSchema } from "@/lib/validation/profile";

// The same pre-regen typing seam as queries/social.ts (single WHY lives there):
// types.ts regenerates only when the orchestrator applies the migration; until
// then the social tables/RPCs are invisible to the generated types. Delete
// after the regen and go typed.
const social = (client: unknown) => client as SupabaseClient;

const UNAUTHORIZED = {
  ok: false as const,
  code: "unauthorized" as const,
  message: "Please sign in and try again.",
};

// Postgres SQLSTATEs (match codes, not messages: messages drift, codes are stable).
const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const NO_DATA_FOUND = "P0002";

/**
 * Follow a profile. Idempotent (re-follow no-ops). Under a block in EITHER
 * direction this SUCCEEDS while writing nothing: blocks are private (ADR-0019
 * point 5) and an error here would let a blocked user confirm the block by
 * probing. Do not "fix" that by surfacing a distinct result.
 */
export async function followUser(
  profileId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase).rpc("follow_user", {
    p_followee: profileId,
  });
  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return { ok: false, code: "unknown", message: "Profile not found." };
    }
    if (error.code === CHECK_VIOLATION) {
      // Self-follow (the RPC's friendly message).
      return { ok: false, code: "unknown", message: error.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't follow right now. Please try again.",
    };
  }
  return { ok: true, data: { id: profileId } };
}

/** Unfollow. Owner-RLS DELETE of my own edge; idempotent (0 rows is fine). */
export async function unfollowUser(
  profileId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase)
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", profileId);
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't unfollow right now. Please try again.",
    };
  }
  return { ok: true, data: { id: profileId } };
}

/**
 * Block a profile: writes the block AND severs follows both ways in one
 * transaction (the block_user RPC). Idempotent. Private: the blocked user is
 * never notified and can never read the block.
 */
export async function blockUser(
  profileId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase).rpc("block_user", {
    p_blocked: profileId,
  });
  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return { ok: false, code: "unknown", message: "Profile not found." };
    }
    if (error.code === CHECK_VIOLATION) {
      return { ok: false, code: "unknown", message: error.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't block right now. Please try again.",
    };
  }
  return { ok: true, data: { id: profileId } };
}

/**
 * Unblock. Owner-RLS DELETE (no side effects: severed follows do NOT come
 * back, matching every mainstream block semantics). Idempotent.
 */
export async function unblockUser(
  profileId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase)
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", profileId);
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't unblock right now. Please try again.",
    };
  }
  return { ok: true, data: { id: profileId } };
}

/**
 * Save my notification prefs (partial: only the toggles passed change; rows
 * are lazy so the first save creates the row).
 *
 * WHY update-then-insert instead of .upsert(): PostgREST upsert compiles to
 * INSERT ... ON CONFLICT DO UPDATE SET <every payload column> including
 * user_id, and update(user_id) is deliberately NOT granted (the column-scoped
 * grant), so an upsert here fails with permission denied. Update first (the
 * common case), insert the full row when none exists, and on a same-instant
 * 23505 race fall back to the update.
 */
export async function setNotificationPrefs(
  prefs: Partial<NotificationPrefs>,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const patch: Record<string, boolean> = {};
  if (prefs.notifyReelReady !== undefined)
    patch.notify_reel_ready = prefs.notifyReelReady;
  if (prefs.notifyAlbumShared !== undefined)
    patch.notify_album_shared = prefs.notifyAlbumShared;
  if (prefs.notifyNewUploadsDigest !== undefined)
    patch.notify_new_uploads_digest = prefs.notifyNewUploadsDigest;
  if (prefs.notifyNewFollower !== undefined)
    patch.notify_new_follower = prefs.notifyNewFollower;
  if (prefs.marketingOptIn !== undefined)
    patch.marketing_opt_in = prefs.marketingOptIn;
  if (Object.keys(patch).length === 0)
    return { ok: true, data: { id: user.id } };

  const db = social(supabase);
  const failed = {
    ok: false as const,
    code: "unknown" as const,
    message: "Couldn't save your notification settings. Please try again.",
  };

  const updated = await db
    .from("notification_prefs")
    .update(patch)
    .eq("user_id", user.id)
    .select("user_id");
  if (updated.error) return failed;
  if ((updated.data ?? []).length > 0)
    return { ok: true, data: { id: user.id } };

  const inserted = await db
    .from("notification_prefs")
    .insert({ user_id: user.id, ...patch });
  if (inserted.error) {
    if (inserted.error.code !== UNIQUE_VIOLATION) return failed;
    // Race: another request created the row between our update and insert.
    const retried = await db
      .from("notification_prefs")
      .update(patch)
      .eq("user_id", user.id);
    if (retried.error) return failed;
  }
  return { ok: true, data: { id: user.id } };
}

/**
 * Hide an attended event from MY public profile (ADR-0019 point 2). I stay on
 * the event's guest list (that list is the HOST's key, not mine). Idempotent:
 * a duplicate hide is success. Owner-RLS insert; hiding an event I never
 * attended is a harmless no-op row the profile read never reaches.
 */
export async function hideEventFromProfile(
  eventId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase)
    .from("profile_hidden_events")
    .insert({ user_id: user.id, event_id: eventId });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't hide this event. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}

/** Un-hide (the event shows on my profile again). Idempotent. */
export async function unhideEventFromProfile(
  eventId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(supabase)
    .from("profile_hidden_events")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update this event. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}

/**
 * Claim/change my public profile handle (/u/[slug]).
 *
 * Order of checks: getUser() -> app-side Pro gate (tier read via own-row RLS;
 * "locked" = free, matching isSettingLocked) -> profileSlugSchema (format +
 * reserved words) -> service-role write (slug is outside the authenticated
 * column grant BY DESIGN; this function is its only writer). The DB backstops
 * with the format CHECK + the partial unique index; 23505 maps to "taken"
 * (there is no pre-check, the index IS the availability check: one write, no
 * race window).
 */
export async function setProfileSlug(
  rawSlug: string,
): Promise<MutationResult<{ slug: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.tier === "free") {
    return {
      ok: false,
      code: "limit_reached",
      message: "Custom handles are a paid feature. Upgrade to claim one.",
    };
  }

  const parsed = profileSlugSchema.safeParse(rawSlug);
  if (!parsed.success) {
    return {
      ok: false,
      code: "unknown",
      message:
        parsed.error.issues[0]?.message ?? "That handle isn't available.",
    };
  }
  const slug = parsed.data;

  const { error } = await social(createAdminClient())
    .from("profiles")
    .update({ slug })
    .eq("id", user.id);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        ok: false,
        code: "limit_reached",
        message: "That handle is already taken.",
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save your handle. Please try again.",
    };
  }
  return { ok: true, data: { slug } };
}

/**
 * Release my handle (slug = null: the /u/ page 404s, the profile row stays).
 * No tier check: a downgraded host can always remove (mirrors clearEventSlug).
 */
export async function clearProfileSlug(): Promise<
  MutationResult<{ id: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { error } = await social(createAdminClient())
    .from("profiles")
    .update({ slug: null })
    .eq("id", user.id);
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove your handle. Please try again.",
    };
  }
  return { ok: true, data: { id: user.id } };
}
