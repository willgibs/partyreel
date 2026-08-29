import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { PostCard } from "@/components/marketing/blog/post-card";
import { PostMeta } from "@/components/marketing/blog/post-meta";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { getAuthor } from "@/lib/content/authors";
import {
  getAllBlogSlugs,
  getPost,
  getRelatedPosts,
  toListItem,
} from "@/lib/content/blog";
import { coverFor } from "@/lib/content/blog-covers";
import { extractHeadings } from "@/lib/content/collection";

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

// THE POST PAGE, brought onto the (cinema) posture with the index's move (2026-08-28). This is a
// CORRECTNESS pass, not the post-page identity round: the dark stage + PaperChapter reading body
// mirror /help/[slug] so the article does not ship a light page under a dark overlay header, and
// the shared PostCard lands so related posts match the index. The article's own identity (its own
// lead treatment, the cover-bearing OG card, an RSS enclosure) is the next round.
//
// The PaperChapter wrap is the reading-body doctrine, and it pays for itself twice over: it also
// keeps `--tw-prose-pre-bg: var(--gallery)` off the cinema room (a near-black code slab on a
// near-black stage) and keeps Callout type="tip" legible, whose `bg-brand/5` tint would vanish
// under .dark where --brand resolves near-white.
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
  const related = getRelatedPosts(post).map(toListItem);
  const cover = coverFor(slug, post.frontmatter.cover);
  // The article as card metadata: one shared byline shape across every blog surface.
  const listItem = toListItem(post);

  // Same render path as the help article (compileMDX + shared mdxComponents + prose-help).
  // Frontmatter already stripped → no parseFrontmatter; blockJS stays on.
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

      {/* ── The dark stage. pt-14/pt-20 is the cinema convention, not styling drift: the overlay
             header is transparent and hairline-less at scroll top, so the page's own top padding
             is the only thing separating chrome from content. ─────────────────────────────── */}
      <section>
        <Container className="pt-14 pb-0 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
              Blog
            </Link>

            <header className="mt-8 max-w-3xl">
              {post.frontmatter.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                      <Badge
                        variant="secondary"
                        className="transition-colors duration-150 hover:bg-secondary/70"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
              {/* Article surfaces stop at lg:text-6xl by the H1 ladder's own exemption. */}
              <h1 className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl">
                {post.frontmatter.title}
              </h1>
              {/* The shared byline, so the article header, the library card and "Keep reading"
                  are one design (and one place to change). Inter, not mono, per the ruling. */}
              <PostMeta post={listItem} tone="paper" className="mt-4 text-sm" />
            </header>

            {/* The cover STRADDLES the cut, the index's move applied to the article: the photograph
                carries the reader out of the night into the daylight they read in. */}
            <div className="relative z-10 mt-8 -mb-16 aspect-4/5 overflow-hidden bg-muted sm:-mb-20 sm:aspect-video">
              <span data-mkt-develop className="absolute inset-0">
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 100vw, 1024px"
                  priority
                  className="object-cover"
                  style={{ objectPosition: cover.objectPosition }}
                />
              </span>
            </div>
          </div>
        </Container>
      </section>

      <PaperChapter className="border-t-0">
        <section className="pb-16 lg:pt-24 lg:pb-20">
          {/* STRADDLE CLEARANCE. A fixed height, deliberately NOT top padding on the section:
              PaperChapter force-compresses a direct child section's `py` to py-14 below lg
              (`max-lg:[&>section]:py-14`, higher specificity than a child utility), which silently
              ate the clearance and let the featured card land ON the rail on phones. A height on an
              inner element is outside that selector's reach. */}
          <div aria-hidden className="h-[4.5rem]" />
          <Container>
            <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
              <div className="max-w-2xl min-w-0">
                <article className="prose max-w-none prose-help prose-headings:font-heading">
                  {content}
                </article>

                {related.length > 0 && (
                  <section className="mt-16 border-t pt-10">
                    <h2 className="font-heading text-xl">Keep reading</h2>
                    <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {related.slice(0, 2).map((item, index) => (
                        <li key={item.slug}>
                          <PostCard
                            post={item}
                            index={index}
                            sizes="(max-width: 640px) 92vw, 320px"
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {headings.length >= 2 && (
                <aside className="hidden shrink-0 lg:block lg:w-48 lg:self-stretch">
                  {/* self-stretch is LOAD-BEARING (the /help/[slug] lesson): the row's
                      lg:items-start collapses this rail to content height, leaving sticky zero
                      travel room, and the ToC silently never tracks. */}
                  <nav
                    aria-label="On this page"
                    className="sticky top-[calc(var(--mkt-header-h,4rem)+1.5rem)]"
                  >
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
        </section>
      </PaperChapter>

      <CtaBand
        heading="Try Partyreel at your next event"
        subhead="One QR code, every guest's photos and videos in one album. Free to start."
      />
    </>
  );
}
