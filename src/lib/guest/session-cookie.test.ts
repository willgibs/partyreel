import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("server-only", () => ({}));
const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));

const {
  guestCookieHeaderValue,
  guestSessionCookieClear,
  guestSessionCookieIfChanged,
  guestSessionCookieName,
  guestSessionCookieWrite,
  isSessionTokenShape,
  readGuestSessionCookie,
} = await import("@/lib/guest/session-cookie");

const TOKEN = "a".repeat(64);
const OTHER = "b".repeat(64);

beforeEach(() => cookieJar.clear());

/**
 * THE GUEST SESSION COOKIE (Will, 2026-09-21, "the door as three steps"). Require an upload to
 * view is resolved in an RSC, which cannot read localStorage, so the session got a server-readable
 * half. It carries the capability itself, so what is pinned here is the narrowness of it.
 */
describe("the shape guard", () => {
  it("accepts a real session token and nothing else", () => {
    expect(isSessionTokenShape(TOKEN)).toBe(true);
    // A qr_token is 32 hex, half the length, and is NOT this capability.
    expect(isSessionTokenShape("a".repeat(32))).toBe(false);
    expect(isSessionTokenShape("A".repeat(64))).toBe(false); // uppercase never minted
    expect(isSessionTokenShape(`${TOKEN} `)).toBe(false);
    expect(isSessionTokenShape("")).toBe(false);
    expect(isSessionTokenShape(null)).toBe(false);
    expect(isSessionTokenShape(42)).toBe(false);
  });

  it("a hand-edited cookie never reaches a query", async () => {
    cookieJar.set(guestSessionCookieName("evt-1"), "not-a-token");
    expect(await readGuestSessionCookie("evt-1")).toBeNull();
    cookieJar.set(guestSessionCookieName("evt-1"), TOKEN);
    expect(await readGuestSessionCookie("evt-1")).toBe(TOKEN);
  });

  it("is keyed per EVENT, so one album's ticket never answers for another", async () => {
    cookieJar.set(guestSessionCookieName("evt-1"), TOKEN);
    expect(await readGuestSessionCookie("evt-2")).toBeNull();
  });

  it("writes nothing that is not a token", () => {
    expect(guestSessionCookieWrite("evt-1", "nope")).toBeNull();
    expect(guestSessionCookieWrite("evt-1", TOKEN)).toEqual({
      name: "pr_guest_evt-1",
      value: TOKEN,
      maxAge: 60 * 60 * 24 * 60,
    });
  });
});

describe("only what changed is written", () => {
  it("skips the write when the request already carries this exact token", async () => {
    cookieJar.set(guestSessionCookieName("evt-1"), TOKEN);
    expect(await guestSessionCookieIfChanged("evt-1", TOKEN)).toBeNull();
  });

  it("writes when it differs, or when there is none", async () => {
    expect(await guestSessionCookieIfChanged("evt-1", TOKEN)).not.toBeNull();
    cookieJar.set(guestSessionCookieName("evt-1"), OTHER);
    expect(await guestSessionCookieIfChanged("evt-1", TOKEN)).not.toBeNull();
  });

  it("never writes a null, an absent or a malformed token", async () => {
    expect(await guestSessionCookieIfChanged("evt-1", null)).toBeNull();
    expect(await guestSessionCookieIfChanged("evt-1", undefined)).toBeNull();
    expect(await guestSessionCookieIfChanged("evt-1", "nope")).toBeNull();
  });
});

describe("the attributes", () => {
  it("are HttpOnly, site-wide and Lax on every write, and the clear expires it", () => {
    const header = guestCookieHeaderValue(guestSessionCookieWrite("evt-1", TOKEN)!);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Path=/");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Max-Age=5184000");
    const cleared = guestCookieHeaderValue(guestSessionCookieClear("evt-1"));
    expect(cleared).toContain("pr_guest_evt-1=;");
    expect(cleared).toContain("Max-Age=0");
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   ★ THE WRITE ROUTES STILL READ THE TOKEN FROM THE BODY, AND ONLY FROM THE BODY.

   The cookie adds a READ capability to a request, and it must not quietly become a WRITE one: a
   route that accepted the cookie as its identity would be CSRF-able by any page that can make the
   browser POST, where a body token cannot be forged without already holding it. This is the pin
   that stops a later edit from "simplifying" one of them into the cookie.
   ──────────────────────────────────────────────────────────────────────────── */
describe("the CSRF surface does not move", () => {
  const ROOT = process.cwd();
  const WRITE_ROUTES = [
    "src/app/api/guests/name/route.ts",
    // The optional address's own route (2026-09-22): it heals the cookie on the
    // way out exactly as the name route does, and takes its identity from the
    // BODY token alone, which is the property this list exists to hold.
    "src/app/api/guests/email/route.ts",
    "src/app/api/guests/mine/route.ts",
    "src/app/api/guests/remove/route.ts",
    "src/app/api/r2/presign-upload/route.ts",
    "src/app/api/r2/complete-upload/route.ts",
  ];

  it.each(WRITE_ROUTES)("%s never reads the session cookie", (path) => {
    const source = readFileSync(join(ROOT, path), "utf8");
    expect(source).not.toContain("readGuestSessionCookie");
  });

  it("the routes that WRITE one only ever write it (the heal), never read it as identity", () => {
    // The name route and the completion both call `guestSessionCookieIfChanged`, whose only read
    // is "is this already the cookie" — never "who is the caller".
    for (const path of [
      "src/app/api/guests/name/route.ts",
      "src/app/api/r2/complete-upload/route.ts",
    ]) {
      const source = readFileSync(join(ROOT, path), "utf8");
      expect(source).toContain("guestSessionCookieIfChanged");
    }
  });
});
