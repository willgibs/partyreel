import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ROW_CLASSES, type RowStep } from "@/lib/shared/album-rows";
import { cn } from "@/lib/utils";

/**
 * THE STREAMING FALLBACK FOR THE GUEST ALBUM: the shell paints at once while the album's seed (the
 * manifest and the first paint's links) streams in, and this holds the album's slot in the album's
 * OWN shape: justified rows at the step the album lands at, so the swap never changes how many
 * photographs a row holds (a masonry placeholder under a rows album would flash the wrong layout on
 * every load).
 *
 * ★ THE ROW COUNT IS THE ALBUM'S RULE, READ, NEVER RE-TYPED. Photographs a row come from
 * `ROW_CLASSES` at the album's step (the server-resolved `pr_tile_size` cookie), one container query
 * per width class picking that class's count, exactly as the rows' own first paint picks its breaks
 * (`album-window.tsx`), on the ONE gallery gap and the photograph's corner.
 *
 * ★ ABOUT A SCREEN, NEVER A PAGE: three rows at the densest class and no more than a screen and a
 * half of shimmer at one a row, where a phone would otherwise scroll past twenty placeholders before
 * the photographs land.
 */
const COUNT_BY_CLASS =
  "[--sk-n:var(--sk-n0)] @min-[480px]:[--sk-n:var(--sk-n1)] @min-[900px]:[--sk-n:var(--sk-n2)] @min-[1280px]:[--sk-n:var(--sk-n3)]";

/** Three of the densest rows any class lays. */
const TILES = Math.max(...ROW_CLASSES.map((c) => c.perRow[2])) * 3;

export function GallerySkeleton({
  step,
}: {
  /** The album's density step (the server-resolved cookie), so the placeholder lays the album's rows. */
  step: RowStep;
}) {
  const counts = Object.fromEntries(
    ROW_CLASSES.map((c, i) => [`--sk-n${i}`, c.perRow[step]]),
  );
  return (
    <section className="mt-9" aria-hidden data-gallery-skeleton>
      {/* Stands in for the album's "Download all" and View menu, at its RIGHT edge (`ml-auto`). */}
      <Skeleton className="mb-3 ml-auto h-5 w-36" />
      <div className="@container max-h-[150svh] w-full overflow-hidden">
        <div
          className={cn(
            "flex w-full flex-wrap gap-[var(--gap-gallery)]",
            COUNT_BY_CLASS,
          )}
          style={counts as CSSProperties}
        >
          {Array.from({ length: TILES }, (_, i) => (
            <Skeleton
              key={i}
              className="shrink-0 grow-0 rounded-tile"
              style={{
                flexBasis:
                  "calc((100% - (var(--sk-n) - 1) * var(--gap-gallery)) / var(--sk-n))",
                aspectRatio: "4 / 3",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
