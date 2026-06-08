/**
 * Reserved DISPLAY NAMES a user may not take, to stop impersonation in public uploader
 * attribution (a guest setting their name to "Partyreel Support" or "Admin" and looking
 * official). Checked against the WHOLE trimmed, lowercased name (exact match only), so it blocks
 * "admin" but never a legitimate name that merely contains a token ("Adminah", "Hosta").
 *
 * Like reserved-slugs.ts this is POLICY, not a security boundary: enforced in the app layer
 * (displayNameSchema in lib/validation/profile.ts + the server action's re-parse), not in SQL,
 * and may grow. All entries MUST be lowercase.
 */
export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "partyreel",
  "party reel",
  "official",
  "support",
  "help",
  "host",
  "moderator",
  "mod",
  "staff",
  "team",
  "system",
  "owner",
  "billing",
  "security",
]);
