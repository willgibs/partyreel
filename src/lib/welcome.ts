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
