import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
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
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Blog
            </Link>

            {/* Header ladder (the 2026-08-25 type ruling): post H1 reaches
                4xl/5xl in the heading face; the byline goes mono (the
                marketing caption voice for factual lines). */}
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
              <h1 className="font-heading text-4xl text-balance sm:text-5xl">
                {post.frontmatter.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tracking-wide text-muted-foreground">
                <span className="text-foreground">{author.name}</span>
                <span aria-hidden>·</span>
                <time dateTime={post.frontmatter.date}>
                  {formatEventDate(post.frontmatter.date)}
                </time>
                <span aria-hidden>·</span>
                <span>{readingTime(post.body)}</span>
              </div>
            </header>

            {/* prose-headings:font-heading pulls the post's h2/h3 onto the
                house heading face; the prose SCALE itself is untouched. */}
            <article className="prose mt-8 max-w-none prose-help prose-headings:font-heading">
              {content}
            </article>

            {related.length > 0 && (
              <section className="mt-16 border-t pt-10">
                <h2 className="font-heading text-xl tracking-tight">
                  Keep reading
                </h2>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <LearnMoreLink
                        href={`/blog/${item.slug}`}
                        className="text-foreground"
                      >
                        {item.frontmatter.title}
                      </LearnMoreLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12 rounded-2xl border bg-muted/30 p-8 text-center">
              <h2 className="font-heading text-xl tracking-tight">
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
            <aside className="hidden shrink-0 lg:block lg:w-48">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </p>
                <ul className="mt-3 flex flex-col border-l">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="-ml-px block border-l border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground"
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
