import ts from "typescript";
import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

/**
 * NO FUNCTION REFRESHES THE ROUTER AND THEN MOVES THE ADDRESS (crumbs-22, the audit crumbs-16 asked for).
 *
 * `router.refresh()` is a pending action in Next's queue, and a native write that applies a URL
 * (`history.pushState` or `replaceState` given an address; `lib/history-entry.ts`'s `push(href)`, `replace` and an
 * in-place `close`, which is what the hub's sheets, a settings page and the guest reel do) is a `restore`
 * action, which takes priority over anything pending and DISCARDS it (`dispatchAction` in
 * `next/dist/client/components/app-router-instance.js`: "navigations (including back/forward) take priority over
 * any pending actions"). So a write in the refresh's window either drops the refresh's data on the floor, or,
 * when the router's last RENDERED address differs from the one the write applies (any earlier native write that
 * moved the query leaves that true: this helper's `push(href)` always does), reloads the page onto the same URL
 * (measured under `next dev`, Next 16.2.6: the window is the refresh's whole round trip, until its commit
 * rewrites the entry, not a fixed 20 ms; `lib/history-entry.ts`'s header holds the matrix). Nothing in a browser
 * says so when the data is dropped.
 *
 * The order is what matters, so it is what is refused: within ONE function body (with the callbacks it hands
 * `startTransition`, `flushSync`, `queueMicrotask` and `requestAnimationFrame`, which run at once) a refresh
 * that comes BEFORE a call that applies a URL. The other order is measured safe (the write settles, then the
 * refresh reads the address it left), and so is everything that is not a native URL write: `router.push` and
 * `router.replace` (Next's own navigations), `history.back()`, and a `pushState` with no address (a phone
 * popup's entry).
 *
 * WHAT COUNTS AS A CALL THAT APPLIES A URL:
 *   - `.pushState(...)` or `.replaceState(...)` given a third argument;
 *   - a member of an entry (`useOwnedEntry`), of `useEventShare` or of `useReelParam` named in `ADDRESS_HOOKS`,
 *     reached through the variable the hook was bound to or through a destructured name (`entry.replace(...)`,
 *     `openSheet(...)`, `{ open: openParam }`); a `push()` with no address is URL-less and passes;
 *   - a function of the same file whose body holds one of the above (masonry's `writeAddress` and what calls it).
 *
 * WHAT IT CANNOT SEE, and this file says so rather than passing quietly: a callback handed in as a prop (`onDone`),
 * a write in another file's function, and TWO GESTURES inside one round trip (a guest's viewer step landing inside
 * a poll's refresh; the header of `lib/history-entry.ts` holds what is known of each). A handler that meets the
 * edge writes first and refreshes after, or waits for the refresh's transition, or does neither. ★ The hub's
 * sheets do neither (crumbs-24): their saves re-render the hub in the action's own answer, which Next replays when a
 * navigation interrupts it, so nothing a tap in a sheet can meet is ever a refresh in flight; the pin below keeps
 * the router's refresh out of them.
 *
 * AN EXCEPTION SAYS SO, in `ALLOWED`: the file, and why a `.refresh()` there is not the router's, or why the
 * write that follows cannot meet a refresh in flight. An entry whose file no longer offends FAILS, so the list
 * cannot outlive its reasons. EMPTY: every `.refresh()` in the tree is the router's, and none is followed by a
 * write.
 */

/** File (repo-relative, forward slashes: `src/...`) -> why a refresh followed by a URL write is safe there. */
const ALLOWED: Readonly<Record<string, string>> = {};

/** Hooks whose callbacks end in a native URL write: hook -> [home file, the members that write]. */
const ADDRESS_HOOKS: Readonly<
  Record<string, { home: string; members: readonly string[] }>
