import { describe, expect, it } from "vitest";

import { NAV } from "@/lib/admin/nav";
import { PASS_REMINDERS_PATH } from "@/lib/email/links";

import {
  ADMIN_RETURN_COOKIE,
  adminReturnCookie,
  adminReturnFromCookies,
  loginPath,
  matchesPathShape,
  NEXT_PARAM,
  RETURN_PATH_MAX,
  returnWithAnchor,
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
 *
 * ★ EACH HOST RETURNS TO ITS OWN PAGES (crumbs-14): the portal's on the admin host alone, the
 * app's everywhere else, so a signed-out `/admin/reports` lands on the reports after the sign-in
 * and no host is ever sent to a page the other deployment serves.
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
    // The owner mode at an address that needs no handle (crumbs-46): the user menu's Your profile for an account
    // with none, so a session that ended under an open menu comes back to the page it asked for.
    "/me",
    "/welcome",
    // The one marketing page (pricing-doors): a signed-out Get Pro presses from it and comes back to it signed in.
    "/pricing",
    // A guest's door comes back to the album (a token or a custom link) or a profile page.
    "/e/0123456789abcdef0123456789abcdef",
    "/e/sarahs-wedding",
    "/e/qr-token",
    "/u/maya-j",
  ];

  it.each(pages)("accepts %s as itself", (page) => {
    expect(signInReturn(page)).toBe(page);
  });

  // ★ NEVER THE APEX FROM THE ADMIN HOST: the admin deployment serves none of these, so a sign-in
  // there that followed one would land on its 404. The portal is that host's landing.
  it.each(pages)(
    "refuses %s on the admin host, which lands in the portal",
    (page) => {
      expect(signInReturn(page, true)).toBeNull();
      expect(signInLanding(page, true)).toBe("/admin");
      expect(loginPath(page, true)).toBe("/login");
    },
  );

  it("survives the round trip through a query string", () => {
    for (const page of pages) {
      const login = new URL(loginPath(page), "https://partyreel.com");
      expect(login.pathname).toBe("/login");
      expect(login.searchParams.get(NEXT_PARAM)).toBe(page);
    }
  });
});

/**
 * ★ A SIGNED-OUT GET PRO COMES BACK TO THE PRICING PAGE (pricing-doors). The page is the one marketing page on the list
 * (ROADMAP: "returning her to /pricing means allowing that one marketing page"), and it stands for one exact path: the
 * button hands the router `loginPath(window.location.pathname)`, so before this a visitor pressing Get Pro there met the
 * bare `/login` and landed on the dashboard, with the plan she came for a page away. Nothing on it is private and
 * nothing on it reads a query, so no mark rides: a query would be one more thing a link could be made to say.
 */
describe("the pricing page, which a signed-out Get Pro comes back to (pricing-doors)", () => {
  it("is what the signed-out press sends to sign in, and where the sign-in lands", () => {
    expect(loginPath("/pricing")).toBe("/login?next=%2Fpricing");
    expect(signInLanding("/pricing", false)).toBe("/pricing");
    // Every road back: the callback's `next`, which Google and the email's link carry whole.
    const callback = new URL(
      withReturn("https://partyreel.com/auth/callback", "/pricing"),
    );
    expect(signInReturn(callback.searchParams.get(NEXT_PARAM))).toBe(
      "/pricing",
    );
  });

  it("is the app host's alone: the admin deployment serves no pricing page", () => {
    expect(signInReturn("/pricing", true)).toBeNull();
    expect(signInLanding("/pricing", true)).toBe("/admin");
    expect(loginPath("/pricing", true)).toBe("/login");
  });

  // Shaped like the page, and not it: each is refused whole, and the sign-in lands where it always did.
  const lookalikes: [string, string][] = [
    ["a trailing slash", "/pricing/"],
    ["a longer word", "/pricingx"],
    ["a page under it", "/pricing/compare"],
    ["another case", "/Pricing"],
    ["a query", "/pricing?plan=pro_200"],
    ["a nested next", "/pricing?next=https://evil.example"],
    ["a fragment", "/pricing#plans"],
    ["two slashes before it", "//pricing"],
    ["a host dressed as it", "//evil.example/pricing"],
    ["the absolute address", "https://partyreel.com/pricing"],
    ["an encoded slash", "%2Fpricing"],
    ["an encoded letter", "/pric%69ng"],
    ["a traversal into it", "/dashboard/../pricing"],
    ["a dot segment", "/./pricing"],
    ["a backslash", "/pricing\\"],
    ["a leading space", " /pricing"],
    ["a trailing space", "/pricing "],
    ["a newline splice", "/pricing\r\nLocation: https://evil.example"],
  ];

  it.each(lookalikes)("refuses %s", (_, value) => {
    expect(signInReturn(value)).toBeNull();
    expect(signInLanding(value, false)).toBe("/dashboard");
    expect(loginPath(value)).toBe("/login");
  });

  it("takes no fragment, since only a mail's named anchors do", () => {
    expect(returnWithAnchor("/pricing", "#plans")).toBe("/pricing");
    expect(returnWithAnchor("/pricing", "#compare")).toBe("/pricing");
  });
});

