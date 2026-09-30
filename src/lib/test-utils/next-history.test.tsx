/**
 * THE STAND-IN FOR NEXT'S HISTORY PATCH HOLDS TO THE NEXT THIS REPO SHIPS (crumbs-16).
 *
 * `next-history.ts` ports a patch and a commit rule that live inside Next's `app-router.js` and
 * segment cache. A port that no test compares with its source is a guess that ages: the first
 * stand-in fired its listeners on every call and so hid, for the whole life of the settings pages,
 * that Next ignores a call handed its own state. The first half of this file reads Next's files and
 * fails, naming the file, when the code the stand-in models is no longer there; the second half pins
 * what the stand-in does with it, so a test that leans on it is leaning on something checked.
 *
 * A failure in the first half means Next changed the patch: re-read `app-router.js`, change the
 * stand-in to match, and drive the shape under `next dev` (`window.next.router.refresh()` from the
 * console is the probe: the address bar goes back to the last URL Next heard of).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "./next-history";

const require = createRequire(import.meta.url);
const read = (specifier: string) =>
  readFileSync(require.resolve(specifier), "utf8");

/** A source holds a fact. Its own assertion, so a failure names the fact and never prints a compiled file. */
function holds(source: string, fact: string, why: string) {
  expect(
    source.includes(fact),
    `${why}: \`${fact}\` is gone from Next's source`,
  ).toBe(true);
}

/** The text of `function <name>(` up to the next top-level function: one function's body, not the file. */
function bodyOf(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} is gone from Next's source`).toBeGreaterThan(
    -1,
  );
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end === -1 ? undefined : end);
}

describe("the stand-in ports the patch Next ships", () => {
  const appRouter = read("next/dist/client/components/app-router.js");

  it("★ each patched call takes an object carrying __NA or _N for Next's own and applies no URL", () => {
    for (const [method, native] of [
      ["pushState", "originalPushState"],
      ["replaceState", "originalReplaceState"],
    ] as const) {
      const at = appRouter.indexOf(
        `window.history.${method} = function ${method}(data, _unused, url) {`,
      );
      expect(at, `the patched ${method} is gone or reshaped`).toBeGreaterThan(
        -1,
      );
      const patched = appRouter.slice(at, at + 700);
      const early = patched.indexOf("if (data?.__NA || data?._N) {");
      const copy = patched.indexOf(
        "data = copyNextJsInternalHistoryState(data);",
      );
      const apply = patched.indexOf("applyUrlFromHistoryPushReplace(url);");
      expect(
        early,
        `${method}: the early return on __NA or _N`,
      ).toBeGreaterThan(-1);
      holds(
        patched.slice(early, copy),
        `return ${native}(data, _unused, url);`,
        `${method}: the early return hands the call on untouched`,
      );
      // Order is the whole rule: the early return comes first, the copy and the URL only after it.
      expect(
        copy,
        `${method}: the copy of Next's internals, after the early return`,
      ).toBeGreaterThan(early);
      expect(
        apply,
        `${method}: the URL applied to the router, after the copy`,
      ).toBeGreaterThan(copy);
    }
  });

  it("copies exactly __NA and the internals tree from the entry being left", () => {
    const copy = bodyOf(appRouter, "copyNextJsInternalHistoryState");
    holds(copy, "currentState?.__NA", "the copy reads __NA");
    holds(copy, "data.__NA = __NA", "the copy writes __NA");
    holds(
      copy,
      "currentState?.__PRIVATE_NEXTJS_INTERNALS_TREE",
      "the copy reads the tree",
    );
    holds(
      copy,
      "if (data == null) data = {}",
      "a null state becomes a fresh object",
    );
  });

  it("reads the URL to apply against the address before the write, and reloads a state with no __NA on popstate", () => {
    const apply = appRouter.slice(
      appRouter.indexOf("const applyUrlFromHistoryPushReplace"),
    );
    holds(
      apply,
      "const href = window.location.href;",
      "the URL is resolved against the address before the write",
    );
    holds(
      apply,
      "url: new URL(url ?? href, href)",
      "the router hears the resolved URL",
    );
    holds(
      appRouter,
      "if (!event.state) {",
      "popstate ignores an entry with no state",
    );
    holds(
      appRouter,
      "if (!event.state.__NA) {",
      "popstate reloads an entry with no __NA",
    );
    holds(appRouter, "window.location.reload();", "popstate reloads");
  });

  it("★ a commit keeps an entry's custom state only when the update asks for it: a refresh does not, a restore does", () => {
    // HistoryUpdater spreads the entry's state under `__NA` and the tree only when the update says so...
    holds(
      appRouter,
      "...pushRef.preserveCustomHistoryState ? window.history.state : {}",
      "the commit's rule for the entry's custom state",
    );
    const navigation = read(
      "next/dist/client/components/segment-cache/navigation.js",
    );
    // ...`router.refresh()` is a soft navigation (a replace), which does not...
    holds(
      bodyOf(navigation, "completeSoftNavigation"),
      "preserveCustomHistoryState: false",
      "a soft navigation drops the custom state",
    );
    const refresh = read(
      "next/dist/client/components/router-reducer/reducers/refresh-reducer.js",
    );
    holds(refresh, "const navigateType = 'replace';", "a refresh is a replace");
    holds(
      refresh,
      "navigateToKnownRoute",
      "a refresh is a navigation to the known route",
    );
    // ...and the restore an applied URL dispatches, like a Back, does.
    holds(
      bodyOf(navigation, "completeTraverseNavigation"),
      "preserveCustomHistoryState: true",
      "a traversal keeps the custom state",
    );
  });
});

