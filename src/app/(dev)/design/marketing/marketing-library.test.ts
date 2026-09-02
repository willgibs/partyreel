import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The marketing library page is a specimen sheet of PRODUCTION imports, never a
 * board: it may import only production modules and the lab's reference kit,
 * declares no component of its own, wears no lab-local treatment, and shows
 * every file of the marketing system and the shared section atoms (a new
 * component gets a specimen or a reasoned entry in UNSPECIMENED, never silence).
 */
const ROOT = process.cwd();
const DIR = "src/app/(dev)/design/marketing";
const PAGE = readFileSync(join(ROOT, DIR, "page.tsx"), "utf8");
const DEMOS = readFileSync(join(ROOT, DIR, "marketing-demos.tsx"), "utf8");
const SOURCE = PAGE + "\n" + DEMOS;

const SPECIFIERS = [
  ...SOURCE.matchAll(/from "([^"]+)"/g),
  ...SOURCE.matchAll(/import\("([^"]+)"\)/g),
].map((m) => m[1]);

/** Files under the two directories that are deliberately not rendered. */
const UNSPECIMENED: Record<string, string> = {
  "system/web-analytics":
    "a document singleton mounted once in the marketing layout; a second mount doubles every event, so the page lists it as text",
};

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
      /^\.\/marketing-demos$/,
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
  });

  it("wears no lab-local treatment", () => {
    expect(
      SOURCE.includes("data-lit"),
      "data-lit is a sandbox ruling, not a specimen",
    ).toBe(false);
  });

  it("shows every system component and shared section atom", () => {
    const files = (dir: string) =>
      readdirSync(join(ROOT, "src/components/marketing", dir))
        .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
        .map((f) => `${dir}/${f.replace(/\.tsx$/, "")}`);
    const wanted = [...files("system"), ...files("sections/shared")];
    expect(wanted.length).toBeGreaterThan(15);
    const missing = wanted.filter(
      (rel) =>
        !UNSPECIMENED[rel] &&
        !SPECIFIERS.includes(`@/components/marketing/${rel}`),
    );
    expect(
      missing,
      "a marketing component without a specimen (or an UNSPECIMENED reason)",
    ).toEqual([]);
    for (const rel of Object.keys(UNSPECIMENED)) {
      expect(
        wanted,
        `UNSPECIMENED names a file that no longer exists: ${rel}`,
      ).toContain(rel);
    }
  });
});
