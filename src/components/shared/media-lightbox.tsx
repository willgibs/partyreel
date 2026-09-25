"use client";

import "./media-lightbox.css";

import {
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { GLASS, GLASS_BEHIND, GLASS_MARK_LIT } from "@/lib/glass";
import { DeleteConsequence } from "@/lib/guest/delete-consequence";
import { videoPosterSrc } from "@/lib/media/poster";
import { detectPlatform, type NavigatorLike } from "@/lib/media/share-save";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import { ActionCapsule } from "./media-lightbox-parts/actions";
import { FaceCredit, type ViewerMedia } from "./media-lightbox-parts/credit";
import { Filmstrip, FILMSTRIP_REACH } from "./media-lightbox-parts/filmstrip";
import {
  CHROME,
  ZOOM_MAX,
  ZOOM_REST,
  coverFrame,
  dismissCommits,
  dismissPose,
  fitRect,
  mediaBox,
  onScreen,
  panBounds,
  peekMetrics,
  pinchZoom,
  restFrame,
  rubber,
  seenFrame,
  settleZoom,
  slotShift,
  strideFor,
  zoomAbout,
  type Point,
  type Rect,
  type Size,
  type Zoom,
} from "./media-lightbox-parts/geometry";
import { useVideoState, VideoTransport } from "./media-lightbox-parts/video";

export type { CreditFace, ViewerMedia } from "./media-lightbox-parts/credit";

// THE SHARED FULL-SCREEN VIEWER for every gallery (the guest album, the host's
// feed and bin, the profile's uploads and likes, the admin's albums), composed
// from the radix Dialog PRIMITIVES rather than the wrapped <DialogContent>: a
// viewer is an edge-to-edge takeover over the album blurred, not a max-w-sm
// popover, and composing still gives radix's focus trap, Escape and scroll lock.
// `index` is controlled by the grid so prev/next walks the whole set; null =
// closed.
//
// ★ media-viewer r1 (2026-09-24): the photograph GROWS out of
// the tile it was tapped on (or out of the reel's frame) and drops back into it
// on the way out; a face-led credit at the top left; the floating action capsule
// at the foot; the neighbours PEEK at the edges (a subtle filmstrip at a desk);
// PINCH to get close; a video plays muted with a scrubber; a pull DOWN or a tap
// on blank space closes; Share sends the file and Save reaches Photos first on
// iOS. The geometry is `media-lightbox-parts/geometry.ts` (pure, unit-tested);
// the chrome is the parts beside it.
//
// MOBILE SWIPE (peek-the-neighbor, kept): on touch, the media area is a 3-slot
// windowed track [prev, current, next] that follows the finger; release commits
// to a neighbor (distance OR flick velocity) or springs back. Slots are keyed by
// item id so the slid-to neighbor's already-loaded media is REUSED when it
// becomes current. A neighbor's media stands off its centred place by its peek
// shift, so `peek` px of its own edge shows at rest, and the track moves by the
// current photograph's STRIDE, so the photograph under the finger follows it one
// to one and the swap after a commit moves nothing (geometry.ts proves both).
//
// THE PAGED ALBUM (album-guest-wiring): a surface may hand the WHOLE album as
// `items`, most of it not linked yet (`url` is "", with no preview, no download
// link and no attribution; the id, type, size and length are known). Next and
// previous cross the whole list and "Photo k of N" is its length. The viewer asks
// `onNeedLinks` for the links it is about to draw, the caller re-renders it with
// each item's links as they land, and until then an item draws a placeholder at
// its own shape and never a request (`ViewerPhoto`, and the clip in `renderMedia`).

// Gesture tuning: screen px / px-per-ms; tunable on real-device feel.
const DIR_LOCK_PX = 10; // travel before we commit to horizontal vs vertical/tap
const COMMIT_RATIO = 0.2; // slow drag commits past 20% of the stride
const COMMIT_VELOCITY = 0.25; // OR a quick flick (px/ms) commits regardless of distance
const SETTLE_MS = 240; // commit settle (< 300ms per the motion budget)
const SPRINGBACK_MS = 200; // release-snap is a touch quicker than a commit
const FLIGHT_IN_MS = 280; // the photograph growing out of its tile
const FLIGHT_OUT_MS = 220; // ...and dropping back (exits faster than entrances)
const ZOOM_SETTLE_MS = 200;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP_PX = 30;
const DOUBLE_TAP_ZOOM = 2.5;

// Slot = one full-stage-width cell of the track. 3 of them = 300% wide; the track
// is translated so the middle slot sits in the (overflow-hidden) stage viewport.
const SLOT_CLASS = "relative h-full shrink-0 grow-0 basis-full";

/** A rect in viewport px (a DOMRect satisfies it). */
export type ViewerRect = Rect;

/**
 * WHERE A PHOTOGRAPH OPENED FROM (`opening=grow`): the box it grows out of and
 * what kind of box that is. A tile in an album passes its own rect and a way to
 * find the tile of whichever photograph is showing at close (the viewer may have
 * moved on), so the photograph drops into ITS tile; the live reel passes its
 * frame's rect and no `returnTo`, so the way out lands back in the frame. Focus
 * returns to the element `returnTo` finds. A null `rect` grew from nowhere on
 * screen (the grid opening `?photo=` on load): it fades in, and still returns.
 */
export type ViewerOrigin = {
  kind: "tile" | "reel";
  rect: ViewerRect | null;
  returnTo?: (item: GridMedia) => HTMLElement | null;
};

/** A rect a photograph can grow out of or drop into: on the page and not empty. */
const isRealRect = (r: ViewerRect | null | undefined): r is ViewerRect =>
  !!r && r.width > 0 && r.height > 0;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  axis: "unknown" | "x" | "y" | "pan";
  width: number; // the stride a commit travels
  startOffset: number;
  hasPrev: boolean;
  hasNext: boolean;
  captured: boolean;
  zoom0: Zoom;
};

type Pinch = {
  ids: [number, number];
  start: Zoom & { mid: Point; dist: number };
};

// Diminishing-returns damping past the first/last item: the end feels elastic
// (slows toward a soft limit) instead of hitting an invisible wall.
function damp(raw: number, width: number) {
  const maxPull = width * 0.18;
  const pulled = maxPull * (1 - 1 / (Math.abs(raw) / maxPull + 1));
  return Math.sign(raw) * pulled;
}

