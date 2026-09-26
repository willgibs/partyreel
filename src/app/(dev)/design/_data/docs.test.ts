import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { compileMDX } from "next-mdx-remote/rsc";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it, vi } from "vitest";

// The reader is `server-only` (node:fs at request time); the unit project has
// no react-server condition, so the marker module is stubbed out here.
vi.mock("server-only", () => ({}));

import { SANDBOX } from "../touchpoints";
import {
  createHeadingIds,
  headingsOf,
  inlineText,
  listSpecs,
  listTracks,
  nodeText,
  readDoc,
} from "./docs";
import { TRACED_DOC_GLOBS } from "./legacy-routes";

/**
 * The lab's doc reader against the real repo files: every doc the shell
 * renders is traced into its functions (a read the build cannot see would
 * ENOENT on Vercel), the reader refuses anything outside its allow-list, and
 * every rendered doc compiles in the renderer's pipeline (format "md" + GFM)
 * with the heading ids `headingsOf` predicts, so a doc that breaks the page
 * fails here with its path.
 */
const root = process.cwd();

/** A trace glob (`./docs/specs/*.md`) as a whole-path regex. */
function globToRegExp(glob: string): RegExp {
  // Split on `**` first so the only escaping needed is per plain segment; no
  // placeholder character is involved.
  const source = glob
    .replace(/^\.\//, "")
    .split("**")
    .map((part) =>
      part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"),
    )
    .join(".*");
  return new RegExp(`^${source}$`);
}

const traced = TRACED_DOC_GLOBS.map(globToRegExp);
const isTraced = (path: string) => traced.some((re) => re.test(path));

/** Every file the shell renders: any proposal and the manifests. */
function renderedDocs(): string[] {
  const manifests = readdirSync(join(root, "docs", "tracks"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => `docs/tracks/${f}`);
  return [...listSpecs().map((s) => `docs/specs/${s.slug}.md`), ...manifests];
}

describe("the traced docs", () => {
  it("cover every doc the shell renders", () => {
    for (const path of renderedDocs()) {
      expect(existsSync(join(root, path)), path).toBe(true);
      expect(isTraced(path), `${path} is not in TRACED_DOC_GLOBS`).toBe(true);
    }
  });
});

describe("readDoc", () => {
  it("refuses any path outside the allow-list or with a .. segment", () => {
    for (const bad of [
      "../x",
      "docs/../src/lib/env.ts",
      "src/lib/env.ts",
      "/etc/passwd",
      "CLAUDE.md",
      "CLAUDE.md/../package.json",
      "docs/./PROGRAM.md",
      "docs//PROGRAM.md",
      ".agents/skills/emil-design-eng/SKILL.md",
      "AGENTS.md",
      "",
    ]) {
      expect(() => readDoc(bad), bad).toThrow();
    }
  });

  it("reads the allow-listed files and splits frontmatter", () => {
    const pickup = readDoc("docs/tracks/orchestrator.md");
    expect(pickup.data.track).toBe("orchestrator");
    expect(pickup.body.startsWith("---")).toBe(false);
    expect(pickup.body).toContain("# ");
  });
});

describe("heading ids", () => {
  it("dedupes repeats with -2, -3", () => {
    const next = createHeadingIds();
    expect(["Gotchas", "Gotchas", "gotchas!", "Other"].map(next)).toEqual([
      "gotchas",
      "gotchas-2",
      "gotchas-3",
      "other",
    ]);
  });

  it("reads inline markdown the way the renderer sees it", () => {
    expect(inlineText("The `storage_cap_bytes` *column*")).toBe(
      "The storage_cap_bytes column",
    );
    expect(inlineText("See [the doc](../x.md#y) and __this__")).toBe(
      "See the doc and this",
    );
    expect(inlineText("*a* _b_ **c** 2 * 3")).toBe("a b c 2 * 3");
    // Raw HTML renders no element in format "md", but the text between the
    // tags is still text, so it stays.
    expect(inlineText("A \\* literal &amp; <kbd>x</kbd>")).toBe(
      "A * literal & x",
    );
    expect(
      nodeText(["The ", createElement("code", null, "code"), " span"]),
    ).toBe("The code span");
  });

  it("headingsOf skips fenced code, drops h4+, and honours maxDepth", () => {
    const body = [
      "# Title",
      "```md",
      "## Not a heading",
      "```",
      "## Real",
      "### Deeper",
      "#### Too deep",
      "## Real",
      "~~~",
      "## Nor this",
      "~~~",
    ].join("\n");
    expect(headingsOf(body).map((h) => [h.id, h.depth, h.line])).toEqual([
      ["title", 1, 1],
      ["real", 2, 5],
      ["deeper", 3, 6],
      ["real-2", 2, 8],
    ]);
    // The counter runs over every h1..h3 no matter the cap, so ids agree.
    expect(headingsOf(body, 2).map((h) => h.id)).toEqual([
      "title",
      "real",
      "real-2",
    ]);
  });
});

describe("listings", () => {
  it("listSpecs returns every proposal document, and none is a retired board's", () => {
    // A board's argument lives in its own spec.ts; a docs/specs document is
    // written only when a board needs one, and it leaves with its board, so
    // what is decided lives in production rather than in a spec.
    const standing = new Set<string>(SANDBOX.map((r) => r.id));
    for (const spec of listSpecs()) {
      expect(spec.title.length, spec.slug).toBeGreaterThan(0);
      expect(spec.title.startsWith("#")).toBe(false);
      expect(
        standing.has(spec.slug),
        `${spec.slug} has no standing board`,
      ).toBe(true);
    }
  });

  it("listTracks reads every manifest", () => {
    const tracks = listTracks();
    // Only open and handed-off tracks keep a manifest (the revamp, 2026-09-16).
    expect(tracks.length).toBeGreaterThan(0);
    for (const t of tracks) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.status.length).toBeGreaterThan(0);
      expect(typeof t.preview).toBe("boolean");
    }
    expect(tracks.map((t) => t.name)).toEqual(
      [...tracks.map((t) => t.name)].sort(),
    );
  });
});

describe("every rendered doc compiles as markdown", () => {
  const docs = renderedDocs();
  // The Orchestrator's pickup always renders; the other manifests come and go
  // with the lanes, so they are never counted on.
  expect(docs).toContain("docs/tracks/orchestrator.md");

  for (const path of docs) {
    it.concurrent(
      `${path} compiles, and renders the ids headingsOf predicts`,
      async () => {
        const { body } = readDoc(path);
        // The renderer's components, reduced to a recorder: the same
        // `nodeText` over the same rendered children, in document order.
        const seen: string[] = [];
        const record = ({ children }: { children?: ReactNode }) => {
          seen.push(nodeText(children));
          return null;
        };
        const { content } = await compileMDX({
          source: body,
          components: { h1: record, h2: record, h3: record },
          options: { mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } },
        });
        renderToStaticMarkup(content);
        const next = createHeadingIds();
        expect(seen.map(next)).toEqual(headingsOf(body).map((h) => h.id));
      },
    );
  }
});
