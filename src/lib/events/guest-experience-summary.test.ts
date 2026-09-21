import { describe, expect, it } from "vitest";

import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";

const s = (
  visibility: "open" | "password" | "private",
  requireVerifiedEmail: boolean,
  acceptingUploads: boolean,
) =>
  guestExperienceSummary({ visibility, requireVerifiedEmail, acceptingUploads });

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
