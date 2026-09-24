import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache, type ReactNode } from "react";

import matter from "gray-matter";

import { slugify } from "@/lib/content/collection";

import { readTrackStates } from "./tracks";

/**
 * THE LAB'S DOC READER. The shell renders repo markdown at request time: the
 * track manifests and any proposal under docs/specs. Nothing here writes; the
 * files are the source. `next.config.ts` traces every readable file into the
 * shell's functions through TRACED_DOC_GLOBS (legacy-routes.ts), and
 * legacy-routes.test.ts holds each glob to a file on disk.
 *
 * Heading ids come from the help pipeline's `slugify` (collection.ts), and
 * `createHeadingIds` is the ONE uniqueness counter: `headingsOf` and the
 * shell's Markdown component both run it, in document order, so a heading's
 * anchor is the same wherever it is computed.
 */
export type DocHeading = {
  id: string;
  text: string;
  depth: 1 | 2 | 3;
  line: number;
};

// ── Reading ──────────────────────────────────────────────────────────────────

/**
 * The readable set. The reader takes a repo-relative path from route code, so
 * it is an allow-list rather than "anything under the root": a `..` segment,
 * an absolute path, or a path outside docs/ throws before `readFileSync` runs.
 * `src/` is deliberately NOT readable (env.ts lives there).
 */
const READABLE_PREFIXES = ["docs/"];

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
  if (READABLE_PREFIXES.some((prefix) => rel.startsWith(prefix))) return;
  throw new Error(
    `readDoc: "${rel}" is outside the lab's readable set (docs/)`,
  );
}

const readDocCached = cache(
  (rel: string): { body: string; data: Record<string, unknown> } => {
    assertReadable(rel);
    // ★ `turbopackIgnore`: a dynamic path under process.cwd() makes the build
    // trace the WHOLE project into every lab function (all of src/, supabase/,
    // workers/, the lockfile: 2,248 files per function, measured 2026-09-16).
    // The files this can read are already traced by name: TRACED_DOC_GLOBS in
    // _data/legacy-routes.ts, applied by next.config.ts. Never widen the
    // allow-list without a glob there.
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

// ── Listings ─────────────────────────────────────────────────────────────────

/**
 * The proposal documents under docs/specs, when a board writes one (none
 * does today: a board's argument lives in its own spec.ts). README-like files
 * are not proposals, and a missing directory is an empty list.
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
