import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

/**
 * A `<form>` NEVER SUBMITS ITSELF INTO THE ADDRESS (crumbs-20: the ROADMAP's forms line, from
 * `contact-wiring`).
 *
 * A client `<form onSubmit>` with no method and no action is, until React attaches its handler,
 * the browser's own form: pressed on a slow load it submits as a GET to the current URL and carries
 * every named field into the address, the history and a server log (measured in Chrome with the
 * page's scripts held: `/login?email=...`, and the careers application's name, address and honeypot).
 * `ClientForm` (`components/ui/client-form.tsx`) is the one home of the answer, `method="dialog"`,
 * whose native submit is a no-op outside a `<dialog>`; this is the guard that keeps a NEW form from
 * being the next one that leaks.
 *
 * WHAT A RAW `<form>` MUST DO: name its own answer to a native submit, which is one of
 *   - `action`: a Server Function or a URL, a form that works before hydration by design (the account
 *     menu's Sign out);
 *   - `method="get"`: a search that is meant to be a link (the admin's account search);
 *   - `method="dialog"`: the guard itself, which `ClientForm` writes once.
 * Anything else is refused, and the sentence says what to reach for. The lab (`src/app/(dev)`) is
 * outside it: its forms are demos on a keyed page, with nothing typed into them worth protecting.
 *
 * The scan reads JSX, not text, so a `<form` in a comment or a string is never counted. It cannot see
 * a form built by `document.createElement("form")` (the export download builds its own POST, with
 * `method` set, on purpose), nor one a spread hands its attributes to.
 */

const ROOT = process.cwd();
const SKIP = /\.test\.tsx?$|\.d\.ts$|^src\/app\/\(dev\)\//;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx$/.test(rel) && !SKIP.test(rel))
    .sort();
}

type RawForm = { line: number; named: boolean };

/** A JSX attribute's string value when it is a plain literal (`method="get"`), else null. */
function literal(attribute: ts.JsxAttribute): string | null {
  const init = attribute.initializer;
  if (!init) return null;
  if (ts.isStringLiteral(init)) return init.text;
  if (
    ts.isJsxExpression(init) &&
    init.expression &&
    ts.isStringLiteralLike(init.expression)
  ) {
    return init.expression.text;
  }
  return null;
}

/** Every raw `<form>` in one source, and whether it names its own native answer. */
function rawForms(text: string, name = "source.tsx"): RawForm[] {
  const source = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: RawForm[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(source) === "form"
    ) {
      let named = false;
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const key = attribute.name.getText(source);
        if (key === "action") named = true;
        if (key === "method") {
          const value = literal(attribute)?.toLowerCase();
          if (value === "get" || value === "dialog") named = true;
        }
      }
      found.push({
        line:
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        named,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("the scan sees what it should", () => {
  it("refuses a form that names nothing, however its attributes are dressed", () => {
    for (const jsx of [
      `<form onSubmit={submit} className="a">x</form>`,
      `<form noValidate onSubmit={(e) => e.preventDefault()}>x</form>`,
      `<form {...props}>x</form>`,
      `<form method="post" onSubmit={submit}>x</form>`,
      `<form method={method} onSubmit={submit}>x</form>`,
      `<form />`,
    ]) {
      const found = rawForms(`const A = () => (${jsx});`);
      expect(found, jsx).toHaveLength(1);
      expect(found[0].named, jsx).toBe(false);
    }
  });

  it("lets a form that names its own answer stand", () => {
    for (const jsx of [
      `<form action={signOut}>x</form>`,
      `<form action="/search" method="post">x</form>`,
      `<form method="get" className="flex">x</form>`,
      `<form method={"GET"}>x</form>`,
      `<form method="dialog" {...props} />`,
    ]) {
      const found = rawForms(`const A = () => (${jsx});`);
      expect(found, jsx).toHaveLength(1);
      expect(found[0].named, jsx).toBe(true);
    }
  });

  it("counts a form and never a component, a comment or a string", () => {
    expect(
      rawForms(`const A = () => <ClientForm onSubmit={s}>x</ClientForm>;`),
    ).toEqual([]);
    expect(rawForms(`const A = () => <Form {...form}>x</Form>;`)).toEqual([]);
    expect(rawForms(`// <form onSubmit={s}>\nconst a = "<form>";`)).toEqual([]);
    expect(
      rawForms(
        `const A = () => (\n  <div>\n    <form onSubmit={s}>\n      <form action={a} />\n    </form>\n  </div>\n);`,
      ),
    ).toEqual([
      { line: 3, named: false },
      { line: 4, named: true },
    ]);
  });
});

/**
 * ★ THE TREE SCAN HAS A BUDGET OF ITS OWN (crumbs-83, the Orchestrator's gate 29). It reads and parses every file under
 * `src` (about 1,600, through the TypeScript parser), CPU work that grows with the tree: under a second alone, 2.7 s beside
 * the other policy scans (measured), and the history scan's 5.4 s in gate 29 past vitest's 5 s default for a test that
 * waits on nothing, with another lane's build on the machine. Every test here gets the budget. A budget, not a timing
 * claim: a scan that finds an offender still fails at once on its own assertion, and one that hangs fails at the budget
 * (`no-em-dash-policy.test.ts`'s note: the first scan given one).
 */
const SCAN_BUDGET_MS = 60_000;
vi.setConfig({ testTimeout: SCAN_BUDGET_MS });

describe("no form pressed before hydration sends its fields into the address", () => {
  const files = filesUnder("src");

  it("scanned the product's source, and the one home of the guard", () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files).toContain("src/components/ui/client-form.tsx");
  });

  it("every `<form>` is a `ClientForm`, or names its own native answer", () => {
    const offenders = files.flatMap((rel) =>
      rawForms(readFileSync(join(ROOT, rel), "utf8"), rel)
        .filter((form) => !form.named)
        .map((form) => `${rel}:${form.line}`),
    );
    expect(
      offenders,
      'a `<form>` with no action and no method is the browser\'s own GET until React attaches: use `<ClientForm>` (components/ui/client-form.tsx), or give the form an `action` (a Server Function) or `method="get"` if a native submit is what it is for',
    ).toEqual([]);
  });
});
