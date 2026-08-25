import { Children, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { TiltCard } from "./tilt-card";

type CardGridProps = ComponentProps<"div"> & {
  /** Wrap each child in the pointer-tracked 3D TiltCard (event cards, covers). */
  tilt?: boolean;
  /** Desktop column count (always 1 on mobile). */
  columns?: 2 | 3 | 4;
};

const COLS: Record<NonNullable<CardGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * The recurring card grid (Track B system layer). Server-first: without `tilt`
 * this is a pure layout grid; with `tilt` each child mounts inside the TiltCard
 * client island (the card-tilt recipe), so the JS cost is opt-in per grid.
 */
export function CardGrid({
  tilt = false,
  columns = 3,
  className,
  children,
  ...props
}: CardGridProps) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4", COLS[columns], className)}
      {...props}
    >
      {tilt
        ? Children.toArray(children).map((child, i) => (
            <TiltCard key={i}>{child}</TiltCard>
          ))
        : children}
    </div>
  );
}
