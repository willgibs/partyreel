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

/**
 * The answer beside a badge: does this apply to me right now? A bare "Binds"
 * in a column is the rule set's own word, not a stranger's (the sweep,
 * 2026-09-16); the prose around it ("what binds you") reads fine and keeps the
 * vocabulary, so only the standalone verdict changed.
 */
export function LevelVerdict({ level }: { level: LevelDef }) {
  const word =
    level.weight === "binds"
      ? "Always applies"
      : level.weight === "conditional"
        ? "Applies in scope"
        : "Informs only";
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
