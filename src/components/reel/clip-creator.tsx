"use client";

/**
 * THE CLIP CREATOR ("Make your own"): the viewer's own clip, made on their device from the album,
 * saved or shared as a file, and on a paid event optionally added to the album as an ordinary video
 * the live reel never plays. Registered through the guest seam (`guest/reel/creator-seam.ts`);
 * everything it needs arrives as props.
 *
 * WHAT WILL SHAPED, ACROSS TWO ROUNDS OF `reel-cut` (docs/reviews/reel-cut.json):
 *
 * - ITS OWN ROOM (`entry=room`): the reel's view hands off and the clip arrives in a dark room of
 *   its own, over the reel, whose Back goes back to the reel.
 * - THE BENCH, AS AMENDED (`bench=column` with his tabs): at a laptop the head across the top, the
 *   clip at full height on the left, a panel on the right holding two views as tabs, one open at a
 *   time (Looks: the wall of looks, each tile her own clip in that look; Moments: the album pool with
 *   the fills, the numbers and "Hidden · Show"), and the order strip and the tray below, taking the
 *   height the tabs free. In a hand, focused views: the clip on top, the tab switch, one view under
 *   it, never everything at once ("almost like a self-tour as you click into each"). A call, his to
 *   overrule: Looks opens first, since the reel's picks already fill the moments.
 * - THE EXPORT'S MINUTE (`wait=stack`): the clip's own frame stacks and counts moments, "Keep this
 *   tab open", Cancel; a backgrounded tab pauses; a clip that does not finish lands on the finish
 *   with Retry and the picks kept.
 * - THE FINISH (`finish=save`, amended; one tap, save-sheet): Share leads on its own tap; Save is
 *   one tap into the platform's own action; Add to event waits behind a confirm; every action keeps
 *   her on the finish with its done state; at a laptop it sits in the panel under "Back to editing,
 *   your picks kept".
 * - NO SOUND (`sound=silent`): a clip has no audio track; people add their own music where they post.
 * - THE MARK (`mark=line`): a free event's clip carries the engine's mark, and one quiet line under
 *   the clip says it is the free event's, not every clip's.
 *
 * ★ PAYLOAD-DERIVED, NEVER THE CLIENT'S. The mark, the length cap and whether a video may go back to
 * the album are `facts` (`ClipFacts`, tier-derived on the server). Add to event exists only when the
 * plan takes video AND this viewer may add: the host through her own route whenever the plan takes
 * video; a guest through the seam's `addClipToAlbum`, which is null while uploads are closed.
 *
 * ★ LAZY, TWICE. This module reaches the whole canvas engine and arrives only when someone opens
 * the creator (the seam lazy-loads it); the encoder (mediabunny's muxer) arrives later still, with
 * the first Make it or an idle warm-up.
 */
import { Dialog as DialogPrimitive, Tabs as TabsPrimitive } from "radix-ui";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { ReelCreatorProps } from "@/components/guest/reel/creator-seam";
import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import {
  detectPlatform,
  shareFile,
  type SaveChoice,
} from "@/lib/media/share-save";
import { captureWarning } from "@/lib/observability/sentry";
import { saveBlobLocally } from "@/lib/reel/client-save";
import { addClipAsHost } from "@/lib/reel/clip-add";
import {
  encodeClip,
  preloadClipEncoder,
  type EncodedClip,
} from "@/lib/reel/clip-encode";
import {
  listClipHiddenAction,
  showClipMomentAction,
} from "@/lib/reel/clip-hidden-action";
import {
  clipPool,
  clipProps,
  clipSeconds,
  clipSeed,
  fillIds,
  keepInPool,
  lengthSecondsFor,
  momentsLeft,
  openWith,
  ownMomentIds,
  toggleMoment,
  type ClipContext,
  type ClipFill,
  type ClipSettings,
} from "@/lib/reel/clip-selection";
import { addConfirmWords, clipFilename } from "@/lib/reel/clip-words";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import {
  AddConfirm,
  FailedFinish,
  FinishDoors,
  FinishPanel,
  FinishScreen,
  type FinishDoor,
} from "./clip-finish";
import { ClipHero, FinishedClip } from "./clip-hero";
import { LooksWall } from "./clip-looks";
import { MomentsPool } from "./clip-moments";
import { OrderStrip } from "./clip-order";
import {
  FitBox,
  MakeButton,
  MakeSpacer,
  MarkLine,
  PANEL,
  ROOM,
  ROOM_FOCUS,
  RoomHead,
} from "./clip-room";
import { Tray } from "./clip-tray";

