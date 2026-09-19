"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  Heart,
  Share2,
  Trash2,
  VolumeX,
  X,
} from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { PlayBadge } from "@/components/shared/play-badge";
import { Badge } from "@/components/ui/badge";
import { videoPosterSrc } from "@/lib/media/poster";
import { cn } from "@/lib/utils";

import {
  AFTER,
  BEFORE,
  CLIP_SRC,
  CURRENT,
  positionOf,
  sentAt,
  STRIP,
} from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE VIEWER, QUOTED, WITH ONE THING AT A TIME REPLACED.
 *
 * `MediaLightbox` is a radix Dialog portalled to `document.body`, which inside
 * a lab frame is the BOARD's body and not the frame's, so a real one would
 * leave the picture. Everything today's viewer does is reproduced here class
 * for class: the `bg-black/90` overlay, the 32 px close circle at
 * `top-[calc(0.625rem+env(safe-area-inset-top))] right-2.5` on `bg-black/45
 * backdrop-blur-sm`, the slot's `px-2 pb-6`, the `rounded-md object-contain`
 * picture, the 30 percent scrim bands with their 36 px chevrons, and the pill
 * stack (`bg-black/55 px-5 py-2.5 backdrop-blur-sm` over a `px-3 py-1` capsule
 * at 11 px). Where an option is today's answer, this IS today's answer.
 *
 * ★ THE MATERIAL IS NOT ASKED HERE. What a pill's blur, grade and backdrop are
 * made of is `glass`'s round (`behind`, `recipe`, `grades`), already on the
 * desk. Every option below wears the SHIPPED material so nothing on this board
 * quietly answers that question: what is asked is the SHAPE, the count and the
 * place of what stands beside a photograph.
 *
 * ★ AND NOTHING HERE MOUNTS A PROVIDER. `LikeButton` wants a `LikesProvider`
 * and `ReelButton` a `ReelProvider`, and both reach Supabase on mount, so the
 * pill's icons are drawn from lucide at the shipped sizes and hues. No preview
 * on this board touches the network beyond the album's own stills and the one
 * committed clip.
 */

/* ── the shapes each decision can take ───────────────────────────────────── */

export type OpeningShape = "dialog" | "grow" | "sheet";
export type HoldsShape = "pills" | "quiet" | "strip";
export type WhoShape = "pill" | "foot" | "none";
export type NextShape = "swipe" | "film" | "peek";
export type ZoomShape = "browser" | "double" | "pinch";
export type VideoShape = "controls" | "auto" | "badge";
export type WayOutShape = "three" | "down" | "x";
export type LinkShape = "none" | "query" | "file";

const pick = <T extends string>(all: readonly T[], v: string | undefined) =>
  all.includes(v as T) ? (v as T) : all[0];

export const openingOf = (v?: string) =>
  pick(["dialog", "grow", "sheet"] as const, v);
export const holdsOf = (v?: string) =>
  pick(["pills", "quiet", "strip"] as const, v);
export const whoOf = (v?: string) => pick(["pill", "foot", "none"] as const, v);
export const nextOf = (v?: string) =>
  pick(["swipe", "film", "peek"] as const, v);
export const zoomOf = (v?: string) =>
  pick(["browser", "double", "pinch"] as const, v);
export const videoOf = (v?: string) =>
  pick(["controls", "auto", "badge"] as const, v);
export const wayOutOf = (v?: string) =>
  pick(["three", "down", "x"] as const, v);
export const linkOf = (v?: string) =>
  pick(["none", "query", "file"] as const, v);

/** The shipped action's rest and hover language, quoted from the lightbox. */
const ACTION =
  "text-white/80 outline-none hover:text-white active:scale-90 motion-reduce:active:scale-100";

/* ── the close circle ────────────────────────────────────────────────────── */

/** The 32 px circle, verbatim: it survives every option but one. */
export function CloseCircle() {
  return (
    <span
      data-mv-close
      className="absolute top-[calc(0.625rem+env(safe-area-inset-top))] right-2.5 z-30 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
    >
      <X aria-hidden className="size-4" />
    </span>
  );
}

