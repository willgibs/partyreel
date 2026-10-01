import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PendingCounts } from "@/lib/admin/nav";

/**
 * THE PORTAL'S CHROME NEVER PREFETCHES (crumbs-35, build 34's red-team: a real page view cost about 30
 * `GET /auth/v1/user`).
 *
 * `next/link` prefetches every link that paints, and each prefetch of a portal route is a request of its own:
 * the proxy asks Supabase who is there, then the route's layout renders and asks again, so the rail's thirteen
 * surfaces and the bar's wordmark made about thirty reads a view whichever surface was open. A prefetch buys an
 * operator nothing (one person, one click at a time, on a console that is read, not browsed), and it buys the
 * auth server nothing at all. A page's own `getUser()` is untouched: this only stops the pages nobody opened
 * from being rendered.
 *
 * `next/link` is stood in for by an anchor that prints its `prefetch` prop, since the prop is the whole of
 * the contract (`false`: never, on entering the viewport or on hover) and prefetching itself runs only in a
 * production build.
 */
vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: string;
    prefetch?: boolean | null;
    children?: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/reports" }));
vi.mock("@/components/auth/sign-out", () => ({ signOutHere: vi.fn() }));

import { AdminBar } from "@/components/admin/admin-bar";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminRail } from "@/components/admin/admin-rail";
import { NAV } from "@/lib/admin/nav";

const COUNTS: PendingCounts = {
  support: 0,
  applicants: 0,
  reports: 0,
  jobs: 0,
};

/** Every link the screen holds that leaves for another portal surface, with what it asks `next/link` to do. */
function portalLinks() {
  // By the anchor, not the role: a dropdown's rows are `menuitem`s wearing the link, and its content
  // is portaled out of the render's container.
  return Array.from(
    document.body.querySelectorAll<HTMLElement>("a[href^='/admin']"),
  );
}

function expectNoPrefetch(links: HTMLElement[]) {
  expect(links.length).toBeGreaterThan(0);
  for (const a of links) {
    expect(
      a.getAttribute("data-prefetch"),
      `${a.getAttribute("href")} may prefetch`,
    ).toBe("false");
  }
}

describe("the portal's chrome", () => {
  it("★ the rail's links, one a surface, never prefetch", () => {
    render(<AdminRail counts={COUNTS} onOpenPalette={() => {}} />);
    const links = portalLinks();
    expect(links).toHaveLength(NAV.length);
    expectNoPrefetch(links);
  });

  it("★ the below-lg dropdown's links never prefetch once it is open", () => {
    render(<AdminNav />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /reports/i }), {
      button: 0,
      ctrlKey: false,
    });
    const links = portalLinks();
    expect(links).toHaveLength(NAV.length);
    expectNoPrefetch(links);
  });

  it("★ the bar's wordmark, which paints on every view, never prefetches", () => {
    render(
      <AdminBar
        email="ops@partyreel.com"
        alerts={COUNTS}
        env="production"
        unhealthyJobs={0}
        onOpenPalette={() => {}}
      />,
    );
    expectNoPrefetch(portalLinks());
  });

  it("★ nor does the bar's health chip, the other link that paints on a bad day", () => {
    render(
      <AdminBar
        email="ops@partyreel.com"
        alerts={COUNTS}
        env={null}
        unhealthyJobs={2}
        onOpenPalette={() => {}}
      />,
    );
    const chip = screen.getByRole("link", { name: /2 jobs need you/i });
    expect(chip.getAttribute("data-prefetch")).toBe("false");
  });
});
