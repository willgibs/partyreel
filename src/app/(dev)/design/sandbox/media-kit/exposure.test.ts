import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHROME,
  FILE_COUNTS,
  MARKETING_PAGES,
  PRODUCTION_FILES,
} from "./exposure";

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE EXPOSURE, RECOMPUTED (the media-kit track, round two).
 *
 * The board quotes numbers about how far the twelve unverified stills reach. A
 * number on a board that nothing checks is a number that was true once, so every
 * one of them is recomputed here from the tree. If a count is wrong the suite
 * says so; if a frame's reach grows, this test is where that shows up.
 *
 * The scan is deliberately crude (a literal id in quotes) and deliberately
 * exclusive: tests, the design lab and the manifest itself do not count, because
 * the claim is about PRODUCTION reach.
 */

const SRC = join(process.cwd(), "src");
const MANIFEST = join("src", "lib", "constants", "marketing-media.ts");

function productionFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "(dev)") continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.tsx?$/.test(name) || name.includes(".test.")) continue;
      if (p.endsWith(MANIFEST)) continue;
      out.push(p);
    }
  };
  walk(SRC);
  return out;
}

const FILES = productionFiles().map((p) => ({
  path: p,
  text: readFileSync(p, "utf8"),
}));

describe("what the twelve unverified stills actually reach", () => {
  it("the per-id file counts on the board are the counts in the tree", () => {
    for (const image of MARKETING_IMAGES) {
      const hits = FILES.filter((f) => f.text.includes(`"${image.id}"`)).length;
      expect(hits, image.id).toBe(FILE_COUNTS[image.id]);
    }
  });

  it("the distinct production file count is the count in the tree", () => {
    const touched = new Set<string>();
    for (const image of MARKETING_IMAGES) {
      for (const f of FILES) {
        if (f.text.includes(`"${image.id}"`)) touched.add(f.path);
      }
    }
    expect(touched.size).toBe(PRODUCTION_FILES);
  });

  it("the chrome really does carry the ids the board names", () => {
    // This is the correction round one missed: these two files sit in the group
    // layouts, so their frames are on every marketing page before a scroll.
    for (const entry of CHROME) {
      const text = readFileSync(join(process.cwd(), entry.file), "utf8");
      for (const id of entry.ids) {
        expect(text.includes(`"${id}"`), `${entry.file} / ${id}`).toBe(true);
      }
    }
  });

  it("both group layouts mount the chrome, which is what makes it every page", () => {
    for (const group of ["(cinema)", "(paper)"]) {
      const layout = readFileSync(
        join(process.cwd(), "src", "app", "(marketing)", group, "layout.tsx"),
        "utf8",
      );
      expect(layout.includes("MarketingFooter"), group).toBe(true);
      expect(layout.includes("MarketingHeader"), group).toBe(true);
    }
  });

  it("the marketing page count is the page count in the tree", () => {
    let pages = 0;
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (name === "page.tsx") pages += 1;
      }
    };
    walk(join(process.cwd(), "src", "app", "(marketing)"));
    expect(pages).toBe(MARKETING_PAGES);
  });

  /**
   * ★ ROUND THREE'S CLAIM, PINNED: the ruling touches marketing and nothing
   * else. The board tells a reviewer not to bother walking the dashboard, an
   * event page, the admin portal or a guest link with a block applied, because
   * no marketing still is referenced under any of them. That is only worth
   * saying if it cannot quietly stop being true.
   */
  it("no still reaches the app, the guest link or the admin portal", () => {
    const outside = FILES.filter((f) =>
      ["(app)", "(guest)", "(auth)", "admin"].some(
        (seg) =>
          f.path.includes(join("src", "app", seg) + "/") ||
          f.path.includes(
            join("src", "components", seg.replace(/[()]/g, "")) + "/",
          ),
      ),
    );
    for (const image of MARKETING_IMAGES) {
      for (const f of outside) {
        expect(
          f.text.includes(`"${image.id}"`),
          `${f.path} / ${image.id}`,
        ).toBe(false);
      }
    }
  });
});
