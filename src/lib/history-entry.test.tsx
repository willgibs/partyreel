/**
 * AN ENTRY A PLACE PUSHED, AND HOW ITS PAGE KNOWS IT LATER (crumbs-19: the one helper the hub's sheets, a
 * phone's popup and the reel stand on; each has its own behavior test, this is the helper's contract).
 *
 * What is pinned is what each of the three found the hard way, once, here:
 *   - a write hands Next a FRESH state carrying only our key (an entry Next would take for its own applies no
 *     URL, and Next's popstate handler reloads an entry without its `__NA`);
 *   - a router refresh writes the entry again with Next's own state alone, so the key is gone while the place is
 *     open, and the page's own word and `keep` are what keep the entry ours (a reload keeps the key and forgets
 *     the page, so the two in either order used to leave neither);
 *   - a close asked twice before the first Back lands goes Back once;
 *   - a popup's kind (`many`) is ours by id, and by address where a refresh took the key.
 *
 * The router is `@/lib/test-utils/next-history`, the stand-in that is Next's patch.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { act, render } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnedEntry, useOwnedEntry } from "@/lib/history-entry";
import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

let next: NextHistory;

beforeEach(() => {
  next = installNextHistory();
  next.patch();
});

afterEach(() => {
  next.uninstall();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

const KEY = "prTestPlace";
const keyOnEntry = () =>
  (window.history.state as Record<string, unknown> | null)?.[KEY];
/** A traversal's popstate lands a beat after the call. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
  });

/** A page before the place, so a Back that is not ours has somewhere to take the reader. */
function landOnPage(url = "/page") {
  next.land("/before");
  window.history.pushState(null, "", url);
  next.land(url);
}

describe("push", () => {
  it("hands Next a fresh state with our key as a field, and the router hears the address", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    const depth = window.history.length;
    entry.push("/page?open");
    expect(window.history.length).toBe(depth + 1);
    expect(keyOnEntry()).toBeTruthy();
    // Next copied its own internals onto it, or its popstate handler would reload the page for this entry.
    expect((window.history.state as Record<string, unknown>).__NA).toBe(true);
    expect(next.href).toBe("/page?open");
    expect(entry.isOurs()).toBe(true);
  });

  it("with no address it keeps the address, and the router hears of nothing", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY, { many: true });
    const push = vi.spyOn(window.history, "pushState");
    entry.push();
    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({ [KEY]: expect.any(String) }),
      "",
    );
    expect(window.location.pathname).toBe("/page");
    expect(next.href).toBe("/page");
    expect(keyOnEntry()).toBeTruthy();
  });

  it("a Back onto the entry beneath is not a reload for Next", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    entry.back();
    await settle();
    expect(window.location.search).toBe("");
    expect(next.reloads).toBe(0);
  });
});

describe("whose the entry is, after a refresh and a reload", () => {
  it("a router refresh takes the key, and the page's own word keeps the entry ours", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    act(() => next.refresh());
    expect(keyOnEntry()).toBeUndefined();
    expect(entry.isOurs()).toBe(true);
  });

  it("`keep` gives an entry this page pushed its key back, with no address, so nothing re-renders", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    act(() => next.refresh());
    const replace = vi.spyOn(window.history, "replaceState");
    const depth = window.history.length;
    entry.keep(true);
    expect(keyOnEntry()).toBeTruthy();
    expect(window.history.length).toBe(depth);
    // One write, and it carries no address: the router was told of no URL.
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]).toHaveLength(2);
    expect(next.href).toBe("/page?open");
  });

  it("★ a reload keeps the key and forgets the page: a new page adopts it, so a refresh cannot leave neither", async () => {
    landOnPage();
    createOwnedEntry(KEY).push("/page?open");
    // The page is gone; a new one reads the entry, which kept its key.
    const later = createOwnedEntry(KEY);
    expect(later.held()).toBe(false);
    // By the key alone it is ours even before the page has looked (a close in the first frame).
    expect(later.isOurs()).toBe(true);
    later.keep(true);
    expect(later.held()).toBe(true);
    act(() => next.refresh());
    expect(keyOnEntry()).toBeUndefined();
    // Adopted, so the refresh took only the key: it is still ours, and `keep` gives the key back.
    expect(later.isOurs()).toBe(true);
    later.keep(true);
    expect(keyOnEntry()).toBeTruthy();
    later.close("/page");
    await settle();
    expect(window.location.search).toBe("");
    expect(next.reloads).toBe(0);
  });

  it("★ a refresh and then a reload: the key was given back, so the new page finds it", () => {
    landOnPage();
    const first = createOwnedEntry(KEY);
    first.push("/page?open");
    act(() => next.refresh());
    first.keep(true);
    const later = createOwnedEntry(KEY);
    expect(later.isOurs()).toBe(true);
  });

  it("an entry this page never pushed is never given a key (a bookmark, a shared link)", () => {
    next.land("/page?open");
    const entry = createOwnedEntry(KEY);
    entry.keep(true);
    act(() => next.refresh());
    entry.keep(true);
    expect(keyOnEntry()).toBeUndefined();
    expect(entry.isOurs()).toBe(false);
    expect(entry.held()).toBe(false);
  });

  it("`keep(false)` forgets the entry", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    entry.keep(false);
    expect(entry.held()).toBe(false);
    act(() => next.refresh());
    // No word of its own and no key: what a closed place's page knows.
    expect(entry.isOurs()).toBe(false);
  });

  it("adopts the key of another entry of the kind it is Forwarded or Backed onto", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?a");
    const first = keyOnEntry();
    entry.push("/page?b");
    const second = keyOnEntry();
    expect(second).not.toBe(first);
    window.history.back();
    await settle();
    entry.keep(true);
    // Standing on the first entry again: its key is the one it adopted.
    act(() => next.refresh());
    entry.keep(true);
    expect(keyOnEntry()).toBe(first);
  });
});

