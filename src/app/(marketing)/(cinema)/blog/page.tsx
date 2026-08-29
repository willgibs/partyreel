import type { Metadata } from "next";

import { BlogJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { getAllPosts, getPostListItems } from "@/lib/content/blog";

import { BlogList } from "./blog-list";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, stories, and ideas on collecting every photo and video from your event, from the team building Partyreel.",
  alternates: {
    canonical: "/blog",
    // RSS discovery → <link rel="alternate" type="application/rss+xml" …>
    types: { "application/rss+xml": "/blog/feed.xml" },
  },
};

// THE BLOG INDEX (rebuilt 2026-08-28 from the /design/c/blog-identity round). The page shell stays
// server-side: metadata, the JSON-LD, and the close. Everything between the masthead and the
// library is one island, because the ruled hero rule couples the staged lead to the filter (the
// why is in blog-list.tsx + blog-index.ts).
//
// The page lives in the (cinema) group by Will's ruling: dark stage, then a PaperChapter for the
// reading half. Distinctness from /help is the constraint that shapes it - see blog-list.tsx.
export default function BlogIndexPage() {
  const posts = getPostListItems();
  const jsonldPosts = getAllPosts().map((post) => ({
    title: post.frontmatter.title,
    slug: post.slug,
    date: post.frontmatter.date,
  }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />
      <BlogJsonLd posts={jsonldPosts} />

      <BlogList posts={posts} />

      {/* The house closer (every cinema page ends here), which also carries the cta_click
          taxonomy the old hand-rolled band left unwired. */}
      <CtaBand
        heading="Start your first event free"
        subhead="Create an event, share the QR, and watch the photos roll in. No app or account for your guests."
      />
    </>
  );
}
