import { describe, expect, it } from "vitest";

import { NAV, isNavActive, navGroups } from "@/lib/admin/nav";

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

// The menu draws NAV in groups (the floating-surfaces wiring, 2026-09-17), and
// it reads them from here rather than holding a second copy of the list.
describe("navGroups", () => {
  it("keeps every surface, once, in NAV's own order", () => {
    const flat = navGroups().flatMap((g) => g.items);
    expect(flat).toEqual(NAV);
  });

  it("gives each group one block, so a surface cannot split its own heading", () => {
    const names = navGroups().map((g) => g.group);
    expect(new Set(names).size).toBe(names.length);
  });
});
