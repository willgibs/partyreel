"use client";

/**
 * The LIVE gallery half of the guest page (the streaming split): the album's own VIEW. The live
 * STATE it draws (the manifest and its links, the optimistic upload tiles, the doorbell and the
 * delta poll, this device's own ids) lives one level up, in `GalleryLiveProvider` (gallery-live.tsx),
 * since the reel reads the same album: one live source for album and reel. What stays here is what
 * only the album draws: the two arrival marks, the upload tiles at its head, the hearts, the View
 * menu (Size, Sort and Filter: `gallery-view.ts`), the delete consequence, and the teaser CTA.
 *
 * ★ THE ALBUM'S ORDER AND HER LENS ARE PRESENTATION (album-order): the live source keeps its newest-first
 * list, and this view turns it into the night's order (`order`, the page's: the turn or her choice) and
 * looks through her filter, the rows laid from the end the order grows at. A full album only: a
 * teaser's nine stay newest first.
 *
 * ★ THE ALBUM IS THE JUSTIFIED ROWS, WINDOWED (`gallery-rows.tsx`): every photograph is laid out
 * from the manifest, only the rows around the viewport are mounted, and the window's ids are what
 * this view asks the provider for links for and the hearts are seeded for (`onWindowChange`), so a
 * 6,000-photograph album costs a screen's worth of links, hearts and nodes.
 *
 * Mounted under the page's provider (which carries key={access}, so an access flip re-seeds both
 * the album and the reel). Standalone, with no provider above it (its test file), it wraps itself
 * in one built from its own props, so `galleryPromise` and the handle `ref` work the same either way.
 *
 * ★ SELECT, THEN SAVE (take-home r1, `guest=select`, Will's note: "the slight friction could reduce our resource
 * expenditure massively if less guests grab everything just because it's an easy 1-click, once they're selecting
 * they may as well get exactly what they want"): Select takes Download all's place in the album's own row. In
 * select mode a bar stands at the top of the screen (Cancel, what she has picked, Yours and All), every tile is a
 * check, and the foot's shutter turns to Save (`guest-action-dock.tsx`); what Save does is `live-gallery-save.tsx`,
 * and the mode itself one store both read (`live-gallery-select.ts`).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { CSSProperties, Ref } from "react";

import { ListChecks } from "lucide-react";

import { setRowStepAction } from "@/app/(guest)/e/[token]/actions";
import type { GridMedia } from "@/components/app/media-grid";
import { AlbumFailedCard } from "@/components/guest/album-boundary";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import {
  AlbumDevelop,
  type AlbumDevelopProps,
} from "@/components/guest/gallery-empty-state-wait";
import { GallerySkeleton } from "@/components/guest/gallery-skeleton";
import {
  GalleryLiveProvider,
  useGalleryLive,
  type GalleryLive,
  type GalleryPayload as LiveGalleryPayload,
  type LiveGalleryHandle as LiveGalleryHandleType,
} from "@/components/guest/gallery-live";
import type { GuestAlbumOrderState } from "@/components/guest/gallery-order";
import { GalleryRows, type PendingTile } from "@/components/guest/gallery-rows";
import {
  buildGuestViewGroups,
  LENS_WORDS,
} from "@/components/guest/gallery-view";
import { GuestSaveChoice } from "@/components/guest/live-gallery-save";
import {
  guestSelect,
  useGuestSelect,
} from "@/components/guest/live-gallery-select";
import { rememberAlbumWidth } from "@/components/shared/album-window-plan";
import { ViewMenu } from "@/components/shared/view-menu";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { lensAlbum, type AlbumFilter } from "@/lib/shared/album-order";
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
import { DEFAULT_ROW_STEP, type RowStep } from "@/lib/shared/album-rows";
import { useRowStep } from "@/lib/shared/use-tile-size";

// The payload, the header's arithmetic and the handle live in the provider with the state they
// describe, and the View menu's groups in `gallery-view.ts`; named again here so every importer of
// this module keeps its one import.
export { albumCount } from "@/components/guest/gallery-live";
export { buildGuestViewGroups } from "@/components/guest/gallery-view";
export type GalleryPayload = LiveGalleryPayload;
export type LiveGalleryHandle = LiveGalleryHandleType;

/** The guest album's own path, which its remembered width is scoped to (`rememberAlbumWidth`). */
const ALBUM_WIDTH_PATH = "/e";

