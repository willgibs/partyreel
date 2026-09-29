/**
 * NEXT'S HISTORY PATCH AND ITS OWN COPY OF THE ADDRESS, AS A STAND-IN FOR A TEST (crumbs-16: build 23's
 * red-team, a Settings row that never opened its page).
 *
 * The App Router patches `window.history.pushState` and `replaceState` so a native call reaches
 * `useSearchParams` and `usePathname` (`node_modules/next/dist/client/components/app-router.js`, the
 * effect in `Router` that assigns them). The patch has TWO faces, and a stand-in that fires its
 * listeners on every call, as this repo's first one did, shows only the first:
 *
 *   - handed an object WITHOUT `__NA` or `_N` (a fresh state, `null`): Next copies its own `__NA` and its
 *     internals tree onto it, tells the router the new URL, then makes the native call;
 *   - handed one that HAS them (which is what `window.history.state` is on any entry Next has touched):
 *     Next takes the call for its own bookkeeping ("avoid a loop when Next.js internals trigger
 *     pushState/replaceState") and makes the native call alone. The URL bar changes; the router's copy
 *     does not, so `useSearchParams` never moves.
 *
 * And the router writes its OWN copy of the address back over the bar on every commit (`HistoryUpdater`:
 * `replaceState(historyState, "", canonicalUrl)`), so a copy that never heard of a change puts the old
 * address back on the next `router.refresh()`. That commit also decides what the entry's own state
 * becomes: a restore (what an applied URL dispatches, and a Back) keeps the custom state on it
 * (`preserveCustomHistoryState: true`), a refresh does not, so a marker a component keeps on its entry
 * is gone after a `router.refresh()` (measured under `next dev`).
 *
 * And WHEN the patch exists is part of the shape. Next installs it in a passive effect of the Router,
 * the root of the client tree, and React runs a child's effect before its parent's: a write from a
 * component's mount effect on the page's first commit reaches the browser's OWN `replaceState`, where a
 * fresh state replaces the entry's `__NA` and tree (a later Back onto it is ignored by Next) and Next
 * never hears the URL. `NextRouterStandIn` is a parent whose effect installs the patch, so a component
 * rendered inside it meets the same order; a write made a microtask late (which runs after the whole
 * flush of the commit's effects) meets the patch.
 *
 * This models exactly that and nothing more: the patch, when it exists, the router's copy of the
 * address, the commit's two kinds, and the popstate handler (`if (!event.state.__NA)
 * window.location.reload()`, counted here rather than run). `next-history.test.tsx` reads Next's own
 * file and fails when the patch it ports has changed, so a Next upgrade cannot leave a stand-in
 * modelling a Next that is gone. What no stand-in can prove is Next itself: a change to a call that
 * touches this is checked under `next dev` as well.
 *
 * Use it from a test that mocks `next/navigation` with `nextNavigation` (a `vi.mock` factory may import
 * it), calls `installNextHistory()` in `beforeEach` and renders what it tests inside
 * `<NextRouterStandIn>`.
 */
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/** The key Next keeps its router tree under on every entry it has written. */
const TREE = "__PRIVATE_NEXTJS_INTERNALS_TREE";

type State = Record<string, unknown>;

export type NextHistory = {
  /** Install the patch, as the Router's effect does. `<NextRouterStandIn>` calls it; a test with no tree may too. Idempotent. */
  patch(): void;
  /** How many times Next's popstate handler would have reloaded the page: it does for a state with no `__NA`. */
  readonly reloads: number;
  /** Next's own copy of the address (path, query and hash): what its hooks answer, and what a commit writes to the bar. */
  readonly href: string;
  /** A fresh entry at `url`, as Next leaves one on hydration (`__NA` and the tree), the router knowing it. */
  land(url: string): void;
  /** `router.refresh()`: Next commits with no address change, writes its own copy to the bar and DROPS the entry's custom state. */
  refresh(): void;
  /** Take the patch off (the history's own functions back, the popstate handler gone). Idempotent. */
  uninstall(): void;
};

// One router per test file (each file gets its own module registry): the hooks below read it.
const listeners = new Set<() => void>();
let routerHref = "/";

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const tell = () => {
  for (const listener of listeners) listener();
};
const currentUrl = () => new URL(routerHref, "http://localhost");

