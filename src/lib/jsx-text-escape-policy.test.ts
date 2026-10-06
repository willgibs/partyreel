import ts from "typescript";
import { describe, expect, it } from "vitest";

import { read, sources } from "@/testing/source-tree";

/**
 * AN ESCAPE IN JSX TEXT SHIPS AS ITS OWN SIX CHARACTERS (build 23's red-team, NIT-11: the Forensics holds
 * table printed every media id followed by a literal backslash-u2026).
 *
 * JSX text is not a JavaScript string: `{id.slice(0, 8)}…` between two tags renders the backslash, the
 * u and the four digits, where the same escape inside a string or a template (`{`${id}…`}`) is the
 * ellipsis. Every other file writes the character itself or keeps the escape inside a string, so the scan
 * reads each component's JSX text, as the TypeScript parser sees it, for a Unicode or hex escape.
 */

/** A Unicode escape (`…`, `\u{1F600}`) or a hex one (`\x41`): never meant literally in words. */
const ESCAPE = /\\(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2})/;

/** Every JSX text in `file` that carries an escape, as `src/<path>: "<the line>"`. */
function escapesIn(file: string): string[] {
  const text = read(file);
  if (!ESCAPE.test(text)) return [];
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node) && ESCAPE.test(node.getText(source))) {
      const line = node
        .getText(source)
        .split("\n")
        .find((l) => ESCAPE.test(l));
      found.push(`${file}: "${line?.trim() ?? ""}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("an escape in JSX text", () => {
  it("renders as its own characters: the shape the scan refuses (when this fails, the scan can retire)", () => {
    const source = ts.createSourceFile(
      "probe.tsx",
      "export const a = (id: string) => <td>{id}\\u2026</td>;",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const texts: string[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isJsxText(node)) texts.push(node.text);
      ts.forEachChild(node, visit);
    };
    visit(source);
    // The parser hands the text over raw: six characters, never the ellipsis.
    expect(texts).toEqual(["\\u2026"]);
  });

  it("appears in no component: write the character, or keep the escape inside a string", () => {
    const files = sources().filter((file) => file.endsWith(".tsx"));
    expect(files.length, "the walk found no components").toBeGreaterThan(300);
    const found = files.flatMap(escapesIn);
    expect(
      found,
      `Each of these ships a backslash escape as literal text. Write the character itself (…), or keep the ` +
        `escape inside a string or a template ({\`\${id}\\u2026\`}):\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
