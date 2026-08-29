import type { BlogListItem } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

/**
 * THE BYLINE - one design, three surfaces (the library card, the featured card, the post header).
 *
 * ★ NOT MONO (Will, 2026-08-28: "blog card metadata could be designed more neatly and not in a mono
 * font"). This is the R6 type doctrine applied correctly rather than reflexively: mono earns its
 * place on numerals that ALIGN - a stat column, a numbered index - and a byline aligns with nothing.
 * The old line set the author's name, the date and the reading time all in Geist Mono at one weight,
 * which read as a timecode and flattened the only human signal on the card. Now it is one Inter line
 * with a single weight step: the name carries, the facts recede, hairline dots separate.
 *
 * `tone` exists because these bylines sit on two grounds. Over a photograph the palette has to be
 * white (theme-independent, the cinema-hero precedent) since the card lives inside a PAPER chapter
 * where `text-foreground` resolves to ink.
 */
export function PostMeta({
  post,
  tone = "media",
  readingTime = false,
  className,
}: {
  post: BlogListItem;
  tone?: "media" | "paper";
  /**
   * Reading time is OPT-IN and off on cards (Will, 2026-08-28). It answers "am I about to commit to
   * this?", which is a question you ask on the article, not while scanning a wall of covers; on a
   * card it was a third fact competing with the two that actually identify the post.
   */
  readingTime?: boolean;
  className?: string;
}) {
  const onMedia = tone === "media";
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-xs",
        onMedia ? "text-white/65" : "text-muted-foreground",
        className,
      )}
    >
      <span className={cn("font-medium", onMedia ? "text-white" : "text-foreground")}>
        {post.authorName}
      </span>
      <Dot onMedia={onMedia} />
      <time dateTime={post.date}>{post.dateLabel}</time>
      {readingTime && (
        <>
          <Dot onMedia={onMedia} />
          <span>{post.readingTime}</span>
        </>
      )}
    </p>
  );
}

/** A hairline dot, dimmer than the text it separates: punctuation should not compete with facts. */
function Dot({ onMedia }: { onMedia: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-0.5 shrink-0 rounded-full",
        onMedia ? "bg-white/40" : "bg-muted-foreground/40",
      )}
    />
  );
}
