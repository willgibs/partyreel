/**
 * Avatar storage on Supabase Storage. The single source of truth for the bucket id, the per-user
 * object path, and the three ops (upload / remove / url) — the Supabase twin of what lib/r2/keys.ts
 * + lib/r2/avatar-url.ts + lib/r2/put.ts were for R2. Server-only: upload + remove use the
 * service-role admin client (which bypasses storage RLS), so the bucket needs no policies.
 *
 * The bucket is PUBLIC: avatars are public profile photos (shown to anonymous guests on the event
 * page), so reads are a stable CDN URL, not a per-render presign. profiles.avatar_updated_at doubles
 * as the ?v= cache-bust, so a replace (which advances the marker) busts browser/CDN caches while the
 * object itself stays cacheable forever.
 *
 * Zero-orphan by construction: the path is DETERMINISTIC (one object per user) and upload uses
 * upsert, so replacing an avatar overwrites it in place — there is never a second object to clean up.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AVATAR_CONTENT_TYPE } from "@/lib/validation/avatar";

const AVATAR_BUCKET = "avatars";
// Bytes are immutable for a given marker: a replace advances profiles.avatar_updated_at, which
// changes the ?v= in getAvatarUrl, so the stored object can be cached forever.
const AVATAR_CACHE_CONTROL = "max-age=31536000, immutable";

// Deterministic + overwrite-in-place: one object per user, so a replace can never orphan the old
// avatar. Not exported (no caller needs the raw path; keeping it internal enforces that).
function avatarPath(userId: string): string {
  return `${userId}/avatar.webp`;
}

export async function uploadAvatar(
  userId: string,
  bytes: Uint8Array,
): Promise<void> {
  const { error } = await createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .upload(avatarPath(userId), bytes, {
      contentType: AVATAR_CONTENT_TYPE,
      cacheControl: AVATAR_CACHE_CONTROL,
      upsert: true, // overwrite in place on the deterministic path -> zero orphans
    });
  if (error) throw error;
}

export async function removeAvatar(userId: string): Promise<void> {
  // Idempotent: an absent object is success (only a non-null error is a failure; we never inspect
  // data). Object-first ordering means a throw here leaves the marker set so a retry re-deletes.
  const { error } = await createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .remove([avatarPath(userId)]);
  if (error) throw error;
}

/**
 * Build the public URL for a user's avatar, or null when there's no avatar.
 *
 * Stays async + (userId, marker) so the call sites are a pure import swap from the old R2 presign
 * helper. Gated on the marker: a null avatar_updated_at means no object exists, so we return null
 * (the UI renders the initial-letter fallback) instead of a URL that would 404.
 */
export async function getAvatarUrl(
  userId: string,
  avatarUpdatedAt: string | null,
): Promise<string | null> {
  if (!avatarUpdatedAt) return null;
  const { data } = createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .getPublicUrl(avatarPath(userId)); // synchronous string build, no I/O
  return `${data.publicUrl}?v=${encodeURIComponent(avatarUpdatedAt)}`;
}
