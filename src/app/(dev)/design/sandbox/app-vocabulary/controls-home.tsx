"use client";

import { useState } from "react";
import {
  Clapperboard,
  ImageUp,
  ListChecks,
  Settings,
  SlidersHorizontal,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GallerySelectButton } from "@/components/app/event-feed/gallery-actions";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { LikesProvider } from "@/components/likes/likes-provider";
import { MasonryColumns } from "@/components/shared/masonry";
import { TileSizeControl } from "@/components/shared/tile-size-control";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { DEFAULT_TILE_SIZE, type TileSize } from "@/lib/shared/tile-size-cookie";
import { cn } from "@/lib/utils";

import { GALLERY_ITEMS } from "./fixtures";
import type { WidthId } from "./scene";

/**
 * THE FOUR OPTIONS FOR `controls-home`, each the real, wired Album header
 * (`event-gallery.tsx`) with its real leaf components, never a redraw. Two
 * options open a surface that would ordinarily be a Radix Portal (a menu,
 * the responsive Sheet); both portal to `document.body` in the OUTER page
 * (`frame.tsx`'s own note, and round one's `gallery-controls.tsx` found it
 * first for a Popover), so they are reproduced open, on the shipped
 * floating-layer tokens, rather than mounted live. Everything else — the
 * buttons, the header, the tile-size cluster with its own baked-in Sort and
 * Filter pills, the masonry grid — is the production component, imported.
 */

const ALBUM_COUNT = GALLERY_ITEMS.length;

function AlbumGrid() {
  return (
    <div style={{ "--album-column": "240px" } as React.CSSProperties}>
      <LikesProvider mediaIds={GALLERY_ITEMS.map((m) => m.id)}>
        <MasonryColumns items={GALLERY_ITEMS} />
      </LikesProvider>
    </div>
  );
}

function Ground({ children }: { children: React.ReactNode }) {
  return (
    <HostSelectionProvider>
      <div className="relative min-h-full space-y-4 bg-background p-5 text-foreground">
        {children}
      </div>
    </HostSelectionProvider>
  );
}

/* ── row: the wired cluster, unchanged ───────────────────────────────────── */

function RowActions() {
  const [size, setSize] = useState<TileSize>(DEFAULT_TILE_SIZE);
  return (
    <div
      data-controls-row
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <Button type="button" variant="outline" size="sm">
        <ImageUp /> Add photos
      </Button>
      <GalleryDownloadAllButton eventId="demo" />
      <TileSizeControl value={size} onChange={setSize} />
      <GallerySelectButton />
      <Button type="button" variant="ghost" size="sm">
        <Trash2 /> Deleted
      </Button>
    </div>
  );
}

export function RowOption() {
  return (
    <Ground>
      <FeedSectionHeader
        label="Album"
        count={ALBUM_COUNT}
        action={<RowActions />}
      />
      <AlbumGrid />
    </Ground>
  );
}

/* ── view-menu: tile size, sort and filter behind one button ────────────── */

function ViewMenuActions() {
  const [size, setSize] = useState<TileSize>(DEFAULT_TILE_SIZE);
  return (
    <div
      data-controls-row
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <Button type="button" variant="outline" size="sm">
        <ImageUp /> Add photos
      </Button>
      <GalleryDownloadAllButton eventId="demo" />
      <div className="relative">
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal /> View
        </Button>
        {/* Drawn open: a real DropdownMenu portals to document.body in the
            outer page, which is not this frame. The tile-size cluster
            mounted below is the real, unedited production component; its
            two reserved Sort/Filter pills ride along for free. */}
        <div
          className={cn(
            "absolute top-full right-0 z-10 mt-1.5 w-max",
            floatingPanel,
          )}
        >
          <p className="px-3 pt-2 text-[10px] text-muted-foreground">View</p>
          <div className="p-2">
            <TileSizeControl value={size} onChange={setSize} />
          </div>
        </div>
      </div>
      <GallerySelectButton />
      <Button type="button" variant="ghost" size="sm">
        <Trash2 /> Deleted
      </Button>
    </div>
  );
}

export function ViewMenuOption() {
  return (
    <Ground>
      <FeedSectionHeader
        label="Album"
        count={ALBUM_COUNT}
        action={<ViewMenuActions />}
      />
      <AlbumGrid />
    </Ground>
  );
}

/* ── sheet: the responsive Sheet at 375, the row untouched at 1440 ──────── */

