import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISPLAY_GROUND, DISPLAY_TOKENS, GROUNDS } from "./ground-list";

/**
 * THE BRAND KIT NAMES EVERY GROUND THE STYLESHEET DECLARES, AND THE TOKENS THE LAST ROUND ADDED (crumbs-55: the
 * kit listed four grounds and no `--signal` or `--display*` after identity r2 wired `layers=display`, and nothing
 * went red, because nothing held it to `globals.css`).
 *
 * What is contract here: the kit's list of grounds IS the set of token blocks `globals.css` declares (a `.dark` or a
 * `.surface-*` that declares `--background`, in whole), the display's tokens ARE the `--display*` it declares, and
 * the page prints `--signal`. How a ground is drawn is the page's, and tuned freely.
 */

const ROOT = process.cwd();
const FOUNDATIONS = "src/app/(dev)/design/(shell)/library/foundations";
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const globals = read("src/app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every top-level block of the stylesheet: the line its `{` opens on, and what it declares. */
const blocks = [...globals.matchAll(/\n([^\n{}@]+)\{([^{}]*)\}/g)].map(
  ([, selector, body]) => ({ selector: selector.trim(), body }),
);

describe("the grounds", () => {
  it("lists every ground globals.css declares, and no other", () => {
    const declared = blocks
      .filter(({ body }) => /(^|[;\s])--background\s*:/.test(body))
      .map(({ selector }) => selector)
      .filter((selector) => /^\.(dark|surface-[a-z]+)$/.test(selector));
    expect(declared.length, "no ground blocks found: the parse is broken").toBe(
      5,
    );
    expect(GROUNDS.map((g) => g.selector).sort()).toEqual([...declared].sort());
  });

  it("wears the class it names, so a tile reads that ground's own tokens", () => {
    for (const { selector, wears } of GROUNDS)
      expect(wears.split(" ")).toContain(selector.slice(1));
  });

  it("states each ground once, in a line", () => {
    expect(new Set(GROUNDS.map((g) => g.id)).size).toBe(GROUNDS.length);
    for (const { name, worn } of GROUNDS) {
      expect(name.trim()).not.toBe("");
      expect(worn.trim()).not.toBe("");
    }
  });
});

describe("the display's tokens", () => {
  it("are every --display* custom property globals.css declares", () => {
    const declared = new Set(
      [...globals.matchAll(/(--display(?:-[a-z]+)?)\s*:/g)].map(([, t]) => t),
    );
    expect(declared.size, "no --display tokens found").toBeGreaterThan(1);
    expect(
      [DISPLAY_GROUND, ...DISPLAY_TOKENS.map((t) => t.token)].sort(),
    ).toEqual([...declared].sort());
  });
});

describe("the recording red", () => {
  it("is in the kit's State group beside the destructive", () => {
    const page = read(`${FOUNDATIONS}/page.tsx`);
    expect(page).toMatch(/\[\s*"Signal",\s*"--signal"\s*\]/);
    expect(page).toMatch(/\[\s*"Destructive",\s*"--destructive"\s*\]/);
  });
});

describe("the page draws them", () => {
  it("wires the grounds and the display's tokens into the brand kit", () => {
    const page = read(`${FOUNDATIONS}/page.tsx`);
    expect(page).toMatch(/<Grounds\b/);
    expect(page).toMatch(/<DisplayTokens\b/);
  });
});
