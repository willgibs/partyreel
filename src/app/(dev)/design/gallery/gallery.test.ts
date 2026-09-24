import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { readLibraryEntries } from "../../../../../scripts/lab-review.mjs";

/**
 * THE CATALOG'S GUARD: every entry tells the truth about the component it
 * shows.
 *
 *   LINKS      every entry names a file that exists, and a `test` that exists
 *              when it names one, so the entry page's one meta line never
 *              points at nothing.
 *   WIRING     every `play` names a config panel that exists, and every panel
 *              is reached by exactly one entry.
 *   DRIFT      every variant the catalog DECLARES is a variant the component
 *              actually has. A cva axis is compared key for key against the
 *              component's own `variants` block and its `defaultVariants`, so
 *              adding `size: "xl"` to Button and not to the catalog fails here.
 *              A prop or declared axis is weaker but still real: every option
 *              must appear as a string literal in the component's source, so a
 *              renamed or deleted value fails.
 *
 * It reads the entry files as SOURCE rather than importing them: the entries
 * are TSX that pulls in the whole component library, and this belongs in the
 * fast node project beside the other catalog checks.
 */

const ROOT = process.cwd();
const LIB = "src/app/(dev)/design";
// The family pages and their entry modules live under the shell route group
// since the Library x Lab round (2026-09-15).
const FAMILIES = "src/app/(dev)/design/(shell)/library";

/* ─────────────────────────── reading the entries ─────────────────────────── */

type Axis = {
  prop: string;
  source: string;
  fallback?: string;
  options: string[];
};

type Entry = {
  id: string;
  family: string;
  section: string;
  file?: string;
  test?: string;
  play?: string;
  specimens: number;
  variants: Axis[];
  from: string;
};

function parse(rel: string): ts.SourceFile {
  const abs = join(ROOT, rel);
  return ts.createSourceFile(
    abs,
    readFileSync(abs, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

const str = (n?: ts.Node): string | undefined =>
  n && ts.isStringLiteral(n) ? n.text : undefined;

/** Top-level `const NAME = ["a", "b"]`, so an axis may share one list. */
function stringArrayConsts(sf: ts.SourceFile): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const s of sf.statements) {
    if (!ts.isVariableStatement(s)) continue;
    for (const d of s.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !d.initializer) continue;
      if (!ts.isArrayLiteralExpression(d.initializer)) continue;
      const values = d.initializer.elements.map(str);
      if (values.every((v) => v !== undefined)) {
        out.set(d.name.text, values as string[]);
      }
    }
  }
  return out;
}

function stringArray(
  node: ts.Node | undefined,
  consts: Map<string, string[]>,
): string[] | undefined {
  if (!node) return undefined;
  if (ts.isIdentifier(node)) return consts.get(node.text);
  if (!ts.isArrayLiteralExpression(node)) return undefined;
  const values = node.elements.map(str);
  return values.every((v) => v !== undefined)
    ? (values as string[])
    : undefined;
}

const prop = (o: ts.ObjectLiteralExpression, name: string) =>
  o.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
      p.name.text === name,
  )?.initializer;

/** Every entry declared in the five family modules. */
function readEntries(): Entry[] {
  const files = readdirSync(join(ROOT, FAMILIES), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `${FAMILIES}/${d.name}/gallery-demos.tsx`)
    .filter((f) => existsSync(join(ROOT, f)));
  expect(files.length, "the five family entry modules").toBe(5);

  const entries: Entry[] = [];
  for (const rel of files) {
    const sf = parse(rel);
    const consts = stringArrayConsts(sf);
    for (const s of sf.statements) {
      if (!ts.isVariableStatement(s)) continue;
      const exported = (s.modifiers ?? []).some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!exported) continue;
      for (const d of s.declarationList.declarations) {
        if (!d.initializer || !ts.isArrayLiteralExpression(d.initializer))
          continue;
        for (const el of d.initializer.elements) {
          if (!ts.isObjectLiteralExpression(el)) continue;
          const id = str(prop(el, "id"));
          if (!id) continue;
          const variantsNode = prop(el, "variants");
          const variants: Axis[] =
            variantsNode && ts.isArrayLiteralExpression(variantsNode)
              ? variantsNode.elements
                  .filter(ts.isObjectLiteralExpression)
                  .map((v) => ({
                    prop: str(prop(v, "prop")) ?? "",
                    source: str(prop(v, "source")) ?? "",
                    fallback: str(prop(v, "fallback")),
                    options: stringArray(prop(v, "options"), consts) ?? [],
                  }))
              : [];
          const specimensNode = prop(el, "specimens");
          entries.push({
            id,
            family: str(prop(el, "family")) ?? "",
            section: str(prop(el, "section")) ?? "",
            file: str(prop(el, "file")),
            test: str(prop(el, "test")),
            play: str(prop(el, "play")),
            specimens:
              specimensNode && ts.isArrayLiteralExpression(specimensNode)
                ? specimensNode.elements.length
                : 0,
            variants,
            from: rel,
          });
        }
      }
    }
  }
  return entries;
}

