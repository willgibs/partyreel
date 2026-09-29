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
  } = useEventShare();
  return (
    <div>
      <p data-testid="sheet">{sheet ?? "none"}</p>
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

function hub(initialSheet: "settings" | "share" | null) {
  return render(
    <NextRouterStandIn>
      <EventShareProvider initialSheet={initialSheet}>
        <Probe />
      </EventShareProvider>
    </NextRouterStandIn>,
  );
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
