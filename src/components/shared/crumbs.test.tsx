import { act, render, screen } from "@testing-library/react";
import { Profiler, StrictMode, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  CrumbsBar,
  CrumbsHold,
  CrumbsProvider,
  SetCrumbs,
} from "@/components/shared/crumbs";
import { filesUnder, read } from "@/testing/source-tree";

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
 *
 * AND A TRAIL IS THE ROUTE'S WHILE THE ROUTE IS ON SCREEN (crumbs-19; build 25's red-team: an event's delete
 * redirected to /dashboard and the bar still read the deleted event, because it kept the last trail for ever
 * and /dashboard sets none). What the second describe pins is both halves of the fix: a route that sets none
 * draws none, and the bar never goes empty between two routes that both set a trail, through the wait a
 * route's skeleton stands in for (measured under the real router: the new address commits with the skeleton
 * on screen and the page lands later, so a bar that let go with the old page blinked for the whole wait).
 */

const EVENT_ROUTES = "src/app/(app)/dashboard/[eventId]";

function routeFiles(dir: string): string[] {
  return filesUnder(dir).filter((file) => file.endsWith("/page.tsx"));
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
    const current = screen
      .getAllByText("Review")
      .find((el) => el.getAttribute("aria-current") === "page");
    expect(
      current,
      "the last step marks itself as the current page",
    ).toBeTruthy();
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
      const src = read(file);
      // A route that only redirects has no page to be on, so it owes no trail.
      if (/^\s*redirect\(/m.test(src) && !/SetCrumbs/.test(src)) return false;
      if (!/<SetCrumbs/.test(src)) return true;
      // The hub's parent is the dashboard; a room's parent is the hub. Either
      // way at least one step before the last carries an href.
      return !/href:\s*[`"']\/dashboard/.test(src);
    });
    expect(
      offenders,
      "an event route with no trail, or a trail with nothing walkable behind it",
    ).toEqual([]);
  });
});

/* ── a trail is the route's, while the route is on screen ─────────────────────────────────── */

const HUB = [
  { label: "Partyreel", href: "/dashboard" },
  { label: "Sarah and Tom" },
];
const ROOM = [
  { label: "Partyreel", href: "/dashboard" },
  { label: "Sarah and Tom", href: "/dashboard/e1" },
  { label: "Guests" },
];

/** What the bar shows right now: its text, or null when it draws nothing. */
const bar = () =>
  screen.queryByRole("navigation", { name: /breadcrumb/i })?.textContent ??
  null;

/**
 * The bar as each COMMIT of it leaves it, recorded by a Profiler around it (its callback runs in the commit,
 * after the DOM is written, for every commit in which the bar itself updated). A layout effect's state update
 * commits again before the browser paints, so an empty bar in this record is an empty bar a frame could show;
 * a state only the sync re-render repairs is a commit of its own here, and the record says which is which.
 */
function shell(route: ReactNode, into: (string | null)[]) {
  // One persistent shell (the layout) and a swappable route under it, as the real app has.
  return (
    <CrumbsProvider>
      <Profiler id="bar" onRender={() => into.push(bar())}>
        <CrumbsBar />
      </Profiler>
      {route}
    </CrumbsProvider>
  );
}

const routeWith = (key: string, trail: { label: string; href?: string }[]) => (
  <div key={key}>
    <SetCrumbs trail={trail} />
  </div>
);
const routeWithNone = (key: string) => (
  <div key={key}>a page that sets none</div>
);
const skeleton = (key: string) => (
  <div key={key}>
    <CrumbsHold />a route&rsquo;s skeleton
  </div>
);

describe("a trail is drawn while its route is on screen, and not after", () => {
  it("★ a route that sets none draws none, whatever route came before it", () => {
    const seen: (string | null)[] = [];
    const view = render(shell(routeWith("hub", HUB), seen));
    expect(bar()).toContain("Sarah and Tom");
    // The delete's redirect, the account menu's Account, Back to /dashboard: a route with no SetCrumbs.
    view.rerender(shell(routeWithNone("dashboard"), seen));
    expect(
      bar(),
      "the last route's trail is still on a route that sets none",
    ).toBeNull();
  });

  it("★ and so does an error or a not-found page in the route's own place", () => {
    const view = render(shell(routeWith("hub", ROOM), []));
    // The page throws or calls notFound(): the boundary's UI stands where the page was, and nothing claims.
    view.rerender(
      shell(<p key="not-found">We couldn&rsquo;t find that event</p>, []),
    );
    expect(bar()).toBeNull();
  });

  it("★ a step between two routes that both set a trail never leaves the bar empty", () => {
    const seen: (string | null)[] = [];
    const view = render(shell(routeWith("hub", HUB), seen));
    // The first paint of a page has no trail yet (it lands at hydration, the header says); a STEP is what follows.
    const first = seen.length;
    view.rerender(shell(routeWith("guests", ROOM), seen));
    expect(bar()).toContain("Guests");
    view.rerender(shell(routeWith("hub", HUB), seen));
    expect(bar()).not.toContain("Guests");
    const steps = seen.slice(first);
    expect(steps.length, "the steps were not recorded").toBeGreaterThanOrEqual(
      2,
    );
    expect(
      steps,
      "an empty bar was committed between two routes that both set a trail",
    ).not.toContain(null);
  });

  it("★ a skeleton holds the last trail through the wait, and the page that lands replaces it in the same commit", () => {
    const seen: (string | null)[] = [];
    const view = render(shell(routeWith("hub", HUB), seen));
    const first = seen.length;
    // The address commits, the old page is gone and the new one has not arrived: only its skeleton is up.
    view.rerender(shell(skeleton("guests-loading"), seen));
    expect(bar(), "the bar blinked for the length of the wait").toContain(
      "Sarah and Tom",
    );
    expect(bar()).not.toContain("Guests");
    view.rerender(shell(routeWith("guests", ROOM), seen));
    expect(bar()).toContain("Guests");
    expect(
      seen.slice(first),
      "an empty bar was committed while a route's page was on its way",
    ).not.toContain(null);
  });

  it("★ when the page that lands sets none, the held trail goes with the skeleton", () => {
    const view = render(shell(routeWith("hub", ROOM), []));
    view.rerender(shell(skeleton("dashboard-loading"), []));
    expect(bar()).toContain("Guests");
    view.rerender(shell(routeWithNone("dashboard"), []));
    expect(
      bar(),
      "the trail outlived the skeleton that was holding it",
    ).toBeNull();
  });

  it("★ and it is spent: the next route's skeleton holds nothing of an event left two routes ago", () => {
    const view = render(shell(routeWith("hub", ROOM), []));
    view.rerender(shell(skeleton("dashboard-loading"), []));
    view.rerender(shell(routeWithNone("dashboard"), []));
    // From /dashboard the reader picks ANOTHER event: its skeleton goes up, and the bar must not say the
    // event they just left.
    view.rerender(shell(skeleton("hub-loading"), []));
    expect(bar()).toBeNull();
  });

  it("holds until the LAST skeleton is gone, and lets go when the count returns to none", () => {
    const view = render(shell(<>{routeWith("hub", HUB)}</>, []));
    view.rerender(
      shell(
        <>
          {skeleton("one")}
          {skeleton("two")}
        </>,
        [],
      ),
    );
    expect(bar()).toContain("Sarah and Tom");
    view.rerender(shell(<>{skeleton("one")}</>, []));
    expect(bar(), "one skeleton is still up").toContain("Sarah and Tom");
    view.rerender(shell(<>{routeWithNone("dashboard")}</>, []));
    expect(bar()).toBeNull();
  });

  it("a trail that changes under a mounted route (an event renamed) is replaced, never dropped", () => {
    const seen: (string | null)[] = [];
    const view = render(shell(routeWith("hub", HUB), seen));
    const first = seen.length;
    view.rerender(
      shell(
        routeWith("hub", [HUB[0], { label: "Sarah and Tom's wedding" }]),
        seen,
      ),
    );
    expect(bar()).toContain("Sarah and Tom's wedding");
    expect(seen.slice(first)).not.toContain(null);
  });

  it("only the claim that is still the route's lets go: a page leaving after its successor claimed takes nothing", () => {
    const view = render(
      shell(
        <>
          {routeWith("old", HUB)}
          {routeWith("new", ROOM)}
        </>,
        [],
      ),
    );
    expect(bar()).toContain("Guests");
    // The old page unmounts in the same commit the new one is already claimed.
    view.rerender(shell(<>{routeWith("new", ROOM)}</>, []));
    expect(bar()).toContain("Guests");
  });

  it("is claimed under StrictMode's extra effect cycle, and released for good when the route goes", () => {
    const view = render(
      <StrictMode>{shell(routeWith("hub", HUB), [])}</StrictMode>,
    );
    expect(bar()).toContain("Sarah and Tom");
    view.rerender(
      <StrictMode>{shell(routeWithNone("dashboard"), [])}</StrictMode>,
    );
    expect(bar()).toBeNull();
  });

  it("never throws where nothing provides the bar (a skeleton in the Library's gallery)", () => {
    expect(() => render(<CrumbsHold />)).not.toThrow();
    expect(() => render(<SetCrumbs trail={HUB} />)).not.toThrow();
  });

  it("a route with no wait and no trail leaves the bar exactly as a page that never set one did", () => {
    render(shell(routeWithNone("dashboard"), []));
    expect(screen.queryByRole("navigation")).toBeNull();
    act(() => {});
    expect(bar()).toBeNull();
  });
});
