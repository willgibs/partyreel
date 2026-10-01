/**
 * THE ONE PRECEDENCE RULE, pinned case by case (the identity reshape, 2026-09-21).
 *
 * The case that matters most here is the one wave 0 found against the applied schema and that no
 * type can catch: an UNCONFIRMED sign-up carries a real `user_id` AND keeps its typed name. Every
 * test below that sets `user_id` with a null `verified_at` exists to hold the line that a user id
 * alone proves nothing.
 *
 * ★ AND SINCE THE GUEST IDENTITY ROUND (Will, 2026-09-22): `email` comes back from CASE 2 AND FROM
 * NOWHERE ELSE. `guests.email` means "confirmed, copied from auth.users"; case 3 used to hand back
 * whatever sat in that column, which an unconfirmed sign-up could fill through the newsletter
 * capture, and the host gallery would then have printed an unproved address beside an unverified
 * mark. That is the exact impersonation this guards against ("there's no impersonation risk if the host
 * can't see the attributed email of an unconfirmed account"), so case 3 now returns null always.
 *
 * ★ AND WHOSE FACE (crumbs-38): every identity names its `faceOwner` by the same cases, so the whole-shape
 * assertions below carry it (reshaped on purpose: an identity is now a name, two flags, an address and whose
 * face; the scars they hold are unchanged). The face's own rules are the describe at the foot.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  resolveUploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";

const HOST = "Will Gibson";
const CONFIRMED = "2026-09-21T15:00:00.000Z";

/** A guest row with the reshape's four identity columns, defaulted to a nameless legacy row. */
function guest(over: Partial<NonNullable<UploaderRow["guests"]>> = {}) {
  return {
    guest_id: "g1",
    guests: {
      user_id: null,
      email: null,
      display_name: null,
      verified_at: null,
      profiles: null,
      ...over,
    },
  } satisfies UploaderRow;
}

