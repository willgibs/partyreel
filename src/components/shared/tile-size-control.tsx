"use client";

import { LayoutGrid, ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TILE_SIZES, type TileSize } from "@/lib/shared/tile-size-cookie";

const SIZE_LABEL: Record<TileSize, string> = {
  180: "small",
  240: "medium",
  300: "large",
};

/** N small squares standing in for N columns, so the control reads as "how
 *  many, how big" rather than a bare S/M/L label (the board's own glyph,
 *  `sandbox/app-vocabulary/gallery-controls.tsx`, unchanged). */
function SizeGlyph({ size }: { size: TileSize }) {
  const n = size === 180 ? 3 : size === 240 ? 2 : 1;
  return (
    <span
      aria-hidden
      className="grid size-3.5 grid-cols-2 gap-px"
      style={n === 1 ? { gridTemplateColumns: "1fr" } : undefined}
    >
      {Array.from({ length: n * n }, (_, i) => (
        <span key={i} className="rounded-[1.5px] bg-current" />
      ))}
    </span>
  );
}

/** A reserved, non-interactive slot naming a control that does not exist yet:
 *  dashed and muted, present on purpose so the row already reads as a group
 *  of controls the day Sort and Filter land, rather than relaying out around
 *  them then. */
function ReservedPill({
  icon: Icon,
  label,
}: {
  icon: typeof ListFilter;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2 py-1 text-micro text-muted-foreground/70">
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/**
 * THE GALLERY'S TILE-SIZE CLUSTER (`app-vocabulary` r1,
 * `gallery-controls-home=cluster`): the segmented control (three steps,
 * setting `--album-column`) plus two reserved, non-interactive slots naming
 * Sort and Filter, so the row already reads as "controls" rather than "tile
 * size, alone" — planting the seam now costs two static pills and saves a
 * second relayout the day those two land (the board's own reasoning, which
 * carried the verdict). Every step previews fully on press: no panel to open
 * first.
 *
 * ★ CONTROLLED, AND SETS NOTHING ITSELF. `value`/`onChange` are the whole
 * contract — this component draws the row; the CALLER owns the persistence
 * (`use-tile-size.ts`) and applies `--album-column` to whatever ancestor
 * wraps its grid (`masonry.tsx`'s own knob). A future caller (a second
 * gallery, a future guest mount once `guest-chrome` round two lands) reads
 * from its own cookie and wires the same two props.
 *
 * His crowding worry over this exact row (download, tile size, sort, filter,
 * select) is a narrow round two on this board (`gallery-controls`); this
 * cluster is what that round two starts from.
 */
export function TileSizeControl({
  value,
  onChange,
}: {
  value: TileSize;
  onChange: (size: TileSize) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Tile size"
        className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
      >
        {TILE_SIZES.map((size) => (
          <Button
            key={size}
            type="button"
            variant={size === value ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={`Tile size ${SIZE_LABEL[size]}`}
            aria-pressed={size === value}
            title={`${size}px`}
            onClick={() => onChange(size)}
          >
            <SizeGlyph size={size} />
          </Button>
        ))}
      </div>
      <span aria-hidden className="h-4 w-px bg-border" />
      <ReservedPill icon={ListFilter} label="Sort" />
      <ReservedPill icon={LayoutGrid} label="Filter" />
    </div>
  );
}