describe("the portal's pages, on the admin host alone (crumbs-14)", () => {
  // Every section the nav reaches (`nav.test.ts` holds every portal page to the nav), and the two
  // sections with a page per row.
  const portal = [
    ...NAV.map((item) => item.href),
    `/admin/accounts/${EVENT}`,
    `/admin/albums/${EVENT}`,
    `/admin/albums/${EVENT.toUpperCase()}`,
  ];

  it("names the portal's home and every section the nav draws", () => {
    expect(portal).toContain("/admin");
    expect(portal).toContain("/admin/reports");
  });

  it.each(portal)("accepts %s as itself on the admin host", (page) => {
    expect(signInReturn(page, true)).toBe(page);
    expect(signInLanding(page, true)).toBe(page);
    const login = new URL(loginPath(page, true), "https://admin.partyreel.com");
    expect(login.pathname).toBe("/login");
    expect(login.searchParams.get(NEXT_PARAM)).toBe(page);
  });

  // The apex's deployment 404s `/admin`: a sign-in there lands on the dashboard instead.
  it.each(portal)("refuses %s off the admin host", (page) => {
    expect(signInReturn(page)).toBeNull();
    expect(signInLanding(page, false)).toBe("/dashboard");
    expect(loginPath(page)).toBe("/login");
  });

  // Shaped like the portal, and not one of its pages.
  const lookalikes: [string, string][] = [
    ["a trailing slash", "/admin/"],
    ["a section's trailing slash", "/admin/reports/"],
    ["two slashes", "/admin//reports"],
    ["another case", "/admin/Reports"],
    ["a page under a section", "/admin/reports/x"],
    ["a row page that is not a uuid", "/admin/accounts/maya"],
    ["a short row id", "/admin/accounts/9f1c2b3a"],
    ["a row page under a section that has none", `/admin/reports/${EVENT}`],
    ["a download, never a page", "/admin/forensics/export"],
    ["a section the portal does not have", "/admin/billing"],
    ["a longer word", "/administrators"],
    ["a traversal out of the portal", "/admin/../dashboard"],
    ["an encoded traversal", "/admin/%2e%2e/dashboard"],
    ["an encoded slash", "/admin%2Freports"],
    ["a query", "/admin/reports?status=open"],
    ["a nested next", "/admin/reports?next=https://evil.example"],
    ["a fragment", "/admin/reports#report-1"],
    ["the admin host, absolute", "https://admin.partyreel.com/admin/reports"],
    ["the admin host, protocol-relative", "//admin.partyreel.com/admin"],
    ["a backslash", "/admin\\reports"],
    ["a newline splice", "/admin/reports\r\nLocation: https://evil.example"],
  ];

  it.each(lookalikes)(
    "refuses %s, and the gate's login is bare",
    (_, value) => {
      expect(signInReturn(value, true)).toBeNull();
      expect(signInLanding(value, true)).toBe("/admin");
      expect(loginPath(value, true)).toBe("/login");
    },
  );
});

