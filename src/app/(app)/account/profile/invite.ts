/**
 * THE PAGE SETUP'S DOORS, AND WHEN THE APP OPENS ONE UNASKED (`identity-profile` r1: `setup=wizard`,
 * `prompt=claim`; `identity-claims` r1: `after=profile`).
 *
 * Pure and node-safe, so the dashboard (which decides whether to invite), the claims toast (which
 * points), the Account card and the wizard itself share ONE definition of where setup lives and what
 * "set up" means. Nothing here touches `next/headers`: the cookie's NAME lives here, its access in
 * the pages and the Server Action.
 *
 * ★ "SET UP" MEANS A CLAIMED HANDLE. Claiming the handle is the consent act that makes the page
 * exist (profiles-social.md), and the wizard claims it LAST, at Finish, after her choices are
 * written, so a handle means the setup finished: an abandoned wizard leaves no page behind it.
 */

/** The wizard's address. Named at the lane's boot, so the album's "Claim a handle" row can point here. */
export const PROFILE_SETUP_PATH = "/account/profile";

/** Where a page's later, direct edits live: the Account page's Public profile card. */
export const PAGE_CHOICES_PATH = "/account#public-profile";

/**
 * The claims toast's second line ("Choose what shows on your page"): the setup for a page that does
 * not exist yet, the page's choices once it does. The wizard itself sends a set-up account to the
 * same card, so either answer is right even when it is a render old.
 */
export function pageChoicesHref(hasHandle: boolean): string {
  return hasHandle ? PAGE_CHOICES_PATH : PROFILE_SETUP_PATH;
}

/** The invitation's "Not now", remembered per device. */
export const PAGE_INVITE_COOKIE = "pr_page_invite";

/** A year: a dismissal is a preference, not a session fact. */
export const PAGE_INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Whether the dashboard invites her to set up her page (`prompt=claim`: "once Priya finishes
 * claiming events from the dashboard, a card invites her to set up her page next").
 *
 * ★ EVERY CONDITION IS A SERVER FACT, never a moment the client has to catch:
 *   - no handle yet (a page that exists is set up);
 *   - no claim still waiting, so the card never competes with the claim ticket, and it appears the
 *     moment Finish settles (the page revalidates with the ticket gone);
 *   - at least one event her page could show: an APPROVED upload on a PROVED row at an event she
 *     does not host (`getMyAttendedEvents`), which also keeps it off an unconfirmed account, since
 *     only a confirmed address proves a row ("never before a verified email");
 *   - not dismissed on this device, by this account.
 * A guest who confirmed at the door and never had anything to claim meets it too (a Require verified
 * emails party, the default, makes no claim), which is Will's to overrule: claimers alone would need a
 * stamp at the claim ticket's Finish.
 */
export function shouldInviteToPage(facts: {
  hasHandle: boolean;
  claimsWaiting: number;
  showableEvents: number;
  dismissed: boolean;
}): boolean {
  return (
    !facts.hasHandle &&
    facts.claimsWaiting === 0 &&
    facts.showableEvents > 0 &&
    !facts.dismissed
  );
}

/**
 * The cookie holds the seed of the account that dismissed (`seedFor`, a one-way hash, never the raw
 * id), so a second account signing in on the same browser still meets its own invitation.
 */
export function isPageInviteDismissed(
  cookieValue: string | undefined,
  accountSeed: string,
): boolean {
  return Boolean(cookieValue) && cookieValue === accountSeed;
}
