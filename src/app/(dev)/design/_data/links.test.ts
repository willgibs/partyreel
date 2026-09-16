import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BIBLE } from "@/app/(dev)/design/rules/bible";
import { COMPONENTS } from "@/app/(dev)/design/rules/rules";
import { RULINGS } from "@/app/(dev)/design/touchpoints";

import {
  DOC_FILES,
  POLICY_TESTS,
  editorFor,
  fileFor,
  githubFor,
  hrefFor,
  labelFor,
  parseRef,
  type LabRef,
} from "./links";

/**
 * THE LINK GRAMMAR'S CONTRACT: every string the registries already use parses
 * to a ref the shell can render, and every file a ref names is on disk. The
 * two registry sweeps (the rulings' `lives`, the bible's `enforcedBy`) are the
 * point: a registry entry that drifts from the grammar fails here, not on a
 * reader's click.
 */
const ROOT = process.cwd();
const onDisk = (file: string) => existsSync(join(ROOT, file));

describe("parseRef: the boards and the bible", () => {
  it("reads /design/c/palette#pal-02 as the palette board at pal-02", () => {
    expect(parseRef("/design/c/palette#pal-02")).toEqual({
      kind: "board",
      id: "palette",
      anchor: "pal-02",
    });
    expect(parseRef("/design/lab/palette")).toEqual({
      kind: "board",
      id: "palette",
    });
    expect(parseRef("board:palette#pal-02")).toEqual({
      kind: "board",
      id: "palette",
      anchor: "pal-02",
    });
  });

  it("keeps the desk's other routes as pages", () => {
    expect(parseRef("/design/lab/kit")).toEqual({
      kind: "page",
      href: "/design/lab/kit",
    });
    expect(parseRef("/design/lab/tools/motion")).toEqual({
      kind: "page",
      href: "/design/lab/tools/motion",
    });
    expect(parseRef("/design/c/entry")).toEqual({
      kind: "page",
      href: "/design/c/entry",
    });
  });

  it("reads bible 8 as the eighth rule, in every spelling", () => {
    const eighth = BIBLE[7].id;
    expect(parseRef("bible 8")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef("bible-8")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef("Bible 8.")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef(`bible:${eighth}`)).toEqual({ kind: "rule", id: eighth });
    expect(parseRef(`rule:${eighth}`)).toEqual({ kind: "rule", id: eighth });
  });

  it("names a rule by its number", () => {
    expect(labelFor(parseRef("bible 8"))).toBe("bible 8");
    expect(labelFor({ kind: "rule", id: "not-a-rule" })).toBe(
      "rule not-a-rule",
    );
  });
});

describe("parseRef: code paths and policies", () => {
  it("reads src/components/ui/button.tsx as the button component", () => {
    const record = COMPONENTS.find(
      (c) => c.file === "src/components/ui/button.tsx",
    );
    expect(record, "the artifact indexes the button").toBeDefined();
    expect(parseRef("src/components/ui/button.tsx")).toEqual({
      kind: "component",
      id: record!.id,
    });
    expect(parseRef("src/components/ui/button.tsx#contracts")).toEqual({
      kind: "component",
      id: record!.id,
      anchor: "contracts",
    });
  });

  it("reads src/lib/no-em-dash-policy.test.ts as a policy", () => {
    expect(parseRef("src/lib/no-em-dash-policy.test.ts")).toEqual({
      kind: "policy",
      id: "no-em-dash-policy",
    });
    expect(parseRef("policy:no-em-dash-policy")).toEqual({
      kind: "policy",
      id: "no-em-dash-policy",
    });
  });

  it("keeps a contract test, a directory and an unknown file as source", () => {
    expect(
      parseRef("src/components/marketing/chrome/footer-contract.test.ts"),
    ).toEqual({
      kind: "source",
      file: "src/components/marketing/chrome/footer-contract.test.ts",
    });
    expect(parseRef("src/components/ui/")).toEqual({
      kind: "source",
      file: "src/components/ui/",
    });
    expect(parseRef("docs/systems/host-app.md#a-chapter")).toEqual({
      kind: "source",
      file: "docs/systems/host-app.md",
    });
  });

  it("keeps a line on a source ref, in both spellings", () => {
    expect(parseRef("src/app/globals.css:12")).toEqual({
      kind: "source",
      file: "src/app/globals.css",
      line: 12,
    });
    expect(parseRef("src/app/globals.css#L12")).toEqual({
      kind: "source",
      file: "src/app/globals.css",
      line: 12,
    });
    // A line means a place in the file, so a component file with a line is a
    // source ref too (the component page has no line to jump to).
    expect(parseRef("src/components/ui/button.tsx:40")).toEqual({
      kind: "source",
      file: "src/components/ui/button.tsx",
      line: 40,
    });
  });
});

