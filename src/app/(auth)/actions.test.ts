/**
 * EVERY SIGN-OUT NAMES ITS SCOPE, because auth-js's bare `signOut()` is global: it revokes every
 * session the account holds, and an operator signing out of the main site lost her admin portal's
 * session with it (build 20's red-team; auth-accounts.md, "Signing out").
 *
 * The account menu's Sign out ends this device alone. Sign out everywhere ends every session, this
 * one included, and answers a refusal instead of leaving for /login as if it had worked, because the
 * person pressing it is usually worried about a device they cannot see. Both put down every guest
 * ticket the browser sent (sign-out-hygiene.test.ts pins that order for the device sign-out).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const expired: string[] = [];
let jar: { name: string; value: string }[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => jar,
    set: (cookie: { name: string }) => expired.push(cookie.name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signOut } }),
}));

const { signOutAction, signOutEverywhereAction } =
  await import("@/app/(auth)/actions");

const TICKET = "pr_guest_33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  signOut.mockReset();
  signOut.mockResolvedValue({ error: null });
  expired.length = 0;
  jar = [
    { name: TICKET, value: "a".repeat(64) },
    { name: "pr_tile_size", value: "medium" },
  ];
});

describe("Sign out (the account menu's, the admin bar's)", () => {
  it("★ signs out this device only, then leaves for /login", async () => {
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT /login");
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("Sign out everywhere (/account's security corner)", () => {
  it("★ signs out every session the account holds, this one included, then leaves for /login", async () => {
    await expect(signOutEverywhereAction()).rejects.toThrow(
      "NEXT_REDIRECT /login",
    );
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("puts down every guest ticket the browser sent, and nothing of any other family", async () => {
    await expect(signOutEverywhereAction()).rejects.toThrow("NEXT_REDIRECT");
    expect(expired).toEqual([TICKET]);
  });

  it("★ answers a refusal instead of leaving as if it had worked", async () => {
    // A network failure or the auth server's own: every session is still standing.
    signOut.mockResolvedValue({ error: new Error("fetch failed") });
    const result = await signOutEverywhereAction();
    expect(result).toMatchObject({ ok: false });
    expect(result.message).toMatch(/\S/);
  });
});
