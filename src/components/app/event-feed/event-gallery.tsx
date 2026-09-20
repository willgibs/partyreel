"use client";

import { useCallback, useState, useTransition } from "react";
import { ImageUp, Loader2, QrCode, Trash2 } from "lucide-react";

import {
  listDeletedMediaAction,
  setTileSizeAction,
  type BinItem,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { useHostAdd } from "@/components/app/host-add-provider";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { HostUpload } from "@/components/app/host-upload";
import {
  RecentlyDeletedGrid,
  type BinMedia,
} from "@/components/app/recently-deleted-grid";
import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { useEventShare } from "@/components/app/share/event-share-provider";
import { Button } from "@/components/ui/button";
import { TileSizeControl } from "@/components/shared/tile-size-control";
import { trackAttrs } from "@/lib/analytics/events";
import { DEFAULT_TILE_SIZE, type TileSize } from "@/lib/shared/tile-size-cookie";
import { useTileSize } from "@/lib/shared/use-tile-size";
import { cn } from "@/lib/utils";

import { FeedSectionHeader } from "./feed-section-header";
import { GalleryBulkBar, GallerySelectButton } from "./gallery-actions";

type View = "album" | "deleted";

/**
 * THE ALBUM AS THE PAGE'S SUBJECT (Will, `event=hub`: "since the gallery is the
 * core, let's simply have that displayed below the cards in most recent order
 * rather than requiring a click into 'album'").
 *
 * It carries the controls that used to be spread between the retired command
 * strip and the retired section header: Add photos, Download all, Select, and
 * the DELETED filter his settings note folded in here ("The photo bin joins the
 * album as a filter"), so "Deleted" names exactly one thing in the product.
 *
 * ★ THE BIN IS FETCHED ON DEMAND, NEVER WITH THE PAGE. Each binned item needs
 * its own presign; loading them eagerly would tax every render of the hub for a
 * drawer most hosts open once. Choosing the filter is what pays for it, and the
 * result is cached for the life of the island so flipping back and forth is
 * free.
 *
 * ★ THE BIN'S ITEMS ARE NEVER IN THE ALBUM'S COUNT. The count beside "Album" is
 * the live album's, full stop — a host reading "48 photos" must be reading the
 * number of photographs their guests can see. The bin says its own size on its
 * own chip.
 */
export function EventGallery({
  eventId,
  albumCount,
  videosAllowed,
  initialTileSize,
  children,
}: {
  eventId: string;
  /** Approved + hidden. Pending lives in the Review room; deleted lives in the bin. */
  albumCount: number;
  videosAllowed: boolean;
  /** Server-resolved from the cookie (`app-vocabulary` r1,
   *  `gallery-controls-persistence`, overruled to a cookie so the first paint
   *  is already the size a returning host picked — never localStorage,
   *  which would resize the whole album after hydration on every load). */
  initialTileSize?: TileSize;
  /** The RSC-presigned album, handed down as an opaque pre-rendered slot. */
  children: React.ReactNode;
}) {
  const [view, setView] = useState<View>("album");
  const [bin, setBin] = useState<BinMedia[] | null>(null);
  const [binError, setBinError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const { openSheet } = useEventShare();
  const { size: tileSize, setTileSize } = useTileSize(
    initialTileSize ?? DEFAULT_TILE_SIZE,
    setTileSizeAction,
  );

  const add = useHostAdd();
  const adding = add?.adding ?? false;
  const selection = useHostSelection();

  const showDeleted = useCallback(() => {
    setView("deleted");
    if (bin) return; // Already paid for.
    startLoading(async () => {
      const result = await listDeletedMediaAction(eventId);
      if (result.ok) {
        setBin(result.items.map(toBinMedia));
        setBinError(null);
      } else {
        setBinError(result.message);
      }
    });
  }, [bin, eventId]);

  return (
    <section aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        label={view === "album" ? "Album" : "Deleted"}
        count={
          view === "album"
            ? albumCount || undefined
            : (bin?.length ?? undefined)
        }
        action={
          selection?.selectMode ? (
            // GalleryBulkBar takes over the whole action slot in select mode
            // (mirroring ReviewActions, review-section.tsx), the row's only
            // mount point in production: nothing else rendered it before this
            // (retired with the floating EventFeedActionBar), so entering
            // select mode left a host with no visible Hide, Delete or Cancel.
            <GalleryBulkBar />
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {/* Add photos left the retired command strip for the album's own
                  header, beside the two controls it belongs with. */}
              <Button
                variant="outline"
                size="sm"
                aria-expanded={adding}
                onClick={add?.toggleAdd}
                {...trackAttrs("cta_click", {
                  cta: "add-photos",
                  location: "hub-album",
                })}
              >
                <ImageUp /> Add photos
              </Button>
              {view === "album" && albumCount > 0 && (
                <>
                  <GalleryDownloadAllButton eventId={eventId} />
                  {/* The tile-size cluster (`app-vocabulary` r1,
                      `gallery-controls-home=cluster`) joins Download and Select
                      — his crowding worry over this exact row is a narrow round
                      two (`gallery-controls`), not this lane's to pre-solve. */}
                  <TileSizeControl value={tileSize} onChange={setTileSize} />
                  <GallerySelectButton />
                </>
              )}
              <Button
                variant={view === "deleted" ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={view === "deleted"}
                onClick={() => (view === "deleted" ? setView("album") : showDeleted())}
                {...trackAttrs("cta_click", {
                  cta: "deleted-filter",
                  location: "hub-album",
                })}
              >
                <Trash2 /> Deleted
              </Button>
            </div>
          )
        }
      />

      {adding && (
        <div
          data-settings-reveal
          className="rounded-xl border border-border bg-muted/30 p-4"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            {videosAllowed
              ? "Add your own photos and videos, for example a batch from your photographer. These post to the album right away."
              : "Add your own photos, for example a batch from your photographer. These post to the album right away."}
          </p>
          <HostUpload
            eventId={eventId}
            videosAllowed={videosAllowed}
            onUploadingCountChange={add?.setUploadingCount}
          />
        </div>
      )}

      {/* --album-column is the knob masonry.tsx's grid reads (the seam its
          own comment describes); the tile-size cluster above sets it here, on
          the ancestor wrapping the grid, never on the grid component itself. */}
      <div
        data-section-swap
        className={cn(view === "album" ? "" : "hidden")}
        style={{ "--album-column": `${tileSize}px` } as React.CSSProperties}
      >
        {children}
      </div>

      {view === "deleted" && (
        <div data-section-swap>
          {loading && !bin ? (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Looking in the bin…
            </p>
          ) : binError ? (
            <p className="py-10 text-sm text-muted-foreground">{binError}</p>
          ) : bin && bin.length > 0 ? (
            <RecentlyDeletedGrid eventId={eventId} items={bin} />
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              Nothing deleted. Anything you remove waits here for 30 days.
            </p>
          )}
        </div>
      )}

      {/* The empty album's first door is the code, which is the one thing that
          actually fills an album (his `event` note: "Get the QR and sharing
          more infusion to the album UI visually"). */}
      {view === "album" && albumCount === 0 && (
        <div className="flex justify-center pb-4">
          <Button
            size="sm"
            onClick={() => openSheet("share")}
            {...trackAttrs("cta_click", {
              cta: "share-sheet",
              location: "hub-album-empty",
            })}
          >
            <QrCode /> Share the code
          </Button>
        </div>
      )}
    </section>
  );
}

/** The action returns plain rows; the grid wants `GridMedia & { countdownDays }`. */
function toBinMedia(item: BinItem): BinMedia {
  return {
    id: item.id,
    type: item.type as BinMedia["type"],
    url: item.url,
    status: item.status as BinMedia["status"],
    countdownDays: item.countdownDays,
    width: item.width,
    height: item.height,
    durationSeconds: item.durationSeconds,
  } as BinMedia;
}
