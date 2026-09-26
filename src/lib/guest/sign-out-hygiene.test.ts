/**
 * THE ACCOUNT SIGN-OUT PUTS DOWN EVERY GUEST TICKET'S SERVER HALF. `signOutAction` is the account
 * menu's sign-out; the menu's form clears the localStorage half on submit, and this pins that the
 * action expires every `pr_guest_*` cookie on its own response, before it signs out and leaves for
 * /login, and touches no other family.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const order: string[] = [];
const cookieWrites: Record<string, unknown>[] = [];
let jar: { name: string; value: string }[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => jar,
    set: (cookie: Record<string, unknown>) => {
      order.push(`expire:${String(cookie.name)}`);
      cookieWrites.push(cookie);
    },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    order.push(`redirect:${to}`);
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signOut: async () => {
        order.push("signOut");
        return { error: null };
      },
    },
  }),
}));

const { signOutAction } = await import("@/app/(auth)/actions");

const EVENT_A = "33333333-3333-4333-8333-333333333333";
const EVENT_B = "55555555-5555-4555-8555-555555555555";

beforeEach(() => {
  order.length = 0;
  cookieWrites.length = 0;
  jar = [
    { name: `pr_guest_${EVENT_A}`, value: "a".repeat(64) },
    { name: `pr_guest_${EVENT_B}`, value: "b".repeat(64) },
    { name: `pr_unlock_${EVENT_A}`, value: "signed" },
    { name: "pr_tile_size", value: "medium" },
  ];
});

describe("signOutAction", () => {
  it("★ expires every guest ticket cookie, then signs out, then leaves for /login", async () => {
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");
    expect(order).toEqual([
      `expire:pr_guest_${EVENT_A}`,
      `expire:pr_guest_${EVENT_B}`,
      "signOut",
      "redirect:/login",
    ]);
    for (const write of cookieWrites) {
      expect(write).toMatchObject({
        value: "",
        maxAge: 0,
        path: "/",
        httpOnly: true,
      });
    }
  });

  it("leaves every other family alone: the signed unlock and the tile size are not tickets", async () => {
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");
    const names = cookieWrites.map((w) => w.name);
    expect(names).not.toContain(`pr_unlock_${EVENT_A}`);
    expect(names).not.toContain("pr_tile_size");
  });
});
