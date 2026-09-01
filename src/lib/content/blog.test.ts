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
  getAllBlogSlugs,
  getPostListItems,
  getPostNeighbors,
  getRelatedPosts,
} from "@/lib/content/blog";
import { coverFor } from "@/lib/content/blog-covers";
import { paginate, splitLibrary } from "@/lib/content/blog-index";
import { BLOG_REDIRECTS } from "@/lib/content/blog-redirects";
import { BLOG_TAG_IDS, audienceTags } from "@/lib/content/blog-tags";
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

  it("carries one or two REGISTERED tags, at most one audience", () => {
    for (const post of posts) {
      const { tags } = post.frontmatter;
      expect(tags.length, post.slug).toBeGreaterThanOrEqual(1);
      expect(tags.length, post.slug).toBeLessThanOrEqual(2);
      for (const tag of tags) expect(BLOG_TAG_IDS, post.slug).toContain(tag);
      expect(audienceTags(tags).length, post.slug).toBeLessThanOrEqual(1);
    }
  });

  it("rejects an unregistered, repeated, third, or double-audience tag at the schema", () => {
    const base = { title: "A title", description: "A description", date: "2026-05-31" };
    const bad = (tags: string[]) =>
      blogFrontmatterSchema.safeParse({ ...base, tags }).success;
    expect(bad(["highlight-reel"])).toBe(false);
    expect(bad([])).toBe(false);
    expect(bad(["how-to", "how-to"])).toBe(false);
    expect(bad(["weddings", "how-to", "product"])).toBe(false);
    expect(bad(["weddings", "parties"])).toBe(false);
    expect(bad(["weddings", "how-to"])).toBe(true);
    expect(bad(["how-to"])).toBe(true);
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

describe("the article ending", () => {
  it("neighbours are chronological, and the ends of the archive are one-sided", () => {
    const all = getAllPosts(); // newest-first
    const newest = getPostNeighbors(all[0]);
    const oldest = getPostNeighbors(all[all.length - 1]);
    expect(newest.newer).toBeNull();
    expect(newest.older?.slug).toBe(all[1].slug);
    expect(oldest.older).toBeNull();
    expect(oldest.newer?.slug).toBe(all[all.length - 2].slug);
  });

  it("a post that is not in the archive yields no neighbours", () => {
    expect(getPostNeighbors({ ...posts[0], slug: "ghost" })).toEqual({
      newer: null,
      older: null,
    });
  });

  it("related posts honour the exclude set", () => {
    const post = posts[0];
    const unfiltered = getRelatedPosts(post, 3);
    expect(unfiltered.length).toBeGreaterThan(0);
    const excluded = new Set([unfiltered[0].slug]);
    const filtered = getRelatedPosts(post, 3, excluded);
    expect(filtered.map((p) => p.slug)).not.toContain(unfiltered[0].slug);
  });

  it("★ no post can appear twice in one ending, for any post in the archive", () => {
    // The invariant the whole two-block ending rests on: neighbours render above related posts, and
    // on a small archive the two sets nearly coincide, so the same article would otherwise show up
    // twice within one screen. This is the page's exact composition, asserted.
    for (const post of getAllPosts()) {
      const { newer, older } = getPostNeighbors(post);
      const shown = new Set(
        [newer?.slug, older?.slug].filter(Boolean) as string[],
      );
      const related = getRelatedPosts(post, 2, shown);
      const ending = [...shown, ...related.map((p) => p.slug)];
      expect(new Set(ending).size, `${post.slug} repeats a post`).toBe(
        ending.length,
      );
      expect(ending, `${post.slug} links to itself`).not.toContain(post.slug);
    }
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

  it("emits an enclosure only when the cover size is known", () => {
    const withSizes = buildBlogRssXml(
      [fixture],
      TEST_SITE,
      new Map([[coverFor(fixture.slug).src, 12345]]),
    );
    expect(withSizes).toContain('length="12345"');
    expect(withSizes).toContain('type="image/jpeg"');
    expect(withSizes).toContain(`<enclosure url="https://partyreel.com`);
    // No size map, or a size that could not be stat'd: a valid item with no enclosure, never a
    // fabricated length.
    expect(buildBlogRssXml([fixture], TEST_SITE)).not.toContain("<enclosure");
    expect(buildBlogRssXml([fixture], TEST_SITE, new Map())).not.toContain(
      "<enclosure",
    );
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

describe("the faq field", () => {
  const base = { title: "A title", description: "A description", date: "2026-05-31", tags: ["how-to"] };
  const parse = (faq: unknown) => blogFrontmatterSchema.safeParse({ ...base, faq });

  it("accepts one to eight plain-text items and rejects the edges", () => {
    const item = { q: "Do guests need an app?", a: "No. They scan and upload from the browser." };
    expect(parse([item]).success).toBe(true);
    expect(parse(Array.from({ length: 8 }, () => item)).success).toBe(true);
    expect(parse([]).success).toBe(false);
    expect(parse(Array.from({ length: 9 }, () => item)).success).toBe(false);
    expect(parse([{ q: item.q, a: "x".repeat(401) }]).success).toBe(false);
  });

  it("rejects markup in an answer: it ships verbatim into FAQPage JSON-LD", () => {
    const result = parse([{ q: "How big?", a: "Up to <UploadSize /> per file." }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("plain text");
    }
  });

  it("★ carries no typed number: a FAQ answer is the one place a cap can only be typed", () => {
    // The spec components cannot reach a frontmatter string, so any figure here would be a
    // hand-typed copy of a product constant, which is exactly the drift they exist to prevent.
    // Answers point at /pricing instead of quoting caps.
    const NUMBER = /\$\d|\b\d+(\.\d+)? ?(GB|TB|MB|seconds?|days?|styles?)\b/i;
    for (const post of posts) {
      for (const { q, a } of post.frontmatter.faq ?? []) {
        expect(q, `${post.slug}: ${q}`).not.toMatch(NUMBER);
        expect(a, `${post.slug}: ${a}`).not.toMatch(NUMBER);
      }
    }
  });
});

describe("related posts spread across the archive", () => {
  it("no post is recommended in more than five endings", () => {
    // The same-tag-first scorer this replaced funnelled every audience's endings to its two
    // newest posts. Bound it: across every article's two-block ending, no single post may be
    // the recommendation more than five times (on a small archive every post is a neighbour of
    // two others, which is the floor this leaves room for).
    const seen = new Map<string, number>();
    for (const post of getAllPosts()) {
      const { newer, older } = getPostNeighbors(post);
      const shown = new Set(
        [newer?.slug, older?.slug].filter(Boolean) as string[],
      );
      for (const related of getRelatedPosts(post, 2, shown)) {
        seen.set(related.slug, (seen.get(related.slug) ?? 0) + 1);
      }
    }
    for (const [slug, count] of seen) {
      expect(count, `${slug} is recommended ${count} times`).toBeLessThanOrEqual(5);
    }
  });
});

describe("covers on the wall", () => {
  const items = getPostListItems();

  it("★ no photograph repeats beside itself, in any view, on any page", () => {
    // The wall is 1 / 2 / 3 columns, so a card's neighbours are i+1 (the row), i+2 (one row
    // down at sm) and i+3 (one row down at xl). Checked for the unfiltered library AND every
    // tag filter, on every page: a chronological-only check missed a collision under the
    // corporate filter, where three posts sit in one row.
    const views: (string | null)[] = [null, ...BLOG_TAG_IDS];
    for (const tag of views) {
      const { library } = splitLibrary(items, tag as never);
      const pageCount = paginate(library, 1).pageCount;
      for (let page = 1; page <= pageCount; page++) {
        const covers = paginate(library, page).items.map((p) => p.cover.imageId);
        for (let i = 0; i < covers.length; i++) {
          for (const step of [1, 2, 3]) {
            if (i + step < covers.length) {
              expect(
                covers[i] === covers[i + step],
                `${tag ?? "all"} page ${page}: cards ${i} and ${i + step} both use ${covers[i]}`,
              ).toBe(false);
            }
          }
        }
      }
    }
  });

  it("the staged hero is a landscape photograph", () => {
    // The featured card is 21:9 and the article plate 16:9; the manifest's one portrait
    // image crops to a band in both (and in the OG card, which ignores object-position).
    const hero = items[0];
    expect(hero.cover.width, hero.slug).toBeGreaterThan(hero.cover.height);
  });
});

describe("no typed product number in a body", () => {
  it("★ every marketed figure reaches a post through a spec component", () => {
    // Strip JSX tags (the components ARE the sanctioned numbers), then look for the shapes a
    // hand-typed figure takes: a price, a byte size, or one of the lifecycle/limit numbers
    // sitting next to its unit. The unit window is what keeps "47 messages" legal.
    const SIZE_OR_PRICE = /\$\d|\b\d+(\.\d+)? ?(GB|TB|MB)\b/i;
    const LIMIT_NEAR_UNIT =
      /\b(10|14|30|45|60|180|365|2000)\b(?=[^\n]{0,20}\b(day|second|item|photo|event)s?\b)/i;
    for (const post of posts) {
      const prose = post.body.replace(/<[^>]+>/g, "");
      for (const [i, line] of prose.split("\n").entries()) {
        expect(line, `${post.slug}:${i + 1} "${line.trim().slice(0, 80)}"`).not.toMatch(
          SIZE_OR_PRICE,
        );
        expect(line, `${post.slug}:${i + 1} "${line.trim().slice(0, 80)}"`).not.toMatch(
          LIMIT_NEAR_UNIT,
        );
      }
    }
  });
});

describe("the feed at library scale", () => {
  it("carries one enclosure per item when every cover can be measured", () => {
    const sizes = new Map(
      posts.map((p) => [coverFor(p.slug, p.frontmatter.cover).src, 1000]),
    );
    const xml = buildBlogRssXml(
      posts,
      { url: "https://partyreel.com", name: "Partyreel", description: "x" },
      sizes,
    );
    expect((xml.match(/<enclosure /g) ?? []).length).toBe(posts.length);
  });
});

describe("retired slugs", () => {
  it("every redirect lands on a live post, and no retired slug is still live", () => {
    const live = new Set(getAllBlogSlugs());
    for (const { from, to } of BLOG_REDIRECTS) {
      expect(live.has(to), `${from} -> ${to} (target is not a live post)`).toBe(true);
      expect(live.has(from), `${from} is still a live post`).toBe(false);
    }
  });
});
