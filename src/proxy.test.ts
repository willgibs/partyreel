/**
 * THE PROXY HANDS THE GATES THEIR PATH (crumbs-11). A layout cannot read its own URL, so the (app)
 * and (print) gates learn the page a signed-out visitor asked for from REQUEST_PATH_HEADER. It is
 * written on every request, so a client's own copy never survives to a gate, and left off rather
 * than copied when the path is longer than any page a sign-in may return to.
 *
 * AND IT SENDS A LINK THAT NAMES NOTHING ON AS IT SENDS ANY PAGE, WITH NO STATUS OF ITS OWN
 * (gone-link-soft). Reshaped from stale-link's pin, which held the proxy's 404 for such a link: the
 * reason expired on Vercel, which answers a status on a request sent on with its own /404, so the
 * page's screen never rendered (build 30's red-team). The scar kept: the session refresh is handed
 * the request alone, whatever the path, so nothing here can carry a status to the page.
 *
 * ★ AND IT RUNS ONLY WHERE A SESSION MATTERS (compute-levers, the compute model's lever 1): the
 * pages that render a session on every host, and every path on the admin host. Read here the way
 * the build reads it (a value the build cannot read drops the whole matcher and the proxy runs on
 * everything again), then asked through Next's own matcher.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REQUEST_PATH_HEADER, RETURN_PATH_MAX } from "@/lib/auth/return-path";

const mocks = vi.hoisted(() => ({
  sent: [] as unknown[][],
  gateOpen: true,
  decision: "serve" as "serve" | "not-found",
}));

// The session refresh hands back the request it was given, so the test reads the headers the
// gates would read, and records every argument it was handed.
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: async (...args: unknown[]) => {
    mocks.sent.push(args);
    return args[0];
  },
}));
vi.mock("@/lib/design-gate/server", () => ({
  designGateOpen: () => mocks.gateOpen,
}));
vi.mock("@/lib/auth/admin-host", () => ({ isAdminHost: () => false }));
vi.mock("@/lib/surface", () => ({
  decideBySurface: () => mocks.decision,
  SURFACE_404_PATH: "/surface/not-served",
  surface: () => undefined,
}));

const { proxy, config } = await import("./proxy");

// Next's matcher utilities reach server modules that expect the runtime's AsyncLocalStorage global
// (Next's own server installs it; a test runner does not). ★ The docs name the utility
// `unstable_doesProxyMatch`; 16.2 ships it as `unstable_doesMiddlewareMatch`.
(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage ??=
  AsyncLocalStorage;
const { unstable_doesMiddlewareMatch } =
  await import("next/experimental/testing/server");
const { loadBindings, parse } = await import("next/dist/build/swc/index.js");
const { extractExportedConstValue } =
  await import("next/dist/build/analysis/extract-const-value.js");

async function forwarded(url: string, headers: Record<string, string> = {}) {
  const out = (await proxy(new NextRequest(url, { headers }))) as unknown;
  return (out as NextRequest).headers.get(REQUEST_PATH_HEADER);
}

beforeEach(() => {
  mocks.sent.length = 0;
  mocks.gateOpen = true;
  mocks.decision = "serve";
});

describe("the path the gates read", () => {
  it("is the request's own path, never its query", async () => {
    expect(await forwarded("https://partyreel.com/account/renew")).toBe(
      "/account/renew",
    );
    expect(await forwarded("https://partyreel.com/dashboard?welcome=pro")).toBe(
      "/dashboard",
    );
  });

  it("overwrites a client's own copy", async () => {
    expect(
      await forwarded("https://partyreel.com/account/renew", {
        [REQUEST_PATH_HEADER]: "//evil.example",
      }),
    ).toBe("/account/renew");
  });

  it("is left off, never copied, past the longest page a sign-in returns to", async () => {
    expect(
      await forwarded(
        `https://partyreel.com/e/${"a".repeat(RETURN_PATH_MAX)}`,
        {
          [REQUEST_PATH_HEADER]: "/account/renew",
        },
      ),
    ).toBeNull();
  });
});

describe("a link that names nothing", () => {
  it("is sent on as any page is: the request alone, never a status of the proxy's", async () => {
    // A browser's page load and an unfurler's (no Fetch Metadata), of a stale guest link, a handle
    // nobody holds, the card route under a stale link, and a page that is no link at all.
    const pageLoads: Record<string, string>[] = [
      { "sec-fetch-dest": "document" },
      {},
    ];
    for (const path of [
      "/e/stale-token",
      "/u/nobody-holds-this",
      "/e/stale-token/card",
      "/pricing",
    ]) {
      for (const headers of pageLoads) {
        mocks.sent.length = 0;
        const request = new NextRequest(`https://partyreel.com${path}`, {
          headers,
        });
        await proxy(request);
        expect(mocks.sent, path).toStrictEqual([[request]]);
      }
    }
  });
});

// ── Where the proxy runs ─────────────────────────────────────────────────────────────────────────

/** `config` as the build reads it: swc's parse of this file's source, then Next's own extraction. */
async function builtConfig() {
  await loadBindings();
  const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
  const ast = await parse(source, {
    isModule: "unknown",
    filename: "proxy.ts",
  });
  return extractExportedConstValue(ast, "config");
}