/* ── the actions ─────────────────────────────────────────────────────────── */

/** The icon set, at the shipped 20 px, with the ruled per-action hues. */
function Actions({ host }: { host?: boolean }) {
  return (
    <>
      <span className={cn(ACTION, "hover:text-like")}>
        <Heart aria-hidden className="size-5" />
      </span>
      <span className={cn(ACTION, "hover:text-save")}>
        <Download aria-hidden className="size-5" />
      </span>
      <span className={cn(ACTION, "hover:text-save")}>
        <Share2 aria-hidden className="size-5" />
      </span>
      {host && (
        <>
          <span aria-hidden className="h-5 w-px bg-white/20" />
          <span className={cn(ACTION, "hover:text-success")}>
            <Check aria-hidden className="size-5" />
          </span>
          <span className={cn(ACTION, "hover:text-warning")}>
            <EyeOff aria-hidden className="size-5" />
          </span>
          <span className={cn(ACTION, "hover:text-destructive")}>
            <Trash2 aria-hidden className="size-5" />
          </span>
        </>
      )}
    </>
  );
}

/* ── who took it, in the three places it can be said ─────────────────────── */

function Attribution({
  item,
  who,
  host,
  counter,
}: {
  item: GridMedia;
  who: WhoShape;
  host?: boolean;
  /** "17 of 26", which only the option that keeps it renders. */
  counter?: boolean;
}) {
  const position = positionOf(item);
  const name = item.isAnonymous ? "Anonymous" : (item.uploaderName ?? "Guest");
  if (who === "none" && !counter) return null;
  if (who === "none")
    return (
      <span data-mv-said className="text-[11px] text-white/70 tabular-nums">
        {position}
      </span>
    );
  return (
    <span
      data-mv-said
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90"
    >
      <span>{name}</span>
      {item.isHost && (
        <Badge
          variant="secondary"
          className="bg-white/15 text-white hover:bg-white/15"
        >
          Host
        </Badge>
      )}
      {who === "foot" && (
        <>
          <span className="text-white/40">·</span>
          <span className="text-white/70">{sentAt(item)}</span>
        </>
      )}
      {counter && (
        <>
          <span className="text-white/40">·</span>
          <span className="text-white/70 tabular-nums">{position}</span>
        </>
      )}
      {host && (
        <>
          <span className="text-white/40">·</span>
          <span className="text-white/55">
            {(item.uploaderName ?? "guest").toLowerCase()}@example.com
          </span>
        </>
      )}
    </span>
  );
}

/* ── the chrome, in the three shapes it can take ─────────────────────────── */

/**
 * ★ THE COUNTER BELONGS TO `next`, NOT TO THE CHROME. Today it is welded into
 * the attribution capsule and always on; the option that draws the neighbours
 * at the edges is the one that argues it is not needed. So the chrome asks
 * whether there IS a counter through `counter`, and every option keeps its own
 * answer rather than one shape quietly deciding for another.
 */
