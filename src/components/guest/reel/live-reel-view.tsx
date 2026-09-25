"use client";

/**
 * THE REEL'S FULL-SCREEN VIEW, WHICH IS ALSO THE WALL.
 *
 * The view is the wall: one view serves a phone, a laptop and an event screen. What it is, top to
 * bottom:
 *
 * - THE PICTURE, full-bleed: the live composer over the album's own live payload, in the viewport's
 *   own orientation, covering it. A tap opens the photograph in the shared media viewer, pausing
 *   the reel behind it.
 * - THE CHROME: at rest, one slim glass bar at the foot, play and progress, so a viewer always has
 *   something to reach for while the controls are hidden. A pointer's movement (or, on touch, a tap
 *   on the bar itself) grows it into the full dock; a resting pointer lets it settle back. Close shows
 *   and hides with it, and every control carries a tooltip.
 * - THE DOCK: one row of icon buttons (play/pause, Include videos, Style, Hold, Show the code at a
 *   desk, Add yours; the event's owner also gets Play on a screen at a desk), and beneath it "Make
 *   your own" as the single primary, only once a creator is registered. On a browser that cannot
 *   encode it stays in its slot, greyed, and a tap bubbles up why (`noencode=greyed`): nothing is
 *   ever written over the reel.
 * - THE ARRIVALS: a fresh upload names its uploader top left for one hold, a burst stacking into a
 *   short feed ("Theo +12").
 * - THE CODE: a white plate bottom right, "Scan to add yours" and the readable address. No event
 *   name on screen, ever.
 * - ON A SCREEN (`?reel=screen`): the reel plays in the window at once with the code on, and a glass
 *   pill at the top asks for one press anywhere, which fills the screen where the platform allows it
 *   and keeps it awake. Leaving fullscreen changes nothing but the pill, which comes back; the lock
 *   holds until the view closes. Below the minimum (a screen whose album drops under two) it is the
 *   code and the address alone, until the reel returns.
 *
 * The hold (3 s by default), the style and the video switch are the viewer's own, kept on this
 * device (lib/guest/reel-prefs.ts). The loop never announces its seam. Reduced motion starts paused
 * with the dock up; on a screen the press is the host's explicit act and starts it.
 *
 * LAZY (live-reel.tsx): this module reaches the whole canvas engine, and nobody who never opens the
 * view downloads it.
 */
import {
  Clock3,
  ImagePlus,
  Maximize2,
  MonitorPlay,
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
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { toast } from "sonner";

import { StyledQr } from "@/components/app/styled-qr";
import { useGalleryLive } from "@/components/guest/gallery-live";
import { LikesProvider } from "@/components/likes/likes-provider";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import { MediaLightboxLazy } from "@/components/shared/media-lightbox.lazy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuItem,
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
  holdLabel,
  holdScaleFor,
  liveMoods,
  readHoldSec,
  readIncludeVideos,
  readOwnHoldSec,
  readStyleId,
  writeHoldSec,
  writeIncludeVideos,
  writeStyleId,
} from "@/lib/guest/reel-prefs";
import { withReelParam, type ReelMode } from "@/lib/guest/reel-url";
import {
  canFullscreen,
  createWakeLock,
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  onFullscreenChange,
} from "@/lib/guest/screen-posture";
import { captureWarning } from "@/lib/observability/sentry";
import {
  DEFAULT_HOLD_SEC,
  HOLD_STEPS_SEC,
  resolveHoldSec,
} from "@/lib/reel/defaults";
import { modulePx, MODULE_FLOOR_PX } from "@/lib/qr/module-floor";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import {
  LiveReelPlayer,
  type LiveFrameState,
  type LiveReelPlayerHandle,
} from "@/lib/reel/engine/player-live";
import { isReelEligible, type LiveMediaItem } from "@/lib/reel/live/items";
import { createClipSource, type ClipSource } from "@/lib/reel/live/source";
import type { ClipResolver } from "@/lib/album/resolver";
import { resolveLiveStyleId } from "@/lib/reel/live/window";
import { probeClipSupport, useClipSupport } from "@/lib/reel/clip-support";
import { NO_ENCODER_WORDS } from "@/lib/reel/clip-words";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import { preloadReelCreator, type ReelCreator } from "./creator-seam";

