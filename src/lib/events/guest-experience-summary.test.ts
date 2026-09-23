import { describe, expect, it } from "vitest";

import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";

const s = (
  visibility: "open" | "password" | "private",
  requireVerifiedEmail: boolean,
  acceptingUploads: boolean,
  // Defaults OFF so every existing call below still exercises the pre-door-round behavior
  // unchanged (the eight OFF sentences stand exactly as they were).
  requireUploadToView = false,
) =>
  guestExperienceSummary({
    visibility,
    requireVerifiedEmail,
    acceptingUploads,
    requireUploadToView,
  });

describe("guestExperienceSummary", () => {
  it("private collapses regardless of the other flags", () => {
    expect(s("private", false, true)).toMatch(/^Private\./);
    expect(s("private", true, false)).toMatch(/^Private\./);
  });

  it("open + unverified names: view and add under a chosen name (or uploads closed)", () => {
    expect(s("open", false, true)).toBe(
      "Anyone with the link can view and add photos under a name they choose.",
    );
    expect(s("open", false, false)).toContain("Uploads are closed");
    expect(s("open", false, false)).not.toContain("add");
  });

  it("password + unverified names: enter the password first, then a chosen name", () => {
    expect(s("password", false, true)).toContain("enter the password");
    expect(s("password", false, true)).toContain("add photos");
    expect(s("password", false, true)).toContain("a name they choose");
  });

  it("open + verified email required: leads with the preview, then confirming an email", () => {
    const r = s("open", true, true);
    expect(r).toContain("preview");
    expect(r).toContain("confirm their email");
    expect(r).toContain("add their own");
  });

  it("password + verified email required: password THEN email, no preview lead (privacy rule)", () => {
    const r = s("password", true, true);
    expect(r).toContain("enter the password");
    expect(r).toContain("confirm their email");
    expect(r).not.toContain("preview"); // the teaser only appears AFTER the password
  });

  it("uploads closed drops the add clause", () => {
    expect(s("open", true, false)).toContain("Uploads are closed");
    expect(s("open", true, false)).not.toContain("add their own");
  });

  it("unverified names never claim anonymity: every add clause names a chosen name", () => {
    expect(s("open", false, true)).toContain("a name they choose");
    expect(s("password", false, true)).toContain("a name they choose");
  });
});

describe("guestExperienceSummary: Require an upload to view (Will, the door as three steps, 2026-09-21)", () => {
  it("open + unverified names, ON: composes its own sentence (never appends a clause)", () => {
    expect(s("open", false, true, true)).toBe(
      "Guests give a name and add a photo, then see everything.",
    );
  });

  it("open + verified email, ON: the identity clause swaps to confirming an email", () => {
    expect(s("open", true, true, true)).toBe(
      "Guests confirm their email and add a photo, then see everything.",
    );
  });

  it("password + unverified names, ON: the password leads, then the same compose", () => {
    expect(s("password", false, true, true)).toBe(
      "Guests enter the password, then give a name and add a photo, then see everything.",
    );
  });

  it("password + verified email, ON: the password leads, then confirming an email", () => {
    expect(s("password", true, true, true)).toBe(
      "Guests enter the password, then confirm their email and add a photo, then see everything.",
    );
  });

  it("uploads closed makes the gate moot: the OFF sentence stands even with the switch ON (mirrors get_upload_gate's fail-open)", () => {
    expect(s("open", false, false, true)).toBe(s("open", false, false, false));
    expect(s("open", true, false, true)).toBe(s("open", true, false, false));
    expect(s("password", false, false, true)).toBe(
      s("password", false, false, false),
    );
    expect(s("password", true, false, true)).toBe(
      s("password", true, false, false),
    );
  });

  it("private collapses regardless of the upload gate", () => {
    expect(s("private", false, true, true)).toMatch(/^Private\./);
    expect(s("private", true, true, true)).toMatch(/^Private\./);
  });
});