describe("resolveUploaderIdentity", () => {
  it("host upload (guest_id null) -> host name + Host, verified, no email", () => {
    const row: UploaderRow = { guest_id: null, guests: null };
    expect(resolveUploaderIdentity(row, HOST)).toEqual({
      displayName: "Will Gibson",
      email: null,
      isHost: true,
      isVerified: true,
      faceOwner: { kind: "host" },
    });
  });

  it("host upload when the host has no name -> Host with a null name (caption can hide)", () => {
    const row: UploaderRow = { guest_id: null, guests: null };
    expect(resolveUploaderIdentity(row, null)).toMatchObject({
      displayName: null,
      isHost: true,
    });
  });

  it("verified guest -> the PROFILE's name, verified, with the guest email", () => {
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "alex@example.com",
        verified_at: CONFIRMED,
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out).toEqual({
      displayName: "Alex",
      email: "alex@example.com",
      isHost: false,
      isVerified: true,
      faceOwner: { kind: "account", accountId: "u1", guestId: "g1" },
    });
  });

  it("named guest, no proved email -> the TYPED name, unverified", () => {
    const out = resolveUploaderIdentity(
      guest({ display_name: "Maya J." }),
      HOST,
    );
    expect(out).toEqual({
      displayName: "Maya J.",
      email: null,
      isHost: false,
      isVerified: false,
      faceOwner: null,
    });
  });

  it("★ CASE 3 NEVER RETURNS AN ADDRESS, even when the row is carrying one", () => {
    // The crack the guest identity round closed. `guests.email` on an UNVERIFIED row can only have
    // come from an unconfirmed sign-up (the newsletter capture now refuses one, but rows written
    // before that gate exist), and the host gallery prints this field. A name plus the mark is the
    // whole of an unproven guest's identity, in every direction.
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "not-actually-proved@example.com",
        display_name: "Maya J.",
        verified_at: null,
      }),
      HOST,
    );
    expect(out.displayName).toBe("Maya J.");
    expect(out.email).toBeNull();
    expect(out.isVerified).toBe(false);
  });

  it("★ the resolver never READS `pending_email`, in any spelling", () => {
    // The typed, unproved address is INERT: never shown to the host or another guest, never
    // attributed. The pin is on the ACCESS, not the word (the module's head comment explains why
    // the column is absent, and that sentence is worth keeping): no property read, no optional
    // read, and no key on the row type or the returned identity.
    const code = readFileSync(
      join(process.cwd(), "src/lib/media/uploader-identity.ts"),
      "utf8",
    )
      .split("\n")
      // Comment lines out: the head comment NAMES the column to explain why it is absent, and that
      // sentence is the most valuable line in the file.
      .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
      .join("\n");
    for (const forbidden of ["pending_email", "pendingEmail"]) {
      expect(code, forbidden).not.toContain(forbidden);
    }
  });

  it("★ an UNCONFIRMED account keeps its typed name and is NOT verified (user_id alone proves nothing)", () => {
    // The exact row wave 0 found: a uid, an email on file, a profile name to steal, and no
    // confirmation. Keying on user_id would render "Alex", verified. It must render the typed name,
    // marked.
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "alex@example.com",
        display_name: "Maya J.",
        verified_at: null,
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out.displayName).toBe("Maya J.");
    expect(out.email).toBeNull();
    expect(out.isVerified).toBe(false);
  });

  it("nameless legacy row -> nobody named: no name, no address, no claim (never 'A guest')", () => {
    // Only a row minted before names were asked lands here (create_guest refuses a nameless mint
    // by an unconfirmed caller). The identity carries no flag that a surface could turn into an
    // invented person: the credit shows no name, exactly as for a deleted account's upload.
    expect(resolveUploaderIdentity(guest(), HOST)).toEqual({
      displayName: null,
      email: null,
      isHost: false,
      isVerified: false,
      faceOwner: null,
    });
  });

  it("an unconfirmed account with NO typed name is nameless too, never the profile's name", () => {
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "alex@example.com",
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out.displayName).toBeNull();
    expect(out.email).toBeNull();
    expect(out.isVerified).toBe(false);
  });

  it("a whitespace-only typed name does not count as a name", () => {
    const out = resolveUploaderIdentity(guest({ display_name: "   " }), HOST);
    expect(out.displayName).toBeNull();
    expect(out.isVerified).toBe(false);
  });

  it("deleted account (user_id nulled by cascade) -> nameless, not the host", () => {
    const out = resolveUploaderIdentity(
      guest({ email: "left@over.com" }),
      HOST,
    );
    expect(out.isHost).toBe(false);
    expect(out.displayName).toBeNull();
    expect(out.email).toBeNull(); // a nameless row never carries an email
  });

  it("defensive: a missing guest row attributes as nameless, NEVER as the host", () => {
    const row: UploaderRow = { guest_id: "g1", guests: null };
    expect(resolveUploaderIdentity(row, HOST)).toEqual({
      displayName: null,
      email: null,
      isHost: false,
      isVerified: false,
      faceOwner: null,
    });
  });

  it("defensive: a verified guest with a null profile name shows nothing, but stays verified", () => {
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "a@x.com",
        verified_at: CONFIRMED,
        profiles: { display_name: null },
      }),
      HOST,
    );
    expect(out).toMatchObject({
      displayName: null,
      isHost: false,
      isVerified: true,
    });
  });

  it("★ a DELETED account's verified row returns no address: case 2 names an email only while user_id stands", () => {
    // lp/identity-email. The FK nulled `user_id` and the join lost the profile, but `verified_at` and
    // the address the account proved stayed on the row, so the host's viewer printed a deleted
    // person's email beside a nameless photograph (credit.tsx draws `uploaderEmail` even when no
    // name is drawn). Deletion scrubs the column now; this holds for the rows it never reached.
    const out = resolveUploaderIdentity(
      guest({
        user_id: null,
        email: "left@over.com",
        verified_at: CONFIRMED,
        profiles: null,
      }),
      HOST,
    );
    expect(out).toEqual({
      displayName: null,
      email: null,
      isHost: false,
      isVerified: true,
      faceOwner: null,
    });
  });

  it("the same verified row keeps its address while its account stands", () => {
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        email: "alex@example.com",
        verified_at: CONFIRMED,
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out.email).toBe("alex@example.com");
  });
});

describe("whose face a credit wears, by the same cases (crumbs-38)", () => {
  it("the host's own upload wears the host's face, the byline's, only beside the host's name", () => {
    const row: UploaderRow = { guest_id: null, guests: null };
    expect(resolveUploaderIdentity(row, HOST).faceOwner).toEqual({
      kind: "host",
    });
    // The byline shows only with a host name, so a nameless host shows no face anywhere.
    expect(resolveUploaderIdentity(row, null).faceOwner).toBeNull();
  });

  it("a proved name wears its account's face, with the row it rides on", () => {
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        verified_at: CONFIRMED,
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out.faceOwner).toEqual({
      kind: "account",
      accountId: "u1",
      guestId: "g1",
    });
  });

  it("★ a typed name wears no face, even with a real account behind it (user_id alone proves nothing)", () => {
    // The face is a claim like the mark's absence: an unconfirmed sign-up's account must never lend its
    // photograph to the name it typed.
    const out = resolveUploaderIdentity(
      guest({
        user_id: "u1",
        display_name: "Maya J.",
        verified_at: null,
        profiles: { display_name: "Alex" },
      }),
      HOST,
    );
    expect(out.faceOwner).toBeNull();
  });

  it("a deleted account's surviving upload, and a proved row with no name, wear nobody's face", () => {
    expect(
      resolveUploaderIdentity(
        guest({ user_id: null, verified_at: CONFIRMED, profiles: null }),
        HOST,
      ).faceOwner,
    ).toBeNull();
    expect(
      resolveUploaderIdentity(
        guest({
          user_id: "u1",
          verified_at: CONFIRMED,
          profiles: { display_name: null },
        }),
        HOST,
      ).faceOwner,
    ).toBeNull();
  });
});
