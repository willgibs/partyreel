"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { ViewMenu, type ViewMenuGroup } from "@/components/shared/view-menu";
import { trackAttrs } from "@/lib/analytics/events";
import {
  DEFAULT_TILE_SIZE,
  TILE_SIZE_LABEL,
  TILE_SIZES,
  type TileSize,
} from "@/lib/shared/tile-size-cookie";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";
import { useGalleryDoorbell } from "@/lib/guest/use-gallery-doorbell";
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
 * one View menu (`app-vocabulary` r2, `controls-home=view-menu`) holding Tile
 * size, Sort and Filter — the DELETED lens his settings note first folded in
 * here ("The photo bin joins the album as a filter") now lives inside Filter,
 * so "Deleted" still names exactly one thing in the product.
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
  launchCount = 0,
  videosAllowed,
  initialTileSize,
  children,
}: {
  eventId: string;
  /** Approved + hidden. Pending lives in the Review room; deleted lives in the bin. */
  albumCount: number;
  /** How many things are still outstanding on an empty event (`empty=list`), so
   *  the section can be named for what it actually holds before the first
   *  photograph. Ignored the moment the album has one. */
  launchCount?: number;
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

  // THE VIEW MENU'S THREE GROUPS (`app-vocabulary` r2, `controls-home=view-menu`):
  // tile size, sort and filter move behind one button. Two honesty lines this
  // lane drew rather than assumed (said in the Handoff):
  //   1. SORT IS RESERVED, NOT WIRED. This component receives `children` as an
  //      opaque, server-rendered slot (`EventUploads`, presigned in the RSC) —
  //      never the approved media array — so there is no client-side list to
  //      reorder. A "sort" that only reordered whatever happens to be mounted
  //      would not sort the album; it would misreport doing so. The group still
  //      renders (his ask was for the WORD to stop crowding the top level, not
  //      to vanish) with every option disabled and a hint saying so.
  //   2. FILTER HOLDS EXACTLY TODAY'S TWO STATES. The Deleted lens is the only
  //      filter this page can honestly offer for the same reason: a photos/
  //      videos split would need the same client-held list Sort would.
  const viewGroups: ViewMenuGroup[] = useMemo(
    () => [
      {
        id: "tile-size",
        label: "Tile size",
        value: String(tileSize),
        onChange: (v) => setTileSize(Number(v) as TileSize),
        options: TILE_SIZES.map((size) => ({
          value: String(size),
          label: TILE_SIZE_LABEL[size],
        })),
      },
      {
        id: "sort",
        label: "Sort",
        hint: "Coming soon",
        disabled: true,
        value: "newest",
        onChange: () => {},
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
    ],
    [tileSize, setTileSize, view, showDeleted],
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

      {/* --album-column is the knob masonry.tsx's grid reads (the seam its
          own comment describes); the tile-size cluster above sets it here, on
          the ancestor wrapping the grid, never on the grid component itself.

          --arrival-glow-ms rides the same box for the same reason (`first=live`):
          the number is ONE constant in lib/shared/arrival.ts, the grid holds
          an id for exactly that long, and the sheet that fades the light reads it
          from here — so the attribute and the animation can never disagree. */}
      <div
        data-section-swap
        className={cn(view === "album" ? "" : "hidden")}
        style={
          {
            "--album-column": `${tileSize}px`,
            "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          } as React.CSSProperties
        }
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

      {/* The empty album's Share door moved INTO the launch list, which is the
          empty room's subject now (`empty=list`): two doors to sharing, one
          under the other, was the shape his verdict replaced. */}
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

/** The guest album's own hybrid cadence, and for the same reasons. */
const FAST_POLL_MS = 12_000;
const SLOW_POLL_MS = 60_000;

/**
 * THE ALBUM, LIVE (Will, `first=live`, 2026-09-21: "It lands while she is
 * looking. The empty room gives way to the tile, the count moves, a Live pip.
 * The guest's doorbell, pointed here").
 *
 * It lives in this module because it is the album's own channel: what it watches
 * is what `EventGallery` renders, and the pip it draws is that album's state,
 * shown up in the header where a host is already reading the counts. The page
 * mounts it exactly once.
 *
 * ★ NOTHING HERE RUNS ON A TIMER EXCEPT THE CHEAP QUESTION. The hub page is
 * eleven queries plus three presigns per item, so refreshing it on a clock would
 * be the most expensive poll in the product and would spend most of its money
 * re-rendering an album nobody added to. Exactly two signals spend a refresh:
 * the Realtime doorbell rings, or `/api/events/<id>/live` answers with a
 * fingerprint that is not the one we hold. That route is one select, no
 * presigns, and a bodiless 304 when nothing moved.
 *
 * ★ THE TWO SIGNALS ARE NOT REDUNDANT, AND THAT IS WHY THE POLL SURVIVES BESIDE
 * THE SOCKET. The doorbell's DB trigger fires on the APPROVED-VISIBLE set
 * (`20260611220000_gallery_doorbell.sql`), so on an event held for approval a
 * guest's upload lands in Review and rings nobody. The host fingerprint carries
 * the pending count, so this poll is the only way the one person who can approve
 * it ever hears that it arrived.
 *
 * ★ `router.refresh()`, NOT A FETCH INTO STATE. The album, the count, the launch
 * list and the Review card are all server-rendered from one page, and their
 * presigned URLs are per-request. Re-running the RSC is the only way to move all
 * of them together and the only way the grid gets fresh signatures; React keeps
 * this island's state and the tiles' identity across it, which is exactly what
 * lets `HostMediaGrid` notice what is new by diffing its own items.
 *
 * ★ THE FIRST 200 ONLY SEEDS. The client mounts holding no validator, so the
 * first answer is always a full one; refreshing on it would mean every load of
 * the hub immediately re-rendered itself.
 */
export function EventLive({
  eventId,
  qrToken,
}: {
  eventId: string;
  /** The doorbell's public channel key: `gallery:<qr_token>`. */
  qrToken: string;
}) {
  const router = useRouter();
  const etagRef = useRef<string | null>(null);

  /** Ask the cheap question. Refresh the page only if the answer changed. */
  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/live`, {
        // `cache: "no-store"` rather than a cache-busting query string: the
        // conditional request IS the caching strategy here, and a rolling query
        // param would defeat the 304 the whole design depends on.
        cache: "no-store",
        headers: etagRef.current
          ? { "If-None-Match": etagRef.current }
          : undefined,
      });
      if (res.status === 304 || !res.ok) return;
      const body = (await res.json()) as { ok: boolean; etag?: string };
      if (!body.ok || !body.etag) return;
      const seeding = etagRef.current === null;
      etagRef.current = body.etag;
      if (!seeding) router.refresh();
    } catch {
      // Best-effort. A host watching an empty room must never be shown a
      // network blip; the next tick asks again.
    }
  }, [eventId, router]);

  // The doorbell: a contentless Realtime ping per visible-gallery change,
  // coalesced inside the hook (immediate refresh, bursts collapse into one
  // trailing refetch), so an Approve-all does not fire eleven page renders.
  const { live } = useGalleryDoorbell({
    qrToken,
    enabled: true,
    // The ping says the album moved. Take the new validator WITH the refresh, so
    // the poll that follows does not spend a second render on the same change.
    onRefresh: () => {
      void check();
      router.refresh();
    },
  });

  // The fallback question, paused while the tab is hidden: a 60s safety net
  // while the socket is up, the tighter 12s cadence when it is down. Asking on
  // the way back from hidden is what catches the party that happened while the
  // laptop was shut.
  useEffect(() => {
    const pollMs = live ? SLOW_POLL_MS : FAST_POLL_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => void check(), pollMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void check();
        start();
      }
    };
    void check();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check, live]);

  // Silent until the channel is actually subscribed: a pip that claims "Live"
  // while the socket is down is the one thing worse than no pip.
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