describe("parseRef: the documents", () => {
  it("reads the five doctrine files as docs, with their anchors", () => {
    expect(parseRef("docs/systems/design-system.md#the-shipped-light")).toEqual(
      {
        kind: "doc",
        doc: "design-system",
        anchor: "the-shipped-light",
      },
    );
    expect(parseRef("docs/systems/marketing-content.md")).toEqual({
      kind: "doc",
      doc: "marketing-content",
    });
    expect(parseRef("docs/PROGRAM.md#gates")).toEqual({
      kind: "doc",
      doc: "program",
      anchor: "gates",
    });
    expect(parseRef("CLAUDE.md")).toEqual({ kind: "doc", doc: "agent-guide" });
    expect(parseRef(".agents/skills/emil-design-eng/SKILL.md")).toEqual({
      kind: "doc",
      doc: "craft",
    });
  });

  it("reads proposals, tracks, rulings and the guidance", () => {
    expect(parseRef("docs/specs/palette.md#the-model")).toEqual({
      kind: "proposal",
      slug: "palette",
      anchor: "the-model",
    });
    expect(parseRef("docs/tracks/palette.md")).toEqual({
      kind: "track",
      name: "palette",
    });
    expect(parseRef("docs/tracks/README.md")).toEqual({
      kind: "source",
      file: "docs/tracks/README.md",
    });
    expect(parseRef("docs/design/rulings.md#less-is-more")).toEqual({
      kind: "ruling",
      slug: "less-is-more",
    });
    expect(parseRef("docs/design/rulings.md")).toEqual({
      kind: "page",
      href: "/design/library/rulings",
    });
    expect(parseRef("docs/design/guidance.md#boards")).toEqual({
      kind: "guidance",
      anchor: "boards",
    });
    expect(parseRef("docs/design/guidance.md")).toEqual({ kind: "guidance" });
  });

  it("reads a URL as external and trims the text", () => {
    expect(parseRef("  https://partyreel.com/pricing. ")).toEqual({
      kind: "external",
      url: "https://partyreel.com/pricing",
    });
  });
});

