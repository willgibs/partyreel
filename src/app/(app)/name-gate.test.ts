// @contract-for: src/app/(app)/name-gate.ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE NAME GATE IS WHOLE (name-gate, 2026-09-22): Will's ruling is that a
 * nameless account must never move around the app as a normal user, "even if
 * one character" is all the name rule asks. Before this gate, `/account` and
 * every `/dashboard/[eventId]/*` room rendered normally for a nameless
 * profile — only `/dashboard` and `/dashboard/new` redirected.
 *
 * This is a structural pin, not a page test: it reads source, so it never
 * needs a signed-in session (one cannot be minted locally — Google bounces to
 * production, per the track's own note). It guards the SHAPE rather than one
 * named route, so a THIRD top-level route added under (app) later without its
 * own gate fails this test by name, the same way a nested `(named)` group
 * would have refused to compile one outside itself.
 */

const APP_DIR = join(process.cwd(), "src", "app", "(app)");
const gate = readFileSync(join(APP_DIR, "name-gate.ts"), "utf8");

// Every route the gate must NOT reach: a nameless account has to be able to
// reach the one page that can name it, or it could never leave /welcome.
const EXEMPT = new Set(["welcome"]);

function topLevelRouteDirs(): string[] {
  return readdirSync(APP_DIR).filter((name) => {
    const full = join(APP_DIR, name);
    return statSync(full).isDirectory() && !name.startsWith("_");
  });
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

describe("the name gate's one function", () => {
  it("checks needsDisplayName and redirects to /welcome", () => {
    expect(gate).toMatch(
      /import\s*\{\s*needsDisplayName\s*\}\s*from\s*["']@\/lib\/welcome["']/,
    );
    expect(gate).toMatch(/needsDisplayName\(/);
    expect(gate).toMatch(/redirect\(\s*["']\/welcome["']\s*\)/);
  });

  it("reads the request-cached, cache()-wrapped getProfile(), never the header's getProfileMenu()", () => {
    // getProfileMenu() is a second, UNCACHED network round trip to the same
    // row the (app) layout already fetched for the header — see the WHY
    // comment in name-gate.ts. getProfile() is what dashboard/page.tsx,
    // dashboard/new/page.tsx, dashboard/[eventId]/page.tsx,
    // dashboard/[eventId]/reel/page.tsx and account/page.tsx already call, so
    // React's cache() makes this free on every one of those routes.
    expect(gate).toMatch(/from\s*["']@\/lib\/db\/queries\/profile["']/);
    expect(gate).toContain("getProfile()");
    // Not imported at all (the WHY comment above discusses it by name, which
    // is fine — this checks the import line, not the file's prose).
    expect(gate).not.toMatch(/import\s*\{[^}]*getProfileMenu/);
  });
});

describe("every (app) route but /welcome gates on it", () => {
  const dirs = topLevelRouteDirs();

  it("found more than just /welcome to check (a canary for the scan itself)", () => {
    expect(dirs.filter((d) => !EXEMPT.has(d)).length).toBeGreaterThan(0);
  });

  for (const dir of dirs) {
    if (EXEMPT.has(dir)) continue;
    it(`/${dir} has a layout.tsx that calls requireNamedProfile()`, () => {
      const layoutPath = join(APP_DIR, dir, "layout.tsx");
      expect(
        existsSync(layoutPath),
        `src/app/(app)/${dir}/layout.tsx is missing: every (app) route but ` +
          `/welcome must gate on requireNamedProfile(), once in its own layout`,
      ).toBe(true);
      const source = readFileSync(layoutPath, "utf8");
      expect(source).toMatch(
        /import\s*\{\s*requireNamedProfile\s*\}\s*from\s*["']@\/app\/\(app\)\/name-gate["']/,
      );
      expect(source).toContain("requireNamedProfile()");
    });
  }
});

describe("/welcome never gates itself", () => {
  it("no file under welcome/ imports requireNamedProfile (no redirect loop)", () => {
    const welcomeDir = join(APP_DIR, "welcome");
    const offenders = filesUnder(welcomeDir).filter((f) =>
      readFileSync(f, "utf8").includes("requireNamedProfile"),
    );
    expect(
      offenders,
      "a nameless account must always be able to reach /welcome itself",
    ).toEqual([]);
  });
});
