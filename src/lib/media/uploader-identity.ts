/**
 * Per-media uploader identity resolution — THE ONE PRECEDENCE RULE.
 *
 * The identity reshape (Will, 2026-09-21) ended anonymity as a product concept: every upload made
 * from here on carries a name, and the only question is whether an email was proved behind it. This
 * pure function is where that is decided for every surface (the album, the lightbox caption, the
 * host gallery, the ETag), so the answer can never differ between two of them.
 *
 * THE RULE, in order, and the ORDER is the security property:
 *   1. No guest row at all (`media.guest_id IS NULL`) -> the HOST uploaded it: the host's name.
 *   2. `guests.verified_at` set -> a proved email: the PROFILE's display_name, verified.
 *   3. else a typed `guests.display_name` -> the name they entered at the door, UNVERIFIED.
 *   4. else -> NO NAME AT ALL, and the credit shows none. Only a row minted before names were
 *      asked can land here (`create_guest` refuses a nameless mint by an unconfirmed caller), and
 *      the honest answer about it is that nobody is named: never "A guest" invented as a person.
 *
 * ★ NEVER KEY ON `user_id` ALONE (wave 0's finding, measured against the applied schema). An
 * UNCONFIRMED sign-up carries a perfectly real `guests.user_id` and keeps its typed name, so a
 * `user_id !== null` test would silently promote an unproven person to "verified, with a profile
 * name" — which is the exact claim this whole reshape exists to stop anyone making. `verified_at`
 * is stamped by create_guest from `auth.users.email_confirmed_at` at the mint, server-side, and is
 * the only thing that means verified.
 *
 * ★ `email` IS ONLY EVER A PROVED ONE (the guest identity round, Will 2026-09-22). Case 2 and case 2
 * alone returns an address, because `guests.email` means "confirmed, copied from auth.users" and
 * nothing else. Case 3 used to return `guest.email` too, which an UNCONFIRMED sign-up could fill
 * through the newsletter capture: the host gallery would then have printed an unproved address
 * beside an unverified mark, which is the exact impersonation this guards against ("there's no
 * impersonation risk if the host can't see the attributed email of an unconfirmed account"). It now
 * returns null, always. `guests.pending_email` is NEVER READ HERE AT ALL — it is inert, and the host
 * sees a badge, never an address.
 *
 * `email` is resolved here but is HOST-GALLERY-ONLY downstream: guest call sites copy name/isHost/
 * isVerified onto the client-facing GridMedia and never the email (email-safety by construction,
 * not a runtime flag — and grid-items.email-safety.test.ts stands guard). Names are public, the
 * same trust model as the "Hosted by" byline.
 */
export type UploaderIdentity = {
  displayName: string | null;
  email: string | null;
  isHost: boolean;
  /** An email was proved (guests.verified_at). False renders the unverified mark beside a name. */
  isVerified: boolean;
};

/** The media row shape the resolver consumes (from the media -> guests -> profiles embed). */
export type UploaderRow = {
  guest_id: string | null;
  guests: {
    user_id: string | null;
    email: string | null;
    /** The name typed at the door of a name-only event; NULL for a verified guest, by construction. */
    display_name: string | null;
    /** auth.users.email_confirmed_at as it stood at the mint. NULL = unverified. */
    verified_at: string | null;
    profiles: { display_name: string | null } | null;
  } | null;
};

/** Case 4 (and the missing-row fallback): no name, no address, no claim of any kind. */
function nameless(): UploaderIdentity {
  return { displayName: null, email: null, isHost: false, isVerified: false };
}

export function resolveUploaderIdentity(
  row: UploaderRow,
  hostName: string | null,
): UploaderIdentity {
  // 1. Host upload: no guest row at all (create_media_as_host inserts guest_id NULL). The host is
  // an account with a confirmed email by definition of having one, and `isHost` suppresses the
  // mark anyway — but saying `isVerified: true` here keeps "unverified" meaning one thing.
  if (row.guest_id === null) {
    return {
      displayName: hostName,
      email: null,
      isHost: true,
      isVerified: true,
    };
  }
  const guest = row.guests;
  // The defensive fallback (an over-eager delete left the media without its guest row) lands in
  // case 4: nobody named, and NEVER the host.
  if (!guest) return nameless();
  // 2. A proved email: the identity is the PROFILE's name, never a second name stored beside it.
  // A verified guest with a null profile name (a deleted account's surviving upload) resolves to no
  // name, so the caption renders nothing rather than mislabeling a real person.
  if (guest.verified_at !== null) {
    return {
      displayName: guest.profiles?.display_name ?? null,
      email: guest.email ?? null,
      isHost: false,
      isVerified: true,
    };
  }
  // 3. A typed name, unproven — and NO ADDRESS, ever. The row may carry `guests.email` from an
  // unconfirmed sign-up and `guests.pending_email` from the door's optional field; neither is proof
  // of anything, and the host's half of this identity is a name plus the mark. Returning one would
  // put an unproved address under a name the host has no way to check, which is the impersonation
  // the whole round exists to prevent.
  if (guest.display_name !== null && guest.display_name.trim() !== "") {
    return {
      displayName: guest.display_name,
      email: null,
      isHost: false,
      isVerified: false,
    };
  }
  // 4. Nameless: minted before names were asked. Nobody is named, so nothing is claimed.
  return nameless();
}
