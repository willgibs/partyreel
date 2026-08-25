import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type MediaSplitProps = ComponentProps<"div"> & {
  /** The media half (a frame, an mp4 poster stack, a still). */
  media: ReactNode;
  /** Which side the media sits on at desktop widths (stacks on mobile). */
  mediaSide?: "start" | "end";
};

/**
 * The recurring media + copy split (Track B system layer): a 12-column grid,
 * media on 7 columns / copy on 5, stacking to a single column on mobile.
 * Children are the copy half; compose Eyebrow / headings / DemoCtaLink inside.
 * Media is the color (the design identity), so the media half gets the wider run.
 */
export function MediaSplit({
  media,
  mediaSide = "start",
  className,
  children,
  ...props
}: MediaSplitProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "min-w-0 lg:col-span-7",
          mediaSide === "end" && "lg:order-2",
        )}
      >
        {media}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-4 lg:col-span-5",
          mediaSide === "end" && "lg:order-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}
