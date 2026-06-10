import type { Database } from "@/lib/db/types";

type Visibility = Database["public"]["Enums"]["event_visibility"];

/**
 * One plain-English sentence describing what a GUEST experiences for an event's access config. The single
 * source for the host's "what your guests will experience" cues: used live in the event settings form (as the
 * host flips the password + accounts toggles) AND as the dashboard event-detail access line, so the two never
 * drift. Pure (no client/server imports); mirrors the VISIBILITY_HINTS single-source pattern.
 *
 * `accountRequired` = `!allow_anonymous_uploads` (the caller inverts the column). The account-required wording
 * respects the privacy rule: an OPEN event shows the teaser immediately, but a PASSWORD event reveals nothing
 * until the password is entered (so no "preview" lead there).
 */
export function guestExperienceSummary({
  visibility,
  accountRequired,
  acceptingUploads,
}: {
  visibility: Visibility;
  accountRequired: boolean;
  acceptingUploads: boolean;
}): string {
  if (visibility === "private") return "Private. Only you can open this event.";

  const password = visibility === "password";

  if (!accountRequired) {
    if (password) {
      return acceptingUploads
        ? "Guests enter the password, then view and add photos."
        : "Guests enter the password to view the photos. Uploads are closed.";
    }
    return acceptingUploads
      ? "Anyone with the link can view and add photos."
      : "Anyone with the link can view the photos. Uploads are closed.";
  }

  // Account required: a free account is the incentive to see everything.
  if (password) {
    return acceptingUploads
      ? "Guests enter the password, then create a free account to view everything and add their own."
      : "Guests enter the password, then create a free account to view everything. Uploads are closed.";
  }
  return acceptingUploads
    ? "Guests see a few preview photos, then create a free account to view everything and add their own."
    : "Guests see a few preview photos, then create a free account to view everything. Uploads are closed.";
}
