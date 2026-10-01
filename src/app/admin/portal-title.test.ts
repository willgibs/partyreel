import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";
import { resolveTitle } from "next/dist/lib/metadata/resolvers/resolve-title";

/**
 * ★ THE PORTAL'S TITLES WEAR THE PORTAL'S SUFFIX, ITS HOME INCLUDED (crumbs-40, build 35's red-team). Every portal
 * page read "<X> · Partyreel Ops" but /admin, which read "Operations · Partyreel": it declares no title, so it takes
 * the portal layout's own, and a layout's `title.default` is templated by its PARENT's template, the root's
 * "%s · Partyreel". Resolved here as Next resolves them (its own `resolveTitle`, root layout, then the portal's,
 * then the page), from the two layouts' real metadata.
 */
// env.ts validates the public vars as it is imported (the root layout reaches it), and this unit-project file has
// no setup file to set them: a hoisted block, as `sentry.test.ts` does.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
});
vi.mock("server-only", () => ({}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "", className: "" }),
  Urbanist: () => ({ variable: "", className: "" }),
}));
vi.mock("@/components/providers", () => ({ Providers: () => null }));
vi.mock("@/components/shared/glow-filter", () => ({ GlowFilter: () => null }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/components/admin/admin-shell", () => ({ AdminShell: () => null }));
vi.mock("@/components/dev/app-design-island", () => ({
  AppDesignIsland: () => null,
}));
vi.mock("@/components/admin/mfa-challenge", () => ({
  MfaChallenge: () => null,
}));
vi.mock("@/components/admin/mfa-enroll", () => ({ MfaEnroll: () => null }));
vi.mock("@/components/shared/logo", () => ({ Logo: () => null }));
vi.mock("@/components/shared/page-heading", () => ({
  PageHeading: () => null,
}));
vi.mock("@/lib/auth/admin-context", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/admin/pending", () => ({ readPendingWork: vi.fn() }));

const root = (await import("@/app/layout")).metadata;
const portal = (await import("./layout")).metadata;

type Title = Metadata["title"];

/** Next's resolution down the segments, each one's title templated by the template its parents left. */
function resolve(...titles: Title[]): string {
  let resolved: { absolute: string; template: string | null } = {
    absolute: "",
    template: null,
  };
  for (const title of titles) {
    if (title === undefined || title === null) continue;
    const next = resolveTitle(title, resolved.template);
    resolved = { absolute: next.absolute, template: next.template };
  }
  return resolved.absolute;
}

describe("the operations portal's titles", () => {
  it("★ its home, which declares none, reads the portal's suffix", () => {
    expect(resolve(root.title, portal.title)).toBe(
      "Operations · Partyreel Ops",
    );
  });

  it("a portal page's own title wears the same suffix", () => {
    expect(resolve(root.title, portal.title, "Reports")).toBe(
      "Reports · Partyreel Ops",
    );
  });

  it("and a page outside the portal still wears the site's", () => {
    expect(resolve(root.title, "Pricing")).toBe("Pricing · Partyreel");
  });
});
