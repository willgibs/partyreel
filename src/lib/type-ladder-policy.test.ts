import ts from "typescript";
import { describe, expect, it } from "vitest";

import { cn, RADIUS_TOKENS, SHADOW_TOKENS, TYPE_STEPS } from "@/lib/utils";
import { read, sources } from "@/testing/source-tree";

/**
 * THE TYPE STEPS, RADIUS TOKENS AND SHADOW TOKENS STAY REACHABLE, AND NO CLASS
 * BESIDE THE HEADING FACE SILENTLY REPLACES ITS WEIGHT. Three silent failures,
 * and none is about how a step looks (the Library shows that):
 *
 * 1. A STEP `cn()` HAS NEVER HEARD OF. tailwind-merge does not read our
 *    stylesheet, so an unknown `text-*` falls into its `text-color` group and
 *    is dropped by any real colour in the same call: `cn("font-heading
 *    text-chapter text-white")` returned `font-heading text-white` until
 *    utils.ts declared the ladder. The custom radius tokens are the same trap:
 *    unknown to tailwind-merge, a token corner and a stock one both survive
 *    `cn()` and the stylesheet's alphabet picks. So are the two elevation
 *    shadows, filed under shadow colour: `cn("shadow-layer", "shadow-none")`
 *    kept both.
 *
 * 2. A NAME THE COLOR NAMESPACE ALREADY OWNS. Tailwind v4 resolves a `text-*`
 *    class as a COLOR before a font size, so a step named like a colour token
 *    (`--text-card` beside `--color-card`) is a size no className can reach.
 *
 * 3. A WEIGHT BESIDE THE HEADING FACE WINS. A stock `font-medium` or
 *    `font-semibold` beside `font-heading` beats the weight the utility
 *    carries, because Tailwind emits every custom `@utility` ahead of the stock
 *    ones: the class string names the heading face and the stylesheet's order
 *    paints a lighter one. It came back twice: the home's curation titles, fixed
 *    one by one, then two dozen at once, every card, sheet, dialog and popup
 *    title among them, found when the thin app headings looked wrong beside the
 *    heavier standard (2026-09-29). shadcn's generator writes a weight onto
 *    every title it adds, so it will again. The weight itself is a preference,
 *    not this test's: 700 today (globals.css), and a heading that should weigh
 *    something else is a change to the utility, which moves every heading at
 *    once.
 */
const theme = read("src/app/theme.css");

/**
 * Every `--text-<name>` declared in theme.css. The `--` filter drops the
 * companions: `--text-display--line-height` captures as `display--line-height`,
 * and a companion is not a step. `--text-color-*` is Tailwind's other namespace
 * under the same prefix, a colour only `text-*` reads (the warning's words,
 * a11y-halo), never a step.
 */
const declared = [...theme.matchAll(/^\s*--text-([a-z0-9-]+):\s/gm)]
  .map((m) => m[1])
  .filter((name) => !name.includes("--") && !name.startsWith("color-"));

describe("the type steps, radius tokens and shadow tokens", () => {
  it("are the same list theme.css and cn() are working from", () => {
    expect(
      declared.length,
      "no --text-* step found in theme.css",
    ).toBeGreaterThan(0);
    expect([...TYPE_STEPS].sort()).toEqual([...declared].sort());
  });

  it("teach cn() every radius token theme.css maps, so a token corner overrides a stock one", () => {
    // The custom tokens are the self-mapped lines of the theme block
    // (`--radius-tile: var(--radius-tile)`); the derived sm..2xl steps carry
    // Tailwind's own names and need no teaching.
    const custom = [
      ...theme.matchAll(/^\s*--radius-([a-z0-9-]+):\s*var\(--radius-\1\);/gm),
    ].map((m) => m[1]);
    expect([...RADIUS_TOKENS].sort()).toEqual([...custom].sort());
    for (const name of custom) {
      // The last class wins in both directions, never the stylesheet's alphabet.
      expect(cn("rounded-md", `rounded-${name}`)).toBe(`rounded-${name}`);
      expect(cn(`rounded-${name}`, "rounded-full")).toBe("rounded-full");
    }
  });

  it("★ teach cn() every shadow token theme.css maps, so a stock shadow and a token shadow resolve to the last written", () => {
    // The self-mapped `--shadow-*` lines of the theme block (`--shadow-layer: var(--shadow-layer)`): the
    // elevation contract's utilities, which tailwind-merge would otherwise file under shadow COLOUR.
    const custom = [
      ...theme.matchAll(/^\s*--shadow-([a-z0-9-]+):\s*var\(--shadow-\1\);/gm),
    ].map((m) => m[1]);
    expect(
      custom.length,
      "no --shadow-* token found in theme.css",
    ).toBeGreaterThan(0);
    expect([...SHADOW_TOKENS].sort()).toEqual([...custom].sort());
    // Every stock size a generator might write beside one, in both orders.
    for (const name of custom) {
      const token = `shadow-${name}`;
      expect(cn(token, "shadow-none")).toBe("shadow-none");
      expect(cn(token, "shadow-md")).toBe("shadow-md");
      expect(cn("shadow-md", token)).toBe(token);
      expect(cn("shadow-none", token)).toBe(token);
    }
    expect(cn("shadow-lift", "shadow-layer")).toBe("shadow-layer");
    // A shadow COLOUR is another property: it stays beside either.
    expect(cn("shadow-layer", "shadow-red-500")).toBe(
      "shadow-layer shadow-red-500",
    );
    // And the ring the shadow composes with is not the shadow's to remove.
    expect(cn("ring-1", "shadow-layer")).toBe("ring-1 shadow-layer");
  });

  it("give no step a name the color namespace already owns", () => {
    const colors = new Set(
      [...theme.matchAll(/^\s*--color-([a-z0-9-]+):\s/gm)].map((m) => m[1]),
    );
    const clashes = declared.filter((step) => colors.has(step));
    expect(clashes, clashes.join(", ")).toEqual([]);
  });
});

