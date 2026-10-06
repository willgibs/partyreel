import ts from "typescript";
import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

/**
 * EVERY SIGN-OUT NAMES ITS SCOPE (the rule `(auth)/actions.ts` holds, build 20's red-team; enforced here since
 * build 33's red-team found the door's "Use a different email" calling a bare `signOut()`).
 *
 * auth-js's bare `signOut()` is GLOBAL: it revokes the refresh token of every session the account holds, on
 * every device. An operator who pressed "Use a different email" at a guest door lost her admin portal's
 * session with it and had to pass Google and her second factor again. So a call names its scope, and the
 * scope is a choice somebody made: `local` for this device (the menu's Sign out, the guest header, the
 * door), `global` only for Sign out everywhere, which lives in /account and says so.
 *
 * The scan reads the AST, not text, so a `signOut(` in a comment or a string is never counted, and a mock's
 * `signOut: async () => …` is a property, not a call. A scope handed in through a variable (`signOut(opts)`)
 * is refused too: the scan cannot see it, and neither can a reviewer.
 */

/** Whether a call's first argument is an object literal that names `scope` itself. */
function namesScope(call: ts.CallExpression): boolean {
  const options = call.arguments[0];
  if (!options || !ts.isObjectLiteralExpression(options)) return false;
  return options.properties.some(
    (property) =>
      (ts.isPropertyAssignment(property) ||
        ts.isShorthandPropertyAssignment(property)) &&
      property.name.getText() === "scope",
  );
}

/** The line of every `signOut(…)` call in one source that does not name its scope. */
function unscopedSignOuts(text: string, name = "source.tsx"): number[] {
  const source = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const lines: number[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const called = ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : ts.isIdentifier(callee)
          ? callee.text
          : null;
      if (called === "signOut" && !namesScope(node)) {
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

describe("the scan sees what it should", () => {
  it("refuses a sign-out that names no scope, however it is reached", () => {
    for (const code of [
      `await supabase.auth.signOut();`,
      `await createClient().auth.signOut();`,
      `void client.auth.signOut({});`,
      `await supabase.auth.signOut(options);`,
      `const { signOut } = supabase.auth; await signOut();`,
    ]) {
      expect(unscopedSignOuts(code), code).toHaveLength(1);
    }
  });

  it("lets a sign-out that names its scope stand, and never counts a mock or a word", () => {
    for (const code of [
      `await supabase.auth.signOut({ scope: "local" });`,
      `await supabase.auth.signOut({ scope: "global" });`,
      `return supabase.auth.signOut({ scope });`,
      `const auth = { signOut: async () => ({ error: null }) };`,
      `// a bare signOut() is global`,
      `const words = "call signOut() here";`,
    ]) {
      expect(unscopedSignOuts(code), code).toEqual([]);
    }
  });
});

describe("every sign-out in the app names its scope", () => {
  it("★ finds no bare signOut(): auth-js reads it as every session, on every device", () => {
    // Only a file that names `signOut` can call it, so only those are parsed; the rule's own home is one.
    const naming = sources().filter((rel) => read(rel).includes("signOut"));
    expect(naming).toContain("src/app/(auth)/actions.ts");
    const found = naming.flatMap((rel) =>
      unscopedSignOuts(read(rel), rel).map((line) => `${rel}:${line}`),
    );
    expect(
      found,
      `A sign-out with no scope ends every session the account holds, the operator's portal included. Name it: { scope: "local" } for this device, "global" only for Sign out everywhere ((auth)/actions.ts).`,
    ).toEqual([]);
  });
});
