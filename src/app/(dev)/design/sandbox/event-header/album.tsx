"use client";

import type { CSSProperties } from "react";
import { Download, SlidersHorizontal } from "lucide-react";

import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import { formatMediaCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { ALBUM, type Still } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE ALBUM UNDER EVERY HEAD, AT REST: its photographs in justified rows (the
 * shape `MasonryColumns` `layout="rows"` draws: two a row at a phone, five at
 * a desk, the default step), quoted with flex so a frame needs no engine, no
 * window and no network. Every option of every question draws the same album,
 * so the only thing that differs between two frames is the head above it.
 *
 * ★ EACH TILE IS MARKED `data-eh-tile`, so a caption reads where the album's
 * first photograph lands on the first screen off the frame itself.
 */

/** Photographs a row at the default step (`ROW_CLASSES`): two at a phone, five at a desk. */
const PER_ROW: Record<ScreenId, number> = { "375": 2, "1440": 5 };

/** The album, repeated to a real album's depth, so a scrolled frame has somewhere to go. */
function photos(n: number): Still[] {
  return Array.from({ length: n }, (_, i) => ALBUM[i % ALBUM.length]!);
}

/**
 * ★ A ROW IS ITS PHOTOGRAPHS' RATIOS: each tile grows by its own width over
 * height from a zero basis and keeps its aspect, so every tile in a row comes
 * out one height and the row fills the width exactly, the way the rows engine
 * justifies a row (without its band, its cap or its landscape lead).
 */
export function AlbumRows({
  screen,
  count = 36,
  className,
}: {
  screen: ScreenId;
  count?: number;
  className?: string;
}) {
  const n = PER_ROW[screen];
  const all = photos(count);
  const rows = Array.from({ length: Math.ceil(all.length / n) }, (_, r) =>
    all.slice(r * n, r * n + n),
  );
  return (
    <div
      data-eh-album=""
      className={cn("flex flex-col gap-[var(--gap-gallery,4px)]", className)}
    >
      {rows.map((row, r) => (
        <div key={r} className="flex gap-[var(--gap-gallery,4px)]">
          {row.map((p, i) => (
            <span
              key={i}
              data-eh-tile=""
              className="relative min-w-0 overflow-hidden rounded-[var(--radius-tile)] bg-muted"
              style={
                {
                  flex: `${p.w / p.h} 1 0`,
                  aspectRatio: `${p.w} / ${p.h}`,
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the album's tile */}
              <img
                src={p.src}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full object-cover"
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * THE ALBUM'S OWN COUNT, with its quiet Download all and View (production's
 * `live-gallery.tsx` row, quoted: the real ones open the export and the view
 * stores). Today's head says the same number twice, here and in its stats
 * line; a head that counts in glyphs keeps this one as the album's own label.
 */
export function AlbumCount({ count }: { count: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
      <p className="px-0.5 text-working text-muted-foreground tabular-nums">
        {formatMediaCount(count)}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <Download className="size-4" /> Download all
        </span>
        <span className="flex size-8 items-center justify-center rounded-md text-muted-foreground">
          <SlidersHorizontal className="size-4" />
        </span>
      </div>
    </div>
  );
}

/**
 * AN EMPTY ALBUM, AS PRODUCTION DRAWS IT: the ghosted river under "The album
 * starts with you" and Add the first photo (`gallery-empty-state.tsx`, the
 * real component). It keeps the words' column, as production keeps it.
 */
export function EmptyAlbum({ className }: { className?: string }) {
  return (
    <div data-eh-empty="" className={className}>
      <GalleryEmptyState onAddFirst={() => {}} />
    </div>
  );
}
