import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The locked-gallery tease: shape and count, zero pixels. Cameras sit on the
 * outer columns, where a centred card cannot cover them, so it reads as "not a
 * broken grid". The app's own locked page draws a ghosted river of stand-in
 * photographs instead (`GhostRiver`, guest/gallery-empty-state.tsx); this is
 * the marketing pages' picture of the same absence, shared by the privacy
 * page's access switch and the album's "who can open it" frames so they draw
 * one ghost.
 */
export function GhostBackdrop({
  cells = 8,
  className,
}: {
  cells?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2 self-center [grid-area:1/1]",
        className,
      )}
    >
      {Array.from({ length: cells }, (_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-lg border border-border/70 bg-muted/60"
        >
          {i % 4 === 3 || i % 4 === 0 ? (
            i === 3 || i === 4 ? (
              <Camera className="size-4 text-faint" />
            ) : null
          ) : null}
        </div>
      ))}
    </div>
  );
}
