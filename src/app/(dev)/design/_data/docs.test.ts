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

import { RULINGS } from "../touchpoints";
import {
  DOCS,
  createHeadingIds,
  headingsOf,
  inlineText,
  landminesOf,
  listRulings,
  listSpecs,
  listTracks,
  nodeText,
  readDoc,
  sectionOf,
  sectionsMatching,
} from "./docs";
import { TRACED_DOC_GLOBS } from "./legacy-routes";
import { DOC_FILES } from "./links";

/**
 * The lab's doc reader against the real repo files (the Library x Lab round,
 * 2026-09-15): every readable doc is traced into the shell's functions, the
 * reader refuses anything outside its allow-list, the heading ids equal the
 * anchors touchpoints.ts writes by hand AND the ids the renderer emits, and
 * every doc the shell renders compiles in the renderer's pipeline (format
 * "md" + GFM), so a doc that breaks the page fails here with its path.
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

/**
 * Anchors that point AHEAD of the doc: an open exploration's ruling names the
 * heading its ratification will add. Each entry must still be missing (the
 * second assertion), so the set empties itself the day the heading lands.
 */
const PENDING_ANCHORS = new Set([
  // floating-surfaces is open (its spec is NOT LAW); design-system.md has no
  // "The floating layer contract" section yet, only the radius table row.
  "docs/systems/design-system.md#the-floating-layer-contract",
]);

