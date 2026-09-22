import type { Database } from "@/lib/db/types";

type Visibility = Database["public"]["Enums"]["event_visibility"];

/**
 * One plain-English sentence describing what a GUEST experiences for an event's access config. The single
 * source for the host's "what your guests will experience" cues: used live in the event settings form (as the
 * host flips the password + verified-email + upload-gate + uploads toggles). Pure (no client/server imports);
 * mirrors the VISIBILITY_HINTS single-source pattern.
 *
 * `requireVerifiedEmail` reads `events.require_verified_email` directly (no inversion): on, a guest confirms
 * an email before the full album and any upload; off, a guest chooses a display name and adds under it,
 * shown with the small unverified mark (the identity reshape, 2026-09-21 — anonymity left the product, so
 * even the open branches below name a guest by something, never nobody). The account-required wording
 * respects the privacy rule: an OPEN event shows the teaser immediately, but a PASSWORD event reveals nothing
 * until the password is entered (so no "preview" lead there).
 *
 * `requireUploadToView` reads `events.require_upload_to_view` directly (the door's third step, Will
 * 2026-09-21 "the door as three steps"): on (and only while uploads are open — closed uploads make the
 * gate moot, so those sentences stand as they were), a guest adds one photo or video before the album
 * opens. That branch is COMPOSED as its own sentence, never an appended clause, so the names branch
 * never reads "view and add photos under a name they choose and add a photo before they can see
 * everything".
 */
export function guestExperienceSummary({
  visibility,
  requireVerifiedEmail,
  acceptingUploads,
  requireUploadToView,
}: {
  visibility: Visibility;
  requireVerifiedEmail: boolean;
  acceptingUploads: boolean;
  requireUploadToView: boolean;
}): string {
  if (visibility === "private") return "Private. Only you can open this event.";

  const password = visibility === "password";

  // The upload gate takes precedence over the plain open/verified sentences below, but only
  // while there's something to gate: uploads closed already means "nothing to add", which is
  // exactly what the sentences below already say, so the gate's own fail-open (get_upload_gate)
  // is mirrored here rather than re-stated.
  if (requireUploadToView && acceptingUploads) {
    const identityClause = requireVerifiedEmail
      ? "confirm their email"
      : "give a name";
    return password
      ? `Guests enter the password, then ${identityClause} and add a photo, then see everything.`
      : `Guests ${identityClause} and add a photo, then see everything.`;
  }

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