> = {
  useOwnedEntry: {
    home: "src/lib/history-entry.ts",
    members: ["push", "replace", "close"],
  },
  useEventShare: {
    home: "src/components/app/share/event-share-provider.tsx",
    members: [
      "openSheet",
      "closeSheet",
      "openSettingsPage",
      "closeSettingsPage",
    ],
  },
  useReelParam: {
    home: "src/lib/guest/reel-url.ts",
    members: ["open", "close"],
  },
};

/**
 * A file that never says `refresh` holds no refresh call, so it cannot hold a refresh followed by a write. The scan
 * reads each file once and parses only the ones that do (about fifty of the tree's thousand), which is what keeps
 * it well inside vitest's five seconds on a machine running three lanes' gates at once (parsing all of them took
 * 5.6 s at load 12). Word-bounded, so every spelling of the call the scan counts (`router.refresh()`,
 * `router?.refresh()`, a destructured `refresh()`) passes it, and a comment that says the word only costs a parse.
 */
const SAYS_REFRESH = /\brefresh\b/;

/** Callees whose function argument runs at once, so its body belongs to the caller's sequence. */
const INLINE =
  /^(startTransition|flushSync|queueMicrotask|requestAnimationFrame|start[A-Z]\w*)$/;

const isFunction = (
  node: ts.Node,
): node is
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node);

type Call = {
  name: string;
  receiver: string | null;
  args: number;
  pos: number;
  line: number;
};

function calleeOf(node: ts.CallExpression, source: ts.SourceFile) {
  const callee = node.expression;
  if (ts.isPropertyAccessExpression(callee)) {
    return {
      name: callee.name.text,
      receiver: callee.expression.getText(source),
    };
  }
  if (ts.isIdentifier(callee)) return { name: callee.text, receiver: null };
  return null;
}

