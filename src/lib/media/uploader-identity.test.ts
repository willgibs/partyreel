import { describe, expect, it } from "vitest";

import {
  resolveUploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";

const HOST = "Will Gibson";

describe("resolveUploaderIdentity", () => {
  it("host upload (guest_id null) -> host name + Host, no email", () => {
    const row: UploaderRow = { guest_id: null, guests: null };
    expect(resolveUploaderIdentity(row, HOST)).toEqual({
      displayName: "Will Gibson",
      email: null,
      isHost: true,
      isAnonymous: false,
    });
  });

  it("anonymous upload (guest row, no account) -> Anonymous, no name/email", () => {
    const row: UploaderRow = {
      guest_id: "g1",
      guests: { user_id: null, email: null, profiles: null },
    };
    expect(resolveUploaderIdentity(row, HOST)).toEqual({
      displayName: null,
      email: null,
      isHost: false,
      isAnonymous: true,
    });
  });

  it("logged-in guest -> their display name + verified guest email", () => {
    const row: UploaderRow = {
      guest_id: "g1",
      guests: {
        user_id: "u1",
        email: "alex@example.com",
        profiles: { display_name: "Alex" },
      },
    };
    expect(resolveUploaderIdentity(row, HOST)).toEqual({
      displayName: "Alex",
      email: "alex@example.com",
      isHost: false,
      isAnonymous: false,
    });
  });

  it("deleted account (user_id nulled by cascade) -> Anonymous, not the host", () => {
    const row: UploaderRow = {
      guest_id: "g1",
      guests: { user_id: null, email: "left@over.com", profiles: null },
    };
    const out = resolveUploaderIdentity(row, HOST);
    expect(out.isAnonymous).toBe(true);
    expect(out.isHost).toBe(false);
    expect(out.displayName).toBeNull();
    expect(out.email).toBeNull(); // anonymous never carries email
  });

  it("defensive: account guest with a NULL display name -> no name, NOT anonymous", () => {
    const row: UploaderRow = {
      guest_id: "g1",
      guests: { user_id: "u1", email: "a@x.com", profiles: { display_name: null } },
    };
    expect(resolveUploaderIdentity(row, HOST)).toMatchObject({
      displayName: null,
      isHost: false,
      isAnonymous: false,
    });
  });

  it("host upload when the host has no name -> Host with a null name (caption can hide)", () => {
    const row: UploaderRow = { guest_id: null, guests: null };
    expect(resolveUploaderIdentity(row, null)).toEqual({
      displayName: null,
      email: null,
      isHost: true,
      isAnonymous: false,
    });
  });
});
