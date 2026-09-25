"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";

import { setRowStepAction } from "@/app/(app)/dashboard/[eventId]/actions";
import {
  HubViewProvider,
  useHostAlbum,
  useHubCounts,
  useHubLive,
  type HubAlbum,
  type HubView,
} from "@/components/app/event-feed/host-album";
import { useHostAdd } from "@/components/app/host-add-provider";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { HostUpload } from "@/components/app/host-upload";
import { HubBin, useHubBin } from "@/components/app/recently-deleted-grid";
import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { Button } from "@/components/ui/button";
import {
  ViewMenu,
  type ViewMenuDensityGroup,
  type ViewMenuGroup,
} from "@/components/shared/view-menu";
import { trackAttrs } from "@/lib/analytics/events";
import type { HubSort } from "@/lib/event/hub-album";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";
import { perRowFor, type RowStep } from "@/lib/shared/album-rows";
import { useRowStep } from "@/lib/shared/use-tile-size";
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
 * one View menu (`app-vocabulary` r2, `controls-home=view-menu`) holding Tile
 * size, Sort and Filter — the DELETED lens his settings note first folded in
 * here ("The photo bin joins the album as a filter") now lives inside Filter,
 * so "Deleted" still names exactly one thing in the product.
 *
 * ★ THE VIEW IS LIVE NOW THAT THE ALBUM IS THE CLIENT'S (the album-host-wiring
 * lane). The album used to be an opaque, server-rendered slot, so Sort was a
 * reserved seat: reordering what happened to be mounted would not have sorted
 * the album. On the paged album the page's store holds every item (the
 * manifest), so Sort reverses the whole album, laid from its start
 * (`rowAnchor="start"`: an arrival lands at the end), and Tile size is the rows'
 * density step (`album-columns` r2, `steps=both`: this slider, a pinch, ctrl and
 * the wheel), kept in the one `pr_tile_size` cookie so the first paint is the
 * step a returning host picked.
 *
 * ★ THE BIN IS FETCHED ON DEMAND, NEVER WITH THE PAGE, AND IS PAGED. Choosing
 * the filter reads the bin's list (ids, shapes, countdowns, no links), once for
 * the life of the island, and its rows mint links per window like the album's
 * (`useHubBin`), so a bin of a thousand costs what its first screen shows.
 *
 * ★ THE BIN'S ITEMS ARE NEVER IN THE ALBUM'S COUNT. The count beside "Album" is
 * the live album's, full stop — a host reading "48 photos" must be reading the
 * number of photographs their guests can see or they have tucked away. It is
 * the store's COUNTED number (approved + hidden, read in the same snapshot as
 * the album's version), never a list's length. The bin says its own size on its
 * own chip.
 */
