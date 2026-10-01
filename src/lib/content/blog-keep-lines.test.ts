import { compileMDX } from "next-mdx-remote/rsc";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { mdxComponents } from "@/components/marketing/mdx-components";
import { getAllPosts } from "@/lib/content/blog";
import { INACTIVE_MONTHS } from "@/lib/lifecycle/inactivity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * THE BLOG'S KEEP LINES SAY THE FREE PLAN'S ONE EXCEPTION (crumbs-36, from crumbs-34; the help guide's rule 7 and
 * `docs/systems/marketing-content.md`'s ★ on "stays up"). Events have no end date, but on the Free plan an event
 * nobody touches for about six months is warned about by email, then moved to Deleted, where it can be restored
 * for thirty days. The home FAQ and the event pages say both halves in one breath (`faq-data.test.ts`,
 * `events.test.ts`); two posts still said the rule alone: the reunion's "no expiry clock on it and no countdown to
 * a deletion", and the trip's "an event has no end date" and "Nothing expires underneath it". A Free host who
 * read either and then met the removal email met a promise the site had made without its exception.
 *
 * The posts read as a reader reads them: compiled through the real component map, the numbers coming from the
 * spec inlines (`<InactivityMonths />`, `<RecoveryWindowDays />`), so the sentence cannot drift from the sweep.
 */

const SLUGS = ["family-reunion-photo-sharing", "group-trip-photo-sharing"];

/** Every component but the two the exception is made of stands in as its own children, so the prose reads whole. */
const stand = ({ children }: { children?: ReactNode }) =>
  createElement(Fragment, null, children);
const components = {
  ...Object.fromEntries(
    Object.keys(mdxComponents)
      .filter((name) => /^[A-Z]/.test(name))
      .map((name) => [name, stand]),
  ),
  InactivityMonths: mdxComponents.InactivityMonths,
  RecoveryWindowDays: mdxComponents.RecoveryWindowDays,
  RecoveryDays: mdxComponents.RecoveryDays,
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
};

/** The paragraphs and list items of a post as a reader reads them, tags gone. */
async function blocksOf(slug: string): Promise<string[]> {
  const post = getAllPosts().find((p) => p.slug === slug);
  expect(post, `${slug} is a post`).toBeDefined();
  const { content } = await compileMDX({
    source: post!.body,
    components,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });
  const html = renderToStaticMarkup(content);
  return [...html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) =>
    m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&(?:amp|lt|gt|quot|#x27);/g, (e) => ENTITIES[e])
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** The lines that promised how long an album lasts with nothing beside them. */
const ABSOLUTES = [
  "no expiry clock",
  "no countdown to a deletion",
  "no end date",
  "nothing expires",
];

describe("the blog's keep lines", () => {
  for (const slug of SLUGS) {
    describe(slug, () => {
      it("says the Free plan's idle removal, its warning, where it goes and how long it can be restored", async () => {
        const text = (await blocksOf(slug)).join("\n");
        expect(text).toContain("Free");
        expect(text).toContain(`about ${INACTIVE_MONTHS} months`);
        expect(text).toMatch(/warning email/);
        expect(text).toContain("Deleted");
        expect(text).toContain(`${RECENTLY_DELETED_WINDOW_DAYS} days`);
        expect(text).toMatch(/any activity resets the clock/i);
      });

      it("★ no paragraph promises how long an album lasts without the exception in it", async () => {
        const blocks = await blocksOf(slug);
        const promises = blocks.filter((block) =>
          ABSOLUTES.some((words) => block.toLowerCase().includes(words)),
        );
        for (const block of promises) {
          expect(block, block).toContain("Free");
          expect(block, block).toContain(`about ${INACTIVE_MONTHS} months`);
        }
      });
    });
  }

  it("reads the posts it names (a scan that finds none proves nothing)", async () => {
    for (const slug of SLUGS) {
      expect((await blocksOf(slug)).length, slug).toBeGreaterThan(10);
    }
  });
});
