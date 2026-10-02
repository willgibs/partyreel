import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ROOT 404 PREFETCHES NOTHING ON SIGHT, AND IS TITLED FOR WHAT IT IS (mkt-polish).
 *
 * 1. Its header, words and footer drew `next/link`s in view, each prefetching a marketing route whose
 *    sheets the 404 never loads (it stands outside `(marketing)`), so React preloaded marketing.css and the
 *    home's three sheets from the prefetched payloads and Chrome warned four times a load that each was
 *    "preloaded but not used" (measured on `next start`). Every link it draws now asks for no prefetch; a
 *    press still navigates in place. The chrome on every other page prefetches as it always did.
 * 2. "/help/nope" carried the bare `Partyreel` title while the root's said Page not found. Unknown slugs
 *    are routing's 404 since stale-link (`dynamicParams = false` on every marketing `[slug]` page, which
 *    `marketing-dynamic-params-policy.test.ts` holds), drawn by THIS not-found, so its title is theirs:
 *    pinned here, where no test held it.
 *
 * `next/link` is stood in for by an anchor that says what it was asked (`data-prefetch`): the prop is the
 * thing pinned, since jsdom runs no prefetch.
 */

vi.mock("next/link", () => ({
  // The wordmark's door draws a pending cue (`HomeLink`); a stand-in link is never pending.
  useLinkStatus: () => ({ pending: false }),
  default: ({
    prefetch,
    href,
    children,
    ref,
    ...rest
  }: Omit<ComponentProps<"a">, "href"> & {
    prefetch?: boolean | null;
    href: string | { pathname?: string };
    children?: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
  }) => (
    <a
      ref={ref}
      href={typeof href === "string" ? href : (href.pathname ?? "")}
      data-prefetch={String(prefetch)}
      {...rest}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/lib/surface", () => ({ surface: () => "app" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/help/nope",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

const { default: NotFound, metadata } = await import("./not-found");
const { MarketingHeader } =
  await import("@/components/marketing/chrome/marketing-header");

beforeEach(() => {
  // The trail's loop, the footer's seam glow and the Reveal ask for a visibility watcher, and the trail for
  // frames; jsdom has neither, and this pins the links, not the loop.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    },
  );
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

/** Every link to a route of this site: the ones a prefetch would fetch. */
function internalLinks(root: ParentNode) {
  return [...root.querySelectorAll<HTMLAnchorElement>("a[href]")].filter((a) =>
    (a.getAttribute("href") ?? "").startsWith("/"),
  );
}

describe("the root 404", () => {
  it("draws every link of its own, header, words and footer, with no prefetch on sight", async () => {
    const { container } = render(<NotFound />);
    await screen.findByRole(
      "heading",
      { level: 1, name: "We lost this page" },
      { timeout: 4000 },
    );
    const links = internalLinks(container);
    // Pinned for non-emptiness: the header, the words and the footer all link home at least.
    expect(links.length).toBeGreaterThan(10);
    const loud = links
      .filter((a) => a.getAttribute("data-prefetch") !== "false")
      .map((a) => a.getAttribute("href"));
    expect(
      loud,
      "links that would prefetch a route the 404 holds no sheet for",
    ).toEqual([]);
  });

  it("is titled Page not found, which every unknown marketing slug lands on", () => {
    expect(metadata).toMatchObject({
      title: "Page not found",
      robots: { index: false, follow: false },
    });
  });
});

describe("the chrome on every other page", () => {
  it("prefetches as it always did, but for the wordmark's door to the home", () => {
    const { container } = render(<MarketingHeader />);
    const links = internalLinks(container);
    const pricing = links.find((a) => a.getAttribute("href") === "/pricing");
    expect(pricing).toBeTruthy();
    // No prop at all: `next/link`'s own default. The quiet page is the 404's alone.
    expect(pricing!.getAttribute("data-prefetch")).toBe("undefined");
    // The one change (crumbs-50): the wordmark's link to `/` waits for a pointer or focus, since its
    // viewport prefetch preloaded the home's three sheets into every other page (chrome-link.test.tsx).
    const home = links.find(
      (a) => a.getAttribute("aria-label") === "Partyreel home",
    );
    expect(home).toBeTruthy();
    expect(home!.getAttribute("data-prefetch")).toBe("false");
  });
});
