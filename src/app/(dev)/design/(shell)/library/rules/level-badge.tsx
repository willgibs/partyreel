import { cn } from "@/lib/utils";

import type { LevelDef } from "@/app/(dev)/design/rules/influences";

/**
 * THE MARK A LEVEL WEARS (the Library x Lab round, 2026-09-15). The whole
 * point of the rule layer is that an agent can tell, at a glance, which half
 * of what it is reading actually binds. So weight is the signal and colour is
 * not: what binds is solid, what binds conditionally is outlined, what merely
 * informs is quiet. Three tones, no hues, and the same three everywhere the
 * badge appears (the rules page, a Binds strip, a policy row).
 */
export function LevelBadge({
  level,
  className,
}: {
  level: LevelDef;
  className?: string;
}) {
  return (
    <span
      title={level.line}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm px-1.5 py-px text-[10px] leading-4 font-semibold tracking-wider whitespace-nowrap uppercase",
        level.weight === "binds" && "bg-foreground text-background",
        level.weight === "conditional" &&
          "border border-foreground/40 text-foreground/80",
        level.weight === "informs" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {level.badge}
    </span>
  );
}

/** The one word under a badge: does this bind me right now? */
export function LevelVerdict({ level }: { level: LevelDef }) {
  const word =
    level.weight === "binds"
      ? "Binds"
      : level.weight === "conditional"
        ? "Binds in scope"
        : "Informs";
  return (
    <span
      className={cn(
        "text-[11px] font-medium",
        level.weight === "informs"
          ? "text-muted-foreground"
          : "text-foreground",
      )}
    >
      {word}
    </span>
  );
}
