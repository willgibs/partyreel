import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BIBLE } from "@/app/(dev)/design/rules/bible";
import { RULINGS, SANDBOX } from "@/app/(dev)/design/touchpoints";

import {
  editorFor,
  fileFor,
  githubFor,
  hrefFor,
  labelFor,
  parseRef,
  type LabRef,
} from "./links";

/**
 * THE LINK GRAMMAR: every string the registries already use parses to a ref
 * the shell can render, and every file a ref names is on disk. The registry
 * sweep (the boards' `lives`) is the point: an entry that drifts from the
 * grammar fails here, not on a reader's click.
 */
const ROOT = process.cwd();
const onDisk = (file: string) => existsSync(join(ROOT, file));

describe("parseRef: the boards and the bible", () => {
  // ★ NEVER A NAMED BOARD. The URL form validates against the STANDING ids
  // (touchpoints' SANDBOX, which is what parseRef reads), and a named example
  // turned this red at every retirement: the palette, light, then rounding
  // (2026-09-17 and -18). So the example is whichever board stands first, and
  // with none standing there is nothing to parse and the case skips, never
  // fails. `board:` does not validate, so its case reads an id that left long
  // ago and always runs.
  const standing = SANDBOX[0]?.id;
  it.runIf(standing !== undefined)(
    "reads a standing board's /design/c/ and /design/lab/ URLs as that board",
    () => {
      expect(parseRef(`/design/c/${standing}#x-02`)).toEqual({
        kind: "board",
        id: standing,
        anchor: "x-02",
      });
      expect(parseRef(`/design/lab/${standing}`)).toEqual({
        kind: "board",
        id: standing,
      });
    },
  );

  it("reads board:<id>#<anchor> without validating the id", () => {
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

  it("reads bible 8 as the eighth principle, in every spelling", () => {
    const eighth = BIBLE[7].id;
    expect(parseRef("bible 8")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef("bible-8")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef("Bible 8.")).toEqual({ kind: "rule", id: eighth });
    expect(parseRef(`bible:${eighth}`)).toEqual({ kind: "rule", id: eighth });
    expect(parseRef(`rule:${eighth}`)).toEqual({ kind: "rule", id: eighth });
  });

  it("names a principle by its number", () => {
    expect(labelFor(parseRef("bible 8"))).toBe("bible 8");
    expect(labelFor({ kind: "rule", id: "not-a-rule" })).toBe(
      "rule not-a-rule",
    );
  });
});

describe("parseRef: paths", () => {
  it("keeps a component, a test, a directory and a doc as source", () => {
    expect(parseRef("src/components/ui/button.tsx")).toEqual({
      kind: "source",
      file: "src/components/ui/button.tsx",
    });
    expect(parseRef("src/lib/no-em-dash-policy.test.ts")).toEqual({
      kind: "source",
      file: "src/lib/no-em-dash-policy.test.ts",
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
    expect(parseRef("src/components/ui/button.tsx:40")).toEqual({
      kind: "source",
      file: "src/components/ui/button.tsx",
      line: 40,
    });
  });
});

describe("parseRef: the documents", () => {
  it("reads proposals and tracks, and any other doc as source", () => {
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
    expect(parseRef("docs/PROGRAM.md#the-round")).toEqual({
      kind: "source",
      file: "docs/PROGRAM.md",
    });
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
    { kind: "rule", id: "media-is-the-color" },
    { kind: "board", id: "palette", anchor: "pal-02" },
    { kind: "proposal", slug: "palette" },
    { kind: "track", name: "palette" },
  ];

  it("routes a principle, board, proposal and track under /design/", () => {
    for (const ref of routed) {
      expect(hrefFor(ref), ref.kind).toMatch(/^\/design\//);
    }
    // A principle is an anchor on the ten's one page.
    expect(hrefFor(routed[0])).toBe(
      "/design/library/rules#media-is-the-color",
    );
    expect(hrefFor(routed[1])).toBe("/design/lab/palette#pal-02");
    expect(hrefFor(routed[2])).toBe("/design/lab/proposals/palette");
    expect(hrefFor(routed[3])).toBe("/design/lab/tracks/palette");
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
  });

  it("offers no blob for a ref whose lab page is the destination", () => {
    expect(githubFor({ kind: "rule", id: "one-token-set" })).toBeNull();
    expect(githubFor({ kind: "board", id: "palette" })).toBeNull();
    expect(githubFor({ kind: "external", url: "https://x.y" })).toBeNull();
  });

  it("builds vscode://file/root/path:line for any ref with a file", () => {
    expect(editorFor(source, "/root")).toBe(
      "vscode://file/root/src/app/globals.css:12",
    );
    expect(editorFor({ kind: "rule", id: "one-token-set" }, "/root/")).toBe(
      "vscode://file/root/src/app/(dev)/design/rules/bible.ts",
    );
    expect(
      editorFor({ kind: "page", href: "/design/lab" }, "/root"),
    ).toBeNull();
  });

  it("names the file behind every kind that has one", () => {
    expect(fileFor({ kind: "proposal", slug: "light" })).toBe(
      "docs/specs/light.md",
    );
    expect(fileFor({ kind: "track", name: "palette" })).toBe(
      "docs/tracks/palette.md",
    );
    expect(fileFor({ kind: "board", id: "palette" })).toBeNull();
  });
});

describe("the registries resolve through the grammar", () => {
  it("parses every board's lives entry to a lab ref with a real file", () => {
    for (const board of RULINGS) {
      for (const text of board.lives) {
        const ref = parseRef(text);
        expect(ref.kind, `${board.id}: ${text}`).not.toBe("external");
        const file = fileFor(ref);
        if (file !== null) {
          expect(onDisk(file), `${board.id}: ${text} -> ${file}`).toBe(true);
        }
      }
    }
  });
});
