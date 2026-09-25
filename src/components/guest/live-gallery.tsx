"use client";

/**
 * The LIVE gallery half of the guest page (the streaming split): the album's own VIEW. The live
 * STATE it draws (the server item list and its conditional-poll ETag, the optimistic upload tiles,
 * the doorbell/poll refresh machine, this device's own ids) lives one level up, in
 * `GalleryLiveProvider` (gallery-live.tsx), since the reel reads the same list: one live source for
 * album and reel. What stays here is what only the album draws: the two arrival marks, the pending
 * tiles at its head, the likes context, the View menu and the Yours filter, the delete
 * consequence, and the teaser CTA.
 *
 * Mounted under the page's provider (which carries key={access}, so an access flip re-seeds both
 * the album and the reel from the fresh promise). Standalone, with no provider above it (its test
 * file), it wraps itself in one built from its own props, so `galleryPromise` and the handle `ref`
 * work the same either way.
 */
import { useMemo, useState } from "react";
import type { CSSProperties, Ref } from "react";

import { Download } from "lucide-react";

import { setTileSizeAction } from "@/app/(guest)/e/[token]/actions";
import { ExportDialog } from "@/components/app/export/export-dialog";
import type { GridMedia } from "@/components/app/media-grid";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import {
  GalleryLiveProvider,
  useGalleryLive,
  type GalleryLive,
  type GalleryPayload as LiveGalleryPayload,
  type LiveGalleryHandle as LiveGalleryHandleType,
} from "@/components/guest/gallery-live";
import {
  GuestMasonry,
  type PendingTile,
} from "@/components/guest/guest-masonry";
import { yoursView } from "@/components/guest/yours-filter";
import { ViewMenu, type ViewMenuGroup } from "@/components/shared/view-menu";
import { formatCount } from "@/lib/format/count";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { LikesProvider } from "@/components/likes/likes-provider";
import { Button } from "@/components/ui/button";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import {
  ARRIVAL_GLOW_MS,
  ARRIVAL_SWEEP_MS,
  arrivalMarks,
  useArrivalMarks,
} from "@/lib/shared/arrival";
import { DeleteConsequence } from "@/lib/guest/delete-consequence";
import {
  DEFAULT_TILE_SIZE,
  TILE_SIZE_LABEL,
  TILE_SIZES,
  type TileSize,
} from "@/lib/shared/tile-size-cookie";
import { useTileSize } from "@/lib/shared/use-tile-size";
import { useMediaQuery } from "@/lib/use-media-query";

// The payload, the header's arithmetic and the handle live in the provider with the state they
// describe; named again here so every importer of this module keeps its one import.
export { albumCount } from "@/components/guest/gallery-live";
export type GalleryPayload = LiveGalleryPayload;
export type LiveGalleryHandle = LiveGalleryHandleType;

/**
 * THE GUEST ALBUM'S ONE VIEW MENU: the Yours filter joins the tile size in one
 * parent dropdown rather than adding more and more configs beside it. The host
 * gallery passes tile size, sort and filter (`event-gallery.tsx`); the guest
 * album passes tile size and Yours — `ViewMenu` itself already anticipated the
 * shape (its own head comment).
 *
 * Pure, and exported, so the two gates (disabled below 640, present only with
 * something of the guest's own on the album) are unit-testable without
 * standing up the whole live gallery — its fetches, its doorbell, its poll.
 *
 *   1. TILE SIZE IS RESERVED, NOT REMOVED, BELOW 640. `masonry.tsx`'s
 *      `PHONE_MAX` forces two columns under that width regardless of
 *      `--album-column`, so a live control there would silently do nothing —
 *      the group still renders (an honest vocabulary, `event-gallery.tsx`'s
 *      own Sort precedent) with every option disabled and the hint saying why.
 *   2. SHOWING JOINS ONLY WHEN THERE IS SOMETHING TO SHOW. An album the guest
 *      has added nothing to gets no second group at all — the same rule
 *      `yoursView` already enforces for the filter itself, read here off the
 *      same count so the two can never disagree.
 */