function Chrome({
  item,
  holds,
  who,
  host,
  counter,
  /** `quiet` draws nothing until it is summoned; `who` has to summon it to ask. */
  summoned,
  /** The filmstrip stands above the chrome when `next` puts one there. */
  above,
}: {
  item: GridMedia;
  holds: HoldsShape;
  who: WhoShape;
  host?: boolean;
  counter?: boolean;
  summoned?: boolean;
  above?: ReactNode;
}) {
  const hidden = holds === "quiet" && !summoned;
  const attribution = (
    <Attribution item={item} who={who} host={host} counter={counter} />
  );

  if (holds === "strip")
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-stretch">
        {above && <div className="mb-3 flex justify-center">{above}</div>}
        <div
          data-mv-chrome
          className="pointer-events-none flex items-end justify-between gap-4 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pt-14 pb-[calc(0.875rem+env(safe-area-inset-bottom))]"
        >
          <span className="pointer-events-auto min-w-0 truncate">
            {attribution}
          </span>
          <span className="pointer-events-auto flex shrink-0 items-center gap-4">
            <Actions host={host} />
          </span>
        </div>
      </div>
    );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-3">
      {above}
      <div
        data-mv-chrome
        className={cn(
          "pointer-events-none flex flex-col items-center gap-1.5 transition-opacity duration-200 motion-reduce:transition-none",
          hidden && "opacity-0",
        )}
      >
        {/* ★ "ON THE CHROME'S OWN LINE" HAS TO MEAN THE LINE, NOT A SECOND
            CAPSULE. Drawn as one more capsule under the icons, that option and
            today's differed by one clause of 11 px text: `lab:demo` measured
            the whole step moving by 0.2 percent, which is a decision nobody can
            see. It shares the icons' capsule instead, which is what it says. */}
        <div className="pointer-events-auto flex max-w-[92vw] items-center gap-4 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm">
          {who === "foot" && (
            <>
              <span className="min-w-0 truncate">{attribution}</span>
              <span aria-hidden className="h-5 w-px shrink-0 bg-white/20" />
            </>
          )}
          <Actions host={host} />
        </div>
        {who !== "foot" && (who !== "none" || counter) && (
          <div className="flex max-w-[88vw] flex-col items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-center backdrop-blur-sm">
            {attribution}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── how the next photograph comes ───────────────────────────────────────── */

/** Today's 30 percent scrim bands with their 36 px chevrons. */
function Chevrons() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[30%] items-center bg-gradient-to-r from-black/15 to-transparent pl-1.5"
      >
        <span className="flex size-9 items-center justify-center rounded-full text-white/70">
          <ChevronLeft className="size-5" />
        </span>
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-[30%] items-center justify-end bg-gradient-to-l from-black/15 to-transparent pr-1.5"
      >
        <span className="flex size-9 items-center justify-center rounded-full text-white/70">
          <ChevronRight className="size-5" />
        </span>
      </span>
    </>
  );
}

/**
 * Google Photos' answer: the neighbour's own EDGE at the screen's edge.
 *
 * ★ IT IS A WINDOW ONTO A FULL-SIZE SLOT, NOT A NARROW TILE. A 28 px tile with
 * `object-cover` is a column of colour, not a photograph: the first capture of
 * this option read as two saturated bars. The real track lays each neighbour
 * out at the full stage width and lets the screen clip it, so what shows is the
 * genuine edge at the neighbour's own fit height, which is what makes it read
 * as another picture rather than as chrome.
 */