type LiveGalleryProps = {
  ref?: Ref<LiveGalleryHandle>;
  /** The page's seed — resolved via use(), so this suspends behind the page's <Suspense>.
   *  Read only when no provider is mounted above (standalone). */
  galleryPromise: Promise<GalleryPayload>;
  qrToken: string;
  access: GalleryAccess;
  isDemo: boolean;
  /** Re-opens the entry modal at its gate step (the teaser CTA's action). */
  onOpenGate: () => void;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onAccessDrift?: (next: {
    access: GalleryAccess;
    gate: string | null;
  }) => void;
  /** Keeps the shell header's live media count current (incl. optimistic tiles). */
  onCountChange?: (count: number) => void;
  /**
   * What this DEVICE has sent that is not in the album yet: everything still in flight, plus
   * anything a hold-for-approval event is keeping back (a refused file is not among them). Only
   * what is in flight draws at the head; a held one lives in her uploads (`upload-tracker.tsx`).
   */
  pendingUploads?: QueueItem[];
  /**
   * What this viewer adds waits (the page's `addsWaitFor`: for the host's approval, or for a develop time ahead), so
   * nothing of hers in the air draws at the head either: it lives in her uploads from the press (red-team 44).
   */
  addsWait?: boolean;
  /** Present only when the viewer can upload — the empty state's CTA opens the ADD SHEET. */
  onAddFirst?: () => void;
  /** The event JOIN url for the viewer's Share button. */
  joinUrl?: string;
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  isOwner?: boolean;
  /** Which remove path this viewer is on. */
  isAuthed?: boolean;
  /** The anonymous guest's device-bound capability (null before a join). */
  sessionToken?: string | null;
  /** Server-resolved from the shared `pr_tile_size` cookie (`resolveRowStep`), so the first paint is
   *  already the step a returning guest picked, never a re-lay after hydration. */
  initialRowStep?: RowStep;
  /** The width this album last laid its rows at (the page's `pr_album_w` cookie; null cold). */
  firstPaintWidth?: number | null;
  /** The visit's seed for the rhythm's picks (the page draws one per visit). */
  rhythmSeed?: number;
  /** The header's fallback total (see the provider's own note). */
  approvedTotal?: number;
  /**
   * A Require-an-upload-to-view album with uploads open: removing their LAST upload closes the album
   * until they add another. The viewer's confirm says so first.
   */
  closesOnLastRemoval?: boolean;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onOwnRemoved?: (removedId: string, remaining: number) => void;
  /** The provider's (see gallery-live.tsx); passed through when standalone. */
  onGuestCountChange?: (count: number) => void;
  /**
   * The page's word for the album's develop (the-wait r2, `arrival=in-place`): drawn beside the rows, in the album's
   * box, where it reads this live source. Absent where the album never develops here (the Library, a test).
   */
  develop?: AlbumDevelopProps;
  /**
   * The album's order as the page holds it (`useGuestAlbumOrder`: the turn, or her choice) and her way to choose one
   * (View's Sort). Absent (a standalone album), it runs newest first and offers no Sort.
   */
  order?: GuestAlbumOrderState;
};

