import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { BlogListItem } from "@/lib/content/blog";
import { getBlogTag } from "@/lib/content/blog-tags";
import { cn } from "@/lib/utils";

import { PostMeta } from "./post-meta";

/**
 * THE POST CARD - the blog's one card anatomy, shared by the index library and the post page's
 * "Keep reading" so the same article can never render as a photograph on one surface and an
 * underlined text row on the next.
 *
 * Media-forward by ruling (Will, 2026-08-28, on the Cutting Room direction): the cover IS the card.
 * Type sits ON the photograph over a scrim that LIFTS on hover rather than a desaturation, because
 * photography supplies all the color in this system and draining it fights the identity. White type
 * over media follows the house precedent (cinema-hero's H1) and is theme-independent, which matters
 * here: these cards live in a PAPER chapter, so `text-foreground` would resolve to ink.
 *
 * Presentational and server-safe (no hooks), so the client filter island pays nothing for it.
 *
 * Crop: 4/5, the app's UNIFORM_TILE_ASPECT. Marketing has never shown it, which satisfies the frame
 * doctrine, and a portrait crop of a landscape source is where cover repetition is hardest to spot -
 * the other half of that job being the slug-derived object-position from `coverFor`.
 */
export function PostCard({
  post,
  index = 0,
  priority,
  className,
  sizes = "(max-width: 640px) 92vw, (max-width: 1280px) 44vw, 30vw",
}: {
  post: BlogListItem;
  /** Develop-beat slot; the staged lead takes the highest so it lands last. */
  index?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      // The morph opt-in: CoverMorphDelegate reads these, so the card itself stays a server
      // component and ships no JS (the HeadingAnchorsDelegate pattern).
      data-cover-morph=""
      className={cn(
        "group relative block aspect-4/5 overflow-hidden bg-muted",
        // The focus ring is WHITE and offset inward, not the token ring: `outline-ring` resolves
        // against the paper chapter and lands ~1.4:1 on a dark photograph, which is the
        // token-redeclaration trap the footer round documented, in its keyboard form.
        "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
        "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        className,
      )}
    >
      <span
        data-mkt-develop
        data-cover-plate=""
        className="absolute inset-0"
        style={{ "--i": index } as CSSProperties}
      >
        <Image
          src={post.cover.src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ objectPosition: post.cover.objectPosition }}
        />
      </span>

      {/* Rest scrim -> hover scrim. 180ms out is the ratified hover asymmetry: a library card is
          skimmed, not studied, so the trail back stays calm. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
      />

      {/* TAGS, top-left (Will, 2026-08-28). They sit in the corner the bottom-weighted scrim
          leaves nearly clear, so each chip carries its own ground: a translucent plate with a
          backdrop blur, which is the ONE place the elevation contract sanctions blur (a surface
          over media). Capped at two (the schema caps a post at two, so nothing is ever hidden) and
          set in the registry LABEL, matching the browse rail rather than shouting in caps at 10px. */}
      {post.tags.length > 0 && (
        <span className="absolute inset-x-0 top-0 flex flex-wrap gap-1 p-4 sm:p-5">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] tracking-wide text-white/90 backdrop-blur-[2px]"
            >
              {getBlogTag(tag).label}
            </span>
          ))}
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5">
        {/* line-clamp-2 is the layout GUARANTEE behind the 80-char schema cap: the schema stops a
            long title at authoring time, this stops one that slipped through from ever pushing the
            byline out of the card. Two lines is the rhythm the wall reads on. */}
        <span className="line-clamp-2 font-heading text-subsection text-balance text-white">
          {post.title}
        </span>
        <PostMeta post={post} />
      </span>
    </Link>
  );
}
