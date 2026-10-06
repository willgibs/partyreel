import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";
import { resolveTitle } from "next/dist/lib/metadata/resolvers/resolve-title";
import { notFound, redirect } from "next/navigation";

/**
 * ★ THE PORTAL'S TITLES WEAR THE PORTAL'S SUFFIX, ITS HOME INCLUDED (crumbs-40, build 35's red-team). Every portal
 * page read "<X> · Partyreel Ops" but /admin, which read "Operations · Partyreel": it declares no title, so it takes
 * the portal layout's own, and a layout's `title.default` is templated by its PARENT's template, the root's
 * "%s · Partyreel". Resolved here as Next resolves them (its own `resolveTitle`, root layout, then the portal's,
 * then the page), from the two layouts' real metadata.
 *
 * ★ AND A VISITOR WHO IS NOT AN OPERATOR READS NONE OF IT (crumbs-82; the Drive re-walk's finding). The layout's head
 * became a function of the gate (`generateMetadata`), so a non-admin's `/admin/jobs` answers the title of a URL that
 * does not exist, byte for byte, in the server's HTML and after the page's own title streams in: it once read "Jobs ·
 * Partyreel Ops", naming the page and the portal. RESHAPED ON PURPOSE: the three cases below read the layout's `metadata`
 * export, which is a function now; they keep their scar and read it as an operator does.
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
const lost = (await import("@/app/not-found")).metadata;
const { default: AdminLayout, generateMetadata } = await import("./layout");
const { requireAdmin } = await import("@/lib/auth/admin-context");

type Answer = "operator" | "not-found" | "signed-out" | "broken";

/**
 * What the gate does for this visitor, as `requireAdmin` does it: an operator passes, a non-admin or a wrong host gets
 * Next's own 404, a signed-out one Next's own redirect (the real signals, thrown by the real `notFound()` and
 * `redirect()`), and a gate that cannot read (the database down) throws a plain error.
 */
function gate(answer: Answer) {
  const mock = vi.mocked(requireAdmin);
  if (answer === "operator") mock.mockResolvedValue({} as never);
  else if (answer === "not-found")
    mock.mockImplementation(async () => notFound());
  else if (answer === "signed-out")
    mock.mockImplementation(async () => redirect("/login"));
  else mock.mockRejectedValue(new Error("supabase is down"));
}

/** The portal's head as the gate answers for this visitor. */
async function headFor(answer: Answer) {
  gate(answer);
  return generateMetadata();
}

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
  it("★ its home, which declares none, reads the portal's suffix", async () => {
    const portal = await headFor("operator");
    expect(resolve(root.title, portal.title)).toBe(
      "Operations · Partyreel Ops",
    );
  });

  it("a portal page's own title wears the same suffix", async () => {
    const portal = await headFor("operator");
    expect(resolve(root.title, portal.title, "Reports")).toBe(
      "Reports · Partyreel Ops",
    );
  });

  it("and a page outside the portal still wears the site's", () => {
    expect(resolve(root.title, "Pricing")).toBe("Pricing · Partyreel");
  });
});

describe("a visitor who is not an operator, on a portal page", () => {
  // What an unmatched URL (`/admin/nope`, `/nope`) reads: the root's own 404 under the root's template.
  const unmatched = resolve(root.title, lost.title);

  it("★ reads the title of a URL that does not exist, never the portal's or the page's", async () => {
    expect(unmatched).toBe("Page not found · Partyreel");
    // A non-admin, a wrong host and a signed-out visitor, by the gate's own signals; and a gate that cannot read at all
    // (it fails closed, as the gate does).
    for (const answer of ["not-found", "signed-out", "broken"] as const) {
      const head = await headFor(answer);
      // The server's HTML: the portal's head, then the 404 boundary's own title.
      expect(resolve(root.title, head.title, lost.title), answer).toBe(
        unmatched,
      );
      // And once the page's own metadata streams in after hydration: any page's, named or not.
      for (const page of ["Jobs", "Reports", "Accounts", undefined]) {
        expect(
          resolve(root.title, head.title, page),
          `${answer}: ${page}`,
        ).toBe(unmatched);
      }
    }
  });

  it("is still kept out of every index, as the portal's own head keeps every response", async () => {
    for (const answer of ["not-found", "signed-out", "broken"] as const)
      expect((await headFor(answer)).robots, answer).toEqual({
        index: false,
        follow: false,
      });
  });

  it("an operator's pages still name the portal and the page", async () => {
    const head = await headFor("operator");
    expect(resolve(root.title, head.title, "Jobs")).toBe(
      "Jobs · Partyreel Ops",
    );
    expect(head.robots).toEqual({ index: false, follow: false });
  });
});

/**
 * ★ THE LAYOUT STILL TURNS A STRANGER AWAY, FOR REAL: the head swallows the gate's signals, so nothing may swallow them
 * in the body. A non-admin's 404 and a signed-out visitor's redirect reach Next untouched (its own digests), and a gate
 * that cannot read is the error boundary's.
 */
describe("the portal's layout, whatever its head says", () => {
  const meet = async (answer: Answer) => {
    gate(answer);
    try {
      await AdminLayout({ children: null });
    } catch (error) {
      return error as { digest?: string; message?: string };
    }
    return null;
  };

  it("★ throws the 404 for a non-admin and a wrong host", async () => {
    expect((await meet("not-found"))?.digest).toMatch(
      /^NEXT_HTTP_ERROR_FALLBACK;404/,
    );
  });

  it("★ throws the redirect to sign-in for a signed-out visitor", async () => {
    expect((await meet("signed-out"))?.digest).toMatch(/^NEXT_REDIRECT;/);
  });

  it("throws the gate's own failure rather than draw a portal", async () => {
    expect((await meet("broken"))?.message).toBe("supabase is down");
  });
});
