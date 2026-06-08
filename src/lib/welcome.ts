/**
 * First-time host welcome (Phase 6). A brand-new account is shown the `/welcome` intro until
 * its `profiles.welcomed_at` marker is set. Existing hosts were backfilled (migration), so this
 * only fires for new signups. Pure so the dashboard guard is trivially testable.
 */
export function shouldShowWelcome(
  welcomedAt: string | null | undefined,
): boolean {
  return !welcomedAt;
}

/**
 * Phase 1 identity foundation: every account must have a public display name before it can take an
 * identity-bearing action (host the dashboard, upload). A null/blank `display_name` means "not set"
 * (handle_new_user leaves it NULL for all signups), so this is the gate signal. Pure + trivially
 * testable, mirroring shouldShowWelcome; composed into the dashboard + guest upload gates.
 */
export function needsDisplayName(
  displayName: string | null | undefined,
): boolean {
  return !displayName?.trim();
}
