import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * A NATIVE HISTORY CALL IS NEVER HANDED THE ENTRY'S OWN STATE (crumbs-16: build 23's red-team, HIGH,
 * a Settings row that never opened its page and a page's back arrow that never returned).
 *
 * The App Router patches `window.history.pushState` and `replaceState` so a native call reaches
 * `useSearchParams` and `usePathname` (`node_modules/next/dist/client/components/app-router.js`).
 * Given an object without `__NA` or `_N` the patch copies Next's own `__NA` and internals tree onto it
 * and tells the router the new URL. Given one that HAS them, which is what `window.history.state` is on
 * any entry Next has touched, it takes the call for its own bookkeeping ("avoid a loop when Next.js
 * internals trigger pushState/replaceState") and applies nothing: the bar changes and the router does
 * not. Everything downstream of the router then reads the address the call left behind: a hook that
 * never re-renders, a link built from a stale `useSearchParams`, and the next router commit
 * (measured with `router.refresh()`) writing Next's copy back over the bar, which brings back a
 * parameter the page had removed. Seven calls in six files handed the state through, each on a
 * plausible instinct ("keep what Next and I put on the entry"), and none had a test that could see it:
 * a stand-in that fires its listeners on every call passes them all. `@/lib/test-utils/next-history`
 * is the stand-in that does not, and this is the guard that keeps the shape from coming back.
 *
 * WHAT IS REFUSED: a call to `.pushState(` or `.replaceState(` (any receiver: `window.history`, a bare
 * `history`, an alias) whose first argument CARRIES the entry's state: `history.state` read off the
 * receiver or off any `history`, alone, in a spread (`{ ...window.history.state, x }`), through `??`,
 * `||`, `&&` or a conditional, through `Object.assign` or `structuredClone`, or through a variable
 * declared in the same file from any of those (`const s = window.history.state`, or destructured off
 * `history`). What it hands over instead is a fresh object holding only what is OURS (a place's marker,
 * which the hub's sheets, a phone's popup and the reel each write through `lib/history-entry.ts`) or
 * `null`, and Next copies its own state onto it. A value DERIVED from the state (`Boolean(window.history.state?.[KEY])`,
 * a marker read to decide what to hand over) is not the state and is fine.
 *
 * ★ WHEN THE CALL RUNS IS PART OF THE SHAPE, and no static scan can see it. Next installs its patch in
 * a passive effect of its Router, the root of the client tree, and React runs a child's effect before
 * its parent's: a write from a component's MOUNT effect on the page's first commit reaches the browser's
 * own `replaceState`, where a fresh state (or `null`) empties the entry's `__NA` and tree, so a later
 * Back onto it is ignored by Next, and Next never hears the URL. Such a write is made a microtask late
 * (`queueMicrotask`, which runs after the whole flush of the commit's effects); a write from an event
 * handler needs no wait. `email-section.tsx`, `lab/board-state.tsx` (a step landing sets its controls)
 * and `lab/step.tsx`'s card write are the three that can run at mount today, each pinned by a test
 * rendered inside `<NextRouterStandIn>`, which installs its patch after its children's effects as
 * Next does.
 *
 * AN EXCEPTION SAYS SO, in `ALLOWED`: the file, and why passing the state through is safe there (a call
 * made where Next's patch is provably absent, a state stripped of `__NA` first). An entry whose file no
 * longer offends FAILS, so the list cannot outlive its reasons. EMPTY: every call hands Next a fresh
 * object or `null`, including the lab's (measured on the real desk: a `null` write after the patch
 * keeps `__NA` and the tree on the entry, and a walk followed by a refresh keeps the step).
 *
 * The scan is per file and names variables, not scopes, and it cannot follow a state through a function
 * that returns it: that shape is what the component tests, run against the stand-in, are for.
 */

/** File (repo-relative, forward slashes: `src/...`) -> why passing the entry's state through is safe there. */
const ALLOWED: Readonly<Record<string, string>> = {};

const ROOT = process.cwd();
const SKIP = /\.test\.tsx?$|\.d\.ts$|^src\/lib\/db\/types\.ts$/;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx?$/.test(rel) && !SKIP.test(rel))
    .sort();
}

/* ── the scan ─────────────────────────────────────────────────────────────── */

const WRITES = new Set(["pushState", "replaceState"]);

/** Peel the wrappers that keep a value what it is: parentheses, `as`, `satisfies`, `!`. */
function unwrap(node: ts.Expression): ts.Expression {
  let at = node;
  while (
    ts.isParenthesizedExpression(at) ||
    ts.isAsExpression(at) ||
    ts.isSatisfiesExpression(at) ||
    ts.isNonNullExpression(at) ||
    ts.isTypeAssertionExpression(at)
  ) {
    at = at.expression;
  }
  return at;
}

/** `history`, `window.history`, `globalThis.history`: an expression whose last segment is `history`. */
function isHistory(node: ts.Expression, source: ts.SourceFile): boolean {
  const at = unwrap(node);
  if (ts.isIdentifier(at)) return at.text === "history";
  if (ts.isPropertyAccessExpression(at)) return at.name.text === "history";
  return at.getText(source).endsWith("history");
}

