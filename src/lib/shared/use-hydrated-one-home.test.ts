import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * THE HYDRATED FLAG HAS ONE HOME (`use-hydrated.ts`). It is three lines, so eight files wrote them: a store
 * with nothing to subscribe to, a client snapshot of `() => true` and a server snapshot of `() => false`
 * (a contact form's submit, the hub's sheets, a bulk bar, the door, a menu's theme row, the lab's toggle,
 * the motion tuner, the FAQ's closed answers), each with a comment of its own on why. A lesson about the
 * flag (its server answer, what it is not for) then lands eight times or once.
 *
 * WHAT IS REFUSED, anywhere but the home: a `useSyncExternalStore` call whose client snapshot is a function
 * that answers `true` and whose server snapshot is a function that answers `false`, however it spells the
 * functions (`() => true`, `function () { return true; }`, a block). A snapshot that READS something
 * (`matchMedia(...).matches`, a URL parameter) is a store of its own and is fine: only the constant pair
 * is the flag.
 */

const ROOT = process.cwd();
const HOME = "src/lib/shared/use-hydrated.ts";
const SKIP = /\.test\.tsx?$|\.d\.ts$|^src\/lib\/db\/types\.ts$/;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx?$/.test(rel) && !SKIP.test(rel))
    .sort();
}

/** The literal a snapshot function answers when it answers nothing else: `() => true`, `{ return false; }`. */
function constantAnswer(node: ts.Expression): boolean | null {
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return null;
  if (node.parameters.length > 0) return null;
  let body: ts.Node = node.body;
  if (ts.isBlock(body)) {
    if (body.statements.length !== 1) return null;
    const only = body.statements[0];
    if (!ts.isReturnStatement(only) || !only.expression) return null;
    body = only.expression;
  }
  while (ts.isParenthesizedExpression(body)) body = body.expression;
  if (body.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (body.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

/** Every hydrated-flag triple in `text`: the line of the call. */
function flagsIn(text: string, fileName = "file.tsx"): number[] {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const lines: number[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.arguments.length === 3) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : null;
      if (
        name === "useSyncExternalStore" &&
        constantAnswer(node.arguments[1]) === true &&
        constantAnswer(node.arguments[2]) === false
      ) {
        lines.push(
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return lines;
}

describe("the hydrated flag lives in one file", () => {
  const sources = filesUnder("src");

  it("scans the tree, and finds the flag where it lives", () => {
    expect(sources.length, "the scan found no files").toBeGreaterThan(500);
    expect(sources).toContain(HOME);
    expect(
      flagsIn(readFileSync(join(ROOT, HOME), "utf8"), HOME),
      "the home no longer holds the flag",
    ).toHaveLength(1);
  });

  it("finds no second copy of it", () => {
    const copies: string[] = [];
    for (const rel of sources) {
      if (rel === HOME) continue;
      for (const line of flagsIn(readFileSync(join(ROOT, rel), "utf8"), rel)) {
        copies.push(`${rel}:${line}`);
      }
    }
    expect(
      copies,
      `A hydrated flag was written by hand again. Import \`useHydrated\` from "@/lib/shared/use-hydrated":\n` +
        copies.join("\n"),
    ).toEqual([]);
  });
});

describe("the scan itself", () => {
  it.each([
    [
      "an inline no-op store",
      `useSyncExternalStore(() => () => {}, () => true, () => false);`,
    ],
    [
      "a named no-op store",
      `useSyncExternalStore(subscribeNoop, () => true, () => false);`,
    ],
    [
      "a namespaced call",
      `React.useSyncExternalStore(noop, () => true, () => false);`,
    ],
    [
      "function expressions",
      `useSyncExternalStore(noop, function () { return true; }, function () { return false; });`,
    ],
    [
      "block bodies",
      `useSyncExternalStore(noop, () => { return true; }, () => { return false; });`,
    ],
    [
      "parenthesised answers",
      `useSyncExternalStore(noop, () => (true), () => (false));`,
    ],
    [
      "over several lines",
      `const hydrated = useSyncExternalStore(\n  () => () => {},\n  () => true,\n  () => false,\n);`,
    ],
  ])("finds %s", (_name, code) => {
    expect(flagsIn(code)).toHaveLength(1);
  });

  it.each([
    [
      "a snapshot that reads the browser",
      `useSyncExternalStore(subscribe, () => window.matchMedia(q).matches, () => false);`,
    ],
    [
      "a server answer of true (the player that starts paused)",
      `useSyncExternalStore(subscribe, () => read(), () => true);`,
    ],
    [
      "a client answer of false",
      `useSyncExternalStore(noop, () => false, () => false);`,
    ],
    [
      "a URL parameter with a null server answer",
      `useSyncExternalStore(noop, () => new URLSearchParams(location.search).get("k"), () => null);`,
    ],
    [
      "a snapshot function that takes a parameter",
      `useSyncExternalStore(noop, (x) => true, () => false);`,
    ],
    [
      "another hook of the same shape",
      `useOtherStore(noop, () => true, () => false);`,
    ],
  ])("passes %s", (_name, code) => {
    expect(flagsIn(code)).toHaveLength(0);
  });
});
