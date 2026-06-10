import { describe, expect, it } from "vitest";

import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";

const s = (
  visibility: "open" | "password" | "private",
  accountRequired: boolean,
  acceptingUploads: boolean,
) => guestExperienceSummary({ visibility, accountRequired, acceptingUploads });

describe("guestExperienceSummary", () => {
  it("private collapses regardless of the other flags", () => {
    expect(s("private", false, true)).toMatch(/^Private\./);
    expect(s("private", true, false)).toMatch(/^Private\./);
  });

  it("open + anonymous: view and add (or uploads closed)", () => {
    expect(s("open", false, true)).toBe(
      "Anyone with the link can view and add photos.",
    );
    expect(s("open", false, false)).toContain("Uploads are closed");
    expect(s("open", false, false)).not.toContain("add");
  });

  it("password + anonymous: enter the password first", () => {
    expect(s("password", false, true)).toContain("enter the password");
    expect(s("password", false, true)).toContain("add photos");
  });

  it("open + account-required: leads with the preview, then a free account", () => {
    const r = s("open", true, true);
    expect(r).toContain("preview");
    expect(r).toContain("create a free account");
    expect(r).toContain("add their own");
  });

  it("password + account-required: password THEN account, no preview lead (privacy rule)", () => {
    const r = s("password", true, true);
    expect(r).toContain("enter the password");
    expect(r).toContain("create a free account");
    expect(r).not.toContain("preview"); // the teaser only appears AFTER the password
  });

  it("uploads closed drops the add clause", () => {
    expect(s("open", true, false)).toContain("Uploads are closed");
    expect(s("open", true, false)).not.toContain("add their own");
  });
});
