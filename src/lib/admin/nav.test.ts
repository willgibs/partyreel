import { describe, expect, it } from "vitest";

import { isNavActive } from "@/lib/admin/nav";

// The header nav dropdown highlights the current surface; the match logic must treat /admin (Overview)
// as exact-only (it prefixes every route) while every other surface also claims its sub-paths.
describe("isNavActive", () => {
  it("matches /admin (Overview) only exactly", () => {
    expect(isNavActive("/admin", "/admin")).toBe(true);
    expect(isNavActive("/admin/accounts", "/admin")).toBe(false);
    expect(isNavActive("/admin/metrics", "/admin")).toBe(false);
  });

  it("matches a surface on its exact path or a sub-path", () => {
    expect(isNavActive("/admin/accounts", "/admin/accounts")).toBe(true);
    expect(isNavActive("/admin/accounts/6cb5fdb5", "/admin/accounts")).toBe(
      true,
    );
    expect(isNavActive("/admin/albums/abc-123", "/admin/albums")).toBe(true);
  });

  it("does not match a different surface or a prefix-only lookalike", () => {
    expect(isNavActive("/admin/accounts", "/admin/albums")).toBe(false);
    expect(isNavActive("/admin/accountsx", "/admin/accounts")).toBe(false);
  });
});
