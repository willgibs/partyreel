import { describe, expect, it } from "vitest";

import { resolveGalleryAccess } from "@/lib/events/gallery-access";

// Minimal event shapes (only the two fields the resolver reads).
const open = { visibility: "open" as const, allow_anonymous_uploads: true };
const openAcct = { visibility: "open" as const, allow_anonymous_uploads: false };
const pw = { visibility: "password" as const, allow_anonymous_uploads: true };
const pwAcct = { visibility: "password" as const, allow_anonymous_uploads: false };

// An anonymous, not-unlocked, non-owner viewer (the strictest context).
const anon = { isOwner: false, isAuthed: false, isUnlocked: false };

describe("resolveGalleryAccess", () => {
  it("open + anonymous-allowed: always full (unchanged from today)", () => {
    expect(resolveGalleryAccess(open, anon)).toBe("full");
    expect(resolveGalleryAccess(open, { ...anon, isAuthed: true })).toBe("full");
  });

  it("open + account-required: teaser when signed out, full when signed in", () => {
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

  it("password + unlocked, anonymous-allowed: full", () => {
    expect(resolveGalleryAccess(pw, { ...anon, isUnlocked: true })).toBe("full");
  });

  it("password + unlocked, account-required: teaser until signed in, then full", () => {
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
