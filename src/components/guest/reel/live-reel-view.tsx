"use client";

/**
 * THE REEL'S FULL-SCREEN VIEW, WHICH IS ALSO THE WALL (reel-guest-wiring, 2026-09-24).
 *
 * Will's `reel-view` picks as he amended them, and his ruling "The view is the wall": one view serves
 * a phone, a laptop and an event screen. What it is, top to bottom:
 *
 * - THE PICTURE, full-bleed (`posture=follow`): the live composer over the album's own live payload,
 *   in the viewport's own orientation, covering it. A tap opens the photograph in the shared media
 *   viewer (`tap=lightbox`), pausing the reel behind it.
 * - THE CHROME (`chrome=thin`): at rest, one slim glass bar at the foot, play and progress, "to give
 *   users something to reach for when controls are hidden". A pointer's movement (or, on touch, a tap
 *   on the bar itself) grows it into the full dock; a resting pointer lets it settle back. Close shows
 *   and hides with it, and every control carries a tooltip.
 * - THE DOCK (`controls=weighted`, amended): one row of icon buttons (play/pause, Include videos,
 *   Style, Hold, Show the code, Add yours), and beneath it "Make your own" as the single primary,
 *   only once a creator is registered.
 * - THE ARRIVALS (`arrival=chip`): a fresh upload names its uploader top left for one hold, a burst
 *   stacking into a short feed ("Theo +12").
 * - THE CODE (`qr=corner`, `name=none`): a white plate bottom right, "Scan to add yours" and the
 *   readable address. No event name on screen, ever.
 * - ON A SCREEN (`?reel=screen`): the code on, and a one-tap Start plate (the first frame behind a
 *   dimmed play mark) that takes fullscreen and keeps the screen awake. Leaving fullscreen brings the
 *   plate back rather than a half-dressed view. Below the minimum it is the code and the address
 *   alone (reel-screen's `code`).
 *
 * The hold (3 s by default, `pacing=unhurried`), the style and the video switch are the viewer's
 * own, kept on this device (lib/guest/reel-prefs.ts). The loop never announces its seam
 * (`loop=continues`). Reduced motion starts paused with the dock up (`reduced=paused`); a host's
 * explicit Start on a screen overrides it.
 *
 * LAZY (live-reel.tsx): this module reaches the whole canvas engine, and nobody who never opens the
 * view downloads it.
 */
import {
  Clock3,
  ImagePlus,
  Palette,
  Pause,
  Play,
  QrCode,
  Video,
  VideoOff,
  Wand2,
  X,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, ReactNode } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { useGalleryLive } from "@/components/guest/gallery-live";
import { LikesProvider } from "@/components/likes/likes-provider";
import { MediaLightboxLazy } from "@/components/shared/media-lightbox.lazy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import {
  arrivalLabel,
  arrivalRows,
  nextArrivalExpiry,
  pruneArrivals,
  pushArrivals,
  type ArrivalEntry,
  type ArrivalRow,
} from "@/lib/guest/arrival-feed";
import {
  DEFAULT_HOLD_SEC,
  HOLD_STEPS_SEC,
  holdLabel,
  holdScaleFor,
  liveMoods,
  readHoldSec,
  readIncludeVideos,
  readStyleId,
  writeHoldSec,
  writeIncludeVideos,
  writeStyleId,
} from "@/lib/guest/reel-prefs";
import type { ReelMode } from "@/lib/guest/reel-url";
import {
  canFullscreen,
  createWakeLock,
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  onFullscreenChange,
} from "@/lib/guest/screen-posture";
import { captureWarning } from "@/lib/observability/sentry";
import { modulePx, MODULE_FLOOR_PX } from "@/lib/qr/module-floor";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import {
  LiveReelPlayer,
  type LiveFrameState,
  type LiveReelPlayerHandle,
} from "@/lib/reel/engine/player-live";
import { isReelEligible, type LiveMediaItem } from "@/lib/reel/live/items";
import { createClipSource, type ClipSource } from "@/lib/reel/live/source";
import { resolveLiveStyleId } from "@/lib/reel/live/window";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import type { ReelCreator } from "./creator-seam";

export type ReelViewProps = {
  mode: ReelMode;
  /** The screen posture below the minimum: the code and the address alone. */
  idle: boolean;
  eventId: string;
  joinUrl: string;
  displayAddress: string;
  qrStyle: string;
  isDemo: boolean;
  /** The list the reel plays (the controller's; see live-reel.tsx). */
  playable: readonly GalleryItem[];
  onAddYours?: () => void;
  creator: ReelCreator | null;
  addCutToAlbum: ((file: File, poster: Blob) => void) | null;
  onClose: () => void;
};