describe("replace", () => {
  it("keeps the key exactly when the entry is ours, and the router hears the address", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    const key = keyOnEntry();
    const depth = window.history.length;
    entry.replace("/page?open&page=door");
    expect(keyOnEntry()).toBe(key);
    expect(window.history.length).toBe(depth);
    expect(next.href).toBe("/page?open&page=door");
  });

  it("hands a state with no key to an entry that is not ours, and gives it none", () => {
    next.land("/page?open");
    const entry = createOwnedEntry(KEY);
    entry.replace("/page");
    expect(keyOnEntry()).toBeUndefined();
    expect(next.href).toBe("/page");
  });

  it("keeps the key through a refresh that took it: the page's own word says the entry is ours", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    act(() => next.refresh());
    entry.replace("/page?open&page=door");
    expect(keyOnEntry()).toBeTruthy();
  });
});

describe("close", () => {
  it("goes Back when the entry is ours, and says so", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    const back = vi.spyOn(window.history, "back");
    expect(entry.close("/page")).toBe(true);
    await settle();
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(entry.held()).toBe(false);
  });

  it("replaces the address in place when it is not, and says so", () => {
    next.land("/page?open");
    const entry = createOwnedEntry(KEY);
    const back = vi.spyOn(window.history, "back");
    const depth = window.history.length;
    expect(entry.close("/page")).toBe(false);
    expect(back).not.toHaveBeenCalled();
    expect(window.history.length).toBe(depth);
    expect(window.location.search).toBe("");
    expect(next.href).toBe("/page");
  });

  it("goes Back on the caller's word where the entry is not ours (the owner's reel: somewhere to return to)", async () => {
    landOnPage("/page?open");
    const entry = createOwnedEntry(KEY);
    const back = vi.spyOn(window.history, "back");
    expect(entry.close("/page", { back: true })).toBe(true);
    await settle();
    expect(back).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/before");
  });

  it("★ asked twice before the first Back lands, goes Back once", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    const back = vi.spyOn(window.history, "back");
    entry.close("/page");
    entry.close("/page");
    entry.back();
    await settle();
    expect(back).toHaveBeenCalledTimes(1);
    // The page the place was opened on, never the one before it.
    expect(window.location.pathname).toBe("/page");
    expect(window.location.search).toBe("");
  });

  it("★ asked twice after a refresh took the key, goes Back once and does not also replace the address in place", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    act(() => next.refresh());
    expect(keyOnEntry()).toBeUndefined();
    const back = vi.spyOn(window.history, "back");
    const replace = vi.spyOn(window.history, "replaceState");
    // The first close forgot the entry (its Back is on its way), and the entry no longer carries a key
    // to say it is ours: the second must not read that as a bookmark's and rewrite the address under the Back.
    entry.close("/page");
    entry.close("/page");
    await settle();
    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/page");
    expect(window.location.search).toBe("");
  });

  it("★ lets go of the flag when the Back has landed, so the next place closes", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    const back = vi.spyOn(window.history, "back");
    for (let round = 0; round < 3; round += 1) {
      entry.push("/page?open");
      entry.close("/page");
      entry.close("/page");
      await settle();
      expect(window.location.search).toBe("");
    }
    expect(back).toHaveBeenCalledTimes(3);
    expect(window.location.pathname).toBe("/page");
  });

  it("★ and after a floor if no popstate ever comes, so a place cannot be stranded open", () => {
    vi.useFakeTimers();
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    entry.close("/page");
    entry.close("/page");
    expect(back).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    // A place opened again meanwhile pushes afresh, and its close goes through.
    entry.push("/page?open");
    entry.close("/page");
    expect(back).toHaveBeenCalledTimes(2);
  });

  it("a new push lets go of a Back still in flight", () => {
    vi.useFakeTimers();
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?a");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    entry.close("/page");
    entry.push("/page?b");
    entry.close("/page");
    expect(back).toHaveBeenCalledTimes(2);
  });

  it("`keep(false)` lets go of a Back in flight (the place has closed)", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY);
    entry.push("/page?open");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    entry.close("/page");
    entry.keep(false);
    entry.push("/page?open");
    entry.close("/page");
    expect(back).toHaveBeenCalledTimes(2);
  });
});