function SheetPhone() {
  const [size, setSize] = useState<TileSize>(DEFAULT_TILE_SIZE);
  return (
    <Ground>
      <FeedSectionHeader
        label="Album"
        count={ALBUM_COUNT}
        action={
          <div
            data-controls-row
            className="flex flex-wrap items-center justify-end gap-1.5"
          >
            <Button type="button" variant="outline" size="sm">
              <ImageUp /> Add
            </Button>
            <Button type="button" variant="outline" size="sm">
              <SlidersHorizontal /> Controls
            </Button>
            <Button type="button" variant="ghost" size="sm">
              <Trash2 /> Deleted
            </Button>
          </div>
        }
      />
      <AlbumGrid />
      {/* The responsive Sheet's own bottom posture (ui/sheet.tsx,
          floating-layer.ts's data-[side=responsive]:max-sm:*), drawn open on
          its own tokens: Radix's Portal targets document.body in the OUTER
          page (frame.tsx), so a live Sheet here would leave this frame
          entirely. `fixed` still anchors correctly to THIS iframe's own
          viewport, because the portal is what escapes, not fixed
          positioning itself. */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70%] flex-col gap-3 rounded-t-float border-t border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer">
        <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-border" />
        <p className="text-sm font-medium text-foreground">Album controls</p>
        <TileSizeControl value={size} onChange={setSize} />
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <GalleryDownloadAllButton eventId="demo" />
          <GallerySelectButton />
        </div>
      </div>
    </Ground>
  );
}

export function SheetOption({ width }: { width: WidthId }) {
  // His own row, at a desk: there is room, so nothing about the header
  // changes and the sheet never mounts.
  if (width === "1440") return <RowOption />;
  return <SheetPhone />;
}

/* ── pills: every control rides the sticky cards row ─────────────────────── */

type RoomDef = { id: string; icon: LucideIcon; label: string; value: string };

const ROOMS: readonly RoomDef[] = [
  { id: "review", icon: ListChecks, label: "Review", value: "12 waiting" },
  { id: "reel", icon: Clapperboard, label: "Reel", value: "8 clips" },
  { id: "guests", icon: Users, label: "Guests", value: "34 guests" },
  { id: "settings", icon: Settings, label: "Settings", value: "Public" },
];

/** The real cards row's own two shapes (event-cards-row.tsx), reproduced
 *  rather than imported: the shipped component has no slot for the
 *  gallery's controls to ride beside it, which is exactly what this option
 *  proposes, so drawing it live either way is new composition either way. */
function RoomChip({
  icon: Icon,
  label,
  value,
  stuck,
}: RoomDef & { stuck: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-between rounded-xl border border-border",
        stuck
          ? "h-9 min-w-0 flex-row items-center gap-1.5 px-3"
          : "h-24 w-36 gap-1 p-3",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {stuck ? (
        <span className="text-xs font-medium">{label}</span>
      ) : (
        <span className="font-heading text-card-title font-medium">
          {label}
        </span>
      )}
      <span
        className={cn(
          "truncate text-xs tabular-nums text-muted-foreground",
          stuck && "hidden",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** The gallery's own controls, unshrunk: GalleryDownloadAllButton and
 *  GallerySelectButton have no size prop to shrink further, so what
 *  condenses here is what already condenses today (the room cards) plus
 *  everything else now riding along in the same scroller, never redrawn to
 *  match a height the real leaf components cannot take. */
function PillsRow({ stuck }: { stuck: boolean }) {
  const [size, setSize] = useState<TileSize>(DEFAULT_TILE_SIZE);
  return (
    <div
      data-controls-row
      className={cn(
        "flex items-center gap-2 overflow-x-auto rounded-xl p-2",
        stuck && "border-b border-border bg-background/85",
      )}
    >
      {ROOMS.map((r) => (
        <RoomChip key={r.id} {...r} stuck={stuck} />
      ))}
      <span
        aria-hidden
        className={cn("shrink-0 bg-border", stuck ? "h-5 w-px" : "h-16 w-px")}
      />
      <Button type="button" variant="outline" size="sm">
        <ImageUp /> Add photos
      </Button>
      <GalleryDownloadAllButton eventId="demo" />
      <TileSizeControl value={size} onChange={setSize} />
      <GallerySelectButton />
      <Button type="button" variant="ghost" size="sm">
        <Trash2 /> Deleted
      </Button>
    </div>
  );
}

export function PillsOption() {
  return (
    <Ground>
      {/* Nothing in the header: label and count alone, his option's own
          words. */}
      <FeedSectionHeader label="Album" count={ALBUM_COUNT} />
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground">
          At rest, above the bar
        </p>
        <PillsRow stuck={false} />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground">
          Stuck, scrolled against the chrome
        </p>
        <PillsRow stuck />
      </div>
      <AlbumGrid />
    </Ground>
  );
}
