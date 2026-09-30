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
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REQUEST_PATH_HEADER, RETURN_PATH_MAX } from "@/lib/auth/return-path";

const mocks = vi.hoisted(() => ({ sent: [] as unknown[][] }));

// The session refresh hands back the request it was given, so the test reads the headers the
// gates would read, and records every argument it was handed.
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: async (...args: unknown[]) => {
    mocks.sent.push(args);
    return args[0];
  },
}));
vi.mock("@/lib/design-gate/server", () => ({ designGateOpen: () => true }));
vi.mock("@/lib/auth/admin-host", () => ({ isAdminHost: () => false }));
vi.mock("@/lib/surface", () => ({
  decideBySurface: () => "serve",
  SURFACE_404_PATH: "/surface/not-served",
  surface: () => undefined,
}));

const { proxy } = await import("./proxy");

async function forwarded(url: string, headers: Record<string, string> = {}) {
  const out = (await proxy(new NextRequest(url, { headers }))) as unknown;
  return (out as NextRequest).headers.get(REQUEST_PATH_HEADER);
}

beforeEach(() => {
  mocks.sent.length = 0;
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
