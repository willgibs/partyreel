import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { CoverMorphDelegate } from "@/components/marketing/blog/cover-morph";
import { PostCard } from "@/components/marketing/blog/post-card";
import { PostMeta } from "@/components/marketing/blog/post-meta";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import {
  ARTICLE_BODY_ID,
  ArticleToc,
} from "@/components/marketing/reading/article-toc";
import { ChipToc } from "@/components/marketing/reading/chip-toc";
import { HeadingAnchorsDelegate } from "@/components/marketing/reading/heading-anchors";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { getAuthor } from "@/lib/content/authors";
import {
  type BlogPost,
  getAllBlogSlugs,
  getPost,
  getPostNeighbors,
  getRelatedPosts,
  toListItem,
} from "@/lib/content/blog";
import { coverFor } from "@/lib/content/blog-covers";
import { extractHeadings } from "@/lib/content/collection";
import { cn, formatEventDate } from "@/lib/utils";

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
    // `tags`, not `keywords` (not an openGraph field, and would silently do nothing) — the
    // /help/[slug] precedent. The share IMAGE comes from opengraph-image.tsx beside this file.
    openGraph: {
      type: "article",
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updated ?? post.frontmatter.date,
      authors: [getAuthor(post.frontmatter.author).name],
      tags: post.frontmatter.tags.length ? post.frontmatter.tags : undefined,
    },
  };
}

