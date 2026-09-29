"use client";

import { cn } from "@/lib/utils";

/**
 * THE SAME THING TWICE, TOUCHING: as today, then with the idea (lifted from the
 * light board's own `Delta` at the stepped review, 2026-09-16, where it was
 * proved and then needed by every board that walks its cards one at a time).
 *
 * ★ WHY TWO COPIES. A treatment shown ALONE asks the reviewer to remember what
 * the surface looked like without it, which nobody can do across a scroll (the
 * light board's depth question stalled on exactly that: its previews could not
 * show what two treatments did). Two copies of one specimen, side by side, with
 * nothing else different, turn a memory test into a look, so reach for this
 * wherever the idea is a subtle change to something that already exists.
 *
 * ★ THE LABELS SIT UNDER THE JUDGED AREA, NEVER INSIDE IT (the same rule the
 * specimen furniture follows). Most of what a board compares is an edge
 * treatment, so a caption box drawn around a specimen is another edge competing
 * with the one being judged.
 *
 * ★ AND THE TWO HALVES SHARE A ROW, NOT A GRID. They are compared by eye at
 * their own sizes, so a grid that stretched the narrower one to match would be
 * changing the thing under comparison. The row wraps on a phone, where side by
 * side does not fit and one above the other is still touching.
 */
export function BeforeAfter({
  before,
  after,
  labels = ["As today", "With it"],
  className,
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  /** The two captions, in order; the defaults read for a board's own card. */
  labels?: readonly [string, string];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-3", className)}>
      <figure className="flex min-w-0 flex-col gap-1.5">
        {before}
        <figcaption className="text-[10px] text-muted-foreground">
          {labels[0]}
        </figcaption>
      </figure>
      <figure className="flex min-w-0 flex-col gap-1.5">
        {after}
        <figcaption className="text-[10px] text-muted-foreground">
          {labels[1]}
        </figcaption>
      </figure>
    </div>
  );
}
