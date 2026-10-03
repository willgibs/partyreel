/**
 * THE CALLBACK'S LANDINGS (lp/identity-email adds two).
 *
 *   ★ `flow=email_change` ALWAYS LANDS ON /account, NEVER ON AN EXPIRED LINK. The first of the two
 *     links carries no code (GoTrue's message rides the fragment), so a code-less landing is `half`
 *     unless the query names a refusal. A code is issued only once the change has committed: an
 *     exchange that works is `done` and the Stripe copy follows after the response; one that fails
 *     lands on the page with no word (the row reads the truth, and a hand-made code earns nothing).
 *   ★ A guest's link (`next=/e/...`) adopts the name typed at the door after the exchange; no other
 *     landing does, and a failed exchange adopts nothing.
 *   ★ THE PAGE A GATE SENT A HOST FROM LANDS (crumbs-11): `next` is followed only when it is on the
 *     return allow-list (lib/auth/return-path.ts), and a failed link carries it back to /login so
 *     the new code still lands there. Anything else is the host-aware default, never carried.
 *   ★ ON THE ADMIN HOST THE PAGE RIDES A COOKIE (crumbs-14): its callback is always bare, so the
 *     login form leaves the portal's page in `pr_admin_return`, read here, checked against the
 *     portal's pages and cleared whatever it held; the admin host never follows an app page.
 *   A dead code is an expired link.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  exchange: vi.fn(),
  adoptDoorName: vi.fn(async () => undefined),
  syncBillingEmail: vi.fn(async () => ({ status: "updated" })),
  afterCallbacks: [] as (() => unknown)[],
  adminHost: false,
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => {
    state.afterCallbacks.push(cb);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession: state.exchange },
  }),
}));
vi.mock("@/app/(auth)/adopt-door-name", () => ({
  adoptDoorName: state.adoptDoorName,
}));
vi.mock("@/lib/stripe/customer-email", () => ({
  syncBillingEmail: state.syncBillingEmail,
}));
vi.mock("@/lib/auth/admin-host", () => ({
  isAdminHost: () => state.adminHost,
}));

const { GET } = await import("./route");

function get(query: string) {
  return GET(
    new Request(`https://partyreel.com/auth/callback${query}`, {
      headers: { host: "partyreel.com" },
    }),
  );
}

/** The admin host's callback, carrying the browser's cookies (the page its login form left). */
function getAdmin(query: string, cookie?: string) {
  return GET(
    new Request(`https://admin.partyreel.com/auth/callback${query}`, {
      headers: {
        host: "admin.partyreel.com",
        ...(cookie ? { cookie } : {}),
      },
    }),
  );
}

/** The `pr_admin_return` line a response sets, if any. */
function adminReturnSet(res: Response): string | undefined {
  return res.headers
    .getSetCookie()
    .find((line) => line.startsWith("pr_admin_return="));
}

function landing(res: Response): string {
  const to = new URL(res.headers.get("location")!);
  return `${to.pathname}${to.search}`;
}

const SIGNED_IN = {
  data: { user: { id: "user-1", email: "new@example.com" }, session: {} },
  error: null,
};
const DEAD = {
  data: { user: null, session: null },
  error: { message: "invalid flow state", code: "flow_state_not_found" },
};

beforeEach(() => {
  state.exchange.mockReset();
  state.adoptDoorName.mockClear();
  state.syncBillingEmail.mockClear();
  state.afterCallbacks = [];
  state.adminHost = false;
});

