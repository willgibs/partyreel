/**
 * THE GUEST TICKET COOKIE'S FAMILY (the upload-owner lane, 2026-09-23): which cookies are tickets,
 * and the account sign-out's expiry of every one of them on its own response.
 */
import { describe, expect, it } from "vitest";

import {
  expireGuestSessionCookies,
  guestSessionCookieAttrs,
  isGuestSessionCookieName,
} from "@/lib/guest/session-cookie-family";

const EVENT = "33333333-3333-4333-8333-333333333333";

function fakeStore(names: string[]) {
  const writes: Record<string, unknown>[] = [];
  return {
    writes,
    getAll: () => names.map((name) => ({ name, value: "x" })),
    set: (cookie: Record<string, unknown>) => {
      writes.push(cookie);
    },
  };
}

describe("the family", () => {
  it("is every pr_guest_ cookie, and nothing that merely shares the word", () => {
    expect(isGuestSessionCookieName(`pr_guest_${EVENT}`)).toBe(true);
    expect(isGuestSessionCookieName("pr_guest_")).toBe(false);
    expect(isGuestSessionCookieName(`pr_unlock_${EVENT}`)).toBe(false);
    expect(isGuestSessionCookieName("pr_tile_size")).toBe(false);
    expect(isGuestSessionCookieName("sb-abc-auth-token")).toBe(false);
  });

  it("every write shares one set of attributes: HttpOnly, Lax, site-wide, sixty days", () => {
    expect(guestSessionCookieAttrs()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
  });
});

describe("expireGuestSessionCookies (the account sign-out's half)", () => {
  it("★ expires every ticket the request carried, with the family's own attributes", () => {
    const store = fakeStore([
      `pr_guest_${EVENT}`,
      "pr_guest_other-event",
      `pr_unlock_${EVENT}`,
      "pr_tile_size",
      "sb-abc-auth-token",
    ]);
    expect(expireGuestSessionCookies(store)).toBe(2);
    expect(store.writes).toEqual([
      expect.objectContaining({
        name: `pr_guest_${EVENT}`,
        value: "",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
      expect.objectContaining({ name: "pr_guest_other-event", maxAge: 0 }),
    ]);
  });

  it("writes nothing when the browser carried no ticket", () => {
    const store = fakeStore(["pr_tile_size"]);
    expect(expireGuestSessionCookies(store)).toBe(0);
    expect(store.writes).toEqual([]);
  });
});
