/**
 * /login'S FORM, THE ONE COMPONENT THAT FOLLOWS `next` IN THE BROWSER (crumbs-11).
 *
 * The page already checked `?next=`; this pins that the form checks it again before it does the
 * two things a hostile value would want: navigate to it after an in-page sign-in (the email code,
 * a password), and hand it to Google and the email's link inside the callback URL. `AccountDoor`
 * is stubbed to expose the props it was given and the verify it would fire.
 *
 * ★ On the admin host the callback stays bare, so the portal's page rides a cookie the callback
 * reads (crumbs-14); every write to `document.cookie` is recorded here, since a cookie scoped to
 * the callback's path is one the page itself can never read back.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
const host = vi.hoisted(() => ({ admin: false }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("@/lib/auth/admin-host", () => ({ isAdminHost: () => host.admin }));

vi.mock("@/components/auth/account-door", () => ({
  AccountDoor: ({
    emailRedirectTo,
    onVerified,
  }: {
    emailRedirectTo: string;
    onVerified: (r: { existing: boolean; email: string }) => void;
  }) => (
    <div data-testid="door" data-redirect={emailRedirectTo}>
      <button
        type="button"
        onClick={() => onVerified({ existing: false, email: "h@example.com" })}
      >
        verify
      </button>
    </div>
  ),
}));

const { LoginForm } = await import("./login-form");

function signIn(next: string | null) {
  render(<LoginForm next={next} />);
  const redirect = new URL(
    screen.getByTestId("door").getAttribute("data-redirect")!,
  );
  fireEvent.click(screen.getByRole("button", { name: "verify" }));
  return { redirect, pushed: push.mock.calls.at(-1)?.[0] as string };
}

const cookieWrites: string[] = [];

beforeEach(() => {
  push.mockReset();
  host.admin = false;
  cookieWrites.length = 0;
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => "",
    set: (line: string) => {
      cookieWrites.push(line);
    },
  });
});

const KEPT = (page: string) =>
  `pr_admin_return=${page}; Max-Age=600; Path=/auth/callback; SameSite=Lax`;
const CLEARED =
  "pr_admin_return=; Max-Age=0; Path=/auth/callback; SameSite=Lax";

describe("LoginForm", () => {
  it("lands an in-page sign-in on the page, and hands the page to the callback", () => {
    const { redirect, pushed } = signIn("/account/renew");
    expect(pushed).toBe("/account/renew");
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.searchParams.get("next")).toBe("/account/renew");
  });

  it("with no page, lands on the dashboard through a bare callback", () => {
    const { redirect, pushed } = signIn(null);
    expect(pushed).toBe("/dashboard");
    expect(redirect.search).toBe("");
  });

  // ★ The admin host's allow-list entry is EXACT: a query there falls back to the Site URL and
  // lands the operator on the apex. Its callback stays bare; the portal is its landing anyway.
  it("keeps the admin host's callback bare, and lands its sign-in in the portal", () => {
    host.admin = true;
    const { redirect, pushed } = signIn("/admin");
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.search).toBe("");
    expect(pushed).toBe("/admin");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/%2F%2Fevil.example",
    "/account/renew?next=https://evil.example",
  ])("never follows or forwards %s, even handed it directly", (next) => {
    const { redirect, pushed } = signIn(next);
    expect(pushed).toBe("/dashboard");
    expect(redirect.search).toBe("");
  });
});

describe("LoginForm on the admin host (crumbs-14)", () => {
  it("★ carries the portal's page: a cookie for the bare callback, and an in-page landing on it", () => {
    host.admin = true;
    const { redirect, pushed } = signIn("/admin/reports");
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.search, "the callback stays bare").toBe("");
    expect(cookieWrites).toEqual([KEPT("/admin/reports")]);
    expect(pushed).toBe("/admin/reports");
  });

  it.each([
    ["no page", null],
    ["an app page (never the apex from the admin host)", "/account/renew"],
    ["a hostile value", "//evil.example"],
    ["a download, never a page", "/admin/forensics/export"],
  ])(
    "clears what an earlier visit left for %s, and lands in the portal",
    (_, next) => {
      host.admin = true;
      const { redirect, pushed } = signIn(next);
      expect(redirect.search).toBe("");
      expect(cookieWrites).toEqual([CLEARED]);
      expect(pushed).toBe("/admin");
    },
  );

  it("off the admin host, never writes the cookie and never lands in the portal", () => {
    const { redirect, pushed } = signIn("/admin/reports");
    expect(cookieWrites).toEqual([]);
    expect(redirect.search).toBe("");
    expect(pushed).toBe("/dashboard");
  });
});