/** The names this file binds to what an address hook returns: `entry`, `openSheet`, `{ open: openParam }`. */
function bindingsOf(source: ts.SourceFile) {
  /** name -> the members that write, for `const x = useHook()` (its members are reached as `x.member`). */
  const objects = new Map<string, readonly string[]>();
  /** Names that ARE a writing callback: `openSheet`, `openParam`. */
  const callbacks = new Set<string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const hook = calleeOf(node.initializer, source)?.name;
      const spec = hook ? ADDRESS_HOOKS[hook] : undefined;
      if (spec) {
        if (ts.isIdentifier(node.name))
          objects.set(node.name.text, spec.members);
        else if (ts.isObjectBindingPattern(node.name)) {
          for (const el of node.name.elements) {
            const from = (el.propertyName ?? el.name).getText(source);
            if (spec.members.includes(from) && ts.isIdentifier(el.name)) {
              callbacks.add(el.name.text);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { objects, callbacks };
}

/** Whether a call, taken alone, applies a URL by itself (a native write, or a member of a bound address hook). */
function appliesUrl(
  call: Call,
  bound: ReturnType<typeof bindingsOf>,
  writers: ReadonlySet<string>,
): boolean {
  if (
    (call.name === "pushState" || call.name === "replaceState") &&
    call.args >= 3
  ) {
    return true;
  }
  if (call.receiver !== null) {
    const members = bound.objects.get(call.receiver);
    if (members?.includes(call.name)) {
      // `push()` with no address pushes a same-URL entry (a phone popup's): nothing is applied.
      return !(call.name === "push" && call.args === 0);
    }
    return false;
  }
  return bound.callbacks.has(call.name) || writers.has(call.name);
}

/** Every call of a function's own sequence, in source order, with the callbacks that run at once folded in. */
function sequenceOf(fn: ts.Node, source: ts.SourceFile): Call[] {
  const calls: Call[] = [];
  const visit = (node: ts.Node) => {
    if (node !== fn && isFunction(node)) {
      const parent = node.parent;
      const callee =
        parent &&
        ts.isCallExpression(parent) &&
        parent.arguments.includes(node as ts.Expression)
          ? calleeOf(parent, source)
          : null;
      if (!callee || !INLINE.test(callee.name)) return;
    }
    if (ts.isCallExpression(node)) {
      const callee = calleeOf(node, source);
      if (callee) {
        calls.push({
          ...callee,
          args: node.arguments.length,
          pos: node.getStart(source),
          line:
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(fn);
  return calls.sort((a, b) => a.pos - b.pos);
}

/** The functions of a file that apply a URL, by name, to a fixed point (`writeAddress`, then `addressNow`). */
function writersIn(
  source: ts.SourceFile,
  bound: ReturnType<typeof bindingsOf>,
): Set<string> {
  const named: { name: string; fn: ts.Node }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      named.push({ name: node.name.text, fn: node });
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      // `const f = () => ...`, and `const f = useCallback(() => ..., [])`.
      let init: ts.Node = node.initializer;
      if (
        ts.isCallExpression(init) &&
        init.arguments[0] &&
        isFunction(init.arguments[0])
      ) {
        init = init.arguments[0];
      }
      if (isFunction(init)) named.push({ name: node.name.text, fn: init });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const writers = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const { name, fn } of named) {
      if (writers.has(name)) continue;
      if (sequenceOf(fn, source).some((c) => appliesUrl(c, bound, writers))) {
        writers.add(name);
        grew = true;
      }
    }
  }
  return writers;
}

export type Finding = { line: number; refresh: number; write: string };

/** Every function that refreshes, and afterwards applies a URL. */
export function refreshThenWrite(
  text: string,
  fileName = "file.tsx",
): Finding[] {
  if (!SAYS_REFRESH.test(text)) return [];
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const bound = bindingsOf(source);
  const writers = writersIn(source, bound);
  const found: Finding[] = [];
  const visit = (node: ts.Node) => {
    if (isFunction(node)) {
      const calls = sequenceOf(node, source);
      const refresh = calls.find((c) => c.name === "refresh" && c.args === 0);
      if (refresh) {
        const write = calls.find(
          (c) => c.pos > refresh.pos && appliesUrl(c, bound, writers),
        );
        if (write) {
          found.push({
            line:
              source.getLineAndCharacterOfPosition(node.getStart(source)).line +
              1,
            refresh: refresh.line,
            write: `${write.receiver ? `${write.receiver}.` : ""}${write.name}@${write.line}`,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** What the scan saw in a file, for its own coverage: refreshes, and the names it took for writers. */
function census(text: string, fileName: string) {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const bound = bindingsOf(source);
  let refreshes = 0;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callee = calleeOf(node, source);
      if (callee?.name === "refresh" && node.arguments.length === 0)
        refreshes += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { refreshes, writers: writersIn(source, bound), bound };
}

/* ── the policy ───────────────────────────────────────────────────────────── */

const SOURCES = sources();

let saying: { rel: string; text: string }[] | undefined;
/** The files that say `refresh`, read once and shared by the tests that scan the tree. */
function filesSayingRefresh() {
  return (saying ??= SOURCES.flatMap((rel) => {
    const text = read(rel);
    return SAYS_REFRESH.test(text) ? [{ rel, text }] : [];
  }));
}

describe("no function refreshes the router and then moves the address", () => {
  it("scans the tree, and sees the refreshes and the writers it exists for", () => {
    expect(SOURCES.length, "the scan found no files").toBeGreaterThan(500);
    let refreshes = 0;
    let filesWithRefresh = 0;
    for (const { rel, text } of filesSayingRefresh()) {
      const seen = census(text, rel).refreshes;
      refreshes += seen;
      if (seen > 0) filesWithRefresh += 1;
    }
    // 46 in 26 files at the audit; the floor sits a few under it, so a directory that stops being walked is noticed.
    expect(
      refreshes,
      "the scan saw too few router.refresh() calls",
    ).toBeGreaterThanOrEqual(40);
    expect(filesWithRefresh).toBeGreaterThanOrEqual(20);

    // The album's address writers, derived from the viewer's own entry (`useOwnedEntry`'s push, replace and
    // close) and its callers (crumbs-43: the viewer stands on an entry of its own, which the phone's Back closes;
    // `writeAddress` and `addressNow` went with replaceState). A step's write (`addressAfterStep`) waits a beat
    // inside a timer, so it is not a write at once: the scan is right to leave it out, and it is one of the
    // timing cases the header names.
    const masonry = census(
      read("src/components/shared/masonry.tsx"),
      "masonry.tsx",
    );
    for (const name of ["openItem", "closeItem", "leaveEntry"]) {
      expect(masonry.writers, `masonry's ${name}`).toContain(name);
    }
    expect(masonry.writers).not.toContain("addressAfterStep");
    // The hub's own writers: what a card, the sheets and a settings page call.
    const hub = census(
      read("src/components/app/share/event-share-provider.tsx"),
      "event-share-provider.tsx",
    );
    for (const name of [
      "openSheet",
      "closeSheet",
      "replaceSettingsPage",
      "openSettingsPage",
    ]) {
      expect(hub.writers, `the hub's ${name}`).toContain(name);
    }
    // And a consumer reaches them by the names the hook hands it.
    const cards = census(
      read("src/components/app/event-feed/reel-card.tsx"),
      "reel-card.tsx",
    );
    expect(cards.bound.callbacks).toContain("openSheet");
  });

  it("names hooks that still exist, with the members they still have", () => {
    for (const [hook, { home, members }] of Object.entries(ADDRESS_HOOKS)) {
      const text = read(home);
      expect(text, `${hook} is no longer in ${home}`).toMatch(
        new RegExp(`function ${hook}\\b`),
      );
      for (const member of members) {
        expect(text, `${hook}: ${member} is gone from ${home}`).toMatch(
          new RegExp(`\\b${member}\\b`),
        );
      }
    }
  });

  it("★ the hub's sheets never refresh the router: every Settings save re-renders the hub in its own answer (crumbs-24)", () => {
    // The reel switch refreshed after its save, and a tap on the page's back arrow or a row inside that round trip
    // reloaded the page or dropped the refresh (measured: the matrix in lib/history-entry.ts). Two gestures in one
    // round trip are what no scan of one function can see, so the sheets hold no refresh at all.
    const sheets = SOURCES.filter(
      (rel) =>
        rel.startsWith("src/components/app/event-settings/") ||
        rel.startsWith("src/components/app/share/"),
    );
    expect(sheets.length, "the hub's sheets were not found").toBeGreaterThan(
      10,
    );
    const refreshing = sheets.filter(
      (rel) =>
        SAYS_REFRESH.test(read(rel)) && census(read(rel), rel).refreshes > 0,
    );
    expect(refreshing).toEqual([]);
  });

  it("finds no function that refreshes and then applies a URL", () => {
    const offenders: string[] = [];
    for (const { rel, text } of filesSayingRefresh()) {
      if (rel in ALLOWED) continue;
      for (const hit of refreshThenWrite(text, rel)) {
        offenders.push(
          `${rel}:${hit.line}  router.refresh()@${hit.refresh}, then ${hit.write}`,
        );
      }
    }
    expect(
      offenders,
      `A function refreshes the router and then applies a URL to the address. The write discards the pending refresh ` +
        `(its data never lands) or, on an entry the page moved before, reloads the page onto the same URL. Write first ` +
        `and refresh after, wait for the refresh's transition, or do neither (see this file's header):\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });
});

describe("the scan itself", () => {
  const hits = (code: string) => refreshThenWrite(code).length;

  it("holds no exception that no longer offends", () => {
    for (const [file, why] of Object.entries(ALLOWED)) {
      expect(why.trim().length, `${file} needs its reason`).toBeGreaterThan(20);
      expect(
        refreshThenWrite(read(file), file).length,
        `${file} is allowed but no longer refreshes and then writes: drop the entry`,
      ).toBeGreaterThan(0);
    }
  });

  it.each([
    [
      "a native replace after a refresh",
      `function go() { router.refresh(); window.history.replaceState(null, "", u); }`,
    ],
    [
      "a native push after a refresh",
      `const go = () => { router.refresh(); history.pushState({ k: 1 }, "", u); };`,
    ],
    [
      "an entry's replace",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { router.refresh(); entry.replace(u); }; }`,
    ],
    [
      "an entry's push with an address",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { router.refresh(); entry.push(u); }; }`,
    ],
    [
      "an entry's close",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { router.refresh(); entry.close(u); }; }`,
    ],
    [
      "a destructured hub callback",
      `function Card() { const { openSheet } = useEventShare(); const go = () => { router.refresh(); openSheet("settings"); }; }`,
    ],
    [
      "a renamed reel callback",
      `function R() { const { open: openParam } = useReelParam(); const go = () => { router.refresh(); openParam("hand"); }; }`,
    ],
    [
      "a hub callback reached through the object",
      `function Card() { const share = useEventShare(); const go = () => { router.refresh(); share.closeSheet(); }; }`,
    ],
    [
      "a same-file function that writes",
      `const move = () => window.history.replaceState(null, "", u); function go() { router.refresh(); move(); }`,
    ],
    [
      "a same-file function that calls one that writes",
      `const write = () => history.replaceState(null, "", u); const now = useCallback(() => write(), []); function go() { router.refresh(); now(); }`,
    ],
    [
      "a refresh inside startTransition, then a write",
      `function go() { startTransition(() => router.refresh()); window.history.replaceState(null, "", u); }`,
    ],
    [
      "an optional refresh call",
      `function go() { router.refresh?.(); window.history.replaceState(null, "", u); }`,
    ],
    [
      "a destructured refresh",
      `function go() { const { refresh } = useRouter(); refresh(); window.history.replaceState(null, "", u); }`,
    ],
    [
      "a write inside a microtask after a refresh",
      `function go() { router.refresh(); queueMicrotask(() => history.replaceState(null, "", u)); }`,
    ],
  ])("refuses %s", (_name, code) => {
    expect(hits(code)).toBe(1);
  });

  it.each([
    [
      "a write and then the refresh (measured safe)",
      `function go() { window.history.replaceState(null, "", u); router.refresh(); }`,
    ],
    [
      "an entry's replace and then the refresh",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { entry.replace(u); router.refresh(); }; }`,
    ],
    [
      "a refresh and then Back",
      `function go() { router.refresh(); window.history.back(); }`,
    ],
    [
      "a refresh and then a URL-less pushState",
      `function go() { router.refresh(); history.pushState({ popup: 1 }, ""); }`,
    ],
    [
      "a refresh and then an entry's push with no address",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { router.refresh(); entry.push(); }; }`,
    ],
    [
      "a refresh and then Next's own navigation",
      `function go() { router.refresh(); router.replace("/account"); router.push("/x"); }`,
    ],
    [
      "a refresh and then a call of an entry that is not a write",
      `function Hub() { const entry = useOwnedEntry("k"); const go = () => { router.refresh(); entry.keep(true); entry.isOurs(); }; }`,
    ],
    [
      "a refresh and a write in different functions",
      `function a() { router.refresh(); } function b() { window.history.replaceState(null, "", u); }`,
    ],
    [
      "a write that runs later, in a callback nothing calls at once",
      `function go() { router.refresh(); setTimeout(() => history.replaceState(null, "", u), 500); }`,
    ],
    [
      "a refresh in a handler and a hub write in another",
      `function Card() { const { openSheet } = useEventShare(); const a = () => router.refresh(); const b = () => openSheet("share"); }`,
    ],
    [
      "a longer name that only starts like refresh",
      `function go() { refreshed(); history.replaceState(null, "", u); }`,
    ],
    [
      "another object's members named like an entry's",
      `function go() { router.refresh(); other.replace(u); list.push(x); }`,
    ],
  ])("passes %s", (_name, code) => {
    expect(hits(code)).toBe(0);
  });
});
