import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE SESSION REFRESH SENDS THE REQUEST ON, AND RETURNS THE RESPONSE ITS COOKIES WERE WRITTEN TO (rule 3 of the
 * header): a token refresh rebuilds the response mid-`getUser()`, and returning any other would drop the refreshed
 * cookie and quietly sign the visitor out. Reshaped by gone-link-soft, which took out the status this could carry
 * (the proxy's 404 for a link that names nothing, stale-link): that reason expired on Vercel, which answers such a
 * status with its own /404 and never renders the page. The scar kept is the refresh's, and every response built here
 * is a plain `next`, at 200.
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
  it("sends the request on untouched", async () => {
    const res = await updateSession(new NextRequest("https://x.test/e/abc"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns the response a refresh rebuilds, with the refreshed cookie on it, still a plain next", async () => {
    mocks.refresh = { name: "sb-test-auth-token", value: "fresh" };
    const res = await updateSession(new NextRequest("https://x.test/e/abc"));
    expect(res.cookies.get("sb-test-auth-token")?.value).toBe("fresh");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
