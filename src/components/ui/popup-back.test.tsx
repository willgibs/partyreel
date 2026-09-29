/**
 * A PHONE'S PLACE TAKES ITS HISTORY ENTRY BACK WITH IT, WHATEVER THE ROUTER DID TO THE ENTRY IN BETWEEN
 * (crumbs-18).
 *
 * A place popup in a hand holds one same-URL entry, marked with a field on its state, so the phone's Back
 * closes it and closing it any other way pops the entry back off. But `router.refresh()` is a soft
 * navigation whose commit writes the entry again with Next's own state alone, and the claims review and the
 * storage list refresh while they are open: the marker was gone by the time the popup closed, so its
 * `history.back()` was skipped and the entry stayed, one dead Back with nothing to see (driven at 375 in
 * the real router: opened at entry 4, refreshed, closed by its arrow, still standing on entry 5).
 *
 * The popup's own memory that it pushed an entry, and the address the entry stands at, answer where the
 * marker cannot. What must NOT change is the reason the check exists: a popup that goes because the page
 * navigated on (a link inside it) is not an entry to undo, or the navigation would be taken back.
 *
 * The router is `@/lib/test-utils/next-history`, the stand-in that is Next's patch: `refresh()` there
 * drops the entry's custom state as Next's does.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";
import { Popup, PopupBody, PopupContent, PopupHeader } from "@/components/ui/popup";
import { POPUP_HISTORY_MARKER } from "@/components/ui/popup-back";

import { setViewportWidth } from "../../../vitest.setup";

let next: NextHistory;

beforeEach(() => {
  next = installNextHistory();
  // A phone: the place is the whole screen, and its Back is the popup's own.
  setViewportWidth(375);
  Object.defineProperty(window, "visualViewport", {
    value: Object.assign(new EventTarget(), {
      height: 667,
      offsetTop: 0,
      width: 375,
    }),
    configurable: true,
  });
});

afterEach(() => {
  next.uninstall();
  vi.restoreAllMocks();
  setViewportWidth(1024);
  window.history.replaceState(null, "", "/");
});

function place() {
  return render(
    <NextRouterStandIn>
      <Popup defaultOpen>
        <PopupContent kind="list" aria-describedby={undefined}>
          <PopupHeader title="Claims" back="Dashboard" />
          <PopupBody>
            <p>The list</p>
          </PopupBody>
        </PopupContent>
      </Popup>
    </NextRouterStandIn>,
  );
}

const marker = () =>
  (window.history.state as Record<string, unknown> | null)?.[
    POPUP_HISTORY_MARKER
  ];
const panel = () =>
  document.querySelector<HTMLElement>('[data-slot="popup-content"]');
/** Past the one tick the popup waits before taking its entry back. */
const tick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

describe("a place in a hand, after the router refreshed while it was open", () => {
  it("★ closed by its own arrow, it still takes its entry back", async () => {
    next.land("/dashboard");
    place();
    await tick();
    expect(marker()).toBeTruthy();
    // The refresh a list makes as each answer lands: the entry is written again without the marker.
    act(() => next.refresh());
    expect(marker()).toBeUndefined();

    const back = vi.spyOn(window.history, "back");
    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    await tick();
    // The old code skipped this call and left the entry standing.
    expect(back).toHaveBeenCalledTimes(1);
    expect(next.reloads).toBe(0);
  });

  it("the phone's own Back still closes it, and nothing more is taken back", async () => {
    next.land("/dashboard");
    place();
    await tick();
    act(() => next.refresh());
    expect(marker()).toBeUndefined();

    const back = vi.spyOn(window.history, "back");
    act(() => window.history.back());
    await tick();
    // Only the phone's own press: the popup closed on the popstate and made no second call.
    expect(back).toHaveBeenCalledTimes(1);
    expect(panel()?.getAttribute("data-state")).not.toBe("open");
  });

  it("★ a popup that goes because the page navigated on does not undo the navigation", async () => {
    next.land("/dashboard");
    const view = place();
    await tick();
    act(() => next.refresh());
    expect(marker()).toBeUndefined();

    // A link inside the popup: Next pushes the new page's entry (its own state, so the patch lets it
    // through), and the old page's popup goes with it.
    const back = vi.spyOn(window.history, "back");
    act(() => {
      window.history.pushState(
        { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "elsewhere" } },
        "",
        "/dashboard/e1",
      );
      view.unmount();
    });
    await tick();
    expect(back).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/dashboard/e1");
  });

  it("a popup that goes because another entry is on top of it does not take that one back", async () => {
    next.land("/dashboard");
    const view = place();
    await tick();
    expect(marker()).toBeTruthy();

    // Something else (a second place, a reel) pushed its own marked entry on the same address.
    const back = vi.spyOn(window.history, "back");
    act(() => {
      window.history.pushState({ [POPUP_HISTORY_MARKER]: "popup-elsewhere" }, "");
      view.unmount();
    });
    await tick();
    expect(back).not.toHaveBeenCalled();
  });
});