function propertyName(node: ts.Expression): string | null {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node)) {
    const arg = node.argumentExpression;
    return ts.isStringLiteralLike(arg) ? arg.text : null;
  }
  return null;
}

/** The variables of a file that hold the entry's state, by name (never by scope). */
function taintedNames(source: ts.SourceFile): Set<string> {
  const declared: { name: string; init: ts.Expression }[] = [];
  const destructured = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isIdentifier(node.name)) {
        declared.push({ name: node.name.text, init: node.initializer });
      } else if (
        ts.isObjectBindingPattern(node.name) &&
        isHistory(node.initializer, source)
      ) {
        // const { state } = window.history; const { state: entry } = history;
        for (const el of node.name.elements) {
          const from = el.propertyName ?? el.name;
          if (ts.isIdentifier(from) && from.text === "state") {
            if (ts.isIdentifier(el.name)) destructured.add(el.name.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  const tainted = new Set<string>(destructured);
  // Iterate to a fixed point so `const a = window.history.state; const b = { ...a }` is caught.
  let grew = true;
  while (grew) {
    grew = false;
    for (const { name, init } of declared) {
      if (tainted.has(name)) continue;
      if (carries(init, source, tainted, null)) {
        tainted.add(name);
        grew = true;
      }
    }
  }
  return tainted;
}

/**
 * Whether `node` IS the entry's state, or a copy that still holds `__NA`: the state read off `history`
 * (or off the call's own receiver), a tainted name, and the forms that pass one through.
 */
function carries(
  node: ts.Expression,
  source: ts.SourceFile,
  tainted: ReadonlySet<string>,
  receiver: string | null,
): boolean {
  const at = unwrap(node);
  if (ts.isIdentifier(at)) return tainted.has(at.text);
  if (propertyName(at) === "state") {
    const from = ts.isPropertyAccessExpression(at)
      ? at.expression
      : (at as ts.ElementAccessExpression).expression;
    return (
      isHistory(from, source) ||
      (receiver !== null && from.getText(source) === receiver)
    );
  }
  if (ts.isBinaryExpression(at)) {
    const op = at.operatorToken.kind;
    if (
      op === ts.SyntaxKind.QuestionQuestionToken ||
      op === ts.SyntaxKind.BarBarToken ||
      op === ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      return (
        carries(at.left, source, tainted, receiver) ||
        carries(at.right, source, tainted, receiver)
      );
    }
    return false;
  }
  if (ts.isConditionalExpression(at)) {
    return (
      carries(at.whenTrue, source, tainted, receiver) ||
      carries(at.whenFalse, source, tainted, receiver)
    );
  }
  if (ts.isObjectLiteralExpression(at)) {
    return at.properties.some(
      (p) =>
        ts.isSpreadAssignment(p) &&
        carries(p.expression, source, tainted, receiver),
    );
  }
  if (ts.isCallExpression(at)) {
    const callee = at.expression.getText(source);
    if (callee === "structuredClone" || callee === "Object.assign") {
      return at.arguments.some((a) => carries(a, source, tainted, receiver));
    }
    return false;
  }
  return false;
}

/** Every native history write in `text` whose first argument carries the entry's state. */
function stateHandedOver(
  text: string,
  fileName = "file.tsx",
): { line: number; call: string }[] {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const tainted = taintedNames(source);
  const found: { line: number; call: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callee = unwrap(node.expression);
      const name = propertyName(callee);
      const first = node.arguments[0];
      if (name && WRITES.has(name) && first) {
        const from = ts.isPropertyAccessExpression(callee)
          ? callee.expression
          : (callee as ts.ElementAccessExpression).expression;
        if (carries(first, source, tainted, from.getText(source))) {
          found.push({
            line:
              source.getLineAndCharacterOfPosition(node.getStart(source)).line +
              1,
            call: node.getText(source).split("\n")[0].slice(0, 90),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** Every native history write in `text`, handed the state or not (the scan's own coverage). */
function writesIn(text: string): number {
  const source = ts.createSourceFile(
    "file.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const name = propertyName(unwrap(node.expression));
      if (name && WRITES.has(name)) count += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return count;
}

/* ── the policy ───────────────────────────────────────────────────────────── */

const SOURCES = filesUnder("src");

describe("no native history call is handed the entry's own state", () => {
  it("scans the tree, and sees the calls it exists for", () => {
    // A guard that scans nothing passes silently: pin that the walk found the tree and its writes.
    expect(SOURCES.length, "the scan found no files").toBeGreaterThan(500);
    const writes = SOURCES.reduce(
      (n, rel) => n + writesIn(readFileSync(join(ROOT, rel), "utf8")),
      0,
    );
    // 14 today (crumbs-19 folded the hub's four writes, the popup's one and the reel's two into the helper's
    // four): the floor stays a few under it, so a directory that stops being walked is still noticed.
    expect(
      writes,
      "the scan saw too few history writes",
    ).toBeGreaterThanOrEqual(10);
    // The shared helper's calls are the first that mattered (the provider's were, before crumbs-19 moved
    // them here): every place that pushes an entry of its own stands on them, so they are in the tree
    // and inspected.
    expect(
      writesIn(readFileSync(join(ROOT, "src/lib/history-entry.ts"), "utf8")),
      "the shared history helper's writes are not being scanned",
    ).toBeGreaterThanOrEqual(3);
  });

  it("refuses a call handed the state, outside the reasoned exceptions", () => {
    const offenders: string[] = [];
    for (const rel of SOURCES) {
      if (rel in ALLOWED) continue;
      for (const hit of stateHandedOver(
        readFileSync(join(ROOT, rel), "utf8"),
        rel,
      )) {
        offenders.push(`${rel}:${hit.line}  ${hit.call}`);
      }
    }
    expect(
      offenders,
      `A native history call was handed the entry's own state (\`window.history.state\`, or a copy of it): ` +
        `it carries Next's \`__NA\`, so Next applies no URL and its own copy of the address goes stale. ` +
        `Hand it \`null\` or a fresh object holding only what is yours (see this file's header):\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("holds no exception that no longer offends", () => {
    for (const [file, why] of Object.entries(ALLOWED)) {
      expect(why.trim().length, `${file} needs its reason`).toBeGreaterThan(20);
      expect(
        stateHandedOver(readFileSync(join(ROOT, file), "utf8"), file).length,
        `${file} is allowed but no longer hands the state through: drop the entry`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("the scan itself", () => {
  const hits = (code: string) => stateHandedOver(code).length;

  it.each([
    [
      "the state itself",
      `window.history.replaceState(window.history.state, "", u);`,
    ],
    ["a bare history", `history.pushState(history.state, "", u);`],
    [
      "globalThis",
      `globalThis.history.replaceState(globalThis.history.state, "", u);`,
    ],
    [
      "a spread",
      `window.history.replaceState({ ...window.history.state, x: 1 }, "", u);`,
    ],
    [
      "a cast",
      `window.history.replaceState(window.history.state as object, "", u);`,
    ],
    [
      "a fallback",
      `window.history.replaceState(window.history.state ?? {}, "", u);`,
    ],
    [
      "a branch",
      `window.history.replaceState(ok ? window.history.state : null, "", u);`,
    ],
    [
      "a clone",
      `window.history.replaceState(structuredClone(window.history.state), "", u);`,
    ],
    [
      "an assign",
      `window.history.replaceState(Object.assign({}, window.history.state), "", u);`,
    ],
    [
      "an element access",
      `window.history["replaceState"](window.history["state"], "", u);`,
    ],
    [
      "an optional call",
      `window.history.replaceState?.(window.history.state, "", u);`,
    ],
    [
      "a variable",
      `const s = window.history.state; window.history.replaceState(s, "", u);`,
    ],
    [
      "a variable's spread",
      `const s = window.history.state; history.replaceState({ ...s }, "", u);`,
    ],
    [
      "a variable of a variable",
      `const a = history.state; const b = a; history.pushState(b, "", u);`,
    ],
    [
      "a destructured state",
      `const { state } = window.history; history.replaceState(state, "", u);`,
    ],
    [
      "a renamed destructured state",
      `const { state: entry } = history; history.replaceState(entry, "", u);`,
    ],
    [
      "an alias of the receiver",
      `const h = window.history; h.replaceState(h.state, "", u);`,
    ],
    [
      "two lines",
      `window.history.replaceState(\n  window.history.state,\n  "",\n  u,\n);`,
    ],
  ])("refuses %s", (_name, code) => {
    expect(hits(code)).toBe(1);
  });

  it.each([
    ["null", `window.history.replaceState(null, "", u);`],
    ["an empty object", `window.history.replaceState({}, "", u);`],
    [
      "our marker as a field",
      `window.history.pushState({ [MARKER]: true }, "", u);`,
    ],
    [
      "a marker only when ours",
      `window.history.replaceState(ours ? { [MARKER]: true } : {}, "", u);`,
    ],
    [
      "a value derived from the state",
      `const ours = Boolean(window.history.state?.[MARKER]); window.history.replaceState(ours ? { [MARKER]: true } : {}, "", u);`,
    ],
    [
      "a key of ours computed elsewhere",
      `window.history.replaceState({ [PUSHED_KEY]: pushedByUs() }, "", u);`,
    ],
    ["no URL", `window.history.pushState({ [POPUP]: entry }, "");`],
    ["a hash", `history.replaceState(null, "", "#" + id);`],
    [
      "a read that is not passed",
      `const back = window.history.state; window.history.replaceState(null, "", u); use(back);`,
    ],
    ["another object's state", `router.replaceState(other.state, "", u);`],
  ])("passes %s", (_name, code) => {
    expect(hits(code)).toBe(0);
  });
});
