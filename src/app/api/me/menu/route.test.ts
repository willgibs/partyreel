/**
 * `/api/me/menu`: WHAT THE GUEST HEADER'S ACCOUNT MENU IS HANDED (crumbs-81 adds her handle). It answers for the
 * signed-in viewer alone, from her own session (`getUser()`, never the proxy's cookie), with her name, her avatar,
 * the colour hashed from her id, whether she owns the event the page is for, and now the handle her profile lives at
 * (`/u/<handle>`), so the menu's Your profile goes straight there where she has one and to `/me` where she has none.
 *
 * ★ EVERYTHING IT SAYS IS HER OWN OR A YES OR A NO: never the raw id (the colour is a hash, `seed.ts`), never a host's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ME = "6b0f3a52-9a4e-4d54-8f0e-7c1d2e3f4a5b";

const mocks = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  menu: {
    displayName: "Priya",
    avatarMarker: null as string | null,
    slug: "priya" as string | null,
    tier: "free" as string | null,
  },
  owned: null as { id: string } | null,
  getProfileMenu: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mocks.owned, error: null }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfileMenu: (...a: unknown[]) => mocks.getProfileMenu(...a),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));

const { GET } = await import("./route");

const ask = (query = "") =>
  GET(new Request(`https://x.test/api/me/menu${query}`));

beforeEach(() => {
  mocks.user = { id: ME, email: "priya@example.com" };
  mocks.menu = {
    displayName: "Priya",
    avatarMarker: null,
    slug: "priya",
    tier: "free",
  };
  mocks.owned = null;
  mocks.getProfileMenu.mockReset();
  mocks.getProfileMenu.mockImplementation(async () => mocks.menu);
});

describe("the account menu's data", () => {
  it("answers 401 to a visitor with no session, and reads nothing about anyone", async () => {
    mocks.user = null;
    const res = await ask();
    expect(res.status).toBe(401);
    expect(mocks.getProfileMenu).not.toHaveBeenCalled();
  });

  it("★ hands the signed-in viewer her own handle, so the menu's Your profile goes straight to her page", async () => {
    const body = await (await ask()).json();
    expect(body.ok).toBe(true);
    expect(body.slug).toBe("priya");
    // Asked for the viewer's own row, by the id the session proved.
    expect(mocks.getProfileMenu).toHaveBeenCalledWith(ME);
  });

  it("★ says null for an account with no handle, rather than leaving the field off", async () => {
    mocks.menu = { ...mocks.menu, slug: null };
    const body = await (await ask()).json();
    expect(body.slug).toBeNull();
  });

  it("★ still says only what is hers: the raw id never rides, the colour is a hash, ownership is a yes or a no", async () => {
    mocks.owned = { id: "evt-1" };
    const res = await ask("?event=evt-1");
    const text = await res.text();
    expect(text).not.toContain(ME);
    const body = JSON.parse(text);
    expect(body.seed).toMatch(/^[0-9a-f]{64}$/);
    expect(body.ownsThisEvent).toBe(true);
    expect(body.email).toBe("priya@example.com");
    expect(body.displayName).toBe("Priya");
  });
});