describe("the stand-in", () => {
  let next: NextHistory;
  beforeEach(() => {
    next = installNextHistory();
    next.patch();
    next.land("/album");
  });
  afterEach(() => next.uninstall());

  const back = () =>
    new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      window.history.back();
    });

  it("applies the URL of a call handed a fresh state, and copies Next's internals onto it", () => {
    window.history.pushState({ mine: 1 }, "", "/album?room=settings");
    expect(next.href).toBe("/album?room=settings");
    expect(window.history.state).toMatchObject({ mine: 1, __NA: true });
    expect(window.history.state).toHaveProperty(
      "__PRIVATE_NEXTJS_INTERNALS_TREE",
    );
  });

  it("applies the URL of a call handed null, too", () => {
    window.history.replaceState(null, "", "/album?x=1");
    expect(next.href).toBe("/album?x=1");
    expect(window.history.state).toMatchObject({ __NA: true });
  });

  it("★ applies no URL to a call handed the entry's own state: the bar moves, Next's copy does not", () => {
    window.history.replaceState(
      window.history.state,
      "",
      "/album?setting=door",
    );
    expect(window.location.search).toBe("?setting=door");
    expect(next.href).toBe("/album");
  });

  it("treats _N (the pages router's flag) the same way", () => {
    window.history.replaceState({ _N: true }, "", "/album?x=1");
    expect(next.href).toBe("/album");
    expect(window.history.state).toEqual({ _N: true });
  });

  it("★ a refresh writes Next's copy over the bar, and leaves the entry only __NA and the tree", () => {
    window.history.pushState({ mine: 1 }, "", "/album?room=settings");
    window.history.replaceState(
      window.history.state,
      "",
      "/album?room=settings&setting=door",
    );
    next.refresh();
    expect(window.location.search).toBe("?room=settings");
    expect(Object.keys(window.history.state as object).sort()).toEqual([
      "__NA",
      "__PRIVATE_NEXTJS_INTERNALS_TREE",
    ]);
  });

  it("follows the bar on Back", async () => {
    window.history.pushState({ mine: 1 }, "", "/album?room=settings");
    await back();
    expect(next.href).toBe("/album");
    expect(next.reloads).toBe(0);
  });

  it("reloads on Back onto an entry with no __NA (the pages router's)", async () => {
    window.history.pushState({ _N: true }, "", "/old");
    window.history.pushState({ __NA: true }, "", "/new");
    await back();
    expect(next.reloads).toBe(1);
  });
});

describe("<NextRouterStandIn>", () => {
  let next: NextHistory;
  beforeEach(() => {
    next = installNextHistory();
    next.land("/album");
  });
  afterEach(() => next.uninstall());

  it("★ patches after the mount effects of what it holds, as Next's Router does: a write from one meets the browser's own function", () => {
    function Writer() {
      useEffect(() => {
        window.history.replaceState({ fresh: 1 }, "", "/album?first=1");
      }, []);
      return null;
    }
    render(
      <NextRouterStandIn>
        <Writer />
      </NextRouterStandIn>,
    );
    // Nothing copied onto the entry (it lost `__NA` and the tree), and the router never heard.
    expect(window.history.state).toEqual({ fresh: 1 });
    expect(next.href).toBe("/album");
  });

  it("★ and a write a microtask later meets the patch: the router hears it, the entry keeps Next's state", async () => {
    function Writer() {
      useEffect(() => {
        queueMicrotask(() =>
          window.history.replaceState(null, "", "/album?late=1"),
        );
      }, []);
      return null;
    }
    render(
      <NextRouterStandIn>
        <Writer />
      </NextRouterStandIn>,
    );
    await Promise.resolve();
    expect(next.href).toBe("/album?late=1");
    expect(window.history.state).toMatchObject({ __NA: true });
  });
});
