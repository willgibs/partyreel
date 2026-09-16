import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache, type ReactNode } from "react";

import matter from "gray-matter";

import { slugify } from "@/lib/content/collection";

import { readTrackStates } from "./tracks";

/**
 * THE LAB'S DOC READER (the Library x Lab round, 2026-09-15). The shell renders
 * repo markdown at request time: the doctrine the library points at, the
 * program's rulebook, the agent guide, the craft skill, the proposals under
 * docs/specs, Will's rulings. Nothing here writes; the files are the record.
 * `next.config.ts` traces every readable file into the shell's functions
 * through TRACED_DOC_GLOBS (legacy-routes.ts), so a new path added to DOCS
 * needs a glob there too (docs.test.ts holds the two together).
 *
 * Heading ids come from the help pipeline's `slugify` (collection.ts), the
 * same function behind the touchpoints registry's `lives[]` anchors
 * (`docs/systems/design-system.md#the-identity-achromatic-media-is-the-color`),
 * so a link written by hand in touchpoints.ts lands on the id the renderer
 * emits. `createHeadingIds` is the ONE uniqueness counter: `headingsOf` and
 * the shell's Markdown component both run it, in document order.
 */
export type DocId =
  | "design-system"
  | "marketing-content"
  | "program"
  | "agent-guide"
  | "craft";

export type DocAuthority = "precedent" | "program" | "guidance";

export const DOCS: Record<
  DocId,
  { path: string; title: string; authority: DocAuthority }
> = {
  // The system docs are what exists and its invariants: under the 2026-09-12
  // ruling everything outside the bible and the contracts is precedent.
  "design-system": {
    path: "docs/systems/design-system.md",
    title: "Design system",
    authority: "precedent",
  },
  "marketing-content": {
    path: "docs/systems/marketing-content.md",
    title: "Marketing site, content & SEO",
    authority: "precedent",
  },
  program: {
    path: "docs/PROGRAM.md",
    title: "The elevation program",
    authority: "program",
  },
  "agent-guide": {
    path: "CLAUDE.md",
    title: "Agent operating guide",
    authority: "program",
  },
  // A symlink target on some checkouts; read through the path as written so
  // the trace glob and the read agree.
  craft: {
    path: ".agents/skills/emil-design-eng/SKILL.md",
    title: "Craft (the design-engineering skill)",
    authority: "guidance",
  },
};

export type DocHeading = {
  id: string;
  text: string;
  depth: 1 | 2 | 3;
  line: number;
};

// ── Reading ──────────────────────────────────────────────────────────────────

/**
 * The readable set. The reader takes a repo-relative path from route code, so
 * it is an allow-list of prefixes rather than "anything under the root": a
 * `..` segment, an absolute path, or a path outside these three throws before
 * `readFileSync` runs. `src/` is deliberately NOT readable (env.ts lives there).
 */
const READABLE_PREFIXES = ["docs/", ".agents/skills/emil-design-eng/"];
const READABLE_FILES = new Set(["CLAUDE.md"]);

function assertReadable(rel: string): void {
  const segments = rel.split("/");
  if (
    rel.startsWith("/") ||
    rel.includes("\\") ||
    segments.some((s) => s === ".." || s === "." || s === "")
  ) {
    throw new Error(
      `readDoc: refusing "${rel}" (a plain repo-relative path is required)`,
    );
  }
  if (READABLE_FILES.has(rel)) return;
  if (READABLE_PREFIXES.some((prefix) => rel.startsWith(prefix))) return;
  throw new Error(
    `readDoc: "${rel}" is outside the lab's readable set (docs/, CLAUDE.md, the craft skill)`,
  );
}

const readDocCached = cache(
  (rel: string): { body: string; data: Record<string, unknown> } => {
    assertReadable(rel);
    // ★ `turbopackIgnore`: a dynamic path under process.cwd() makes the build
    // trace the WHOLE project into every lab function (all of src/, supabase/,
    // workers/, the lockfile: 2,248 files per function, measured 2026-09-16).
    // The files this can read are already traced by name: TRACED_DOC_GLOBS in
    // _data/legacy-routes.ts, applied by next.config.ts, which docs.test.ts
    // checks against DOCS. Never widen the allow-list without a glob there.
    const raw = readFileSync(
      join(/*turbopackIgnore: true*/ process.cwd(), rel),
      "utf8",
    );
    const { content, data } = matter(raw);
    return { body: content, data: data as Record<string, unknown> };
  },
);

