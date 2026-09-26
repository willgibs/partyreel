import { describe, expect, it } from "vitest";

import { resolveGalleryDecision } from "@/lib/events/gallery-access";

// Minimal event shapes (only the three fields the resolver reads). Keyed on the host's switches:
// `require_verified_email` false is a name-only event, true is one that asks a guest to prove an
// email before the album; `require_upload_to_view` true asks for an upload before it.
const open = {
  visibility: "open" as const,
  require_verified_email: false,
  require_upload_to_view: false,
};
const openAcct = { ...open, require_verified_email: true };
const openUpload = { ...open, require_upload_to_view: true };
const openBoth = {
  ...open,
  require_verified_email: true,
  require_upload_to_view: true,
};
const pw = { ...open, visibility: "password" as const };
const pwAcct = { ...pw, require_verified_email: true };
const pwUpload = { ...pw, require_upload_to_view: true };

// An anonymous, not-unlocked, non-owner viewer who has not contributed but could (the strictest
// context a guest can arrive in). The two contribution fields are REQUIRED by the type on purpose:
// every caller has to answer the gate, including the two that hand out real bytes.
const anon = {
  isOwner: false,
  isAuthed: false,
  isUnlocked: false,
  hasContributed: false,
  canContribute: true,
};

describe("resolveGalleryDecision", () => {
  it("open + name-only + no upload switch: always full, no gate", () => {
    expect(resolveGalleryDecision(open, anon)).toEqual({
      access: "full",
      gate: null,
    });
    expect(
      resolveGalleryDecision(open, { ...anon, isAuthed: true }),
    ).toEqual({ access: "full", gate: null });
  });

  it("open + verified-email required: teaser/account signed out, full signed in", () => {
    expect(resolveGalleryDecision(openAcct, anon)).toEqual({
      access: "teaser",
      gate: "account",
    });
    expect(
      resolveGalleryDecision(openAcct, { ...anon, isAuthed: true }),
    ).toEqual({ access: "full", gate: null });
  });

  it("password + not unlocked: none/password, even for a signed-in viewer", () => {
    expect(resolveGalleryDecision(pw, anon)).toEqual({
      access: "none",
      gate: "password",
    });
    expect(resolveGalleryDecision(pwAcct, anon)).toEqual({
      access: "none",
      gate: "password",
    });
    expect(
      resolveGalleryDecision(pwAcct, { ...anon, isAuthed: true }),
    ).toEqual({ access: "none", gate: "password" });
  });

  it("password + unlocked, name-only: full", () => {
    expect(
      resolveGalleryDecision(pw, { ...anon, isUnlocked: true }),
    ).toEqual({ access: "full", gate: null });
  });

  it("password + unlocked, verified-email required: teaser/account until signed in", () => {
    expect(
      resolveGalleryDecision(pwAcct, { ...anon, isUnlocked: true }),
    ).toEqual({ access: "teaser", gate: "account" });
    expect(
      resolveGalleryDecision(pwAcct, {
        ...anon,
        isAuthed: true,
        isUnlocked: true,
      }),
    ).toEqual({ access: "full", gate: null });
  });

  it("owner bypasses every gate -> full", () => {
    const owner = { ...anon, isOwner: true };
    expect(resolveGalleryDecision(openAcct, owner)).toEqual({
      access: "full",
      gate: null,
    });
    expect(resolveGalleryDecision(pw, owner)).toEqual({
      access: "full",
      gate: null,
    }); // password not yet entered
    expect(resolveGalleryDecision(openUpload, owner)).toEqual({
      access: "full",
      gate: null,
    }); // and never asked for a photograph of their own event
  });

  /* ────────────────────────────────────────────────────────────────────────
     REQUIRE AN UPLOAD TO VIEW.
     ──────────────────────────────────────────────────────────────────────── */

  it("the switch ON gates a name-only viewer who has not contributed", () => {
    expect(resolveGalleryDecision(openUpload, anon)).toEqual({
      access: "teaser",
      gate: "upload",
    });
    // A CONFIRMED account is gated too: everyone but the host.
    expect(
      resolveGalleryDecision(openUpload, { ...anon, isAuthed: true }),
    ).toEqual({ access: "teaser", gate: "upload" });
  });

  it("one contribution opens the album for good", () => {
    expect(
      resolveGalleryDecision(openUpload, { ...anon, hasContributed: true }),
    ).toEqual({ access: "full", gate: null });
  });

  it("FAILS OPEN when a contribution is impossible (uploads closed, or the album full)", () => {
    // `canContribute` is `accepting_uploads && !albumFull`, resolved by the caller. False means
    // there is no step this guest could pass, so the album opens rather than trapping them.
    expect(
      resolveGalleryDecision(openUpload, { ...anon, canContribute: false }),
    ).toEqual({ access: "full", gate: null });
  });

  it("the account gate comes BEFORE the upload gate", () => {
    // Both switches on, nothing proved: the email is asked first, and only once it is confirmed
    // does the upload step appear.
    expect(resolveGalleryDecision(openBoth, anon)).toEqual({
      access: "teaser",
      gate: "account",
    });
    expect(
      resolveGalleryDecision(openBoth, { ...anon, isAuthed: true }),
    ).toEqual({ access: "teaser", gate: "upload" });
  });

  it("the password gate comes before both", () => {
    expect(resolveGalleryDecision(pwUpload, anon)).toEqual({
      access: "none",
      gate: "password",
    });
    expect(
      resolveGalleryDecision(pwUpload, { ...anon, isUnlocked: true }),
    ).toEqual({ access: "teaser", gate: "upload" });
  });

  it("the switch OFF ignores the contribution context entirely", () => {
    expect(
      resolveGalleryDecision(open, {
        ...anon,
        hasContributed: false,
        canContribute: true,
      }),
    ).toEqual({ access: "full", gate: null });
  });
});
