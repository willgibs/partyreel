/**
 * Notification consent defaults (ADR-0019 point 6) — the app-side twin of the
 * notification_prefs table (migration 20260708120000). SHAPED for R5: nothing
 * sends yet; R5's send paths must consult resolveNotificationPrefs before any
 * tier-2 send.
 *
 * The tier model (from the T1 options-doc, uncontested):
 *   - Tier 1 (transactional/security: OTP, billing, deletion warnings) is ALWAYS
 *     sent. Deliberately NO column and NO field here, so it can never be
 *     toggled off by code that "just maps the table".
 *   - Tier 2 (relationship/service) is default-ON with per-category opt-out for
 *     ACCOUNT holders only: the four notify* fields.
 *   - Tier 3 (marketing) is explicit OPT-IN: marketingOptIn defaults false.
 *   - Anonymous-email guests never have a row (no account): they receive nothing
 *     beyond explicitly requested one-shots.
 *
 * Rows are LAZY: an absent row means "all defaults", so these constants MUST
 * mirror the column defaults in the migration. A Vitest parity test
 * (notification-prefs.test.ts) pins the two together by parsing the migration
 * SQL — change one, change both.
 *
 * Import-safe from client components (constants + pure logic, no secrets).
 */

export type NotificationPrefs = {
  /** Tier 2: "your highlight reel is ready" (reel generation done). */
  notifyReelReady: boolean;
  /** Tier 2: a host shared/published an album you uploaded to. */
  notifyAlbumShared: boolean;
  /** Tier 2: digest of new uploads landing in your event (hosts). */
  notifyNewUploadsDigest: boolean;
  /** Tier 2: someone followed you. */
  notifyNewFollower: boolean;
  /** Tier 3: marketing. OPT-IN, never defaulted on. */
  marketingOptIn: boolean;
};

export const NOTIFICATION_PREF_DEFAULTS: NotificationPrefs = {
  notifyReelReady: true,
  notifyAlbumShared: true,
  notifyNewUploadsDigest: true,
  notifyNewFollower: true,
  marketingOptIn: false,
};

/**
 * The snake_case DB row (or the relevant subset of it). Declared here rather
 * than via Tables<"notification_prefs"> because src/lib/db/types.ts regenerates
 * only when the orchestrator applies the migration at integration; when it
 * does, this shape stays structurally identical, so nothing needs to change.
 */
export type NotificationPrefsRow = {
  notify_reel_ready: boolean;
  notify_album_shared: boolean;
  notify_new_uploads_digest: boolean;
  notify_new_follower: boolean;
  marketing_opt_in: boolean;
};

/**
 * Resolve a (possibly absent) DB row into effective prefs. null/undefined =
 * the lazy no-row case = all defaults; a row maps 1:1. Every future send path
 * goes through this so "absent row" and "row of defaults" are indistinguishable
 * by construction.
 */
export function resolveNotificationPrefs(
  row: NotificationPrefsRow | null | undefined,
): NotificationPrefs {
  if (!row) return { ...NOTIFICATION_PREF_DEFAULTS };
  return {
    notifyReelReady: row.notify_reel_ready,
    notifyAlbumShared: row.notify_album_shared,
    notifyNewUploadsDigest: row.notify_new_uploads_digest,
    notifyNewFollower: row.notify_new_follower,
    marketingOptIn: row.marketing_opt_in,
  };
}