export function EventGallery({
  eventId,
  launchCount = 0,
  videosAllowed,
  initialStep,
  tier,
  children,
}: {
  eventId: string;
  /** How many things are still outstanding on an empty event (`empty=list`), so
   *  the section can be named for what it actually holds before the first
   *  photograph. Ignored the moment the album has one. */
  launchCount?: number;
  videosAllowed: boolean;
  /** The density step the server painted from the `pr_tile_size` cookie, so the
   *  first paint is already the step a returning host picked. */
  initialStep: RowStep;
  /** Server-derived (`profiles.tier`): the bin's pricing sheet headline. */
  tier?: string;
  /** The album (`EventUploads`), handed down as an opaque slot. */
  children: React.ReactNode;
}) {
  const album = useHostAlbum();
  const [view, setView] = useState<View>("album");
  const [sort, setSort] = useState<HubSort>("newest");
  const { step, setRowStep } = useRowStep(initialStep, setRowStepAction);
  // One identity for the page's life: the grid under this reads it from context, and a setter
  // that changed every render would re-render the album on every selection toggle up here.
  const setStepRef = useRef(setRowStep);
  useEffect(() => {
    setStepRef.current = setRowStep;
  });
  const setStep = useCallback((s: RowStep) => setStepRef.current(s), []);
  const bin = useHubBin(eventId);
  const albumCount = useAlbumCount(album);

  const add = useHostAdd();
  const adding = add?.adding ?? false;
  const selection = useHostSelection();

  // The album's width, for the slider's words ("5 a row"): read off the box the
  // rows are laid in, and only while the album is the view.
  const boxRef = useRef<HTMLDivElement | null>(null);
  const width = useBoxWidth(boxRef, view === "album");

  const showDeleted = () => {
    setView("deleted");
    bin.open();
  };

  // THE VIEW MENU'S THREE GROUPS (`app-vocabulary` r2, `controls-home=view-menu`):
  // tile size (the rows' density, a slider), sort and filter behind one button.
  const viewGroups: (ViewMenuGroup | ViewMenuDensityGroup)[] = [
    {
      kind: "density",
      id: "tile-size",
      label: "Tile size",
      value: step,
      onChange: setStep,
      perRow: width ? (s) => perRowFor(width, s) : undefined,
      disabled: view !== "album",
    },
    {
      id: "sort",
      label: "Sort",
      value: sort,
      disabled: view !== "album",
      onChange: (v) => setSort(v === "oldest" ? "oldest" : "newest"),
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
      ],
    },
    {
      id: "filter",
      label: "Filter",
      value: view === "deleted" ? "deleted" : "all",
      onChange: (v) => (v === "deleted" ? showDeleted() : setView("album")),
      options: [
        { value: "all", label: "All" },
        { value: "deleted", label: "Deleted" },
      ],
    },
  ];

  const hubView = useMemo<HubView>(
    () => ({ step, setStep, sort }),
    [step, setStep, sort],
  );

  return (
    <section aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        // ★ THE SECTION IS NAMED FOR WHAT IT HOLDS (`empty=list`, Will
        // 2026-09-21). Before the first photograph this room is not an album
        // with nothing in it, it is the launch list — so the header says so, and
        // its count is what is still outstanding rather than a zero. The name
        // and the count both go back the moment a photograph lands, which is the
        // verdict's own sentence: "The album takes the room back".
        label={
          view === "deleted"
            ? "Deleted"
            : albumCount === 0
              ? "Before the first photo"
              : "Album"
        }
        count={
          view === "album"
            ? albumCount || launchCount || undefined
            : bin.status === "ready"
              ? bin.entries.length
              : undefined
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
                  <GallerySelectButton />
                </>
              )}
              {/* One View menu holds Tile size, Sort and Filter (`app-vocabulary`
                  r2, `controls-home=view-menu`): Download and Select are the
                  row's only other verbs. Always rendered, matching the Deleted
                  toggle it replaces — the Filter group is how a host reaches an
                  empty bin from an empty album, exactly as today. */}
              <ViewMenu groups={viewGroups} />
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

      {/* --arrival-glow-ms rides the album's box (`first=live`): the number is
          ONE constant in lib/shared/arrival.ts, the grid holds an id for exactly
          that long, and the sheet that fades the light reads it from here — so
          the attribute and the animation can never disagree. */}
      <div
        ref={boxRef}
        data-section-swap
        className={cn(view === "album" ? "" : "hidden")}
        style={
          {
            "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          } as React.CSSProperties
        }
      >
        <HubViewProvider value={hubView}>{children}</HubViewProvider>
      </div>

      {view === "deleted" && (
        <div data-section-swap>
          {bin.status === "loading" || bin.status === "idle" ? (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Opening Deleted…
            </p>
          ) : bin.status === "error" ? (
            <p className="py-10 text-sm text-muted-foreground">
              Couldn&rsquo;t load deleted items.
            </p>
          ) : bin.entries.length > 0 ? (
            <HubBin
              bin={bin}
              eventId={eventId}
              tier={tier}
              onRestored={() => void album?.sync()}
            />
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              Nothing deleted. Anything you remove waits here for 30 days.
            </p>
          )}
        </div>
      )}

      {/* The empty album's Share door moved INTO the launch list, which is the
          empty room's subject now (`empty=list`): two doors to sharing, one
          under the other, was the shape his verdict replaced. */}
    </section>
  );
}

/** The album's live count (approved + hidden), or 0 off the hub. */
function useAlbumCount(album: HubAlbum | null): number {
  return useHubCounts(album)?.album ?? 0;
}

/** A box's content width while `active`, re-read as it resizes; null until measured. */
function useBoxWidth(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, active]);
  return width;
}

/**
 * THE LIVE PIP (Will, `first=live`, 2026-09-21: "It lands while she is looking.
 * The empty room gives way to the tile, the count moves, a Live pip").
 *
 * ★ THE PIP IS THE PAGE'S ONE LIVE ISLAND IN THE HEADER, AND IT DRAWS NOTHING
 * UNTIL THE DOORBELL'S SOCKET IS ACTUALLY SUBSCRIBED: a pip claiming "Live" over
 * a dead socket is worse than no pip. What keeps the album current is the page's
 * album store (`HostAlbumProvider`: the doorbell, the fallback poll, the tab's
 * return), which never refreshes the page; this reads only whether the socket is
 * up.
 */
export function EventLive() {
  const live = useHubLive(useHostAlbum());
  if (!live) return null;
  return (
    <span
      className="flex items-center gap-1.5"
      title="New photos appear here as they arrive"
    >
      <span className="size-1.5 rounded-full bg-success" aria-hidden />
      Live
    </span>
  );
}
