import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The marketing catalog page is a specimen sheet of PRODUCTION imports, never
 * a board: it may import only production modules and the lab's reference kit,
 * declares no component of its own, and wears no lab-local treatment. The
 * entry module is read too, because the specimens live in gallery-demos.tsx,
 * so an allow-list that only covered page.tsx would stop guarding the imports
 * that matter.
 */
const ROOT = process.cwd();
const DIR = "src/app/(dev)/design/(shell)/library/marketing";
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
      // The reference kit and the gallery model, reached through the alias
      // since the family pages moved under the shell (2026-09-15).
      /^@\/app\/\(dev\)\/design\/(reference|gallery|_data|\(shell\)\/_shell)\//,
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
      "data-lit belongs to the surfaces that wear it, not to a specimen sheet",
    ).toBe(false);
  });
});