/** A repo markdown file, frontmatter split off; memoised per path per request. */
export function readDoc(rel: string): {
  body: string;
  data: Record<string, unknown>;
} {
  return readDocCached(rel);
}

// ── Heading ids ──────────────────────────────────────────────────────────────

/**
 * One uniqueness counter per document: the first "foo" is `foo`, the next
 * `foo-2`, then `foo-3`. The renderer and `headingsOf` each create one and feed
 * it every h1..h3 in document order, which is what makes their ids equal.
 */
export function createHeadingIds(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base = slugify(text) || "section";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/**
 * Flatten rendered heading children to the text a reader sees (strings, and
 * the children of any element: `code`, `em`, `a`). The renderer's half of the
 * id equality; `inlineText` is the source-side half.
 */
export function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return nodeText(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * The text markdown inline syntax renders to, from the source line: what
 * `nodeText` sees once the same line is compiled. Images render no text, raw
 * HTML renders nothing (no rehype-raw in the lab's pipeline), links and code
 * keep their text, emphasis keeps its content. Underscores are only stripped
 * as emphasis delimiters (word-bounded), never inside `snake_case`, because
 * `slugify` keeps `_` as a word character.
 */
export function inlineText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/<((?:https?:|mailto:)[^>]*)>/g, "$1")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/`/g, "")
    .replace(/\*{1,2}([^*\s](?:[^*]*?[^*\s])?)\*{1,2}/g, "$1")
    .replace(
      /(^|[^\w])_{1,2}([^_\s](?:[^_]*?[^_\s])?)_{1,2}(?=[^\w]|$)/g,
      "$1$2",
    )
    .replace(/\\([\\`*_{}[\]()#+\-.!~|<>])/g, "$1")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .trim();
}

// ── Structure ────────────────────────────────────────────────────────────────

type Line = { text: string; index: number };

/** Every line outside a fenced code block, with its 0-based index. */
function proseLines(body: string): Line[] {
  const out: Line[] = [];
  let fence: { char: string; length: number } | null = null;
  body.split("\n").forEach((text, index) => {
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(text);
    if (fence) {
      // A closing fence uses the opening char and is at least as long.
      if (open && open[1][0] === fence.char && open[1].length >= fence.length) {
        fence = null;
      }
      return;
    }
    if (open) {
      fence = { char: open[1][0], length: open[1].length };
      return;
    }
    out.push({ text, index });
  });
  return out;
}

const ATX = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;

/**
 * Every h1..h3 with its unique id. The counter runs over all three depths no
 * matter which `maxDepth` the caller asks for, so `headingsOf(body, 2)` returns
 * the same ids for the same headings as `headingsOf(body, 3)`. Deeper headings
 * (h4+) get no id from the renderer either; they stay inside their section.
 */
function parseHeadings(lines: Line[]): DocHeading[] {
  const nextId = createHeadingIds();
  const out: DocHeading[] = [];
  for (const { text, index } of lines) {
    const m = ATX.exec(text);
    if (!m || m[1].length > 3) continue;
    const plain = inlineText(m[2]);
    if (!plain) continue;
    out.push({
      id: nextId(plain),
      text: plain,
      depth: m[1].length as 1 | 2 | 3,
      line: index + 1,
    });
  }
  return out;
}

export function headingsOf(body: string, maxDepth: 2 | 3 = 3): DocHeading[] {
  return parseHeadings(proseLines(body)).filter((h) => h.depth <= maxDepth);
}

/**
 * The lines of a section: from the line after its heading to the line before
 * the next heading of equal or higher rank (a `###` never ends a `##`).
 */
function sectionLines(
  lines: string[],
  headings: DocHeading[],
  at: number,
): string[] {
  const start = headings[at];
  const end = headings.slice(at + 1).find((h) => h.depth <= start.depth);
  return lines.slice(start.line, end ? end.line - 1 : undefined);
}

/**
 * The markdown of one section, heading line included, so the piece renders
 * standalone with its own anchor; null when no heading carries that id.
 */
export function sectionOf(body: string, id: string): string | null {
  const lines = body.split("\n");
  const headings = parseHeadings(proseLines(body));
  const at = headings.findIndex((h) => h.id === id);
  if (at < 0) return null;
  const heading = lines[headings[at].line - 1];
  return [heading, ...sectionLines(lines, headings, at)].join("\n").trim();
}

/** Every `##` whose text matches, with the section body below it (heading excluded). */
export function sectionsMatching(
  body: string,
  re: RegExp,
): { heading: string; id: string; body: string }[] {
  const lines = body.split("\n");
  const headings = parseHeadings(proseLines(body));
  const out: { heading: string; id: string; body: string }[] = [];
  headings.forEach((h, at) => {
    if (h.depth !== 2) return;
    // A global regex carries lastIndex between calls; reset so every heading
    // is tested from its start.
    re.lastIndex = 0;
    if (!re.test(h.text)) return;
    out.push({
      heading: h.text,
      id: h.id,
      body: sectionLines(lines, headings, at).join("\n").trim(),
    });
  });
  return out;
}

// ── Landmines ────────────────────────────────────────────────────────────────

const LANDMINE_START = /^\s*(?:(?:[-*+]|\d+[.)])\s+)?(\*\*)?★\s*(.*)$/;
// A block ends at a blank line or at the start of another block: a heading, a
// list item, a fence, a quote, a table row, or the next glyph.
const BLOCK_START =
  /^\s*(?:$|#{1,6}\s|(?:[-*+]|\d+[.)])\s|`{3,}|~{3,}|>|\||\*\*★|★)/;

/**
 * Every list item or paragraph that STARTS with the ★ glyph (a landmine: a
 * silent breakage if reverted, never a rule), with the block's markdown and the
 * nearest h1..h3 above it. A ★ mentioned mid-sentence is prose, not a landmine.
 */
export function landminesOf(
  body: string,
): { text: string; under: string; underId: string }[] {
  const lines = proseLines(body);
  const out: { text: string; under: string; underId: string }[] = [];
  const nextId = createHeadingIds();
  let under = "";
  let underId = "";
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text;
    const h = ATX.exec(text);
    if (h && h[1].length <= 3) {
      const plain = inlineText(h[2]);
      if (plain) {
        under = plain;
        underId = nextId(plain);
      }
      continue;
    }
    const m = LANDMINE_START.exec(text);
    if (!m) continue;
    // Keep a bold opener whole: `**★ The vaul motion gotcha:**` reads as
    // `**The vaul motion gotcha:**` once the glyph is lifted out.
    const parts = [`${m[1] ?? ""}${m[2]}`];
    while (
      i + 1 < lines.length &&
      lines[i + 1].index === lines[i].index + 1 &&
      !BLOCK_START.test(lines[i + 1].text)
    ) {
      i++;
      parts.push(lines[i].text.trim());
    }
    out.push({ text: parts.join("\n").trim(), under, underId });
  }
  return out;
}

