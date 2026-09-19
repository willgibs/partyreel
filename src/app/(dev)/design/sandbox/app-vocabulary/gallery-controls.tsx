"use client";

import { Download, LayoutGrid, ListFilter, SlidersHorizontal } from "lucide-react";

import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { ExportDialog } from "@/components/app/export/export-dialog";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GallerySelectButton } from "@/components/app/event-feed/gallery-actions";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { LikesProvider } from "@/components/likes/likes-provider";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { GALLERY_ITEMS } from "./fixtures";

/**
 * THE GALLERY'S CONTROLS: Will's ask, landed on the two rows that ALREADY
 * exist rather than a new one invented for it. The guest album already carries
 * exactly one control ("Download all", `live-gallery.tsx`, copied here byte
 * for byte — it is inline JSX at its real call site, not a component of its
 * own to import); the host Gallery section header already carries two
 * (`GalleryDownloadAllButton`, `GallerySelectButton`, both real, imported).
 * The tile-size control joins that row on both surfaces.
 *
 * ★ NO REAL `Popover` INSIDE A FRAME (the admin board's `destructive.tsx`
 * found this first): a radix Portal renders into `document.body` of whichever
 * document the SCRIPT runs in, which is the board's own page, not the frame
 * it is drawn in — the panel would leave the picture entirely. The `popover`
 * option's panel is drawn STATICALLY OPEN on the shipped `floatingPanel`
 * token (bible 15), reproducing its position and material, never its
 * component.
 */

export type ControlShape = "segmented" | "cluster" | "popover";
export type Persistence = "session" | "device" | "account";
export const STEPS = [180, 240, 300] as const;
export type Step = (typeof STEPS)[number];

/** A tile-size glyph: N small squares standing in for N columns, so the
 *  control reads as "how many, how big" rather than a bare S/M/L label. */
function Glyph({ step }: { step: Step }) {
  const n = step === 180 ? 3 : step === 240 ? 2 : 1;
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

function persistLabel(p: Persistence): string {
  if (p === "session") return "Resets on reload";
  if (p === "device") return "Remembered on this device";
  return "Synced to your account";
}

export function TileSizeSegment({
  value,
  persist,
}: {
  value: Step;
  persist?: Persistence;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        role="group"
        aria-label="Tile size"
        className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
      >
        {STEPS.map((s) => (
          <Button
            key={s}
            type="button"
            variant={s === value ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={`Tile size ${s === 180 ? "small" : s === 240 ? "medium" : "large"}`}
            aria-pressed={s === value}
            title={`${s}px`}
          >
            <Glyph step={s} />
          </Button>
        ))}
      </div>
      {persist && (
        <span className="text-[10px] text-muted-foreground">
          {persistLabel(persist)}
        </span>
      )}
    </div>
  );
}

/** The reserved seam: two non-interactive ghost pills, so the row already
 *  reads as "controls" rather than "tile size, alone" the day sort/filter
 *  actually exist. Dashed and muted: present, deliberately not real yet. */
function ReservedPill({
  icon: Icon,
  label,
}: {
  icon: typeof ListFilter;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2 py-1 text-[10px] text-muted-foreground/70">
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

function TileSizeControl({
  shape,
  value,
  persist,
}: {
  shape: ControlShape;
  value: Step;
  persist?: Persistence;
}) {
  if (shape === "popover") {
    return (
      <div className="relative">
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal /> Tile size
        </Button>
        {/* Drawn open, in place, on the shipped floating-layer tokens — never
            the real Popover (see the file note). */}
        <div
          className={cn(
            "absolute top-full left-0 z-10 mt-1.5 w-44 p-2",
            floatingPanel,
          )}
        >
          <p className="mb-1.5 px-1 text-[10px] text-muted-foreground">
            Tile size
          </p>
          <div className="flex flex-col gap-0.5">
            {STEPS.map((s) => (
              <span
                key={s}
                className={cn(
                  "flex items-center gap-2 rounded px-1.5 py-1 text-xs",
                  s === value
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground",
                )}
              >
                <Glyph step={s} />
                {s}px
              </span>
            ))}
          </div>
          {persist && (
            <p className="mt-1.5 border-t border-border/60 px-1 pt-1.5 text-[10px] text-muted-foreground">
              {persistLabel(persist)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TileSizeSegment value={value} persist={persist} />
      {shape === "cluster" && (
        <>
          <span aria-hidden className="h-4 w-px bg-border" />
          <ReservedPill icon={ListFilter} label="Sort" />
          <ReservedPill icon={LayoutGrid} label="Filter" />
        </>
      )}
    </div>
  );
}

/** The guest album's row, copied byte for byte from `live-gallery.tsx` (the
 *  ExportDialog trigger is real; only the surrounding row gains the control
 *  and a `justify-between`, since it used to hold "Download all" alone). */
export function GuestControlsRow({
  shape,
  value,
  persist,
}: {
  shape: ControlShape;
  value: Step;
  persist?: Persistence;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <TileSizeControl shape={shape} value={value} persist={persist} />
      <ExportDialog scope="guest" albumKey="demo">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
        >
          <Download className="size-4" /> Download all
        </button>
      </ExportDialog>
    </div>
  );
}

/** The host event page's Gallery section header, real down to the two
 *  buttons either side of the new control. `GallerySelectButton` renders
 *  nothing without a provider (a safe no-op today), so it is wrapped exactly
 *  as `EventFeed` wraps it. */
export function HostControlsRow({
  shape,
  value,
  persist,
}: {
  shape: ControlShape;
  value: Step;
  persist?: Persistence;
}) {
  return (
    <HostSelectionProvider>
      <FeedSectionHeader
        label="Gallery"
        count={GALLERY_ITEMS.length}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <GalleryDownloadAllButton eventId="demo" />
            <TileSizeControl shape={shape} value={value} persist={persist} />
            <GallerySelectButton />
          </div>
        }
      />
    </HostSelectionProvider>
  );
}

/** The real masonry, wearing whichever step is picked — `--album-column` set
 *  on this wrapper, exactly the seam `masonry.tsx` describes. */
export function LiveGrid({ value }: { value: Step }) {
  return (
    <div style={{ "--album-column": `${value}px` } as React.CSSProperties}>
      <LikesProvider mediaIds={GALLERY_ITEMS.map((m) => m.id)}>
        <MasonryColumns items={GALLERY_ITEMS} />
      </LikesProvider>
    </div>
  );
}
