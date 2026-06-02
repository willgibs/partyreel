/**
 * Presign a user's avatar for <img> render. Server-only (signs with the R2 secret) — the
 * avatar twin of toGridItems (lib/r2/grid-items.ts): a stored key → a short-lived signed GET
 * URL, so the raw R2 key never reaches the browser.
 *
 * Gated on the marker: a null avatar_updated_at means no object exists, so we return null
 * (the UI renders the initial-letter fallback) WITHOUT presigning a key that would 404.
 *
 * Short TTL (5 min): an avatar URL only needs to outlive the page render, and the short window
 * bounds how long a browser/CDN could hold a pre-replace URL after the host changes their photo
 * (the deterministic key is overwritten in place — see avatarObjectKey).
 */
import "server-only";

import { avatarObjectKey } from "@/lib/r2/keys";
import { presignDownload } from "@/lib/r2/presign";

const AVATAR_URL_TTL_SECONDS = 5 * 60;

export async function presignAvatarUrl(
  userId: string,
  avatarUpdatedAt: string | null,
): Promise<string | null> {
  if (!avatarUpdatedAt) return null;
  return presignDownload({
    key: avatarObjectKey(userId),
    expiresInSeconds: AVATAR_URL_TTL_SECONDS,
  });
}
