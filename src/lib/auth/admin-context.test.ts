/**
 * THE PORTAL'S GATE SENDS A SIGNED-OUT OPERATOR TO /login WITH THE PAGE SHE ASKED FOR (crumbs-14).
 *
 * `/admin/reports` signed out used to come back to `/admin` whatever was asked (build 21's claims
 * walk). The proxy hands the gate its path (`x-pr-path`), and it rides the sign-in only when it is
 * one of the portal's pages on the admin host (`return-path.ts`); anything else, or no path at all,
 * is the bare `/login`, whose landing on that host is the portal. A signed-in non-admin still meets
 * a 404, so the gate never confirms the portal exists.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REQUEST_PATH_HEADER } from "@/lib/auth/return-path";

const state = vi.hoisted(() => ({
  adminHost: "admin.partyreel.com" as string | null,
  host: "admin.partyreel.com" as string | null,
  path: null as string | null,
  user: null as { id: string; email: string } | null,
  isAdmin: false,
}));

vi.mock("server-only", () => ({}));
// The configured admin host, per test: production's, or none (local dev serves both surfaces).
vi.mock("@/lib/env", () => ({
  env: {
    get NEXT_PUBLIC_ADMIN_HOST() {
      return state.adminHost ?? undefined;
    },
  },
}));
vi.mock("@/lib/auth/admin-host", () => ({
  isAdminHost: (host: string | null) =>
    Boolean(state.adminHost && host?.split(":")[0] === state.adminHost),
}));
vi.mock("@/lib/surface", () => ({ servesAdmin: () => true }));
vi.mock("next/headers", () => ({
  headers: async () => {
    const h = new Headers();
    if (state.host) h.set("host", state.host);
    if (state.path !== null) h.set(REQUEST_PATH_HEADER, state.path);
    return h;
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: "aal1", nextLevel: "aal2" },
        }),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.user ? { is_admin: state.isAdmin } : null,
          }),
        }),
      }),
    }),
  }),
}));

const { requireAdmin } = await import("./admin-context");

const EVENT = "9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8";

beforeEach(() => {
  state.adminHost = "admin.partyreel.com";
  state.host = "admin.partyreel.com";
  state.path = null;
  state.user = null;
  state.isAdmin = false;
});

describe("requireAdmin, signed out", () => {
  it.each([
    ["/admin/reports", "/login?next=%2Fadmin%2Freports"],
    ["/admin", "/login?next=%2Fadmin"],
    ["/admin/security", "/login?next=%2Fadmin%2Fsecurity"],
    [`/admin/accounts/${EVENT}`, `/login?next=%2Fadmin%2Faccounts%2F${EVENT}`],
  ])("★ carries %s through the sign-in", async (path, login) => {
    state.path = path;
    await expect(requireAdmin()).rejects.toThrow(`NEXT_REDIRECT ${login}`);
  });

  it.each([
    ["no path at all", null],
    ["a download, never a page", "/admin/forensics/export"],
    ["an app page", "/account/renew"],
    ["a protocol-relative host", "//evil.example"],
    ["an absolute URL", "https://evil.example/admin/reports"],
    ["a traversal", "/admin/../dashboard"],
    ["a query", "/admin/reports?next=https://evil.example"],
    // A header cannot hold a line break at all (the platform refuses it before the gate reads it);
    // a tab it can, and the allow-list refuses that.
    ["a tab", "/admin/re\tports"],
  ])("sends %s to the bare /login", async (_, path) => {
    state.path = path;
    await expect(requireAdmin()).rejects.toThrow(/^NEXT_REDIRECT \/login$/);
  });

  it("404s the portal on any other host before anyone is asked to sign in", async () => {
    state.host = "partyreel.com";
    state.path = "/admin/reports";
    await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("carries no page where no admin host is configured (local dev, the portal beside the app)", async () => {
    // The portal's pages are a return on the admin host alone; there is none here.
    state.adminHost = null;
    state.host = "localhost:3135";
    state.path = "/admin/reports";
    await expect(requireAdmin()).rejects.toThrow(/^NEXT_REDIRECT \/login$/);
  });
});

describe("requireAdmin, signed in", () => {
  it("still 404s a non-admin, whatever page was asked", async () => {
    state.user = { id: "u1", email: "host@example.com" };
    state.path = "/admin/reports";
    await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("admits an admin at AAL1, the layout's MFA gate rendering on the page she asked for", async () => {
    state.user = { id: "u1", email: "op@example.com" };
    state.isAdmin = true;
    state.path = "/admin/reports";
    await expect(requireAdmin()).resolves.toMatchObject({
      userId: "u1",
      aal: "aal1",
      mfaEnrolled: true,
    });
  });
});
