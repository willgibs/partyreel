/**
 * Pins the request-scoped auth seam (lib/supabase/request-auth): every host
 * query module's defensive getUser() re-check must ride the ONE per-request
 * cached validation, never a fresh supabase.auth.getUser() call. A direct call
 * is not a security bug (the semantics are identical), but it silently re-adds
 * a network round-trip per query and erodes the dedupe this seam exists for.
 *
 * Source-text pin (like no-em-dash-policy.test.ts) because the seam is a
 * calling convention, not a runtime behavior a unit test can observe without
 * a live auth server.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const QUERIES_DIR = __dirname;
const REQUEST_AUTH = path.resolve(__dirname, "../../supabase/request-auth.ts");

function queryModules(): string[] {
  return readdirSync(QUERIES_DIR).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  );
}

describe("request-scoped auth policy", () => {
  it("no query module calls supabase.auth.getUser() directly", () => {
    const offenders = queryModules().filter((f) =>
      readFileSync(path.join(QUERIES_DIR, f), "utf8").includes(
        ".auth.getUser(",
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("request-auth owns the single getUser() and wraps it in cache()", () => {
    const src = readFileSync(REQUEST_AUTH, "utf8");
    expect(src).toContain(".auth.getUser()");
    expect(src).toContain("export const getRequestAuth = cache(");
    expect(src).toContain("export const getRequestClient = cache(");
  });
});