// Turn a raw finger delta into the on-screen offset: full follow toward a real
// neighbor (clamped to one stride), damped friction toward a missing one.
function applyFriction(
  raw: number,
  width: number,
  hasPrev: boolean,
  hasNext: boolean,
) {
  if ((raw > 0 && !hasPrev) || (raw < 0 && !hasNext)) return damp(raw, width);
  return Math.max(-width, Math.min(width, raw));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A CSS token read at the moment it is used, with its value as the fallback. */
function token(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}
const drawerEase = () =>
  token("--ease-drawer", "cubic-bezier(0.32, 0.72, 0, 1)");
const emphasisEase = () =>
  token("--ease-emphasis", "cubic-bezier(0.23, 1, 0.32, 1)");
const tileRadius = () => parseFloat(token("--radius-tile", "4px")) || 4;

const canAnimate = (el: Element | null): el is HTMLElement =>
  !!el && typeof (el as HTMLElement).animate === "function";

const FOCUSABLE = "button, a[href], [tabindex]:not([tabindex='-1'])";

/**
 * A clip's sound, set on the element. Module-level on purpose: the element is
 * the viewer's to drive imperatively (React's `muted` prop only sets the first
 * value), and the compiler's immutability rule reads an assignment on a ref's
 * element inside an effect as a write to a frozen value.
 */
function setMuted(v: HTMLVideoElement, muted: boolean) {
  v.muted = muted;
}

function zoomTransform(z: Zoom) {
  return `translate3d(${z.tx}px, ${z.ty}px, 0) scale(${z.s})`;
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Whether a key event belongs to a control that owns the keys itself. */
function ownsKeys(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest(
    "[role='slider'], [role='menu'], [role='menuitem'], input, textarea, select, [contenteditable='true']",
  );
}

/**
 * The ids within `reach` of `index` that have no link yet, NEAREST FIRST (the
 * item on screen, then the next, the previous, and outward), so a caller that
 * batches or caps what it asks for mints the photograph in front of the guest
 * first.
 */
function unlinkedNear(
  items: readonly GridMedia[],
  index: number,
  reach: number,
): string[] {
  const out: string[] = [];
  const take = (k: number) => {
    const item = items[k];
    if (item && !item.url) out.push(item.id);
  };
  take(index);
  for (let d = 1; d <= reach; d++) {
    take(index + d);
    take(index - d);
  }
  return out;
}

/** A picture's layer in its media box: it fills the box. */
const MEDIA_FILL =
  "absolute inset-0 size-full select-none [-webkit-user-drag:none]";

/**
 * WHERE A PICTURE WILL BE, BEFORE ITS LINK HAS COME. A quiet fill at the item's
 * own shape: its known size, fitted (the media box IS the fit rect then), or the
 * tile's 1:1 centred in the box when the size is unknown, which is the shape its
 * tile had. In the viewer's white-on-dark grammar (the filmstrip's empty frame)
 * rather than the page's `Skeleton`, whose `bg-muted` is a pale sheet in the
 * light theme over a ground that is dark in both.
 *
 * ★ STATIC, NEVER A SHIMMER: a link that never lands (an item the album has
 * just dropped) must not read as loading for ever.
 */
function Placeholder({ frame, fitted }: { frame: Size; fitted: boolean }) {
  const side = Math.min(frame.width, frame.height);
  return (
    <span
      data-lightbox-placeholder
      aria-hidden
      className={cn("absolute bg-white/10", fitted && "inset-0")}
      style={
        fitted
          ? undefined
          : {
              left: (frame.width - side) / 2,
              top: (frame.height - side) / 2,
              width: side,
              height: side,
              borderRadius: "var(--radius-tile)",
            }
      }
    />
  );
}

/**
 * A PHOTOGRAPH IN A SLOT, AS FAR AS ITS LINKS HAVE COME. Linked, it is what it
 * always was: the tile's preview at once, the original fading in over it. Not
 * linked yet, it is its placeholder and no `<img>` at all (an empty `src`
 * resolves against the page and fetches it); a preview with no original yet is
 * drawn alone.
 *
 * ★ THE PLACEHOLDER HOLDS UNTIL A PICTURE PAINTS. When the link lands the
 * pictures mount OVER the placeholder, and it leaves once the first of them has
 * loaded, so the slot goes from the fill to the photograph, never through the
 * bare ground between. An item that arrives linked never shows it (every
 * surface as it was); one whose link lapses back to nothing shows it again.
 */
function ViewerPhoto({
  item,
  isCenter,
  fit,
  frame,
  onSize,
}: {
  item: ViewerMedia;
  isCenter: boolean;
  fit: Rect | null;
  frame: Size;
  onSize: (id: string, width: number, height: number) => void;
}) {
  const full = item.url || null;
  const preview = item.previewUrl || null;
  const hasPicture = full !== null || preview !== null;
  const [waiting, setWaiting] = useState(!hasPicture);
  if (!hasPicture && !waiting) setWaiting(true);
  const painted = () => setWaiting(false);
  const cover = fit ? "object-cover" : "object-contain";
  const overPreview = preview !== null && preview !== full;
  return (
    <>
      {waiting && <Placeholder frame={frame} fitted={fit !== null} />}
      {overPreview && (
        // The tile's own preview, already in the cache: the photograph
        // that flies out of the tile is the one the tile was showing.
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={preview}
          alt=""
          draggable={false}
          onLoad={painted}
          className={cn(MEDIA_FILL, cover)}
        />
      )}
      {full !== null && (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={full}
          alt=""
          draggable={false}
          aria-hidden={!isCenter}
          data-lightbox-full={overPreview ? "" : undefined}
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) el.dataset.loaded = "";
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            img.dataset.loaded = "";
            onSize(item.id, img.naturalWidth, img.naturalHeight);
            painted();
          }}
          className={cn(MEDIA_FILL, cover)}
        />
      )}
    </>
  );
}

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
  viewerIsHost = false,
  onDeleteCurrent,
  canDelete,
  shareUrl,
  onSetStatus,
  onRemove,
  onRestore,
  onPurge,
  origin,
  startAt,
  onNeedLinks,
}: {
  items: ViewerMedia[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Host gallery? Drives the host-only address line AND the host curate group
   *  (hide/show + remove) when the moderation handlers are set. */
  viewerIsHost?: boolean;
  /**
   * Opt-in delete (the personal "Uploads" tab, and a guest's own photographs on the album). When set,
   * a Trash button shows in the capsule behind a confirm; the caller owns the removal + closing the
   * viewer (it shrinks the list).
   */
  onDeleteCurrent?: (item: GridMedia) => void;
  /**
   * THE SEAM (2026-09-20): gates `onDeleteCurrent` per item, so a surface that can delete SOME
   * photographs (a guest's own) shows the Trash only on those. Omitted = every item. It is also the
   * viewer's one "this is yours" answer: the credit reads "You" where it says yes.
   */
  canDelete?: (item: GridMedia) => boolean;
  /**
   * Opt-in Share and Copy link. The PUBLIC album link (the event's join link) on the guest album and
   * the host's feed alike; NEVER a presigned media URL and never a dashboard URL. Share sends the file
   * itself and falls back to this link (with `?photo=` on an approved item); Copy link copies it.
   * Omitted on the personal feeds and the recovery bin, so their capsule carries neither.
   */
  shareUrl?: string;
  /**
   * Host moderation, host-only (gated by `viewerIsHost && onSetStatus`). `onSetStatus` drives the
   * curate group's hide ("hidden") and show ("approved"); `onRemove` is the confirmed remove (the
   * caller closes the viewer, like onDeleteCurrent).
   */
  onSetStatus?: (item: GridMedia, status: "approved" | "hidden") => void;
  onRemove?: (item: GridMedia) => void;
  /**
   * The recovery bin's two verbs, at every width (its tile pane is a desk's): `onRestore` acts at
   * once, `onPurge` is the confirmed delete for good. Both shrink the set, so the caller closes the
   * viewer first, like onRemove. Omitted everywhere but the bin.
   */
  onRestore?: (item: GridMedia) => void;
  onPurge?: (item: GridMedia) => void;
  /** Where it opened from, so it grows out of it and drops back in (omitted = a plain fade). */
  origin?: ViewerOrigin;
  /** Opened from the reel on a video: carry on from the reel's moment (seconds) instead of the start. */
  startAt?: number;
  /**
   * THE LINK SOURCE, for a surface that hands the whole album with most of it unlinked (`url` "").
   * Called with the ids, nearest first, of the items about to be drawn that have no link yet: the
   * current item and one neighbour each side (the swipe track's three slots) and, while the desk's
   * filmstrip shows, the `FILMSTRIP_REACH` frames each side of it. It fires on open and on every
   * step, only with a non-empty list, keyed on the place and on the SET still missing: a plain
   * re-render (a new callback, a new array with the same gaps) never asks again, and a partial
   * landing asks only for what is still missing. The caller re-renders the viewer with each item's
   * links (and attribution) as they land. Omitted = every item arrives linked, as before.
   */
  onNeedLinks?: (ids: readonly string[]) => void;
}) {
  const current = index === null ? null : (items[index] ?? null);
  const open = current !== null;
  // The album's line for what deleting THIS item costs (null everywhere else).
  const consequenceOf = useContext(DeleteConsequence);
  const deleteConsequence =
    current && consequenceOf ? consequenceOf(current) : null;
  const prevItem =
    index !== null && index > 0 ? (items[index - 1] ?? null) : null;
  const nextItem =
    index !== null && index < items.length - 1
      ? (items[index + 1] ?? null)
      : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  // The desk's extras (hover chevrons, the filmstrip) need a hand on a mouse;
  // a phone or a touch screen gets the peek and the swipe.
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const wide = useMediaQuery("(min-width: 1024px)");
  const showFilmstrip = finePointer && wide && items.length > 1;
  const [platform] = useState(() =>
    detectPlatform(
      typeof navigator === "undefined" ? {} : (navigator as NavigatorLike),
    ),
  );

  // offset = px added to the base "current centered" transform (0 = centered).
  // dragging toggles `transition: none` so the track tracks the finger 1:1.
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // The stage is the whole viewport (the content is fixed inset-0), so the
  // first render can lay out from the window and the measure only confirms it.
  const [stage, setStage] = useState<Size>(() =>
    typeof window === "undefined"
      ? { width: 375, height: 812 }
      : { width: window.innerWidth, height: window.innerHeight },
  );
  const [safe, setSafe] = useState({ top: 0, bottom: 0 });
  // Natural sizes learned from a loaded file, for rows written before uploads
  // were measured (the item's own width/height win whenever they exist).
  const [measured, setMeasured] = useState<Record<string, Size>>({});

  // One open = one session: whether it flew in and from where, where a reel's
  // clip carries on.
  const [session, setSession] = useState<{
    id: string | null;
    flew: boolean;
    from: ViewerRect | null;
    startAt?: number;
  }>({ id: null, flew: false, from: null });
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("open");

  // Reset the per-item view when the viewer moves to another item, and open a
  // session when it opens. React's "adjust state during render on a prop
  // change" pattern, not a setState-in-effect. The ITEM, by id, not its index:
  // the paged album's arrivals shift the index of the photograph on screen, and
  // a close-up must survive the album growing under it.
  const currentId = current?.id ?? null;
  const [trackedId, setTrackedId] = useState(currentId);
  const [trackedOpen, setTrackedOpen] = useState(false);
  if (currentId !== trackedId) {
    setTrackedId(currentId);
    setZoomed(false);
  }

  const sizeOf = (item: GridMedia | null): Size | null => {
    if (!item) return null;
    if (item.width && item.height)
      return { width: item.width, height: item.height };
    return measured[item.id] ?? null;
  };

  const { peek, gap } = peekMetrics(stage.width);
  const W = stage.width;
  const boxFor = (item: GridMedia) =>
    mediaBox(stage, {
      top: CHROME.top + safe.top,
      bottom:
        CHROME.bottom +
        safe.bottom +
        (item.type === "video" ? CHROME.video : 0) +
        (showFilmstrip ? CHROME.filmstrip : 0),
      side: peek + gap,
    });
  const fitOf = (item: GridMedia | null) =>
    item ? fitRect(sizeOf(item), boxFor(item)) : null;
  const curFit = fitOf(current);
  const prevFit = fitOf(prevItem);
  const nextFit = fitOf(nextItem);
  const widths = {
    prev: prevFit?.width ?? null,
    current: curFit?.width ?? null,
    next: nextFit?.width ?? null,
  };
  // A photograph with nothing to look at yet (its placeholder) does not zoom;
  // a preview does, and the original landing under the close-up keeps it.
  const canZoom =
    current?.type === "photo" &&
    curFit !== null &&
    !!(current.url || current.previewUrl);

  if (open !== trackedOpen) {
    setTrackedOpen(open);
    if (open && current) {
      const flies =
        isRealRect(origin?.rect) &&
        !reduced &&
        curFit !== null &&
        typeof Element !== "undefined" &&
        typeof Element.prototype.animate === "function";
      setSession({
        id: current.id,
        flew: flies,
        from: flies ? (origin?.rect ?? null) : null,
        startAt,
      });
      setPhase(flies ? "opening" : "open");
    }
  }

  const stageRef = useRef<HTMLDivElement | null>(null);
  // The stage as state too, for the same reason as the photograph below: the
  // Portal renders it a commit late, and its observers must meet it.
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const bindStage = useCallback((el: HTMLDivElement | null) => {
    stageRef.current = el;
    setStageEl(el);
  }, []);
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const centerOuterRef = useRef<HTMLDivElement | null>(null);
  // The centre photograph's element, as STATE too: radix's Portal renders its
  // children one commit after it mounts, so an effect keyed on the open alone
  // runs before there is a photograph to fly. Keyed on this, the flight starts
  // in the commit that attaches it, still before the first paint.
  const [centerEl, setCenterEl] = useState<HTMLDivElement | null>(null);
  const bindCenter = useCallback((el: HTMLDivElement | null) => {
    centerOuterRef.current = el;
    setCenterEl(el);
  }, []);
  const centerZoomRef = useRef<HTMLDivElement>(null);
  const centerVideoRef = useRef<HTMLVideoElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const pinchRef = useRef<Pinch | null>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const zoomRef = useRef<Zoom>(ZOOM_REST);
  const suppressClickRef = useRef(false); // swallow the click that trails a drag
  const settleTimerRef = useRef<number | null>(null); // transitionend fallback
  const finishRef = useRef<(() => void) | null>(null); // idempotent commit-finalizer
  const closingRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const pointerTypeRef = useRef("mouse");
  const startUsedRef = useRef<string | null>(null);
  // The latest render's layout, for the listeners that outlive a render.
  const layoutRef = useRef({ fit: curFit, stage, canZoom });
  const soundRef = useRef(soundOn);
  useEffect(() => {
    layoutRef.current = { fit: curFit, stage, canZoom };
    soundRef.current = soundOn;
  });

  // The centre clip, bound through a callback ref: the ref drives it, the
  // state lets its events re-render the transport.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const bindVideo = useCallback((el: HTMLVideoElement | null) => {
    centerVideoRef.current = el;
    setVideoEl(el);
  }, []);
  const videoState = useVideoState(videoEl);

  // The stage's real size and the safe-area insets (read off a probe whose
  // padding is the env() insets, the one way JS can see them).
  const measureStage = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0)
      setStage((s) =>
        s.width === r.width && s.height === r.height
          ? s
          : { width: r.width, height: r.height },
      );
    const p = probeRef.current;
    if (p) {
      const cs = getComputedStyle(p);
      const top = parseFloat(cs.paddingTop) || 0;
      const bottom = parseFloat(cs.paddingBottom) || 0;
      setSafe((s) =>
        s.top === top && s.bottom === bottom ? s : { top, bottom },
      );
    }
  }, []);
  useLayoutEffect(() => {
    if (!stageEl) return;
    measureStage();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measureStage);
    ro.observe(stageEl);
    return () => ro.disconnect();
  }, [stageEl, measureStage]);

  const noteSize = useCallback((id: string, width: number, height: number) => {
    if (!(width > 0 && height > 0)) return;
    setMeasured((m) =>
      m[id]?.width === width && m[id]?.height === height
        ? m
        : { ...m, [id]: { width, height } },
    );
  }, []);

  /* ── the zoom, written straight to the element ─────────────────────────── */

  const writeZoom = useCallback((z: Zoom) => {
    zoomRef.current = z;
    const el = centerZoomRef.current;
    if (el)
      el.style.transform = z.s === 1 && !z.tx && !z.ty ? "" : zoomTransform(z);
  }, []);

  /** Animate the close-up to `to` (a settle, a double tap, a way home). */
  const glideZoom = useCallback(
    (to: Zoom) => {
      const el = centerZoomRef.current;
      const from = zoomRef.current;
      writeZoom(to);
      setZoomed(to.s > 1.001);
      if (!canAnimate(el) || prefersReducedMotion()) return;
      el.animate(
        [{ transform: zoomTransform(from) }, { transform: zoomTransform(to) }],
        { duration: ZOOM_SETTLE_MS, easing: emphasisEase() },
      );
    },
    [writeZoom],
  );

  // A new current item starts at fit; the one it replaced loses its close-up
  // (it is a neighbour now, and a sliver of a zoomed photograph is nonsense).
  // Keyed on the item, like the reset above: its links landing, or the album
  // moving it to another index, leave the close-up where it is. ★ AND ON
  // `centerEl`, the photograph's own element: radix's Portal mounts it a commit
  // after the viewer opens, so a capture keyed on the item alone caught nothing
  // at the open, and the first step after opening left the photograph it
  // replaced zoomed in its sliver.
  useEffect(() => {
    zoomRef.current = ZOOM_REST;
    const el = centerZoomRef.current;
    return () => {
      if (el) el.style.transform = "";
    };
  }, [currentId, centerEl]);

  /* ── the links ─────────────────────────────────────────────────────────── */

  // THE LINK SOURCE (`onNeedLinks`): ask for what is about to be drawn and has
  // no link yet, the swipe track's three slots and the desk strip's frames.
  // ★ KEYED ON THE PLACE AND THE SET STILL MISSING, AS A STRING, never on
  // `items` or the callback: both are new objects on every landing and every
  // render, and an effect keyed on them would ask again each time. The callback
  // is read through an effect event, so a caller's inline arrow is fine.
  const needKey =
    open && onNeedLinks
      ? JSON.stringify(
          unlinkedNear(items, index!, showFilmstrip ? FILMSTRIP_REACH : 1),
        )
      : "[]";
  const askForLinks = useEffectEvent((ids: readonly string[]) => {
    onNeedLinks?.(ids);
  });
  useEffect(() => {
    const ids = JSON.parse(needKey) as string[];
    if (ids.length > 0) askForLinks(ids);
    // `index` and `open` on purpose: a step asks again even when the gaps in
    // reach are the same ids (the caller's store dedupes what is in flight).
  }, [needKey, index, open]);

  /* ── the video ─────────────────────────────────────────────────────────── */

  // `video=auto`: the clip plays muted and looping the moment it is centre
  // stage, and stops the moment it is not. Under reduced motion it waits for
  // Play (the reduced-motion rule: honoured by not playing). Opened from the reel, it carries
  // on from the reel's moment.
  const clipKey = current?.type === "video" ? current.id : null;
  useEffect(() => {
    const v = clipKey ? centerVideoRef.current : null;
    if (!v) return;
    let seek: (() => void) | null = null;
    if (
      session.startAt !== undefined &&
      clipKey === session.id &&
      startUsedRef.current !== session.id
    ) {
      startUsedRef.current = session.id;
      const t = session.startAt;
      seek = () => {
        try {
          v.currentTime = t;
        } catch {}
      };
      if (v.readyState >= 1) seek();
      else v.addEventListener("loadedmetadata", seek, { once: true });
    }
    if (!prefersReducedMotion()) {
      setMuted(v, !soundRef.current);
      const played = v.play();
      if (played && typeof played.catch === "function")
        played.catch(() => {
          // A browser that refuses sound without a fresh tap gets it muted.
          if (!v.muted) {
            setMuted(v, true);
            setSoundOn(false);
            void v.play()?.catch(() => {});
          }
        });
    }
    return () => {
      v.pause();
      if (seek) v.removeEventListener("loadedmetadata", seek);
    };
    // `videoEl`, not just the key: radix's Portal renders the clip one commit
    // after the viewer opens, and the effect has to meet the element.
  }, [clipKey, session, videoEl]);

  // The filmstrip's jump: instant, like the keys (stable, so the strip does not
  // re-render with every frame of a swipe).
  const jump = useCallback(
    (k: number) => {
      if (k !== index) onIndexChange(k);
    },
    [index, onIndexChange],
  );

  const togglePlay = useCallback(() => {
    const v = centerVideoRef.current;
    if (!v) return;
    if (v.paused) void v.play()?.catch(() => {});
    else v.pause();
  }, []);

  const toggleSound = useCallback(() => {
    const v = centerVideoRef.current;
    const next = !soundRef.current;
    setSoundOn(next);
    if (!v) return;
    setMuted(v, !next);
    if (next && v.paused && !prefersReducedMotion())
      void v.play()?.catch(() => {});
  }, []);

  /* ── closing ───────────────────────────────────────────────────────────── */

  // The funnel every way out ends in. Resets the transform and CANCELS any
  // in-flight settle: without this, a settle timer firing after close would call
  // onIndexChange(null! + dir) and silently reopen the viewer.
  const closeNow = () => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    finishRef.current = null;
    gestureRef.current = null;
    pinchRef.current = null;
    pointersRef.current.clear();
    closingRef.current = false;
    setOffset(0);
    setDragging(false);
    onClose();
  };

  /**
   * THE WAY OUT (`wayout=down`): the photograph drops back into its tile (or the
   * reel's frame), from wherever it is seen now (mid-pull, pinched, at rest), as
   * the ground thins to the album. With nowhere to land (no origin, a tile
   * scrolled off, reduced motion) it fades, as it always has.
   */
  const requestClose = () => {
    if (closingRef.current) return;
    const item = current;
    let target: Rect | null = null;
    returnFocusRef.current = null;
    if (origin && item) {
      if (origin.returnTo) {
        const el = origin.returnTo(item);
        if (el) {
          returnFocusRef.current = el;
          const r = el.getBoundingClientRect();
          target = onScreen(r, {
            width: window.innerWidth,
            height: window.innerHeight,
          })
            ? r
            : null;
        }
      } else if (isRealRect(origin.rect)) target = origin.rect;
    }
    const outer = centerOuterRef.current;
    const inner = centerZoomRef.current;
    if (
      !target ||
      !canAnimate(outer) ||
      !inner ||
      !layoutRef.current.fit ||
      prefersReducedMotion()
    ) {
      closeNow();
      return;
    }
    closingRef.current = true;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    finishRef.current = null;
    setPhase("closing");
    const r = tileRadius();
    // Where it is SEEN first (a pull, a pinch, a flight still arriving all
    // count), then where it is LAID OUT, with every animation and the close-up
    // taken off, so the drop starts exactly where the eye already is.
    const seen = inner.getBoundingClientRect();
    for (const a of outer.getAnimations?.() ?? []) a.cancel();
    for (const a of inner.getAnimations?.() ?? []) a.cancel();
    inner.style.transform = "";
    const layout = outer.getBoundingClientRect();
    const anim = outer.animate(
      [seenFrame(layout, seen, r), coverFrame(layout, target, r)],
      { duration: FLIGHT_OUT_MS, easing: drawerEase(), fill: "forwards" },
    );
    const ground = groundRef.current;
    if (canAnimate(ground)) {
      const from = parseFloat(ground.style.opacity || "1");
      ground.animate([{ opacity: from }, { opacity: 0 }], {
        duration: FLIGHT_OUT_MS,
        easing: "linear",
        fill: "forwards",
      });
    }
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      closeNow();
    };
    const timer = window.setTimeout(land, FLIGHT_OUT_MS + 120);
    anim.onfinish = land;
    anim.oncancel = land;
  };

  /* ── opening ───────────────────────────────────────────────────────────── */

  // THE GROWING PHOTOGRAPH (`opening=grow`): out of its tile, the tile expands
  // to fill the screen; out of the reel, the frame lets go of its crop. The
  // element is already laid out at its fit rect; the flight scales and clips it
  // back onto the tile's exact crop and plays forward to rest.
  //
  // ★ IT FLIES FROM WHERE IT OPENED, READ AT THE OPEN (`session.from`), never
  // from the live `origin` prop: the paged album re-renders the viewer inside
  // the flight as a neighbour's link lands, and a caller that handed a fresh
  // `origin` object there would otherwise restart the photograph from its tile.
  useLayoutEffect(() => {
    const from = session.from;
    if (phase !== "opening" || !isRealRect(from)) return;
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      // A way out taken mid-flight owns the phase from then on.
      if (!closingRef.current) setPhase("open");
    };
    const timer = window.setTimeout(land, FLIGHT_IN_MS + 150);
    const el = centerOuterRef.current;
    if (canAnimate(el)) {
      const r = tileRadius();
      const anim = el.animate(
        [coverFrame(el.getBoundingClientRect(), from, r), restFrame(r)],
        { duration: FLIGHT_IN_MS, easing: drawerEase() },
      );
      anim.onfinish = land;
      anim.oncancel = land;
      const ground = groundRef.current;
      if (canAnimate(ground))
        ground.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FLIGHT_IN_MS,
          easing: "linear",
        });
    }
    return () => window.clearTimeout(timer);
  }, [phase, session, centerEl]);

  /* ── navigation ────────────────────────────────────────────────────────── */

  /** The stride a commit travels from the current photograph (the whole track width when unknown). */
  const strideNow = () => {
    if (widths.current !== null) return strideFor(W, widths.current, peek);
    return trackRef.current?.getBoundingClientRect().width || W || 1;
  };

  // ← / → step through the set while open, instantly (a keyboard step is never
  // animated); Space plays or pauses a clip. Escape comes from radix.
  useEffect(() => {
    if (index === null) return;
    const i = index; // narrowed capture for the listener closure
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || ownsKeys(e.target)) return;
      if (e.key === "ArrowLeft" && i > 0) onIndexChange(i - 1);
      else if (e.key === "ArrowRight" && i < items.length - 1)
        onIndexChange(i + 1);
      else if (
        (e.key === " " || e.key === "k") &&
        items[i]?.type === "video" &&
        !(e.target as HTMLElement | null)?.closest?.("button, a")
      ) {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items, onIndexChange, togglePlay]);

  const settleTo = (target: number, dir: -1 | 0 | 1) => {
    // Reduced motion: keep the (direct-manipulation) finger-follow but drop the
    // autonomous slide: commit/recenter instantly. No transitionend will fire
    // (no transition rule), so finalize here rather than waiting on the fallback.
    if (prefersReducedMotion()) {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      finishRef.current = null;
      if (dir !== 0) onIndexChange(index! + dir);
      setOffset(0);
      setDragging(false);
      return;
    }

    const dur = dir === 0 ? SPRINGBACK_MS : SETTLE_MS;
    trackRef.current?.style.setProperty("--lightbox-settle", `${dur}ms`);
    setDragging(false); // enable the CSS transition
    setOffset(target); // ...and animate toward the target

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    finishRef.current = null;
    if (dir === 0) return; // spring-back: nothing to finalize (offset back at 0)

    // Animate-then-swap: once the neighbor has slid fully to center, swap the
    // index and recenter the new window WITHOUT animation by shifting the index +
    // resetting the offset in one batch while `dragging` holds transition:none, so
    // the jump is invisible (every media lands exactly where the new window puts
    // it: geometry.ts). transitionend is the trigger; the timeout is a fallback.
    //
    // We deliberately do NOT re-enable the transition here (e.g. via rAF): a next-
    // frame re-enable races the browser's recalc, so the recenter animates as a
    // visible SECOND slide. Leaving `dragging` true keeps transition:none until the
    // next gesture's settleTo flips it false.
    const finish = () => {
      if (finishRef.current !== finish) return; // already ran / superseded
      finishRef.current = null;
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      setDragging(true);
      onIndexChange(index! + dir);
      setOffset(0);
    };
    finishRef.current = finish;
    settleTimerRef.current = window.setTimeout(finish, SETTLE_MS + 80);
  };

  /* ── the way out, by hand ──────────────────────────────────────────────── */

  const poseDismiss = (dy: number) => {
    const pose = dismissPose(dy, layoutRef.current.stage.height);
    const inner = centerZoomRef.current;
    if (inner)
      inner.style.transform = `translate3d(0, ${pose.y}px, 0) scale(${pose.scale})`;
    if (groundRef.current)
      groundRef.current.style.opacity = String(pose.ground);
  };

  const springBack = () => {
    const inner = centerZoomRef.current;
    const ground = groundRef.current;
    const from = inner?.style.transform || "none";
    const groundFrom = ground?.style.opacity || "1";
    if (inner) inner.style.transform = "";
    if (ground) ground.style.opacity = "";
    delete contentRef.current?.dataset.dismissing;
    if (prefersReducedMotion()) return;
    if (canAnimate(inner))
      inner.animate([{ transform: from }, { transform: "none" }], {
        duration: SPRINGBACK_MS,
        easing: emphasisEase(),
      });
    if (canAnimate(ground))
      ground.animate([{ opacity: Number(groundFrom) }, { opacity: 1 }], {
        duration: SPRINGBACK_MS,
        easing: emphasisEase(),
      });
  };

  /* ── the gestures ──────────────────────────────────────────────────────── */

  const zoomCenter = (): Point | null => {
    const fit = layoutRef.current.fit;
    if (!fit) return null;
    return { x: fit.left + fit.width / 2, y: fit.top + fit.height / 2 };
  };

  const startPinch = () => {
    const pts = [...pointersRef.current.entries()];
    if (pts.length < 2) return;
    const [[ia, a], [ib, b]] = pts;
    gestureRef.current = null;
    suppressClickRef.current = true;
    pinchRef.current = {
      ids: [ia, ib],
      start: { ...zoomRef.current, mid: mid(a, b), dist: dist(a, b) },
    };
    for (const a of centerZoomRef.current?.getAnimations?.() ?? []) a.cancel();
    setZoomed(true);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerTypeRef.current = e.pointerType;
    if (closingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const touch = e.pointerType === "touch";
    if (touch)
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // PINCH (`closeup=pinch`): a second finger before anything has locked, or
    // while panning a close-up, scales the photograph in place. A second finger
    // mid-swipe or mid-pull is ignored (multi-touch protection).
    if (touch && pointersRef.current.size === 2) {
      const g = gestureRef.current;
      if (
        layoutRef.current.canZoom &&
        (!g || g.axis === "unknown" || g.axis === "pan")
      ) {
        try {
          track.setPointerCapture(e.pointerId);
        } catch {}
        startPinch();
      }
      return;
    }
    if (pinchRef.current || gestureRef.current) return;
    suppressClickRef.current = false; // fresh gesture; only a real drag suppresses

    const zoomedNow = zoomRef.current.s > 1.001;
    // A mouse never swipes (chevrons, keys and the filmstrip are its way
    // through); it pans a close-up.
    if (!touch && !(zoomedNow && e.button === 0)) return;

    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: e.timeStamp,
      axis: zoomedNow ? "pan" : "unknown",
      width: strideNow(),
      startOffset: 0,
      hasPrev,
      hasNext,
      captured: false,
      zoom0: { ...zoomRef.current },
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId))
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pinch = pinchRef.current;
    if (pinch) {
      const a = pointersRef.current.get(pinch.ids[0]);
      const b = pointersRef.current.get(pinch.ids[1]);
      const center = zoomCenter();
      if (!a || !b || !center) return;
      e.preventDefault();
      const z = pinchZoom(pinch.start, mid(a, b), dist(a, b), center);
      const fit = layoutRef.current.fit!;
      const bounds = panBounds(fit, z.s, layoutRef.current.stage);
      writeZoom({
        s: z.s,
        tx: rubber(z.tx, bounds.x, 80),
        ty: rubber(z.ty, bounds.y, 80),
      });
      return;
    }

    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.axis === "pan") {
      // Zoomed in, one finger (or the mouse) pans the close-up, with a rubber
      // band at its edges instead of a swipe to the next photograph.
      if (Math.hypot(dx, dy) < DIR_LOCK_PX && !g.captured) return;
      if (!g.captured) {
        try {
          trackRef.current?.setPointerCapture(g.pointerId);
          g.captured = true;
        } catch {}
        suppressClickRef.current = true;
      }
      e.preventDefault();
      const fit = layoutRef.current.fit;
      if (!fit) return;
      const b = panBounds(fit, g.zoom0.s, layoutRef.current.stage);
      writeZoom({
        s: g.zoom0.s,
        tx: rubber(g.zoom0.tx + dx, b.x, 80),
        ty: rubber(g.zoom0.ty + dy, b.y, 80),
      });
      return;
    }

    if (g.axis === "unknown") {
      if (Math.hypot(dx, dy) < DIR_LOCK_PX) return;
      const track = trackRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Engage horizontal drag: interrupt any in-flight settle and seed the
        // offset from the LIVE transform so re-grabbing a moving slide
        // continues smoothly.
        g.axis = "x";
        if (track) {
          if (settleTimerRef.current !== null) {
            window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
          }
          finishRef.current = null;
          const cs = getComputedStyle(track).transform;
          if (cs && cs !== "none") {
            try {
              // base translateX is -width (centered); live offset = m41 - (-width).
              g.startOffset =
                new DOMMatrixReadOnly(cs).m41 +
                (track.getBoundingClientRect().width || g.width);
            } catch {
              g.startOffset = 0;
            }
          }
        }
        setDragging(true);
      } else {
        // `wayout=down`: at fit, a vertical drag is the way out (the track
        // never moves); the finger holds the photograph.
        g.axis = "y";
        if (contentRef.current) contentRef.current.dataset.dismissing = "";
      }
      try {
        track?.setPointerCapture(g.pointerId);
        g.captured = true;
      } catch {}
      suppressClickRef.current = true; // a drag happened -> swallow the trailing click
    }

    if (g.axis === "x") {
      e.preventDefault(); // kill the synthetic click + image-drag / text selection
      setOffset(
        applyFriction(g.startOffset + dx, g.width, g.hasPrev, g.hasNext),
      );
    } else if (g.axis === "y") {
      e.preventDefault();
      poseDismiss(dy);
    }
  };

  const endPinch = (anchor: Point) => {
    pinchRef.current = null;
    const fit = layoutRef.current.fit;
    if (!fit) return;
    const settled = settleZoom(
      zoomRef.current,
      fit,
      layoutRef.current.stage,
      anchor,
    );
    glideZoom(settled);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const was = pointersRef.current.get(e.pointerId);
    pointersRef.current.delete(e.pointerId);

    const pinch = pinchRef.current;
    if (
      pinch &&
      (pinch.ids[0] === e.pointerId || pinch.ids[1] === e.pointerId)
    ) {
      const other = pinch.ids[0] === e.pointerId ? pinch.ids[1] : pinch.ids[0];
      const rest = pointersRef.current.get(other);
      const anchor = was ?? { x: e.clientX, y: e.clientY };
      endPinch(rest ? mid(anchor, rest) : anchor);
      if (rest && zoomRef.current.s > 1.001) {
        // The finger left on the glass pans on from here.
        gestureRef.current = {
          pointerId: other,
          startX: rest.x,
          startY: rest.y,
          startTime: e.timeStamp,
          axis: "pan",
          width: 1,
          startOffset: 0,
          hasPrev,
          hasNext,
          captured: true,
          zoom0: { ...zoomRef.current },
        };
      }
      return;
    }

    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    gestureRef.current = null;
    if (g.captured) {
      try {
        trackRef.current?.releasePointerCapture(g.pointerId);
      } catch {}
    }

    if (g.axis === "pan") {
      const fit = layoutRef.current.fit;
      if (fit) {
        const z = zoomRef.current;
        const b = panBounds(fit, z.s, layoutRef.current.stage);
        const clamped = {
          s: z.s,
          tx: Math.min(b.x.max, Math.max(b.x.min, z.tx)),
          ty: Math.min(b.y.max, Math.max(b.y.min, z.ty)),
        };
        if (clamped.tx !== z.tx || clamped.ty !== z.ty) glideZoom(clamped);
      }
      return;
    }

    const dt = Math.max(1, e.timeStamp - g.startTime);
    if (g.axis === "y") {
      const dy = e.clientY - g.startY;
      if (dismissCommits(dy, dy / dt, layoutRef.current.stage.height))
        requestClose();
      else springBack();
      return;
    }
    if (g.axis !== "x") return; // a tap / never-engaged -> let the click be

    const dx = e.clientX - g.startX;
    const v = dx / dt; // px/ms, signed
    const next =
      dx < 0 &&
      g.hasNext &&
      (v < -COMMIT_VELOCITY || -dx > g.width * COMMIT_RATIO);
    const prev =
      dx > 0 &&
      g.hasPrev &&
      (v > COMMIT_VELOCITY || dx > g.width * COMMIT_RATIO);

    if (next) settleTo(-g.width, 1);
    else if (prev) settleTo(g.width, -1);
    else settleTo(0, 0); // spring back
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current) {
      endPinch({ x: e.clientX, y: e.clientY });
      return;
    }
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    gestureRef.current = null;
    if (g.captured) {
      try {
        trackRef.current?.releasePointerCapture(g.pointerId);
      } catch {}
    }
    if (g.axis === "x")
      settleTo(0, 0); // snap back to center
    else if (g.axis === "y") springBack();
  };

  // A trackpad's pinch arrives as ctrl+wheel, and a two-finger scroll pans a
  // close-up. Native and non-passive: React's wheel listener cannot cancel the
  // browser's own page zoom.
  useEffect(() => {
    const el = stageEl;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { fit, stage: room, canZoom: zoomable } = layoutRef.current;
      if (!zoomable || !fit) return;
      const center = {
        x: fit.left + fit.width / 2,
        y: fit.top + fit.height / 2,
      };
      const z0 = zoomRef.current;
      if (e.ctrlKey) {
        e.preventDefault();
        const s = Math.min(
          ZOOM_MAX,
          Math.max(1, z0.s * Math.exp(-e.deltaY * 0.01)),
        );
        const p = { x: e.clientX, y: e.clientY };
        const z = s <= 1.001 ? ZOOM_REST : zoomAbout(z0, s, p, p, center);
        const b = panBounds(fit, z.s, room);
        writeZoom({
          s: z.s,
          tx: Math.min(b.x.max, Math.max(b.x.min, z.tx)),
          ty: Math.min(b.y.max, Math.max(b.y.min, z.ty)),
        });
        setZoomed(z.s > 1.001);
      } else if (z0.s > 1.001) {
        e.preventDefault();
        const b = panBounds(fit, z0.s, room);
        writeZoom({
          s: z0.s,
          tx: Math.min(b.x.max, Math.max(b.x.min, z0.tx - e.deltaX)),
          ty: Math.min(b.y.max, Math.max(b.y.min, z0.ty - e.deltaY)),
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [stageEl, writeZoom]);

  /** Double tap or double click: close up at the point, or home again. */
  const toggleZoomAt = (p: Point) => {
    const fit = layoutRef.current.fit;
    const center = zoomCenter();
    if (!fit || !center || !layoutRef.current.canZoom) return;
    if (zoomRef.current.s > 1.001) {
      glideZoom(ZOOM_REST);
      return;
    }
    const z = zoomAbout(ZOOM_REST, DOUBLE_TAP_ZOOM, p, p, center);
    glideZoom(settleZoom(z, fit, layoutRef.current.stage, p));
  };

  // A tap on BLANK space closes (Will: "clicking on any blank space around the
  // media should close"). The slot box is blank; the photograph, a sliver and
  // every control are not. Never the click that trails a drag.
  const onSlotClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) return;
    if (e.target !== e.currentTarget) return;
    requestClose();
  };

  // The photograph itself: a photo zooms on a double tap (one tap does
  // nothing, so nothing waits on a second); a clip plays or pauses.
  const onCenterClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) return;
    if (current?.type === "video") {
      togglePlay();
      return;
    }
    if (pointerTypeRef.current === "mouse") return; // dblclick handles the mouse
    const now = e.timeStamp;
    const last = lastTapRef.current;
    if (
      last &&
      now - last.t < DOUBLE_TAP_MS &&
      Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_SLOP_PX
    ) {
      lastTapRef.current = null;
      toggleZoomAt({ x: e.clientX, y: e.clientY });
      return;
    }
    lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
  };

  const onCenterDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (pointerTypeRef.current !== "mouse" || current?.type === "video") return;
    toggleZoomAt({ x: e.clientX, y: e.clientY });
  };

  // A tap on a peeking neighbour goes there, sliding the way a swipe would.
  const onSliverClick = (e: ReactMouseEvent<HTMLDivElement>, dir: -1 | 1) => {
    e.stopPropagation();
    if (suppressClickRef.current || closingRef.current) return;
    if ((dir === -1 && !hasPrev) || (dir === 1 && !hasNext)) return;
    const stride = strideNow();
    settleTo(dir === 1 ? -stride : stride, dir);
  };

  function renderMedia(
    item: ViewerMedia,
    isCenter: boolean,
    fit: Rect | null,
    frame: Size,
  ) {
    if (item.type === "photo")
      return (
        <ViewerPhoto
          item={item}
          isCenter={isCenter}
          fit={fit}
          frame={frame}
          onSize={noteSize}
        />
      );
    // ★ A CLIP WITH NO LINK YET MOUNTS NO <video>: `videoPosterSrc("")` is
    // "#t=0.1", which resolves against the PAGE's address and would fetch the
    // page as a video. Its poster stands in (the frame its tile showed), else
    // the placeholder; the real clip mounts the moment its link lands, and the
    // transport with it.
    if (!item.url) {
      const poster = item.previewUrl || null;
      return poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={poster}
          alt=""
          draggable={false}
          data-lightbox-poster
          // The clip's own look (object-contain on black), so the element
          // that replaces it paints the same picture.
          className={cn(MEDIA_FILL, "bg-black object-contain")}
        />
      ) : (
        <Placeholder frame={frame} fitted={fit !== null} />
      );
    }
    return (
      <video
        ref={isCenter ? bindVideo : undefined}
        data-center-media={isCenter ? "" : undefined}
        data-media-id={item.id}
        // The same posterised src in every slot, so a neighbour becoming the
        // centre is the SAME element and never reloads (the fragment is
        // client-only and paints iOS's first frame: lib/media/poster.ts).
        src={videoPosterSrc(item.url)}
        poster={item.previewUrl ?? undefined}
        muted={isCenter ? !soundOn : true}
        loop={isCenter}
        playsInline
        preload={isCenter ? "auto" : "metadata"}
        tabIndex={-1}
        aria-hidden={!isCenter}
        onLoadedMetadata={(e) =>
          noteSize(
            item.id,
            e.currentTarget.videoWidth,
            e.currentTarget.videoHeight,
          )
        }
        className="absolute inset-0 size-full bg-black object-contain select-none"
      />
    );
  }

  function renderSlot(
    item: ViewerMedia | null,
    posKey: string,
    slot: -1 | 0 | 1,
  ) {
    if (!item)
      return <div key={`empty-${posKey}`} className={SLOT_CLASS} aria-hidden />;
    const isCenter = slot === 0;
    const fit = slot === 0 ? curFit : slot === -1 ? prevFit : nextFit;
    const rect = fit ?? boxFor(item);
    const shift = slotShift(slot, offset, W, peek, widths);
    return (
      <div
        key={item.id}
        data-lightbox-slot
        data-current={isCenter ? "" : undefined}
        className={SLOT_CLASS}
        onClick={onSlotClick}
      >
        <div
          ref={isCenter ? bindCenter : undefined}
          data-lightbox-media
          aria-hidden={!isCenter || undefined}
          onClick={
            isCenter
              ? onCenterClick
              : (e) => onSliverClick(e, slot === -1 ? -1 : 1)
          }
          onDoubleClick={isCenter ? onCenterDoubleClick : undefined}
          className={cn("absolute z-10", !isCenter && "cursor-pointer")}
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            transform: shift ? `translateX(${shift}px)` : undefined,
          }}
        >
          <div
            ref={isCenter ? centerZoomRef : undefined}
            data-lightbox-zoom
            className={cn(
              "relative size-full overflow-hidden",
              isCenter &&
                canZoom &&
                zoomed &&
                "cursor-grab active:cursor-grabbing",
            )}
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            {renderMedia(item, isCenter, fit, rect)}
          </div>
        </div>
      </div>
    );
  }

  const isOwn = current ? (canDelete?.(current) ?? false) : false;
  // An unlinked clip has no element yet (renderMedia), so nothing to drive.
  const clipMounted = current?.type === "video" && !!current.url;
  const quiet = phase !== "open" || zoomed;
  const bottomLift = CHROME.capsuleGap + (showFilmstrip ? CHROME.filmstrip : 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose();
      }}
    >
      <DialogPortal>
        {/* ★ THE GROUND IS THE ALBUM, BLURRED (`behind=album`, Will 2026-09-20).
            A flat bg-black/90 made the viewer a NEW SCREEN; the album at half
            brightness behind a wide blur makes a photograph read as lifted out
            of the room it is still in. It is its OWN element, and must stay one:
            a backdrop filter blurs what is behind the element it sits on, so an
            ancestor of the media would blur the media. The photograph lives in
            `Content`, a sibling ABOVE this. Radix's own primitive rather than
            our wrapped `DialogOverlay`, whose baked `backdrop-blur-xs` would sit
            in the same utilities layer and race this one. */}
        <DialogPrimitive.Overlay
          ref={groundRef}
          data-lightbox-ground
          className={cn(
            "fixed inset-0 z-50 duration-100 ease-emphasis data-closed:animate-out data-closed:fade-out-0",
            // A flight fades the ground itself, in step with the photograph.
            !session.flew && "data-open:animate-in data-open:fade-in-0",
            GLASS_BEHIND,
          )}
        />
        <DialogPrimitive.Content
          ref={contentRef}
          data-lightbox-content
          aria-describedby={undefined}
          // Focus lands on the viewer itself, not on its first control: a
          // tooltip opening on the close circle the instant the photograph
          // arrives is noise. Tab reaches every control from here.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            contentRef.current?.focus({ preventScroll: true });
          }}
          // Focus returns to the tile the photograph went back into (the one
          // showing at close, which may not be the one tapped).
          onCloseAutoFocus={(e) => {
            const el = returnFocusRef.current;
            returnFocusRef.current = null;
            if (!el) return;
            const target = el.matches(FOCUSABLE)
              ? el
              : el.querySelector<HTMLElement>(FOCUSABLE);
            if (!target) return;
            e.preventDefault();
            target.focus({ preventScroll: true });
          }}
          className={cn(
            "fixed inset-0 z-50 outline-none",
            "duration-100 data-closed:animate-out data-closed:fade-out-0",
            // A flying photograph is opaque from its first frame: the content
            // never fades in under it.
            !session.flew && "data-open:animate-in data-open:fade-in-0",
          )}
        >
          {/* ◇ THE COUNTER WENT ("i of N"): the neighbours say there is more.
              The dialog's name still says where a screen reader is. Never an
              aria-live region here: `aria-hidden`'s hideOthers keeps every
              ancestor of a live region exposed, so a confirm opened over the
              viewer would leave the viewer announced beside it. */}
          <DialogPrimitive.Title className="sr-only">
            {current
              ? `${current.type === "video" ? "Video" : "Photo"} ${index! + 1} of ${items.length}`
              : "Media viewer"}
          </DialogPrimitive.Title>
          {/* The safe-area insets, where JS can read them. */}
          <span
            ref={probeRef}
            aria-hidden
            className="pointer-events-none invisible absolute top-0 left-0"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          />

          {current && (
            <div
              ref={bindStage}
              data-lightbox-stage
              className="group/stage absolute inset-0 overflow-hidden"
            >
              {/* The swipe track. `touch-none`: every touch gesture here is
                  ours (swipe, pull down, pinch, pan), and the page behind is
                  scroll-locked by the dialog. */}
              <div
                ref={trackRef}
                data-lightbox-track
                data-dragging={dragging ? "true" : undefined}
                data-quiet={quiet ? "" : undefined}
                className="flex h-full w-full touch-none select-none"
                style={{
                  transform: `translateX(calc(-100% + ${offset}px))`,
                  willChange: dragging ? "transform" : undefined,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onTransitionEnd={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    e.propertyName === "transform"
                  )
                    finishRef.current?.();
                }}
              >
                {renderSlot(prevItem, "prev", -1)}
                {renderSlot(current, "center", 0)}
                {renderSlot(nextItem, "next", 1)}
              </div>

              {/* THE CHROME: one pointer-transparent layer over the track, so
                  its full-width flanks never eat a swipe; only its controls
                  take a tap. Hidden while a photograph flies. */}
              <div
                data-lightbox-chrome
                data-hidden={phase !== "open" ? "" : undefined}
                className="pointer-events-none absolute inset-0 z-20"
                // ★ A TAP MUST NOT FOCUS A CONTROL. Focus opens the control's
                // tooltip on the way to the click (radix opens a tooltip on
                // focus, and a touch's compatibility mousedown focuses the
                // button), the tooltip's arrow lands under the finger, and the
                // click goes to the arrow: measured on the capsule, where every
                // tap on Share was lost. Cancelling a touch pointerdown drops
                // the compatibility mouse events and keeps the click. A menu
                // trigger opens on the pointerdown itself, so it keeps it.
                onPointerDownCapture={(e) => {
                  if (e.pointerType !== "touch") return;
                  const el = e.target as Element | null;
                  if (el?.closest?.("[aria-haspopup='menu']")) return;
                  e.preventDefault();
                }}
              >
                <div
                  className="absolute left-2.5 flex max-w-[calc(100%-4rem)]"
                  style={{ top: "calc(0.625rem + env(safe-area-inset-top))" }}
                >
                  <FaceCredit
                    // Keyed so the credit re-fades per item.
                    key={current.id}
                    item={current}
                    viewerIsHost={viewerIsHost}
                    isOwn={isOwn}
                  />
                </div>

                <ActionTooltip label="Close">
                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      aria-label="Close"
                      className={cn(
                        "pointer-events-auto absolute right-2.5 flex size-8 items-center justify-center rounded-full text-white outline-none",
                        "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
                        // A 44 px target for a thumb around a 32 px circle.
                        "after:absolute after:-inset-1.5 after:rounded-full",
                        GLASS,
                      )}
                      style={{
                        top: "calc(0.625rem + env(safe-area-inset-top))",
                      }}
                    >
                      <X className={cn("size-4", GLASS_MARK_LIT)} />
                    </button>
                  </DialogPrimitive.Close>
                </ActionTooltip>

                {/* ◇ THE DESK'S CHEVRONS: on hover, over the slivers, for a
                    mouse; a phone has the swipe and the sliver itself. */}
                {finePointer && hasPrev && (
                  <ActionTooltip label="Previous">
                    <button
                      type="button"
                      aria-label="Previous"
                      onClick={() => onIndexChange(index! - 1)}
                      className={cn(
                        "pointer-events-auto absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-white outline-none",
                        "opacity-0 transition-[opacity,transform] duration-150 ease-emphasis group-hover/stage:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
                        GLASS,
                      )}
                    >
                      <ChevronLeft className={cn("size-5", GLASS_MARK_LIT)} />
                    </button>
                  </ActionTooltip>
                )}
                {finePointer && hasNext && (
                  <ActionTooltip label="Next">
                    <button
                      type="button"
                      aria-label="Next"
                      onClick={() => onIndexChange(index! + 1)}
                      className={cn(
                        "pointer-events-auto absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-white outline-none",
                        "opacity-0 transition-[opacity,transform] duration-150 ease-emphasis group-hover/stage:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
                        GLASS,
                      )}
                    >
                      <ChevronRight className={cn("size-5", GLASS_MARK_LIT)} />
                    </button>
                  </ActionTooltip>
                )}

                {/* THE FLOATING STACK at the foot (`holds=pills`): a clip's
                    transport over the action capsule. */}
                <div
                  className="absolute inset-x-0 flex flex-col items-center gap-2"
                  style={{
                    bottom: `calc(${bottomLift}px + env(safe-area-inset-bottom))`,
                  }}
                >
                  {/* Only over a clip that exists: a play button and a
                      scrubber over a poster would promise a clip that is
                      not there yet. The media box already reserves its row,
                      so its arrival moves nothing. */}
                  {clipMounted && (
                    <VideoTransport
                      videoRef={centerVideoRef}
                      clipKey={current.id}
                      width={curFit?.width ?? null}
                      state={videoState}
                      onTogglePlay={togglePlay}
                    />
                  )}
                  <ActionCapsule
                    // Keyed by item: a fetch for a photograph the guest has
                    // moved on from is aborted with it.
                    key={current.id}
                    item={current}
                    platform={platform}
                    viewerIsHost={viewerIsHost}
                    shareUrl={shareUrl}
                    canDeleteThis={canDelete ? canDelete(current) : true}
                    onDelete={onDeleteCurrent}
                    deleteConsequence={deleteConsequence}
                    onSetStatus={onSetStatus}
                    onRemove={onRemove}
                    onRestore={onRestore}
                    onPurge={onPurge}
                    // An unlinked clip keeps its sound control (the capsule
                    // holds its shape), showing the choice its clip will
                    // mount with, since there is no element to read yet.
                    soundMuted={
                      current.type !== "video"
                        ? undefined
                        : clipMounted
                          ? videoState.muted
                          : !soundOn
                    }
                    onToggleSound={toggleSound}
                  />
                </div>

                {showFilmstrip && (
                  <div
                    className="absolute inset-x-0 flex justify-center"
                    style={{
                      bottom: "calc(0.75rem + env(safe-area-inset-bottom))",
                    }}
                  >
                    <Filmstrip items={items} index={index!} onJump={jump} />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
