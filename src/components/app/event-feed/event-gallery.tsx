"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";

import { setRowStepAction } from "@/app/(app)/dashboard/[eventId]/actions";
import {
  HostAlbumCover,
  LookingEarly,
} from "@/components/app/event-feed/event-hub-head-cover";
import { useHubArrivals } from "@/components/app/event-feed/event-gallery-news";
import {
  HubViewProvider,
  useHostAlbum,
  useHubCounts,
  type HubAlbum,
  type HubView,
} from "@/components/app/event-feed/host-album";
import { HubDevelop } from "@/components/app/event-feed/hub-develop";
import { useHostAdd } from "@/components/app/host-add-provider";
import { useHostSelection } from "@/components/app/host-selection-provider";
import { HostUpload } from "@/components/app/host-upload";
import { HubBin, useHubBin } from "@/components/app/recently-deleted-grid";
import { DriveSendStrip } from "@/components/app/drive/send-strip";
import { GalleryDownloadAllButton } from "@/components/app/export/download-all-button";
import { Button } from "@/components/ui/button";
import {
  AlbumNewsContext,
  type AlbumNews,
} from "@/components/shared/album-window-news";
import {
  ViewMenu,
  type ViewMenuDensityGroup,
  type ViewMenuGroup,
} from "@/components/shared/view-menu";
import { trackAttrs } from "@/lib/analytics/events";
import { hubCovered, type HubDevelopFacts } from "@/lib/disposable/host-cover";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import type { HubSort } from "@/lib/event/hub-album";
import { albumOwnSort, sortViewGroup } from "@/lib/shared/album-order";
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
 * manifest), so Sort turns the whole album (Oldest first is the night in order,
 * the guests' own: `hubEntries`), laid from its start
 * (`rowAnchor="start"`: an arrival lands at the end), and Tile size is the rows'
 * density step (`album-columns` r2, `steps=both`: this slider, a pinch, ctrl and
 * the wheel), kept in the one `pr_tile_size` cookie so the first paint is the
 * step a returning host picked.
 *
 * ★ THE BIN IS FETCHED ON DEMAND, NEVER WITH THE PAGE, AND IS PAGED. Choosing
 * the filter reads the bin's list (ids, shapes, countdowns, no links), again
 * each time it is chosen so what was just deleted is there, and its rows mint
 * links per window like the album's (`useHubBin`), so a bin of a thousand costs
 * what its first screen shows.
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
  videosAllowed,
  initialStep,
  tier,
  develop,
  acceptingUploads = true,
  children,
}: {
  eventId: string;
  videosAllowed: boolean;
  /** The density step the server painted from the `pr_tile_size` cookie, so the
   *  first paint is already the step a returning host picked. */
  initialStep: RowStep;
  /** Server-derived (`profiles.tier`): the bin's pricing sheet headline. */
  tier?: string;
  /**
   * ★ THE ALBUM'S DEVELOP FACTS (the event's row): while a develop time is ahead, her album's place is her guests' wait,
   * covered until she looks (the-wait r1, Will's `cover=guests`, `event-hub-head-cover.tsx`). Absent, the album is open.
   */
  develop?: HubDevelopFacts | null;
  /**
   * Whether her album takes uploads (`events.accepting_uploads`): closed, it opens in the night's order, as her guests'
   * does (AY1). Absent, it is taking them, newest first.
   */
  acceptingUploads?: boolean;
  /** The album (`EventUploads`), handed down as an opaque slot. */
  children: React.ReactNode;
}) {
  const album = useHostAlbum();
  const landed = useCallback(() => void album?.sync(), [album]);
  const [view, setView] = useState<View>("album");
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

  /* ★ THE HOST'S COVER (the-wait r1, Will's `cover=guests`): while her album develops, its place is what her guests see
     until she looks, for this visit ("Expect most hosts to want to look, but also provide them the disposable experience
     a bit too, more fun that way"). The clock runs only where a develop time is set, so the cover lifts itself the moment
     the album develops. */
  const developClock = useWaitClock(Boolean(develop?.develops_at));
  const covered =
    develop?.develops_at != null &&
    // Before the reader's clock is known (the server's render, the hydrating one), now is the render's own.
    hubCovered(develop, developClock ?? undefined);
  const [looking, setLooking] = useState(false);
  const coverShown = covered && !looking && view === "album";

  /* ★ HER SORT FOLLOWS HER GUESTS' RULE (album-order's `albumOwnSort`, AY1): her album opens on the order her guests
     meet, newest first while it takes uploads and the night in order once she closes adding or it develops (the
     develop's clock above turns it at its moment), so a hub and a guest's phone never show one album two ways. Her own
     Sort is a departure for the visit, forgotten the moment she chooses the album's own again, so a close she makes
     while she looks turns her album too unless she chose otherwise. */
  const ownSort = albumOwnSort(
    { acceptingUploads, developsAt: develop?.develops_at ?? null },
    // Before her clock is known (the server's render, the hydrating one), the render's own now, as the cover's.
    developClock ?? undefined,
  );
  const [chosenSort, setChosenSort] = useState<HubSort | null>(null);
  const sort = chosenSort ?? ownSort;
  const setSort = useCallback(
    (next: HubSort) => setChosenSort(next === ownSort ? null : next),
    [ownSort],
  );

  // The album's width, for the slider's words ("5 a row"): read off the box the
  // rows are laid in, and only while the album is the view (and not under her cover).
  const boxRef = useRef<HTMLDivElement | null>(null);
  const width = useBoxWidth(boxRef, view === "album" && !coverShown);

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
    // The guests' own control (album-order): the same two words wherever an album is sorted.
    sortViewGroup(sort, setSort, view !== "album"),
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

  // ★ WHAT LANDED OUT OF HER SIGHT IS SAID (album-order, `album-window-news.tsx`): the hub's arrivals tell the rows
  // what is news, so a guest's photograph landing above her while she curates deep in the album wears the rows' one
  // pill under the hub's stuck bar rather than moving anything she is looking at.
  const arrivals = useHubArrivals(album);
  const news = useMemo<AlbumNews>(() => ({ arrivals }), [arrivals]);

  return (
    <section aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        // The album is the album from its first moment: what the event still
        // needs before guests arrive is the checklist's, at the head of the hub
        // (event-ready `list=head`), and an empty album carries no count at all,
        // never a zero.
        label={view === "deleted" ? "Deleted" : "Album"}
        count={
          view === "album"
            ? albumCount || undefined
            : bin.status === "ready"
              ? bin.entries.length
              : undefined
        }
        // Selecting, in a hand, the bar's five 44px targets take the row (the header's own note).
        actionFills={Boolean(selection?.selectMode)}
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
              {/* Under her cover there is no grid to select from or download yet: Look first. */}
              {view === "album" && albumCount > 0 && !coverShown && (
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

      {/* The album's send to Google Drive, at its head (drive-wiring, Will's `progress = album`). */}
      {view === "album" ? <DriveSendStrip eventId={eventId} /> : null}

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
            // The album's own store brings her batch (`host-upload.tsx`'s note), never a refresh.
            onBatchLanded={landed}
          />
        </div>
      )}

      {/* --arrival-glow-ms rides the album's box (`first=live`): the number is
          ONE constant in lib/shared/arrival.ts, the grid holds an id for exactly
          that long, and the sheet that fades the light reads it from here — so
          the attribute and the animation can never disagree. */}
      {coverShown && develop?.develops_at ? (
        <HostAlbumCover
          eventId={eventId}
          develop={{ ...develop, develops_at: develop.develops_at }}
          onLook={() => setLooking(true)}
        />
      ) : (
        <>
          {covered && looking && view === "album" && develop?.develops_at ? (
            <LookingEarly
              developsAt={develop.develops_at}
              zone={develop.time_zone}
              onCover={() => setLooking(false)}
            />
          ) : null}
          <div
            ref={boxRef}
            data-section-swap
            // Lifted, the album rises out of a wash of light, as a develop brings a photograph up (`event-hub-head-cover.css`).
            data-host-looked={covered && looking ? "" : undefined}
            className={cn(view === "album" ? "" : "hidden")}
            style={
              {
                "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
              } as React.CSSProperties
            }
          >
            {/* Her first open after the develop develops the cover in place, over these rows (`hub-develop.tsx`). */}
            <HubDevelop eventId={eventId} develop={develop}>
              <HubViewProvider value={hubView}>
                <AlbumNewsContext value={news}>{children}</AlbumNewsContext>
              </HubViewProvider>
            </HubDevelop>
          </div>
        </>
      )}

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

// The Live pip moved to its own module, so the hub's head reads it without the album's own graph (the cover's
// actions): `event-gallery-live.tsx`. Named here too, for every importer of this module.
export { EventLive } from "./event-gallery-live";
