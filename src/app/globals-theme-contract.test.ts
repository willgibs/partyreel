import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The surface-paper theme contract (the mixed-theme chapter mechanism).
 * Marketing forces its themes (cinema = dark wrapper, paper pages/chapters =
 * `.surface-paper`), and the whole mechanism is three facts (two in globals.css,
 * the variant in theme.css) a well-meaning refactor could silently drop:
 *
 *  1. the light token block is aliased to `.surface-paper` (subtree re-entry
 *     to the paper theme inside `.dark`),
 *  2. the dark variant carries the `:not(.surface-paper *)` guard (shadcn
 *     `dark:` utilities must not fire inside paper subtrees; the class is
 *     deliberately NOT `.light` — next-themes puts class="light" on <html>),
 *  3. `.surface-paper` fixes color-scheme to light (native widgets).
 *
 * Plus the inverse safety: `.dark` must never be aliased the same way, and
 * PaperChapter must never carry data-mkt-skin (body:has(...) chrome keys off
 * that attribute at PAGE level; a chapter would flip the whole body).
 */

const globals = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("globals.css surface-paper contract", () => {
  it("aliases the light token block to .surface-paper", () => {
    expect(globals).toMatch(/^:root,\s*\.surface-paper \{/m);
  });

  it("guards the dark variant against paper subtrees", () => {
    // The variant moved to theme.css with the @theme block (the library round,
    // 2026-09-02) so the design lab's own Tailwind entry can share it; the
    // guard is the same line.
    const theme = readFileSync(
      join(process.cwd(), "src/app/theme.css"),
      "utf8",
    );
    expect(theme).toContain(
      "@custom-variant dark (&:is(.dark *):not(.surface-paper *));",
    );
  });

  it("fixes light color-scheme on paper subtrees", () => {
    expect(globals).toMatch(/\.surface-paper \{\s*color-scheme: light;\s*\}/);
  });

  it("never aliases the dark block alongside surface-paper", () => {
    expect(globals).not.toMatch(
      /\.dark\s*,\s*\.surface-paper|\.surface-paper\s*,\s*\.dark/,
    );
  });
});

describe("PaperChapter doctrine", () => {
  it("never carries data-mkt-skin (page-level chrome keys off it)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/marketing/system/paper-chapter.tsx"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(source).not.toContain("data-mkt-skin");
  });
});

/**
 * THE LAMP SET IS LIGHT, NEVER UI (ruled 2026-09-01, at the light-system
 * promotion). The identity is achromatic and media-forward; --lamp-1..5 exist
 * so the LIGHT in a room can carry colour while the room does not. The failure
 * this prevents is gradual and plausible-looking: a `color: var(--lamp-1)` on
 * one "accent" label, then a border, then a badge, and the achromatic ruling is
 * gone with nobody having decided to reverse it.
 *
 * Two mechanisms, deliberately different in kind:
 *   1. STRUCTURAL — the block is not in `@theme`, so Tailwind generates no
 *      `bg-lamp-1` / `text-lamp-1` utility and the tokens are unreachable from
 *      a className. The absence IS the guard; the test below pins the absence.
 *   2. THIS TEST — in CSS, a --lamp-* reference may only land in a gradient
 *      (`background` / `background-image`) or in another custom property that
 *      re-exports it (--mkt-confetti-*, the engine's --glw-c*). A `color:`,
 *      `border-color:`, `fill:` or flat `background-color:` fails here.
 */
describe("the lamp set is light, never UI", () => {
  const marketing = readFileSync(
    join(process.cwd(), "src/app/(marketing)/marketing.css"),
    "utf8",
  );
  const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
  // property: <anything containing var(--lamp-N)>, bounded by ; { }
  // ★ THE PROPERTY GROUP IS `-{0,2}`, NOT `--?`. `--?` means "a hyphen, then an
  // optional hyphen", so it REQUIRES a leading hyphen and matched ONLY custom
  // properties: `color: var(--lamp-1)` sailed straight through the guard whose
  // entire job is to catch it. Caught by deliberately injecting the violation
  // (2026-09-01); the test below still passed. Never trust a fence you have not
  // watched fail.
  const USE =
    /(?:^|[;{}])\s*(-{0,2}[a-zA-Z][\w-]*)\s*:([^;{}]*var\(--lamp-[^;{}]*)/g;
  const ALLOWED = new Set(["background", "background-image"]);

  it("declares the five exactly once, in globals.css, never inside theme.css's @theme", () => {
    // The @theme block moved to theme.css (the library round, 2026-09-02); the
    // lamps stay in globals.css, so no bg-lamp-N / text-lamp-N utility can exist.
    const theme = strip(
      readFileSync(join(process.cwd(), "src/app/theme.css"), "utf8"),
    );
    for (let n = 1; n <= 5; n++) {
      const decl = new RegExp(`^\\s*--lamp-${n}:`, "gm");
      expect(
        strip(globals).match(decl)?.length,
        `--lamp-${n} declarations`,
      ).toBe(1);
      expect(strip(marketing)).not.toMatch(decl);
      expect(theme, `--lamp-${n} inside theme.css`).not.toMatch(decl);
    }
    // Not in @theme: an @theme entry would emit bg-lamp-N / text-lamp-N
    // utilities, which is exactly the reach this rule denies. Brace-matched in
    // theme.css, not sliced to the next known directive.
    const start = theme.indexOf("@theme inline {");
    expect(start, "@theme inline block not found").toBeGreaterThan(-1);
    let depth = 0;
    let end = start;
    for (let k = theme.indexOf("{", start); k < theme.length; k++) {
      if (theme[k] === "{") depth++;
      else if (theme[k] === "}" && --depth === 0) {
        end = k;
        break;
      }
    }
    expect(theme.slice(start, end)).not.toMatch(/--lamp-\d/);
  });

  it("uses them only in gradients or in a re-exporting custom property", () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const css of [strip(globals), strip(marketing)]) {
      for (const m of css.matchAll(USE)) {
        seen++;
        const prop = m[1];
        if (prop.startsWith("--") || ALLOWED.has(prop)) continue;
        offenders.push(`${prop}: ${m[2].trim().slice(0, 60)}`);
      }
    }
    // A guard that matches nothing passes silently. Pin that it looked.
    expect(seen, "no --lamp-* uses found at all").toBeGreaterThanOrEqual(5);
    expect(
      offenders,
      `--lamp-* is LIGHT, never UI. Reached from a non-gradient property:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
