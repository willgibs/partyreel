import { describe, expect, it } from "vitest";

import { resolveGalleryAccess } from "@/lib/events/gallery-access";

// Minimal event shapes (only the two fields the resolver reads). Keyed on the host's switch since
// the identity reshape (2026-09-21): `require_verified_email` false is a name-only event, true is
// one that asks a guest to prove an email before the album as well as before an upload.
const open = { visibility: "open" as const, require_verified_email: false };
const openAcct = { visibility: "open" as const, require_verified_email: true };
const pw = { visibility: "password" as const, require_verified_email: false };
const pwAcct = { visibility: "password" as const, require_verified_email: true };

// An anonymous, not-unlocked, non-owner viewer (the strictest context).
const anon = { isOwner: false, isAuthed: false, isUnlocked: false };

describe("resolveGalleryAccess", () => {
  it("open + name-only: always full (no gate to clear)", () => {
    expect(resolveGalleryAccess(open, anon)).toBe("full");
    expect(resolveGalleryAccess(open, { ...anon, isAuthed: true })).toBe("full");
  });

  it("open + verified-email required: teaser when signed out, full when signed in", () => {
    expect(resolveGalleryAccess(openAcct, anon)).toBe("teaser");
    expect(resolveGalleryAccess(openAcct, { ...anon, isAuthed: true })).toBe(
      "full",
    );
  });

  it("password + not unlocked: none, even for a signed-in viewer (no teaser before the password)", () => {
    expect(resolveGalleryAccess(pw, anon)).toBe("none");
    expect(resolveGalleryAccess(pwAcct, anon)).toBe("none");
    expect(resolveGalleryAccess(pwAcct, { ...anon, isAuthed: true })).toBe(
      "none",
    );
  });

  it("password + unlocked, name-only: full", () => {
    expect(resolveGalleryAccess(pw, { ...anon, isUnlocked: true })).toBe("full");
  });

  it("password + unlocked, verified-email required: teaser until signed in, then full", () => {
    expect(resolveGalleryAccess(pwAcct, { ...anon, isUnlocked: true })).toBe(
      "teaser",
    );
    expect(
      resolveGalleryAccess(pwAcct, {
        isOwner: false,
        isAuthed: true,
        isUnlocked: true,
      }),
    ).toBe("full");
  });

  it("owner bypasses every gate -> full", () => {
    const owner = { isOwner: true, isAuthed: false, isUnlocked: false };
    expect(resolveGalleryAccess(openAcct, owner)).toBe("full");
    expect(resolveGalleryAccess(pw, owner)).toBe("full"); // password not yet entered
    expect(resolveGalleryAccess(pwAcct, owner)).toBe("full");
  });
});
