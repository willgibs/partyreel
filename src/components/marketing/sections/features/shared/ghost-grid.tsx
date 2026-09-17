import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The locked-gallery tease, echoing the app's ghost grid
 * (components/guest/ghost-grid.tsx): shape and count, zero pixels. Cameras
 * sit on the outer columns, where a centred card cannot cover them (the app
 * puts one every 4th cell for the same "not a broken grid" read). Extracted
 * from the privacy page's access switch at the /features/album round so the
 * album's "who can open it" frames and the switch draw one ghost.
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
