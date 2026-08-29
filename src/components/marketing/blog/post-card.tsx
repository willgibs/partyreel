import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { BlogListItem } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

/**
 * THE POST CARD - the blog's one card anatomy, shared by the index library and the post page's
 * "Keep reading" so the same article can never render as a photograph on one surface and an
 * underlined text row on the next.
 *
 * Media-forward by ruling (Will, 2026-08-28, on the Cutting Room direction): the cover IS the card.
 * Type sits ON the photograph over a scrim that LIFTS on hover rather than a desaturation, because
 * photography supplies all the color in this system and draining it fights the identity. `text-white`
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
      className={cn(
        "group relative block aspect-4/5 overflow-hidden bg-muted",
        "transition-[transform] duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        className,
      )}
    >
      <span
        data-mkt-develop
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

      {/* Rest scrim -> hover scrim. 90ms in / 180ms out is the ratified hover asymmetry: a library
          card is skimmed, not studied, so the response has to land inside a fast pass while the
          trail back stays calm. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
      />

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 sm:p-5">
        <span className="font-heading text-base leading-tight text-balance text-white sm:text-lg">
          {post.title}
        </span>
        {/* Numerals in mono per the R6 ruling; the author's NAME is Inter, since a name carries no
            tabular alignment and mono flattens the only human signal on the card. */}
        <span className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-white/70">
          <span className="font-medium text-white/90">{post.authorName}</span>
          <span className="font-mono tracking-wide tabular-nums">
            {post.dateLabel}
          </span>
          <span aria-hidden>&middot;</span>
          <span className="font-mono tracking-wide tabular-nums">
            {post.readingTime}
          </span>
        </span>
      </span>
    </Link>
  );
}