// ── Listings ─────────────────────────────────────────────────────────────────

/**
 * The proposals under docs/specs: the exploration boards' settled documents.
 * README-like files are not proposals.
 */
export function listSpecs(): {
  slug: string;
  title: string;
  status: string | null;
}[] {
  const dir = join(process.cwd(), "docs", "specs");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (f) => f.endsWith(".md") && !/^readme/i.test(f),
    );
  } catch {
    return [];
  }
  return files.sort().map((file) => {
    const slug = file.replace(/\.md$/, "");
    const { body } = readDoc(`docs/specs/${file}`);
    const lines = body.split("\n");
    const h1 = lines.find((l) => /^# /.test(l));
    const title = h1 ? inlineText(h1.replace(/^# /, "")) : slug;
    // The proposals mark themselves in their opening blockquote, as
    // "STATUS: a PROPOSAL" or "NOT LAW until"; the line is returned as
    // written (its markdown intact) with the quote marker lifted.
    const status = lines.find((l) => /STATUS|NOT LAW/.test(l));
    return {
      slug,
      title,
      status: status ? status.replace(/^\s*>\s?/, "").trim() : null,
    };
  });
}

/** Every track manifest's name, status and preview flag (the desk's reader). */
export function listTracks(): {
  name: string;
  status: string;
  preview: boolean;
}[] {
  return [...readTrackStates().values()]
    .map((t) => ({ name: t.track, status: t.status, preview: t.preview }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The `##` headings of Will's rulings record, one per dated ruling. */
export function listRulings(): DocHeading[] {
  return headingsOf(readDoc("docs/design/rulings.md").body, 2).filter(
    (h) => h.depth === 2,
  );
}