/** The host's plan upgrade, loaded only when she asks to remove the mark (a free host alone). */
const PricingSheetLazy = lazy(() =>
  import("@/components/app/pricing/pricing-sheet").then((m) => ({
    default: m.PricingSheet,
  })),
);

type Phase = "bench" | "making" | "finished" | "failed";
type View = "looks" | "moments";

/** The hero's backing store: crisp at a laptop's full height, lighter in a hand. */
const HERO_MAX_WIDE = 1440;
const HERO_MAX_HAND = 1080;

/**
 * THE WALL STANDS WHOLE AT A LAPTOP (the `strip` option's wall: five columns, all fourteen looks in
 * three rows, no scroll). A portrait tile is 16:9 tall, so the wall's width is held to what three
 * rows fit in the panel's height: its label and two row gaps (124 px with the worn tile's ring),
 * then five columns of tiles at 16/9 plus a 20 px name each, and the four 10 px gutters. The panel's
 * view is a size container, so `cqh` is its own height.
 */
const WALL_FITS_THREE_ROWS =
  "min(574px, calc((100cqh - 124px) * 0.9375 + 40px))";

/** The encoder's chunk warms this long after the room opens, off the first paint. */
const ENCODER_WARM_MS = 1500;

/** The room's tab switch: a segmented pair, white when it is the view in front. */
const TAB = cn(
  "flex h-8 items-center justify-center rounded-full px-4 text-caption font-medium text-white/60 transition-colors duration-150 hover:text-white data-[state=active]:bg-white data-[state=active]:text-zinc-900 motion-reduce:transition-none",
  ROOM_FOCUS,
);

/** The album's items, the host's shown photographs joined until the poll brings them itself. */
function withShown(
  items: readonly GalleryItem[],
  shown: readonly GalleryItem[],
): readonly GalleryItem[] {
  if (shown.length === 0) return items;
  const have = new Set(items.map((item) => item.id));
  const extra = shown.filter((item) => !have.has(item.id));
  return extra.length === 0 ? items : [...extra, ...items];
}

/** The pool as the Moments view draws it: the host's hidden photographs in their album place. */
function withHidden(
  pool: readonly GalleryItem[],
  hidden: readonly GalleryItem[],
): readonly GalleryItem[] {
  if (hidden.length === 0) return pool;
  const time = (item: GalleryItem) => Date.parse(item.createdAt ?? "");
  const all = [...pool, ...hidden];
  if (all.some((item) => !Number.isFinite(time(item)))) return all;
  // The album is newest first; a stable sort keeps the server's own tie order.
  return all.sort((a, b) => time(b) - time(a));
}

