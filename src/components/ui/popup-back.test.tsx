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
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import {
  POPUP_HISTORY_MARKER,
  stepOverDeadEntries,
} from "@/components/ui/popup-back";
import { stepOutThenLeave } from "@/components/ui/popup-back-way-out";

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

/**
 * ★ A LINK INSIDE A PLACE TAKES THE PLACE'S ENTRY WITH IT (crumbs-32, from `claims-wiring`). The claims review's Open
 * album and a look's Open full profile pushed the next page on top of the place's same-URL entry, so Back from that
 * page landed on the page the place was opened over with nothing open on it, and a second Back was needed: one dead
 * Back. The place now navigates such a click by REPLACING its own entry, taking the click before the link's handler
 * (Next's `Link` does nothing with a click whose default is prevented). The browser keeps every click a `Link` would
 * leave to it. The router is a stand-in: what is pinned is the replace, and that nothing is pushed.
 */
/* eslint-disable @next/next/no-html-link-for-pages -- the anchors are what a `Link` renders, and the place's rule is
   the click's whoever drew it; a real `Link` here would need Next's running router for the clicks the place leaves to
   it (the real `Link`'s own skip is checked under `next dev`, the Handoff's walk). */
describe("a link inside a place in a hand", () => {
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  function placeWith(links: ReactNode) {
    return render(
      <AppRouterContext.Provider value={router}>
        <NextRouterStandIn>
          <Popup defaultOpen>
            <PopupContent kind="list" aria-describedby={undefined}>
              <PopupHeader title="Claims" back="Dashboard" />
              <PopupBody>{links}</PopupBody>
            </PopupContent>
          </Popup>
        </NextRouterStandIn>
      </AppRouterContext.Provider>,
    );
  }

  /** A click as a person makes it, reporting whether anything took it from the browser. */
  const press = (name: string, init: MouseEventInit = {}) => {
    const link = screen.getByRole("link", { name });
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...init,
    });
    act(() => {
      link.dispatchEvent(event);
    });
    return event.defaultPrevented;
  };

  beforeEach(() => {
    for (const fn of Object.values(router)) fn.mockClear();
  });

  it("★ navigates by replacing the place's own entry, so Back returns to the page beneath it", async () => {
    next.land("/dashboard");
    placeWith(<a href="/e/0123456789abcdef?photo=m1#top">Open album</a>);
    await tick();
    expect(marker()).toBeTruthy();
    const entries = window.history.length;

    expect(press("Open album")).toBe(true);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(
      "/e/0123456789abcdef?photo=m1#top",
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(window.history.length).toBe(entries);
  });

  it("still takes it after a refresh dropped the entry's marker (the claims review refreshes while open)", async () => {
    next.land("/dashboard");
    placeWith(<a href="/u/maya">Open full profile</a>);
    await tick();
    act(() => next.refresh());
    expect(marker()).toBeUndefined();
    expect(press("Open full profile")).toBe(true);
    expect(router.replace).toHaveBeenCalledWith("/u/maya");
  });

  it("leaves every click the browser keeps to the browser", async () => {
    next.land("/dashboard");
    placeWith(
      <>
        <a href="/u/maya">A page</a>
        <a href="/help/not-approved" target="_blank" rel="noopener">
          A new tab
        </a>
        <a href="/api/export/zip" download>
          A download
        </a>
        <a href="https://example.com/elsewhere">Another site</a>
        <a href="#section">A hash here</a>
      </>,
    );
    await tick();
    expect(press("A page", { metaKey: true })).toBe(false);
    expect(press("A page", { ctrlKey: true })).toBe(false);
    expect(press("A page", { shiftKey: true })).toBe(false);
    expect(press("A page", { button: 1 })).toBe(false);
    expect(press("A new tab")).toBe(false);
    expect(press("A download")).toBe(false);
    expect(press("Another site")).toBe(false);
    expect(press("A hash here")).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("takes nothing once a place stacked over it owns the entry on top", async () => {
    next.land("/dashboard");
    placeWith(<a href="/u/maya">Open full profile</a>);
    await tick();
    act(() => {
      window.history.pushState({ [POPUP_HISTORY_MARKER]: "popup-on-top" }, "");
    });
    expect(press("Open full profile")).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("at a desk the panel is no place, holds no entry, and its links are their own", async () => {
    setViewportWidth(1024);
    next.land("/dashboard");
    placeWith(<a href="/u/maya">Open full profile</a>);
    await tick();
    expect(marker()).toBeUndefined();
    expect(press("Open full profile")).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
/* eslint-enable @next/next/no-html-link-for-pages */

/**
 * ★ THE ENTRIES ARE A STACK, TAKEN BACK IN ITS ORDER (back-layers). Since a question over another layer holds an
 * entry (the viewer's Delete, a look's Block screen), two entries of ours go at once: the question's act closing the
 * place, or a look closing as the screen it opened takes its place. Each popup taking back its own entry by its own
 * marker left the lower one standing under the upper's marker, one dead Back. What is pinned is where the window
 * stands once it has all landed, read off the markers: the page's own entry carries none.
 */
describe("the stack of entries (back-layers)", () => {
  /** Long enough for a tick, a traversal (jsdom's takes two timers) and the next one in the stack. */
  const landed = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
  const isOpen = (name: string) =>
    document.querySelector(`[data-slot="popup-content"][data-name="${name}"]`) !== null;

  /**
   * A base place (a list, or the viewer under a look), a place over it that a press closes as it opens a question
   * (the look and its Block screen), and the question, whose act can close every layer under it.
   */
  function Layers({ base = true, look = true }: { base?: boolean; look?: boolean }) {
    const [under, setUnder] = useState(false);
    const [mid, setMid] = useState(false);
    const [asked, setAsked] = useState(false);
    return (
      <NextRouterStandIn>
        {/* Opened by a press, after the page has mounted, as a person opens them: an entry pushed on the page's
            first commit is written before Next's patch exists and carries none of its state (`next-history.ts`). */}
        <button
          type="button"
          onClick={() => {
            setUnder(base);
            setMid(look);
          }}
        >
          Open
        </button>
        <Popup open={under} onOpenChange={setUnder}>
          <PopupContent kind="list" data-name="base" aria-describedby={undefined}>
            <PopupHeader title="Base" back="Page" />
            <PopupBody>
              <button type="button" onClick={() => setMid(true)}>
                Look
              </button>
              <button type="button" onClick={() => setAsked(true)}>
                Ask from the base
              </button>
            </PopupBody>
          </PopupContent>
        </Popup>
        <Popup open={mid} onOpenChange={setMid}>
          <PopupContent kind="peek" data-name="mid" aria-describedby={undefined}>
            <PopupHeader title="Look" />
            <PopupBody>
              <button type="button" onClick={() => setAsked(true)}>
                Ask
              </button>
              <button
                type="button"
                onClick={() => {
                  setMid(false);
                  setAsked(true);
                }}
              >
                Block
              </button>
            </PopupBody>
          </PopupContent>
        </Popup>
        <Popup open={asked} onOpenChange={setAsked}>
          <PopupContent kind="confirm" data-name="question" aria-describedby={undefined}>
            <PopupHeader title="Sure?" />
            <PopupFooter>
              <button type="button" onClick={() => setAsked(false)}>
                Go back
              </button>
              <button
                type="button"
                onClick={() => {
                  setAsked(false);
                  setMid(false);
                  setUnder(false);
                }}
              >
                Do it
              </button>
            </PopupFooter>
          </PopupContent>
        </Popup>
      </NextRouterStandIn>
    );
  }
  // A layer under a modal one is hidden from the reader, never from the press.
  const press = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name, hidden: true }));

  beforeEach(landed);

  it("★ a question's act that closes every layer under it takes every entry back: the page's own entry stands", async () => {
    next.land("/dashboard");
    render(<Layers />);
    await landed();
    press("Open");
    await landed();
    press("Ask");
    await landed();
    expect(isOpen("question")).toBe(true);
    expect(marker()).toBeTruthy();

    press("Do it");
    await landed();
    await landed();
    expect(isOpen("base") || isOpen("mid") || isOpen("question")).toBe(false);
    // Each popup taking its own entry back by its own marker left the two under the question's standing: dead Backs.
    expect(marker()).toBeUndefined();
    expect(next.reloads).toBe(0);
  });

  it("★ a swap (the look closing as its Block screen opens): Back over the question steps over the look's entry too", async () => {
    next.land("/dashboard");
    render(<Layers />);
    await landed();
    press("Open");
    await landed();
    press("Block");
    await landed();
    expect(isOpen("mid")).toBe(false);
    expect(isOpen("question")).toBe(true);

    act(() => window.history.back());
    await landed();
    await landed();
    expect(isOpen("question")).toBe(false);
    expect(isOpen("base")).toBe(true);
    // The window stands on the base's own entry: the look's, under the question's, went in the same press, so the
    // next press closes the base and nothing else needs one.
    const back = vi.spyOn(window.history, "back");
    act(() => window.history.back());
    await landed();
    expect(isOpen("base")).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
    expect(marker()).toBeUndefined();
  });

  it("★ a refresh that took a place's marker leaves the place open when the question over it goes Back", async () => {
    next.land("/dashboard");
    render(<Layers base={false} />);
    await landed();
    press("Open");
    await landed();
    // The claims review's refresh as each answer lands: the place's own entry is written again without its marker.
    act(() => next.refresh());
    expect(marker()).toBeUndefined();
    press("Ask");
    await landed();
    expect(isOpen("question")).toBe(true);

    press("Go back");
    await landed();
    expect(isOpen("question")).toBe(false);
    // Read by each popup against its own marker, this landing on the stripped entry read as the place's own Back.
    expect(isOpen("mid")).toBe(true);
  });

  it("★ a push waits for a Back of ours still on its way, which would otherwise take the new entry", async () => {
    next.land("/dashboard");
    render(<Layers look={false} />);
    await landed();
    press("Open");
    await landed();
    const base = marker();
    expect(base).toBeTruthy();
    press("Look");
    await landed();
    expect(marker()).not.toBe(base);

    // The look's own X: a tick later its Back starts, and the question opens before that Back has landed.
    press("Close");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    press("Ask from the base");
    expect(isOpen("question")).toBe(true);
    await landed();
    await landed();
    // Pushed at once, the question's entry was the one that Back took, and the question closed as it opened.
    expect(isOpen("question")).toBe(true);
    expect(isOpen("mid")).toBe(false);
    expect(marker()).toBeTruthy();
    expect(marker()).not.toBe(base);
  });
});

/**
 * ★ A RELOAD STRANDS NO ENTRY (back-layers; crumbs-47). A reload keeps an open place's entry and its marker and
 * forgets the place, so one Back landed on the same page and closed nothing. A marker this page life never wrote is
 * such an entry: the first popup hook to mount steps Back over it, and over every dead one under it.
 */
describe("a reload's dead entry (back-layers)", () => {
  const settled = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
  const closedPlace = () =>
    render(
      <NextRouterStandIn>
        <Popup>
          <PopupTrigger>Open</PopupTrigger>
          <PopupContent kind="list" aria-describedby={undefined}>
            <PopupHeader title="Claims" back="Dashboard" />
          </PopupContent>
        </Popup>
      </NextRouterStandIn>,
    );

  beforeEach(settled);

  it("★ is stepped over when a popup mounts, so the window stands on the page's own entry", async () => {
    next.land("/dashboard");
    // What a reload leaves: the place's entry, its marker from the page life before.
    act(() => {
      window.history.pushState({ [POPUP_HISTORY_MARKER]: "prPopup-before-the-reload" }, "");
    });
    const back = vi.spyOn(window.history, "back");
    closedPlace();
    await settled();
    expect(back).toHaveBeenCalledTimes(1);
    expect(marker()).toBeUndefined();
    expect(next.reloads).toBe(0);
  });

  it("and every dead one under it, a landing at a time", async () => {
    next.land("/dashboard");
    act(() => {
      window.history.pushState({ [POPUP_HISTORY_MARKER]: "prPopup-old-1" }, "");
      window.history.pushState({ [POPUP_HISTORY_MARKER]: "prPopup-old-2" }, "");
    });
    const back = vi.spyOn(window.history, "back");
    closedPlace();
    await settled();
    await settled();
    expect(back).toHaveBeenCalledTimes(2);
    expect(marker()).toBeUndefined();
  });

  it("never steps over an entry this page life wrote", async () => {
    next.land("/dashboard");
    render(
      <NextRouterStandIn>
        <Popup defaultOpen>
          <PopupContent kind="list" aria-describedby={undefined}>
            <PopupHeader title="Claims" back="Dashboard" />
          </PopupContent>
        </Popup>
      </NextRouterStandIn>,
    );
    await settled();
    const mine = marker();
    expect(mine).toBeTruthy();
    const back = vi.spyOn(window.history, "back");
    act(() => stepOverDeadEntries());
    await settled();
    expect(back).not.toHaveBeenCalled();
    expect(marker()).toBe(mine);
  });
});

/**
 * ★ AN ENTRY WHOSE POPUP HAS GONE IS STEPPED OVER WHEN A PRESS LANDS ON IT (crumbs-83, the three ROADMAP lines back-layers
 * left). A popup whose act navigates (a server action's redirect, `router.push`) goes with its page, and its entry stayed
 * under the next page: Back from there landed on a same-address entry with nothing open, one dead Back. And Forward onto a
 * closed popup's entry read as a Back off the top entry, so it closed the popup open beneath it and stood on a dead entry.
 * The navigation is Next's own commit here (`nextPushes`: the HistoryUpdater's push of the next page, with Next's state),
 * the old page and its popups going with it, as they do in the app.
 */
describe("an entry whose popup has gone (crumbs-83)", () => {
  /** Long enough for a tick, a traversal (jsdom's takes two timers) and the step after it. */
  const landed = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
  const isOpen = (name: string) =>
    document.querySelector(`[data-slot="popup-content"][data-name="${name}"]`) !== null;
  // A layer under a modal one is hidden from the reader, never from the press.
  const press = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name, hidden: true }));
  const here = () => window.location.pathname;
  /** Next's commit of the page an act went on to: a push with its own state, which its patch lets through. */
  const nextPushes = (url: string) =>
    window.history.pushState(
      { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: url } },
      "",
      url,
    );

  /** A page with a place on it and a question over the place; either's act can go on to the next page. */
  function Site() {
    const [page, setPage] = useState<"page" | "next">("page");
    const [place, setPlace] = useState(false);
    const [asked, setAsked] = useState(false);
    const goOn = () => {
      nextPushes("/next");
      setPage("next");
    };
    return (
      <NextRouterStandIn>
        {page === "next" ? (
          <p>The next page</p>
        ) : (
          <>
            {/* Opened by a press after the page has mounted, as a person opens it (Next's patch is in by then). */}
            <button type="button" onClick={() => setPlace(true)}>
              Open
            </button>
            <Popup open={place} onOpenChange={setPlace}>
              <PopupContent kind="list" data-name="place" aria-describedby={undefined}>
                <PopupHeader title="Place" back="Page" />
                <PopupBody>
                  <button type="button" onClick={goOn}>
                    Go on
                  </button>
                  <button type="button" onClick={() => setAsked(true)}>
                    Ask
                  </button>
                </PopupBody>
              </PopupContent>
            </Popup>
            <Popup open={asked} onOpenChange={setAsked}>
              <PopupContent kind="confirm" data-name="question" aria-describedby={undefined}>
                <PopupHeader title="Sure?" />
                <PopupFooter>
                  <button type="button" onClick={() => setAsked(false)}>
                    Go back
                  </button>
                  <button type="button" onClick={goOn}>
                    Do it
                  </button>
                </PopupFooter>
              </PopupContent>
            </Popup>
          </>
        )}
      </NextRouterStandIn>
    );
  }

  beforeEach(landed);

  it("★ a place whose act goes on to another page: one Back from there returns to the page beneath, and Forward goes on again", async () => {
    next.land("/dashboard");
    render(<Site />);
    await landed();
    press("Open");
    await landed();
    expect(marker()).toBeTruthy();
    press("Go on");
    await landed();
    expect(here()).toBe("/next");

    const back = vi.spyOn(window.history, "back");
    act(() => window.history.back());
    await landed();
    await landed();
    // The old code stood here on the place's entry: the page with nothing open, and the next Back the same page again.
    expect(here()).toBe("/dashboard");
    expect(marker()).toBeUndefined();
    expect(back).toHaveBeenCalledTimes(2);

    // A Forward from the page beneath lands on that entry from below, and goes on to the page above it.
    act(() => window.history.forward());
    await landed();
    await landed();
    expect(here()).toBe("/next");
    expect(next.reloads).toBe(0);
  });

  it("★ a question over a place whose act goes on: one Back steps over both entries, to the page beneath", async () => {
    next.land("/dashboard");
    render(<Site />);
    await landed();
    press("Open");
    await landed();
    press("Ask");
    await landed();
    expect(isOpen("question")).toBe(true);
    press("Do it");
    await landed();
    await landed();
    expect(here()).toBe("/next");

    const back = vi.spyOn(window.history, "back");
    act(() => window.history.back());
    await landed();
    await landed();
    await landed();
    expect(here()).toBe("/dashboard");
    expect(marker()).toBeUndefined();
    // The person's press, and one step over each entry its popups left.
    expect(back).toHaveBeenCalledTimes(3);
    expect(next.reloads).toBe(0);
  });

  it("★ Forward onto a closed popup's entry leaves the popup beneath it open: the Forward is undone", async () => {
    next.land("/dashboard");
    render(<Site />);
    await landed();
    press("Open");
    await landed();
    const placeEntry = marker();
    press("Ask");
    await landed();
    expect(marker()).not.toBe(placeEntry);

    // The phone's Back closes the question, and the window stands on the place's entry.
    act(() => window.history.back());
    await landed();
    expect(isOpen("question")).toBe(false);
    expect(marker()).toBe(placeEntry);

    act(() => window.history.forward());
    await landed();
    await landed();
    // The old code read the landing as a Back off the place's entry, and closed the place.
    expect(isOpen("place")).toBe(true);
    expect(isOpen("question")).toBe(false);
    expect(marker()).toBe(placeEntry);

    // And the place's Back is still one press away.
    act(() => window.history.back());
    await landed();
    expect(isOpen("place")).toBe(false);
    expect(marker()).toBeUndefined();
  });

  it("Forward onto a closed place's entry over the bare page is undone too: nothing opens, and the page's entry stands", async () => {
    next.land("/dashboard");
    render(<Site />);
    await landed();
    press("Open");
    await landed();
    act(() => window.history.back());
    await landed();
    expect(isOpen("place")).toBe(false);
    expect(marker()).toBeUndefined();

    act(() => window.history.forward());
    await landed();
    await landed();
    // The old code stood on the closed place's entry, so the next Back landed on the same page again.
    expect(marker()).toBeUndefined();
    expect(isOpen("place")).toBe(false);
  });

  it("★ the way out's own Back over the entries closes nothing, and forgets each one it steps over", async () => {
    next.land("/dashboard");
    render(<Site />);
    await landed();
    press("Open");
    await landed();
    press("Ask");
    await landed();
    const leave = vi.fn();
    act(() => stepOutThenLeave(2, leave));
    await landed();
    await landed();
    expect(leave).toHaveBeenCalledTimes(1);
    expect(marker()).toBeUndefined();
    // Both stand drawn as the page leaves: the strip's "Opening…" is still on screen.
    expect(isOpen("place")).toBe(true);
    expect(isOpen("question")).toBe(true);

    // Nothing of theirs is left to take back: a page that never left closes them with no Back at all.
    const back = vi.spyOn(window.history, "back");
    press("Go back");
    await landed();
    expect(isOpen("question")).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });
});
