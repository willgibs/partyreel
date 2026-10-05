/**
 * WHAT A MAINTENANCE SCRIPT IMPORTS FROM `src/` LOADS UNDER PLAIN NODE (crumbs-77). `scripts/seed-demo-event.mjs` and
 * `scripts/backfill-strip-exif.mjs` run as `node scripts/<name>.mjs`, with no bundler, on Node's own type stripping
 * (default since 22.18; `.nvmrc` pins 22.21.1), and import the app's single sources instead of keeping a copy of
 * them: the R2 keys, the media limits, the preview math, the stripper and, since this lane, `readAllPages` and
 * `inChunks` (`src/lib/db/read-all.ts`). Plain Node resolves neither the `@/` alias nor an extensionless relative
 * path, so a runtime import of either kind added to one of those modules breaks the scripts, and nothing in the
 * app's own tests, which run under Vite, would say so until someone ran a script against live data. The two scripts
 * had kept their own copies of the two helpers for exactly that reason.
 *
 * So this loads each module a script imports, in a child Node, and holds the names the script takes from it.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");
const SCRIPTS = join(ROOT, "scripts");

/** A child Node's start and a module's load: a second or so alone, and a loaded run needs a budget of its own. */
const LOAD_BUDGET_MS = 60_000;

/** `({ a, b } = await import(new URL("../src/x.ts", import.meta.url)))`: what each script takes from which module. */
const IMPORT =
  /\(\{([^}]*)\}\s*=\s*await import\(\s*new URL\(\s*"\.\.\/(src\/[^"]+\.tsx?)"/g;

type Taken = { script: string; target: string; names: string[] };

const taken: Taken[] = readdirSync(SCRIPTS)
  .filter((file) => file.endsWith(".mjs"))
  .flatMap((script) =>
    [...readFileSync(join(SCRIPTS, script), "utf8").matchAll(IMPORT)].map(
      (match) => ({
        script: `scripts/${script}`,
        target: match[2],
        names: match[1]
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
      }),
    ),
  );

describe("the scripts' imports from src/", () => {
  it("finds what the two maintenance scripts import (the scan is not vacuous)", () => {
    const targets = new Set(taken.map((t) => t.target));
    for (const target of [
      "src/lib/db/read-all.ts",
      "src/lib/media/limits.ts",
      "src/lib/media/strip-metadata.ts",
      "src/lib/r2/keys.ts",
    ]) {
      expect(targets, `no script imports ${target}`).toContain(target);
    }
  });

  it("both maintenance scripts take the app's chunking and paging, not a copy of it", () => {
    const names = (script: string) =>
      taken.filter((t) => t.script === script).flatMap((t) => t.names);
    expect(names("scripts/backfill-strip-exif.mjs")).toContain("inChunks");
    expect(names("scripts/seed-demo-event.mjs")).toContain("readAllPages");
    for (const script of [
      "scripts/backfill-strip-exif.mjs",
      "scripts/seed-demo-event.mjs",
    ]) {
      const source = readFileSync(join(ROOT, script), "utf8");
      expect(source, `${script} keeps its own inChunks`).not.toMatch(
        /\n(?:async )?function inChunks\(/,
      );
      expect(source, `${script} keeps its own page reader`).not.toMatch(
        /\bfunction readAllPages\(/,
      );
    }
  });

  it.each(
    taken.map(
      (t) =>
        [
          `${t.script} takes ${t.names.join(", ")} from ${t.target}`,
          t,
        ] as const,
    ),
  )(
    "%s",
    (_label, { script, target, names }) => {
      const url = pathToFileURL(join(ROOT, target)).href;
      let exported: string[];
      try {
        exported = JSON.parse(
          execFileSync(
            process.execPath,
            [
              "--input-type=module",
              "-e",
              `console.log(JSON.stringify(Object.keys(await import(${JSON.stringify(url)}))))`,
            ],
            { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
          ),
        );
      } catch (error) {
        const stderr = (error as { stderr?: string }).stderr ?? String(error);
        throw new Error(
          `${script} imports ${target}, which plain Node cannot load (its runtime imports must be \`.ts\` files named in full, never \`@/\` or extensionless; type imports use \`import type\`):\n${stderr}`,
        );
      }
      for (const name of names) {
        expect(
          exported,
          `${target} no longer exports ${name}, which ${script} takes`,
        ).toContain(name);
      }
    },
    LOAD_BUDGET_MS,
  );
});