describe("hrefFor", () => {
  const routed: LabRef[] = [
    { kind: "rule", id: "tokens-never-literals" },
    { kind: "board", id: "palette", anchor: "pal-02" },
    { kind: "doc", doc: "design-system", anchor: "x" },
    { kind: "proposal", slug: "palette" },
    { kind: "track", name: "palette" },
  ];

  it("routes a rule, board, doc, proposal and track under /design/", () => {
    for (const ref of routed) {
      expect(hrefFor(ref), ref.kind).toMatch(/^\/design\//);
    }
    expect(hrefFor(routed[0])).toBe(
      "/design/library/rules/tokens-never-literals",
    );
    expect(hrefFor(routed[1])).toBe("/design/lab/palette#pal-02");
    expect(hrefFor(routed[2])).toBe("/design/library/doctrine/design-system#x");
    expect(hrefFor(routed[3])).toBe("/design/lab/proposals/palette");
    expect(hrefFor(routed[4])).toBe("/design/lab/tracks/palette");
  });

  it("anchors a component, a policy, a ruling and the guidance", () => {
    expect(
      hrefFor({ kind: "component", id: "button", anchor: "variants" }),
    ).toBe("/design/library/button#variants");
    expect(hrefFor({ kind: "policy", id: "content-policy" })).toBe(
      "/design/library/policies#content-policy",
    );
    expect(hrefFor({ kind: "ruling", slug: "less-is-more" })).toBe(
      "/design/library/rulings#less-is-more",
    );
    expect(hrefFor({ kind: "guidance", anchor: "boards" })).toBe(
      "/design/library/guidance#boards",
    );
  });

  it("has no route for a source file or a URL", () => {
    expect(hrefFor({ kind: "source", file: "src/app/globals.css" })).toBeNull();
    expect(hrefFor({ kind: "external", url: "https://x.y" })).toBeNull();
    expect(hrefFor({ kind: "page", href: "/design/lab/kit" })).toBe(
      "/design/lab/kit",
    );
  });
});

describe("githubFor, editorFor and fileFor", () => {
  const source: LabRef = {
    kind: "source",
    file: "src/app/globals.css",
    line: 12,
  };

  it("builds the blob URL on launch-prep with #L<n>", () => {
    expect(githubFor(source)).toBe(
      "https://github.com/willgibs/partyreel/blob/launch-prep/src/app/globals.css#L12",
    );
    expect(
      githubFor({ kind: "source", file: "src/app/globals.css" }, "main"),
    ).toBe(
      "https://github.com/willgibs/partyreel/blob/main/src/app/globals.css",
    );
    expect(githubFor({ kind: "track", name: "palette" })).toBe(
      "https://github.com/willgibs/partyreel/blob/launch-prep/docs/tracks/palette.md",
    );
    expect(githubFor({ kind: "policy", id: "content-policy" })).toBe(
      "https://github.com/willgibs/partyreel/blob/launch-prep/src/lib/content-policy.test.ts",
    );
  });

  it("offers no blob for a ref whose lab page is the destination", () => {
    expect(githubFor({ kind: "rule", id: "two-faces" })).toBeNull();
    expect(githubFor({ kind: "component", id: "button" })).toBeNull();
    expect(githubFor({ kind: "board", id: "palette" })).toBeNull();
    expect(githubFor({ kind: "board", id: "palette" })).toBeNull();
    expect(githubFor({ kind: "external", url: "https://x.y" })).toBeNull();
  });

  it("builds vscode://file/root/path:line for any ref with a file", () => {
    expect(editorFor(source, "/root")).toBe(
      "vscode://file/root/src/app/globals.css:12",
    );
    expect(editorFor({ kind: "rule", id: "two-faces" }, "/root/")).toBe(
      "vscode://file/root/src/app/(dev)/design/rules/bible.ts",
    );
    expect(editorFor({ kind: "component", id: "button" }, "/root")).toBe(
      "vscode://file/root/src/components/ui/button.tsx",
    );
    expect(
      editorFor({ kind: "page", href: "/design/lab" }, "/root"),
    ).toBeNull();
  });

  it("names the file behind every kind that has one", () => {
    expect(fileFor({ kind: "doc", doc: "craft" })).toBe(DOC_FILES.craft);
    expect(fileFor({ kind: "proposal", slug: "light" })).toBe(
      "docs/specs/light.md",
    );
    expect(fileFor({ kind: "ruling", slug: "x" })).toBe(
      "docs/design/rulings.md",
    );
    expect(fileFor({ kind: "guidance" })).toBe("docs/design/guidance.md");
    expect(fileFor({ kind: "component", id: "no-such-component" })).toBeNull();
    expect(fileFor({ kind: "policy", id: "no-such-policy" })).toBeNull();
    expect(fileFor({ kind: "board", id: "palette" })).toBeNull();
  });
});

describe("the registries resolve through the grammar", () => {
  it("parses every ruling's lives entry to a lab ref with a real file", () => {
    for (const ruling of RULINGS) {
      for (const text of ruling.lives) {
        const ref = parseRef(text);
        expect(ref.kind, `${ruling.id}: ${text}`).not.toBe("external");
        const file = fileFor(ref);
        if (file !== null) {
          expect(onDisk(file), `${ruling.id}: ${text} -> ${file}`).toBe(true);
        }
      }
    }
  });

  it("parses every bible rule's enforcedBy as a policy or an existing file", () => {
    for (const rule of BIBLE) {
      if (rule.enforcedBy === "review") continue;
      for (const text of rule.enforcedBy) {
        const ref = parseRef(text);
        expect(
          ["policy", "component", "source"],
          `${rule.id}: ${text}`,
        ).toContain(ref.kind);
        const file = fileFor(ref);
        expect(file, `${rule.id}: ${text}`).not.toBeNull();
        expect(onDisk(file!), `${rule.id}: ${text} -> ${file}`).toBe(true);
      }
    }
  });

  it("names a policy test that exists, for every known policy", () => {
    for (const [id, file] of Object.entries(POLICY_TESTS)) {
      expect(onDisk(file), `${id} -> ${file}`).toBe(true);
      expect(parseRef(file)).toEqual({ kind: "policy", id });
    }
  });

  it("names a doctrine file that exists, for every doc", () => {
    for (const [doc, file] of Object.entries(DOC_FILES)) {
      expect(onDisk(file), `${doc} -> ${file}`).toBe(true);
    }
  });
});
