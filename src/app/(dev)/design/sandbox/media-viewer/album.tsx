"use client";

import type { CSSProperties } from "react";
import { Check, Download, SlidersHorizontal } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { buildGuestViewGroups } from "@/components/guest/live-gallery";
import {
  AlbumRows,
  CornerPlayBadge,
  type RowTileBox,
} from "@/components/shared/masonry";
import type { ViewMenuGroup } from "@/components/shared/view-menu";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { formatCount } from "@/lib/format/count";
import { DEFAULT_TILE_SIZE } from "@/lib/shared/tile-size-cookie";
import { cn } from "@/lib/utils";

import { ALBUM, MINE_IDS } from "./fixtures";

/**
 * THE GUEST'S ALBUM AT ITS HEAD, ON THE REAL ROWS, WEARING ONE MARK.
 *
 * Every picture on this board is the same page with exactly one thing
 * changed: what the tiles that are hers wear. The rows are the real engine and
 * its real box (`AlbumRows`, the album's middle step, anchored at the oldest
 * end as a newest-first album is), laid in the album's real bleed (`px-3
 * sm:px-5`, `event-experience.tsx`'s BLEED), under the album's real count row.
 *
 * ★ THE TILE IS QUOTED, AND ONE THING ABOUT IT MOVES ON PURPOSE. `MasonryColumns`
 * would bring the lightbox, a like mark reading a provider this frame has not
 * got, and the glass dot this round replaces, so the tile is drawn here from
 * the shipped parts (`MediaTile`, `CornerPlayBadge`) with the shipped root's
 * attributes. What moves: the photograph's clip goes one level IN, from the
 * tile root to a wrapper inside it. `run` and `baseline` draw across the 4px
 * gutter between two of her tiles, and a root that clips cannot paint outside
 * itself; wiring either one is that same one-level move on the real tile.
 *
 * ★ A RUN IS READ OFF THE ROWS' OWN DOM, NEVER COMPUTED BESIDE THEM. The rows
 * are one flex box whose lines are broken by `[data-row-break]` elements, so
 * two of her tiles are neighbours in a row exactly when one is the next
 * sibling of the other: the sheet's `+` and `:has(+ ...)` find every run with
 * no engine change and no measuring (`media-viewer.css`).
 *
 * ★ LIGHT AND DARK ARE FORCED, NOT INHERITED from the lab's own theme:
 * `surface-paper` and `.dark` are the codebase's two force-hooks, and a paper
 * wrapper is never put inside a dark one the other way round (globals.css).
 */

export type Mark = "inset" | "run" | "baseline" | "none";
export type Ground = "light" | "dark";

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** Board state arrives as strings; anything unknown falls back to phone first. */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";
export const groundOf = (v: string | undefined): Ground =>
  v === "dark" ? "dark" : "light";

/** One tile of the album: the shipped parts, the mark as a sibling of the clip. */
function Tile({
  item,
  box,
  mine,
}: {
  item: GridMedia;
  box: RowTileBox;
  mine: boolean;
}) {
  return (
    <div
      data-rows-key={box.rowsKey}
      data-media-tile
      data-media-id={item.id}
      // No entrance: every press of an option would replay the album's
      // fade-rise, and what is being compared is the tiles at rest.
      data-static=""
      data-mv-mine={mine ? "" : undefined}
      style={
        { ...box.style, borderRadius: "var(--radius-tile)" } as CSSProperties
      }
      className="group relative bg-black/10"
    >
      {/* The clip, one level in (the head comment), carrying the bright edge
          (`data-lit`) because it now owns the radius and the clipping. */}
      <div
        data-lit=""
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <MediaTile item={item} playBadge="none" />
        {item.type === "video" && <CornerPlayBadge />}
      </div>
      {mine && <span aria-hidden data-mv-mark="" />}
    </div>
  );
}

/**
 * THE VIEW MENU, DRAWN OPEN, for `none`. The real one is a radix dropdown,
 * which portals to the BOARD's body rather than the frame's, so it is drawn
 * here on the shipped panel's own parts (`floatingPanel`, `floatingRow`, the
 * group label's type) with the groups the guest's album really passes
 * (`buildGuestViewGroups`): Tile size, reserved below 640, and Showing.
 */
function DrawnMenu({ groups }: { groups: readonly ViewMenuGroup[] }) {
  return (
    <div
      data-mv-menu=""
      className={cn(
        "absolute top-full right-0 z-20 mt-1 w-56 p-1",
        floatingPanel,
      )}
    >
      {groups.map((g, i) => (
        <div
          key={g.id}
          role="group"
          aria-label={g.label}
          className={cn("flex flex-col gap-0.5", i > 0 && "mt-1.5")}
        >
          <div className="flex items-baseline justify-between gap-3 px-2 pt-0.5 pb-1 text-xs text-foreground opacity-70">
            <span>{g.label}</span>
            {g.hint ? (
              <span className="text-micro text-muted-foreground/70">
                {g.hint}
              </span>
            ) : null}
          </div>
          {g.options.map((o) => (
            <div
              key={o.value}
              data-mv-option={o.value}
              className={cn(
                "relative flex items-center gap-2 py-1.5 pr-8 pl-2 text-sm",
                floatingRow,
                (g.disabled || o.disabled) && "opacity-50",
              )}
            >
              {o.label}
              {g.value === o.value && (
                <Check aria-hidden className="absolute right-2 size-4" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The album's own count row (`live-gallery.tsx`): the count, Download all and
 * View, quoted at rest; `open` draws View's panel under its button.
 */
function CountRow({ screen, open }: { screen: ScreenId; open: boolean }) {
  const groups = buildGuestViewGroups({
    tileSize: DEFAULT_TILE_SIZE,
    setTileSize: () => {},
    wideEnough: screen !== "375",
    showingMine: false,
    setShowingMine: () => {},
    ownedCount: MINE_IDS.size,
  });
  const count = ALBUM.length;
  return (
    <div className="relative mb-3 flex flex-wrap items-center justify-between gap-1.5">
      <p className="px-0.5 text-working text-muted-foreground tabular-nums">
        {formatCount(count)} {count === 1 ? "photo" : "photos"}
        {" & videos"}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <Download aria-hidden className="size-4" /> Download all
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          tabIndex={-1}
        >
          <SlidersHorizontal /> View
        </Button>
      </div>
      {open && <DrawnMenu groups={groups} />}
    </div>
  );
}

/** The page: the album's count row and its rows, on a forced ground. */
export function MineAlbum({
  screen,
  ground,
  mark,
}: {
  screen: ScreenId;
  ground: Ground;
  mark: Mark;
}) {
  return (
    <div
      className={cn(
        ground === "dark" ? "dark" : "surface-paper",
        "pointer-events-none min-h-screen bg-background text-foreground",
      )}
    >
      <div data-mv-album={mark} className="px-3 pt-4 pb-6 sm:px-5 sm:pt-5">
        <CountRow screen={screen} open={mark === "none"} />
        <AlbumRows
          items={ALBUM}
          renderTile={(item, box) => (
            <Tile
              key={item.id}
              item={item}
              box={box}
              mine={MINE_IDS.has(item.id)}
            />
          )}
        />
      </div>
    </div>
  );
}