/**
 * THE ARTICLE — "the print of the frame" (the reading round, 2026-08-28).
 *
 * The reader clicked a photograph on the index wall. This page opens on that same photograph, at
 * the same crop, enlarged: `coverFor` is a pure function of the slug, so the card and the article
 * are GUARANTEED to show the identical plate and the page reads as the card opening rather than as
 * a new place. Title over the night, then the piece settles onto paper.
 *
 * The PaperChapter wrap is the reading-body doctrine, and it pays for itself twice over: it keeps
 * `--tw-prose-pre-bg: var(--gallery)` off the cinema room (a near-black code slab on a near-black
 * stage) and keeps `Callout type="tip"` legible, whose `bg-brand/5` tint would vanish under .dark
 * where --brand resolves near-white.
 *
 * The ENDING is deliberately two blocks, not four. Chronological neighbours come first, then
 * related posts with those neighbours EXCLUDED — on a four-post archive the two sets are otherwise
 * nearly identical and the same article shows up twice within one screen.
 */
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
  const cover = coverFor(slug, post.frontmatter.cover);
  const listItem = toListItem(post);

  const { newer, older } = getPostNeighbors(post);
  const shown = new Set([newer?.slug, older?.slug].filter(Boolean) as string[]);
  const related = getRelatedPosts(post, 2, shown).map(toListItem);

  // An `updated` that merely restates the publish date is noise; only a real revision is news.
  const updated =
    post.frontmatter.updated &&
    post.frontmatter.updated !== post.frontmatter.date
      ? post.frontmatter.updated
      : null;

  // Same render path as the help article (compileMDX + shared mdxComponents + prose-help).
  // Frontmatter already stripped → no parseFrontmatter; blockJS stays on.
  const { content } = await compileMDX({
    source: post.body,
    components: mdxComponents,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return (
    <>
      {/* Mounted here too, so a "Keep reading" card morphs into the next article. */}
      <CoverMorphDelegate />
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

      {/* ── The stage. pt-14/pt-20 is the cinema convention, not styling drift: the overlay header
             is transparent and hairline-less at scroll top, so the page's own top padding is the
             only thing separating chrome from content. ──────────────────────────────────────── */}
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

            <header className="mt-8">
              {post.frontmatter.tags.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {post.frontmatter.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                </div>
              )}
              {/* Article surfaces stop at lg:text-6xl by the H1 ladder's own exemption. */}
              <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
                {post.frontmatter.title}
              </h1>
              {/* THE STANDFIRST. The frontmatter description is a hand-written sell for the piece
                  that until now appeared on the index card, in metadata, in the feed and in
                  llms.txt — everywhere except in front of the reader who had already committed. */}
              <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
                {post.frontmatter.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                <PostMeta
                  post={listItem}
                  tone="paper"
                  readingTime
                  className="text-sm"
                />
                {updated && (
                  <span className="text-xs text-muted-foreground/70">
                    Updated {formatEventDate(updated)}
                  </span>
                )}
              </div>
            </header>

            {/* The plate STRADDLES the cut: the photograph carries the reader out of the night into
                the daylight they read in. Same image, same crop as the card they clicked. */}
            {/* 4/3 on phones, not the index card's 4/5: the card's portrait crop earns its height
                in a grid, but here it is art the reader has to scroll PAST to reach the writing,
                and 4/5 at 375px put ~190px of extra photograph between the byline and the lead. */}
            <div className="relative z-10 mt-10 -mb-16 aspect-4/3 overflow-hidden bg-muted sm:-mb-20 sm:aspect-video">
              {/* Pre-named as the morph TARGET: the incoming document is one this code never
                  touches before it exists, so the name has to be server-rendered. The delegate
                  clears it from every plate before naming a clicked card, so it can never collide
                  on an article-to-article hop. */}
              <span
                data-mkt-develop
                data-cover-plate="target"
                className="absolute inset-0"
                style={
                  { viewTransitionName: "blog-cover" } as React.CSSProperties
                }
              >
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
              (`max-lg:[&>section]:py-14`, higher specificity than a child utility), which would
              silently eat the clearance and let the plate land on the prose on phones. A height on
              an inner element is outside that selector's reach. */}
          <div aria-hidden className="h-[4.5rem]" />
          <Container>
            <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
              <div className="max-w-2xl min-w-0">
                {/* Mobile contents: the zero-JS chip row (the desktop rail is lg-only). */}
                <ChipToc headings={headings} className="mb-8" />

                {/* prose-headings:font-heading pulls the post's h2/h3 onto the house heading face;
                    the prose SCALE itself is untouched. */}
                {/* THE LEAD-IN: the opening paragraph sets one step above the body, which gives
                    the reader a type ramp down into the piece (standfirst 20px muted -> lead 18px
                    ink -> body 16px) instead of a cliff from display type straight to body copy.
                    Scoped to the first child so it can never catch a second paragraph. */}
                <article
                  id={ARTICLE_BODY_ID}
                  className="prose max-w-none prose-help prose-headings:font-heading [&>p:first-child]:text-[1.0625rem] [&>p:first-child]:leading-[1.7]"
                >
                  {content}
                </article>
                {/* One delegated island upgrades every heading's copy-link anchor. The shared MDX
                    components already emit the markup; the blog just never mounted the upgrade. */}
                <HeadingAnchorsDelegate />

                {post.frontmatter.tags.length > 0 && (
                  <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-6">
                    <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      Filed under
                    </span>
                    {post.frontmatter.tags.map((tag) => (
                      <TagChip key={tag} tag={tag} tone="paper" />
                    ))}
                  </div>
                )}

                {(newer || older) && (
                  <nav
                    aria-label="More posts"
                    className="mt-8 grid gap-3 sm:grid-cols-2"
                  >
                    {newer ? (
                      <NeighborLink post={newer} direction="newer" />
                    ) : (
                      <span aria-hidden className="hidden sm:block" />
                    )}
                    {older && <NeighborLink post={older} direction="older" />}
                  </nav>
                )}

                {related.length > 0 && (
                  <section className="mt-14 border-t pt-10">
                    <h2 className="font-heading text-xl">Keep reading</h2>
                    <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {related.map((item, index) => (
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
                    <ArticleToc
                      headings={headings}
                      progress={{ targetId: ARTICLE_BODY_ID }}
                    />
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

/** A tag, linking back to the index rail's filtered view. The loop the index opened, closed. */
function TagChip({
  tag,
  tone = "media",
}: {
  tag: string;
  tone?: "media" | "paper";
}) {
  return (
    <Link
      href={`/blog?tag=${encodeURIComponent(tag)}`}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs transition-colors duration-150",
        tone === "media"
          ? "bg-foreground/10 text-muted-foreground hover:bg-foreground/15 hover:text-foreground"
          : "border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {tag}
    </Link>
  );
}

/** Chronological neighbour. Text-led on purpose: the photo cards below are the media moment, and
 *  two card treatments back to back would flatten both. */
function NeighborLink({
  post,
  direction,
}: {
  post: BlogPost;
  direction: "newer" | "older";
}) {
  const isNewer = direction === "newer";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col gap-1 border p-4 transition-colors duration-150 hover:border-foreground/30",
        isNewer ? "items-start" : "items-start sm:items-end sm:text-right",
      )}
    >
      <span className="flex items-center gap-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {isNewer && (
          <ArrowLeft className="size-3 transition-transform duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
        )}
        {isNewer ? "Newer" : "Older"}
        {!isNewer && (
          <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        )}
      </span>
      <span className="line-clamp-2 text-sm text-pretty transition-colors duration-150 group-hover:text-foreground">
        {post.frontmatter.title}
      </span>
    </Link>
  );
}
