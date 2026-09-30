import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE SESSION REFRESH SENDS THE REQUEST ON, AND CAN CARRY A STATUS (stale-link). The proxy's 404 for a link that
 * names nothing rides the response this builds, so it must survive rule 3 of the header: the response returned is
 * the one the refreshed cookies were written to, even when the refresh rebuilds it mid-`getUser()`.
 */

const mocks = vi.hoisted(() => ({
  refresh: null as null | { name: string; value: string },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    {
      cookies,
    }: {
      cookies: {
        setAll: (c: { name: string; value: string; options: object }[]) => void;
      };
    },
  ) => ({
    auth: {
      // A token refresh writes its cookies through setAll during getUser(), as @supabase/ssr does.
      getUser: async () => {
        if (mocks.refresh) cookies.setAll([{ ...mocks.refresh, options: {} }]);
        return { data: { user: null }, error: null };
      },
    },
  }),
}));

const { updateSession } = await import("./middleware");

beforeEach(() => {
  mocks.refresh = null;
});

describe("updateSession", () => {
  it("sends the request on untouched by default", async () => {
    const res = await updateSession(new NextRequest("https://x.test/e/abc"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends it on with the status it is given", async () => {
    const res = await updateSession(new NextRequest("https://x.test/e/abc"), {
      status: 404,
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps the status on the response a refresh rebuilds, with the refreshed cookie on it", async () => {
    mocks.refresh = { name: "sb-test-auth-token", value: "fresh" };
    const res = await updateSession(new NextRequest("https://x.test/e/abc"), {
      status: 404,
    });
    expect(res.status).toBe(404);
    expect(res.cookies.get("sb-test-auth-token")?.value).toBe("fresh");
  });
});
