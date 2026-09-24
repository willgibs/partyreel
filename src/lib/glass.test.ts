// @contract-for: src/app/globals.css
// @contract-for: src/lib/glass.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GLASS,
  GLASS_BEHIND,
  GLASS_MARK,
  GLASS_MARK_LIT,
  GLASS_TOKENS,
  NOT_GLASS,
} from "@/lib/glass";

/**
 * THE GLASS MATERIAL'S CONTRACT (the `glass` board, ruled 2026-09-20:
 * `material=crystal`, `edge=double`).
 *
 * ★ FUNCTION ONLY, WITH ONE EXCEPTION THAT IS ALSO FUNCTION. Nothing here reads
 * whether Crystal LOOKS right; Will retunes a number without asking a test. What
 * is held is that the material has exactly one home, that every surface reaches
 * it through the one utility, and that it never lands on a floating panel. The
 * token VALUES are pinned because `lib/glass.ts` and `globals.css` are two files
 * describing one material, and a silent drift between them is the failure this
 * whole round existed to end — not because 42px is sacred.
 *
 * ★ AND THE FLOATING LAYER'S REFUSAL STANDS. `floating-layer.test.ts` already
 * refuses a `backdrop-filter` inside its own family; this is the same fence from
 * the glass side, so a rename on either side leaves the rule standing.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const CSS = read("src/app/globals.css");

describe("the glass material has ONE home", () => {
  it("declares every token in globals.css at the value lib/glass.ts names", () => {
    for (const [token, value] of Object.entries(GLASS_TOKENS)) {
      // The declaration, anywhere in the sheet: `--glass-blur: 42px;`
      const decl = new RegExp(
        `${token.replace(/-/g, "\\-")}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`,
      );
      expect(CSS, `${token} must be declared as ${value}`).toMatch(decl);
    }
  });

  it("compiles the material as Tailwind utilities in the ENTRY sheet", () => {
    // A `@utility` only compiles in the sheet Tailwind is imported from (the
    // ladder's precedent), which is why globals.css is the one file released for
    // this block rather than theme.css or a component sheet.
    for (const name of [
      GLASS,
      "glass-mark",
      GLASS_BEHIND,
      GLASS_MARK_LIT,
    ] as const) {
      expect(CSS, `@utility ${name} must live in globals.css`).toMatch(
        new RegExp(`@utility\\s+${name}\\s*\\{`),
      );
    }
    expect(GLASS_MARK).toBe(`${GLASS} glass-mark`);
  });

  it("builds the pane from the tokens, never from typed numbers", () => {
    const utility = CSS.slice(
      CSS.indexOf("@utility glass {"),
      CSS.indexOf("@utility glass-mark {"),
    );
    expect(utility).toContain("var(--glass-blur)");
    expect(utility).toContain("var(--glass-brightness)");
    expect(utility).toContain("var(--glass-saturate)");
    expect(utility).toContain("var(--glass-tint)");
    expect(utility).toContain("var(--glass-lip)");
    expect(utility).toContain("var(--glass-hairline)");
    // ★ The edges are INSET SHADOWS, never a border: a border changes the pane's
    // size, so every glass surface would be a different pane.
    expect(utility).toMatch(/box-shadow:\s*\n?\s*inset/);
    expect(utility).not.toMatch(/\bborder(-width)?\s*:/);
  });

  it("re-points ONE number for a mark, so a mark is the same material", () => {
    const mark = CSS.slice(
      CSS.indexOf("@utility glass-mark {"),
      CSS.indexOf("@utility glass-behind {"),
    );
    expect(mark).toContain("--glass-blur: var(--glass-blur-mark)");
    // Nothing else: a second tint or a second edge here would BE the second
    // treatment the ruling refused.
    expect(mark).not.toContain("background-color");
    expect(mark).not.toContain("box-shadow");
  });

  it("keeps the material dark in both themes (`paper=dark`)", () => {
    // Chrome over a photograph is chrome over a photograph whatever the page is
    // made of, so no --glass-* token may be redeclared under `.dark`.
    const start = CSS.indexOf("\n.dark {");
    expect(start).toBeGreaterThan(0);
    const dark = CSS.slice(start, CSS.indexOf("\n}", start));
    expect(dark).not.toContain("--glass-");
  });
});

/**
 * Comments say the word "Glass" all over the floating family (Will named a
 * direction after it in the `floating-surfaces` round), so the scan reads CODE.
 * Strip the comments and what is left is what actually ships.
 */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|\s)\/\/[^\n]*/g, " ");

describe("glass is media chrome, never a popover", () => {
  it("never reaches a floating primitive (the floating-layer contract's layer is opaque)", () => {
    // `floating-layer.test.ts` refuses a backdrop filter inside the panel block;
    // this is the same fence from the glass side, on the whole file, so the
    // material cannot arrive by a className a panel block scan does not read.
    const hits: string[] = [];
    for (const file of NOT_GLASS) {
      for (const m of code(read(file)).matchAll(
        /\bglass(?:-mark|-behind|-mark-lit)?\b/g,
      ))
        hits.push(`${file}: ${m[0]}`);
    }
    expect(
      hits,
      "glass on a floating panel: the floating-layer contract's layer is an opaque surface with a step and a ring",
    ).toEqual([]);
  });
});
