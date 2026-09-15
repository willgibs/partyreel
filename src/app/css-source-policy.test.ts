import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Two Tailwind entries, one theme, two scans (the library round, 2026-09-02).
 *
 * globals.css is the production entry: it excludes the design lab and docs/
 * from its scan, so a utility used only by a lab specimen (or a class name
 * quoted in a doc) never reaches the stylesheet every page loads. The lab's
 * design.css is the second entry: it compiles the lab's own utilities from a
 * scan of the lab alone, REFERENCING theme.css for the tokens and the dark
 * variant. The trap this pins: a `@reference "globals.css"` from the lab drags
 * globals' `@source not` along and the lab compiles nothing (measured: 19
 * rules against 695). Nobody "simplifies" this back.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("the production entry (globals.css)", () => {
  const globals = read("src/app/globals.css");

  it("excludes the design lab and docs from its scan", () => {
    expect(globals).toContain('@source not "./(dev)/design";');
    expect(globals).toContain('@source not "../../docs";');
  });

  it("imports the theme from theme.css and declares no @theme of its own", () => {
    expect(globals).toContain('@import "./theme.css";');
    expect(globals).not.toMatch(/^@theme\b/m);
    expect(globals).not.toMatch(/^@custom-variant\b/m);
  });
});

describe("the theme (theme.css)", () => {
  const theme = read("src/app/theme.css");

  it("holds the @theme block and the dark variant", () => {
    expect(theme).toMatch(/^@theme inline \{/m);
    expect(theme).toMatch(/^@custom-variant dark /m);
  });

  it("emits nothing but the theme (no layers, no utilities, no rules on elements)", () => {
    const stripped = theme.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped).not.toMatch(/^@layer\b/m);
    expect(stripped).not.toMatch(/^@utility\b/m);
    expect(stripped).not.toMatch(/^@import\b/m);
    // The token VALUES (:root, .dark, .surface-paper, the lamp set) stay in
    // globals.css; this file only maps them into Tailwind's namespace.
    expect(stripped).not.toMatch(/^:root/m);
    expect(stripped).not.toMatch(/^\.dark\b/m);
    expect(stripped).not.toMatch(/--lamp-\d:/);
  });
});

describe("the lab entry (design.css)", () => {
  const lab = read("src/app/(dev)/design/design.css");

  it("references theme.css, never globals.css", () => {
    expect(lab).toContain('@reference "../../theme.css";');
    expect(lab).not.toContain('globals.css"');
  });

  it("compiles utilities from a scan of the lab alone", () => {
    // The lab's utilities live in a SUB-layer of `utilities` so a production
    // component's responsive class wins over the lab's copy of the unprefixed
    // one on a shared element (round four, 2026-09-15; see design.css).
    expect(lab).toContain(
      '@import "tailwindcss/utilities.css" layer(utilities.lab) source(none);',
    );
    expect(lab).toContain('@source "./";');
  });
});

describe("exactly two Tailwind entries", () => {
  it("no other stylesheet imports tailwindcss or its utilities", () => {
    const entries: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(ROOT, dir), {
        withFileTypes: true,
      })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (entry.name.endsWith(".css")) {
          const css = read(rel);
          if (/^@import "tailwindcss(\/utilities\.css)?"/m.test(css))
            entries.push(rel);
        }
      }
    };
    walk("src");
    expect(entries.sort()).toEqual([
      "src/app/(dev)/design/design.css",
      "src/app/globals.css",
    ]);
  });
});
