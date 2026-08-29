import { describe, expect, it } from "vitest";

import {
  AUTHOR_IDS,
  DEFAULT_AUTHOR_ID,
  getAuthor,
} from "@/lib/content/authors";
import {
  type BlogPost,
  blogFrontmatterSchema,
  buildBlogRssXml,
  getAllPosts,
  getAllTags,
  getRelatedPosts,
} from "@/lib/content/blog";
import { escapeXml, readingTime } from "@/lib/content/collection";

const posts = getAllPosts();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("blog content integrity", () => {
  it("loads posts", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("every post has valid, complete frontmatter", () => {
    for (const post of posts) {
      expect(blogFrontmatterSchema.safeParse(post.frontmatter).success).toBe(
        true,
      );
      expect(post.frontmatter.title.trim()).not.toBe("");
      expect(post.frontmatter.description.length).toBeLessThanOrEqual(160);
      expect(post.frontmatter.date).toMatch(ISO_DATE);
      if (post.frontmatter.updated)
        expect(post.frontmatter.updated).toMatch(ISO_DATE);
      expect(AUTHOR_IDS).toContain(post.frontmatter.author);
      expect(post.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("has unique slugs", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("is sorted newest-first and excludes drafts", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].frontmatter.date >= posts[i].frontmatter.date).toBe(
        true,
      );
    }
    expect(posts.every((p) => p.frontmatter.draft === false)).toBe(true);
  });
});

describe("title layout contract", () => {
  it("every shipped title fits the card rhythm", () => {
    // The cards clamp, so this can never break the page - it guards the RHYTHM Will ruled on
    // (featured ~3 lines, library cards 2), which clamping would silently destroy instead.
    for (const post of getAllPosts()) {
      expect(
        post.frontmatter.title.length,
        `${post.slug} title is ${post.frontmatter.title.length} chars`,
      ).toBeLessThanOrEqual(80);
    }
  });

  it("rejects an over-long title at the schema, with a message that says why", () => {
    const result = blogFrontmatterSchema.safeParse({
      title: "x".repeat(81),
      description: "A description",
      date: "2026-05-31",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("80 characters");
    }
  });
});

describe("authors registry", () => {
  it("resolves the universal author and falls back for anything else", () => {
    // ONE registered author by ruling (2026-08-28); see authors.ts. The contract that matters is
    // the fallback: an unknown id must resolve, never throw, so a stale frontmatter value can
    // never take a page down.
    expect(DEFAULT_AUTHOR_ID).toBe("partyreel-team");
    expect(getAuthor("partyreel-team").name).toBe("Partyreel Team");
    expect(getAuthor("nobody").name).toBe("Partyreel Team");
    expect(getAuthor("will-gibson").name).toBe("Partyreel Team");
  });
});

describe("readingTime", () => {
  it("computes ~200 wpm, min 1 minute", () => {
    expect(readingTime("word ".repeat(400))).toBe("2 min read");
    expect(readingTime("just a few words")).toBe("1 min read");
  });
});

describe("escapeXml", () => {
  it("escapes XML-significant characters, ampersand first", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe(
      "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;",
    );
    expect(escapeXml("&lt;")).toBe("&amp;lt;");
  });
});

describe("buildBlogRssXml", () => {
  const TEST_SITE = {
    url: "https://partyreel.com",
    name: "Partyreel",
    description: "Collect every photo and video from your event.",
  };
  const fixture: BlogPost = {
    slug: "test-post",
    frontmatter: {
      title: "Tom & Jerry's <party>",
      description: "A description",
      date: "2026-05-31",
      author: "partyreel-team",
      tags: ["parties"],
      draft: false,
    },
    body: "hello world",
  };

  it("emits a valid RSS channel with one escaped item per post", () => {
    const xml = buildBlogRssXml([fixture], TEST_SITE);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>Partyreel Blog</title>");
    expect((xml.match(/<item>/g) ?? []).length).toBe(1);
    // Title is XML-escaped, not raw.
    expect(xml).toContain("Tom &amp; Jerry&apos;s &lt;party&gt;");
    expect(xml).not.toContain("Tom & Jerry's <party>");
    expect(xml).toContain("https://partyreel.com/blog/test-post");
    expect(xml).toContain("<dc:creator>Partyreel Team</dc:creator>");
    // pubDate is RFC-822 (e.g. "... 2026 ... GMT").
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} 2026/);
  });

  it("emits one item per real post", () => {
    const xml = buildBlogRssXml(posts, TEST_SITE);
    expect((xml.match(/<item>/g) ?? []).length).toBe(posts.length);
  });
});

describe("getAllTags / getRelatedPosts", () => {
  it("returns sorted unique tags", () => {
    const tags = getAllTags();
    expect(tags).toEqual([...tags].sort());
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("related posts exclude self and cap at the limit", () => {
    if (posts.length > 0) {
      const related = getRelatedPosts(posts[0], 3);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(related.some((p) => p.slug === posts[0].slug)).toBe(false);
    }
  });
});