/** Whether the matcher takes this request: a page load unless `headers` say otherwise. */
function takes(
  path: string,
  host: string,
  headers: Record<string, string> = {},
): boolean {
  return unstable_doesMiddlewareMatch({
    config,
    url: path,
    headers: { host, ...headers },
  });
}

/** The two launch-prep aliases, read from the one script that assigns them. */
const ALIASES = Object.fromEntries(
  [
    ...readFileSync(
      new URL("../usher/kit/alias-ensure.mjs", import.meta.url),
      "utf8",
    ).matchAll(/label: "(app|admin)".*?alias: "([^"]+)"/g),
  ].map((m) => [m[1], m[2]]),
);
/** Every host the admin project answers on: its domain, local dev's, its alias and its own deployments. */
const ADMIN_HOSTS = [
  "admin.partyreel.com",
  "admin.localhost",
  ALIASES.admin,
  "partyreel-admin-k3x9q2m1a-partyreel.vercel.app",
  "partyreel-admin.vercel.app",
];
/** Every host the app answers on, local dev's included (the compute model measures on it). */
const APP_HOSTS = [
  "partyreel.com",
  "www.partyreel.com",
  ALIASES.app,
  "partyreel-k3x9q2m1a-partyreel.vercel.app",
  "localhost",
  "127.0.0.1",
];

/** A page load, a soft navigation's RSC, and a prefetch (each a separate invocation on Vercel). */
const REQUESTS: Record<string, Record<string, string>> = {
  "a page load": { "sec-fetch-dest": "document" },
  "an RSC navigation": { rsc: "1" },
  "a prefetch": { rsc: "1", "next-router-prefetch": "1" },
};

/** Pages that render a session (their layouts or pages ask `getUser()`, or a gate the proxy holds). */
const SESSION_PAGES = [
  "/dashboard",
  "/dashboard/3f1c2a4e-0000-4000-8000-000000000000/print",
  "/dashboard/3f1c2a4e-0000-4000-8000-000000000000/as-guest",
  "/account",
  "/account/renew",
  "/me",
  "/welcome",
  "/login",
  "/auth/callback",
  "/e/a-guest-token",
  "/e/a-guest-token/card",
  "/u/a-handle",
  "/report/a-guest-token",
  "/admin",
  "/admin/jobs",
  "/design",
  "/design/lab/kit",
];

/** What the app's hosts leave to the CDN or to a route's own session read. */
const NO_PROXY = [
  "/",
  "/pricing",
  "/privacy",
  "/terms",
  "/help/how-partyreel-works",
  "/blog",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/opengraph-image",
  "/demo",
  "/api/album/guest/sync",
  // The CDN's ask (X5): a proxy run is an invocation before the CDN, which would undo the cache it exists for.
  "/api/album/guest/sync/version",
  "/api/album/host/3f1c2a4e-0000-4000-8000-000000000000/sync",
  "/api/r2/presign-upload",
  "/api/guests/door",
  "/api/me/menu",
  "/api/stripe/webhook",
  "/api/cron/purge",
  "/api/design-gate",
  "/a-page-nobody-serves",
  // Prefixes of the session pages that are not their segments.
  "/events",
  "/events/weddings",
  "/media",
  "/author",
  "/reports",
  "/administrators",
  "/designs",
];

