import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The marketing library page is a specimen sheet of PRODUCTION imports, never a
 * board: it may import only production modules and the lab's reference kit,
 * declares no component of its own, and wears no lab-local treatment. Which
 * components it (and every other library page) renders is pinned by the
 * component index in ../rules/rules-annotations.test.ts, derived from the
 * pages' imports; a new component gets a specimen or a reasoned entry in
 * COMPONENT_NOTES, never silence.
 */
const ROOT = process.cwd();
const DIR = "src/app/(dev)/design/marketing";
const PAGE = readFileSync(join(ROOT, DIR, "page.tsx"), "utf8");
const DEMOS = readFileSync(join(ROOT, DIR, "marketing-demos.tsx"), "utf8");
const ENTRIES = readFileSync(join(ROOT, DIR, "gallery-demos.tsx"), "utf8");
const SOURCE = [PAGE, DEMOS, ENTRIES].join("\n");

const SPECIFIERS = [
  ...SOURCE.matchAll(/from "([^"]+)"/g),
  ...SOURCE.matchAll(/import\("([^"]+)"\)/g),
].map((m) => m[1]);

describe("the marketing library page", () => {
  it("imports only production modules and the reference kit", () => {
    expect(SPECIFIERS.length).toBeGreaterThan(20);
    const allowed = [
      /^@\/components\//,
      /^@\/lib\//,
      /^next\//,
      /^react$/,
      /^lucide-react$/,
      /^\.\.\/reference\//,
      /^\.\.\/gallery\//,
      /^\.\/marketing-demos$/,
      /^\.\/gallery-demos$/,
    ];
    const offenders = SPECIFIERS.filter(
      (s) => !allowed.some((re) => re.test(s)),
    );
    expect(offenders, "a specifier outside the allow-list").toEqual([]);
    expect(
      SPECIFIERS.some((s) => s.includes("sandbox")),
      "a sandbox import",
    ).toBe(false);
  });

  it("declares no component of its own", () => {
    // One default export (the page) and the demo island's exported wrappers,
    // which exist only to add Replay / Fire / Open around a production
    // component. A capitalised local function in the page is a board creeping in.
    const pageDecls = [
      ...PAGE.matchAll(
        /^(?:export )?(?:default )?(?:async )?function ([A-Z]\w*)/gm,
      ),
    ].map((m) => m[1]);
    expect(pageDecls).toEqual(["MarketingLibraryPage"]);
    const demoDecls = [...DEMOS.matchAll(/^export function ([A-Z]\w*)/gm)].map(
      (m) => m[1],
    );
    for (const name of demoDecls) expect(name, name).toMatch(/Demo$/);
    // The entry module is a DECLARATION (an array of specimens), so a
    // capitalised function there is the same board creeping in one file over.
    const entryDecls = [
      ...ENTRIES.matchAll(
        /^(?:export )?(?:default )?(?:async )?function ([A-Z]\w*)/gm,
      ),
    ].map((m) => m[1]);
    expect(entryDecls, "gallery-demos.tsx declares a component").toEqual([]);
  });

  it("wears no lab-local treatment", () => {
    expect(
      SOURCE.includes("data-lit"),
      "data-lit is a sandbox ruling, not a specimen",
    ).toBe(false);
  });
});
