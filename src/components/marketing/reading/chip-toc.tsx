import type { ArticleHeading } from "@/lib/content/collection";
import { cn } from "@/lib/utils";

/**
 * The mobile contents: a zero-JS chip row, shown below `lg` where the sticky
 * rail is hidden. Help and blog each carried a verbatim copy; the legal round
 * was the third, so it became one component (an accordion here was
 * deliberately cut in R6, keep it a flat row). Renders nothing under two
 * headings, the same threshold the desktop rail uses.
 */
export function ChipToc({
  headings,
  className,
}: {
  headings: ArticleHeading[];
  className?: string;
}) {
  if (headings.length < 2) return null;
  return (
    <nav
      aria-label="On this page"
      className={cn("flex flex-wrap items-center gap-2 lg:hidden", className)}
    >
      <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        On this page
      </span>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
