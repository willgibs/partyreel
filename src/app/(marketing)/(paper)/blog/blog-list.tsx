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
}: {
  post: BlogListItem;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]",
        featured && "sm:col-span-2 sm:p-8",
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