/** Every file the shell renders: the doctrine, the rulings, the proposals, the manifests. */
function renderedDocs(): string[] {
  const manifests = readdirSync(join(root, "docs", "tracks"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => `docs/tracks/${f}`);
  return [
    ...Object.values(DOCS).map((d) => d.path),
    "docs/design/rulings.md",
    ...listSpecs().map((s) => `docs/specs/${s.slug}.md`),
    ...manifests,
  ];
}

describe("DOCS", () => {
  it("names five docs that exist and are traced into the shell's functions", () => {
    const entries = Object.entries(DOCS);
    expect(entries).toHaveLength(5);
    for (const [id, doc] of entries) {
      expect(existsSync(join(root, doc.path)), `${id}: ${doc.path}`).toBe(true);
      expect(isTraced(doc.path), `${doc.path} is not in TRACED_DOC_GLOBS`).toBe(
        true,
      );
      expect(doc.title.length).toBeGreaterThan(0);
    }
  });

  it("names the same five files the link resolver knows as doctrine", () => {
    // Two tables, one truth: links.ts maps a file to its doc page, DOCS maps
    // the page to its file. A path changed in one place must change in both.
    for (const [id, doc] of Object.entries(DOCS)) {
      expect(DOC_FILES[id as keyof typeof DOC_FILES], id).toBe(doc.path);
    }
    expect(Object.keys(DOC_FILES).sort()).toEqual(Object.keys(DOCS).sort());
  });

  it("traces the rulings, the specs and the manifests too", () => {
    for (const path of renderedDocs()) {
      expect(isTraced(path), path).toBe(true);
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
      "CLAUDE.md/../package.json",
      "docs/./PROGRAM.md",
      "docs//PROGRAM.md",
      ".agents/skills/transitions-dev/SKILL.md",
      "AGENTS.md",
      "",
    ]) {
      expect(() => readDoc(bad), bad).toThrow();
    }
  });

  it("reads the allow-listed files and splits frontmatter", () => {
    const guide = readDoc("CLAUDE.md");
    expect(guide.body).toContain("# Partyreel");
    expect(guide.data).toEqual({});

    const craft = readDoc(DOCS.craft.path);
    expect(craft.data.name).toBe("emil-design-eng");
    expect(craft.body.startsWith("---")).toBe(false);

    expect(readDoc("docs/design/rulings.md").body).toContain("## ");
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

  it("produces every anchor the touchpoints registry writes for the two system docs", () => {
    const anchors = RULINGS.flatMap((r) => r.lives).filter((l) =>
      /^docs\/systems\/(design-system|marketing-content)\.md#/.test(l),
    );
    expect(anchors.length).toBeGreaterThanOrEqual(8);
    const idsOf = new Map<string, Set<string>>();
    for (const anchor of anchors) {
      const [path, id] = anchor.split("#");
      if (!idsOf.has(path)) {
        idsOf.set(
          path,
          new Set(headingsOf(readDoc(path).body).map((h) => h.id)),
        );
      }
      const present = idsOf.get(path)!.has(id);
      if (PENDING_ANCHORS.has(anchor)) {
        expect(present, `${anchor} landed: drop it from PENDING_ANCHORS`).toBe(
          false,
        );
      } else {
        expect(present, `${anchor} matches no heading id`).toBe(true);
      }
    }
  });
});

describe("sections", () => {
  const { body } = readDoc(DOCS["design-system"].path);

  it("sectionOf returns the section from its heading to the next peer", () => {
    const section = sectionOf(body, "the-craft-guidance-stack");
    expect(section).not.toBeNull();
    expect(section!.startsWith("## The craft guidance stack")).toBe(true);
    expect(section!.length).toBeGreaterThan(200);
    expect(section).not.toContain("\n## ");
    expect(sectionOf(body, "no-such-heading")).toBeNull();
  });

  it("a ### section ends at the next ### or ##, never at a ####", () => {
    const section = sectionOf(body, "the-shipped-light");
    expect(section!.startsWith("### The shipped light")).toBe(true);
    expect(section).not.toContain("\n### ");
    expect(section).not.toContain("\n## ");
  });

  it("sectionsMatching finds the ## headings whose text matches", () => {
    const gotchas = sectionsMatching(body, /^Gotchas/);
    expect(gotchas).toHaveLength(1);
    expect(gotchas[0].id).toBe("gotchas-dont-revert");
    expect(gotchas[0].body.startsWith("- ★")).toBe(true);
    expect(sectionsMatching(body, /^The /g).length).toBeGreaterThan(2);
    expect(sectionsMatching(body, /zzz/)).toEqual([]);
  });

  it("landminesOf lists every ★ block with the heading above it", () => {
    const mines = landminesOf(body);
    expect(mines.length).toBeGreaterThan(10);
    const ids = new Set(headingsOf(body).map((h) => h.id));
    for (const mine of mines) {
      expect(mine.text.startsWith("★"), mine.text).toBe(false);
      expect(mine.text.length).toBeGreaterThan(20);
      expect(mine.under.length, mine.text).toBeGreaterThan(0);
      expect(ids.has(mine.underId), mine.underId).toBe(true);
    }
    const bareCode = mines.find((m) => m.text.startsWith("**A bare `<code>`"));
    expect(bareCode?.under).toBe("Gotchas / don't-revert");
    expect(bareCode?.text).toContain("preflight");
    // A bold opener keeps its bold once the glyph is lifted out.
    expect(
      mines.some((m) => m.text.startsWith("**The vaul motion gotcha:**")),
    ).toBe(true);
    // A ★ mentioned mid-sentence is prose, not a landmine.
    expect(mines.some((m) => m.text.startsWith("is never a rule"))).toBe(false);
  });
});

describe("listings", () => {
  it("listSpecs returns the six board specs and not reel-v1", () => {
    const specs = listSpecs();
    expect(specs.map((s) => s.slug)).toEqual([
      "brand-voice",
      "floating-surfaces",
      "light",
      "media-kit",
      "palette",
      "type-scale",
    ]);
    for (const spec of specs) {
      expect(spec.title.length, spec.slug).toBeGreaterThan(0);
      expect(spec.title.startsWith("#")).toBe(false);
    }
    expect(specs.find((s) => s.slug === "brand-voice")?.status).toContain(
      "STATUS",
    );
    expect(specs.find((s) => s.slug === "light")?.status).toContain("NOT LAW");
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

  it("listRulings is the dated ## record", () => {
    const rulings = listRulings();
    expect(rulings.length).toBeGreaterThan(5);
    expect(rulings.every((r) => r.depth === 2)).toBe(true);
    expect(new Set(rulings.map((r) => r.id)).size).toBe(rulings.length);
    expect(rulings.some((r) => r.text.startsWith("2026-09-12"))).toBe(true);
  });
});

describe("every rendered doc compiles as markdown", () => {
  const docs = renderedDocs();
  expect(docs.length).toBeGreaterThan(10);

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
