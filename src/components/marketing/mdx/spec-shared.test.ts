import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { mdxComponents } from "@/components/marketing/mdx-components";
import { getAllArticles } from "@/lib/content/help";

import { EventPassTerm, InactivityMonths, MaxEvents } from "./spec-shared";

/**
 * A PHRASE THAT OPENS A SENTENCE WEARS ITS CAPITAL (crumbs-14). The phrase inlines (`<MaxEvents />`
 * "one event", `<EventPassTerm />` "about a year", `<InactivityMonths />` "about 6 months") render
 * lowercase for the middle of a sentence, and only the article knows where one stands, so the
 * article says `capitalized` where it opens a bullet, a sentence or a table cell (help's cells are
 * sentence case: "No end date", "One per pass"). The free plan's first bullet read "one event at a
 * time." until it did.
 */

describe("MaxEvents", () => {
  it("is a phrase for the middle of a sentence, capitalized where it opens one", () => {
    expect(renderToStaticMarkup(EventPassTerm({}))).toBe("about a year");
    expect(renderToStaticMarkup(EventPassTerm({ capitalized: true }))).toBe(
      "About a year",
    );
    expect(renderToStaticMarkup(InactivityMonths({}))).toMatch(
      /^about \d+ months$/,
    );
    expect(
      renderToStaticMarkup(InactivityMonths({ capitalized: true })),
    ).toMatch(/^About \d+ months$/);
    expect(renderToStaticMarkup(MaxEvents({ tier: "free" }))).toBe("one event");
    expect(
      renderToStaticMarkup(MaxEvents({ tier: "free", capitalized: true })),
    ).toBe("One event");
    expect(
      renderToStaticMarkup(MaxEvents({ tier: "pro", capitalized: true })),
    ).toBe("Unlimited events");
  });

  it("★ opens the free plan's first bullet with a capital, rendered through the article", async () => {
    const article = getAllArticles().find(
      (a) => a.slug === "what-the-free-plan-includes",
    )!;
    // Every other component stands in as nothing: the bullet's opening is what is read.
    const components = Object.fromEntries(
      Object.keys(mdxComponents)
        .filter((name) => /^[A-Z]/.test(name))
        .map((name) => [name, () => null]),
    );
    const { content } = await compileMDX({
      source: article.body,
      components: { ...components, MaxEvents },
      options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
    });
    const firstBullet = /<li>([\s\S]*?)<\/li>/.exec(
      renderToStaticMarkup(content),
    )![1];
    expect(firstBullet).toMatch(/^<strong>One event<\/strong> at a time\./);
  });

  it("wears `capitalized` in every article exactly where a phrase opens a bullet, a sentence or a cell", () => {
    // Where it opens: a list item's start (bold or not), a table cell's start, a paragraph's start,
    // or the word after a sentence's end.
    const PHRASE = "<(?:MaxEvents|EventPassTerm|InactivityMonths)\\b[^>]*>";
    const OPENS = new RegExp(
      `(^\\s*[-*]\\s+(\\*\\*)?|\\|\\s*|^(\\*\\*)?|[.!?]\\s+(\\*\\*)?)${PHRASE}`,
      "gm",
    );
    const ANY = new RegExp(PHRASE, "g");
    for (const article of getAllArticles()) {
      const opening = new Set(
        [...article.body.matchAll(OPENS)].map((m) => m.index! + m[1].length),
      );
      for (const m of article.body.matchAll(ANY)) {
        const capitalized = /\bcapitalized\b/.test(m[0]);
        const where = `${article.slug}: ${m[0]}`;
        expect(capitalized, where).toBe(opening.has(m.index!));
      }
    }
  });
});
