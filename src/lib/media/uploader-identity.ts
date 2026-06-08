/**
 * Per-media uploader identity resolution (Phase 2 attribution).
 *
 * The CASE logic is a PURE function so it's unit-testable without a DB. The three scenarios
 * (confirmed against the schema): a HOST upload has no guest row (`media.guest_id IS NULL`) -> the
 * host's name, `isHost`; an ANONYMOUS upload has a guest row with no account (`guests.user_id IS
 * NULL`) -> "Anonymous"; a LOGGED-IN guest (`guests.user_id` set, account-from-guest) -> their
 * `profiles.display_name` + the verified `guests.email`.
 *
 * `email` is resolved here but is HOST-GALLERY-ONLY downstream: guest call sites simply never copy
 * it onto the client-facing GridMedia (email-safety by construction, not a runtime flag). Names are
 * public (same trust model as the "Hosted by" byline). Defensive: a guest with an account but a
 * null display_name (shouldn't happen post-Phase-1) yields a null name + NOT anonymous, so the
 * caption renders nothing rather than mislabeling them "Anonymous".
 */
export type UploaderIdentity = {
  displayName: string | null;
  email: string | null;
  isHost: boolean;
  isAnonymous: boolean;
};

/** The media row shape the resolver consumes (from the media -> guests -> profiles embed). */
export type UploaderRow = {
  guest_id: string | null;
  guests: {
    user_id: string | null;
    email: string | null;
    profiles: { display_name: string | null } | null;
  } | null;
};

export function resolveUploaderIdentity(
  row: UploaderRow,
  hostName: string | null,
): UploaderIdentity {
  // Host upload: no guest row at all (create_media_as_host inserts guest_id NULL).
  if (row.guest_id === null) {
    return { displayName: hostName, email: null, isHost: true, isAnonymous: false };
  }
  const guest = row.guests;
  // Anonymous: a guest row with no linked account. Also the defensive fallback if the guest row
  // didn't resolve (e.g. an over-eager delete) -> attribute as anonymous, never as the host.
  if (!guest || guest.user_id === null) {
    return { displayName: null, email: null, isHost: false, isAnonymous: true };
  }
  // Logged-in guest (account-from-guest): public name from their profile, email from the guest row
  // (the event-relevant verified email, not necessarily profiles.email).
  return {
    displayName: guest.profiles?.display_name ?? null,
    email: guest.email ?? null,
    isHost: false,
    isAnonymous: false,
  };
}
