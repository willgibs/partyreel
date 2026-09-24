import { describe, expect, it } from "vitest";

import { elementToMarkdown, factsToMarkdown } from "./page-markdown";

/**
 * COPY PAGE MUST PASTE AS MARKDOWN. The whole point of the change is that a
 * rule page dropped into a plan keeps its links, its lists and its tables;
 * `innerText` lost all three and nothing noticed, because nothing looked. A
 * jsdom fixture is the cheapest thing that looks.
 *
 * This is a jsdom test (`.test.tsx`) because the walker takes an Element; the
 * module itself imports no React and no DOM globals.
 */
function fixture(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

const md = (html: string, origin?: string) =>
  elementToMarkdown(fixture(html), origin ? { origin } : {});

describe("the page as markdown", () => {
  it("writes headings at their level", () => {
    expect(md("<h2>Policies</h2><h3>Landmines</h3>")).toBe(
      "## Policies\n\n### Landmines",
    );
  });

  it("keeps a link, and makes an internal one absolute", () => {
    expect(
      md(
        '<p>See <a href="/design/library/rules">the bible</a>.</p>',
        "https://x.dev",
      ),
    ).toBe("See [the bible](https://x.dev/design/library/rules).");
    expect(md('<p><a href="https://a.io/b">out</a></p>', "https://x.dev")).toBe(
      "[out](https://a.io/b)",
    );
  });

  it("writes a list, nested items indented", () => {
    expect(md("<ul><li>one<ul><li>deep</li></ul></li><li>two</li></ul>")).toBe(
      "- one\n  - deep\n- two",
    );
    expect(md("<ol><li>first</li><li>second</li></ol>")).toBe(
      "1. first\n2. second",
    );
  });

  it("joins a list item's own blocks onto its line", () => {
    // The policies page shape: a name, its file and its citations as three
    // paragraphs inside one <li>. Concatenated they read "no-em-dashsrc/lib".
    expect(
      md("<ul><li><p>no-em-dash</p><p>src/lib/x.test.ts</p></li></ul>"),
    ).toBe("- no-em-dash · src/lib/x.test.ts");
  });

  it("writes a table with its header row", () => {
    expect(
      md(
        "<table><tr><th>level</th><th>binds</th></tr><tr><td>law</td><td>always</td></tr></table>",
      ),
    ).toBe("| level | binds |\n| --- | --- |\n| law | always |");
  });

  it("writes a definition list even when each pair is wrapped", () => {
    // The page header's own shape: a flex <dl> whose pairs sit in divs.
    expect(md("<dl><div><dt>Ruled by</dt><dd>Will</dd></div></dl>")).toBe(
      "- **Ruled by**: Will",
    );
  });

  it("fences a code block and keeps its language", () => {
    expect(md('<pre data-language="ts"><code>const a = 1;</code></pre>')).toBe(
      "```ts\nconst a = 1;\n```",
    );
  });

  it("keeps inline emphasis and code", () => {
    expect(md("<p>The <strong>rail</strong> uses <code>cn()</code>.</p>")).toBe(
      "The **rail** uses `cn()`.",
    );
  });

  it("separates two element siblings that only a flex gap divides", () => {
    // `<span>file</span><a>gh</a>` has no whitespace in the DOM at all.
    expect(md('<p><span>src/x.test.ts</span><a href="/y">gh</a></p>')).toBe(
      "src/x.test.ts [gh](/y)",
    );
  });

  it("leaves prose spacing exactly as the text nodes have it", () => {
    expect(md("<p>a <em>b</em> c</p>")).toBe("a *b* c");
  });

  it("drops controls, hidden marks and anything the shell skipped", () => {
    expect(
      md(
        '<p>kept</p><button>Copy page</button><span aria-hidden="true">·</span><div data-copy-skip><p>chrome</p></div>',
      ),
    ).toBe("kept");
  });

  it("puts a marked row on one line", () => {
    expect(
      md(
        "<div data-copy-row><div><p>33</p><p>components</p></div><div><p>16</p><p>patterns</p></div></div>",
      ),
    ).toBe("33 components · 16 patterns");
  });

  it("quotes a blockquote and rules a hr", () => {
    expect(md("<blockquote><p>not law</p></blockquote><hr>")).toBe(
      "> not law\n\n---",
    );
  });

  it("returns nothing for no root", () => {
    expect(elementToMarkdown(null)).toBe("");
  });
});

describe("the page's own facts", () => {
  it("open with the title the page passed, then the trail and the url", () => {
    expect(
      factsToMarkdown({
        title: "Aurora",
        breadcrumbs: ["Library", "Brand kit", "Aurora"],
        url: "https://x.dev/design/library/glow",
      }),
    ).toBe("# Aurora\n\nLibrary > Brand kit · https://x.dev/design/library/glow");
  });

  it("say only the title when there is no trail", () => {
    expect(factsToMarkdown({ title: "The desk" })).toBe("# The desk");
  });
});
