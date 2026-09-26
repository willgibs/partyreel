"use client";

/**
 * The LIVE gallery half of the guest page (the streaming split): the album's own VIEW. The live
 * STATE it draws (the manifest and its links, the optimistic upload tiles, the doorbell and the
 * delta poll, this device's own ids) lives one level up, in `GalleryLiveProvider` (gallery-live.tsx),
 * since the reel reads the same album: one live source for album and reel. What stays here is what
 * only the album draws: the two arrival marks, the upload tiles at its head, the hearts, the View
 * menu (the density slider and Yours), the delete consequence, and the teaser CTA.
 *
 * ★ THE ALBUM IS THE JUSTIFIED ROWS, WINDOWED (`gallery-rows.tsx`): every photograph is laid out
 * from the manifest, only the rows around the viewport are mounted, and the window's ids are what
 * this view asks the provider for links for and the hearts are seeded for (`onWindowChange`), so a
 * 6,000-photograph album costs a screen's worth of links, hearts and nodes.
 *
 * Mounted under the page's provider (which carries key={access}, so an access flip re-seeds both
 * the album and the reel). Standalone, with no provider above it (its test file), it wraps itself
 * in one built from its own props, so `galleryPromise` and the handle `ref` work the same either way.
 */
import { useCallback, useMemo, useState } from "react";
import type { CSSProperties, Ref } from "react";

import { Download } from "lucide-react";

import { setRowStepAction } from "@/app/(guest)/e/[token]/actions";
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
import { GalleryRows, type PendingTile } from "@/components/guest/gallery-rows";
import { rememberAlbumWidth } from "@/components/shared/album-window-plan";
import {
  ViewMenu,
  type ViewMenuDensityGroup,
  type ViewMenuGroup,
} from "@/components/shared/view-menu";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { yoursView } from "@/lib/guest/yours-filter";
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
  DEFAULT_ROW_STEP,
  perRowFor,
  type RowStep,
} from "@/lib/shared/album-rows";
import { useRowStep } from "@/lib/shared/use-tile-size";

// The payload, the header's arithmetic and the handle live in the provider with the state they
// describe; named again here so every importer of this module keeps its one import.
export { albumCount } from "@/components/guest/gallery-live";
export type GalleryPayload = LiveGalleryPayload;
export type LiveGalleryHandle = LiveGalleryHandleType;

/** The guest album's own path, which its remembered width is scoped to (`rememberAlbumWidth`). */
const ALBUM_WIDTH_PATH = "/e";

/**
 * THE GUEST ALBUM'S ONE VIEW MENU: the density slider (`album-columns` r2, `steps=both`: three
 * steps, photographs per row, the same index a pinch or ctrl and the wheel set) and the Yours filter
 * in one parent dropdown rather than more and more configs beside the album.
 *
 * Pure, and exported, so its gates are unit-testable without standing up the whole live gallery:
 *   1. THE STEPS SPEAK IN PHOTOGRAPHS A ROW once the album has been laid out (`perRow`, from the
 *      width the rows were laid at), and in their plain names before (the server has no width).
 *   2. SHOWING JOINS ONLY WHEN THERE IS SOMETHING TO SHOW. An album the guest has added nothing to
 *      gets no second group at all, the same rule `yoursView` enforces for the filter itself, read
 *      off the same count so the two can never disagree.
 */
export function buildGuestViewGroups({
  step,
  setStep,
  boxWidth,
  showingMine,
  setShowingMine,
  ownedCount,
}: {
  step: RowStep;
  setStep: (step: RowStep) => void;
  /** The width the rows were laid at (null before the album has measured its box). */
  boxWidth: number | null;
  showingMine: boolean;
  setShowingMine: (mine: boolean) => void;
  /** How many of the WHOLE album are the guest's own (`yoursView`'s own count). */
  ownedCount: number;
}): (ViewMenuGroup | ViewMenuDensityGroup)[] {
  const groups: (ViewMenuGroup | ViewMenuDensityGroup)[] = [
    {
      kind: "density",
      id: "size",
      label: "Size",
      value: step,
      onChange: setStep,
      perRow:
        boxWidth !== null ? (s: RowStep) => perRowFor(boxWidth, s) : undefined,
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
   * anything a hold-for-approval event is keeping back (a refused file is not among them).
   */
  pendingUploads?: QueueItem[];
  /** Present only when the viewer can upload — the empty state's CTA opens the ADD SHEET. */
  onAddFirst?: () => void;
  /** The event JOIN url for the viewer's Share button. */
  joinUrl?: string;
  /** The ids a SIGNED-IN viewer uploaded, resolved in the page RSC. */
  canDeleteIds?: string[];
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
    uploadProgress,
    ensureLinks,
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
  // The glow holds PER ID (overlapping arrivals each get a full life); the sweep is EXCLUSIVE.
  const arrivedIds = useArrivalMarks(marks.arrived, ARRIVAL_GLOW_MS);
  const landedIds = useArrivalMarks(landedList, ARRIVAL_SWEEP_MS, true);

  /* ────────────────────────────────────────────────────────────────────────
     WHAT THIS DEVICE DRAWS AT THE ALBUM'S HEAD, and the three things it does
     NOT: a FAILURE draws nothing (the run's end opens a sheet listing every
     refusal with its own Retry); an APPROVED completion draws nothing either
     (it IS the album by then, through the optimistic tile); a HELD one draws a
     waiting tile until the host approves it, which is the moment its media id
     turns up in the manifest.
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

  // The header's number is the provider's (`albumCount`); the CTA below says the same one.
  const rawCount = items.length;

  // THE YOURS FILTER, which the mark on a guest's own tiles toggles, over the WHOLE album (the
  // manifest: `yoursView`'s own note). The intent is this tab's alone.
  const [showMine, setShowMine] = useState(false);
  const yours = yoursView(items, ownIds, showMine);

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
    showingMine: yours.on,
    setShowingMine: setShowMine,
    ownedCount: yours.count,
  });

  return (
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
    >
      {items.length > 0 || pendingTiles.length > 0 ? (
        // Likes: anonymous guests get the like button -> the create-account flow; signed-in guests
        // toggle in place; the hearts are seeded for the window (and the viewer's reach) alone.
        <LikesProvider mediaIds={likeIds as string[]}>
          {/* THE ALBUM'S OWN COUNT, beside a subtle "Download all" and the ONE View menu (both hidden
              in the demo and on a locked gallery). The count is the header's number, worded with the
              header's and the CTA's always-both-nouns rule. */}
          {access !== "none" && items.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {formatMediaCount(count)}
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
          {/* THE YOURS LINE, for the filter the mark on a guest's own tiles toggles: a line and not a
              chip, only while the filter is live, and its only exit besides the mark. */}
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
          <DeleteConsequence.Provider value={deleteConsequence}>
            <GalleryRows
              items={yours.items}
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
              // The two arrival marks on the tile box — the light is shared/arrival.css.
              arrivedIds={arrivedIds}
              landedIds={landedIds}
              // A guest removes THEIR OWN photograph and no other: omitted where the feature does not
              // apply (the demo, a locked gallery) rather than passed with an empty set.
              canDelete={canRemove ? (item) => ownIds.has(item.id) : undefined}
              onDeleteItem={canRemove ? (id) => void removeOwn(id) : undefined}
              // THE FOURTH MARK, and what its tap does. Same gate as Remove.
              mineIds={canRemove && ownIds.size > 0 ? ownIds : undefined}
              onSelectMine={() => setShowMine((on) => !on)}
              mineSelected={yours.on}
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
  );
}
