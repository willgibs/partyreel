import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { getAllArticles } from "./help";

/**
 * Every help article must COMPILE as MDX with the components the article page
 * registers (the help-catalog round, 2026-09-01). The frontmatter tests never
 * parse the body, so a stray `{placeholder}` inside a <UiLabel> (blockJS
 * strips or rejects JS expressions), an unclosed tag, or a component name the
 * vocabulary does not export used to surface only at `pnpm build`, one
 * prerender at a time. Compiling here makes it a unit failure with the slug
 * in the message.
 *
 * The real table is imported for its KEYS only (the unit project resolves it
 * fine); every entry is replaced by a stub, since compile needs to know which
 * JSX names are legal, not how they render.
 */
import { mdxComponents } from "@/components/marketing/mdx-components";

const componentNames = Object.keys(mdxComponents).filter((name) =>
  /^[A-Z]/.test(name),
);

const stub = () => null;
const components = Object.fromEntries(componentNames.map((n) => [n, stub]));

describe("help articles compile as MDX", () => {
  it("the component vocabulary is non-empty", () => {
    // Pinned for non-emptiness: an empty table would make every article
    // "compile" against nothing and hide unknown-component errors.
    expect(componentNames.length).toBeGreaterThan(10);
    expect(componentNames).toContain("Callout");
    expect(componentNames).toContain("UiLabel");
  });

  const articles = getAllArticles();
  expect(articles.length).toBeGreaterThan(0);

  for (const article of articles) {
    it.concurrent(`${article.slug} compiles`, async () => {
      await expect(
        compileMDX({
          source: article.body,
          components,
          options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
        }),
      ).resolves.toBeDefined();
    });
  }

  it("no article uses a component outside the vocabulary", () => {
    const known = new Set(componentNames);
    for (const article of articles) {
      const used = [...article.body.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)].map(
        (m) => m[1],
      );
      for (const name of used) {
        expect(known.has(name), `${article.slug} uses <${name}>`).toBe(true);
      }
    }
  });
});
