"use client";

import type { CSSProperties, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * HOW FAR A STATE'S COLOUR TRAVELS, in one place, so every surface on this
 * board obeys the same answer.
 *
 * The portal has exactly two state colours today: the shipped `--destructive`
 * red, which `/admin/jobs` gives to "Overdue" and "Last run failed", and grey
 * for everything else. Will's ruling of 2026-09-18 opens the door to more ("real
 * colors for the admin portal too"), so the question is not whether red exists,
 * it is whether the other three states get a voice and how far into a row it
 * reaches. These three policies are the answer to that, and every badge, dot and
 * row on the board reads them rather than hard-coding a colour.
 */
export type Colour = "achromatic" | "badges" | "rows";
export type Level = "ok" | "warn" | "fail" | "info" | "off";

const HUE: Record<Level, string> = {
  ok: "var(--ops-ok)",
  warn: "var(--ops-warn)",
  fail: "var(--ops-fail)",
  info: "var(--ops-info)",
  off: "var(--color-muted-foreground)",
};

/** The board's four hues arrive as `--ops` on the element that uses one. */
const hueStyle = (level: Level): CSSProperties =>
  ({ "--ops": HUE[level] }) as CSSProperties;

/**
 * Today's rendering, kept exactly: `Badge` in `destructive` for a failure and
 * `secondary` or `outline` for everything else, which is what the jobs console
 * ships (`HEALTH_VARIANT` in `src/app/admin/jobs/page.tsx`).
 */
function greyBadge(level: Level, children: ReactNode) {
  if (level === "fail") return <Badge variant="destructive">{children}</Badge>;
  if (level === "off" || level === "info")
    return <Badge variant="outline">{children}</Badge>;
  return <Badge variant="secondary">{children}</Badge>;
}

export function StateChip({
  level,
  colour,
  children,
  className,
}: {
  level: Level;
  colour: Colour;
  children: ReactNode;
  className?: string;
}) {
  if (colour === "achromatic") return greyBadge(level, children);
  return (
    <span className={cn("ops-chip", className)} style={hueStyle(level)}>
      <span className="ops-dot" style={{ background: "currentColor" }} />
      {children}
    </span>
  );
}

/** The same signal at a tenth the size, for a rail row or a dense cell. */
export function StateDot({
  level,
  colour,
  className,
}: {
  level: Level;
  colour: Colour;
  className?: string;
}) {
  const grey: Level =
    colour === "achromatic" && level !== "fail" ? "off" : level;
  return (
    <span
      aria-hidden
      className={cn("ops-dot", className)}
      style={hueStyle(colour === "achromatic" ? grey : level)}
    />
  );
}

/**
 * What a row wears. Only the third policy lets the state past the chip: a
 * failure tints its own row and takes a 2px leading edge, so scrolling a long
 * run table finds the bad one without reading a single word.
 */
export function rowStyle(
  level: Level,
  colour: Colour,
): { className: string; style?: CSSProperties } {
  if (colour !== "rows" || (level !== "fail" && level !== "warn"))
    return { className: "" };
  return { className: "ops-row", style: hueStyle(level) };
}

/** The ink a single word of status takes inside a dense table cell. */
export function stateInk(level: Level, colour: Colour): CSSProperties {
  if (colour === "achromatic")
    return level === "fail"
      ? { color: "var(--color-destructive)" }
      : { color: "var(--color-muted-foreground)" };
  return { color: HUE[level] };
}
