import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { asGuestHref } from "@/lib/event/sections";

import {
  FRAME_ANCESTORS,
  FRAME_HEADERS,
  SECURITY_HEADER_RULES,
  SECURITY_HEADERS,
} from "./security-headers";

/**
 * NO OTHER SITE MAY FRAME THE APP, ON ANY ROUTE (crumbs-55: the clickjacking crumb `rooms-wiring` left).
 *
 * What is contract here, and none of it is wording:
 *
 *   1. BOTH FRAMING HEADERS ARRIVE ON EVERY KIND OF RESPONSE: a page, a route handler, the as-guest frame, the
 *      portal, the proxy's own 404 rewrite and a static asset. They are read through the rule set the way the
 *      server reads it (every matching `source`, in order, a later rule overriding an earlier one's key), so a
 *      `source` narrowed by accident, or a later rule that loosens one key for one path, goes red.
 *   2. IT IS `'self'`, NEVER `'none'`: See it as a guest frames the app's own page, and a same-origin frame is
 *      exactly what `'self'` admits. The frame's address must stay root-relative; the stage's own test pins the
 *      iframe's `src` as that, and this one pins the function that spells it.
 *   3. EVERY HEADER THE SET ALREADY SENT STILL ARRIVES, and the two that were decided on purpose still say so.
 *
 * It reads the rule set the config imports and the config's wiring (`next.config.ts` is not importable here: it
 * wraps itself in Sentry's build config). The live answer, on a running server, is `curl -sI`: the manifest's
 * Verify on, and the Orchestrator's alias pass.
 */

const ROOT = process.cwd();
const APP = join(ROOT, "src/app");
const require = createRequire(import.meta.url);

// Next compiles every `source` with its own copy of path-to-regexp (`load-custom-routes`), so a rule is matched
// here by the same library and not by an approximation of it.
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (path: string) => RegExp;
};

/**
 * The headers a response at `pathname` carries, as the server composes them: every rule whose `source` matches,
 * in order, the last to set a key winning ("Header Overriding Behavior", the headers doc). Only `source` is read,
 * so a rule that is conditional (`has`, `missing`) or prefixed differently throws rather than pass unmeasured.
 */
function headersAt(pathname: string): Map<string, string> {
  const sent = new Map<string, string>();
  for (const rule of SECURITY_HEADER_RULES) {
    for (const unread of ["has", "missing", "basePath", "locale"])
      if (unread in rule)
        throw new Error(
          `a rule with \`${unread}\` needs this matcher taught it first`,
        );
    if (!pathToRegexp(rule.source).test(pathname)) continue;
    for (const { key, value } of rule.headers)
      sent.set(key.toLowerCase(), value);
  }
  return sent;
}

/** The URL a route file serves: groups are not in the address, a `[param]` takes a value, `_private` serves none. */
function addressOf(file: string): string | null {
  const segments = relative(APP, file).split(sep).slice(0, -1);
  if (segments.some((s) => s.startsWith("_") || s.startsWith("@"))) return null;
  return `/${segments
    .filter((s) => !/^\(.*\)$/.test(s))
    .map((s) => (/^\[.+\]$/.test(s) ? "x" : s))
    .join("/")}`;
}

/** Every page and route handler under `src/app`, as the address it answers at. */
function routes(dir: string, found: { page: string[]; handler: string[] }) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      routes(path, found);
    } else if (/^(page\.tsx|route\.tsx?)$/.test(entry.name)) {
      const address = addressOf(path);
      if (address)
        (entry.name.startsWith("route") ? found.handler : found.page).push(
          address,
        );
    }
  }
  return found;
}

const found = routes(APP, { page: [], handler: [] });

const FRAMING = [
  ["content-security-policy", "frame-ancestors 'self'"],
  ["x-frame-options", "SAMEORIGIN"],
] as const;

function expectFramingAt(pathname: string) {
  const sent = headersAt(pathname);
  for (const [key, value] of FRAMING)
    expect(sent.get(key), `${key} at ${pathname}`).toBe(value);
}