describe("a kind that stands many at a time (a phone's popups)", () => {
  it("is ours by its own id, and never by another popup's", () => {
    landOnPage();
    const first = createOwnedEntry(KEY, { many: true });
    const second = createOwnedEntry(KEY, { many: true });
    first.push();
    expect(first.isOurs()).toBe(true);
    expect(first.stands()).toBe(true);
    // Another popup pushes its own entry on the same address, over the first.
    second.push();
    expect(second.isOurs()).toBe(true);
    expect(first.isOurs()).toBe(false);
    expect(first.stands()).toBe(false);
  });

  it("★ where a refresh took the key, it is ours at the address it was pushed at, and not at another", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY, { many: true });
    entry.push();
    act(() => next.refresh());
    expect(keyOnEntry()).toBeUndefined();
    expect(entry.isOurs()).toBe(true);
    // A link inside it navigated on: a new entry, another address, no key.
    window.history.pushState(
      { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "elsewhere" } },
      "",
      "/elsewhere",
    );
    expect(entry.isOurs()).toBe(false);
  });

  it("a marker of the same key that is another entry's is not ours, whatever the address", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY, { many: true });
    entry.push();
    window.history.pushState({ [KEY]: "someone-else" }, "");
    expect(entry.isOurs()).toBe(false);
  });

  it("does not adopt a key it finds: a stale entry of the kind is nobody's to take back", () => {
    landOnPage();
    createOwnedEntry(KEY, { many: true }).push();
    const later = createOwnedEntry(KEY, { many: true });
    later.keep(true);
    expect(later.held()).toBe(false);
    expect(later.isOurs()).toBe(false);
  });

  it("holds an entry until it is let go, so an effect that runs again keeps the one it has", () => {
    landOnPage();
    const entry = createOwnedEntry(KEY, { many: true });
    expect(entry.held()).toBe(false);
    entry.push();
    expect(entry.held()).toBe(true);
    entry.forget();
    expect(entry.held()).toBe(false);
  });
});

/**
 * ★ A BACK THAT LANDS ON A PAGE WITH NO HEAD ASKS THE ROUTER FOR THE PAGE AGAIN (crumbs-26, build 27's red-team).
 * Measured under `next dev` (Next 16.2.6) on the demo album: the reel pushed `?reel`, a `router.refresh()` ran while it
 * was open, and the Back to the album (its Close, or the phone's own) emptied the page's whole head, the title, the
 * description, the viewport and the icons, until a reload; the hub's sheets met the same since crumbs-18. No stand-in
 * models Next's cache, so the loss is played here as Next plays it: the head's title goes at the traversal's commit.
 */
