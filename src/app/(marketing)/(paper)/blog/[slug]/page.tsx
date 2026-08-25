import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthor } from "@/lib/content/authors";
import { getAllBlogSlugs, getPost, getRelatedPosts } from "@/lib/content/blog";
import { extractHeadings, readingTime } from "@/lib/content/collection";
import { formatEventDate } from "@/lib/utils";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
      canonical: `/blog/${slug}`,
      types: { "application/rss+xml": "/blog/feed.xml" },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const author = getAuthor(post.frontmatter.author);
  const headings = extractHeadings(post.body);
  const related = getRelatedPosts(post);

  // Same render path as the help article (compileMDX + shared mdxComponents +
  // prose-help). Frontmatter already stripped → no parseFrontmatter; blockJS stays on.
  const { content } = await compileMDX({
    source: post.body,
    components: mdxComponents,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.frontmatter.title, href: `/blog/${slug}` },
        ]}
      />
      <ArticleJsonLd
        headline={post.frontmatter.title}
        description={post.frontmatter.description}
        path={`/blog/${slug}`}
        authorName={author.name}
        datePublished={post.frontmatter.date}
        dateModified={post.frontmatter.updated ?? post.frontmatter.date}
      />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="max-w-2xl min-w-0">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors duration-150 hover:text-brand/80"
            >
              <ArrowLeft className="size-4" />
              Blog
            </Link>

            <header className="mt-6">
              {post.frontmatter.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <h1 className="text-3xl font-semibold tracking-tighter text-balance sm:text-4xl">
                {post.frontmatter.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {author.name}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={post.frontmatter.date}>
                  {formatEventDate(post.frontmatter.date)}
                </time>
                <span aria-hidden>·</span>
                <span>{readingTime(post.body)}</span>
              </div>
            </header>

            <article className="prose mt-8 max-w-none prose-help">
              {content}
            </article>

            {related.length > 0 && (
              <section className="mt-16 border-t pt-10">
                <h2 className="font-heading text-lg font-medium">
                  Keep reading
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="group inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 hover:text-brand"
                      >
                        {item.frontmatter.title}
                        <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12 rounded-2xl border bg-muted/30 p-8 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Try Partyreel at your next event
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
                One QR code, every guest&rsquo;s photos and videos in one album.
                Free to start.
              </p>
              <Button asChild className="mt-4">
                <Link href="/login">Start free</Link>
              </Button>
            </section>
          </div>

          {headings.length >= 2 && (
            <aside className="hidden shrink-0 lg:block lg:w-44">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  On this page
                </p>
                <ul className="mt-3 flex flex-col">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="-ml-px block border-l py-1.5 pl-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-brand hover:text-foreground"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </Container>
    </>
  );
}