describe("the admin host's page, through its bare callback (crumbs-14)", () => {
  it("leaves a portal page for the callback alone, for ten minutes, a page and nothing else", () => {
    expect(adminReturnCookie("/admin/reports", true)).toBe(
      `${ADMIN_RETURN_COOKIE}=/admin/reports; Max-Age=600; Path=/auth/callback; SameSite=Lax; Secure`,
    );
    expect(adminReturnCookie(`/admin/accounts/${EVENT}`, false)).toBe(
      `${ADMIN_RETURN_COOKIE}=/admin/accounts/${EVENT}; Max-Age=600; Path=/auth/callback; SameSite=Lax`,
    );
  });

  it.each([
    ["no page", null],
    ["an app page", "/account/renew"],
    ["a hostile value", "//evil.example"],
    ["a value dressed as a cookie", "/admin/reports; Domain=partyreel.com"],
    ["a download, never a page", "/admin/forensics/export"],
  ])("clears it for %s", (_, value) => {
    expect(adminReturnCookie(value, true)).toBe(
      `${ADMIN_RETURN_COOKIE}=; Max-Age=0; Path=/auth/callback; SameSite=Lax; Secure`,
    );
  });

  it("reads it back from a Cookie header, and nothing from one without it", () => {
    expect(
      adminReturnFromCookies(
        `sb-x-auth-token=abc; ${ADMIN_RETURN_COOKIE}=/admin/reports; pr_tile_size=medium`,
      ),
    ).toBe("/admin/reports");
    expect(adminReturnFromCookies("pr_tile_size=medium")).toBeNull();
    expect(adminReturnFromCookies(null)).toBeNull();
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
    // /me (crumbs-46) is one exact page: nothing under it, nothing longer, nothing carried on it.
    ["a trailing slash on /me", "/me/"],
    ["a page under /me", "/me/uploads"],
    ["a longer word than /me", "/mex"],
    ["another case of /me", "/Me"],
    ["a query on /me", "/me?x=1"],
    ["a fragment on /me", "/me#likes"],
    // Pages that are real but never a sign-in's return.
    ["the login page", "/login"],
    ["the callback", "/auth/callback"],
    ["an API route", "/api/stripe/checkout"],
    ["account deletion", "/account/delete"],
    ["the marketing home", "/"],
    ["nothing", ""],
  ];

  it.each(hostile)("refuses %s", (_, value) => {
    expect(signInReturn(value)).toBeNull();
    expect(signInReturn(value, true)).toBeNull();
    expect(loginPath(value)).toBe("/login");
    expect(loginPath(value, true)).toBe("/login");
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
      expect(signInReturn(value, true)).toBeNull();
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
  // Reshaped on purpose (crumbs-14): an app page on the admin host used to be followed there, to the
  // admin deployment's 404; each host now returns to its own pages.
  it("lands on the return when there is one for this host, else the host's home", () => {
    expect(signInLanding("/account/renew", false)).toBe("/account/renew");
    expect(signInLanding("/account/renew", true)).toBe("/admin");
    expect(signInLanding("/admin/reports", true)).toBe("/admin/reports");
    expect(signInLanding("/admin/reports", false)).toBe("/dashboard");
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

/**
 * ★ THE MAIL'S ANCHOR SURVIVES A SIGN-IN (crumbs-20: the ROADMAP's renewal-nudge line, from
 * `crumbs-11`). The renewal nudge's foot link is `/account#event-pass-reminders`, the Email
 * preferences row. A fragment never reaches a server, so the gate sends `/login?next=/account` and
 * the browser keeps `#event-pass-reminders`; `/login` reads it off `location.hash` and asks
 * `returnWithAnchor`. The allow-list takes one fragment, exactly, on exactly its page, named once
 * beside the mail (`lib/email/links.ts`): every other fragment reads as none, and the page stands.
 */
describe("the mail's anchor (a fragment, only as one named pair)", () => {
  const ANCHORED = "/account#event-pass-reminders";

  it("is the very string the mail links to, read from its one home", () => {
    expect(PASS_REMINDERS_PATH).toBe(ANCHORED);
    expect(signInReturn(PASS_REMINDERS_PATH)).toBe(PASS_REMINDERS_PATH);
  });

  it("returns to the page WITH its anchor, and every link that carries it keeps it whole", () => {
    expect(signInReturn(ANCHORED)).toBe(ANCHORED);
    expect(signInLanding(ANCHORED, false)).toBe(ANCHORED);
    // The callback's `next`: the fragment is encoded, so it survives any query it is joined to.
    expect(loginPath(ANCHORED)).toBe(
      "/login?next=%2Faccount%23event-pass-reminders",
    );
    expect(withReturn("https://partyreel.com/auth/callback", ANCHORED)).toBe(
      "https://partyreel.com/auth/callback?next=%2Faccount%23event-pass-reminders",
    );
    const url = new URL(
      withReturn("https://partyreel.com/auth/callback", ANCHORED),
    );
    expect(signInReturn(url.searchParams.get(NEXT_PARAM))).toBe(ANCHORED);
  });

  it("is the app's alone: the admin host never lands on it", () => {
    expect(signInReturn(ANCHORED, true)).toBeNull();
    expect(signInLanding(ANCHORED, true)).toBe("/admin");
  });

  // Shaped like the pair, and not it: each is refused whole (the page's own bare return stands).
  const lookalikes: [string, string][] = [
    ["another anchor on the page", "/account#plan"],
    ["the anchor on another page", "/dashboard#event-pass-reminders"],
    [
      "the anchor under the renewal page",
      "/account/renew#event-pass-reminders",
    ],
    ["another case", "/account#Event-Pass-Reminders"],
    ["a longer anchor", "/account#event-pass-reminders-2"],
    ["a shorter anchor", "/account#event-pass-reminder"],
    ["the anchor twice", "/account#event-pass-reminders#event-pass-reminders"],
    ["a query on the page", "/account?x=1#event-pass-reminders"],
    ["a query after the anchor", "/account#event-pass-reminders?x=1"],
    ["a trailing slash", "/account/#event-pass-reminders"],
    ["a trailing space", "/account#event-pass-reminders "],
    [
      "a newline splice",
      "/account#event-pass-reminders\r\nLocation: https://evil.example",
    ],
    ["an empty fragment", "/account#"],
    ["an encoded fragment mark", "/account%23event-pass-reminders"],
    ["a script in the fragment", "/account#event-pass-reminders<script>"],
    [
      "a host dressed as the page",
      "//evil.example/account#event-pass-reminders",
    ],
    [
      "the absolute address",
      "https://partyreel.com/account#event-pass-reminders",
    ],
  ];

  it.each(lookalikes)("refuses %s", (_, value) => {
    expect(signInReturn(value)).toBeNull();
    expect(signInLanding(value, false)).toBe("/dashboard");
    expect(loginPath(value)).toBe("/login");
  });

  describe("returnWithAnchor: what /login hands the landing", () => {
    it("adds the visitor's fragment when the pair is on the list", () => {
      expect(returnWithAnchor("/account", "#event-pass-reminders")).toBe(
        ANCHORED,
      );
    });

    it("keeps the page and drops any other fragment: the scroll is all a hostile hash can cost", () => {
      for (const hash of [
        "#plan",
        "#EVENT-PASS-REMINDERS",
        "#event-pass-reminders-2",
        "#event-pass-reminders#x",
        "#event-pass-reminders?x=1",
        "#event-pass-reminders\r\nLocation: https://evil.example",
        "#access_token=abc&refresh_token=def",
        "#error=access_denied&error_code=otp_expired",
        "event-pass-reminders",
        "#",
        "",
      ]) {
        expect(returnWithAnchor("/account", hash), hash).toBe("/account");
      }
    });

    it("keeps the page, whatever it is, when the fragment does not belong to it", () => {
      expect(returnWithAnchor("/dashboard", "#event-pass-reminders")).toBe(
        "/dashboard",
      );
      expect(returnWithAnchor("/account/renew", "#event-pass-reminders")).toBe(
        "/account/renew",
      );
      expect(
        returnWithAnchor("/admin/reports", "#event-pass-reminders", true),
      ).toBe("/admin/reports");
    });

    it("is nothing when there is no page, and never invents one for a hash", () => {
      expect(returnWithAnchor(null, "#event-pass-reminders")).toBeNull();
      expect(returnWithAnchor(undefined, "#event-pass-reminders")).toBeNull();
      expect(
        returnWithAnchor("//evil.example", "#event-pass-reminders"),
      ).toBeNull();
      expect(returnWithAnchor("/login", "#event-pass-reminders")).toBeNull();
    });

    it("takes a next that already carries the anchor, and never doubles it", () => {
      expect(returnWithAnchor(ANCHORED, "")).toBe(ANCHORED);
      expect(returnWithAnchor(ANCHORED, "#event-pass-reminders")).toBe(
        ANCHORED,
      );
      expect(returnWithAnchor(ANCHORED, "#plan")).toBe(ANCHORED);
    });

    it("refuses anything that is not a string for the hash", () => {
      for (const hash of [
        undefined,
        null,
        42,
        true,
        {},
        ["#event-pass-reminders"],
      ]) {
        expect(returnWithAnchor("/account", hash)).toBe("/account");
      }
    });
  });
});
