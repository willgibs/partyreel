import { cn } from "@/lib/utils";

import type { NavBadge } from "@/app/(dev)/design/_data/catalog";

/**
 * A small label: the sidebar's badges and any page's status pills. Tone is by
 * meaning, never by page: `new`/`updated` are the only strong marks, because
 * they are what a reviewer scans for.
 */
export function Tag({
  badge,
  children,
  className,
}: {
  badge?: NavBadge;
  children?: React.ReactNode;
  className?: string;
}) {
  const strong = badge === "new" || badge === "updated";
  const quiet = badge === "retired" || badge === "legacy";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm px-1.5 py-px text-[10px] leading-4 font-medium whitespace-nowrap",
        strong && "bg-foreground text-background",
        !strong && !quiet && "bg-muted text-muted-foreground",
        quiet && "border border-border text-muted-foreground/70",
        className,
      )}
    >
      {children ?? badge}
    </span>
  );
}
