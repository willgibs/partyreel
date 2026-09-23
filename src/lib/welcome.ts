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

/** An account's facts the first-visit decision reads: its name, its welcome marker and what it holds. */
export type FirstVisitFacts = {
  displayName: string | null | undefined;
  welcomedAt: string | null | undefined;
  /** Live events this account hosts. */
  hostedEvents: number;
  /** The dashboard's Guest cards: events it added photos to and does not host. */
  guestCards: number;
};

/**
 * A GUEST-MADE ACCOUNT'S FIRST VISIT. A guest who confirms an email after their first photographs (the capture) is
 * told "It is in your account now, and this event came with it": the event arrives as a Guest card on the dashboard.
 * The host tour ("Create my first event") would stand between that person and the one card they came for, so an
 * unwelcomed account that hosts nothing and already holds a Guest card is not a host arriving: its first visit IS the
 * dashboard, and that visit counts as its welcome (the account is marked welcomed; the tour never shows). An account
 * with nothing at all, or one hosting an event, still takes the tour, and the empty events teaser keeps the host pitch.
 */
export function isGuestFirstVisit(
  account: Pick<FirstVisitFacts, "welcomedAt" | "hostedEvents" | "guestCards">,
): boolean {
  return (
    shouldShowWelcome(account.welcomedAt) &&
    account.hostedEvents === 0 &&
    account.guestCards > 0
  );
}

/** What `/dashboard` does with a visit. */
export type DashboardEntry =
  /** Redirect to `/welcome`: the name step, or the host tour. */
  | "welcome"
  /** Render the dashboard and mark the account welcomed (a guest's first visit). */
  | "guest-first-visit"
  /** Render the dashboard. */
  | "dashboard";

/**
 * The dashboard's gate as one decision, in order: a nameless account names itself at `/welcome` first (every account
 * does, a guest's included: the name is on everything it uploads); an unwelcomed one takes the tour unless this is a
 * guest's first visit; everyone else simply lands.
 */
export function resolveDashboardEntry(
  account: FirstVisitFacts,
): DashboardEntry {
  if (needsDisplayName(account.displayName)) return "welcome";
  if (!shouldShowWelcome(account.welcomedAt)) return "dashboard";
  return isGuestFirstVisit(account) ? "guest-first-visit" : "welcome";
}
