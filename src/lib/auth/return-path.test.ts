import { describe, expect, it } from "vitest";

import {
  loginPath,
  matchesPathShape,
  NEXT_PARAM,
  RETURN_PATH_MAX,
  signInLanding,
  signInReturn,
  withReturn,
} from "./return-path";

/**
 * THE PAGE A SIGN-IN RETURNS TO, AND EVERYTHING IT REFUSES (crumbs-11).
 *
 * A signed-out host pressing a mail's button goes through the gate, /login and a sign-in and must
 * land on the button's page; the same string, handed to router.push and to the OAuth and email
 * redirects, is the one a hostile link would dress up. This pins the ALLOW-LIST's behaviour, not
 * its regexes: every legal page is accepted as itself, and every refusal below, however it is
 * dressed, comes back as nothing at all (the caller's default), never a cleaned-up copy.
 */

const EVENT = "9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8";

describe("the pages a sign-in may return to", () => {
  const pages = [
    // The mails' buttons: Renew Event Pass, and Manage storage / Keep / Restore my event.
    "/account/renew",
    "/dashboard",
    // The rest of the host app the (app) and (print) gates protect.
    "/dashboard/new",
    `/dashboard/${EVENT}`,
    `/dashboard/${EVENT.toUpperCase()}`,
    `/dashboard/${EVENT}/guests`,
    `/dashboard/${EVENT}/reel`,
    `/dashboard/${EVENT}/review`,
    `/dashboard/${EVENT}/settings`,
    `/dashboard/${EVENT}/print`,
    "/account",
    "/account/profile",
    "/welcome",
    // The portal's own gate sends `?next=/admin`.
    "/admin",
    // A guest's door comes back to the album (a token or a custom link) or a profile page.
    "/e/0123456789abcdef0123456789abcdef",
    "/e/sarahs-wedding",
    "/e/qr-token",
    "/u/maya-j",
  ];

  it.each(pages)("accepts %s as itself", (page) => {
    expect(signInReturn(page)).toBe(page);
  });

  it("survives the round trip through a query string", () => {
    for (const page of pages) {
      const login = new URL(loginPath(page), "https://partyreel.com");
      expect(login.pathname).toBe("/login");
      expect(login.searchParams.get(NEXT_PARAM)).toBe(page);
    }
  });
});

describe("everything else is refused, and comes back as nothing", () => {
  // Each of these has broken a hand-rolled redirect guard somewhere; together they are why this is
  // an allow-list and not a blocklist.
  const hostile: [string, string][] = [
    // A scheme, any scheme.
    ["an absolute URL", "https://evil.example/steal"],
    ["plain http", "http://evil.example"],
    ["a script", "javascript:alert(1)"],
    ["data", "data:text/html,<script>alert(1)</script>"],
    ["a scheme with no slashes", "https:evil.example"],
    // The protocol-relative host.
    ["two slashes", "//evil.example"],
    ["three slashes", "///evil.example"],
    ["two slashes after a page", "/dashboard//evil.example"],
    // Backslash tricks: browsers read `\` as `/` in an http(s) URL.
    ["slash backslash", "/\\evil.example"],
    ["two backslashes", "\\\\evil.example"],
    ["backslash slash", "\\/evil.example"],
    ["a backslash inside a page", "/dashboard\\..\\admin"],
    // Encoded escapes, once and twice.
    ["an encoded slash pair", "/%2F%2Fevil.example"],
    ["an encoded backslash", "/%5Cevil.example"],
    ["an encoded traversal", "/dashboard%2F..%2Fadmin"],
    ["a double-encoded slash pair", "/%252F%252Fevil.example"],
    ["an encoded page", "%2Faccount%2Frenew"],
    // Dot segments.
    ["a traversal", "/dashboard/../admin/accounts"],
    ["a dot segment", "/./dashboard"],
    ["a traversal out of an album", "/e/../../admin"],
    // Userinfo and hosts dressed as paths.
    ["userinfo", "/@evil.example"],
    ["a host with a port", "evil.example:443/dashboard"],
    // A query or a fragment, even on a page on the list.
    ["a query", "/dashboard?welcome=pro"],
    ["a nested next", "/account/renew?next=https://evil.example"],
    ["a fragment", "/account#plan"],
    // Whitespace and control characters.
    ["a leading space", " /dashboard"],
    ["a trailing space", "/dashboard "],
    ["a tab", "/dash\tboard"],
    ["a newline", "/dashboard\n"],
    ["a header splice", "/account\r\nLocation: https://evil.example"],
    ["a NUL", "/dashboard\u0000"],
    ["a line separator", "/dashboard "],
    ["a full-width solidus pair", "／／evil.example"],
    // Look-alikes of pages on the list.
    ["a trailing slash", "/dashboard/"],
    ["a longer word", "/dashboardx"],
    ["another case", "/Dashboard"],
    ["a page under a page", `/dashboard/${EVENT}/reel/x`],
    ["a room that is not a page", `/dashboard/${EVENT}/share`],
    ["a short event id", "/dashboard/9f1c2b3a"],
    ["an album sub-path", "/e/sarahs-wedding/x"],
    // Pages that are real but never a sign-in's return.
    ["the login page", "/login"],
    ["the callback", "/auth/callback"],
    ["an API route", "/api/stripe/checkout"],
    ["a portal page", "/admin/accounts"],
    ["account deletion", "/account/delete"],
    ["the marketing home", "/"],
    ["nothing", ""],
  ];

  it.each(hostile)("refuses %s", (_, value) => {
    expect(signInReturn(value)).toBeNull();
    expect(loginPath(value)).toBe("/login");
    expect(signInLanding(value, false)).toBe("/dashboard");
    expect(signInLanding(value, true)).toBe("/admin");
  });

  it("refuses anything that is not a string", () => {
    for (const value of [
      undefined,
      null,
      42,
      true,
      {},
      ["/account/renew"],
      new URL("https://partyreel.com/account/renew"),
    ]) {
      expect(signInReturn(value)).toBeNull();
      expect(loginPath(value)).toBe("/login");
    }
  });

  it("refuses a path past the length no page reaches, before it reads the shapes", () => {
    const long = `/e/${"a".repeat(RETURN_PATH_MAX)}`;
    expect(signInReturn(long)).toBeNull();
    expect(matchesPathShape(long, [/^\/e\/a+$/])).toBe(false);
  });
});

describe("the landing and the links that carry it", () => {
  it("lands on the return when there is one, else the host's home", () => {
    expect(signInLanding("/account/renew", false)).toBe("/account/renew");
    expect(signInLanding("/account/renew", true)).toBe("/account/renew");
    expect(signInLanding(null, false)).toBe("/dashboard");
    expect(signInLanding(null, true)).toBe("/admin");
  });

  it("encodes the return, joining with ? or & as the URL needs", () => {
    expect(loginPath("/account/renew")).toBe("/login?next=%2Faccount%2Frenew");
    expect(withReturn("/login?error=expired_link", "/account/renew")).toBe(
      "/login?error=expired_link&next=%2Faccount%2Frenew",
    );
    expect(
      withReturn("https://partyreel.com/auth/callback", "/dashboard"),
    ).toBe("https://partyreel.com/auth/callback?next=%2Fdashboard");
    expect(withReturn("/login?error=expired_link", null)).toBe(
      "/login?error=expired_link",
    );
  });
});
