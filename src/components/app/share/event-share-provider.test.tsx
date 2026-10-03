/**
 * THE SHEETS RIDE THE URL, AND EVERY WAY IN CLOSES (milestone 30's production pass: a sheet opened from
 * a link could not be closed).
 *
 * The ways in were the `/settings` route, a sign-in returning to it, Checkout's return with
 * `?room=share|settings` and every bookmark: each lands on the hub with the parameter already in the
 * URL and none of our history behind it. Closing drops the parameter in place, and a fallback to "the
 * sheet this page was first loaded with" that outlived hydration opened it again, so Escape and the X
 * did nothing.
 *
 * And the settings' pages (event-settings r1, `opens=page`): a page rides beside the sheet and REPLACES
 * the entry, so the sheet stays one entry deep and closes whole from any page, a deep link included.
 *
 * And the panel's history stays one entry deep whatever happens to the page (crumbs-18): a double tap
 * on its card pushes one entry, not two (the first close used to go Back to the panel still open), and
 * "this entry is ours" outlives what holds it: a router refresh takes the entry's marker and a reload
 * takes the page's memory, so the two in either order used to leave neither, and a panel closed by
 * replacing in place left a duplicate entry (a dead Back).
 *
 * And a close asked twice closes once (crumbs-19): two taps on the X before the first Back's popstate lands
 * called `history.back()` twice and left the hub for the page before it. The shared helper
 * (`@/lib/history-entry`, which has its own test) lets the second go until the first has landed.
 *
 * And the mini-modal is a look at the code, never a destination: opening and closing it writes no history
 * (this was once a scan of the provider's source between two names; it is a behavior now).
 *
 * ★ THE STAND-IN IS NEXT'S PATCH, NOT A FIRING LISTENER (build 23's red-team, HIGH: a Settings row never
 * opened its page and a page's back arrow never returned). This file's first stand-in told its listeners
 * on EVERY `replaceState`, and the shipped code handed `replaceState` the entry's own state, which
 * carries Next's `__NA`: Next takes such a call for its own bookkeeping and applies no URL, so under the
 * real router the bar changed and `useSearchParams` never did. Nothing here could see it. The router is
 * now `@/lib/test-utils/next-history`, which ports the patch (an early return on `__NA` or `_N`, the URL
 * applied otherwise), the router's own copy of the address, and the commit that puts that copy back on
 * the bar; its own test fails when Next's file stops matching. What still needs Next itself is checked
 * under `next dev`.
 */
import Link from "next/link";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

vi.mock("next/navigation", async () => {
  const { nextNavigation } = await import("@/lib/test-utils/next-history");
  return nextNavigation;
});
vi.mock("@/lib/shared/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => true,
}));

const { EventShareProvider, useEventShare } =
  await import("@/components/app/share/event-share-provider");

let next: NextHistory;

beforeEach(() => {
  next = installNextHistory();
});

afterEach(() => {
  next.uninstall();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

function Probe() {
  const {
    sheet,
    openSheet,
    closeSheet,
    settingsPage,
    openSettingsPage,
    closeSettingsPage,
    codeOpen,
    openCode,
    closeCode,
    takeAnchor,
  } = useEventShare();
  return (
    <div>
      <p data-testid="sheet">{sheet ?? "none"}</p>
      <button type="button" onClick={() => openSheet("review")}>
        open review
      </button>
      <button type="button" onClick={() => openSheet("guests")}>
        open guests
      </button>
      <button type="button" onClick={() => openSheet("as-guest")}>
        open as a guest
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.currentTarget.dataset.took = takeAnchor() ?? "none";
        }}
      >
        take the anchor
      </button>
      <p data-testid="code">{codeOpen ? "open" : "closed"}</p>
      <button type="button" onClick={openCode}>
        open the code
      </button>
      <button type="button" onClick={closeCode}>
        close the code
      </button>
      <p data-testid="page">{settingsPage ?? "rows"}</p>
      <button type="button" onClick={() => openSheet("settings")}>
        open settings
      </button>
      <button type="button" onClick={closeSheet}>
        close
      </button>
      <button type="button" onClick={() => openSettingsPage("door")}>
        open the door page
      </button>
      <button type="button" onClick={closeSettingsPage}>
        up
      </button>
    </div>
  );
}

type Initial = "settings" | "share" | "review" | "guests" | "as-guest" | null;

