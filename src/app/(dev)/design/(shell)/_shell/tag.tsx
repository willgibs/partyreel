import { cn } from "@/lib/utils";

import type { NavBadge } from "@/app/(dev)/design/_data/catalog";

/**
 * A small label: the sidebar's badges and any page's status pills.
 *
 * FOUR TONES, ACHROMATIC (bible 1: the UI is achromatic and the media is the
 * colour, so a badge never earns a hue). The scale is weight and shape, which
 * is what a reader actually scans:
 *
 *   strong   filled          `new`, `updated`   what a reviewer came to find
 *   solid    a muted fill    `shipped`, `tool`  a settled fact
 *   outline  a hairline      `exploring`, `proposal`, `round N`  still moving
 *   quiet    dimmed hairline `retired`, `legacy`  read, do not obey
 *
 * A caller with no badge (a page's own pill) gets the solid tone, or names one
 * with `tone`.
 */
export type TagTone = "strong" | "solid" | "outline" | "quiet";

const TONE: Record<TagTone, string> = {
  strong: "bg-foreground text-background",
  solid: "bg-muted text-muted-foreground",
  outline: "border border-border text-muted-foreground",
  quiet: "border border-border/70 text-muted-foreground/60",
};

function toneFor(badge?: NavBadge): TagTone {
  if (badge === "new" || badge === "updated") return "strong";
  if (badge === "retired" || badge === "legacy") return "quiet";
  if (badge === "shipped" || badge === "tool") return "solid";
  if (badge === "exploring" || badge === "proposal") return "outline";
  if (badge?.startsWith("round ")) return "outline";
  return "solid";
}

export function Tag({
  badge,
  tone,
  children,
  className,
}: {
  badge?: NavBadge;
  /** Overrides the tone the badge implies. */
  tone?: TagTone;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-px text-[10px] leading-4 font-medium whitespace-nowrap",
        TONE[tone ?? toneFor(badge)],
        className,
      )}
    >
      {badge === "shipped" && (
        <span
          aria-hidden
          className="size-1 rounded-full bg-current opacity-70"
        />
      )}
      {children ?? badge}
    </span>
  );
}
