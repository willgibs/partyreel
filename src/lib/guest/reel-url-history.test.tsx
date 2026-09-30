/**
 * THE REEL'S ENTRY IS OURS THROUGH A REFRESH, A RELOAD AND A DOUBLE TAP (crumbs-19).
 *
 * `?reel` opens the full-screen view by PUSHING an entry, so a phone's back gesture closes it, and closing an
 * entry this page pushed goes BACK to the album beneath it; a view opened from a deep link has no album entry
 * beneath it, so closing that one replaces the address in place (closing a reel must never navigate off the
 * page). What said "this entry is ours" was a field on the entry's own state, and a `router.refresh()` writes
 * the entry again with Next's state alone, so after one the close replaced in place and left the album's
 * address twice in the stack, a dead Back (measured on the demo album under `next dev`: opened at entry 6,
 * refreshed, state `[__NA, tree]`, Close, still 7 entries). The page now keeps its own word too and gives the
 * entry its field back (`lib/history-entry.ts`, which has its own test), so the close is right after a refresh,
 * after a reload, and after the two in either order.
 *
 * And a close asked twice before the first Back lands used to call `history.back()` twice and leave the album
 * (measured on the demo album: two same-tick clicks on the view's Close took the tab to the page before it).
 *
 * The pure half of this module (`readReelParam`, `withReelParam`) is `reel-url.test.ts`, the node project's;
 * this is the hook, against `@/lib/test-utils/next-history`, the stand-in that is Next's patch (a fresh state
 * gets Next's `__NA`, a state that carries it applies no URL, a refresh drops the entry's custom state).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReelParam } from "@/lib/guest/reel-url";
import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

let next: NextHistory;

beforeEach(() => {
  next = installNextHistory();
});

afterEach(() => {
  next.uninstall();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

function Reel({ owner = false }: { owner?: boolean }) {
  const { mode, open, close } = useReelParam();
  return (
    <div>
      <p data-testid="mode">{mode ?? "none"}</p>
      <button type="button" onClick={() => open("hand")}>
        open
      </button>
      <button type="button" onClick={() => open("screen")}>
        screen
      </button>
      <button type="button" onClick={() => close({ returnBack: owner })}>
        close
      </button>
    </div>
  );
}

const tree = (owner = false) => (
  <NextRouterStandIn>
    <Reel owner={owner} />
  </NextRouterStandIn>
);
const mount = (owner = false) => render(tree(owner));

const mode = () => screen.getByTestId("mode").textContent;
const press = (name: string) =>
  act(() => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
/** A close that goes Back: its popstate lands after the click, so wait for it (bounded, so a close that never goes Back fails on its own assertion). */
const pressAndWaitForPopstate = (name: string, times = 1) =>
  act(async () => {
    const landed = new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
    });
    for (let i = 0; i < times; i += 1) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    await Promise.race([landed, new Promise((r) => setTimeout(r, 2000))]);
    // A second Back, if one was called, lands a beat after the first.
    await new Promise((r) => setTimeout(r, 60));
  });
const ourKey = () =>
  (window.history.state as Record<string, unknown> | null)?.prReelPushed;

/** A page before the album, so a Back that is not ours has somewhere to take the reader. */
function landOnAlbum(search = "") {
  next.land("/elsewhere");
  window.history.pushState(null, "", "/e/tok");
  next.land(`/e/tok${search}`);
}

