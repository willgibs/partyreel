"use client";

import "./glass.css";

import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Heart,
  Play,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { ALBUM, EVENT, type GroundId, groundSrc, REEL } from "./fixtures";
import { flatOf, quietOf, type Recipe, recipeVars } from "./recipes";

/**
 * THE APP'S MEDIA CHROME, COPIED SO ITS MATERIAL CAN VARY.
 *
 * ★ COPIES, NOT THE PRODUCTION COMPONENTS, AND THAT IS THE LANE. The lightbox
 * is a radix Dialog that portals to the body, so it leaves any frame it is
 * mounted in; the host's tile row and the guest's save chip are `md:` hover
 * reveals, so at 375 there is nothing on screen to judge and at 1440 nothing is
 * hovered in a screenshot. Every className below is quoted from the shipped
 * component (media-lightbox.tsx, host-media-grid.tsx, like-button.tsx,
 * guest-reel-overlay.tsx, event-card.tsx, unsave-button.tsx) with ONE
 * substitution: the chrome's `bg-black/nn backdrop-blur-sm` becomes a `Pane`
 * wearing the recipe. Nothing else moves, so what he judges is the material
 * and not a redesign.
 *
 * ★ THE ROWS ARE DRAWN AS IF HOVERED. A hover-revealed row cannot be judged in
 * a still, so every tile shows its row and the step's context says so.
 *
 * ★ NOTHING INSIDE A MOVING TILE CARRIES A BACKDROP FILTER (album-fill-grid.tsx:
 * under an animating transform it flickers in Safari and forces readbacks). No
 * tile here animates, and the album's entrance stagger is deliberately left
 * off: a scroll, not an entrance, is the condition this material is measured
 * under.
 */

/* ── the material ─────────────────────────────────────────────────────────── */

export type Grade = "full" | "quiet" | "flat";

/** What a surface wears: a class from glass.css and the recipe as variables. */
export type Look = { className: string; style: CSSProperties };

/**
 * One glass surface's look. `grade` picks which recipe it wears: the full one
 * for anything you act on, the DERIVED quiet one for a badge you only read,
 * flat for the no-filter control. `paper` swaps in the light material, which is
 * a surface of its own rather than a filter over the dark one (Will,
 * 2026-09-18: dark and light are asked separately, never as a package).
 */
export function look(
  recipe: Recipe,
  grade: Grade = "full",
  paper = false,
): Look {
  const r =
    grade === "quiet"
      ? quietOf(recipe)
      : grade === "flat"
        ? flatOf(recipe)
        : recipe;
  return {
    className: grade === "flat" ? "gl-flat" : paper ? "gl-paper" : "gl-glass",
    style: recipeVars(r) as CSSProperties,
  };
}

/**
 * A pane of the chosen material, with the surface's own shape classes on it.
 * Extra props pass through so a scene can mark a pane for the measuring
 * harness (`data-gl-pill`), which reads the contrast off the RENDERED preview
 * rather than off the recipe's numbers.
 */
function Pane({
  look: l,
  className,
  children,
  ...rest
}: React.ComponentProps<"span"> & { look: Look }) {
  return (
    <span {...rest} style={l.style} className={cn(l.className, className)}>
      {children}
    </span>
  );
}

/** True when the reader (or `lab:demo`) asks for reduced motion. */
function useStill(): boolean {
  const [still, setStill] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return still;
}

/**
 * ★ ONE `sizes` FOR EVERY TILE, AND IT IS A LOADING DECISION, NOT A LAYOUT ONE.
 * `next/image` picks its optimized URL from `sizes`, so a board whose scenes
 * asked for 180, 220, 260, 280 and 420 generated five variants of each of the
 * twelve stills and every option's frame fetched a fresh set: `lab:demo`
 * measured two identical grids as 63 percent different because the later frame
 * was still grey when it was shot. One string means twelve optimized images for
 * the whole board, warm in the cache by the second option. The value is an
 * `imageSizes` step, and a tile is never wider than it in any scene here.
 */
const TILE_SIZES = "384px";
/** The lightbox's own photograph: 675px wide at 1440, so the next step up. */
const HERO_SIZES = "750px";

/** The lightbox's action glyph, quoted: a 36px hit area, a 20px white icon. */
const ACTION =
  "flex size-9 items-center justify-center rounded-full text-white";
