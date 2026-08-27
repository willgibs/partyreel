"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { BlogListItem } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

// Tag chips + the post grid, filtered client-side by the selected tag. Posts arrive as
// plain pre-formatted metadata (no bodies, no icons, dates pre-formatted on the server)
// so nothing locale-dependent runs at hydration. `import type` keeps the fs-reading
// blog.ts loader out of this client bundle.
export function BlogList({
  posts,
  tags,
}: {
  posts: BlogListItem[];
  tags: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(
    () => (active ? posts.filter((post) => post.tags.includes(active)) : posts),
    [active, posts],
  );

  // C2 fix: the grid pairs regular cards 2-up below the full-width featured
  // lead. Whenever that leaves an ODD number of regular cards, the last one
  // lands alone in its row with the other half of the grid empty (a content-
  // count artifact, not a design choice). Span that trailing card full-width
  // instead so a lone closer always reads as deliberate. Recomputed from
  // whatever's currently filtered, so it holds for any post count or tag
  // selection, not just today's, without ever needing a manual re-tune.
  const hasFeatured = active === null && filtered.length > 0;
  const regularCount = hasFeatured ? filtered.length - 1 : filtered.length;
  const oddTailIndex = regularCount % 2 === 1 ? filtered.length - 1 : -1;

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <TagChip
            label="All"
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              active={active === tag}
              onClick={() => setActive(tag)}
            />
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {filtered.map((post, index) => (
          <PostCard
            key={post.slug}
            post={post}
            featured={active === null && index === 0}
            spanFull={index === oddTailIndex}
          />
        ))}
      </div>
    </div>
  );
}

// Active = a solid ink pill (the achromatic register: state is contrast, not
// hue); idle chips stay quiet until hover. Press feedback per the house rule.
function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]",
        active
          ? "border-transparent bg-primary font-medium text-primary-foreground"
          : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function PostCard({
  post,
  featured,
  spanFull,
}: {
  post: BlogListItem;
  featured?: boolean;
  /** Trailing odd-one-out in the 2-col grid: same card, just full-width. */
  spanFull?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]",
        (featured || spanFull) && "sm:col-span-2",
        featured && "sm:p-8",
      )}
    >
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <h2
        className={cn(
          "font-heading text-balance",
          featured ? "max-w-3xl text-2xl sm:text-3xl" : "text-lg",
        )}
      >
        {post.title}
      </h2>
      <p
        className={cn(
          "text-sm text-pretty text-muted-foreground",
          featured && "max-w-2xl",
        )}
      >
        {post.description}
      </p>
      {/* Byline in the mono caption voice (dates and reading time are factual
          captions, the documented utility exception). */}
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 font-mono text-xs tracking-wide text-muted-foreground">
        <span className="text-foreground">{post.authorName}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.date}>{post.dateLabel}</time>
        <span aria-hidden>·</span>
        <span>{post.readingTime}</span>
      </div>
    </Link>
  );
}