describe("a reel this page opened", () => {
  it("pushes one entry marked ours, and the close goes Back to the album", async () => {
    landOnAlbum();
    mount();
    const before = window.history.length;
    press("open");
    expect(mode()).toBe("hand");
    expect(window.location.search).toBe("?reel");
    expect(window.history.length).toBe(before + 1);
    expect(ourKey()).toBeTruthy();
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(mode()).toBe("none");
    // Next never reloaded the page for the entry we pushed.
    expect(next.reloads).toBe(0);
  });

  it("★ closes by going Back after a router refresh took the key off the entry", async () => {
    landOnAlbum();
    mount();
    press("open");
    // The refresh a settings action or a door's pass makes: the entry is written again without the key.
    act(() => next.refresh());
    expect(ourKey()).toBeUndefined();
    const back = vi.spyOn(window.history, "back");
    const depth = window.history.length;
    await pressAndWaitForPopstate("close");
    // The old code replaced in place here and left the album's address in the stack twice.
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/e/tok");
    expect(window.history.length).toBe(depth);
    expect(mode()).toBe("none");
  });

  it("★ and after a refresh and then a reload: the key is given back to the entry, so the new page finds it ours", async () => {
    landOnAlbum();
    const first = mount();
    press("open");
    act(() => next.refresh());
    expect(ourKey()).toBeUndefined();
    // The page re-renders with the refresh's answer, as the album does, and the entry is given its key back.
    first.rerender(tree());
    expect(ourKey()).toBeTruthy();
    // A reload: the page is gone and a new one reads the entry, which kept its key.
    first.unmount();
    mount();
    expect(mode()).toBe("hand");
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("★ and after a reload and then a refresh: the new page took the key as its own, and the refresh cannot take that", async () => {
    landOnAlbum();
    const first = mount();
    press("open");
    first.unmount();
    const second = mount();
    act(() => next.refresh());
    expect(ourKey()).toBeUndefined();
    second.rerender(tree());
    expect(ourKey()).toBeTruthy();
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("moves between postures inside its one entry, keeping the key", async () => {
    landOnAlbum();
    mount();
    press("open");
    const depth = window.history.length;
    press("screen");
    expect(mode()).toBe("screen");
    expect(window.location.search).toBe("?reel=screen");
    expect(window.history.length).toBe(depth);
    expect(ourKey()).toBeTruthy();
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("comes back with a Forward, and that entry is still ours to close", async () => {
    landOnAlbum();
    mount();
    press("open");
    // The phone's Back closes it (the address leaves the parameter behind), and Forward opens it again.
    await act(async () => {
      window.history.back();
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(mode()).toBe("none");
    await act(async () => {
      window.history.forward();
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(mode()).toBe("hand");
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });
});

describe("a reel opened from a deep link", () => {
  it("is closed in place, gains no key, and never goes Back off the page", () => {
    landOnAlbum("?reel");
    mount();
    expect(mode()).toBe("hand");
    expect(ourKey()).toBeUndefined();
    const back = vi.spyOn(window.history, "back");
    const depth = window.history.length;
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.history.length).toBe(depth);
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/e/tok");
    expect(mode()).toBe("none");
  });

  it("stays without a key through a refresh and a re-render, and through a change of posture", () => {
    landOnAlbum("?reel");
    const view = mount();
    act(() => next.refresh());
    view.rerender(tree());
    expect(ourKey()).toBeUndefined();
    press("screen");
    expect(ourKey()).toBeFalsy();
    const back = vi.spyOn(window.history, "back");
    press("close");
    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("the owner's Close goes back to where they came from, since there is somewhere to go", async () => {
    landOnAlbum("?reel");
    mount(true);
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close");
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/elsewhere");
  });
});

describe("a close asked twice", () => {
  it("★ goes Back once, so the album stays the page it was", async () => {
    landOnAlbum();
    mount();
    press("open");
    const back = vi.spyOn(window.history, "back");
    // Two taps on the view's Close before the first Back's popstate lands.
    await pressAndWaitForPopstate("close", 2);
    // The old code called it twice and stood on /elsewhere.
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/e/tok");
    expect(window.location.search).toBe("");
    expect(mode()).toBe("none");
  });

  it("★ and the owner's double tap on a deep link goes back once too", async () => {
    landOnAlbum("?reel");
    mount(true);
    const back = vi.spyOn(window.history, "back");
    await pressAndWaitForPopstate("close", 2);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("the next reel closes once again: a Back that landed leaves no closing flag behind", async () => {
    landOnAlbum();
    mount();
    for (let round = 0; round < 2; round += 1) {
      press("open");
      expect(mode()).toBe("hand");
      const back = vi.spyOn(window.history, "back");
      await pressAndWaitForPopstate("close", 2);
      expect(back).toHaveBeenCalledTimes(1);
      expect(mode()).toBe("none");
      back.mockRestore();
    }
    expect(window.location.pathname).toBe("/e/tok");
  });
});