/** The router's `useSearchParams`: Next's copy of the query, never `window.location`. */
function useSearchParams() {
  const search = useSyncExternalStore(
    subscribe,
    () => currentUrl().search,
    () => currentUrl().search,
  );
  return new URLSearchParams(search);
}

/** The router's `usePathname`. */
function usePathname() {
  return useSyncExternalStore(
    subscribe,
    () => currentUrl().pathname,
    () => currentUrl().pathname,
  );
}

/** The two hooks a `vi.mock("next/navigation", ...)` factory hands a component under test. */
export const nextNavigation = { useSearchParams, usePathname };

/** The model the test installed: `<NextRouterStandIn>` patches it in its effect. */
let installed: NextHistory | null = null;

export function installNextHistory(): NextHistory {
  const nativePush = window.history.pushState.bind(window.history);
  const nativeReplace = window.history.replaceState.bind(window.history);
  let reloads = 0;
  let patchedIn = false;

  const hrefOf = (url: string | URL) => {
    const next = new URL(url, window.location.href);
    return `${next.pathname}${next.search}${next.hash}`;
  };

  /** `copyNextJsInternalHistoryState`: its `__NA` and tree, copied from the entry being left onto the object handed in. */
  const copyInternals = (data: State | null | undefined): State => {
    const out = data ?? {};
    const current = window.history.state as State | null;
    if (current?.__NA) out.__NA = current.__NA;
    if (current?.[TREE]) out[TREE] = current[TREE];
    return out;
  };

  /** `applyUrlFromHistoryPushReplace`: the router hears of the URL, resolved against the address before the write. */
  const applyUrl = (url: string | URL) => {
    routerHref = hrefOf(url);
    tell();
  };

  const patched =
    (native: typeof nativePush) =>
    (data: unknown, unused: string, url?: string | URL | null) => {
      const state = data as State | null | undefined;
      // Avoid a loop when Next.js internals trigger pushState/replaceState
      if (state?.__NA || state?._N) return native(data, unused, url);
      const copied = copyInternals(state);
      if (url) applyUrl(url);
      return native(copied, unused, url);
    };

  /** Next's `onPopState`. */
  const onPopState = (event: PopStateEvent) => {
    const state = event.state as State | null;
    // Only when pushState/replaceState was called outside Next.js: it does nothing.
    if (!state) return;
    // The entry was pushed by the pages router (or by nobody who kept `__NA`): a hard reload.
    if (!state.__NA) {
      reloads += 1;
      return;
    }
    // dispatchTraverseAction(window.location.href, ...): the router follows the bar.
    applyUrl(window.location.href);
  };

  routerHref = hrefOf(window.location.href);

  const model: NextHistory = {
    patch() {
      if (patchedIn) return;
      patchedIn = true;
      window.history.pushState = patched(nativePush);
      window.history.replaceState = patched(nativeReplace);
      window.addEventListener("popstate", onPopState);
    },
    get reloads() {
      return reloads;
    },
    get href() {
      return routerHref;
    },
    land(url) {
      nativeReplace({ __NA: true, [TREE]: { tree: "landed" } }, "", url);
      routerHref = hrefOf(url);
      tell();
    },
    refresh() {
      // HistoryUpdater with `preserveCustomHistoryState: false`: the entry keeps `__NA` and the tree alone.
      nativeReplace(
        { __NA: true, [TREE]: { tree: "refreshed" } },
        "",
        routerHref,
      );
    },
    uninstall() {
      patchedIn = false;
      window.history.pushState = nativePush;
      window.history.replaceState = nativeReplace;
      window.removeEventListener("popstate", onPopState);
    },
  };
  installed = model;
  return model;
}

/**
 * The Router, as far as history goes: a parent whose passive effect installs the patch. Everything
 * rendered inside it has its own mount effects run FIRST, as under Next, so a component that writes
 * the address on its first commit is tested against the browser's own `replaceState`, which is where
 * it goes wrong.
 */
export function NextRouterStandIn({ children }: { children: ReactNode }) {
  useEffect(() => {
    const model = installed;
    model?.patch();
    return () => model?.uninstall();
  }, []);
  return children;
}