export function LiveGallery({ ref, ...props }: LiveGalleryProps) {
  const live = useGalleryLive();
  if (live) return <LiveGalleryView live={live} {...props} />;
  // STANDALONE (no provider above, as in its test file): the gallery brings its own, built from the
  // same props, so a caller that mounts it alone needs nothing else.
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
      isOwner={props.isOwner}
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
  initialRowStep,
  firstPaintWidth = null,
  rhythmSeed = 0,
  closesOnLastRemoval = false,
  addsWait = false,
  develop,
  order,
}: Omit<LiveGalleryProps, "ref"> & { live: GalleryLive }) {
  const {
    qrToken,
    items,
    count,
    arrivals,
    ownLandings,
    ownIds,
    liveOwnCount,
    canRemove,
    removeOwn,
    pendingUploads,
    pendingUrls,
    uploadProgress,
    ensureLinks,
    countWords,
  } = live;

  // What the viewer's delete confirm adds on such an album, for the one item whose removal closes it
  // (the context's own note in media-lightbox.tsx).
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

  // THE TWO MARKS, from the two lists. Memoized because `useArrivalMarks` keys its work off the
  // array it is handed.
  const marks = useMemo(
    () => arrivalMarks({ arrivals, ownLandings }),
    [arrivals, ownLandings],
  );
  const landedList = useMemo(
    () => (marks.landed ? [marks.landed] : []),
    [marks.landed],
  );
  // The sweep is EXCLUSIVE (only the newest own landing). The glow is the rows' own (`GalleryRows`, given
  // the arrivals): each arrival is held out of the rows until its photograph is decoded, so its light is
  // lit when it lands, per id (overlapping arrivals each get a full life), never at the delta.
  const landedIds = useArrivalMarks(landedList, ARRIVAL_SWEEP_MS, true);

  /* ────────────────────────────────────────────────────────────────────────
     WHAT THIS DEVICE DRAWS AT THE ALBUM'S HEAD: the files still in the air,
     as one stack, and the three things it does NOT draw. A FAILURE draws
     nothing (the run's end opens a sheet listing every refusal with its own
     Retry); an APPROVED completion draws nothing either (it IS the album by
     then, through the optimistic tile); and ★ a HELD one draws nothing
     (`voice-guest` r2, Will's `held=uploads`: "not a fan of adding notices
     within the media cards"): it shows only in her uploads, the badge beside
     the Add she just pressed counting it, until the host lets it in and the
     manifest brings it as any other photograph.
     ★ AND WHERE WHAT SHE ADDS WAITS, NOTHING IN THE AIR DRAWS EITHER (red-team
     44's MEDIUM): the stack stood in the album from the press until the file
     landed held or sealed and vanished (a video for its whole upload), a tile
     in the album for her alone. Hers is her tracker's from the press there
     (sending, then waiting), and the album draws only what is in it; an album
     that shows what is added at once keeps the stack.
     ──────────────────────────────────────────────────────────────────────── */
  const pendingTiles: PendingTile[] = pendingUploads.flatMap((q) => {
    const url = pendingUrls.get(q.id);
    if (addsWait || !url) return [];
    if (q.status !== "queued" && q.status !== "uploading") return [];
    return [
      {
        queueId: q.id,
        url,
        file: q.file,
        kind: q.kind,
        status: q.status,
        progress: q.progress,
      },
    ];
  });

  // The header's number is the provider's (`albumCount`); the CTA below says the same one.
  const rawCount = items.length;

  // HER LENS (`mine=none`: View's Filter is its one door, no mark on the tiles): Photos, Videos or Yours,
  // over the WHOLE album (the manifest: `lensAlbum`'s own note), live only with something to show. The
  // intent is this visit's alone (album-order's Q4). THE ORDER is the page's (the turn, or hers): the night
  // in order turns the list (`inOrder`, by when each happened) and lays the rows from their start.
  const [lensIntent, setLensIntent] = useState<AlbumFilter>("all");
  const lens = useMemo(
    () => lensAlbum(items, ownIds, lensIntent),
    [items, ownIds, lensIntent],
  );
  const sort = access === "full" ? (order?.sort ?? "newest") : "newest";
  const turn = live.inOrder;
  const shown = useMemo(
    () =>
      sort === "oldest"
        ? (turn?.(lens.items) ?? lens.items.slice().reverse())
        : lens.items,
    [sort, lens.items, turn],
  );

  // THE DENSITY STEP: server-resolved so the first paint is already the step a returning guest
  // picked; the write rides the page's own Server Action on the one shared cookie.
  const { step, setRowStep } = useRowStep(
    initialRowStep ?? DEFAULT_ROW_STEP,
    setRowStepAction,
  );
  // The width the rows are laid at: the steps' words, and the next visit's exact first paint.
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const onBoxWidth = useCallback((width: number) => {
    setBoxWidth(width);
    rememberAlbumWidth(width, ALBUM_WIDTH_PATH);
  }, []);

  // THE WINDOW'S IDS: what the rows mount is what gets links and hearts. The viewer's own asks join
  // the hearts' set, so a photograph walked to far from the window still paints its heart.
  const [windowIds, setWindowIds] = useState<readonly string[]>([]);
  const [viewerIds, setViewerIds] = useState<readonly string[]>([]);
  const onWindowChange = useCallback(
    (ids: readonly string[]) => {
      setWindowIds(ids);
      ensureLinks(ids);
    },
    [ensureLinks],
  );
  const onViewerNeedLinks = useCallback(
    (ids: readonly string[]) => {
      setViewerIds(ids);
      ensureLinks(ids);
    },
    [ensureLinks],
  );
  const likeIds = useMemo(() => {
    if (viewerIds.length === 0) return windowIds as string[];
    const all = new Set(windowIds);
    for (const id of viewerIds) all.add(id);
    return [...all];
  }, [windowIds, viewerIds]);

  const viewGroups = buildGuestViewGroups({
    step,
    setStep: setRowStep,
    boxWidth,
    sort,
    setSort: access === "full" ? order?.choose : undefined,
    filter: lens.filter,
    setFilter: setLensIntent,
    kinds: lens.kinds,
    ownedCount: lens.owned,
  });

  // SELECT MODE (take-home r1): her picks as the tiles read them, and the album's own way out of it.
  const select = useGuestSelect();
  const picked = useMemo(() => new Set(select.picks), [select.picks]);
  const selection = useMemo(
    () =>
      select.active
        ? { selected: picked, onToggle: (id: string) => guestSelect.toggle(id) }
        : undefined,
    [select.active, picked],
  );
  useEffect(() => {
    if (!select.active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && guestSelect.get().run.kind === "idle") {
        guestSelect.exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select.active]);
  // An album that goes leaves no select mode behind it.
  useEffect(() => () => guestSelect.exit(), []);

  // ★ AN ALBUM ITS SOURCE COULD NOT READ (crumbs-30; the provider's note on a seed that failed): the
  // skeleton the page's Suspense draws, while the source's own first read is in flight, so a read that
  // heals at once never flashes a failure; then the album boundary's own card, in the reading column
  // the empty album keeps, with Try again. Nothing of the album is drawn meanwhile, her own new
  // photograph included: it shows with the album, as it did while the boundary held the failure.
  // ★ THE DEVELOP (the-wait r2, `arrival=in-place`): the contact sheet over these rows' top, developing into them on the
  // first open after the roll develops; nothing at all on every other open. An album still being read, or one that could
  // not be, draws it too, so a hold the page's gate took before the first paint is let go there at once.
  const developStage = develop ? (
    <AlbumDevelop live={live} {...develop} />
  ) : null;
  if (live.albumRead === "trying")
    return (
      <>
        <GallerySkeleton step={step} />
        {developStage}
      </>
    );
  if (live.albumRead === "failed")
    return (
      <>
        <AlbumUnread retry={live.retryAlbum} />
        {developStage}
      </>
    );

  return (
    <>
      <section
        className="mt-3"
        // Each mark's life, written once where every tile inherits it, so the sheet's keyframes and
        // the state that holds `data-arrived` / `data-landed` are ONE pair of numbers.
        style={
          {
            "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
            "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
          } as CSSProperties
        }
        // The rows a develop holds and raises (the-wait r2), beside its sheet in the album's box.
        data-develop-rows=""
      >
        {items.length > 0 || pendingTiles.length > 0 ? (
          // Likes: anonymous guests get the like button -> the create-account flow; signed-in guests
          // toggle in place; the hearts are seeded for the window (and the viewer's reach) alone.
          <LikesProvider mediaIds={likeIds as string[]}>
            {/* THE ALBUM'S OWN COUNT, beside a quiet Select and the ONE View menu (both hidden
              in the demo and on a locked gallery). The count is the header's number, worded as the source
              words it (`albumCountWords`): by what the album holds, both nouns only where it cannot see in. */}
            {access !== "none" &&
            items.length > 0 &&
            select.active &&
            !isDemo ? (
              <SelectBar
                picks={select.picks}
                items={shown}
                ownIds={ownIds}
                qrToken={qrToken}
              />
            ) : access !== "none" && items.length > 0 ? (
              // The develop raises this row with the album's first rows (`data-develop-head`, the-wait r2).
              <div
                className="mb-3 flex flex-wrap items-center justify-between gap-1.5"
                data-develop-head=""
              >
                <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                  {countWords ?? formatMediaCount(count)}
                </p>
                {!isDemo && (
                  <div className="ml-auto flex items-center gap-1.5">
                    {/* SELECT, where Download all stood (take-home r1): her way to take photos home. */}
                    <button
                      type="button"
                      data-guest-select=""
                      onClick={() => guestSelect.enter()}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-save active:scale-[0.98] motion-reduce:active:scale-100"
                    >
                      <ListChecks className="size-4" /> Select
                    </button>
                    <ViewMenu groups={viewGroups} />
                  </div>
                )}
              </div>
            ) : null}
            {/* THE LENS'S LINE, for the View-menu filter (`mine=none`): a line and not a chip, only
              while a lens is live, and its only exit. */}
            {lens.filter !== "all" && (
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {LENS_WORDS[lens.filter]}
                  <span className="ml-1.5 text-faint tabular-nums">
                    {formatCount(lens.count)}
                  </span>
                </span>
                <span aria-hidden className="text-faint">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => setLensIntent("all")}
                  className="rounded-md font-medium underline-offset-4 transition-colors hover:underline active:scale-[0.98] motion-reduce:active:scale-100"
                >
                  Show all
                </button>
              </div>
            )}
            <DeleteConsequence.Provider value={deleteConsequence}>
              <GalleryRows
                items={shown}
                anchor={sort === "oldest" ? "start" : "end"}
                lens={lens.filter}
                pending={pendingTiles}
                progress={uploadProgress}
                step={step}
                onStepChange={setRowStep}
                seed={rhythmSeed}
                firstPaintWidth={firstPaintWidth}
                onBoxWidth={onBoxWidth}
                onWindowChange={onWindowChange}
                onViewerNeedLinks={onViewerNeedLinks}
                shareUrl={joinUrl}
                // The two arrival marks on the tile box — the light is shared/arrival.css: the glow of what
                // arrived by itself (held at the door until it can land complete, `use-arrival-gate.ts`, and
                // its links asked for there) and the sweep of this device's own landing.
                arrivals={marks.arrived}
                onNeedLinks={ensureLinks}
                landedIds={landedIds}
                // A guest removes THEIR OWN photograph and no other: omitted where the feature does not
                // apply (the demo, a locked gallery) rather than passed with an empty set.
                canDelete={
                  canRemove ? (item) => ownIds.has(item.id) : undefined
                }
                onDeleteItem={
                  canRemove ? (id) => void removeOwn(id) : undefined
                }
                selection={selection}
              />
            </DeleteConsequence.Provider>
          </LikesProvider>
        ) : (
          // The photographic-promise empty state (full/teaser with nothing yet). ★ IT KEEPS THE READING
          // COLUMN while the album around it runs to the window: a square river as wide as the album
          // would be a page of nothing. Pulled out by the album's gutter and padded back in by the
          // words' 20, so it is the page's reading column to the pixel.
          <div className="-mx-3 max-w-2xl px-5 sm:-mx-5">
            <GalleryEmptyState
              onAddFirst={access === "full" ? onAddFirst : undefined}
            />
          </div>
        )}
        {access === "teaser" && (
          // The teaser boundary CTA: re-opens the entry modal to its gate step. ★ ITS NUMBER AND NOUN
          // MATCH THE HEADER: `count` is the same true total the header reads.
          <div className="mt-5 flex justify-center">
            <Button onClick={onOpenGate} className="active:scale-[0.99]">
              {count > rawCount
                ? `See all ${formatMediaCount(count)}`
                : "Confirm your email to see everything"}
            </Button>
          </div>
        )}
      </section>
      {developStage}
    </>
  );
}

