/**
 * THE ONE PRECEDENCE RULE, pinned case by case (the identity reshape, 2026-09-21).
 *
 * The case that matters most here is the one wave 0 found against the applied schema and that no
 * type can catch: an UNCONFIRMED sign-up carries a real `user_id` AND keeps its typed name. Every
 * test below that sets `user_id` with a null `verified_at` exists to hold the line that a user id
 * alone proves nothing.
 */
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
      isAnonymous: false,
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
      isAnonymous: false,
    });
  });

  it("named guest, no proved email -> the TYPED name, unverified, never anonymous", () => {
    const out = resolveUploaderIdentity(
      guest({ display_name: "Maya J." }),
      HOST,
    );
    expect(out).toEqual({
      displayName: "Maya J.",
      email: null,
      isHost: false,
      isVerified: false,
      isAnonymous: false,
    });
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
    expect(out.isVerified).toBe(false);
    expect(out.isAnonymous).toBe(false);
  });

  it("nameless legacy row -> no name, unverified, isAnonymous (the only case that still is)", () => {
    expect(resolveUploaderIdentity(guest(), HOST)).toEqual({
      displayName: null,
      email: null,
      isHost: false,
      isVerified: false,
      isAnonymous: true,
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
    expect(out.isAnonymous).toBe(true);
  });

  it("a whitespace-only typed name does not count as a name", () => {
    const out = resolveUploaderIdentity(guest({ display_name: "   " }), HOST);
    expect(out.displayName).toBeNull();
    expect(out.isAnonymous).toBe(true);
  });

  it("deleted account (user_id nulled by cascade) -> nameless, not the host", () => {
    const out = resolveUploaderIdentity(
      guest({ email: "left@over.com" }),
      HOST,
    );
    expect(out.isAnonymous).toBe(true);
    expect(out.isHost).toBe(false);
    expect(out.displayName).toBeNull();
    expect(out.email).toBeNull(); // a nameless row never carries an email
  });

  it("defensive: a missing guest row attributes as nameless, NEVER as the host", () => {
    const row: UploaderRow = { guest_id: "g1", guests: null };
    expect(resolveUploaderIdentity(row, HOST)).toMatchObject({
      displayName: null,
      isHost: false,
      isVerified: false,
      isAnonymous: true,
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
      isAnonymous: false,
    });
  });
});
