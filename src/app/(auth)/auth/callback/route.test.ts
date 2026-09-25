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
 *   The sign-in landings are unchanged: an open redirect is refused, a dead code is an expired link.
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

  it("adopts nothing when the exchange fails, which is an expired link", async () => {
    state.exchange.mockResolvedValue(DEAD);
    const res = await get(`?next=/e/qr-token&code=abc`);
    expect(landing(res)).toBe("/login?error=expired_link");
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