export function buildGuestViewGroups({
  tileSize,
  setTileSize,
  wideEnough,
  showingMine,
  setShowingMine,
  ownedCount,
}: {
  tileSize: TileSize;
  setTileSize: (size: TileSize) => void;
  /** `useMediaQuery("(min-width: 640px)")` — false on the server and until
   *  hydration measures the real viewport (the house hydration-safe default). */
  wideEnough: boolean;
  showingMine: boolean;
  setShowingMine: (mine: boolean) => void;
  /** How many of the WHOLE album are the guest's own (`yoursView`'s own
   *  count) — zero omits the group entirely rather than offering a filter
   *  with nothing behind it. */
  ownedCount: number;
}): ViewMenuGroup[] {
  const groups: ViewMenuGroup[] = [
    {
      id: "tile-size",
      label: "Tile size",
      value: String(tileSize),
      onChange: (v) => setTileSize(Number(v) as TileSize),
      options: TILE_SIZES.map((size) => ({
        value: String(size),
        label: TILE_SIZE_LABEL[size],
      })),
      disabled: !wideEnough,
      hint: wideEnough ? undefined : "Wider screens",
    },
  ];
  if (ownedCount > 0) {
    groups.push({
      id: "showing",
      label: "Showing",
      value: showingMine ? "mine" : "all",
      onChange: (v) => setShowingMine(v === "mine"),
      options: [
        { value: "all", label: "Everyone's" },
        { value: "mine", label: `Yours (${formatCount(ownedCount)})` },
      ],
    });
  }
  return groups;
}

