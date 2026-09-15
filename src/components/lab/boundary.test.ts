// ★ PENDING, NOT ABANDONED: strip "-pending" to publish these contracts on the
// library page. The collector indexes every file a @contract-for names, and an
// indexed file owes a `for` line in rules/component-notes.ts (gallery.test.ts
// fails without one). That file and the collector's COMPONENT_DIRS are the
// lab-library and lab-rules lanes, so the nine lines are asked for in this
// track's Handoff with the exact patch. The tests below RUN either way: the
// marker publishes a contract, it does not create one.
// @contract-for: src/components/lab/index.ts
// @contract-for: src/components/lab/frame.tsx
// @contract-for: src/components/lab/apply.tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE KIT'S BOUNDARY.
 *
 * The lab kit is a REVIEW INSTRUMENT, not a component library, and the
 * difference is not stylistic: it reads `getComputedStyle` off the live
 * cascade, writes stylesheets into iframe documents, and hands the whole site a
 * candidate block through the tuner store. Any of that reaching a product page
 * is a dev tool shipped to a guest, and the way it would happen is not malice
 * but convenience: someone wants `Toggle` or `CopyButton` for an app screen,
 * imports it from here, and the bundle follows.
 *
 * So the arrow points ONE way. The kit imports production components freely,
 * because a board has to judge the real thing; nothing outside `/design` imports
 * the kit. A product surface that wants a segmented control gets its own in
 * `src/components/ui`, which is the library's job.
 *
 * The lab chrome is the single exception, and it is a narrow one: the shell's
 * layout mounts LabChrome and its top bar reads the lab preferences, which are
 * lab surfaces living at a lab route. They are listed by name rather than
 * allowed by pattern, so the exception cannot quietly widen.
 */
const ROOT = process.cwd();
const KIT = "@/components/lab";
const OLD = "@/components/dev/board";

/** Lab surfaces that may reach the kit from outside `(dev)/design`: none today. */
const ALLOWED_OUTSIDE_LAB: readonly string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const FILES = walk(join(ROOT, "src")).map((p) => relative(ROOT, p));

describe("the lab kit's boundary", () => {
  it("is imported only from the lab", () => {
    const strays = FILES.filter((f) => {
      if (f.startsWith("src/components/lab/")) return false;
      if (f.startsWith("src/components/dev/")) return false; // the shim itself
      if (f.startsWith("src/app/(dev)/design/")) return false;
      if (ALLOWED_OUTSIDE_LAB.includes(f)) return false;
      const src = readFileSync(join(ROOT, f), "utf8");
      return src.includes(KIT) || src.includes(OLD);
    });
    expect(strays, "a file outside the lab imports the board kit").toEqual([]);
  });

  it("never reaches into a board", () => {
    const strays = walk(join(ROOT, "src/components/lab"))
      .map((p) => relative(ROOT, p))
      // The guards read the registry to know which boards are migrated; a test
      // is not shipped, so it is not the dependency this rule is about.
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      // An IMPORT, not a mention: the traps and the landmine comments name the
      // paths they are about, and a path inside a string is not a dependency.
      .filter((f) =>
        /(?:from|import\()\s*"[^"]*design\/sandbox/.test(
          readFileSync(join(ROOT, f), "utf8"),
        ),
      );
    expect(
      strays,
      "the kit imports a board; the dependency runs the other way",
    ).toEqual([]);
  });

  it("keeps the two faces: no board or kit file uses a mono face", () => {
    const strays = [
      ...walk(join(ROOT, "src/components/lab")),
      ...walk(join(ROOT, "src/app/(dev)/design/sandbox")),
    ]
      .map((p) => relative(ROOT, p))
      // The guards themselves carry the pattern they look for.
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      .filter((f) => /\bfont-mono\b/.test(readFileSync(join(ROOT, f), "utf8")));
    expect(strays, "font-mono in the lab; the product has two faces").toEqual(
      [],
    );
  });
});