export type ReelViewProps = {
  mode: ReelMode;
  /** The screen posture below the minimum: the code and the address alone. */
  idle: boolean;
  eventId: string;
  /** The event's name, for the clip's room (never drawn on the reel itself). */
  eventName: string;
  joinUrl: string;
  displayAddress: string;
  qrStyle: string;
  isDemo: boolean;
  /** The list the reel plays (the controller's; see live-reel.tsx): the manifest's items, no urls. */
  playable: readonly LiveMediaItem[];
  onAddYours?: () => void;
  creator: ReelCreator | null;
  addClipToAlbum: ((file: File, poster: Blob) => void) | null;
  /** The album holds guests' uploads for the host's review (the creator's Add to event says so). */
  moderated?: boolean;
  /**
   * The creator was asked for before the view opened (the tile's "Make your own clip to share"): it
   * opens the moment this browser is known to make clips, or the greyed button explains why not.
   */
  creatorAsked?: boolean;
  /** The ask is spent (read once, on arrival). */
  onCreatorAskSpent?: () => void;
  /** The event's owner is watching (the host's extras: Play on a screen, Set for everyone). */
  isOwner?: boolean;
  /**
   * The owner's "Set for everyone": the look and hold this device shows become the event's defaults
   * (reel-defaults-migration's `setReelDefaults`, bound by the controller). Resolves whether it took.
   */
  onSetForEveryone?: (look: {
    styleId: string;
    holdSec: number;
  }) => Promise<boolean>;
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
/** The longest the creator's room waits on the album's links before it opens with what has landed. */
const CREATOR_LINK_WAIT_MS = 5000;

export function LiveReelView({
  mode,
  idle,
  eventId,
  eventName,
  joinUrl,
  displayAddress,
  qrStyle,
  isDemo,
  playable,
  onAddYours,
  creator,
  addClipToAlbum,
  moderated = false,
  creatorAsked = false,
  onCreatorAskSpent,
  isOwner = false,
  onSetForEveryone,
  onClose,
}: ReelViewProps) {
  const live = useGalleryLive();
  // Links by id: the reel reads them at each window, the arrivals' names ride them, the creator's
  // pool waits on them.
  const clips = live?.clips ?? null;
  const reduced = usePrefersReducedMotion();
  const screen = mode === "screen";
  // A desk: the code toggle and the owner's Play on a screen live here and nowhere smaller (a phone
  // has no room to show a wall its code, and nobody casts a screen from one).
  const desktop = useMediaQuery("(min-width: 1024px)");
  const qrToken = live?.qrToken ?? "";

  /* ── the viewer's own knobs, kept on this device ─────────────────────────── */
  const hostStyle = live?.reel?.styleId ?? null;
  const hostHold = live?.reel?.holdSec ?? null;
  const [holdSec, setHoldSec] = useState(() => readHoldSec(qrToken, hostHold));
  const [styleId, setStyleId] = useState(
    () => readStyleId(qrToken) ?? resolveLiveStyleId(hostStyle),
  );
  // ★ A VIEW THAT NEVER PICKED ITS OWN LOOK OR HOLD FOLLOWS THE EVENT'S LIVE (build 10's red-team:
  // "Set for everyone" toasts "Everyone sees this look now" to the room, but a screen already open
  // kept playing its mount-time look, though its next poll already carried the new one). The state
  // above resolves once, at mount; this ADJUSTS it DURING RENDER (React's own pattern for state
  // derived from a changing prop — never an effect, which costs an extra commit and trips
  // `react-hooks/set-state-in-effect`) whenever `live.reel` — a fresh poll's answer — moves, for as
  // long as this device has picked neither (`readStyleId` / `readOwnHoldSec`, both null; read fresh
  // each time, since a pick can land between renders), and never touches a device's own pick. No
  // reload: the state feeds the same player prop the dock's own Style/Hold controls already write
  // live, so the new values simply carry into the window the player is about to draw, at the next hold.
  const [prevHostStyle, setPrevHostStyle] = useState(hostStyle);
  if (hostStyle !== prevHostStyle) {
    setPrevHostStyle(hostStyle);
    if (readStyleId(qrToken) === null) setStyleId(resolveLiveStyleId(hostStyle));
  }
  const [prevHostHold, setPrevHostHold] = useState(hostHold);
  if (hostHold !== prevHostHold) {
    setPrevHostHold(hostHold);
    if (readOwnHoldSec(qrToken) === null) setHoldSec(resolveHoldSec(hostHold));
  }
  const [includeVideos, setIncludeVideos] = useState(readIncludeVideos);
  const [showCode, setShowCode] = useState(screen);
  const holdScale = holdScaleFor(holdSec, styleId);
  const hasVideo = playable.some(
    (item) => item.type === "video" && isReelEligible(item),
  );

  /* ── play state ──────────────────────────────────────────────────────────── */
  // Reduced motion starts on the first frame with the dock up, on a screen too: there the host's
  // press is the explicit act that starts it.
  const [paused, setPaused] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  /* ── the source: the album's live list, fed as it changes ────────────────── */
  // Stills that failed to decode are re-minted by id (the watchdog), never the whole album.
  const reportExpiry = live?.reportPossibleExpiry;
  const [onFailedIds] = useState(
    () => (ids: readonly string[]) => reportExpiry?.(ids),
  );
  const source = useLiveSource(
    eventId,
    playable,
    live?.ownIds ?? null,
    live?.clips ?? null,
    onFailedIds,
  );
  const playerRef = useRef<LiveReelPlayerHandle>(null);
  const orientation = useViewportOrientation();
  const viewport = useViewportSize();

  /* ── the chrome: the bar that grows into the dock ────────────────────────── */
  const [chrome, setChrome] = useState<"up" | "rest">("up");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockFocus, setDockFocus] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Where the viewer opened from: the frame it grows out of and a video's moment (see openLightbox).
  const [viewerFrom, setViewerFrom] = useState<{
    origin: ViewerOrigin;
    startAt?: number;
  } | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  // The greyed Make your own's reason (`noencode=greyed`), bubbled up for a few seconds.
  const [whyNot, setWhyNot] = useState(false);
  // Never settles BY ITSELF while it is being used, while the reel is paused (a paused reel shows
  // its controls), under reduced motion (a control that vanishes unasked is exactly the motion
  // the setting exists to remove), or while a reason is bubbled up from it. The viewer can still
  // fold it away on purpose (the timeline).
  const pinned = paused || menuOpen || dockFocus || reduced || whyNot;
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
      // over, silently (nothing marks the seam).
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
  // ★ THE WATCHDOG RE-MINTS ONLY THE FAILING IDS: a still that fails to decode reaches the provider
  // through the source (`onFailedIds`, above) and a video window whose reader failed the way an
  // expired presign does through the player (`onExpired`), each by its own id; the count here only
  // decides the one Sentry report.
  const reportedRef = useRef(false);
  const onFailure = useCallback(
    (count: number) => {
      if (count >= FAILURE_REPORT_THRESHOLD && !reportedRef.current) {
        reportedRef.current = true;
        captureWarning("reel", "live reel: frames failing", {
          eventId,
          failures: count,
          surface: mode,
        });
      }
    },
    [eventId, mode],
  );
  const onExpired = useCallback(
    (clipId: string) => reportExpiry?.([clipId]),
    [reportExpiry],
  );

  /* ── the screen posture: plays in the window, one press fills it ─────────── */
  // The reel is already playing when a screen opens; the pill asks for the one thing a page cannot
  // take by itself, a user's press: fullscreen where the platform has it, and the wake lock (which
  // re-takes itself on every return to visible). Leaving fullscreen only brings the pill back: the
  // reel keeps playing and the lock keeps holding until the view closes.
  const [wakeLock] = useState(createWakeLock);
  const [fullscreenable] = useState(canFullscreen);
  const [filled, setFilled] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fill = useCallback(async () => {
    setPressed(true);
    // The host's explicit act starts a reel reduced motion held on its first frame.
    setPaused(false);
    void wakeLock.acquire();
    if (fullscreenable) setFilled(await enterFullscreen());
  }, [wakeLock, fullscreenable]);
  useEffect(() => {
    if (!screen) return;
    return onFullscreenChange(() => setFilled(isFullscreen()));
  }, [screen]);
  useEffect(
    () => () => {
      wakeLock.release();
      void exitFullscreen();
    },
    [wakeLock],
  );
  // What the pill still has to ask for: the fullscreen whenever the screen is not filled, or, where
  // there is no fullscreen at all, the wake lock once.
  const pillUp = screen && !idle && (fullscreenable ? !filled : !pressed);
  // The owner's second tab: the same view in its screen posture, for the laptop on the wall.
  const openOnScreen = useCallback(() => {
    window.open(
      withReelParam(window.location.href, "screen"),
      "_blank",
      "noopener",
    );
  }, []);

  /* ── the arrivals ────────────────────────────────────────────────────────── */
  const rows = useArrivalFeed({
    arrivals: live?.arrivals ?? EMPTY,
    playable,
    clips,
    nameOf: live?.nameOf ?? null,
    holdMs: holdSec * 1000,
    enabled: !idle,
  });

  /* ── the lightbox (a tap on the picture) ─────────────────────────────────── */
  const pausedBeforeRef = useRef(false);
  const pictureRef = useRef<HTMLDivElement>(null);
  // The viewer's reach: the photographs it is about to show get their links and their hearts.
  const [viewerIds, setViewerIds] = useState<string[]>([]);
  const ensureLinks = live?.ensureLinks;
  const onViewerNeedLinks = useCallback(
    (ids: readonly string[]) => {
      setViewerIds([...ids]);
      ensureLinks?.(ids);
    },
    [ensureLinks],
  );
  // The viewer walks the album's playable photographs as the grid draws them (every one an item,
  // its links arriving by id: `onNeedLinks`).
  const albumItems = live?.items;
  const lightboxItems = useMemo(
    () =>
      (albumItems ?? EMPTY_ITEMS).filter((item) => item.reelEligible !== false),
    [albumItems],
  );
  /**
   * The viewer grows the photograph out of the FRAME (the picture's own box, `kind: "reel"`) and,
   * with no `returnTo`, lands back in it on the way out; a video carries on from the reel's moment
   * (`startAt`) rather than its first frame. The player answers which clip is on screen and where
   * a playing video has reached (`moment()`); the caption's last report is the fallback.
   */
  const openLightbox = useCallback(() => {
    const moment = playerRef.current?.moment() ?? null;
    const id = moment?.clipId ?? onScreenRef.current?.id;
    if (!id) return;
    const index = lightboxItems.findIndex((m) => m.id === id);
    if (index < 0) return;
    const box = pictureRef.current?.getBoundingClientRect() ?? null;
    const videoSec =
      lightboxItems[index].type === "video" && moment?.clipId === id
        ? moment.videoSec
        : null;
    pausedBeforeRef.current = paused;
    setPaused(true);
    setViewerFrom({
      origin: {
        kind: "reel",
        rect: box && box.width > 0 && box.height > 0 ? box : null,
      },
      ...(videoSec !== null ? { startAt: videoSec } : {}),
    });
    setLightboxIndex(index);
  }, [lightboxItems, paused]);
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setPaused(pausedBeforeRef.current);
  }, []);

  /* ── the creator (the clip's own room, through the seam) ──────────────────── */
  // The host's plan for a clip, the server's (null where it could not be read: no creator then).
  const clipFacts = live?.reel?.clip ?? null;
  const creatorOffered = Boolean(creator && clipFacts);
  // Asked of the device once per page, and only when a clip could be offered at all.
  const support = useClipSupport(creatorOffered);
  // The greyed button's reason, bubbled up for a few seconds after a tap (never a paragraph over the
  // reel). A tap while the probe is still out waits for its answer.
  const whyNotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explainNoEncoder = useCallback(() => {
    setWhyNot(true);
    if (whyNotTimer.current) clearTimeout(whyNotTimer.current);
    whyNotTimer.current = setTimeout(() => setWhyNot(false), 4200);
  }, []);
  useEffect(
    () => () => {
      if (whyNotTimer.current) clearTimeout(whyNotTimer.current);
    },
    [],
  );
  /* ★ THE CREATOR PICKS FROM THE WHOLE ALBUM, SO ITS LINKS COME FIRST. The room clips from every
     playable photograph (its own pool, its own fills), and on the paged album most of them have no
     link yet: the room opens on its dark ground while the album's playable links are minted
     (batched, by id, through the same resolver the reel reads), and mounts once they are in or a
     bounded wait has passed, so its first fill is chosen from the whole album, never from the
     handful that happened to be on screen. */
  const [creatorReady, setCreatorReady] = useState(false);
  const creatorAsk = useRef(0);
  const enterCreator = useCallback(() => {
    pausedBeforeRef.current = paused;
    setPaused(true);
    setCreatorOpen(true);
    setCreatorReady(false);
    const ask = ++creatorAsk.current;
    const ready = () => {
      if (creatorAsk.current === ask) setCreatorReady(true);
    };
    const ids = playable.filter(isReelEligible).map((item) => item.id);
    if (!clips || ids.length === 0) {
      ready();
      return;
    }
    const timer = setTimeout(ready, CREATOR_LINK_WAIT_MS);
    void clips.ensure(ids).then(() => {
      clearTimeout(timer);
      ready();
    });
  }, [paused, playable, clips]);
  const openCreator = useCallback(() => {
    if (support === "yes") {
      enterCreator();
      return;
    }
    if (support === "no") {
      explainNoEncoder();
      return;
    }
    void probeClipSupport().then((ok) => {
      if (ok) enterCreator();
      else explainNoEncoder();
    });
  }, [support, enterCreator, explainNoEncoder]);
  // The tile's own line asked for the creator before the view existed: answered once the device
  // has, with the dock up so a greyed door is where the explanation points. The ask is spent only
  // when the answer lands, so a remount on the way (React's own double run) never drops it.
  const askRef = useRef(creatorAsked);
  useEffect(() => {
    if (!askRef.current || !creatorOffered) return;
    let alive = true;
    void probeClipSupport().then((ok) => {
      if (!alive || !askRef.current) return;
      askRef.current = false;
      onCreatorAskSpent?.();
      if (ok) {
        enterCreator();
      } else {
        setChrome("up");
        explainNoEncoder();
      }
    });
    return () => {
      alive = false;
    };
  }, [creatorOffered, enterCreator, explainNoEncoder, onCreatorAskSpent]);

  // The dock's pane: the greyed door's reason is placed above it (the pane clips what it holds).
  const dockRef = useRef<HTMLDivElement>(null);

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
        setPaused((p) => !p);
        wake();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (idle) return;
        e.preventDefault();
        playerRef.current?.step(e.key === "ArrowRight" ? 1 : -1);
        wake();
        return;
      }
      if (e.key !== "Escape") wake();
    },
    [lightboxIndex, creatorOpen, idle, wake],
  );

  const effectivePaused = paused;
  const moods = useMemo(() => liveMoods(), []);
  const styleLabel = moods.find((m) => m.id === styleId)?.label ?? "Cinematic";
  const qr = useMemo(
    () => qrSizing({ joinUrl, qrStyle, viewport, screen }),
    [joinUrl, qrStyle, viewport, screen],
  );

  /* ── the owner's Set for everyone ────────────────────────────────────────── */
  // What everyone sees: the event's defaults, or what this device just set for everyone (the next
  // poll's facts say the same thing a moment later).
  const [setLook, setSetLook] = useState<{
    styleId: string;
    holdSec: number;
  } | null>(null);
  const everyoneLook = setLook ?? {
    styleId: resolveLiveStyleId(hostStyle),
    holdSec: resolveHoldSec(hostHold),
  };
  const lookIsEveryones =
    everyoneLook.styleId === styleId && everyoneLook.holdSec === holdSec;
  const setForEveryone = useCallback(async () => {
    if (!onSetForEveryone) return;
    const look = { styleId, holdSec };
    const ok = await onSetForEveryone(look);
    if (ok) {
      setSetLook(look);
      toast.success("Everyone sees this look now");
    } else {
      toast.error("Couldn't set it for everyone. Try again.");
    }
  }, [onSetForEveryone, styleId, holdSec]);
  const styleFooter =
    isOwner && onSetForEveryone ? (
      <SetForEveryoneFooter
        isEveryones={lookIsEveryones}
        onSet={setForEveryone}
      />
    ) : undefined;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* ★ THE OVERLAY IS THE PAGE'S SCROLL LOCK, AND IT HOLDS THE VIEW. Radix locks the page in the
            Overlay (its RemoveScroll, which also takes the desk's scrollbar away), never in Content, so
            a view with no Overlay left the album scrolling under it and a 15 px scrollbar strip down
            the right of the picture (build 9's red-team). The view sits INSIDE it (Radix's scrollable
            overlay shape) rather than beside it, so everything the view portals out (the dock's
            Style and Hold menus) is still inside the lock by React's tree and keeps its own scroll. */}
        <DialogPrimitive.Overlay
          data-live-reel-overlay
          className="fixed inset-0 z-50 bg-black"
        >
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
                ref={pictureRef}
                className="absolute inset-0"
                // While the pill is up, a press anywhere is the press it asks for.
                onClick={pillUp ? () => void fill() : openLightbox}
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
                  onExpired={onExpired}
                />
              </div>
            )}

            {/* ON A SCREEN, BELOW THE MINIMUM: the code and the address alone, until the reel returns
              (a screen whose album drops under two while it plays, or reloads there). */}
            {idle && (
              <IdleCode
                joinUrl={joinUrl}
                address={displayAddress}
                qrStyle={qrStyle}
                size={qr.idle}
              />
            )}

            {/* ON A SCREEN: the one press, asked for at the top while it is still owed. */}
            {pillUp && (
              <FillPill
                fullscreen={fullscreenable}
                onPress={() => void fill()}
              />
            )}

            {/* The top edge's legibility: a whisper, only while chrome or a chip is up. */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-200 ease-emphasis",
                chromeUp || rows.length > 0 || pillUp
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />

            {/* THE ARRIVALS, top left. */}
            {!idle && <ArrivalFeed rows={rows} screen={screen} />}

            {/* CLOSE, top right: shows and hides with the dock. */}
            <div
              className="lr-follow absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-30"
              data-state={chromeUp || idle ? "up" : "rest"}
            >
              <TooltipProvider delayDuration={350} skipDelayDuration={250}>
                <ChromeButton label="Close" onClick={onClose} shortcut="Esc">
                  <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
                </ChromeButton>
              </TooltipProvider>
            </div>

            {/* THE CODE, bottom right: lifted above the dock when the dock is up. */}
            {showCode && !idle && (
              <div
                className="pointer-events-none absolute right-3 z-20 transition-transform duration-200 ease-emphasis motion-reduce:transition-none sm:right-5"
                style={{
                  bottom: `calc(${screen ? "1.5rem" : "0.75rem"} + env(safe-area-inset-bottom))`,
                  transform:
                    chromeUp && viewport.w < 720
                      ? `translateY(-${creatorOffered ? 150 : 104}px)`
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
            {!idle && (
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
                  writeHoldSec(qrToken, sec);
                }}
                showCode={showCode}
                onToggleCode={
                  desktop ? () => setShowCode((on) => !on) : undefined
                }
                onPlayOnScreen={isOwner && desktop ? openOnScreen : undefined}
                styleFooter={styleFooter}
                onAddYours={onAddYours}
                onMakeYourOwn={creatorOffered ? openCreator : undefined}
                makeGreyed={support === "no"}
                whyNot={whyNot}
                paneRef={dockRef}
                onMenuOpenChange={setMenuOpen}
                onFocusWithin={setDockFocus}
                addLabel={isDemo ? "Add yours (a demo upload)" : "Add yours"}
              />
            )}

            {/* THE GREYED DOOR'S REASON (`noencode=greyed`): bubbled up over the dock for a few seconds
              after a tap, never a paragraph standing over the reel. */}
            {!idle && creatorOffered && support === "no" && whyNot && (
              <WhyNotBubble anchor={dockRef} />
            )}

            {/* THE MEDIA VIEWER, for a tapped photograph: grown out of the frame, a video carrying on
              from the reel's moment. Its own likes, since the album's provider sits in the grid. */}
            {lightboxIndex !== null && (
              <LikesProvider mediaIds={viewerIds}>
                <MediaLightboxLazy
                  items={lightboxItems}
                  index={lightboxIndex}
                  onClose={closeLightbox}
                  onIndexChange={setLightboxIndex}
                  shareUrl={joinUrl}
                  origin={viewerFrom?.origin}
                  startAt={viewerFrom?.startAt}
                  onNeedLinks={onViewerNeedLinks}
                />
              </LikesProvider>
            )}

            {/* THE CREATOR: the clip's own room, a dialog of its own over this one (so Escape, focus
              and the reader's world are its own while it is open). The chunk arrives on the tap;
              until it lands the room's ground covers the reel, so nothing flashes through. */}
            {creatorOpen && creator && clipFacts && !creatorReady && (
              <div
                aria-hidden
                className="absolute inset-0 z-40 bg-[oklch(0.11_0_0)]"
              />
            )}
            {creatorOpen && creator && clipFacts && creatorReady && (
              <Suspense
                fallback={
                  <div
                    aria-hidden
                    className="absolute inset-0 z-40 bg-[oklch(0.11_0_0)]"
                  />
                }
              >
                {(() => {
                  const Creator = creator;
                  return (
                    <Creator
                      items={lightboxItems}
                      styleId={styleId}
                      eventId={eventId}
                      eventName={eventName}
                      facts={clipFacts}
                      addClipToAlbum={addClipToAlbum}
                      isOwner={isOwner}
                      moderated={moderated}
                      ownIds={live?.ownIds ?? null}
                      onClose={() => {
                        creatorAsk.current += 1;
                        setCreatorOpen(false);
                        setCreatorReady(false);
                        setPaused(pausedBeforeRef.current);
                      }}
                    />
                  );
                })()}
              </Suspense>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
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
  items: readonly LiveMediaItem[],
  ownIds: ReadonlySet<string> | null,
  resolver: ClipResolver | null,
  onFailedIds: (ids: readonly string[]) => void,
): ClipSource {
  // ★ ON THE PAGED ALBUM THE SOURCE PLANS FROM THE MANIFEST AND READS LINKS BY ID: the items carry no
  // urls, the resolver mints them a window or two ahead of each clip's turn and the source reads them
  // at the moment it builds a window (live/source.ts). The watchdog (the provider's, one stable
  // function for its life) hears exactly the ids whose stills failed.
  const [source] = useState(() =>
    createClipSource({
      eventId,
      items,
      ownIds,
      resolver: resolver ?? undefined,
      onFailedIds,
    }),
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

/** The composition follows the viewport: portrait on a phone, landscape at a laptop or a
 *  television. */
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
 * opened: nobody is announced for having been there already). A clip arriving is not a photograph in
 * the reel, so it names nobody.
 */
function useArrivalFeed({
  arrivals,
  playable,
  clips,
  nameOf,
  holdMs,
  enabled,
}: {
  arrivals: readonly string[];
  /** The reel's items (the manifest's): an arrival that cannot play (a clip) names nobody. */
  playable: readonly LiveMediaItem[];
  /** The links by id: an arrival's name rides its link's attribution. */
  clips: ClipResolver | null;
  nameOf: ((id: string) => string | null) | null;
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
    const byId = new Map(playable.map((item) => [item.id, item]));
    const eligible = fresh.filter((id) => {
      const item = byId.get(id);
      return Boolean(item && isReelEligible(item));
    });
    if (eligible.length === 0) return;
    // ★ THE NAME RIDES THE LINK. On the paged album an arrival's attribution comes with its link, so
    // the feed asks for the arrivals' links first (the reel is about to play them anyway) and names
    // them when they land, a beat later, rather than naming nobody.
    const push = () =>
      store.push(
        eligible.map((id) => ({ id, name: nameOf?.(id) ?? null })),
        holdMs,
      );
    if (!clips) {
      push();
      return;
    }
    let active = true;
    void clips.ensure(eligible).then(() => {
      if (active) push();
    });
    return () => {
      active = false;
    };
  }, [arrivals, playable, clips, nameOf, holdMs, enabled, store]);
  useEffect(() => () => store.dispose(), [store]);
  return useMemo(() => arrivalRows(feed), [feed]);
}

function ArrivalFeed({
  rows,
  screen,
}: {
  rows: ArrivalRow[];
  screen: boolean;
}) {
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

/** INK: type over a photograph carries its own light (a dark halo is invisible over a dark frame
 *  and the whole difference over a bright one). */
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
            // section step would break "Scan to add yours" over two lines at a laptop's width.)
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

/* ── the screen's one press ────────────────────────────────────────────────── */

/**
 * A glass pill at the top of a screen that is not filled yet: the reel is already playing behind it,
 * and a press anywhere (the pill included) fills the screen and keeps it awake. Where the platform
 * has no fullscreen (a phone's browser), the press keeps the screen awake and the pill says so.
 */
function FillPill({
  fullscreen,
  onPress,
}: {
  fullscreen: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      data-reel-fill
      className={cn(
        "absolute top-[calc(0.75rem+env(safe-area-inset-top))] left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full px-4 text-working font-medium whitespace-nowrap text-white outline-none",
        "transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:active:scale-100",
        "focus-visible:ring-2 focus-visible:ring-white/70",
        GLASS,
      )}
    >
      <Maximize2 className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
      {fullscreen
        ? "Press anywhere to fill the screen"
        : "Press anywhere to keep the screen awake"}
    </button>
  );
}

/* ── the owner's footer under the Style list ───────────────────────────────── */

/**
 * The look is the viewer's own until the host says otherwise: an owner who likes what this device
 * shows can make it the event's default (the look and the hold), which every guest who has not
 * picked their own then sees. When the device already shows the event's defaults there is nothing
 * to set, and the footer says whose look this is.
 */
function SetForEveryoneFooter({
  isEveryones,
  onSet,
}: {
  isEveryones: boolean;
  onSet: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <DropdownMenuFooter data-reel-set-everyone>
      <p className="px-2 pt-1 text-caption text-muted-foreground">
        {isEveryones
          ? "Everyone sees this look"
          : "Only on this device, for now"}
      </p>
      {!isEveryones && (
        <DropdownMenuItem
          disabled={saving}
          onSelect={(e) => {
            // Stay open: the answer lands in the footer (and a toast), not in a closed menu.
            e.preventDefault();
            setSaving(true);
            void onSet().finally(() => setSaving(false));
          }}
          className="mx-1 mb-1 h-8 justify-center rounded-full border border-border font-medium"
        >
          {saving ? "Setting…" : "Set for everyone"}
        </DropdownMenuItem>
      )}
    </DropdownMenuFooter>
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
        {shortcut ? (
          <kbd className="ml-1 text-background/60">{shortcut}</kbd>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function MenuButton({
  label,
  icon,
  stagger,
  onOpenChange,
  contentClassName,
  children,
}: {
  label: string;
  icon: ReactNode;
  stagger: number;
  onOpenChange: (open: boolean) => void;
  contentClassName?: string;
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
        className={cn("w-44", contentClassName)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The greyed Make your own's reason, over the dock it points from. The dock's pane clips whatever
 * it holds (its bar-to-dock morph is a clip-path), so the reason stands outside it, placed by the
 * pane's own box: measured by a ResizeObserver, which also answers once as it starts watching.
 */
function WhyNotBubble({
  anchor,
}: {
  anchor: RefObject<HTMLDivElement | null>;
}) {
  const [bottom, setBottom] = useState<number | null>(null);
  useEffect(() => {
    const pane = anchor.current;
    if (!pane) return;
    const place = () =>
      setBottom(window.innerHeight - pane.getBoundingClientRect().top + 10);
    const watch = new ResizeObserver(place);
    watch.observe(pane);
    window.addEventListener("resize", place);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [anchor]);
  return (
    <span
      id="lr-why-not"
      data-reel-why-not
      role="status"
      style={bottom === null ? undefined : { bottom }}
      className="absolute bottom-40 left-1/2 z-40 w-max max-w-[min(27ch,calc(100vw-2rem))] -translate-x-1/2 rounded-float bg-popover px-3 py-2 text-center text-caption text-popover-foreground shadow-layer ring-1 ring-foreground/10"
    >
      {NO_ENCODER_WORDS}
      <span
        aria-hidden
        className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-popover"
      />
    </span>
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
  onPlayOnScreen,
  styleFooter,
  onAddYours,
  onMakeYourOwn,
  makeGreyed = false,
  whyNot = false,
  paneRef,
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
  /** Absent below a desk's width: no toggle at all (the code keeps whatever state it was in). */
  onToggleCode?: () => void;
  /** The owner at a desk: the same view in its screen posture, in a new tab. */
  onPlayOnScreen?: () => void;
  /** The owner's footer under the Style list (Set for everyone). */
  styleFooter?: ReactNode;
  onAddYours?: () => void;
  onMakeYourOwn?: () => void;
  /** This browser cannot encode: the door stays, greyed, and a tap explains. */
  makeGreyed?: boolean;
  /** The greyed door's reason is bubbled up right now (drawn by the view, above the pane). */
  whyNot?: boolean;
  /** The pane itself, which the reason is placed above. */
  paneRef?: RefObject<HTMLDivElement | null>;
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
          "w-max max-w-[calc(100vw-1.5rem)] min-w-[15rem]",
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
        ref={paneRef}
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
        <div className="lr-dock-content flex flex-col gap-2 p-2" inert={!up}>
          <div className="flex items-center justify-center gap-1">
            <ChromeButton
              label={playing ? "Pause" : "Play"}
              onClick={onTogglePlay}
              shortcut="Space"
              stagger={i++}
              className=""
            >
              {playing ? (
                <Pause
                  className={cn("size-[18px] fill-white", GLASS_MARK_LIT)}
                  aria-hidden
                />
              ) : (
                <Play
                  className={cn(
                    "ml-0.5 size-[18px] fill-white",
                    GLASS_MARK_LIT,
                  )}
                  aria-hidden
                />
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
                  <Video
                    className={cn("size-[18px]", GLASS_MARK_LIT)}
                    aria-hidden
                  />
                ) : (
                  <VideoOff
                    className={cn("size-[18px]", GLASS_MARK_LIT)}
                    aria-hidden
                  />
                )}
              </ChromeButton>
            )}
            <MenuButton
              label={`Style: ${styleLabel}`}
              icon={
                <Palette
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              }
              stagger={i++}
              onOpenChange={onMenuOpenChange}
              contentClassName={styleFooter ? "w-60" : undefined}
            >
              <DropdownMenuLabel>Style</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={styleId} onValueChange={onStyle}>
                {moods.map((mood) => (
                  <DropdownMenuRadioItem key={mood.id} value={mood.id}>
                    {mood.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {styleFooter}
            </MenuButton>
            <MenuButton
              label={`Hold: ${holdLabel(holdSec)} a photo`}
              icon={
                <Clock3
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              }
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
            {onToggleCode && (
              <ChromeButton
                label={showCode ? "Hide the code" : "Show the code"}
                onClick={onToggleCode}
                pressed={showCode}
                stagger={i++}
                className=""
              >
                <QrCode
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              </ChromeButton>
            )}
            {onAddYours && (
              <ChromeButton
                label={addLabel}
                onClick={onAddYours}
                stagger={i++}
                className=""
              >
                <ImagePlus
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              </ChromeButton>
            )}
            {onPlayOnScreen && (
              <ChromeButton
                label="Play on a screen"
                onClick={onPlayOnScreen}
                stagger={i++}
                className=""
              >
                <MonitorPlay
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
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
            <div className="relative flex flex-col">
              <button
                type="button"
                onClick={onMakeYourOwn}
                onPointerEnter={makeGreyed ? undefined : preloadReelCreator}
                onFocus={makeGreyed ? undefined : preloadReelCreator}
                aria-disabled={makeGreyed || undefined}
                aria-describedby={
                  makeGreyed && whyNot ? "lr-why-not" : undefined
                }
                data-lr-stagger=""
                data-reel-make={makeGreyed ? "greyed" : "ready"}
                style={{ "--lr-i": i++ } as CSSProperties}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold outline-none",
                  "transition-transform duration-150 ease-emphasis active:scale-[0.98] motion-reduce:active:scale-100",
                  "focus-visible:ring-2 focus-visible:ring-white/70",
                  makeGreyed
                    ? "border border-white/20 text-white/35"
                    : "bg-reel text-white",
                )}
              >
                <Wand2 className="size-4" aria-hidden />
                Make your own
              </button>
            </div>
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
            <Pause
              className={cn("size-3 fill-white", GLASS_MARK_LIT)}
              aria-hidden
            />
          ) : (
            <Play
              className={cn("size-3 fill-white", GLASS_MARK_LIT)}
              aria-hidden
            />
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
        style={{
          transform: `scaleX(${Math.max(0.04, Math.min(1, progress))})`,
        }}
      />
    </span>
  );
}
