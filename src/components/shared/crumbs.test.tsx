// @contract-for: src/components/shared/crumbs.tsx

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CrumbsBar, CrumbsProvider, SetCrumbs } from "@/components/shared/crumbs";

/**
 * ONE WAY BACK, ON EVERY ROUTE (Will's `nav=crumbs`, 2026-09-20: "Partyreel /
 * the event / the room").
 *
 * What this guards is FUNCTION: that the trail exists, that it is a real
 * breadcrumb to a screen reader, that its last step is the page and its earlier
 * steps are walkable, and that every room inside an event declares one with a
 * walkable parent. The host app used to have FOUR ways back (a text link, a
 * dirty-checked text link, the Studio's X, and nothing at all on /account) and
 * the failure mode of replacing them with a context is silent: a route that
 * simply forgets to render <SetCrumbs> loses its way back and nothing goes red.
 * The source scan below is the guard against exactly that.
 *
 * Not a class, a size or a word is pinned here.
 */

const ROOT = process.cwd();
const EVENT_ROUTES = join(ROOT, "src/app/(app)/dashboard/[eventId]");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return entry === "page.tsx" ? [full] : [];
  });
}

function withTrail(trail: { label: string; href?: string }[]) {
  return render(
    <CrumbsProvider>
      <CrumbsBar />
      <SetCrumbs trail={trail} />
    </CrumbsProvider>,
  );
}

describe("the trail in the bar", () => {
  it("renders nothing at all until a route claims it", () => {
    render(
      <CrumbsProvider>
        <CrumbsBar />
      </CrumbsProvider>,
    );
    // Every host page that has not adopted the trail must look exactly as it
    // did, which means an unclaimed bar contributes no landmark to the page.
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("is a breadcrumb landmark whose last step is the page itself", () => {
    withTrail([
      { label: "Partyreel", href: "/dashboard" },
      { label: "Sarah and Tom", href: "/dashboard/e1" },
      { label: "Review" },
    ]);
    expect(
      screen.getByRole("navigation", { name: /breadcrumb/i }),
    ).toBeTruthy();
    const current = screen.getAllByText("Review").find((el) =>
      el.getAttribute("aria-current") === "page",
    );
    expect(current, "the last step marks itself as the current page").toBeTruthy();
  });

  it("makes every step but the last a walkable link", () => {
    withTrail([
      { label: "Partyreel", href: "/dashboard" },
      { label: "Sarah and Tom", href: "/dashboard/e1" },
      { label: "Review" },
    ]);
    // The event's own step stays walkable from inside a room: that is the
    // difference between a trail and a label saying where you are.
    const links = screen.getAllByRole("link");
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/e1");
    // The current page is never a link to itself.
    expect(
      links.some((a) => a.textContent?.trim() === "Review"),
      "the current page is not a link",
    ).toBe(false);
  });

  it("keeps a way UP in reach at a phone's width, where the full trail cannot fit", () => {
    withTrail([
      { label: "Partyreel", href: "/dashboard" },
      { label: "Sarah and Tom's wedding", href: "/dashboard/e1" },
      { label: "Review" },
    ]);
    // Two renderings of one list, swapped by CSS: the phone shows the PARENT
    // alone. Both are in the DOM, so the parent's link appears twice, and that
    // is the contract: whichever one the width reveals, there is a way up.
    const parents = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/dashboard/e1");
    expect(parents.length).toBeGreaterThanOrEqual(2);
  });

  it("is declared by every route inside an event, with a walkable parent", () => {
    const files = routeFiles(EVENT_ROUTES);
    expect(files.length, "found the event's routes at all").toBeGreaterThan(2);
    const offenders = files.filter((file) => {
      const src = readFileSync(file, "utf8");
      // A route that only redirects has no page to be on, so it owes no trail.
      if (/^\s*redirect\(/m.test(src) && !/SetCrumbs/.test(src)) return false;
      if (!/<SetCrumbs/.test(src)) return true;
      // The hub's parent is the dashboard; a room's parent is the hub. Either
      // way at least one step before the last carries an href.
      return !/href:\s*[`"']\/dashboard/.test(src);
    });
    expect(
      offenders.map((f) => f.slice(ROOT.length + 1)),
      "an event route with no trail, or a trail with nothing walkable behind it",
    ).toEqual([]);
  });
});