/** The config panels, by id, with each knob that declares an option list. */
function readPlaygrounds(): Map<string, { prop: string; options: string[] }[]> {
  const rel = `${LIB}/gallery/playgrounds.tsx`;
  const sf = parse(rel);
  const consts = stringArrayConsts(sf);
  const out = new Map<string, { prop: string; options: string[] }[]>();
  for (const s of sf.statements) {
    if (!ts.isVariableStatement(s)) continue;
    for (const d of s.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== "PLAYGROUNDS") continue;
      if (!d.initializer || !ts.isObjectLiteralExpression(d.initializer))
        continue;
      for (const p of d.initializer.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key =
          ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)
            ? p.name.text
            : undefined;
        if (!key || !ts.isObjectLiteralExpression(p.initializer)) continue;
        const knobsNode = prop(p.initializer, "knobs");
        const knobs: { prop: string; options: string[] }[] = [];
        if (knobsNode && ts.isArrayLiteralExpression(knobsNode)) {
          for (const k of knobsNode.elements) {
            if (!ts.isObjectLiteralExpression(k)) continue;
            const options = stringArray(prop(k, "options"), consts);
            const name = str(prop(k, "prop"));
            if (name && options) knobs.push({ prop: name, options });
          }
        }
        out.set(key, knobs);
      }
    }
  }
  return out;
}

/* ───────────────────────── reading a component's variants ───────────────── */