/* ── 3. The heading face's one weight ───────────────────────────────────── */

/**
 * Not scanned: tests (`sources()` skips them) and vendored source. The lab IS scanned (the lab revamp,
 * 2026-09-29, taking in crumbs-12's finding): a board draws production's type
 * for Will to judge, so a lighter weight beside the heading face on a board is
 * the same lie it is on a page, and three boards and the keyboard bench were
 * telling it.
 */
const VENDOR = /^src\/components\/vendor\//;

/** A class token's utility, variants and `!` stripped: `sm:!font-medium` is `font-medium`. */
const utility = (token: string) => token.split(":").at(-1)!.replace(/^!/, "");
const HEADING = "font-heading";
const WEIGHT =
  /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])$/;

/**
 * Every CLASS EXPRESSION in a file, as the string literals inside it: a JSX
 * `className`, a `cn()`/`cva()`/`clsx()` call outside one, and any lone string
 * literal (a class constant). Parsed rather than grepped, so a weight in a
 * branch of the same `cn()` counts (`variant === "quiet" && "font-normal"` was
 * one) and a comment naming the offence does not.
 */
function classExpressions(file: string): { line: number; strings: string[] }[] {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const literals = (node: ts.Node, into: string[] = []): string[] => {
    if (ts.isStringLiteralLike(node)) into.push(node.text);
    else if (ts.isTemplateExpression(node)) {
      into.push(
        node.head.text,
        ...node.templateSpans.map((s) => s.literal.text),
      );
    }
    ts.forEachChild(node, (child) => {
      literals(child, into);
    });
    return into;
  };
  const found: { line: number; strings: string[] }[] = [];
  const at = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  // A class expression is read whole and not entered again, so no literal is counted twice.
  const visit = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(source) === "className" &&
      node.initializer
    ) {
      found.push({ line: at(node), strings: literals(node.initializer) });
      return;
    }
    if (
      ts.isCallExpression(node) &&
      /^(?:cn|cva|clsx)$/.test(node.expression.getText(source))
    ) {
      found.push({ line: at(node), strings: literals(node) });
      return;
    }
    if (ts.isStringLiteralLike(node)) {
      found.push({ line: at(node), strings: [node.text] });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("the heading face's one weight", () => {
  const files = sources().filter((file) => !VENDOR.test(file));
  const withFace = files.flatMap((file) =>
    read(file).includes(HEADING)
      ? classExpressions(file)
          .filter(({ strings }) =>
            strings.some((s) => s.split(/\s+/).map(utility).includes(HEADING)),
          )
          .map((expr) => ({ ...expr, file }))
      : [],
  );

  it("found the heading face at all", () => {
    // A scan that finds no heading is a broken scan, not a clean site.
    expect(files.length, "the walk found no source").toBeGreaterThan(500);
    expect(
      withFace.length,
      "no class expression names font-heading",
    ).toBeGreaterThan(100);
  });

  it("never sets a weight beside font-heading, which would beat the utility's own", () => {
    const offenders = withFace.flatMap(({ file, line, strings }) => {
      const weights = strings
        .flatMap((s) => s.split(/\s+/))
        .filter((token) => WEIGHT.test(utility(token)));
      return weights.length ? [`${file}:${line} ${weights.join(" ")}`] : [];
    });
    expect(
      offenders,
      `A weight class beside font-heading replaces the face's one weight. Delete it; ` +
        `a heading that should weigh something else is the utility's to change:\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });
});