type LiveGalleryProps = {
  ref?: Ref<LiveGalleryHandle>;
  /** The RSC's gallery load — resolved via use(), so this component suspends
   *  (the shell's <Suspense> shows GallerySkeleton) instead of blocking SSR.
   *  Read only when no provider is mounted above (standalone). */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** Re-opens the entry modal at its gate step (the teaser CTA's action). */
  onOpenGate: () => void;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onAccessDrift?: (next: { access: GalleryAccess; gate: string | null }) => void;
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /**
   * What this DEVICE has sent that is not in the album yet: everything still in
   * flight, plus anything a hold-for-approval event is keeping back (the shell
   * passes both; a refused file is not among them, because the failure sheet
   * lists it).
   */
  pendingUploads?: QueueItem[];
  /** Present only when the viewer can upload — the empty-state CTA opens the ADD
   *  SHEET (at 0 items the header drops its Add, the empty CTA owns it). */
  onAddFirst?: () => void;
  /** The event JOIN url for the lightbox Share button. */
  joinUrl?: string;
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
  /** Which remove path this viewer is on: the account's Server Function, or the
   *  anonymous session token's route. */
  isAuthed?: boolean;
  /** The anonymous guest's device-bound capability, from the browser's storage.
   *  Null before a join (nothing uploaded yet -> nothing of theirs to remove). */
  sessionToken?: string | null;
  /** Server-resolved from the `pr_tile_size` cookie (page.tsx, the host page's
   *  precedent) — never a client-only read, so the first paint is already the
   *  size a returning guest picked instead of a resize after hydration. */
  initialTileSize?: TileSize;
  /** The header's fallback total (see the provider's own note). */
  approvedTotal?: number;
  /**
   * A Require-an-upload-to-view album with uploads open: a guest's own removal no longer opens the
   * door, so removing their LAST upload closes the album until they add another. The lightbox's
   * confirm says so first.
   */
  closesOnLastRemoval?: boolean;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onOwnRemoved?: (removedId: string, remaining: number) => void;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onGuestCountChange?: (count: number) => void;
};

export function LiveGallery({ ref, ...props }: LiveGalleryProps) {
  const live = useGalleryLive();
  if (live) return <LiveGalleryView live={live} {...props} />;
  // STANDALONE (no provider above, as in its test file): the gallery brings its own, built from the
  // same props, so a caller that mounts it alone needs nothing else. The handle `ref` goes to the
  // provider, which owns what the handle does.
  return (
    <GalleryLiveProvider
      ref={ref}
      galleryPromise={props.galleryPromise}
      qrToken={props.qrToken}
      access={props.access}
      isDemo={props.isDemo}
      onAccessDrift={props.onAccessDrift}
      onCountChange={props.onCountChange}
      pendingUploads={props.pendingUploads}
      canDeleteIds={props.canDeleteIds}
      isAuthed={props.isAuthed}
      sessionToken={props.sessionToken}
      approvedTotal={props.approvedTotal}
      onOwnRemoved={props.onOwnRemoved}
      onGuestCountChange={props.onGuestCountChange}
    >
      <StandaloneView {...props} />
    </GalleryLiveProvider>
  );
}

/** The standalone arm's child: reads the provider it was just given. */
function StandaloneView(props: Omit<LiveGalleryProps, "ref">) {
  const live = useGalleryLive();
  if (!live) return null;
  return <LiveGalleryView live={live} {...props} />;
}

function LiveGalleryView({
  live,
  access,
  isDemo,
  onOpenGate,
  onAddFirst,
  joinUrl,
  initialTileSize,
  closesOnLastRemoval = false,
}: Omit<LiveGalleryProps, "ref"> & { live: GalleryLive }) {
  const {
    qrToken,
    items,
    serverIds,
    count,
    arrivals,
    ownLandings,
    ownIds,
    liveOwnCount,
    canRemove,
    removeOwn,
    pendingUploads,
    pendingUrls,
  } = live;

  // What the lightbox's delete confirm adds on such an album, for the one item
  // whose removal closes it (the context's own note in media-lightbox.tsx).
  const deleteConsequence = useMemo(
    () =>
      closesOnLastRemoval
        ? (item: GridMedia) =>
            ownIds.has(item.id) && liveOwnCount(null) === 1
              ? "This is your last upload here, so the album closes until you add another."
              : null
        : null,
    [closesOnLastRemoval, ownIds, liveOwnCount],
  );

  // THE TWO MARKS, from the two lists. Memoized because `useArrivalMarks` keys
  // its work off the array it is handed: a fresh one every render would ask it
  // to re-diff the whole session's arrivals on every like and every poll.
  const marks = useMemo(
    () => arrivalMarks({ arrivals, ownLandings }),
    [arrivals, ownLandings],
  );
  const landedList = useMemo(
    () => (marks.landed ? [marks.landed] : []),
    [marks.landed],
  );
  // The glow holds PER ID (overlapping arrivals each get a full life); the
  // sweep is EXCLUSIVE, so a batch landing faster than the light runs never
  // stacks it up the gallery.
  const arrivedIds = useArrivalMarks(marks.arrived, ARRIVAL_GLOW_MS);
  const landedIds = useArrivalMarks(landedList, ARRIVAL_SWEEP_MS, true);

  /* ────────────────────────────────────────────────────────────────────────
     WHAT THIS DEVICE DRAWS AT THE ALBUM'S HEAD, and the three things it does
     NOT.

     · A FAILURE draws nothing at all: the run's end opens a sheet listing
       every refusal with its own Retry, so a perfectly good photograph is
       never labelled broken in somebody's album.
     · AN APPROVED completion draws nothing either — it IS the album by then,
       through the optimistic prepend above.
     · A HELD one draws a waiting tile until the host approves it, which is
       the moment its media id turns up in the poll's own list. That is the one
       comparison `QueueItem.mediaId` exists for; without it the waiting tile
       would sit beside the real photograph it became.
     ──────────────────────────────────────────────────────────────────────── */
  const pendingTiles: PendingTile[] = pendingUploads.flatMap((q) => {
    const url = pendingUrls.get(q.id);
    if (!url || q.status === "error") return [];
    const held = q.status === "done" && q.mediaStatus === "pending";
    if (q.status === "done" && !held) return [];
    if (held && q.mediaId && serverIds.has(q.mediaId)) return [];
    return [
      {
        queueId: q.id,
        url,
        file: q.file,
        kind: q.kind,
        status: held
          ? ("held" as const)
          : q.status === "queued"
            ? ("queued" as const)
            : ("uploading" as const),
        progress: q.progress,
      },
    ];
  });

  // The header's number is the provider's (`albumCount`, gallery-live.tsx); the CTA below says the
  // same one, so the header, the CTA and the door never read an album three ways.
  const rawCount = items.length;

  // THE YOURS FILTER, which the mark on a guest's own tiles toggles. The intent
  // is this tab's alone (a filter is a way of looking, not a setting — the
  // per-device gallery-controls preference stores what a HOST chooses, and a
  // guest's album has no such row), and `yoursView` refuses to keep it live
  // once the guest owns nothing here.
  const [showMine, setShowMine] = useState(false);
  const yours = yoursView(items, ownIds, showMine);

  // THE ONE VIEW MENU. Server-resolved so the first paint is already the size
  // a returning guest picked (never a client-only cookie read) — the persisted
  // write rides the guest page's own Server Action, `setTileSizeAction` (the
  // host's `setTileSizeAction` precedent).
  const { size: tileSize, setTileSize } = useTileSize(
    initialTileSize ?? DEFAULT_TILE_SIZE,
    setTileSizeAction,
  );
  // `masonry.tsx`'s PHONE_MAX: below 640 the grid is always two columns and
  // --album-column has nothing to do, so the control says so rather than
  // pretending to work.
  const wideEnough = useMediaQuery("(min-width: 640px)");
  // Not wrapped in useMemo: `yours` is a fresh object every render (yoursView
  // is plain arithmetic, never memoized itself), so a manual dependency array
  // narrowed to its two fields is exactly the shape the React Compiler cannot
  // verify against — the array's own build is cheap enough that the compiler's
  // own pass is left to memoize the JSX that reads it.
  const viewGroups = buildGuestViewGroups({
    tileSize,
    setTileSize,
    wideEnough,
    showingMine: yours.on,
    setShowingMine: setShowMine,
    ownedCount: yours.count,
  });

  return (
    <section
      className="mt-3"
      // Each mark's life, written once where every tile inherits it, so the
      // sheet's keyframes and the state that holds `data-arrived` / `data-landed`
      // are ONE pair of numbers (lib/shared/arrival.ts) and cannot drift apart.
      style={
        {
          "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
        } as CSSProperties
      }
    >
      {items.length > 0 || pendingTiles.length > 0 ? (
        // Likes: anonymous guests get the like button -> the create-account flow;
        // signed-in guests toggle in place. Counts stay host-only.
        <LikesProvider mediaIds={items.map((m) => m.id)}>
          {/* THE ALBUM'S OWN COUNT: the reel tile shows no number of moments, so the album beneath
              carries a subtle label with its total number of items. It is the header's
              number, `count` (albumCount over the payload's approvedTotal), worded with the header's
              and the CTA's always-both-nouns rule, so the page never counts one album two ways; the
              demo shows it too (its tiles are the demo's album).

              Beside it, a subtle gallery-level "Download all" (the album doubles as the shareable copy)
              and the ONE View menu (one menu rather than a spread of configs). Both hidden in demo
              mode (simulated tiles aren't real downloads; there is no cookie to persist) + on a
              locked gallery. The download modal's summary re-derives the real downloadable set
              server-side (a teaser downloads exactly its visible set). */}
          {access !== "none" && items.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {formatCount(count)} {count === 1 ? "photo" : "photos"}
                {" & videos"}
              </p>
              {!isDemo && (
                <div className="ml-auto flex items-center gap-1.5">
                  <ExportDialog scope="guest" albumKey={qrToken}>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98]"
                    >
                      <Download className="size-4" /> Download all
                    </button>
                  </ExportDialog>
                  <ViewMenu groups={viewGroups} />
                </div>
              )}
            </div>
          )}
          {/* THE YOURS LINE, for the filter the mark on a guest's own tiles
              toggles. A LINE and not a chip, so the album does not keep adding
              more and more configs. It appears only while the filter is live, so
              an album a guest has added nothing to carries no extra chrome at
              all, and it is the filter's only exit besides tapping a mark again.
              Yours also joins tile size inside the one View menu above, and this
              line stays as the state's own receipt. */}
          {yours.on && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing yours
                <span className="ml-1.5 text-faint tabular-nums">
                  {formatCount(yours.count)}
                </span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <button
                type="button"
                onClick={() => setShowMine(false)}
                className="rounded-md font-medium underline-offset-4 transition-colors hover:underline active:scale-[0.98] motion-reduce:active:scale-100"
              >
                Show all
              </button>
            </div>
          )}
          {/* --album-column is the knob masonry.tsx's grid reads (the seam its own
              comment describes); the View menu's Tile size group sets it here, on
              the ancestor wrapping the grid, never on the grid component itself —
              exactly as event-gallery.tsx does for the host. */}
          <div style={{ "--album-column": `${tileSize}px` } as CSSProperties}>
            <DeleteConsequence.Provider value={deleteConsequence}>
            <GuestMasonry
              items={yours.items}
              pending={pendingTiles}
              shareUrl={joinUrl}
              // The two arrival marks on the tile box — the light is
              // shared/arrival.css, the growth the tile's own mount entrance.
              arrivedIds={arrivedIds}
              landedIds={landedIds}
              // A guest removes THEIR OWN photograph and no other: `canDelete`
              // gates the lightbox's Trash per item, so a tile that is not theirs
              // never shows the control. Both are omitted where the feature does
              // not apply (the demo, a locked gallery) rather than being passed
              // with an empty set, so nothing downstream has to know about it.
              canDelete={canRemove ? (item) => ownIds.has(item.id) : undefined}
              onDeleteItem={
                canRemove ? (id) => void removeOwn(id) : undefined
              }
              // THE FOURTH MARK, and what its tap does. Same gate as Remove: the
              // set is the server's answer about this viewer's own uploads, on
              // either identity, so a surface with no removal has no marks either.
              mineIds={canRemove && ownIds.size > 0 ? ownIds : undefined}
              onSelectMine={() => setShowMine((on) => !on)}
              mineSelected={yours.on}
            />
            </DeleteConsequence.Provider>
          </div>
        </LikesProvider>
      ) : (
        // The photographic-promise empty state (full/teaser with nothing yet).
        // The CTA only appears when uploads are possible (onAddFirst present);
        // a teaser viewer's CTA below owns the account path instead.
        //
        // ★ IT KEEPS THE READING COLUMN while the album around it runs to the
        // window. The promise is a SQUARE river that takes its width from its
        // box, so at 1512 the box it must not have is the album's: a 1472 px
        // square of ghosted photographs is a page of nothing, four screens
        // tall. An album with no photographs in it has nothing to spread, so the
        // promise stays the width of the words it sits under and the window
        // opens up only once there is something to put in it. Pulled out by the
        // album's gutter (12 px on a phone, 20 above) and padded back in by the
        // words' 20, so this is the page's reading column to the pixel rather
        // than wider than the words it sits under.
        <div className="-mx-3 max-w-2xl px-5 sm:-mx-5">
          <GalleryEmptyState
            onAddFirst={access === "full" ? onAddFirst : undefined}
          />
        </div>
      )}
      {access === "teaser" && (
        // The teaser boundary CTA: re-opens the entry modal to the account step
        // (the soft paywall). ★ Its fallback line asks for a confirmed email,
        // not an account: an account is not what the host asked for, a
        // confirmed email is, and that is what the door behind this button
        // actually does. ★ ITS NUMBER AND NOUN MATCH THE HEADER: `count` is the
        // same true total the header reads (videos counted in with the photos),
        // worded with the header's own always-both-nouns rule rather than a new,
        // unproven-for-this-album conditional one.
        <div className="mt-5 flex justify-center">
          <Button onClick={onOpenGate} className="active:scale-[0.99]">
            {count > rawCount
              ? `See all ${formatCount(count)} ${count === 1 ? "photo" : "photos"} & videos`
              : "Confirm your email to see everything"}
          </Button>
        </div>
      )}
    </section>
  );
}