function hubTree(initialSheet: Initial, links: React.ReactNode = null) {
  return (
    <NextRouterStandIn>
      <EventShareProvider initialSheet={initialSheet} eventId="e1">
        <Probe />
        {links}
      </EventShareProvider>
    </NextRouterStandIn>
  );
}

function hub(initialSheet: Initial, links: React.ReactNode = null) {
  return render(hubTree(initialSheet, links));
}

const shown = () => screen.getByTestId("sheet").textContent;
const pageShown = () => screen.getByTestId("page").textContent;
const press = (name: string) =>
  act(() => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
/**
 * A close that goes Back: its popstate lands after the click, so wait for it. Bounded, because a close
 * that never goes Back must fail on its own assertion and not hang the act scope for the tests after it.
 */
const pressAndWaitForPopstate = (name: string) =>
  act(async () => {
    let seen: () => void = () => {};
    const popped = new Promise<void>((resolve) => {
      seen = resolve;
      window.addEventListener("popstate", seen, { once: true });
    });
    fireEvent.click(screen.getByRole("button", { name }));
    await Promise.race([popped, new Promise((r) => setTimeout(r, 2000))]);
    window.removeEventListener("popstate", seen);
  });
/** The query Next's router holds for the address, what `useSearchParams` reads. */
const routerParam = (name: string) =>
  new URLSearchParams(new URL(next.href, "http://x").search).get(name);
const barParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name);
const ourMarker = () =>
  Boolean(
    (window.history.state as Record<string, unknown> | null)?.prEventSheet,
  );