/**
 * The album its source could not read: the album boundary's own card (one wording for the album that did not load),
 * in the reading column the empty album keeps (pulled out by the album's gutter, padded back in by the words'), and
 * its Try again the source's own read, which says it is trying until that read is over.
 */
function AlbumUnread({ retry }: { retry: () => Promise<void> }) {
  const [retrying, startRetry] = useTransition();
  return (
    <div className="-mx-3 max-w-2xl px-5 sm:-mx-5">
      <AlbumFailedCard retrying={retrying} onRetry={() => startRetry(retry)} />
    </div>
  );
}

/**
 * SELECT MODE'S BAR (take-home r1, the board's own): the album's row turned over to her selection and stuck to the
 * screen's top while she scrolls, so what she has and how to leave are always in view. Cancel where a phone keeps
 * it, what she has picked in the middle (her newest three as pictures before a number, bible 6), and the two
 * shortcuts: Yours, every photograph of hers, and All. Each is a toggle: pressed again, it lets its set go.
 */
function SelectBar({
  picks,
  items,
  ownIds,
  qrToken,
}: {
  picks: readonly string[];
  /** What the album shows (Showing: Everyone's, or hers). */
  items: readonly GridMedia[];
  ownIds: ReadonlySet<string>;
  qrToken: string;
}) {
  const picked = new Set(picks);
  const byId = new Map(items.map((i) => [i.id, i]));
  const mine = items.filter((i) => ownIds.has(i.id)).map((i) => i.id);
  const all = items.map((i) => i.id);
  const allPicked = all.length > 0 && all.every((id) => picked.has(id));
  const minePicked = mine.length > 0 && mine.every((id) => picked.has(id));
  // Her newest picks that have a picture to show (a link lands with its window).
  const faces = [...picks]
    .reverse()
    .map((id) => byId.get(id))
    .filter((i): i is GridMedia => !!i && !!(i.previewUrl || i.url))
    .slice(0, 3)
    .reverse();
  return (
    <>
      <div
        data-select-bar=""
        className="sticky top-0 z-30 -mx-3 mb-3 flex h-12 items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur-md sm:-mx-5 sm:px-5"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-1.5 text-sm"
          onClick={() => guestSelect.exit()}
        >
          Cancel
        </Button>
        <span className="flex min-w-0 items-center gap-2" aria-live="polite">
          {faces.length > 0 && (
            <span aria-hidden className="flex">
              {faces.map((item, k) => (
                // eslint-disable-next-line @next/next/no-img-element -- a presigned tile, never next/image (media-cost-policy)
                <img
                  key={item.id}
                  src={item.previewUrl ?? item.url}
                  alt=""
                  draggable={false}
                  className="size-6 rounded-[5px] object-cover ring-2 ring-background"
                  style={{ marginLeft: k === 0 ? 0 : -8 }}
                />
              ))}
            </span>
          )}
          <span className="truncate text-sm font-semibold tabular-nums">
            {picks.length === 0
              ? "Select photos"
              : `${formatCount(picks.length)} selected`}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          {mine.length > 0 && (
            <Button
              type="button"
              variant={minePicked ? "default" : "secondary"}
              size="sm"
              aria-pressed={minePicked}
              className="rounded-full px-3 text-sm"
              onClick={() =>
                minePicked ? guestSelect.unpick(mine) : guestSelect.pick(mine)
              }
            >
              Yours
            </Button>
          )}
          <Button
            type="button"
            variant={allPicked ? "default" : "secondary"}
            size="sm"
            aria-pressed={allPicked}
            className="rounded-full px-3 text-sm"
            onClick={() =>
              allPicked ? guestSelect.unpick(all) : guestSelect.pick(all)
            }
          >
            All
          </Button>
        </span>
      </div>
      <GuestSaveChoice qrToken={qrToken} items={items} />
    </>
  );
}
