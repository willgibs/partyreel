/**
 * The dashboard single-feed LAYOUT decisions (Phase 5 S2b) — pure + node-tested,
 * so the four canonical states (nothing / one-empty-event / saved-only /
 * any-content) and the two gates are verifiable, not buried in the async RSC.
 *
 * - showMeter: the ambient storage meter is hosting telemetry — shown with 1+
 *   created events, OR while there are standby (Trash) bytes to report, so a host
 *   who deleted ALL their events still sees their recovery-budget status.
 * - showChips: chips appear when there is anything to navigate (live content OR
 *   trash to restore); otherwise it's a pure onboarding page (the teaser stack).
 * - uploadsEmpty / likesEmpty: drive teaser-vs-gallery for those sections (the
 *   gallery, when present, owns its own becoming-empty on client-only unlike).
 */
export type DashboardLayout = {
  showMeter: boolean;
  showChips: boolean;
  uploadsEmpty: boolean;
  likesEmpty: boolean;
};

export function resolveDashboardLayout(counts: {
  /** Created (hosted) events, non-deleted. */
  events: number;
  /** Saved events (from other hosts). */
  saved: number;
  uploads: number;
  likes: number;
  /** Soft-deleted events in the recovery window (Trash). */
  deleted: number;
  /** Bytes held in Trash (media of soft-deleted events / removed media). */
  standbyBytes: number;
}): DashboardLayout {
  return {
    showMeter: counts.events > 0 || counts.standbyBytes > 0,
    showChips:
      counts.events > 0 ||
      counts.saved > 0 ||
      counts.uploads > 0 ||
      counts.likes > 0 ||
      counts.deleted > 0,
    uploadsEmpty: counts.uploads === 0,
    likesEmpty: counts.likes === 0,
  };
}