describe("a sheet opened from a link", () => {
  it("★ closes, and stays closed (the fallback to the first load is the first paint's alone)", () => {
    next.land("/dashboard/e1?room=settings");
    hub("settings");
    expect(shown()).toBe("settings");
    press("close");
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("closes from a page it opened straight onto, both parameters gone", () => {
    next.land("/dashboard/e1?room=settings&setting=door");
    hub("settings");
    expect(pageShown()).toBe("door");
    press("close");
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(pageShown()).toBe("rows");
  });

  it("Share from Checkout's return closes the same way", () => {
    next.land("/dashboard/e1?room=share");
    hub("share");
    expect(shown()).toBe("share");
    press("close");
    expect(shown()).toBe("none");
  });
});

describe("a sheet opened from its card", () => {
  it("closes by going Back, leaving no entry behind, and Next never reloads the page for it", async () => {
    next.land("/dashboard/e1");
    hub(null);
    const before = window.history.length;
    press("open settings");
    expect(shown()).toBe("settings");
    expect(window.history.length).toBe(before + 1);
    // The marker rides a FIELD on a state Next has copied its `__NA` onto: an entry without it would
    // be reloaded by Next's popstate handler.
    expect(ourMarker()).toBe(true);
    await pressAndWaitForPopstate("close");
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(next.reloads).toBe(0);
  });
});

describe("the settings' pages", () => {
  it("★ a page opens, and its back arrow returns to the rows: the router hears both, not only the bar", () => {
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    const depth = window.history.length;
    press("open the door page");
    // ★ build 23's red-team: the bar said `&setting=door` and the router did not, so nothing opened.
    expect(barParam("setting")).toBe("door");
    expect(routerParam("setting")).toBe("door");
    expect(pageShown()).toBe("door");
    // A page replaces the entry: the sheet stays one entry deep.
    expect(window.history.length).toBe(depth);
    press("up");
    expect(barParam("setting")).toBeNull();
    expect(routerParam("setting")).toBeNull();
    expect(pageShown()).toBe("rows");
    expect(shown()).toBe("settings");
  });

  it("★ the entry keeps the sheet's marker through a page and back, so the close still goes Back", async () => {
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    press("open the door page");
    expect(ourMarker()).toBe(true);
    press("up");
    expect(ourMarker()).toBe(true);
    press("open the door page");
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    // From a page, one Back closes the whole of Settings (not up to the rows first).
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(next.reloads).toBe(0);
  });

  it("★ a page stays open through the router's refresh (a settings action), the bar keeping it", () => {
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    press("open the door page");
    // `router.refresh()`: Next writes ITS copy of the address over the bar. The copy heard of the page,
    // so the bar keeps it; a copy that never did put the old address back and closed the page.
    act(() => next.refresh());
    expect(barParam("setting")).toBe("door");
    expect(barParam("room")).toBe("settings");
    expect(pageShown()).toBe("door");
  });

  it("★ a refresh takes the marker off the entry, and the close still goes Back rather than leaving a dead entry", async () => {
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    // Next's refresh rewrites the entry without the custom state (the reel switch in Settings refreshes).
    act(() => next.refresh());
    expect(ourMarker()).toBe(false);
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("a deep-linked page returns to the rows without gaining a marker, and the close still replaces in place", () => {
    next.land("/dashboard/e1?room=settings&setting=door");
    hub("settings");
    expect(pageShown()).toBe("door");
    press("up");
    expect(routerParam("setting")).toBeNull();
    expect(pageShown()).toBe("rows");
    expect(shown()).toBe("settings");
    // Not ours: nothing of ours was pushed, so nothing may claim to be.
    expect(ourMarker()).toBe(false);
    const back = vi.spyOn(window.history, "back");
    const depth = window.history.length;
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.history.length).toBe(depth);
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("a stray page parameter opens nothing while Settings is not the sheet", () => {
    next.land("/dashboard/e1?setting=door");
    hub(null);
    expect(shown()).toBe("none");
    expect(pageShown()).toBe("rows");
  });

  it("a sheet opens on its first level, whatever an earlier visit left in the URL", () => {
    next.land("/dashboard/e1?setting=door");
    hub(null);
    press("open settings");
    expect(shown()).toBe("settings");
    expect(pageShown()).toBe("rows");
  });
});

describe("a sheet opened twice", () => {
  it("★ a double tap on its card pushes one entry, and the first close goes Back to the page", async () => {
    next.land("/dashboard/e1");
    hub(null);
    const before = window.history.length;
    // Two taps in one tick: the second meets the address the first wrote, before the page has re-rendered.
    act(() => {
      const card = screen.getByRole("button", { name: "open settings" });
      fireEvent.click(card);
      fireEvent.click(card);
    });
    expect(shown()).toBe("settings");
    expect(window.history.length).toBe(before + 1);
    await pressAndWaitForPopstate("close");
    // The old code stood on its first entry with the panel still open.
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(next.reloads).toBe(0);
  });

  it("a second tap after the panel has rendered opens nothing more either, and keeps the page it is on", () => {
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    press("open the door page");
    const depth = window.history.length;
    press("open settings");
    expect(window.history.length).toBe(depth);
    // Already open: it is left as it is, on its page.
    expect(pageShown()).toBe("door");
  });
});

describe("the entry stays ours through a refresh and a reload", () => {
  it("★ a panel reloaded onto, then refreshed by a settings action, still closes by going Back", async () => {
    next.land("/dashboard/e1");
    const before = hub(null);
    press("open settings");
    // A reload: the page is gone and a new one reads the entry, which kept its marker (Next's first
    // commit preserves the state it finds; a page remembers nothing).
    before.unmount();
    expect(ourMarker()).toBe(true);
    hub("settings");
    // The reel switch's refresh: the entry loses its marker, and this page never pushed it.
    act(() => next.refresh());
    expect(ourMarker()).toBe(false);
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("★ a refresh and then a reload: the entry is given its marker back, so the new page still finds it ours", async () => {
    next.land("/dashboard/e1");
    const before = hub(null);
    press("open settings");
    act(() => next.refresh());
    expect(ourMarker()).toBe(false);
    // The hub's slots re-render after a refresh, and the provider with them.
    before.rerender(hubTree(null));
    expect(ourMarker()).toBe(true);
    before.unmount();
    hub("settings");
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("never gives a marker to an entry this page did not push (a bookmark, a shared link)", () => {
    next.land("/dashboard/e1?room=settings");
    const view = hub("settings");
    view.rerender(hubTree("settings"));
    expect(ourMarker()).toBe(false);
    const back = vi.spyOn(window.history, "back");
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });
});

describe("a sheet closed twice", () => {
  /** Two closes in one tick, then wait out both possible landings (a second Back, if one was called, lands a beat after the first). */
  const closeTwice = () =>
    act(async () => {
      const landed = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      const button = screen.getByRole("button", { name: "close" });
      fireEvent.click(button);
      fireEvent.click(button);
      await Promise.race([landed, new Promise((r) => setTimeout(r, 2000))]);
      await new Promise((r) => setTimeout(r, 60));
    });

  it("★ goes Back once, so the hub stays the page it was", async () => {
    // A page before the hub, so a second Back has somewhere to take the reader.
    next.land("/elsewhere");
    window.history.pushState(null, "", "/dashboard/e1");
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    expect(shown()).toBe("settings");
    const back = vi.spyOn(window.history, "back");
    await closeTwice();
    // The old code called it twice and stood on /elsewhere.
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/dashboard/e1");
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(next.reloads).toBe(0);
  });

  it("★ and a Back that never lands does not strand the panel open: a later close goes through", () => {
    vi.useFakeTimers();
    try {
      next.land("/dashboard/e1");
      hub(null);
      press("open settings");
      // The browser ignores the Back (or its popstate is lost): no traversal happens, nothing lands.
      const back = vi
        .spyOn(window.history, "back")
        .mockImplementation(() => {});
      press("close");
      press("close");
      expect(back).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      press("close");
      expect(back).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes once again for the next panel: a Back that landed leaves no closing flag behind", async () => {
    next.land("/elsewhere");
    window.history.pushState(null, "", "/dashboard/e1");
    next.land("/dashboard/e1");
    hub(null);
    for (let round = 0; round < 2; round += 1) {
      press("open settings");
      expect(shown()).toBe("settings");
      const back = vi.spyOn(window.history, "back");
      await closeTwice();
      expect(back).toHaveBeenCalledTimes(1);
      expect(shown()).toBe("none");
      back.mockRestore();
    }
    expect(window.location.pathname).toBe("/dashboard/e1");
  });

  it("a deep-linked panel closed twice replaces in place both times and never goes Back", () => {
    next.land("/dashboard/e1?room=settings");
    hub("settings");
    const back = vi.spyOn(window.history, "back");
    press("close");
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });
});

describe("the mini-modal is a look, never a destination", () => {
  it("opens and closes without writing history", () => {
    next.land("/dashboard/e1");
    hub(null);
    const before = window.history.length;
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    press("open the code");
    expect(screen.getByTestId("code").textContent).toBe("open");
    press("close the code");
    expect(screen.getByTestId("code").textContent).toBe("closed");
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.history.length).toBe(before);
    expect(window.location.pathname).toBe("/dashboard/e1");
  });
});

/* ── Every room over the hub (event-header r2, `rooms=over`) ─────────────────────────────────────── */

describe("Review and Guests open over the hub, one way in and out, as Settings does", () => {
  it.each(["review", "guests", "as-guest"] as const)(
    "★ %s opens on the hub's own address and closes by going Back, the page never reloaded",
    async (room) => {
      next.land("/dashboard/e1");
      hub(null);
      // A push, never a replace: what the close goes Back over. (Counted on the call: an earlier test's Back can
      // leave a forward entry that a push truncates, so the history's length says nothing here.)
      const push = vi.spyOn(window.history, "pushState");
      press(room === "as-guest" ? "open as a guest" : `open ${room}`);
      expect(push).toHaveBeenCalledTimes(1);
      push.mockRestore();
      expect(shown()).toBe(room);
      expect(barParam("room")).toBe(room);
      expect(routerParam("room")).toBe(room);
      expect(window.location.pathname).toBe("/dashboard/e1");
      expect(ourMarker()).toBe(true);
      await pressAndWaitForPopstate("close");
      expect(window.location.search).toBe("");
      expect(shown()).toBe("none");
      expect(next.reloads).toBe(0);
    },
  );

  it.each(["review", "guests", "as-guest"] as const)(
    "%s landed on from a link (the bell, a dashboard act) closes in place and never leaves the hub",
    (room) => {
      next.land(`/dashboard/e1?room=${room}`);
      hub(room);
      expect(shown()).toBe(room);
      const back = vi.spyOn(window.history, "back");
      press("close");
      expect(back).not.toHaveBeenCalled();
      expect(window.location.pathname).toBe("/dashboard/e1");
      expect(window.location.search).toBe("");
      expect(shown()).toBe("none");
    },
  );

  it("★ one room handing over to another replaces its entry, so a close still lands on the hub", async () => {
    next.land("/elsewhere");
    window.history.pushState(null, "", "/dashboard/e1");
    next.land("/dashboard/e1");
    hub(null);
    press("open settings");
    press("open the door page");
    const push = vi.spyOn(window.history, "pushState");
    // Settings' door page says "Let them in from Guests": the room is handed over, never stacked.
    press("open guests");
    expect(push).not.toHaveBeenCalled();
    push.mockRestore();
    expect(shown()).toBe("guests");
    expect(barParam("room")).toBe("guests");
    expect(barParam("setting")).toBeNull();
    expect(routerParam("room")).toBe("guests");
    expect(ourMarker()).toBe(true);
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/dashboard/e1");
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("a room handed over from a deep-linked one still closes in place", () => {
    next.land("/dashboard/e1?room=settings");
    hub("settings");
    press("open review");
    expect(shown()).toBe("review");
    expect(ourMarker()).toBe(false);
    const back = vi.spyOn(window.history, "back");
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });
});

describe("★ every old way in inside the hub opens its room in place (the sheet's guests link, the reel's guidance)", () => {
  const click = (name: string, init: MouseEventInit = {}) => {
    let event!: MouseEvent;
    act(() => {
      const link = screen.getByRole("link", { name });
      event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...init,
      });
      link.dispatchEvent(event);
    });
    return event;
  };
  const LINKS = (
    <nav>
      <Link href="/dashboard/e1/guests#at-the-door">
        Let them in from Guests
      </Link>
      <Link href="/dashboard/e1/guests#invited">Manage in Guests</Link>
      <Link href="/dashboard/e1/review">3 waiting in Review</Link>
      <Link href="/dashboard/e1?room=review">Review</Link>
      <Link href="/dashboard/e1/settings">Settings</Link>
      <Link href="/dashboard/e1?room=settings&setting=door">
        Change who can get in
      </Link>
      <Link href="/dashboard/e2/review">Another event</Link>
      <Link href="/dashboard/e1/print">Print</Link>
      <Link href="/dashboard/e1/review" target="_blank" rel="noreferrer">
        Review in a tab
      </Link>
    </nav>
  );

  it.each([
    ["Let them in from Guests", "guests"],
    ["Manage in Guests", "guests"],
    ["3 waiting in Review", "review"],
    ["Review", "review"],
    ["Settings", "settings"],
  ])("%s opens %s over the hub, no navigation", (name, room) => {
    next.land("/dashboard/e1");
    hub(null, LINKS);
    const event = click(name);
    expect(event.defaultPrevented).toBe(true);
    expect(shown()).toBe(room);
    expect(window.location.pathname).toBe("/dashboard/e1");
    expect(barParam("room")).toBe(room);
    expect(next.reloads).toBe(0);
  });

  it("★ a link to a Settings page opens Settings on that page (the Guests room's Change who can get in)", () => {
    next.land("/dashboard/e1");
    hub(null, LINKS);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open guests" }));
    });
    const push = vi.spyOn(window.history, "pushState");
    const event = click("Change who can get in");
    expect(event.defaultPrevented).toBe(true);
    expect(shown()).toBe("settings");
    expect(pageShown()).toBe("door");
    expect(barParam("setting")).toBe("door");
    expect(routerParam("setting")).toBe("door");
    // Handed over from Guests: still one entry deep.
    expect(push).not.toHaveBeenCalled();
  });

  it("hands the room the section its link named, once", () => {
    next.land("/dashboard/e1");
    hub(null, LINKS);
    click("Manage in Guests");
    expect(shown()).toBe("guests");
    const take = screen.getByRole("button", { name: "take the anchor" });
    act(() => {
      fireEvent.click(take);
    });
    expect(take.dataset.took).toBe("invited");
    act(() => {
      fireEvent.click(take);
    });
    expect(take.dataset.took).toBe("none");
  });

  it("leaves a modified click, a new tab, another event and a page that is no room to the browser", () => {
    next.land("/dashboard/e1");
    hub(null, LINKS);
    expect(
      click("3 waiting in Review", { metaKey: true }).defaultPrevented,
    ).toBe(false);
    expect(click("Review in a tab").defaultPrevented).toBe(false);
    expect(click("Another event").defaultPrevented).toBe(false);
    expect(click("Print").defaultPrevented).toBe(false);
    expect(shown()).toBe("none");
  });

  it("asks nothing of a hub that names no event (the Library's specimens)", () => {
    next.land("/dashboard/e1");
    render(
      <NextRouterStandIn>
        <EventShareProvider initialSheet={null}>
          <Probe />
          {LINKS}
        </EventShareProvider>
      </NextRouterStandIn>,
    );
    expect(click("3 waiting in Review").defaultPrevented).toBe(false);
  });
});