describe("an email change's link", () => {
  const FLOW = "next=/account&flow=email_change";

  it("★ the first link (no code) lands on half, never on an expired link", async () => {
    const res = await get(`?${FLOW}&message=Confirmation+link+accepted`);
    expect(landing(res)).toBe("/account?email_change=half");
    expect(state.exchange).not.toHaveBeenCalled();
  });

  it("a refusal named in the query lands on failed", async () => {
    const res = await get(
      `?${FLOW}&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid`,
    );
    expect(landing(res)).toBe("/account?email_change=failed");
  });

  it("the second link (a code) lands on done and syncs the Stripe copy after the response", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await get(`?${FLOW}&code=abc`);
    expect(landing(res)).toBe("/account?email_change=done");
    expect(state.exchange).toHaveBeenCalledWith("abc");
    expect(state.syncBillingEmail).not.toHaveBeenCalled();
    expect(state.afterCallbacks).toHaveLength(1);
    await state.afterCallbacks[0]();
    expect(state.syncBillingEmail).toHaveBeenCalledWith(
      "user-1",
      "new@example.com",
    );
  });

  it("★ a code this browser cannot exchange lands on the account page with no word, never a login error", async () => {
    // The change already committed if the code is real; if it is hand-made, nothing did. Either way
    // the row reads getUser(), and no banner claims a change it cannot prove.
    state.exchange.mockResolvedValue(DEAD);
    const res = await get(`?${FLOW}&code=abc`);
    expect(landing(res)).toBe("/account");
    expect(state.afterCallbacks).toHaveLength(0);
  });

  it("never adopts a door name and never follows another next", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await get(`?next=/e/token&flow=email_change&code=abc`);
    expect(landing(res)).toBe("/account?email_change=done");
    expect(state.adoptDoorName).not.toHaveBeenCalled();
  });
});

describe("a sign-in link", () => {
  it("adopts the typed name for a guest's link, after the exchange", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await get(`?next=/e/qr-token&code=abc`);
    expect(landing(res)).toBe("/e/qr-token");
    expect(state.adoptDoorName).toHaveBeenCalledTimes(1);
  });

  it("adopts nothing for a host's link", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await get(`?code=abc`);
    expect(landing(res)).toBe("/dashboard");
    expect(state.adoptDoorName).not.toHaveBeenCalled();
  });

  // Reshaped on purpose (crumbs-11): the expired link now keeps where it was going, so the new code
  // lands there too; it used to drop it and land every retry on the dashboard.
  it("adopts nothing when the exchange fails, which is an expired link that keeps its page", async () => {
    state.exchange.mockResolvedValue(DEAD);
    const res = await get(`?next=/e/qr-token&code=abc`);
    expect(landing(res)).toBe("/login?error=expired_link&next=%2Fe%2Fqr-token");
    expect(state.adoptDoorName).not.toHaveBeenCalled();
  });

  it("refuses an open redirect, and lands the admin host in the portal", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    expect(landing(await get(`?next=//evil.com&code=abc`))).toBe("/dashboard");
    state.adminHost = true;
    expect(landing(await get(`?code=abc`))).toBe("/admin");
  });

  it("with no code, maps the provider's reason, else an expired link", async () => {
    expect(landing(await get(`?error_code=otp_expired`))).toBe(
      "/login?error=expired_link",
    );
    expect(landing(await get(`?error=access_denied`))).toBe(
      "/login?error=google_failed",
    );
    expect(landing(await get(``))).toBe("/login?error=expired_link");
  });
});

describe("a mail's button, through a sign-in (crumbs-11)", () => {
  it("lands a host's Google or email link on the page the gate sent them from", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    expect(landing(await get(`?next=%2Faccount%2Frenew&code=abc`))).toBe(
      "/account/renew",
    );
    expect(landing(await get(`?next=/dashboard&code=abc`))).toBe("/dashboard");
    expect(state.adoptDoorName).not.toHaveBeenCalled();
  });

  // Reshaped on purpose (crumbs-14): an app page asked on the admin host used to be followed there,
  // to the admin deployment's 404. Each host returns to its own pages now; the portal's still beat
  // the admin host's default, since they were asked for.
  it("the portal's page beats the admin host's default, and an app page never lands there", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    state.adminHost = true;
    expect(landing(await get(`?next=/admin&code=abc`))).toBe("/admin");
    expect(landing(await get(`?next=/admin/reports&code=abc`))).toBe(
      "/admin/reports",
    );
    expect(landing(await get(`?next=/account/renew&code=abc`))).toBe("/admin");
    state.adminHost = false;
    expect(landing(await get(`?next=/admin/reports&code=abc`))).toBe(
      "/dashboard",
    );
  });

  it("carries the page back to /login when the provider refused, so a retry still lands", async () => {
    expect(landing(await get(`?next=/account/renew&error=access_denied`))).toBe(
      "/login?error=google_failed&next=%2Faccount%2Frenew",
    );
  });

  // Each refusal is followed nowhere and carried nowhere: the landing is the default, and the
  // failure's /login carries no `next` at all.
  const hostile = [
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "%2F%2Fevil.com",
    "/%2F%2Fevil.com",
    "/%5Cevil.com",
    "/dashboard%2F..%2Fadmin",
    "/dashboard/../admin",
    "javascript:alert(1)",
    "/account/renew?next=https://evil.com",
    "/account%0d%0aLocation:%20https://evil.com",
    "/account\r\nLocation: https://evil.com",
    "/api/stripe/checkout",
  ];

  it.each(hostile)("follows %s nowhere", async (next) => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const ok = await get(`?next=${encodeURIComponent(next)}&code=abc`);
    expect(landing(ok)).toBe("/dashboard");
    expect(new URL(ok.headers.get("location")!).host).toBe("partyreel.com");

    state.exchange.mockResolvedValue(DEAD);
    expect(
      landing(await get(`?next=${encodeURIComponent(next)}&code=abc`)),
    ).toBe("/login?error=expired_link");
    expect(
      landing(
        await get(`?next=${encodeURIComponent(next)}&error=access_denied`),
      ),
    ).toBe("/login?error=google_failed");
  });

  it("follows a raw (unencoded) hostile value nowhere either", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    expect(landing(await get(`?next=//evil.com&code=abc`))).toBe("/dashboard");
    expect(landing(await get(`?next=/\\evil.com&code=abc`))).toBe("/dashboard");
    expect(
      landing(await get(`?next=https://evil.com/account/renew&code=abc`)),
    ).toBe("/dashboard");
  });
});