describe("a Back onto a page whose head Next lost", () => {
  const refresh = vi.fn();
  const TITLE = "Add photos to Partyreel Demo · Partyreel";

  function title(text = TITLE) {
    const el = document.createElement("title");
    el.textContent = text;
    document.head.append(el);
    return el;
  }
  /** What the traversal's commit does to the page it lands on when the refresh left its head empty. */
  const loseHead = () =>
    document.head.querySelectorAll("title").forEach((el) => el.remove());
  /** A MutationObserver answers in a microtask. */
  const flush = () =>
    act(async () => {
      await Promise.resolve();
    });

  beforeEach(() => {
    refresh.mockClear();
    loseHead();
  });
  afterEach(() => loseHead());

  /** The place opened at an address, a refresh while it stood, and its page's word once it has gone. */
  async function openRefreshAndLeave(
    leave: (entry: ReturnType<typeof createOwnedEntry>) => void,
  ) {
    title();
    landOnPage();
    const entry = createOwnedEntry(KEY, { refresh });
    entry.push("/page?open");
    act(() => next.refresh());
    entry.keep(true);
    leave(entry);
    await settle();
    return entry;
  }

  it("★ asks the router to render it again, once, when the place's own close went Back", async () => {
    const entry = await openRefreshAndLeave((e) => e.close("/page"));
    // The page is told the address moved and the place is closed.
    entry.keep(false);
    loseHead();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
    // Its later renders say the same and ask nothing more.
    entry.keep(false);
    title();
    loseHead();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("★ and when the phone's own Back went, with nothing of the place's run first", async () => {
    const entry = await openRefreshAndLeave(() => window.history.back());
    entry.keep(false);
    loseHead();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("the traversal can commit before the page hears of it: a head already gone is asked for at once", async () => {
    const entry = await openRefreshAndLeave(() => window.history.back());
    loseHead();
    entry.keep(false);
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("a Back whose page keeps its head asks nothing: Next swaps a head in one commit", async () => {
    const entry = await openRefreshAndLeave((e) => e.close("/page"));
    entry.keep(false);
    // The old title goes and the landed page's comes, in one batch.
    loseHead();
    title();
    await flush();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("a place pushed with no address (a phone's popup) never asks: the router never lagged its address", async () => {
    title();
    landOnPage();
    const entry = createOwnedEntry(KEY, { many: true, refresh });
    entry.push();
    act(() => next.refresh());
    entry.keep(true);
    entry.close("/page");
    await settle();
    entry.keep(false);
    loseHead();
    await flush();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("a page that had no head to lose asks nothing", async () => {
    landOnPage();
    const entry = createOwnedEntry(KEY, { refresh });
    entry.push("/page?open");
    entry.close("/page");
    await settle();
    entry.keep(false);
    await flush();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("listens for a while and no longer: a head that goes much later is not the Back's", async () => {
    const entry = await openRefreshAndLeave((e) => e.close("/page"));
    vi.useFakeTimers();
    entry.keep(false);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    vi.useRealTimers();
    loseHead();
    await flush();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("useOwnedEntry", () => {
  it("reads the context Next's own `useRouter` reads, so the refresh it hands on is the router's (a Next upgrade that moves it fails here)", () => {
    const navigation = readFileSync(
      createRequire(import.meta.url).resolve(
        "next/dist/client/components/navigation.js",
      ),
      "utf8",
    );
    expect(navigation).toContain(
      'require("../../shared/lib/app-router-context.shared-runtime")',
    );
    const useRouter = navigation.slice(
      navigation.indexOf("function useRouter() {"),
    );
    expect(useRouter.slice(0, 200)).toContain(
      "useContext)(_approutercontextsharedruntime.AppRouterContext)",
    );
  });

  it("★ hands the entry the router's own refresh, from the router the page stands in", async () => {
    const router = { refresh: vi.fn() } as unknown as AppRouterInstance;
    let entry: ReturnType<typeof createOwnedEntry> | null = null;
    function Probe() {
      entry = useOwnedEntry(KEY);
      return null;
    }
    render(
      <AppRouterContext.Provider value={router}>
        <NextRouterStandIn>
          <Probe />
        </NextRouterStandIn>
      </AppRouterContext.Provider>,
    );
    const el = document.createElement("title");
    el.textContent = "A page";
    document.head.append(el);
    landOnPage();
    entry!.push("/page?open");
    entry!.close("/page");
    await settle();
    entry!.keep(false);
    el.remove();
    await act(async () => {
      await Promise.resolve();
    });
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("outside a router (a test, the Library) there is nothing to ask, and nothing breaks", async () => {
    let entry: ReturnType<typeof createOwnedEntry> | null = null;
    function Probe() {
      entry = useOwnedEntry(KEY);
      return null;
    }
    render(<Probe />);
    const el = document.createElement("title");
    document.head.append(el);
    landOnPage();
    entry!.push("/page?open");
    entry!.close("/page");
    await settle();
    expect(() => {
      entry!.keep(false);
      el.remove();
    }).not.toThrow();
    await act(async () => {
      await Promise.resolve();
    });
  });

  it("is one entry for the component's life, whatever it re-renders", () => {
    const seen: unknown[] = [];
    function Probe() {
      seen.push(useOwnedEntry(KEY));
      return null;
    }
    const view = render(
      <NextRouterStandIn>
        <Probe />
      </NextRouterStandIn>,
    );
    view.rerender(
      <NextRouterStandIn>
        <Probe />
      </NextRouterStandIn>,
    );
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(new Set(seen).size).toBe(1);
  });
});
