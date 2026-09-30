/**
 * THE PROXY HANDS THE GATES THEIR PATH (crumbs-11). A layout cannot read its own URL, so the (app)
 * and (print) gates learn the page a signed-out visitor asked for from REQUEST_PATH_HEADER. It is
 * written on every request, so a client's own copy never survives to a gate, and left off rather
 * than copied when the path is longer than any page a sign-in may return to.
 *
 * AND IT SENDS A LINK THAT NAMES NOTHING ON AS A 404 (stale-link): the status `lib/gone-link` decides
 * reaches the session refresh, which builds the response, and nothing else sets one.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REQUEST_PATH_HEADER, RETURN_PATH_MAX } from "@/lib/auth/return-path";

const mocks = vi.hoisted(() => ({
  status: undefined as 404 | undefined,
  init: [] as ({ status?: number } | undefined)[],
}));

// The session refresh hands back the request it was given, so the test reads the headers the
// gates would read, and records the status it was asked to send the request on with.
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: async (request: NextRequest, init?: { status?: number }) => {
    mocks.init.push(init);
    return request;
  },
}));
vi.mock("@/lib/gone-link", () => ({
  goneLinkStatus: async () => mocks.status,
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
  mocks.status = undefined;
  mocks.init.length = 0;
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
  it("is sent on with the 404 the gone-link check decides, through the session refresh", async () => {
    mocks.status = 404;
    await proxy(new NextRequest("https://partyreel.com/e/stale-token"));
    expect(mocks.init).toEqual([{ status: 404 }]);
  });

  it("leaves every other request's status alone", async () => {
    await proxy(new NextRequest("https://partyreel.com/e/live-token"));
    await proxy(new NextRequest("https://partyreel.com/pricing"));
    expect(mocks.init).toEqual([{ status: undefined }, { status: undefined }]);
  });
});
