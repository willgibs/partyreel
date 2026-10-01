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
 * nothing else, and only while the row's account stands (a deleted account's address is nobody's to
 * show). Case 3 used to return `guest.email` too, which an UNCONFIRMED sign-up could fill
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
 *
 * ★ AND WHOSE FACE A CREDIT WEARS, BY THE SAME CASES (crumbs-38, the viewer's credit: "takes a face and a
 * door"). A face belongs to exactly the people the album already shows one for: the host (case 1, the
 * "Hosted by" byline's face) and a PROVED name whose account still stands (case 2, the guest list's
 * face); a typed name (case 3) has no face to show, and nobody (case 4) is nobody. So the rule that names
 * a person also says whose face it would be (`faceOwner`), and decides it nowhere else: a second rule for
 * faces could promote an unproved name to a face the way a `user_id` test would promote it to "verified".
 * The owner is server-side only (it holds an account id): `uploader-faces.ts` turns it into the `face`
 * a credit draws, and every mapper copies that, field by field, never the owner.
 */

/**
 * A FACE AS THE CREDIT DRAWS IT (`media-lightbox-parts/credit.tsx`): the person's photograph where they
 * have one, their colour, and a door to their page where one exists. Resolved server-side alone
 * (`uploader-faces.ts`): `avatarUrl` is a URL, never a storage path; `seed` is `seedFor`'s one-way hash,
 * never an account id; `href` is `/u/<slug>`, only where a handle published a page.
 */
export type UploaderFace = {
  avatarUrl: string | null;
  seed: string;
  href: string | null;
};

/**
 * WHOSE FACE IT WOULD BE (server-side only, never on a wire): the event's host, or the account behind a
 * proved name with the guest row that carries it (a per-event block holds rows, so the guest's view can
 * leave a blocked person's face off by the row).
 */
export type FaceOwner =
  | { kind: "host" }
  | { kind: "account"; accountId: string; guestId: string };

export type UploaderIdentity = {
  displayName: string | null;
  email: string | null;
  isHost: boolean;
  /** An email was proved (guests.verified_at). False renders the unverified mark beside a name. */
  isVerified: boolean;
  /** Whose face it would be, by this rule (see the head). Optional only so a hand-built identity reads as faceless. */
  faceOwner?: FaceOwner | null;
  /** The face itself, once a surface that shows faces resolved it (`uploader-faces.ts`). */
  face?: UploaderFace | null;
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

/** Case 4 (and the missing-row fallback): no name, no address, no face, no claim of any kind. */
function nameless(): UploaderIdentity {
  return {
    displayName: null,
    email: null,
    isHost: false,
    isVerified: false,
    faceOwner: null,
  };
}

export function resolveUploaderIdentity(
  row: UploaderRow,
  hostName: string | null,
): UploaderIdentity {
  // 1. Host upload: no guest row at all (create_media_as_host inserts guest_id NULL). The host is
  // an account with a confirmed email by definition of having one, and `isHost` suppresses the
  // mark anyway — but saying `isVerified: true` here keeps "unverified" meaning one thing.
  // ★ The host's face is the byline's, and the byline shows only beside a host's name: a nameless host
  // wears no face here either.
  if (row.guest_id === null) {
    return {
      displayName: hostName,
      email: null,
      isHost: true,
      isVerified: true,
      faceOwner: hostName !== null ? { kind: "host" } : null,
    };
  }
  const guest = row.guests;
  // The defensive fallback (an over-eager delete left the media without its guest row) lands in
  // case 4: nobody named, and NEVER the host.
  if (!guest) return nameless();
  // 2. A proved email: the identity is the PROFILE's name, never a second name stored beside it.
  // A verified guest with a null profile name (a deleted account's surviving upload) resolves to no
  // name, so the caption renders nothing rather than mislabeling a real person.
  // ★ AND THE ADDRESS ONLY WHILE THE ACCOUNT STANDS (lp/identity-email). A deleted account's row
  // keeps `verified_at` (that is why it writes for nobody) and loses `user_id` to the FK, and the
  // address it carried belongs to nobody the host can reach: the host's viewer printed it beside a
  // nameless photograph. Deletion scrubs the column going forward; this is the net under the rows
  // the scrub never saw.
  // ★ AND THE FACE THE SAME WAY: the account's, only while it stands and only beside a name (a deleted
  // account's surviving upload names nobody, so it wears nobody's face).
  if (guest.verified_at !== null) {
    const displayName = guest.profiles?.display_name ?? null;
    return {
      displayName,
      email: guest.user_id !== null ? (guest.email ?? null) : null,
      isHost: false,
      isVerified: true,
      faceOwner:
        guest.user_id !== null && displayName !== null
          ? { kind: "account", accountId: guest.user_id, guestId: row.guest_id }
          : null,
    };
  }
  // 3. A typed name, unproven — and NO ADDRESS, ever. The row may carry `guests.email` from an
  // unconfirmed sign-up and `guests.pending_email` from the door's optional field; neither is proof
  // of anything, and the host's half of this identity is a name plus the mark. Returning one would
  // put an unproved address under a name the host has no way to check, which is the impersonation
  // the whole round exists to prevent.
  // ★ And NO FACE: a typed name keeps the plain disc everywhere (the guest list's rule), since a face
  // beside an unproved name would lend it the claim the mark withholds.
  if (guest.display_name !== null && guest.display_name.trim() !== "") {
    return {
      displayName: guest.display_name,
      email: null,
      isHost: false,
      isVerified: false,
      faceOwner: null,
    };
  }
  // 4. Nameless: minted before names were asked. Nobody is named, so nothing is claimed.
  return nameless();
}
