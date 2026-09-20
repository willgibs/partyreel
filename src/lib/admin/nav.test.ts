import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

/**
 * ★ EVERY ADMIN PAGE IS IN THE NAV, AND THAT IS NOW A GATE (admin-wiring,
 * 2026-09-20). `/admin/exports` shipped for months reachable ONLY from the old
 * home's card grid, and `home=kpi` retired that grid: the surface would have
 * become unreachable from the rail, the breadcrumb and the palette at once,
 * with nothing failing. A surface nobody can navigate to is a surface nobody
 * maintains, so a new page under `src/app/admin/` either joins NAV or says here
 * why it is not a destination.
 */
const ROOT = process.cwd();
const ADMIN = join(ROOT, "src", "app", "admin");

/**
 * Routes that exist but are not places an operator navigates TO. Empty today,
 * and an entry added here needs a reason that survives being read aloud: a
 * surface quietly excused is the `/admin/exports` bug arriving again.
 */
const NOT_A_DESTINATION: Record<string, string> = {};

describe("the nav covers the portal", () => {
  it("lists every route segment that renders a page", () => {
    const segments = readdirSync(ADMIN)
      .filter((name) => !name.startsWith("[") && !name.startsWith("_"))
      .filter((name) => statSync(join(ADMIN, name)).isDirectory())
      .filter((name) => {
        // A folder with a page.tsx is a surface; one with only actions or a
        // route handler is machinery.
        try {
          return readdirSync(join(ADMIN, name)).includes("page.tsx");
        } catch {
          return false;
        }
      });
    const listed = new Set(NAV.map((item) => item.href));
    const missing = segments
      .filter((name) => !listed.has(`/admin/${name}`))
      .filter((name) => !NOT_A_DESTINATION[name]);
    expect(
      missing,
      "an admin page the nav cannot reach: add it to NAV, or name it in NOT_A_DESTINATION",
    ).toEqual([]);
  });

  it("keeps the Overview at the head, since it is what /admin renders", () => {
    expect(NAV[0].href).toBe("/admin");
  });
});
