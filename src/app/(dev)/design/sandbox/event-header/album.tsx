"use client";

import type { CSSProperties } from "react";
import {
  Download,
  ImageUp,
  Images,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM, type HostFacts, type Still } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE ALBUM UNDER EVERY HEAD, AT REST: its photographs in justified rows (the
 * shape the rows engine draws: two a row at a phone, five at a desk, the
 * default step), quoted with flex so a frame needs no engine, no window and
 * no network. Every option of every decision draws the same album, so two
 * frames differ only in what the decision redraws.
 *
 * ★ EACH TILE IS MARKED `data-eh-tile`, so a caption reads where the album's
 * first photograph lands on the first screen off the frame itself.
 */

/** Photographs a row at the default step: two at a phone, three at a tablet, five at a desk (`ROW_CLASSES`). */
const PER_ROW: Record<ScreenId, number> = { "375": 2, "820": 3, "1440": 5 };

/** The album, repeated to a real album's depth, so a scrolled frame has somewhere to go. */
function photos(n: number, album: readonly Still[]): Still[] {
  return Array.from({ length: n }, (_, i) => album[i % album.length]!);
}

/**
 * ★ A ROW IS ITS PHOTOGRAPHS' RATIOS: each tile grows by its own width over
 * height from a zero basis and keeps its aspect, so every tile in a row comes
 * out one height and the row fills the width exactly, the way the rows engine
 * justifies a row.
 */
export function AlbumRows({
  screen,
  count = 36,
  album = ALBUM,
  className,
}: {
  screen: ScreenId;
  count?: number;
  /** The album's own photographs (the wedding's unless an album says otherwise). */
  album?: readonly Still[];
  className?: string;
}) {
  const n = PER_ROW[screen];
  const all = photos(count, album);
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
 * THE HUB'S ALBUM: production's section header (`FeedSectionHeader`: the
 * label, its count, Add photos, Download, Select and View) over the rows, or
 * the album's own empty place the week before (`FeedSectionEmpty`, the words
 * `EventUploads` says).
 */
export function HubAlbum({
  f,
  screen,
  album,
}: {
  f: HostFacts;
  screen: ScreenId;
  album?: readonly Still[];
}) {
  const has = f.photos > 0;
  return (
    <section aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        label="Album"
        count={has ? f.photos : undefined}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button variant="outline" size="sm">
              <ImageUp /> Add photos
            </Button>
            {has && screen !== "375" ? (
              <Button variant="outline" size="sm">
                <Download /> Download
              </Button>
            ) : null}
            {has ? (
              <Button variant="outline" size="sm">
                <ListChecks /> Select
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-sm" aria-label="View">
              <SlidersHorizontal />
            </Button>
          </div>
        }
      />
      {has ? (
        <div className="-mx-1">
          <AlbumRows screen={screen} album={album} />
        </div>
      ) : (
        <div data-eh-empty="">
          <FeedSectionEmpty
            icon={Images}
            title="No photos yet"
            desc="The album fills here as you and your guests add photos."
          />
        </div>
      )}
    </section>
  );
}