/** Whether this device's sheet takes this very file (asked with the real file). */
function sheetTakes(file: File): boolean {
  try {
    return (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

const isAbort = (e: unknown) =>
  typeof e === "object" &&
  e !== null &&
  "name" in e &&
  (e as { name: unknown }).name === "AbortError";

export function ClipCreator({
  items,
  styleId,
  eventId,
  eventName,
  facts,
  addClipToAlbum,
  isOwner,
  moderated,
  ownIds,
  onClose,
}: ReelCreatorProps) {
  const wide = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();

  /* ── the album ───────────────────────────────────────────────────────────── */
  const [hidden, setHidden] = useState<readonly GalleryItem[]>([]);
  const [shown, setShown] = useState<readonly GalleryItem[]>([]);
  const pool = useMemo(() => clipPool(withShown(items, shown)), [items, shown]);
  const byId = useMemo(
    () => new Map(pool.map((item) => [item.id, item])),
    [pool],
  );
  const grid = useMemo(() => withHidden(pool, hidden), [pool, hidden]);
  const ownCount = useMemo(
    () => ownMomentIds(pool, { isOwner, ownIds }).length,
    [pool, isOwner, ownIds],
  );

  /* ── the settings and the selection ──────────────────────────────────────── */
  const seed = useMemo(() => clipSeed(eventId), [eventId]);
  const [settings, setSettings] = useState<ClipSettings>(() => ({
    styleId: resolveStyleEntry(styleId).id,
    orientation: "portrait",
    length: "auto",
  }));
  const ctx: ClipContext = useMemo(
    () => ({
      ...settings,
      byId,
      maxSeconds: facts.maxSeconds,
      watermark: facts.watermark,
      seed,
    }),
    [settings, byId, facts.maxSeconds, facts.watermark, seed],
  );
  const [take, setTake] = useState(0);
  const [fill, setFill] = useState<ClipFill | null>("reel");
  const [chosen, setChosen] = useState<readonly string[]>(() =>
    fillIds("reel", { pool, eventId, isOwner, ownIds, ctx }),
  );
  // A moment the host hid (or a guest removed) since the room opened leaves the clip at once.
  const ids = useMemo(() => keepInPool(chosen, pool), [chosen, pool]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const openingPicked = openingId !== null && ids[0] === openingId;

  const props = useMemo(() => clipProps(ids, ctx), [ids, ctx]);
  const fitting = props.clips.length;
  const meta = formatReelMeta({
    durationLabel: fitting > 0 ? formatReelDuration(clipSeconds(props)) : null,
    styleLabel: resolveStyleEntry(settings.styleId).label,
    momentCount: fitting,
  });
  const orderItems = useMemo(
    () =>
      ids
        .map((id) => byId.get(id))
        .filter((item): item is GalleryItem => Boolean(item)),
    [ids, byId],
  );
  const lengthLabel = formatReelDuration(
    lengthSecondsFor(settings.length, facts.maxSeconds),
  );

  const edit = useCallback((next: readonly string[]) => {
    setChosen(next);
    setFill(null);
  }, []);
  const pickFill = useCallback(
    (next: ClipFill) => {
      setChosen(fillIds(next, { pool, eventId, isOwner, ownIds, ctx, take }));
      setFill(next);
      setOpeningId(null);
    },
    [pool, eventId, isOwner, ownIds, ctx, take],
  );

  /* ── the host's hidden photographs ───────────────────────────────────────── */
  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    void listClipHiddenAction(eventId).then((result) => {
      if (alive && result.ok) setHidden(result.items);
    });
    return () => {
      alive = false;
    };
  }, [isOwner, eventId]);

  const show = useCallback(
    async (id: string) => {
      const item = hidden.find((h) => h.id === id);
      if (!item) return;
      // Optimistic: it leaves the hidden tiles, joins the album as approved and the clip at its end.
      const approved: GalleryItem = { ...item, status: "approved" };
      setHidden((all) => all.filter((h) => h.id !== id));
      setShown((all) => [...all, approved]);
      setChosen((all) => (all.includes(id) ? all : [...all, id]));
      setFill(null);
      const result = await showClipMomentAction(eventId, id);
      if (result.ok) {
        toast.success("It's back in the album");
        return;
      }
      setShown((all) => all.filter((s) => s.id !== id));
      setHidden((all) => [...all, item]);
      setChosen((all) => all.filter((x) => x !== id));
      toast.error(result.message);
    },
    [hidden, eventId],
  );

  /* ── the room's own state ────────────────────────────────────────────────── */
  const [view, setView] = useState<View>("looks");
  const [playing, setPlaying] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [phase, setPhase] = useState<Phase>("bench");
  const [progress, setProgress] = useState(0);
  // The moments the running encode draws, fixed when it starts (a poll mid-way changes the bench,
  // never the clip already being drawn).
  const [drawing, setDrawing] = useState(0);
  const [paused, setPaused] = useState(false);
  const [made, setMade] = useState<EncodedClip | null>(null);
  const [done, setDone] = useState<ReadonlySet<FinishDoor>>(() => new Set());
  const [adding, setAdding] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // The encoder warms while she chooses, never on the first paint; an encode still running when the
  // room closes is cancelled with it.
  useEffect(() => {
    const warm = window.setTimeout(preloadClipEncoder, ENCODER_WARM_MS);
    return () => {
      window.clearTimeout(warm);
      abortRef.current?.abort();
    };
  }, []);

  /* ── making it ───────────────────────────────────────────────────────────── */
  const make = useCallback(async () => {
    if (props.clips.length === 0 || abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setDrawing(props.clips.length);
    setPaused(false);
    setMade(null);
    setDone(new Set());
    setAdding(null);
    setPhase("making");
    try {
      const clip = await encodeClip(props, {
        filename: clipFilename(eventName),
        signal: controller.signal,
        onProgress: setProgress,
        onPaused: setPaused,
      });
      if (controller.signal.aborted) return;
      setMade(clip);
      setPhase("finished");
    } catch (error) {
      if (controller.signal.aborted || isAbort(error)) {
        setPhase("bench");
        return;
      }
      // Never silent: the maker sees Retry, and the failure reaches Sentry once per attempt.
      captureWarning("reel", "clip: encode failed", {
        eventId,
        styleId: props.styleId,
        orientation: props.orientation,
        moments: props.clips.length,
        message: error instanceof Error ? error.message : String(error),
      });
      setPhase("failed");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [props, eventName, eventId]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const backToEditing = useCallback(() => {
    setMade(null);
    setPhase("bench");
  }, []);

  const makeAnother = useCallback(() => {
    // A fresh handful of the night: the reel's next take, the look and the length kept.
    const next = take + 1;
    setTake(next);
    setChosen(
      fillIds("reel", { pool, eventId, isOwner, ownIds, ctx, take: next }),
    );
    setFill("reel");
    setOpeningId(null);
    setMade(null);
    setView("looks");
    setPhase("bench");
  }, [take, pool, eventId, isOwner, ownIds, ctx]);

  /* ── the finish's doors ──────────────────────────────────────────────────── */
  const platform = useMemo(
    () =>
      typeof navigator === "undefined" ? "desktop" : detectPlatform(navigator),
    [],
  );
  const canShare = useMemo(
    () => (made ? sheetTakes(made.file) : false),
    [made],
  );
  const canAdd = facts.videoAllowed && (isOwner || addClipToAlbum !== null);
  const markDone = useCallback((door: FinishDoor) => {
    setDone((all) => new Set(all).add(door));
  }, []);

  const share = useCallback(async () => {
    if (!made) return;
    const out = await shareFile(made.file, navigator);
    if (out.kind === "shared") markDone("share");
    else if (out.kind === "needs-tap") toast("Tap Share once more to open it");
    else if (out.kind === "failed" || out.kind === "unsupported")
      toast.error("Couldn't open sharing here. Save it instead.");
    // Dismissing the sheet ("cancelled") raises nothing.
  }, [made, markDone]);

  const save = useCallback(
    async (choice: SaveChoice) => {
      if (!made) return;
      const { file } = made;
      if (choice === "photos") {
        // iOS's one web door into Photos is the system sheet carrying the file ("Save Video").
        const out = await shareFile(file, navigator);
        if (out.kind === "shared") {
          markDone("save");
          return;
        }
        if (out.kind === "cancelled") return;
        if (out.kind === "needs-tap") {
          toast("Tap Save once more to open it");
          return;
        }
        // Refused or broken: a Save that saves nothing is the one outcome to avoid.
      }
      saveBlobLocally(file, file.name);
      markDone("save");
    },
    [made, markDone],
  );

  const add = useCallback(async () => {
    setConfirming(false);
    if (!made || !canAdd) return;
    const { file, poster } = made;
    if (isOwner) {
      setAdding(0);
      const out = await addClipAsHost({
        eventId,
        file,
        poster,
        onProgress: setAdding,
      });
      setAdding(null);
      if (out.ok) markDone("add");
      else toast.error(out.message);
      return;
    }
    // The page's own queue from here: its join, retry and failure sheet, like any upload. A poster
    // that would not draw goes as an empty image, which the uploader answers with its own preview.
    addClipToAlbum?.(file, poster ?? new Blob([], { type: "image/webp" }));
    markDone("add");
  }, [made, canAdd, isOwner, eventId, addClipToAlbum, markDone]);

  const confirmWords = addConfirmWords({
    eventName,
    isOwner,
    moderated,
    bytes: made?.file.size ?? 0,
  });

  /* ── the way back ────────────────────────────────────────────────────────── */
  // One step at a time: a running encode is cancelled, a finish goes back to editing, the bench goes
  // back to the reel.
  const back = useCallback(() => {
    if (phase === "making") cancel();
    else if (phase === "finished" || phase === "failed") backToEditing();
    else onClose();
  }, [phase, cancel, backToEditing, onClose]);

  /* ── the pieces, placed by the layout below ──────────────────────────────── */
  const making = phase === "making";
  const finished = phase === "finished" && made !== null;
  const aspect = settings.orientation === "landscape" ? 16 / 9 : 9 / 16;

  const hero = finished ? (
    <FinishedClip file={made.file} reduced={reduced} />
  ) : (
    <ClipHero
      props={props}
      playing={playing && phase === "bench"}
      onTogglePlay={() => setPlaying((p) => !p)}
      maxDim={wide ? HERO_MAX_WIDE : HERO_MAX_HAND}
      compact={!wide}
      making={
        making
          ? {
              left: momentsLeft(progress, drawing),
              total: drawing,
              paused,
              onCancel: cancel,
            }
          : undefined
      }
    />
  );

  const mark = facts.watermark ? (
    <MarkLine
      isOwner={isOwner}
      onUpgrade={isOwner ? () => setUpgrading(true) : undefined}
      align={wide ? "end" : "center"}
    />
  ) : null;

  const makeButton =
    phase === "finished" || phase === "failed" ? (
      <MakeSpacer />
    ) : (
      <MakeButton
        onMake={() => void make()}
        making={making}
        disabled={fitting === 0}
        compact={!wide}
      />
    );

  const doors = made ? (
    <FinishDoors
      canShare={canShare}
      platform={platform}
      done={done}
      adding={adding}
      canAdd={canAdd}
      onShare={() => void share()}
      onSave={(choice) => void save(choice)}
      onAskAdd={() => setConfirming(true)}
      onMakeAnother={makeAnother}
    />
  ) : null;

  const looks = (cols: number, className?: string, style?: CSSProperties) => (
    <LooksWall
      props={props}
      styleId={settings.styleId}
      onPick={(id) => setSettings((s) => ({ ...s, styleId: id }))}
      cols={cols}
      className={className}
      style={style}
    />
  );
  const moments = (cols: number) => (
    <MomentsPool
      grid={grid}
      ids={ids}
      fitting={fitting}
      fill={fill}
      ownCount={ownCount}
      onFill={pickFill}
      onToggle={(id) => edit(toggleMoment(ids, id))}
      onShow={isOwner ? (id) => void show(id) : undefined}
      cols={cols}
    />
  );
  const order = (tile: number, className?: string) => (
    <OrderStrip
      items={orderItems}
      fitting={fitting}
      lengthLabel={lengthLabel}
      tile={tile}
      onReorder={(next) => {
        edit(next);
        if (next[0] !== openingId) setOpeningId(null);
      }}
      onAdd={() => setView("moments")}
      className={className}
    />
  );
  const tray = (compact: boolean, className?: string) => (
    <Tray
      length={settings.length}
      maxSeconds={facts.maxSeconds}
      onLength={(length) => setSettings((s) => ({ ...s, length }))}
      orientation={settings.orientation}
      onOrientation={(orientation) =>
        setSettings((s) => ({ ...s, orientation }))
      }
      opening={orderItems[0] ?? null}
      openingPicked={openingPicked}
      openers={orderItems.slice(0, fitting)}
      onOpening={(id) => {
        if (id === null) {
          setOpeningId(null);
          return;
        }
        edit(openWith(ids, id));
        setOpeningId(id);
      }}
      isOwner={isOwner}
      compact={compact}
      disabled={making}
      className={className}
    />
  );

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-clip-creator={phase}
          onEscapeKeyDown={(e) => {
            // Escape is one step back, never a leap out of a finished clip.
            e.preventDefault();
            back();
          }}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-0 z-50 flex flex-col overflow-hidden text-white outline-none select-none",
            ROOM,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Make your own clip
          </DialogPrimitive.Title>
          <RoomHead
            eventName={eventName}
            meta={meta}
            onBack={phase === "bench" ? onClose : back}
            backLabel={
              making
                ? "Stop making the clip"
                : phase === "bench"
                  ? "Back to the reel"
                  : "Back to editing"
            }
            right={makeButton}
            compact={!wide}
          />

          {wide ? (
            <Laptop
              phase={phase}
              landscape={settings.orientation === "landscape"}
              aspect={aspect}
              hero={hero}
              mark={mark}
              view={view}
              onView={setView}
              looks={
                settings.orientation === "landscape"
                  ? // A landscape still is a quarter of a portrait one's height: three wide columns
                    // stand all fourteen at a size worth choosing from.
                    looks(3)
                  : looks(5, "mx-auto", { maxWidth: WALL_FITS_THREE_ROWS })
              }
              moments={moments(6)}
              finish={
                phase === "failed" ? (
                  <FailedFinish
                    onRetry={() => void make()}
                    onBack={backToEditing}
                  />
                ) : finished ? (
                  <FinishPanel onBack={backToEditing} doors={doors} />
                ) : null
              }
              foot={
                <>
                  {order(52, "flex-1")}
                  {tray(false, "shrink-0 pb-5")}
                </>
              }
            />
          ) : (
            <Hand
              phase={phase}
              aspect={aspect}
              hero={hero}
              mark={mark}
              view={view}
              onView={setView}
              looks={looks(settings.orientation === "landscape" ? 2 : 4)}
              moments={
                <>
                  {order(40, "mb-4")}
                  {moments(4)}
                </>
              }
              finish={
                phase === "failed" ? (
                  <FailedFinish
                    onRetry={() => void make()}
                    onBack={backToEditing}
                  />
                ) : finished ? (
                  <FinishScreen
                    clip={
                      <FitBox ratio={aspect} className="flex-1">
                        {hero}
                      </FitBox>
                    }
                    mark={mark}
                    doors={doors}
                  />
                ) : null
              }
              tray={tray(true, "justify-center")}
            />
          )}

          {made ? (
            <AddConfirm
              open={confirming}
              onOpenChange={setConfirming}
              title={confirmWords.title}
              body={confirmWords.body}
              onConfirm={() => void add()}
            />
          ) : null}
          {upgrading ? (
            <Suspense fallback={null}>
              <PricingSheetLazy
                trigger={{ kind: "plan" }}
                plan={{ tier: "free", hasBilling: false }}
                open
                onOpenChange={setUpgrading}
              />
            </Suspense>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ── the two layouts ──────────────────────────────────────────────────────── */

/** The tab switch and its two views, one open at a time (Radix unmounts the other). */
function Views({
  view,
  onView,
  looks,
  moments,
  listClassName,
  contentClassName,
  looksClassName,
  inert,
}: {
  view: View;
  onView: (view: View) => void;
  looks: ReactNode;
  moments: ReactNode;
  listClassName?: string;
  contentClassName?: string;
  /** The Looks view's own box (a size container at a laptop, for the wall's fit). */
  looksClassName?: string;
  inert?: boolean;
}) {
  return (
    <TabsPrimitive.Root
      value={view}
      onValueChange={(v) => onView(v === "moments" ? "moments" : "looks")}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsPrimitive.List
        aria-label="Your clip's looks and moments"
        className={cn(
          "grid shrink-0 grid-cols-2 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10",
          listClassName,
        )}
      >
        <TabsPrimitive.Trigger value="looks" className={TAB}>
          Looks
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value="moments" className={TAB}>
          Moments
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>
      <TabsPrimitive.Content
        value="looks"
        inert={inert}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto outline-none",
          contentClassName,
          looksClassName,
        )}
      >
        {looks}
      </TabsPrimitive.Content>
      <TabsPrimitive.Content
        value="moments"
        inert={inert}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto outline-none",
          contentClassName,
        )}
      >
        {moments}
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}

/**
 * AT A LAPTOP: the clip at full height on the left of a centred pair, the panel beside it, the order
 * strip and the tray under both. While it is drawn everything but the clip dims and holds still; at
 * the finish the panel is the finish and the foot steps away.
 */
function Laptop({
  phase,
  landscape,
  aspect,
  hero,
  mark,
  view,
  onView,
  looks,
  moments,
  finish,
  foot,
}: {
  phase: Phase;
  landscape: boolean;
  aspect: number;
  hero: ReactNode;
  mark: ReactNode;
  view: View;
  onView: (view: View) => void;
  looks: ReactNode;
  moments: ReactNode;
  finish: ReactNode;
  foot: ReactNode;
}) {
  const making = phase === "making";
  return (
    <>
      <div className="mx-auto flex min-h-0 w-full max-w-[1160px] flex-1 gap-8 px-6 pt-1 xl:gap-10">
        <div
          data-clip-column
          className={cn(
            "flex min-h-0 shrink-0 flex-col items-center",
            landscape ? "w-[520px]" : "w-[400px]",
          )}
        >
          <FitBox ratio={aspect} className="flex-1 pt-3">
            {hero}
          </FitBox>
          {mark}
        </div>
        <aside
          data-clip-panel
          aria-label="The bench"
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl p-4 transition-opacity duration-200 motion-reduce:transition-none",
            PANEL,
            making && "opacity-35",
          )}
        >
          {finish ?? (
            <Views
              view={view}
              onView={onView}
              looks={looks}
              moments={moments}
              listClassName="mb-4 self-start"
              contentClassName="-mr-2 pr-2"
              looksClassName="[container-type:size]"
              inert={making}
            />
          )}
        </aside>
      </div>
      {finish ? (
        <div className="h-6 shrink-0" />
      ) : (
        <div
          data-clip-foot
          inert={making}
          className={cn(
            "mx-auto flex w-full max-w-[1160px] shrink-0 items-end justify-between gap-6 px-6 pt-3 pb-4 transition-opacity duration-200 motion-reduce:transition-none",
            making && "opacity-35",
          )}
        >
          {foot}
        </div>
      )}
    </>
  );
}

/**
 * IN A HAND: focused views. The clip on top, the tab switch, one view under it, the tray at the
 * foot; the order strip lives with the moments, where the order is what she is choosing. The finish
 * is its own screen.
 */
function Hand({
  phase,
  aspect,
  hero,
  mark,
  view,
  onView,
  looks,
  moments,
  finish,
  tray,
}: {
  phase: Phase;
  aspect: number;
  hero: ReactNode;
  mark: ReactNode;
  view: View;
  onView: (view: View) => void;
  looks: ReactNode;
  moments: ReactNode;
  finish: ReactNode;
  tray: ReactNode;
}) {
  const making = phase === "making";
  if (phase === "finished" && finish) return <>{finish}</>;
  return (
    <>
      <div
        data-clip-column
        className="flex shrink-0 flex-col items-center px-4 pt-2"
        style={{ height: "clamp(190px, 38dvh, 360px)" }}
      >
        <FitBox ratio={aspect} className="flex-1 pt-2">
          {hero}
        </FitBox>
      </div>
      <div className="shrink-0 px-4">{mark}</div>
      {phase === "failed" && finish ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{finish}</div>
      ) : (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col pt-3 transition-opacity duration-200 motion-reduce:transition-none",
            making && "opacity-35",
          )}
        >
          <Views
            view={view}
            onView={onView}
            looks={looks}
            moments={moments}
            listClassName="mx-4 mb-3"
            contentClassName="px-4 pb-4"
            inert={making}
          />
          <div
            inert={making}
            className="shrink-0 border-t border-white/10 px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          >
            {tray}
          </div>
        </div>
      )}
    </>
  );
}
