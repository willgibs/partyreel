import type { Database } from "@/lib/db/types";

type Visibility = Database["public"]["Enums"]["event_visibility"];

/**
 * One plain-English sentence describing what a GUEST experiences for an event's access config. The single
 * source for the host's "what your guests will experience" cues: used live in the event settings form (as the
 * host flips the password + verified-email + uploads toggles). Pure (no client/server imports); mirrors the
 * VISIBILITY_HINTS single-source pattern.
 *
 * `requireVerifiedEmail` reads `events.require_verified_email` directly (no inversion): on, a guest confirms
 * an email before the full album and any upload; off, a guest chooses a display name and adds under it,
 * shown with the small unverified mark (the identity reshape, 2026-09-21 — anonymity left the product, so
 * even the open branches below name a guest by something, never nobody). The account-required wording
 * respects the privacy rule: an OPEN event shows the teaser immediately, but a PASSWORD event reveals nothing
 * until the password is entered (so no "preview" lead there).
 */
export function guestExperienceSummary({
  visibility,
  requireVerifiedEmail,
  acceptingUploads,
}: {
  visibility: Visibility;
  requireVerifiedEmail: boolean;
  acceptingUploads: boolean;
}): string {
  if (visibility === "private") return "Private. Only you can open this event.";

  const password = visibility === "password";

  if (!requireVerifiedEmail) {
    if (password) {
      return acceptingUploads
        ? "Guests enter the password, then view and add photos under a name they choose."
        : "Guests enter the password to view the photos. Uploads are closed.";
    }
    return acceptingUploads
      ? "Anyone with the link can view and add photos under a name they choose."
      : "Anyone with the link can view the photos. Uploads are closed.";
  }

  // Verified email required: a guest confirms one to see everything.
  if (password) {
    return acceptingUploads
      ? "Guests enter the password, then confirm their email to view everything and add their own."
      : "Guests enter the password, then confirm their email to view everything. Uploads are closed.";
  }
  return acceptingUploads
    ? "Guests see a few preview photos, then confirm their email to view everything and add their own."
    : "Guests see a few preview photos, then confirm their email to view everything. Uploads are closed.";
}
