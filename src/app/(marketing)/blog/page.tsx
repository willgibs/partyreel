import type { Metadata } from "next";
import Link from "next/link";

import { BlogJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { getAllPosts, getAllTags, getPostListItems } from "@/lib/content/blog";

import { BlogList } from "./blog-list";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, stories, and ideas on collecting every photo and video from your event — from the team building Partyreel.",
  alternates: {
    canonical: "/blog",
    // RSS discovery → <link rel="alternate" type="application/rss+xml" …>
    types: { "application/rss+xml": "/blog/feed.xml" },
  },
};

export default function BlogIndexPage() {
  const posts = getPostListItems();
  const tags = getAllTags();
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

      <section className="border-b">
        <Container className="flex flex-col items-center gap-5 py-16 text-center sm:py-20">
          <span className="text-sm font-medium text-brand">Blog</span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            Notes on keeping the moments that matter
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Guides, stories, and ideas on collecting every photo and video from
            your event — from the team building Partyreel.
          </p>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <BlogList posts={posts} tags={tags} />
      </Container>

      <section className="border-t bg-muted/30">
        <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start your first event free
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            Create an event, share the QR, and watch the photos roll in — no app
            or account for your guests.
          </p>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/login">Start free</Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