/**
 * Next's build output, the platform's beacons, static images and the manifest: no proxy on any host. ★ The manifest is
 * the shared layout's own link, on every page of both deployments (crumbs-81): a static route that renders no session,
 * so it is left alone on the admin host as the icons beside it are, rather than refused there by the allow-list (a 404
 * answering every portal page view) or run through a session refresh nothing reads.
 */
const STATIC = [
  "/_next/static/chunks/app.js",
  "/_next/image?url=%2Fhero.jpg&w=640&q=75",
  "/_vercel/insights/view",
  "/favicon.ico",
  "/icon.svg",
  "/icons/icon-192.png",
  "/manifest.webmanifest",
];

describe("★ where the proxy runs: only where a session matters (compute-levers)", () => {
  it("is the matcher the build reads, every value a literal it can read", async () => {
    expect(await builtConfig()).toStrictEqual({ value: config });
  });

  it("takes every page that renders a session, on every host, its RSC and its prefetch included", () => {
    for (const host of [...APP_HOSTS, ...ADMIN_HOSTS])
      for (const path of SESSION_PAGES)
        for (const [what, headers] of Object.entries(REQUESTS))
          expect(
            takes(path, host, headers),
            `${what} of ${path} on ${host}`,
          ).toBe(true);
  });

  it("leaves the marketing site, the metadata routes, the API routes and their prefetches alone on the app's hosts", () => {
    for (const host of APP_HOSTS)
      for (const path of NO_PROXY)
        for (const [what, headers] of Object.entries(REQUESTS))
          expect(
            takes(path, host, headers),
            `${what} of ${path} on ${host}`,
          ).toBe(false);
  });

  it("takes every path on the admin project's hosts, so its allow-list refuses what it does not serve", () => {
    expect(
      ALIASES.admin,
      "the admin alias, read from alias-ensure.mjs",
    ).toMatch(/^partyreel-admin-/);
    for (const host of ADMIN_HOSTS)
      for (const path of [...NO_PROXY, ...SESSION_PAGES])
        expect(takes(path, host), `${path} on ${host}`).toBe(true);
  });

  it("★ leaves only the manifest itself alone there: a path that merely starts like it is still the allow-list's to refuse", () => {
    for (const host of ADMIN_HOSTS)
      for (const path of [
        "/manifest.webmanifest/x",
        "/manifest.webmanifest.json",
        "/manifest.webmanifestx",
        "/manifest",
      ])
        expect(takes(path, host), `${path} on ${host}`).toBe(true);
  });

  it("names none of the app's hosts as the admin's, nor a host that only ends like one", () => {
    expect(ALIASES.app, "the app alias, read from alias-ensure.mjs").toMatch(
      /^partyreel-git-/,
    );
    for (const host of [...APP_HOSTS, "xadmin.partyreel.com", "admin"])
      expect(takes("/pricing", host), host).toBe(false);
  });

  it("leaves Next's build output, the beacons, static images and the manifest alone on every host", () => {
    for (const host of [...APP_HOSTS, ...ADMIN_HOSTS])
      for (const path of STATIC)
        expect(takes(path, host), `${path} on ${host}`).toBe(false);
  });
});

describe("what the proxy does where it runs", () => {
  it("refuses a path outside the surface with the real 404 before anything else, the refresh included", async () => {
    mocks.decision = "not-found";
    const res = await proxy(
      new NextRequest("https://admin.partyreel.com/pricing"),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://admin.partyreel.com/surface/not-served",
    );
    expect(mocks.sent).toStrictEqual([]);
  });

  it("refuses the lab without its key with the real 404, before any lab layout renders", async () => {
    mocks.gateOpen = false;
    const res = await proxy(
      new NextRequest("https://partyreel.com/design/lab/kit"),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://partyreel.com/design-gate/closed",
    );
    expect(mocks.sent).toStrictEqual([]);
  });
});
