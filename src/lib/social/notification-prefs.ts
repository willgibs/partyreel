/**
 * Notification consent defaults (profiles-social.md point 6) — the app-side twin of the
 * notification_prefs table (migration 20260708120000, plus 20260928160000's Event Pass reminders).
 * Every send that has a switch resolves it here first; today that is one mail, the renewal nudge
 * (src/lib/lifecycle/sweeps/passes.ts).
 *
 * The tier model (from the T1 options-doc, uncontested):
 *   - Tier 1 (transactional/security: OTP, billing, storage and deletion warnings) is ALWAYS
 *     sent. Deliberately NO column and NO field here, so it can never be
 *     toggled off by code that "just maps the table".
 *   - Tier 2 (relationship/service) is default-ON with per-category opt-out for
 *     ACCOUNT holders only: the notify* fields. The renewal nudge moved here from tier 1 (Will,
 *     `emails` r1 `foot=commercial`): it asks for a purchase, so it carries an unsubscribe, and the
 *     unsubscribe is its switch.
 *   - Tier 3 (marketing) is explicit OPT-IN: marketingOptIn defaults false.
 *   - Anonymous-email guests never have a row (no account): they receive nothing
 *     beyond explicitly requested one-shots.
 *
 * A switch with no mail behind it is ruled absent, never drawn (`emails` r1 `moments=identity`): the
 * app lets go of its column first, then a migration drops it.
 *
 * Rows are LAZY: an absent row means "all defaults", so these constants MUST
 * mirror the column defaults in the migrations. A Vitest parity test
 * (notification-prefs.test.ts) pins the two together by parsing the migrations'
 * SQL (the create, plus every column a later migration adds, less every column one drops): change
 * one, change both.
 *
 * Import-safe from client components (constants + pure logic, no secrets).
 */

export type NotificationPrefs = {
  /** Tier 2: Event Pass reminders, the renewal nudge two weeks before a pass expires. */
  notifyPassRenewal: boolean;
  /** Tier 3: marketing. OPT-IN, never defaulted on. */
  marketingOptIn: boolean;
};

export const NOTIFICATION_PREF_DEFAULTS: NotificationPrefs = {
  notifyPassRenewal: true,
  marketingOptIn: false,
};

/**
 * The snake_case DB row (or the relevant subset of it). Declared here rather
 * than via Tables<"notification_prefs"> because src/lib/db/types.ts regenerates
 * only when the orchestrator applies the migration at integration; when it
 * does, this shape stays structurally identical, so nothing needs to change.
 */
export type NotificationPrefsRow = {
  notify_pass_renewal: boolean;
  marketing_opt_in: boolean;
};

/**
 * The row's preference columns as one select list, so every reader (the /account card's read, the
 * renewal sweep's) selects exactly what resolveNotificationPrefs maps, and a new column is added in
 * one place. notification-prefs.test.ts pins it to the parity.
 */
export const NOTIFICATION_PREF_COLUMNS =
  "notify_pass_renewal, marketing_opt_in";

/**
 * Resolve a (possibly absent) DB row into effective prefs. null/undefined =
 * the lazy no-row case = all defaults; a row maps 1:1. Every send path
 * goes through this so "absent row" and "row of defaults" are indistinguishable
 * by construction.
 */
export function resolveNotificationPrefs(
  row: NotificationPrefsRow | null | undefined,
): NotificationPrefs {
  if (!row) return { ...NOTIFICATION_PREF_DEFAULTS };
  return {
    notifyPassRenewal: row.notify_pass_renewal,
    marketingOptIn: row.marketing_opt_in,
  };
}
