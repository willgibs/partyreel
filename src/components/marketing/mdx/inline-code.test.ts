import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { mdxComponents } from "@/components/marketing/mdx-components";

/**
 * INLINE CODE WEARS THE MUTED PLATE, A FENCED BLOCK DOES NOT (crumbs-50).
 *
 * A help or blog article's `code` ("partyreel.com/e/maya-and-sam", ".heic") had no plate: the typography
 * plugin drew it bold between two literal backticks and the pages' `prose-code:font-sans` set it in the body
 * face and nothing more. The map now draws it on the house's value plate, out of every `prose` code rule
 * (`not-prose`, which is also what drops the backticks). What the markup says is what is held here: the
 * painted look is the Library's and production's to show.
 *
 * ★ THE BLOCK IS THE OTHER HALF. MDX hands a fenced block to the same `code`, so an unguarded plate would
 * sit inside the block's own ground; `pre` stands each block's code bare, as it was drawn before the plate.
 */
async function render(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });
  return renderToStaticMarkup(content);
}

describe("inline code in help and blog prose", () => {
  it("★ is a value on the muted plate, out of the prose code rules, in the body face", async () => {
    const html = await render(
      "Your link looks like `partyreel.com/e/maya-and-sam` once you set it.",
    );
    const code = /<code([^>]*)>partyreel\.com\/e\/maya-and-sam<\/code>/.exec(
      html,
    );
    expect(code, html).not.toBeNull();
    const classes = /class="([^"]*)"/.exec(code![1])?.[1].split(/\s+/) ?? [];
    // The plate (the house's `rounded bg-muted px-1.5 py-0.5`), one press to take it whole.
    for (const token of [
      "rounded",
      "bg-muted",
      "px-1.5",
      "py-0.5",
      "select-all",
    ]) {
      expect(classes, token).toContain(token);
    }
    // Out of the plugin's code rules (its weight, and the two backticks it prints around a code), and
    // never the preflight's mono stack: the site has no mono face.
    expect(classes).toContain("not-prose");
    expect(classes).toContain("font-sans");
  });

  it("★ keeps a fenced block's code bare, with no plate laid inside the block", async () => {
    const html = await render("```\nrun this\n```\n");
    const block = /<pre[^>]*>([\s\S]*?)<\/pre>/.exec(html);
    expect(block, html).not.toBeNull();
    expect(block![1]).toContain("run this");
    expect(block![1]).not.toMatch(/bg-muted|not-prose|select-all/);
  });

  it("is registered once, in the shared map every article reads", () => {
    expect(mdxComponents).toHaveProperty("code");
    expect(mdxComponents).toHaveProperty("pre");
  });
});