/**
 * ★ A MAIL'S ANCHOR, THROUGH A SIGN-IN (crumbs-20). The renewal nudge's foot link is
 * `/account#event-pass-reminders`; `/login` hands Google and the email's link the pair as `next`, and
 * the allow-list takes that one fragment, exactly, on exactly its page. The callback's own redirect
 * keeps it (a Location carries a fragment), so the browser lands on the row; any other fragment is
 * the default, never a copy of the page without it.
 */
describe("a mail's anchor, through a sign-in (crumbs-20)", () => {
  const ANCHORED = "/account#event-pass-reminders";
  /** The whole Location, fragment included: `landing` reads the path and query only. */
  const to = (res: Response) => res.headers.get("location");

  it("★ lands the pair whole, so the browser scrolls to the row the mail named", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await get(`?next=${encodeURIComponent(ANCHORED)}&code=abc`);
    expect(to(res)).toBe(`https://partyreel.com${ANCHORED}`);
    expect(state.adoptDoorName).not.toHaveBeenCalled();
  });

  it("carries the pair back to /login when the link had aged out, so a new code still lands on the row", async () => {
    state.exchange.mockResolvedValue(DEAD);
    expect(
      to(await get(`?next=${encodeURIComponent(ANCHORED)}&code=abc`)),
    ).toBe(
      "https://partyreel.com/login?error=expired_link&next=%2Faccount%23event-pass-reminders",
    );
    expect(
      to(
        await get(`?next=${encodeURIComponent(ANCHORED)}&error=access_denied`),
      ),
    ).toBe(
      "https://partyreel.com/login?error=google_failed&next=%2Faccount%23event-pass-reminders",
    );
  });

  it.each([
    "/account#plan",
    "/dashboard#event-pass-reminders",
    "/account/renew#event-pass-reminders",
    "/account#event-pass-reminders#x",
    "/account#event-pass-reminders?x=1",
    "/account%23event-pass-reminders",
  ])(
    "follows %s nowhere: the default lands, never a copy without the fragment",
    async (next) => {
      state.exchange.mockResolvedValue(SIGNED_IN);
      const res = await get(`?next=${encodeURIComponent(next)}&code=abc`);
      expect(to(res)).toBe("https://partyreel.com/dashboard");
    },
  );

  it("is the app's alone: the admin host lands in the portal", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    state.adminHost = true;
    const res = await get(`?next=${encodeURIComponent(ANCHORED)}&code=abc`);
    expect(landing(res)).toBe("/admin");
  });
});

