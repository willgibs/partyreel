/**
 * THE LIKE DOOR (`/dashboard/new/like/<token>`, after-party r1's `bridge=end`): keeps the album's token for Create, then
 * sends her on. What fails silently: a signed-out guest dropped at a sign-in that forgets where she was going, a token
 * that rides anywhere but Create's own page, a cookie a script cannot put down (Create puts it down as it opens), and a
 * token of the wrong shape kept at all. What the token lends is Create's page's to decide (`page.test.tsx`).
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}));

const { GET } = await import("./route");

const TOKEN = "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c";

function knock(token: string, origin = "https://partyreel.com") {
  return GET(new NextRequest(`${origin}/dashboard/new/like/${token}`), {
    params: Promise.resolve({ token }),
  });
}

beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: null } });
});

describe("the like door", () => {
  it("★ sends a signed-out guest to sign up, with Create as her return, the token kept for Create alone", async () => {
    const res = await knock(TOKEN);
    expect(res.status).toBe(303);
    const to = new URL(res.headers.get("location")!);
    expect(to.pathname).toBe("/login");
    expect(to.searchParams.get("intent")).toBe("create");
    expect(to.searchParams.get("next")).toBe("/dashboard/new");
    const cookie = res.cookies.get("pr_create_like");
    expect(cookie?.value).toBe(TOKEN);
    expect(cookie?.path).toBe("/dashboard/new");
    expect(cookie?.maxAge).toBe(1800);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.secure).toBe(true);
    // Create's own script puts it down as it opens in the style.
    expect(cookie?.httpOnly).toBe(false);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("★ sends a signed-in visitor straight into Create, the token kept the same way", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await knock(TOKEN);
    expect(new URL(res.headers.get("location")!).pathname).toBe(
      "/dashboard/new",
    );
    expect(res.cookies.get("pr_create_like")?.value).toBe(TOKEN);
  });

  it("keeps nothing of a token of the wrong shape, and opens Create as it always does", async () => {
    for (const bad of ["ab", "a".repeat(80), "maya jay", "x%2Fy"]) {
      const res = await knock(bad);
      expect(new URL(res.headers.get("location")!).pathname).toBe(
        "/dashboard/new",
      );
      expect(res.cookies.get("pr_create_like")).toBeUndefined();
    }
    expect(getUser).not.toHaveBeenCalled();
  });

  it("writes a plain-http cookie only on a local dev host", async () => {
    const res = await knock(TOKEN, "http://localhost:3132");
    expect(res.cookies.get("pr_create_like")?.secure).toBe(false);
  });
});
