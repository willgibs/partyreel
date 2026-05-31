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
        "rounded-full border px-3 py-1 text-sm transition-colors duration-150 active:scale-[0.98]",
        active
          ? "border-brand bg-brand/10 text-brand"
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
        "group flex flex-col gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-colors duration-150 hover:border-brand/40",
        featured && "sm:col-span-2",
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
          "font-heading font-semibold tracking-tight text-balance transition-colors duration-150 group-hover:text-brand",
          featured ? "text-2xl" : "text-lg",
        )}
      >
        {post.title}
      </h2>
      <p className="text-sm text-pretty text-muted-foreground">
        {post.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{post.authorName}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.date}>{post.dateLabel}</time>
        <span aria-hidden>·</span>
        <span>{post.readingTime}</span>
      </div>
    </Link>
  );
}
