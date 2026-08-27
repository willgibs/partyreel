import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BlogJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { getAllPosts, getAllTags, getPostListItems } from "@/lib/content/blog";

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

      {/* Index hero: the calm paper register — texts-reveal on the text block
          (the one entrance), the heading face + 4xl/5xl per the type ruling. */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-5 py-16 text-center sm:py-24">
          <TextsReveal className="flex flex-col items-center gap-5">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Blog
            </Eyebrow>
            <h1
              className="mkt-line max-w-2xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Notes on keeping the moments that matter
            </h1>
            <p
              className="mkt-line max-w-xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Guides, stories, and ideas on collecting every photo and video
              from your event, from the team building Partyreel.
            </p>
          </TextsReveal>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <BlogList posts={posts} tags={tags} />
      </Container>

      <section className="border-t bg-muted/30">
        <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <h2 className="max-w-xl font-heading text-2xl text-balance sm:text-3xl">
            Start your first event free
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            Create an event, share the QR, and watch the photos roll in. No app
            or account for your guests.
          </p>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/login">
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
