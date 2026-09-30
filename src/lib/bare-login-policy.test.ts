import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * A CLIENT-SIDE 401 FALLBACK NEVER SENDS A BARE `/login` (crumbs-20: the ROADMAP's six, from
 * `crumbs-11`).
 *
 * A session that lapses while a host sits on a page answers the page's next request with a 401, and
 * the client sends them to sign in. Sent to a bare `/login`, they land on the dashboard afterwards
 * and whatever they were doing is gone (a mail's Renew button, the storage list, a plan switch).
 * `loginPath(window.location.pathname)` (`lib/auth/return-path.ts`) carries the page, on the same
 * allow-list the gate's own redirect uses, and is the bare `/login` itself for a page no sign-in may
 * return to (the public pricing page), so it costs nothing where there is nothing to carry.
 *
 * WHAT IS REFUSED: `router.push("/login")`, `router.replace("/login")`, `location.assign("/login")`,
 * `location.replace("/login")` and `location.href = "/login"`, the literal and nothing else. A
 * server `redirect("/login")` is another thing (a gate that has its own request to read), and a link
 * (`<Link href="/login">`) is a person's own choice to go there.
 */

const ROOT = process.cwd();
const SKIP = /\.test\.tsx?$|\.d\.ts$|^src\/app\/\(dev\)\//;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx?$/.test(rel) && !SKIP.test(rel))
    .sort();
}

const NAVIGATORS = new Set(["push", "replace", "assign"]);

const isBareLogin = (node: ts.Node): boolean =>
  ts.isStringLiteralLike(node) && node.text === "/login";

/** The lines of every navigation to the literal `/login` in one source. */
function bareLogins(text: string, name = "source.tsx"): number[] {
  const source = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const lines: number[] = [];
  const at = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      NAVIGATORS.has(node.expression.name.text) &&
      node.arguments[0] &&
      isBareLogin(node.arguments[0])
    ) {
      lines.push(at(node));
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.name.text === "href" &&
      isBareLogin(node.right)
    ) {
      lines.push(at(node));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return lines;
}

describe("the scan sees what it should", () => {
  it("refuses each way a client navigates to the literal", () => {
    for (const code of [
      `router.push("/login");`,
      `router.replace('/login');`,
      "router.push(`/login`);",
      `window.location.assign("/login");`,
      `window.location.replace("/login");`,
      `location.href = "/login";`,
      `window.location.href = "/login";`,
    ]) {
      expect(bareLogins(code, "a.ts"), code).toEqual([1]);
    }
  });

  it("leaves the carried login, a server redirect, a link and a query alone", () => {
    for (const code of [
      `router.push(loginPath(window.location.pathname));`,
      `window.location.replace(loginPath(window.location.pathname));`,
      `redirect("/login");`,
      `router.push("/login?intent=create");`,
      `router.push("/dashboard");`,
      `const login = <Link href="/login">Log in</Link>;`,
      `// router.push("/login");`,
    ]) {
      expect(bareLogins(code, "a.tsx"), code).toEqual([]);
    }
  });
});

describe("no client fallback sends a bare /login", () => {
  const files = filesUnder("src");

  it("scanned the product's source", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  it("every navigation to /login carries the page, or is not a fallback", () => {
    const offenders = files.flatMap((rel) =>
      bareLogins(readFileSync(join(ROOT, rel), "utf8"), rel).map(
        (line) => `${rel}:${line}`,
      ),
    );
    expect(
      offenders,
      "a 401 fallback that sends `/login` bare lands the person on the dashboard after signing in: send `loginPath(window.location.pathname)` (lib/auth/return-path.ts), which is the bare login for a page no sign-in may return to",
    ).toEqual([]);
  });
});