/** A tile chip, quoted from host-media-grid.tsx's ACTION_BASE. */
const CHIP = "flex size-7 items-center justify-center rounded-full text-white";

/* ── 1. the lightbox, at 1440 ─────────────────────────────────────────────── */

export type Behind = "wall" | "album" | "dim";
export type Grades = "one" | "two";

/**
 * An album underneath, the overlay over it, one photograph filling the room,
 * and four pieces of chrome floating on it (the action pill, the attribution
 * pill, the close, the two nav arrows). The recipe is decided here because this
 * one screen holds all three kinds of surface at once: one he acts on, one he
 * only reads, and one he barely notices.
 */
export function LightboxScene({
  recipe,
  ground,
  grades = "two",
  behind = "wall",
}: {
  recipe: Recipe;
  ground: GroundId;
  grades?: Grades;
  behind?: Behind;
}) {
  const img = groundSrc(ground);
  const act = look(recipe, "full");
  // With ONE grade every surface wears the full recipe; with two, anything he
  // only reads drops to the quiet grade.
  const read = look(recipe, grades === "two" ? "quiet" : "full");

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* The album the lightbox opened FROM, so the overlay has something real
          to sit on. Thrown away behind today's wall; the whole point of the
          glass answers is that it stops being thrown away. */}
      <div className="absolute inset-0 columns-5 gap-[var(--gap-gallery)] p-4">
        {ALBUM.slice(0, 18).map((t) => (
          <div
            key={t.id}
            className="relative mb-[var(--gap-gallery)] w-full overflow-hidden"
            style={{ aspectRatio: t.ratio, borderRadius: "var(--radius-tile)" }}
          >
            <Image
              src={t.src}
              alt=""
              fill
              sizes={TILE_SIZES}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* THE OVERLAY. Today it is `bg-black/90`: a near-solid wall. */}
      {behind === "wall" ? (
        <div className="absolute inset-0 bg-black/90" />
      ) : (
        <div
          className="gl-behind absolute inset-0"
          style={
            {
              "--gl-behind-blur": "28px",
              "--gl-behind-brightness": behind === "dim" ? "0.28" : "0.5",
            } as CSSProperties
          }
        />
      )}

      {/* THE PHOTOGRAPH, PORTRAIT, FILLING THE HEIGHT.
          ★ A LANDSCAPE HERE WOULD PUT THE CHROME ON THE BACKDROP, NOT ON THE
          PHOTOGRAPH. The lightbox draws an upload `object-contain`, so a 3:2
          still on a 16:10 screen is letterboxed and the pills at the foot land
          on the black instead of on the picture: the first capture of this
          board showed exactly that, and a glass recipe judged over a black
          wall is judged over nothing. A guest's phone shoots 3:4 portraits
          most of the time and those fill the height, which is the case the
          chrome really has to survive, so the ground is cropped to 3:4 here
          exactly as `object-cover` crops a real upload. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full" style={{ aspectRatio: "3 / 4" }}>
          <Image
            src={img.src}
            alt=""
            fill
            sizes={HERO_SIZES}
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* Close, top right. */}
      <Pane
        look={read}
        className="absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full text-white"
      >
        <X className="size-4" />
      </Pane>

      {/* The two nav zones: a soft gradient flank and a round button. The button
          has NO surface in production, which is the clearest candidate for a
          quiet grade, so it wears one here. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[30%] items-center bg-gradient-to-r from-black/15 to-transparent pl-1.5">
        <Pane look={read} className={ACTION}>
          <ChevronLeft className="size-5" />
        </Pane>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-[30%] items-center justify-end bg-gradient-to-l from-black/15 to-transparent pr-1.5">
        <Pane look={read} className={ACTION}>
          <ChevronRight className="size-5" />
        </Pane>
      </div>

      {/* THE FLOATING PILL STACK: the action pill over the attribution pill,
          centred at the foot. The action pill is the surface the recipe is
          decided on, because it is the one he presses. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-1.5">
        <Pane
          look={act}
          data-gl-pill=""
          className="flex items-center gap-4 rounded-full px-5 py-2.5"
        >
          <span className={ACTION}>
            <Heart className="size-5 fill-like/25 text-like" />
          </span>
          <span className="text-xs font-medium text-white tabular-nums">
            12
          </span>
          <span className={ACTION}>
            <Download className="size-5" />
          </span>
          <span className={ACTION}>
            <Share2 className="size-5" />
          </span>
          <span aria-hidden className="h-5 w-px bg-white/20" />
          <span className={ACTION}>
            <EyeOff className="size-5" />
          </span>
          <span className={ACTION}>
            <Trash2 className="size-5" />
          </span>
        </Pane>
        <Pane
          look={read}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-white/90"
        >
          <span>{EVENT.guest}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/70 tabular-nums">7 of 40</span>
        </Pane>
      </div>
    </div>
  );
}

/* ── 2. the tiles, at a phone ─────────────────────────────────────────────── */

/**
 * THE HOST'S GRID AT 375, SCROLLING: two columns of a real album with the tile
 * chips over them. This is the cost step. A host scrolls hundreds of tiles
 * through this screen on a phone and every chip is its own blurred region, so
 * it is where a recipe either survives a phone or does not. The guest album's
 * play badge and its in-flight progress strip are the same family and follow
 * the same answer.
 */
export function TilesScene({
  recipe,
  grade,
}: {
  recipe: Recipe;
  grade: Grade;
}) {
  const chip = look(recipe, grade);
  return (
    <div className="gl-scroll h-full w-full overflow-y-auto bg-background">
      <div className="flex h-12 items-center px-4 text-sm font-medium text-foreground">
        {EVENT.name}
      </div>
      <div
        data-gl-album
        className="columns-2 gap-[var(--gap-gallery)] px-4 pb-10"
      >
        {ALBUM.map((t) => (
          <div
            key={t.id}
            data-gl-tile
            className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
            style={{ aspectRatio: t.ratio, borderRadius: "var(--radius-tile)" }}
          >
            <Image
              src={t.src}
              alt=""
              fill
              sizes={TILE_SIZES}
              className="object-cover"
            />
            {/* The row: like, then save. A host's third chip (hide) lives in
                the lightbox on a phone, so two is the real count. */}
            <div className="absolute top-1.5 right-1.5 z-10 flex items-center">
              <Pane look={chip} className={cn(CHIP, "ml-1")}>
                <Heart
                  className={cn("size-4", t.liked && "fill-like/25 text-like")}
                />
              </Pane>
              <Pane look={chip} className={cn(CHIP, "ml-1")}>
                <Download className="size-4" />
              </Pane>
            </div>
            {t.kind === "video" && (
              <Pane
                look={chip}
                className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full"
              >
                <Play className="ml-px size-2.5 fill-white text-white" />
              </Pane>
            )}
            {t.likes > 0 && (
              <Pane
                look={chip}
                className="pointer-events-none absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
              >
                <Heart className="size-3 fill-white" />
                {t.likes}
              </Pane>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. the reel overlay, at a phone ──────────────────────────────────────── */

export type ReelSkin = "dark" | "white" | "flat";

/**
 * THE REEL OVERLAY AT 375, over a PLAYING reel: the one surface in the app
 * whose backdrop moves every frame, which is both the most expensive case for
 * a backdrop filter and the one where glass most reads as glass. Today's
 * controls are WHITE glass (`bg-white/12 backdrop-blur-sm`), the only white
 * chrome in the product, so the question is whether they join the recipe or
 * keep a material of their own.
 *
 * Under reduced motion the reel rests on its poster (bible 14), which is also
 * what `lab:demo` sees, so the three options are compared on identical frames.
 */
export function ReelScene({
  recipe,
  skin,
}: {
  recipe: Recipe;
  skin: ReelSkin;
}) {
  const still = useStill();
  const dark = look(recipe, "full");
  // White glass: the same filter, a white tint, and the backdrop lightened
  // rather than darkened, because a white pane over a darkened reel reads as a
  // smudge rather than as a pane.
  const white: Look = {
    className: "gl-glass",
    style: {
      ...recipeVars(recipe),
      backgroundColor: `rgb(255 255 255 / ${Math.max(0.1, recipe.tint * 0.8).toFixed(2)})`,
      "--gl-brightness": String(
        recipe.brightness + (1 - recipe.brightness) * 0.6,
      ),
    } as CSSProperties,
  };
  const flat: Look = {
    className: "gl-flat",
    style: { backgroundColor: "rgb(255 255 255 / 0.12)" } as CSSProperties,
  };
  const l = skin === "dark" ? dark : skin === "white" ? white : flat;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* ★ THE REST STATE IS A FRAME OF THE REEL, NOT ITS POSTER. The poster is
          the reel's first frame and that frame is letterboxed (the engine's
          opening shot is a landscape clip inside a portrait cut), so the whole
          step would judge glass over a black band. Under reduced motion the
          video is seeked into the second shot and paused, which is a real
          frame at the real aspect and identical between the three options; with
          motion it plays, which is the condition a backdrop filter is
          expensive under. */}
      <video
        ref={(el) => {
          if (!el) return;
          el.currentTime = still ? REEL.restAt : 0;
          if (still) el.pause();
          else void el.play().catch(() => {});
        }}
        key={still ? "still" : "playing"}
        src={REEL.src}
        autoPlay={!still}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 size-full object-cover"
      />

      <div className="absolute inset-x-0 top-1/3 px-6 text-center">
        <p className="text-[11px] font-medium tracking-[0.14em] text-white/70 uppercase">
          {EVENT.host}&rsquo;s reel
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">{EVENT.name}</p>
      </div>

      {/* The take-away row: a glass Share beside a solid white Download. The
          solid button is the constant, so the row shows the material against
          the one thing it has to sit beside. */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md px-5 pb-5">
        <div className="flex items-center gap-2">
          <Pane
            look={l}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-white"
          >
            <Share2 className="size-4" />
            Share
          </Pane>
          <span className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-medium text-zinc-900">
            <Download className="size-4" />
            Download
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/45">
          Download uses the host&rsquo;s video when it is ready
        </p>
      </div>

      <Pane
        look={l}
        className="absolute top-3 right-3 z-50 flex size-9 items-center justify-center rounded-full text-white/85"
      >
        <X className="size-4" />
      </Pane>
    </div>
  );
}

/* ── 4. the host's grid, at 1440 ──────────────────────────────────────────── */

export type RowShape = "chips" | "bar" | "today";

/**
 * THE HOST'S EVENT GALLERY AT 1440, every tile's action row drawn as if
 * hovered. The question is not the material by then but its SHAPE: three
 * separate panes over one photograph, or one pane holding three glyphs. A row
 * of discs is three blurred regions per tile; a bar is one, so the quieter
 * shape is also the cheaper one, and the step says by how much.
 */
export function GridScene({
  recipe,
  shape,
}: {
  recipe: Recipe;
  shape: RowShape;
}) {
  // "Today" is the shipped chip: a flat 40 percent black with an 8px blur.
  const today: Look = {
    className: "gl-glass",
    style: {
      "--gl-blur": "8px",
      "--gl-brightness": "1",
      "--gl-saturate": "1",
      "--gl-tint": "0.4",
      "--gl-edge": "0",
      "--gl-ring": "0",
    } as CSSProperties,
  };
  const pane = shape === "today" ? today : look(recipe, "full");
  const bar = shape === "bar";
  const glyphs = [
    <Heart key="l" className="size-4" />,
    <Download key="d" className="size-4" />,
    <EyeOff key="h" className="size-4" />,
  ];

  return (
    <div className="gl-scroll h-full w-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-7xl px-8">
        <div className="flex h-16 items-center justify-between">
          <p className="text-lg font-semibold text-foreground">{EVENT.name}</p>
          <p className="text-sm text-muted-foreground">
            {EVENT.date} · 40 items
          </p>
        </div>
        <div className="columns-5 gap-[var(--gap-gallery)] pb-10">
          {ALBUM.slice(0, 30).map((t) => (
            <div
              key={t.id}
              data-gl-tile
              className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
              style={{
                aspectRatio: t.ratio,
                borderRadius: "var(--radius-tile)",
              }}
            >
              <Image
                src={t.src}
                alt=""
                fill
                sizes={TILE_SIZES}
                className="object-cover"
              />
              {bar ? (
                <Pane
                  look={pane}
                  className="gl-bar absolute top-1.5 right-1.5 z-10 flex items-center rounded-full px-0.5"
                >
                  {glyphs.map((g, i) => (
                    <span key={i} className={CHIP}>
                      {g}
                    </span>
                  ))}
                </Pane>
              ) : (
                <div className="absolute top-1.5 right-1.5 z-10 flex items-center">
                  {glyphs.map((g, i) => (
                    <Pane key={i} look={pane} className={cn(CHIP, "ml-1")}>
                      {g}
                    </Pane>
                  ))}
                </div>
              )}
              {t.kind === "video" && (
                <Pane
                  look={pane}
                  className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full"
                >
                  <Play className="ml-px size-2.5 fill-white text-white" />
                </Pane>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 5. the light ground ──────────────────────────────────────────────────── */

export type PaperSkin = "dark" | "paper" | "edge";

const CARD_NAMES: Record<GroundId, string> = {
  bright: "Rooftop summer party",
  mid: "Jay's 30th",
  dark: EVENT.name,
};

/**
 * THE APP ON PAPER: the dashboard's event cards over their cover photographs,
 * above a gallery, with `surface-paper` forcing the light token block
 * (globals.css's sanctioned subtree-scoped light). Bible 1 says the chrome
 * stays achromatic and the photographs take the stage; what it does not say is
 * whether chrome over a photograph follows the PAGE's theme or the
 * PHOTOGRAPH's. That is the question, and it is asked on its own step because
 * dark and light are never chosen as a package.
 */
export function PaperScene({
  recipe,
  skin,
}: {
  recipe: Recipe;
  skin: PaperSkin;
}) {
  const chrome: Look =
    skin === "paper"
      ? look(recipe, "full", true)
      : skin === "edge"
        ? {
            className: "gl-glass",
            style: {
              ...recipeVars(recipe),
              "--gl-edge": "0.34",
              "--gl-ring": "0.14",
            } as CSSProperties,
          }
        : look(recipe, "full");
  const ink = skin === "paper" ? "text-foreground" : "text-white";
  const cards: GroundId[] = ["bright", "mid", "dark"];

  return (
    <div className="gl-scroll surface-paper h-full w-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-7xl px-8">
        <div className="flex h-16 items-center justify-between">
          <p className="text-lg font-semibold text-foreground">Your events</p>
          <p className="text-sm text-muted-foreground">3 live</p>
        </div>

        {/* The dashboard's event cards: a cover photograph with a status badge
            and a remove control over it. The remove control is the app's only
            chrome that already FOLLOWS the theme (unsave-button.tsx:
            `bg-background/80 backdrop-blur`), which is what makes this a real
            question rather than a preference. */}
        <div className="grid grid-cols-3 gap-4">
          {cards.map((g) => (
            <div
              key={g}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-card"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={groundSrc(g).src}
                  alt=""
                  fill
                  sizes={TILE_SIZES}
                  className="object-cover"
                />
                <Pane
                  look={chrome}
                  className={cn(
                    "absolute top-2.5 left-2.5 flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium",
                    ink,
                  )}
                >
                  <Eye className="size-3" />
                  Public
                </Pane>
                <Pane
                  look={chrome}
                  className={cn(
                    "absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full",
                    ink,
                  )}
                >
                  <X className="size-4" />
                </Pane>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground">
                  {CARD_NAMES[g]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {EVENT.date} · 40 items
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* The gallery under them, so one screen judges the same material over
            a tile and over a card. */}
        <div className="mt-6 columns-6 gap-[var(--gap-gallery)] pb-10">
          {ALBUM.slice(0, 24).map((t) => (
            <div
              key={t.id}
              data-gl-tile
              className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
              style={{
                aspectRatio: t.ratio,
                borderRadius: "var(--radius-tile)",
              }}
            >
              <Image
                src={t.src}
                alt=""
                fill
                sizes={TILE_SIZES}
                className="object-cover"
              />
              <div className="absolute top-1.5 right-1.5 z-10 flex items-center">
                <Pane look={chrome} className={cn(CHIP, "ml-1", ink)}>
                  <Heart
                    className={cn(
                      "size-4",
                      t.liked && "fill-like/25 text-like",
                    )}
                  />
                </Pane>
                <Pane look={chrome} className={cn(CHIP, "ml-1", ink)}>
                  <Download className="size-4" />
                </Pane>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