/** A resting pointer lets the dock settle back after this long; a touch viewer gets longer. */
const IDLE_POINTER_MS = 2400;
const IDLE_TOUCH_MS = 4200;
/** The bar's pill, at rest (live-reel.css reads these). */
const BAR_W = 132;
const BAR_H = 34;
const DOCK_R = 22;
/** Past this many failed frames or stills, one report reaches Sentry (never silent, never a flood). */
const FAILURE_REPORT_THRESHOLD = 12;

export function LiveReelView({
  mode,
  idle,
  eventId,
  joinUrl,
  displayAddress,
  qrStyle,
  isDemo,
  playable,
  onAddYours,
  creator,
  addCutToAlbum,
  onClose,
}: ReelViewProps) {
  const live = useGalleryLive();
  const reduced = usePrefersReducedMotion();
  const screen = mode === "screen";
  const qrToken = live?.qrToken ?? "";

  /* ── the viewer's own knobs, kept on this device ─────────────────────────── */
  const [holdSec, setHoldSec] = useState(readHoldSec);
  const hostStyle = live?.reel?.styleId ?? null;
  const [styleId, setStyleId] = useState(
    () => readStyleId(qrToken) ?? resolveLiveStyleId(hostStyle),
  );
  const [includeVideos, setIncludeVideos] = useState(readIncludeVideos);
  const [showCode, setShowCode] = useState(screen);
  const holdScale = holdScaleFor(holdSec, styleId);
  const hasVideo = playable.some(
    (item) => item.type === "video" && isReelEligible(item),
  );

  /* ── play state ──────────────────────────────────────────────────────────── */
  // Reduced motion starts on the first frame with the dock up (`reduced=paused`); a screen starts
  // behind its Start plate either way.
  const [paused, setPaused] = useState(
    () =>
      screen ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  );
  const [started, setStarted] = useState(false);
  const plateUp = screen && !started;

  /* ── the source: the album's live list, fed as it changes ────────────────── */
  const source = useLiveSource(eventId, playable, live?.ownIds ?? null);
  const playerRef = useRef<LiveReelPlayerHandle>(null);
  const orientation = useViewportOrientation();
  const viewport = useViewportSize();

  /* ── the chrome: the bar that grows into the dock ────────────────────────── */
  const [chrome, setChrome] = useState<"up" | "rest">("up");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockFocus, setDockFocus] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  // Never settles BY ITSELF while it is being used, while the reel is paused (a paused reel shows
  // its controls), or under reduced motion ("a control that vanishes unasked is exactly the motion
  // the setting exists to remove"). The viewer can still fold it away on purpose (the timeline).
  const pinned = paused || menuOpen || dockFocus || reduced;
  const chromeRef = useRef(chrome);
  const pinnedRef = useRef(pinned);
  const idleMsRef = useRef(IDLE_POINTER_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    chromeRef.current = chrome;
    pinnedRef.current = pinned;
  }, [chrome, pinned]);

  const scheduleRest = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!pinnedRef.current) setChrome("rest");
    }, idleMsRef.current);
  }, []);
  const wake = useCallback(
    (touch = false) => {
      idleMsRef.current = touch ? IDLE_TOUCH_MS : IDLE_POINTER_MS;
      if (chromeRef.current !== "up") setChrome("up");
      if (!pinnedRef.current) scheduleRest();
    },
    [scheduleRest],
  );
  // The first sight carries its chrome for a beat (so a viewer learns the controls exist), then the
  // picture takes the screen. Re-armed whenever what pins it lets go.
  useEffect(() => {
    if (pinned) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (chromeRef.current === "up") scheduleRest();
  }, [pinned, scheduleRest]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  const chromeUp = chrome === "up";

  /* ── what is on screen, for the tap, the progress and the lightbox ───────── */
  const onScreenRef = useRef<LiveMediaItem | null>(null);
  const loopRef = useRef({ loop: -1, seen: 0 });
  const [progress, setProgress] = useState(0);
  const onClipChange = useCallback(
    (item: LiveMediaItem | null) => {
      onScreenRef.current = item;
      if (!item) return;
      // The timeline is the LOOP: how much of the album this take has shown. A new loop starts it
      // over, silently (`loop=continues`: nothing marks the seam).
      const takeLength = Math.max(1, source.stats().takeLength);
      loopRef.current.seen = Math.min(takeLength, loopRef.current.seen + 1);
      setProgress(loopRef.current.seen / takeLength);
    },
    [source],
  );
  const onFrame = useCallback((state: LiveFrameState) => {
    if (state.loopIndex !== loopRef.current.loop) {
      loopRef.current = { loop: state.loopIndex, seen: 0 };
    }
  }, []);

  /* ── never silent, never a flood (the watchdog and one Sentry report) ────── */
  const reportedRef = useRef(false);
  const reportPossibleExpiry = live?.reportPossibleExpiry;
  const onFailure = useCallback(
    (count: number) => {
      // Any still that fails to decode may be an expired presign: the provider refetches, at most
      // once a minute, and every url is read again by id.
      reportPossibleExpiry?.();
      if (count >= FAILURE_REPORT_THRESHOLD && !reportedRef.current) {
        reportedRef.current = true;
        captureWarning("reel", "live reel: frames failing", {
          eventId,
          failures: count,
          surface: mode,
        });
      }
    },
    [reportPossibleExpiry, eventId, mode],
  );
  const onReport = useCallback(
    (message: string) => {
      if (message.includes("possible expiry")) reportPossibleExpiry?.();
    },
    [reportPossibleExpiry],
  );

  /* ── the screen posture: fullscreen and a screen that stays awake ───────── */
  const [wakeLock] = useState(createWakeLock);
  const enteredFullscreenRef = useRef(false);
  const start = useCallback(async () => {
    setStarted(true);
    // The host's explicit act overrides reduced motion.
    setPaused(false);
    void wakeLock.acquire();
    enteredFullscreenRef.current = await enterFullscreen();
  }, [wakeLock]);
  useEffect(() => {
    if (!screen) return;
    return onFullscreenChange(() => {
      // Leaving fullscreen brings the plate back rather than a half-dressed view.
      if (enteredFullscreenRef.current && !isFullscreen()) {
        enteredFullscreenRef.current = false;
        setStarted(false);
        setPaused(true);
        wakeLock.release();
      }
    });
  }, [screen, wakeLock]);
  useEffect(
    () => () => {
      wakeLock.release();
      void exitFullscreen();
    },
    [wakeLock],
  );

  /* ── the arrivals ────────────────────────────────────────────────────────── */
  const rows = useArrivalFeed({
    arrivals: live?.arrivals ?? EMPTY,
    items: live?.items ?? EMPTY_ITEMS,
    holdMs: holdSec * 1000,
    enabled: !plateUp && !idle,
  });

  /* ── the lightbox (a tap on the picture) ─────────────────────────────────── */
  const pausedBeforeRef = useRef(false);
  const lightboxItems = playable as GalleryItem[];
  const openLightbox = useCallback(() => {
    const item = onScreenRef.current;
    if (!item) return;
    const index = lightboxItems.findIndex((m) => m.id === item.id);
    if (index < 0) return;
    pausedBeforeRef.current = paused;
    setPaused(true);
    setLightboxIndex(index);
  }, [lightboxItems, paused]);
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setPaused(pausedBeforeRef.current);
  }, []);

  /* ── the creator (the cut lane's) ────────────────────────────────────────── */
  const openCreator = useCallback(() => {
    pausedBeforeRef.current = paused;
    setPaused(true);
    setCreatorOpen(true);
  }, [paused]);

  /* ── the keyboard ────────────────────────────────────────────────────────── */
  const contentRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[role="menu"]') || lightboxIndex !== null) return;
      if (creatorOpen) return;
      if (e.key === " ") {
        // Space pauses, unless a control has the focus (then Space is that control's own press).
        if (target !== contentRef.current) return;
        e.preventDefault();
        if (!plateUp) setPaused((p) => !p);
        wake();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (plateUp || idle) return;
        e.preventDefault();
        playerRef.current?.step(e.key === "ArrowRight" ? 1 : -1);
        wake();
        return;
      }
      if (e.key !== "Escape") wake();
    },
    [lightboxIndex, creatorOpen, plateUp, idle, wake],
  );

  const effectivePaused = paused || plateUp;
  const moods = useMemo(() => liveMoods(), []);
  const styleLabel = moods.find((m) => m.id === styleId)?.label ?? "Cinematic";
  const qr = useMemo(
    () => qrSizing({ joinUrl, qrStyle, viewport, screen }),
    [joinUrl, qrStyle, viewport, screen],
  );
  const cutFacts = live?.reel?.cut ?? null;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={contentRef}
          tabIndex={-1}
          aria-describedby={undefined}
          data-live-reel-view={mode}
          onOpenAutoFocus={(e) => {
            // Focus lands on the view itself, so Space pauses at once and Tab walks the controls.
            e.preventDefault();
            contentRef.current?.focus();
          }}
          onEscapeKeyDown={(e) => {
            // A layer above (the media viewer, the creator) closes first.
            if (lightboxIndex !== null || creatorOpen) e.preventDefault();
          }}
          // ★ NOTHING OUTSIDE CLOSES IT. The view covers the screen, so "outside" is only ever another
          // layer: a tooltip, a menu, the media viewer, or the add sheet "Add yours" opens (whose focus
          // moving in would otherwise dismiss the reel under it). Close, Escape and Back close it.
          onInteractOutside={(e) => e.preventDefault()}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.pointerType === "pen") wake();
          }}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 overflow-hidden bg-black text-white outline-none select-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Highlight reel
          </DialogPrimitive.Title>

          {/* THE PICTURE. Full-bleed, the viewport's own orientation; a tap opens the photograph. */}
          {!idle && (
            <div
              className="absolute inset-0"
              onClick={plateUp ? undefined : openLightbox}
              data-reel-picture
            >
              <LiveReelPlayer
                ref={playerRef}
                source={source}
                styleId={styleId}
                surface="wall"
                holdScale={holdScale}
                orientation={orientation}
                includeVideos={includeVideos && hasVideo}
                paused={effectivePaused}
                fill
                className="absolute inset-0"
                onClipChange={onClipChange}
                onFrame={onFrame}
                onFailure={onFailure}
                onReport={onReport}
              />
            </div>
          )}

          {/* ON A SCREEN, BELOW THE MINIMUM: the code and the address alone (reel-screen `code`). */}
          {idle && <IdleCode joinUrl={joinUrl} address={displayAddress} qrStyle={qrStyle} size={qr.idle} />}

          {/* The top edge's legibility: a whisper, only while chrome or a chip is up. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-200 ease-emphasis",
              chromeUp || rows.length > 0 ? "opacity-100" : "opacity-0",
            )}
          />

          {/* THE ARRIVALS, top left. */}
          {!plateUp && !idle && <ArrivalFeed rows={rows} screen={screen} />}

          {/* CLOSE, top right: shows and hides with the dock. */}
          {!plateUp && (
            <div
              className="lr-follow absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-30"
              data-state={chromeUp ? "up" : "rest"}
            >
              <TooltipProvider delayDuration={350} skipDelayDuration={250}>
                <ChromeButton label="Close" onClick={onClose} shortcut="Esc">
                  <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
                </ChromeButton>
              </TooltipProvider>
            </div>
          )}

          {/* THE CODE, bottom right (`qr=corner`): lifted above the dock when the dock is up. */}
          {showCode && !idle && !plateUp && (
            <div
              className="pointer-events-none absolute right-3 z-20 transition-transform duration-200 ease-emphasis motion-reduce:transition-none sm:right-5"
              style={{
                bottom: `calc(${screen ? "1.5rem" : "0.75rem"} + env(safe-area-inset-bottom))`,
                transform:
                  chromeUp && viewport.w < 720
                    ? `translateY(-${creator && cutFacts ? 150 : 104}px)`
                    : undefined,
              }}
              data-reel-code
            >
              <CornerCode
                joinUrl={joinUrl}
                address={displayAddress}
                qrStyle={qrStyle}
                size={qr.corner}
                screen={screen}
              />
            </div>
          )}

          {/* THE BAR THAT BECOMES THE DOCK. */}
          {!plateUp && !idle && (
            <ReelDock
              state={chromeUp ? "up" : "rest"}
              playing={!effectivePaused}
              progress={progress}
              onTogglePlay={() => {
                setPaused((p) => !p);
                wake();
              }}
              onToggleDock={(touch) => {
                if (chromeUp) {
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setChrome("rest");
                } else {
                  wake(touch);
                }
              }}
              includeVideos={includeVideos}
              hasVideo={hasVideo}
              onToggleVideos={() => {
                const next = !includeVideos;
                setIncludeVideos(next);
                writeIncludeVideos(next);
              }}
              styleId={styleId}
              styleLabel={styleLabel}
              moods={moods}
              onStyle={(id) => {
                setStyleId(id);
                writeStyleId(qrToken, id);
              }}
              holdSec={holdSec}
              onHold={(sec) => {
                setHoldSec(sec);
                writeHoldSec(sec);
              }}
              showCode={showCode}
              onToggleCode={() => setShowCode((on) => !on)}
              onAddYours={onAddYours}
              onMakeYourOwn={creator && cutFacts ? openCreator : undefined}
              onMenuOpenChange={setMenuOpen}
              onFocusWithin={setDockFocus}
              addLabel={isDemo ? "Add yours (a demo upload)" : "Add yours"}
            />
          )}

          {/* ON A SCREEN: the one-tap Start (reel-screen `frame`): the reel behind a dimmed play mark. */}
          {plateUp && (
            <StartPlate
              onStart={() => void start()}
              fullscreen={canFullscreen()}
            />
          )}

          {/* THE MEDIA VIEWER, for a tapped photograph (its current API; `origin`/`startAt` arrive
              with media-viewer-wiring). Its own likes, since the album's provider sits in the grid. */}
          {lightboxIndex !== null && (
            <LikesProvider mediaIds={lightboxItems.map((m) => m.id)}>
              <MediaLightboxLazy
                items={lightboxItems}
                index={lightboxIndex}
                onClose={closeLightbox}
                onIndexChange={setLightboxIndex}
                shareUrl={joinUrl}
              />
            </LikesProvider>
          )}

          {/* THE CREATOR (the cut lane's component, through the seam). */}
          {creatorOpen && creator && cutFacts && (
            <div className="absolute inset-0 z-40">
              {(() => {
                const Creator = creator;
                return (
                  <Creator
                    items={playable}
                    styleId={styleId}
                    eventId={eventId}
                    facts={cutFacts}
                    addCutToAlbum={addCutToAlbum}
                    onClose={() => {
                      setCreatorOpen(false);
                      setPaused(pausedBeforeRef.current);
                    }}
                  />
                );
              })()}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const EMPTY: readonly string[] = [];
const EMPTY_ITEMS: readonly GalleryItem[] = [];

/* ── the source ────────────────────────────────────────────────────────────── */

/**
 * ONE source for the view's life, fed the album's live list as it changes: an upload that reaches
 * the album splices in right after the photograph on screen, a hidden one cuts away at once
 * (live/source.ts). The device's own ids lead the next loop ("yours first"). Disposed with the
 * view, which gives every bitmap it pinned back to the shared cache.
 */
function useLiveSource(
  eventId: string,
  items: readonly GalleryItem[],
  ownIds: ReadonlySet<string> | null,
): ClipSource {
  const [source] = useState(() =>
    createClipSource({ eventId, items, ownIds }),
  );
  useEffect(() => {
    source.setItems(items);
  }, [source, items]);
  useEffect(() => {
    source.setOwnIds(ownIds);
  }, [source, ownIds]);
  useEffect(() => () => source.dispose(), [source]);
  return source;
}

/* ── the viewport ──────────────────────────────────────────────────────────── */

const PORTRAIT_MQ = "(orientation: portrait)";

function subscribeOrientation(onChange: () => void) {
  const mq = window.matchMedia(PORTRAIT_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** The composition follows the viewport (`posture=follow`): portrait on a phone, landscape at a
 *  laptop or a television. */
function useViewportOrientation(): "portrait" | "landscape" {
  return useSyncExternalStore(
    subscribeOrientation,
    () => (window.matchMedia(PORTRAIT_MQ).matches ? "portrait" : "landscape"),
    () => "portrait",
  );
}

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** The viewport's size, as one string snapshot (a fresh object per read would loop the store). */
function useViewportSize(): { w: number; h: number } {
  const key = useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => "375x812",
  );
  return useMemo(() => {
    const [w, h] = key.split("x").map(Number);
    return { w, h };
  }, [key]);
}

/**
 * ★ THE CODE IS SIZED TO SCAN, NEVER BY EYE. A phone camera needs 3 CSS px a module off a screen
 * (lib/qr/module-floor.ts), and the module count comes from the real link and the host's preset, so
 * the plate grows from the size the design wants until the arithmetic clears the floor. On a wall it
 * starts at about a tenth of the screen's width (a phone reads a code across a room at that size).
 */
function qrSizing({
  joinUrl,
  qrStyle,
  viewport,
  screen,
}: {
  joinUrl: string;
  qrStyle: string;
  viewport: { w: number; h: number };
  screen: boolean;
}): { corner: number; idle: number } {
  const key = (qrStyle in QR_KEYS ? qrStyle : "classic") as QrStyleKey;
  const vmin = Math.min(viewport.w, viewport.h);
  const floor = (desired: number) => {
    let size = Math.round(desired);
    for (let i = 0; i < 60; i++) {
      if (modulePx(size, joinUrl, key) >= MODULE_FLOOR_PX) break;
      size += 4;
    }
    return size;
  };
  const corner = screen
    ? floor(Math.min(320, Math.max(140, viewport.w * 0.1)))
    : floor(vmin < 500 ? 120 : 132);
  const idle = floor(Math.min(560, Math.max(220, vmin * 0.46)));
  return { corner, idle };
}
const QR_KEYS = { classic: 1, bold: 1, rounded: 1, dots: 1 } as const;

/* ── the arrivals ──────────────────────────────────────────────────────────── */

/** A tiny store outside React: arrivals are pushed in, and each chip expires on its own clock. */
function createFeedStore() {
  let feed: ArrivalEntry[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const next = nextArrivalExpiry(feed);
    if (next === null) return;
    timer = setTimeout(
      () => {
        feed = pruneArrivals(feed, Date.now());
        emit();
        schedule();
      },
      Math.max(0, next - Date.now()) + 16,
    );
  };
  return {
    push(arrivals: { id: string; name: string | null }[], holdMs: number) {
      feed = pushArrivals(feed, arrivals, Date.now(), holdMs);
      emit();
      schedule();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: () => feed,
    dispose() {
      if (timer) clearTimeout(timer);
      listeners.clear();
    },
  };
}

/**
 * The feed's rows, from the provider's arrival ids (the ones that reached the album AFTER the view
 * opened: nobody is announced for having been there already). A cut arriving is not a photograph in
 * the reel, so it names nobody.
 */
function useArrivalFeed({
  arrivals,
  items,
  holdMs,
  enabled,
}: {
  arrivals: readonly string[];
  items: readonly GalleryItem[];
  holdMs: number;
  enabled: boolean;
}): ArrivalRow[] {
  const [store] = useState(createFeedStore);
  const feed = useSyncExternalStore(store.subscribe, store.get, store.get);
  const seenRef = useRef<number | null>(null);
  useEffect(() => {
    if (seenRef.current === null) {
      seenRef.current = arrivals.length;
      return;
    }
    if (arrivals.length <= seenRef.current) return;
    const fresh = arrivals.slice(seenRef.current);
    seenRef.current = arrivals.length;
    if (!enabled) return;
    const byId = new Map(items.map((item) => [item.id, item]));
    const named = fresh
      .map((id) => byId.get(id))
      .filter((item): item is GalleryItem =>
        Boolean(item && isReelEligible(item)),
      )
      .map((item) => ({ id: item.id, name: item.uploaderName ?? null }));
    if (named.length > 0) store.push(named, holdMs);
  }, [arrivals, items, holdMs, enabled, store]);
  useEffect(() => () => store.dispose(), [store]);
  return useMemo(() => arrivalRows(feed), [feed]);
}

function ArrivalFeed({ rows, screen }: { rows: ArrivalRow[]; screen: boolean }) {
  if (rows.length === 0) return null;
  return (
    <ol
      aria-live="polite"
      aria-label="Just added"
      className={cn(
        "pointer-events-none absolute top-[calc(0.75rem+env(safe-area-inset-top))] left-3 z-20 flex flex-col items-start gap-1.5 sm:left-5",
        screen && "gap-2",
      )}
      data-reel-arrivals
    >
      {rows.map((row, i) => (
        <li
          key={row.key}
          className={cn(
            "lr-chip rounded-full px-3 py-1.5 font-medium text-white",
            screen ? "text-copy" : "text-caption",
            GLASS_MARK,
            // Older lines recede: the newest is the news.
            i > 0 && "opacity-80",
          )}
        >
          <span className={GLASS_MARK_LIT}>{arrivalLabel(row)}</span>
        </li>
      ))}
    </ol>
  );
}

/* ── the code ──────────────────────────────────────────────────────────────── */

/** INK: type over a photograph carries its own light (reel-screen's parts, the glass ruling's
 *  answer: a dark halo is invisible over a dark frame and the whole difference over a bright one). */
const INK =
  "[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.45)]";

function QrPlate({
  joinUrl,
  qrStyle,
  size,
}: {
  joinUrl: string;
  qrStyle: string;
  size: number;
}) {
  const style = useMemo(() => resolveQrPreset(qrStyle), [qrStyle]);
  return (
    <div
      className="shrink-0 rounded-[var(--radius)] bg-white p-1.5 shadow-lift"
      style={{ lineHeight: 0 }}
    >
      <StyledQr
        value={joinUrl}
        size={size}
        style={style}
        className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      />
    </div>
  );
}

function CornerCode({
  joinUrl,
  address,
  qrStyle,
  size,
  screen,
}: {
  joinUrl: string;
  address: string;
  qrStyle: string;
  size: number;
  screen: boolean;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="max-w-[12rem] text-right sm:max-w-[16rem]">
        <p
          className={cn(
            "font-heading font-semibold text-white",
            // A wall is read across a room: the page step there, a card title in the hand. (The
            // section step broke "Scan to add yours" over two lines at a laptop's width.)
            screen ? "text-page" : "text-card-title",
            INK,
          )}
        >
          Scan to add yours
        </p>
        <p
          className={cn(
            "mt-1 break-all text-white/90",
            screen ? "text-copy" : "text-caption",
            INK,
          )}
        >
          {address}
        </p>
      </div>
      <QrPlate joinUrl={joinUrl} qrStyle={qrStyle} size={size} />
    </div>
  );
}

function IdleCode({
  joinUrl,
  address,
  qrStyle,
  size,
}: {
  joinUrl: string;
  address: string;
  qrStyle: string;
  size: number;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[oklch(0.12_0_0)] px-6"
      data-reel-idle
    >
      <QrPlate joinUrl={joinUrl} qrStyle={qrStyle} size={size} />
      <p className="max-w-[90vw] text-center text-copy break-all text-white/80">
        {address}
      </p>
    </div>
  );
}

/* ── the Start plate ───────────────────────────────────────────────────────── */

function StartPlate({
  onStart,
  fullscreen,
}: {
  onStart: () => void;
  fullscreen: boolean;
}) {
  return (
    <div className="absolute inset-0 z-40" data-reel-start>
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <button
          type="button"
          onClick={onStart}
          autoFocus
          aria-label={
            fullscreen
              ? "Play on this screen (fills the screen and keeps it awake)"
              : "Play on this screen (keeps it awake)"
          }
          className={cn(
            "flex size-20 items-center justify-center rounded-full border border-white/30 text-white outline-none sm:size-24",
            "transition-transform duration-150 ease-emphasis active:scale-[0.96] motion-reduce:active:scale-100",
            "focus-visible:ring-4 focus-visible:ring-white/60",
            GLASS_MARK,
          )}
        >
          <Play className="ml-1 size-8 fill-white sm:size-10" aria-hidden />
        </button>
        <p className={cn("text-copy text-white/85", INK)}>
          Press to play on this screen
        </p>
      </div>
    </div>
  );
}

/* ── the dock ──────────────────────────────────────────────────────────────── */

function ChromeButton({
  label,
  onClick,
  children,
  pressed,
  shortcut,
  className,
  stagger,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  pressed?: boolean;
  shortcut?: string;
  className?: string;
  stagger?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          data-lr-stagger={stagger === undefined ? undefined : ""}
          style={
            stagger === undefined
              ? undefined
              : ({ "--lr-i": stagger } as CSSProperties)
          }
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-white outline-none",
            "transition-[transform,background-color] duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100",
            "focus-visible:ring-2 focus-visible:ring-white/70",
            "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/12",
            pressed && "bg-white/18",
            className ?? GLASS,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
        {shortcut ? <kbd className="ml-1 text-background/60">{shortcut}</kbd> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function MenuButton({
  label,
  icon,
  stagger,
  onOpenChange,
  children,
}: {
  label: string;
  icon: ReactNode;
  stagger: number;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange} modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={label}
              data-lr-stagger=""
              style={{ "--lr-i": stagger } as CSSProperties}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-white outline-none",
                "transition-[transform,background-color] duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100",
                "focus-visible:ring-2 focus-visible:ring-white/70 data-[state=open]:bg-white/18",
                "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/12",
              )}
            >
              {icon}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-44"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ReelDock({
  state,
  playing,
  progress,
  onTogglePlay,
  onToggleDock,
  includeVideos,
  hasVideo,
  onToggleVideos,
  styleId,
  styleLabel,
  moods,
  onStyle,
  holdSec,
  onHold,
  showCode,
  onToggleCode,
  onAddYours,
  onMakeYourOwn,
  onMenuOpenChange,
  onFocusWithin,
  addLabel,
}: {
  state: "up" | "rest";
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
  onToggleDock: (touch: boolean) => void;
  includeVideos: boolean;
  hasVideo: boolean;
  onToggleVideos: () => void;
  styleId: string;
  styleLabel: string;
  moods: { id: string; label: string }[];
  onStyle: (id: string) => void;
  holdSec: number;
  onHold: (sec: number) => void;
  showCode: boolean;
  onToggleCode: () => void;
  onAddYours?: () => void;
  onMakeYourOwn?: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onFocusWithin: (focused: boolean) => void;
  addLabel: string;
}) {
  const up = state === "up";
  let i = 0;
  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={250}>
      <div
        className={cn(
          "lr-pane absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 text-white",
          // As wide as its controls, never the screen: the bar grows about twice its size into a
          // capsule rather than into a banner, and the picture keeps the rest.
          "w-max min-w-[15rem] max-w-[calc(100vw-1.5rem)]",
          GLASS,
        )}
        style={
          {
            "--lr-bar-w": `${BAR_W}px`,
            "--lr-bar-h": `${BAR_H}px`,
            "--lr-dock-r": `${DOCK_R}px`,
            borderRadius: DOCK_R,
          } as CSSProperties
        }
        data-state={state}
        data-reel-dock={state}
        onFocus={() => onFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            onFocusWithin(false);
          }
        }}
      >
        {/* THE DOCK'S CONTROLS (inert at rest, so a hidden control never takes a tab stop). */}
        <div
          className="lr-dock-content flex flex-col gap-2 p-2"
          inert={!up}
        >
          <div className="flex items-center justify-center gap-1">
            <ChromeButton
              label={playing ? "Pause" : "Play"}
              onClick={onTogglePlay}
              shortcut="Space"
              stagger={i++}
              className=""
            >
              {playing ? (
                <Pause className={cn("size-[18px] fill-white", GLASS_MARK_LIT)} aria-hidden />
              ) : (
                <Play className={cn("ml-0.5 size-[18px] fill-white", GLASS_MARK_LIT)} aria-hidden />
              )}
            </ChromeButton>
            {hasVideo && (
              <ChromeButton
                label={includeVideos ? "Videos play" : "Videos off"}
                onClick={onToggleVideos}
                pressed={includeVideos}
                stagger={i++}
                className=""
              >
                {includeVideos ? (
                  <Video className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />
                ) : (
                  <VideoOff className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />
                )}
              </ChromeButton>
            )}
            <MenuButton
              label={`Style: ${styleLabel}`}
              icon={<Palette className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />}
              stagger={i++}
              onOpenChange={onMenuOpenChange}
            >
              <DropdownMenuLabel>Style</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={styleId} onValueChange={onStyle}>
                {moods.map((mood) => (
                  <DropdownMenuRadioItem key={mood.id} value={mood.id}>
                    {mood.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </MenuButton>
            <MenuButton
              label={`Hold: ${holdLabel(holdSec)} a photo`}
              icon={<Clock3 className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />}
              stagger={i++}
              onOpenChange={onMenuOpenChange}
            >
              <DropdownMenuLabel>Each photo holds</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={String(holdSec)}
                onValueChange={(v) => onHold(Number(v))}
              >
                {HOLD_STEPS_SEC.map((sec) => (
                  <DropdownMenuRadioItem key={sec} value={String(sec)}>
                    {holdLabel(sec)}
                    {sec === DEFAULT_HOLD_SEC ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Default
                      </span>
                    ) : null}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </MenuButton>
            <ChromeButton
              label={showCode ? "Hide the code" : "Show the code"}
              onClick={onToggleCode}
              pressed={showCode}
              stagger={i++}
              className=""
            >
              <QrCode className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />
            </ChromeButton>
            {onAddYours && (
              <ChromeButton
                label={addLabel}
                onClick={onAddYours}
                stagger={i++}
                className=""
              >
                <ImagePlus className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />
              </ChromeButton>
            )}
          </div>

          {/* The timeline, again: in the dock it is the way back to the bar. */}
          <button
            type="button"
            onClick={() => onToggleDock(false)}
            aria-label="Hide the controls"
            className="group mx-1 flex h-4 items-center outline-none"
          >
            <Timeline progress={progress} />
          </button>

          {onMakeYourOwn && (
            <button
              type="button"
              onClick={onMakeYourOwn}
              data-lr-stagger=""
              style={{ "--lr-i": i++ } as CSSProperties}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-full bg-reel text-sm font-semibold text-white outline-none",
                "transition-transform duration-150 ease-emphasis active:scale-[0.98] motion-reduce:active:scale-100",
                "focus-visible:ring-2 focus-visible:ring-white/70",
              )}
            >
              <Wand2 className="size-4" aria-hidden />
              Make your own
            </button>
          )}
        </div>

        {/* THE BAR AT REST: play and progress, one target that grows into the dock. */}
        <button
          type="button"
          onClick={(e) => {
            // A tap on the bar opens the dock on touch; a pointer has already woken it by moving.
            const touch =
              (e.nativeEvent as PointerEvent).pointerType === "touch" ||
              e.detail === 0;
            onToggleDock(touch);
          }}
          aria-label="Show the reel's controls"
          aria-expanded={up}
          inert={up}
          className="lr-bar-content absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2.5 px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ width: BAR_W, height: BAR_H, borderRadius: BAR_H / 2 }}
          data-reel-bar
        >
          {playing ? (
            <Pause className={cn("size-3 fill-white", GLASS_MARK_LIT)} aria-hidden />
          ) : (
            <Play className={cn("size-3 fill-white", GLASS_MARK_LIT)} aria-hidden />
          )}
          <Timeline progress={progress} />
        </button>
      </div>
    </TooltipProvider>
  );
}

/** The loop's progress: a transform, never a width (it moves once a photograph, on the GPU). */
function Timeline({ progress }: { progress: number }) {
  return (
    <span
      aria-hidden
      className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
    >
      <span
        className="absolute inset-0 origin-left rounded-full bg-white/85 transition-transform duration-500 ease-emphasis motion-reduce:transition-none"
        style={{ transform: `scaleX(${Math.max(0.04, Math.min(1, progress))})` }}
      />
    </span>
  );
}
