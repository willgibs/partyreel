import { createRequire } from "node:module";

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";

import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { read, sources } from "@/testing/source-tree";

/**
 * THE SPACE BEFORE A WORD SURVIVES THE BUILD (build 20's red-team, 2026-09-29: "30days" in the
 * host's Remove confirm and on the reports page).
 *
 * Next's SWC, the compiler every build ships through, drops the leading space of a JSX text that
 * follows an expression or an element when that text runs over several lines AND holds an HTML
 * entity: `for {N} days, then⏎ a dismissal&apos;s Undo` compiles to
 * `"for ", N, "days, then a dismissal's Undo"`. The same words on one line, or with no entity,
 * keep it. This runner's own JSX transform keeps it every time, so a component rendered the usual
 * way here reads "30 days" while the build ships "30days": nothing below renders through this
 * runner's transform. The sites compile through SWC itself, and the scan refuses the shape SWC
 * mis-compiles.
 *
 * ★ A `{" "}` IS NOT THE FIX, because prettier folds it back into the text wherever the line fits
 * (it did, on both sites, the first time). What holds is keeping the space out of such a text: the
 * value and its word as one string (`{`${N} days`}`), the entity written as its character (’ for
 * `&rsquo;`), or the space moved inside the element before it.
 */

const require = createRequire(import.meta.url);

type Swc = {
  loadBindings: () => Promise<unknown>;
  transform: (source: string, options: object) => Promise<{ code: string }>;
};
// The transform `next build` runs (and `next/jest` wraps), bindings and all.
const swc = require("next/dist/build/swc/index.js") as Swc;

/** SWC's JSX output for `source` as CommonJS, the options a Next build uses for JSX. */
async function compile(source: string): Promise<string> {
  const { code } = await swc.transform(source, {
    filename: "shipped.tsx",
    jsc: {
      parser: { syntax: "typescript", tsx: true },
      transform: { react: { runtime: "automatic" } },
      target: "es2022",
    },
    module: { type: "commonjs" },
  });
  return code;
}

/**
 * The words the build ships for the JSX in `file` that holds `marker`: the innermost element or
 * fragment around it, compiled by SWC and rendered to markup with `scope` for its expressions.
 */
async function shipped(
  file: string,
  marker: string,
  scope: Record<string, unknown>,
): Promise<string> {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let jsx: ts.Node | undefined;
  const visit = (node: ts.Node): void => {
    if (
      (ts.isJsxElement(node) || ts.isJsxFragment(node)) &&
      node.getText(source).includes(marker)
    ) {
      jsx = node; // descendants are visited after their parent, so the innermost wins
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!jsx) throw new Error(`${file}: no JSX holds "${marker}"`);
  const names = Object.keys(scope);
  const code = await compile(
    `module.exports = (${names.join(", ")}) => (${jsx.getText(source)});`,
  );
  const mod: { exports: unknown } = { exports: {} };
  new Function("require", "module", "exports", code)(require, mod, mod.exports);
  const render = mod.exports as (...values: unknown[]) => ReactElement;
  return renderToStaticMarkup(render(...names.map((name) => scope[name])));
}

/* ── The shape SWC mis-compiles ────────────────────────────────────────────── */

const ENTITY = /&(?:#\d+|#x[0-9a-f]+|[a-z]+);/i;

/**
 * Every JSX text in `file` that SWC would ship without its leading space: after a sibling, its
 * first line opening on a space, running over several lines, with an entity in it.
 */
function spaceLosers(file: string): string[] {
  const text = read(file);
  if (!ENTITY.test(text)) return [];
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      node.children.forEach((child, i) => {
        if (i === 0 || !ts.isJsxText(child)) return;
        const raw = text.slice(child.pos, child.end);
        if (/^[ \t]+\S/.test(raw) && raw.includes("\n") && ENTITY.test(raw)) {
          found.push(`${file}: "${raw.split("\n")[0].trim()}"`);
        }
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/**
 * Found and not yet fixed, each with where it shows. Empty is the steady state: an entry is a
 * debt, and the scan fails once its site is fixed until the entry goes too.
 */
const DEBTS: Readonly<Record<string, string>> = {};

describe("the space before a word survives the build", () => {
  beforeAll(async () => {
    await swc.loadBindings();
  });

  it("is still dropped by SWC in the shape the scan refuses (when this fails, the scan can retire)", async () => {
    const flat = async (source: string) =>
      (await compile(source)).replace(/\s+/g, " ");
    expect(
      await flat(
        "export const a = (N: number) => <p>for {N} days, then\n  a dismissal&apos;s Undo</p>;",
      ),
    ).toContain(`N, "days, then a dismissal's Undo"`);
    // ...and the value with its word, as one string, leaves no leading space to drop.
    expect(
      await flat(
        "export const a = (N: number) => <p>for {`${N} days`}, then\n  a dismissal&apos;s Undo</p>;",
      ),
    ).toContain('"for ", `${N} days`, ", then a dismissal\'s Undo"');
  });

  it("ships the host's Remove confirm and the reports lede with the window's space", async () => {
    const days = `${RECENTLY_DELETED_WINDOW_DAYS} days`;
    const scope = { RECENTLY_DELETED_WINDOW_DAYS };
    const confirm = await shipped(
      "src/components/shared/media-lightbox-parts/actions.tsx",
      "moves to Deleted",
      scope,
    );
    expect(confirm).toContain(`restore it for ${days}. Guests`);
    const lede = await shipped(
      "src/app/admin/reports/page.tsx",
      "Undo brings it back for",
      scope,
    );
    expect(lede).toContain(`back for ${days}, then the purge`);
    expect(lede).toContain(`for the same ${days}. A reported person`);
  });

  it("finds no JSX text elsewhere that would ship without its leading space", () => {
    // The lab and the Library are scanned too (the lab revamp, 2026-09-29, taking in crumbs-12's finding): a
    // board's words ship on the same build, and the old toolbox read "sandbox/<name>/renders bare", this very bug.
    const files = sources().filter((file) => file.endsWith(".tsx"));
    expect(files.length, "the walk found no components").toBeGreaterThan(300);
    const found = files.flatMap(spaceLosers);
    const unpaid = found.filter((hit) => !(hit in DEBTS));
    expect(
      unpaid,
      `SWC ships each of these without the space before its first word. Keep the space out of ` +
        `the text (prettier folds a {" "} back in): the value and its word as one string, the ` +
        `entity as its character, or the space inside the element before it:\n${unpaid.join("\n")}`,
    ).toEqual([]);
    const paid = Object.keys(DEBTS).filter((debt) => !found.includes(debt));
    expect(paid, `fixed, so the debt goes too: ${paid.join(", ")}`).toEqual([]);
  });
});