/** Every cva block in a component file: prop -> { options, fallback }. */
function cvaAxes(
  rel: string,
): Map<string, { options: string[]; fallback?: string }> {
  const sf = parse(rel);
  const out = new Map<string, { options: string[]; fallback?: string }>();
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "cva" &&
      node.arguments[1] &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      const config = node.arguments[1];
      const variants = prop(config, "variants");
      const defaults = prop(config, "defaultVariants");
      if (variants && ts.isObjectLiteralExpression(variants)) {
        for (const axis of variants.properties) {
          if (!ts.isPropertyAssignment(axis)) continue;
          const name =
            ts.isIdentifier(axis.name) || ts.isStringLiteral(axis.name)
              ? axis.name.text
              : undefined;
          if (!name || !ts.isObjectLiteralExpression(axis.initializer))
            continue;
          const options = axis.initializer.properties
            .filter(ts.isPropertyAssignment)
            .map((o) =>
              ts.isIdentifier(o.name) || ts.isStringLiteral(o.name)
                ? o.name.text
                : "",
            )
            .filter(Boolean);
          const fallback =
            defaults && ts.isObjectLiteralExpression(defaults)
              ? str(prop(defaults, name))
              : undefined;
          out.set(name, { options, fallback });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/**
 * Every value a component names: string literals (type unions included),
 * numbers, and object keys written bare, which is how a cva block and a class
 * map spell their options.
 */
function literals(rel: string): Set<string> {
  const sf = parse(rel);
  const out = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      out.add(node.text);
    }
    if (
      (ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node)) &&
      (ts.isIdentifier(node.name) || ts.isNumericLiteral(node.name))
    ) {
      out.add(node.name.text);
    }
    // A numeric union (`columns?: 2 | 3 | 4`) is spelled in numbers, and an
    // option list is strings, so the two meet here.
    if (ts.isNumericLiteral(node)) out.add(node.text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/* ─────────────────────────────── the guard ──────────────────────────────── */

const ENTRIES = readEntries();
const PLAYGROUNDS = readPlaygrounds();

describe("every gallery entry", () => {
  it("has a unique id", () => {
    const seen = new Map<string, string>();
    for (const e of ENTRIES) {
      expect(
        seen.has(e.id),
        `${e.id} is declared twice (${seen.get(e.id)} and ${e.from})`,
      ).toBe(false);
      seen.set(e.id, e.from);
    }
  });

  it("names a file that exists, and a test that exists when it names one", () => {
    for (const e of ENTRIES) {
      expect(e.file, `${e.id} declares no file`).toBeTruthy();
      expect(existsSync(join(ROOT, e.file!)), `${e.id}: ${e.file} is gone`).toBe(
        true,
      );
      if (e.test === undefined) continue;
      expect(e.test, `${e.id}: its test is not a test file`).toMatch(
        /\.test\.tsx?$/,
      );
      expect(existsSync(join(ROOT, e.test)), `${e.id}: ${e.test} is gone`).toBe(
        true,
      );
    }
  });

  it("is the same list lab:review checks a `review library:` line against", () => {
    // lab-review.mjs reads the ids with a regex (node builtins only, no build
    // step); this holds that reader to the TypeScript parse above.
    expect([...(readLibraryEntries(ROOT) ?? [])].sort()).toEqual(
      ENTRIES.map((e) => e.id).sort(),
    );
  });

  it("sits in the family whose page mounts it, and in a named section", () => {
    const families = new Set([
      "components",
      "patterns",
      "compositions",
      "foundations",
      "marketing",
    ]);
    for (const e of ENTRIES) {
      expect(families.has(e.family), `${e.id}: family ${e.family}`).toBe(true);
      expect(e.section.length, `${e.id} has no section`).toBeGreaterThan(0);
      expect(
        e.from,
        `${e.id} is declared in ${e.from} but says family ${e.family}`,
      ).toBe(`${FAMILIES}/${e.family}/gallery-demos.tsx`);
    }
  });

  it("shows something: a specimen, a config panel, or both", () => {
    const empty = ENTRIES.filter((e) => e.specimens === 0 && !e.play).map(
      (e) => e.id,
    );
    expect(empty, "an entry with nothing to look at").toEqual([]);
  });
});

describe("the declared variants match the component", () => {
  it("matches a cva axis key for key, default included", () => {
    for (const e of ENTRIES) {
      const file = e.file;
      if (!file) continue;
      for (const axis of e.variants.filter((a) => a.source === "cva")) {
        const found = cvaAxes(file).get(axis.prop);
        expect(
          found,
          `${e.id}: ${file} declares no cva axis "${axis.prop}"`,
        ).toBeTruthy();
        expect(
          [...axis.options].sort(),
          `${e.id}: the gallery's "${axis.prop}" options differ from ${file}`,
        ).toEqual([...found!.options].sort());
        if (found!.fallback) {
          expect(
            axis.fallback,
            `${e.id}: "${axis.prop}" defaults to ${found!.fallback} in ${file}`,
          ).toBe(found!.fallback);
        }
      }
    }
  });

  it("only offers option values the component's source actually contains", () => {
    for (const e of ENTRIES) {
      const file = e.file;
      if (!file) continue;
      const inSource = literals(file);
      for (const axis of e.variants) {
        // A cva axis already had its keys compared exactly, above.
        for (const option of axis.source === "cva" ? [] : axis.options) {
          // A boolean axis is declared as "false" / "true"; those are not
          // strings in the source, and the prop name check below covers it.
          if (option === "true" || option === "false") continue;
          expect(
            inSource.has(option),
            `${e.id}: ${file} has no "${option}" for ${axis.prop}`,
          ).toBe(true);
        }
        expect(
          readFileSync(join(ROOT, file), "utf8").includes(axis.prop),
          `${e.id}: ${file} never mentions the prop "${axis.prop}"`,
        ).toBe(true);
        expect(
          ["cva", "prop", "declared"].includes(axis.source),
          `${e.id}: "${axis.prop}" has an unknown source ${axis.source}`,
        ).toBe(true);
      }
    }
  });
});

describe("the config panels", () => {
  it("are reached by exactly one entry each", () => {
    const played = ENTRIES.filter((e) => e.play).map((e) => e.play!);
    for (const id of played) {
      expect(PLAYGROUNDS.has(id), `no config panel named "${id}"`).toBe(true);
    }
    expect(new Set(played).size, "two entries share a config panel").toBe(
      played.length,
    );
    const unreached = [...PLAYGROUNDS.keys()].filter(
      (k) => !played.includes(k),
    );
    expect(unreached, "a config panel no entry mounts").toEqual([]);
  });

  it("offer the same values the entry declares", () => {
    for (const e of ENTRIES) {
      if (!e.play) continue;
      const knobs = PLAYGROUNDS.get(e.play) ?? [];
      for (const knob of knobs) {
        const axis = e.variants.find((a) => a.prop === knob.prop);
        if (!axis) continue;
        expect(
          knob.options,
          `${e.id}: the panel's "${knob.prop}" differs from the declared variants`,
        ).toEqual(axis.options);
      }
    }
  });
});

/**
 * ★ ONE GROUP PER SECTION, PER FAMILY. A family page keys its section blocks by
 * the section's name, and a lane that adds an entry at the head of a family's
 * list under a heading that already exists further down (the disjoint-hunk
 * convention) used to open a second block with the same key: React dropped one
 * silently and the page logged the duplicate ("Surfaces", twice, 2026-09-20).
 * `familySections` merges every entry of a section into one block through the
 * shared first-appearance grouping now. Pinned on the SOURCE, not at runtime:
 * importing the registry here pulls every family's components and the product's
 * env validation into a node test; `group-by.test.ts` proves the helper itself.
 */
describe("a family's sections", () => {
  it("are grouped by the shared first-appearance helper, never by a consecutive-run scan", () => {
    const src = readFileSync(join(__dirname, "registry.ts"), "utf8");
    const body = src.slice(src.indexOf("export function familySections"));
    const fn = body.slice(0, body.indexOf("\n}\n") + 3);
    expect(fn).toContain("groupByKey(");
    expect(fn).not.toMatch(/out\.at\(-1\)|last\?\.section/);
  });
});