describe("the framing refusal", () => {
  it("states the policy once: only the app's own origin may frame it", () => {
    expect(FRAME_ANCESTORS).toBe("frame-ancestors 'self'");
    expect(FRAME_HEADERS).toEqual([
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ]);
    // A bare `frame-ancestors` policy: no other directive may ride this header by accident (a `default-src`
    // would start restricting what pages load, which is the project this one deliberately is not).
    expect(FRAME_ANCESTORS).not.toMatch(/;|default-src|script-src/);
  });

  it("arrives on a page, a route handler and the as-guest frame", () => {
    expectFramingAt("/");
    expectFramingAt("/api/guests");
    expectFramingAt(
      new URL(asGuestHref("e1", true), "https://x.test").pathname,
    );
    expectFramingAt(
      new URL(asGuestHref("e1", false), "https://x.test").pathname,
    );
  });

  it("arrives on the portal, the proxy's 404 rewrite, a static asset and a file in public", () => {
    for (const pathname of [
      "/admin",
      "/admin/jobs",
      // `proxy.ts` rewrites a refused path here (`SURFACE_404_PATH`): the rewrite's response is the 404 page.
      "/surface/not-served",
      "/_next/static/chunks/app.js",
      "/robots.txt",
    ])
      expectFramingAt(pathname);
  });

  it("arrives on every page and route handler the app has", () => {
    // The inventory is read off the tree, so a route added tomorrow is held by this test with no edit to it.
    expect(
      found.page.length,
      "no pages found: the walk is broken",
    ).toBeGreaterThan(40);
    expect(
      found.handler.length,
      "no route handlers found: the walk is broken",
    ).toBeGreaterThan(20);
    for (const pathname of [...found.page, ...found.handler])
      expectFramingAt(pathname);
  });

  it("names real routes in its samples", () => {
    // The samples above are not invented paths: the route handler and the as-guest page exist.
    expect(existsSync(join(APP, "api/guests/route.ts"))).toBe(true);
    expect(
      existsSync(join(APP, "(as-guest)/dashboard/[eventId]/as-guest/page.tsx")),
    ).toBe(true);
    expect(found.handler).toContain("/api/guests");
    expect(found.page).toContain("/dashboard/x/as-guest");
  });

  it("admits the as-guest frame: it is the app's own page, at a root-relative address", () => {
    // `'self'` admits a frame of the same origin as its parent; a root-relative `src` is that on every host. An
    // absolute address (the site URL) would be another origin on a preview alias, and the browser would refuse it.
    for (const framed of [true, false]) {
      const href = asGuestHref("e1", framed);
      expect(href).toMatch(/^\/(?!\/)/);
      expect(new URL(href, "https://alias.test").origin).toBe(
        "https://alias.test",
      );
    }
  });
});

describe("what the set already sent", () => {
  const sent = headersAt("/");

  it("still sends every header it sent", () => {
    for (const key of [
      "strict-transport-security",
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy",
    ])
      expect(sent.has(key), key).toBe(true);
    expect(sent.get("x-content-type-options")).toBe("nosniff");
  });

  it("★ keeps HSTS off the preload list: that is a one-way door, a launch-checklist item", () => {
    const hsts = sent.get("strict-transport-security") ?? "";
    expect(hsts).not.toMatch(/preload/i);
    expect(Number(/max-age=(\d+)/.exec(hsts)?.[1])).toBeGreaterThanOrEqual(
      63072000,
    );
  });

  it("★ keeps the camera and its microphone the site's own (an empty list silences every camera video)", () => {
    const policy = sent.get("permissions-policy") ?? "";
    expect(policy).toMatch(/camera=\(self\)/);
    expect(policy).toMatch(/microphone=\(self\)/);
  });

  it("sends each key once", () => {
    const keys = SECURITY_HEADERS.map(({ key }) => key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("next.config.ts wires the one set", () => {
  const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");

  it("returns the rule set from headers(), and keeps no copy of it", () => {
    expect(config).toMatch(/from "\.\/src\/lib\/security-headers"/);
    expect(config).toMatch(
      /async headers\(\)\s*\{\s*return SECURITY_HEADER_RULES;?\s*\}/,
    );
    // One home: a second inlined set would drift from the one this file holds.
    expect(config).not.toMatch(/X-Frame-Options|frame-ancestors/);
    expect(config).not.toMatch(/Strict-Transport-Security/);
  });
});