describe("the admin host's bare callback, and the page its cookie kept (crumbs-14)", () => {
  beforeEach(() => {
    state.adminHost = true;
  });

  it("★ lands Google's return on the page the portal's gate was asked for, and clears the cookie", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await getAdmin(`?code=abc`, "pr_admin_return=/admin/reports");
    expect(landing(res)).toBe("/admin/reports");
    expect(new URL(res.headers.get("location")!).host).toBe(
      "admin.partyreel.com",
    );
    const cleared = adminReturnSet(res)!;
    expect(cleared).toMatch(/^pr_admin_return=;/);
    expect(cleared).toMatch(/Path=\/auth\/callback/);
    expect(cleared).toMatch(/Max-Age=0/);
  });

  it("carries the kept page back to /login when the link had aged out", async () => {
    state.exchange.mockResolvedValue(DEAD);
    const res = await getAdmin(`?code=abc`, "pr_admin_return=/admin/reports");
    expect(landing(res)).toBe(
      "/login?error=expired_link&next=%2Fadmin%2Freports",
    );
    expect(adminReturnSet(res)).toMatch(/Max-Age=0/);
  });

  it.each([
    ["an app page", "/account/renew"],
    ["a protocol-relative host", "//evil.example"],
    ["an absolute URL", "https://evil.example/admin/reports"],
    ["a traversal", "/admin/../dashboard"],
    ["a download, never a page", "/admin/forensics/export"],
    ["an encoded escape", "%2F%2Fevil.example"],
  ])("follows a kept %s nowhere, and still clears it", async (_, kept) => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await getAdmin(`?code=abc`, `pr_admin_return=${kept}`);
    expect(landing(res)).toBe("/admin");
    expect(new URL(res.headers.get("location")!).host).toBe(
      "admin.partyreel.com",
    );
    expect(adminReturnSet(res)).toMatch(/Max-Age=0/);
  });

  it("lands in the portal with no cookie, and sets none", async () => {
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await getAdmin(`?code=abc`);
    expect(landing(res)).toBe("/admin");
    expect(adminReturnSet(res)).toBeUndefined();
  });

  it("is read on the admin host alone: the apex neither follows nor touches it", async () => {
    state.adminHost = false;
    state.exchange.mockResolvedValue(SIGNED_IN);
    const res = await GET(
      new Request(`https://partyreel.com/auth/callback?code=abc`, {
        headers: {
          host: "partyreel.com",
          cookie: "pr_admin_return=/admin/reports",
        },
      }),
    );
    expect(landing(res)).toBe("/dashboard");
    expect(adminReturnSet(res)).toBeUndefined();
  });
});

/**
 * ★ A SIGN-IN THAT MEETS A DELETION'S BAN (lp/account-exit). GoTrue refuses a deleted account's
 * tapped link and its Google sign-in with `user_banned` until the nightly purge, in exactly these
 * shapes (its source, v2.197: `verifyGet`'s `prepErrorRedirectURL` for a link, `redirectErrors` for
 * Google, both `error=access_denied&error_code=user_banned&error_description=User is banned` in a
 * PKCE flow's query). That is no expired link and no failed Google: `/login` says why and when.
 */
describe("a deleted account's sign-in, refused until the purge", () => {
  const BANNED =
    "error=access_denied&error_code=user_banned&error_description=User+is+banned";

  it("★ a tapped link or Google lands on /login's account_deleting, never on google_failed", async () => {
    expect(landing(await get(`?${BANNED}`))).toBe(
      "/login?error=account_deleting",
    );
    expect(state.exchange).not.toHaveBeenCalled();
  });

  it("keeps the page it was going to, so a fresh start later still lands there", async () => {
    expect(landing(await get(`?next=%2Faccount%2Frenew&${BANNED}`))).toBe(
      "/login?error=account_deleting&next=%2Faccount%2Frenew",
    );
  });

  it("reads the message only when no code came", async () => {
    expect(
      landing(
        await get(`?error=access_denied&error_description=User+is+banned`),
      ),
    ).toBe("/login?error=account_deleting");
    // A code that says otherwise wins over any message.
    expect(
      landing(
        await get(
          `?error=access_denied&error_code=signup_disabled&error_description=User+is+banned`,
        ),
      ),
    ).toBe("/login?error=google_failed");
  });

  it("an exchange GoTrue refuses as banned is the same answer", async () => {
    state.exchange.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User is banned", code: "user_banned", status: 403 },
    });
    expect(landing(await get(`?code=abc`))).toBe(
      "/login?error=account_deleting",
    );
  });

  it("every other refusal keeps its own kind", async () => {
    expect(
      landing(await get(`?error=access_denied&error_code=signup_disabled`)),
    ).toBe("/login?error=google_failed");
    state.exchange.mockResolvedValue(DEAD);
    expect(landing(await get(`?code=abc`))).toBe("/login?error=expired_link");
  });
});