function Peek({
  item,
  side,
  screen,
}: {
  item: GridMedia;
  side: "left" | "right";
  screen: ScreenId;
}) {
  const w = screen === "375" ? 375 : 1440;
  return (
    <span
      aria-hidden
      data-mv-peek
      className={cn(
        "absolute inset-y-0 overflow-hidden",
        screen === "375" ? "w-7" : "w-24",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <span
        className="absolute inset-y-0 flex items-center"
        style={{ width: w, [side === "left" ? "right" : "left"]: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset */}
        <img
          src={item.url}
          alt=""
          className="max-h-full w-full rounded-md object-contain opacity-80"
        />
      </span>
    </span>
  );
}

/**
 * Apple Photos' answer: the neighbours as frames, the current one lifted.
 *
 * ★ A PLAIN <img>, NOT `MediaTile`, AND THAT IS A FINDING. The shipped tile
 * carries `loading="lazy"`, and Blink resolves that against the TOP window even
 * for an image inside a same-origin iframe: nine frames at the foot of an 812 px
 * frame sitting near the bottom of a tall board page never loaded, and the
 * first capture of this option was nine black rectangles. A filmstrip is new
 * chrome rather than a gallery tile, so it draws its own eager picture; the
 * same hazard is a real one for any strip the wiring round ships below the
 * fold, and it is on the Deferred list.
 */
function FilmStrip({ screen }: { screen: ScreenId }) {
  return (
    <div
      data-mv-film
      className="pointer-events-auto flex items-end justify-center gap-1 px-3"
    >
      {STRIP.map((item, i) => {
        const current = i === 4;
        return (
          <span
            key={item.id}
            data-mv-frame
            className={cn(
              "relative block shrink-0 overflow-hidden rounded-[3px] bg-black/40",
              current
                ? "h-14 w-11 ring-2 ring-white"
                : "h-11 w-8 opacity-70 ring-1 ring-white/20",
              screen === "1440" && (current ? "h-16 w-12" : "h-12 w-9"),
            )}
          >
            {item.type === "video" ? (
              <video
                src={videoPosterSrc(item.url)}
                muted
                playsInline
                preload="metadata"
                aria-hidden
                className="size-full bg-black object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset
              <img src={item.url} alt="" className="size-full object-cover" />
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ── the picture ─────────────────────────────────────────────────────────── */

/**
 * The media itself at one of the three distances `closeup` asks about. `fit` is
 * today (`object-contain`, the whole photograph); `double` fills the stage with
 * `object-cover`; `pinch` scales in place around the point two fingers opened
 * on. All three are the same file at the same place, so what a reader compares
 * is how much of a face there is to look at.
 */
function Picture({
  item,
  zoom,
  radius,
  media,
}: {
  item: GridMedia;
  zoom: ZoomShape;
  radius: string;
  media?: ReactNode;
}) {
  if (media) return <>{media}</>;
  const shared = cn("select-none [-webkit-user-drag:none]", radius);
  if (zoom === "browser")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset
      <img
        src={item.url}
        alt=""
        draggable={false}
        data-mv-picture
        className={cn(shared, "max-h-full max-w-full object-contain")}
      />
    );
  if (zoom === "double")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset
      <img
        src={item.url}
        alt=""
        draggable={false}
        data-mv-picture
        className={cn(shared, "size-full object-cover")}
      />
    );
  return (
    <span className="relative block size-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset */}
      <img
        src={item.url}
        alt=""
        draggable={false}
        data-mv-picture
        className={cn(
          shared,
          "absolute inset-0 size-full origin-[52%_34%] scale-[2.4] object-contain",
        )}
      />
    </span>
  );
}

/* ── the video, in the three ways it can meet a guest ────────────────────── */

/** Whether this frame's own window asks for less motion. */
function useStill() {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const win = ref.current?.ownerDocument.defaultView;
    if (!win?.matchMedia) return;
    const mq = win.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(mq.matches);
    const on = () => setStill(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return [ref, still] as const;
}

export function VideoMedia({
  shape,
  radius,
}: {
  shape: VideoShape;
  radius: string;
}) {
  const [probe, still] = useStill();
  const src = videoPosterSrc(CLIP_SRC);
  if (shape === "controls")
    return (
      <span ref={probe} className="flex h-full max-h-full items-center">
        <video
          data-mv-video
          src={src}
          controls
          playsInline
          preload="metadata"
          className={cn("max-h-full max-w-full bg-black select-none", radius)}
        />
      </span>
    );
  if (shape === "auto")
    return (
      <span
        ref={probe}
        className="relative flex h-full max-h-full items-center"
      >
        {/* ★ REDUCED MOTION IS HONOURED BY NOT PLAYING (bible 14), and a still
            that claims to be playing has to say where it is: the held frame
            keeps the mute chip and draws the line the clip has reached. A
            <video> cannot be paused from a stylesheet, so this is the one
            place on the board that branches on the preference. */}
        {still ? (
          <span className="relative block h-full">
            <video
              data-mv-video
              src={src}
              playsInline
              preload="metadata"
              className={cn(
                "max-h-full max-w-full bg-black select-none",
                radius,
              )}
            />
            <span aria-hidden className="mv-played" />
          </span>
        ) : (
          <video
            data-mv-video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={cn("max-h-full max-w-full bg-black select-none", radius)}
          />
        )}
        <span className="absolute top-3 left-3 flex size-8 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
          <VolumeX aria-hidden className="size-4 text-white" />
        </span>
      </span>
    );
  return (
    <span ref={probe} className="relative flex h-full max-h-full items-center">
      <video
        data-mv-video
        src={src}
        playsInline
        preload="metadata"
        className={cn("max-h-full max-w-full bg-black select-none", radius)}
      />
      <PlayBadge size="lg" />
    </span>
  );
}

/* ── the way out, drawn ──────────────────────────────────────────────────── */

/**
 * ★ THE TAP THIRDS ARE INVISIBLE, SO THE OPTION THAT KEEPS THEM DRAWS THEM.
 * Today a tap on the middle third closes and the outer thirds step forward and
 * back, and nothing on the screen says so, which is why a tap meant for "back"
 * so often goes on instead. A decision about a geometry nobody can see is not
 * answerable until the geometry is on the screen.
 */
function TapZones() {
  const zone =
    "flex items-center justify-center border-x border-dashed border-white/25 text-[11px] font-medium tracking-wide text-white/60 uppercase";
  return (
    <span
      aria-hidden
      data-mv-zones
      className="pointer-events-none absolute inset-0 z-20 flex"
    >
      <span className={cn(zone, "w-[30%] bg-white/5")}>Back</span>
      <span className={cn(zone, "flex-1 bg-white/10")}>Close</span>
      <span className={cn(zone, "w-[30%] bg-white/5")}>On</span>
    </span>
  );
}

/* ── the growing photograph, measured out of its own tile ────────────────── */

/**
 * ★ THE FLIGHT IS MEASURED, NEVER GUESSED. `grow` says the photograph comes out
 * of the tile that was tapped, so the picture has to start at THAT tile's box:
 * this reads `[data-mv-lit]` in the frame's own document and places the flying
 * picture between that rect and the full screen. A hard-coded box would be a
 * drawing of the answer rather than the answer, and it would be wrong the first
 * time the album's scroll or the column rule moved.
 *
 * It is drawn at 62 percent of the way, at rest, because the END of this
 * entrance is a full-screen photograph and so is today's: a reader comparing
 * two settled pictures would see one difference (the album gone from behind)
 * and miss the whole answer. The entrance also PLAYS on mount, honoured under
 * reduced motion by `media-viewer.css`.
 */
function useLitBox() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      const lit = el.ownerDocument.querySelector("[data-mv-lit]");
      if (lit) setBox(lit.getBoundingClientRect());
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el.ownerDocument.body);
    const late = win.setTimeout(read, 900);
    return () => {
      ro.disconnect();
      win.clearTimeout(late);
    };
  }, []);
  return [ref, box] as const;
}

const T = 0.62; // where in the flight the still picture is caught

function Flight({ item, screen }: { item: GridMedia; screen: ScreenId }) {
  const [ref, box] = useLitBox();
  const vw = screen === "375" ? 375 : 1440;
  const vh = screen === "375" ? 812 : 900;
  const mix = (from: number, to: number) => from + (to - from) * T;
  const style = box
    ? ({
        left: `${mix(box.left, 0)}px`,
        top: `${mix(box.top, 0)}px`,
        width: `${mix(box.width, vw)}px`,
        height: `${mix(box.height, vh)}px`,
        borderRadius: `${mix(6, 0)}px`,
        // The keyframe's start, which a stylesheet cannot measure for itself.
        "--mv-x0": `${box.left}px`,
        "--mv-y0": `${box.top}px`,
        "--mv-w0": `${box.width}px`,
        "--mv-h0": `${box.height}px`,
      } as CSSProperties)
    : ({ inset: 0, borderRadius: 0 } as CSSProperties);
  return (
    <div ref={ref} className="absolute inset-0">
      <div
        data-mv-flight
        // Keyed on the measured box so the entrance replays once the lit tile
        // is found, rather than flying from an unmeasured full screen.
        key={box ? `${Math.round(box.top)}-${Math.round(box.left)}` : "unread"}
        className="mv-flight absolute overflow-hidden bg-black"
        style={style}
      >
        <MediaTile item={item} playBadge="none" />
      </div>
    </div>
  );
}

/* ── the viewer ──────────────────────────────────────────────────────────── */

export function Viewer({
  screen,
  item = CURRENT,
  opening = "dialog",
  holds = "pills",
  who = "pill",
  next = "swipe",
  zoom = "browser",
  wayOut,
  host,
  summoned,
  media,
  onTop,
}: {
  screen: ScreenId;
  item?: GridMedia;
  opening?: OpeningShape;
  holds?: HoldsShape;
  who?: WhoShape;
  next?: NextShape;
  zoom?: ZoomShape;
  wayOut?: WayOutShape;
  host?: boolean;
  summoned?: boolean;
  /** The video options hand their own element in. */
  media?: ReactNode;
  /** The share sheet, which stands over everything. */
  onTop?: ReactNode;
}) {
  const phone = screen === "375";
  /**
   * ★ THE OPENING CHANGES THE CONTAINER, NEVER WHAT IS IN IT. Three decisions
   * are staged behind `opening`, so each of them is drawn INSIDE the opening
   * that was chosen: a grown photograph that dropped the chrome would have made
   * all three of `holds`'s options draw the same empty screen. What an opening
   * decides is the ground, the margin around the picture, whether the picture
   * is flying out of a tile, and whether the whole thing sits on a sheet.
   */
  const ground =
    opening === "dialog"
      ? "bg-black/90"
      : // The flight is caught at 62 percent, so its ground is 62 percent of the
        // way to black: the end state would hide the album the photograph is
        // coming OUT of, which is the whole of this option's argument.
        opening === "grow"
        ? "bg-black/60"
        : "bg-transparent";
  const slot =
    opening === "dialog" ? (phone ? "px-2 pb-6" : "px-6 pb-6") : "p-0";
  const radius = opening === "dialog" ? "rounded-md" : "rounded-none";
  const peek = next === "peek";

  const body = (
    <>
      <div
        data-mv-stage
        className={cn(
          "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden",
          slot,
          // The neighbours' room is the LAYOUT's, and a photograph a guest has
          // opened up is not held inside it: at 2.4 times, or filling the
          // screen, the picture covers the slivers exactly as it would.
          peek && zoom === "browser" && (phone ? "px-9" : "px-40"),
        )}
      >
        {/* The neighbours, shown only by the option that argues for showing
            them: the real edge of each, at its own fit height. */}
        {peek && opening !== "grow" && (
          <>
            <Peek item={BEFORE} side="left" screen={screen} />
            <Peek item={AFTER} side="right" screen={screen} />
          </>
        )}
        {opening === "grow" ? (
          <Flight item={item} screen={screen} />
        ) : (
          <Picture item={item} zoom={zoom} radius={radius} media={media} />
        )}
        {next === "swipe" && opening !== "grow" && <Chevrons />}
        {wayOut === "three" && <TapZones />}
      </div>
      <Chrome
        item={item}
        holds={holds}
        who={who}
        host={host}
        counter={next !== "peek"}
        summoned={summoned}
        above={next === "film" ? <FilmStrip screen={screen} /> : undefined}
      />
      <CloseCircle />
      {onTop}
    </>
  );

  if (opening === "sheet")
    return (
      <>
        {/* The album keeps its own light; only the gap above the sheet shows it. */}
        <div
          data-mv-ground
          className="fixed inset-0 z-40 bg-black/15"
          aria-hidden
        />
        <div
          data-mv-sheet-viewer
          className={cn(
            "mv-sheet fixed z-50 flex flex-col overflow-hidden bg-black shadow-[0_-16px_50px_rgb(0_0_0/0.55)]",
            wayOut === "down" && "mv-dismissing",
            phone
              ? "inset-x-0 top-24 bottom-0 rounded-t-[var(--radius-float)]"
              : "inset-x-24 top-16 bottom-0 rounded-t-[var(--radius-float)]",
          )}
        >
          <span
            aria-hidden
            className="mx-auto mt-2.5 mb-1 block h-1 w-9 shrink-0 rounded-full bg-white/30"
          />
          {body}
        </div>
      </>
    );

  return (
    <div
      data-mv-viewer
      data-mv-ground
      className={cn(
        "mv-open fixed inset-0 z-50 flex flex-col",
        ground,
        wayOut === "down" && "mv-dismissing",
      )}
    >
      {body}
    </div>
  );
}
