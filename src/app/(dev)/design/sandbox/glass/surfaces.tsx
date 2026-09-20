"use client";

import "./glass.css";

import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as Opens,
  Download,
  Eye,
  EyeOff,
  Heart,
  ImageUp,
  Play,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  ALBUM,
  EVENT,
  type GroundId,
  groundSrc,
  MARKS,
  REEL,
  type Tile,
} from "./fixtures";
import { type Recipe, recipeVars } from "./recipes";

/**
 * ONE MATERIAL, SIX JOBS, ONE FRAME (round two, 2026-09-20).
 *
 * Round one asked seven questions on six screens. Six of them are ruled, so
 * round two asks ONE thing and has to ask it everywhere at once: "I don't want
 * to have separate glass treatments and would prefer to find a global that
 * works everywhere" (Will, `reel=white`). A material that wins on the lightbox
 * and loses on a mobile card is not a global, and six separate screens is
 * exactly the shape that let that go unnoticed for a round.
 *
 * ★ SO THIS IS A MATERIAL SHEET, NOT A SCREEN, AND EVERY PIECE IS 1:1. Each
 * cell is a real surface at its SHIPPED chrome size over a real photograph,
 * cropped by its bay rather than scaled into it, so the pane he judges is the
 * pane the product will draw. The photographs around the chrome are smaller
 * than life in places; the chrome never is, and the chrome is the question.
 *
 * ★ NOT ONE RESPONSIVE PREFIX IN THIS FILE, ON PURPOSE. The sheet puts a 375
 * column inside a 1440 frame, and a `md:` inside that column would resolve at
 * the FRAME's width and quietly draw the desktop shape (frame.tsx's first
 * rule). Every width here is an explicit number the cell passes down, so a
 * phone column is a phone column wherever it is drawn.
 *
 * ★ COPIES, NOT THE PRODUCTION COMPONENTS, AND THAT IS THE LANE. The lightbox
 * is a radix Dialog that portals to the body, so it leaves any frame it is
 * mounted in; the host's tile row and the guest's chips are `md:` hover
 * reveals, so at 375 there is nothing on screen to judge and at 1440 nothing is
 * hovered in a screenshot. Every className below is quoted from the shipped
 * component (media-lightbox.tsx, host-media-grid.tsx, like-button.tsx,
 * guest-masonry.tsx, guest-reel-overlay.tsx, event-card.tsx,
 * floating-add-button.tsx) with ONE substitution: the chrome's `bg-black/nn
 * backdrop-blur-sm` becomes a `Pane` wearing the material. Nothing else moves,
 * so what he judges is the material and not a redesign.
 *
 * ★ EVERY ROW IS DRAWN AS IF HOVERED, and every option draws an ACTIVE icon.
 * "Keeps an active icon a bit more visible" was his first reason for picking
 * Frost and no round has ever drawn one, let alone measured it: the rose
 * `--like` mark appears on the lightbox pill, on the mobile card and in the
 * host's bar in all three options, and `measured.ts` carries its contrast
 * against each pane on each photograph.
 *
 * ★ NOTHING INSIDE A MOVING TILE CARRIES A BACKDROP FILTER (album-fill-grid.tsx:
 * under an animating transform it flickers in Safari and forces readbacks). No
 * tile here animates, and the album's entrance stagger is deliberately left
 * off: a scroll, not an entrance, is the condition this material is measured
 * under.
 */

/* ── the material ─────────────────────────────────────────────────────────── */

/** What a surface wears: the class from glass.css and the material's numbers. */
export type Look = { className: string; style: CSSProperties };

/**
 * ★ ONE GRADE, SO THERE IS ONE FUNCTION (`grades=one`, ruled 2026-09-20: "This
 * feels more consistent across surfaces that are close to each other, else it
 * looks weird they're different"). Round one derived a quiet grade for anything
 * read-only and a flat control with no filter at all; both are gone, and every
 * pane on this sheet, including the ones you only read, wears the same numbers.
 */
export function look(recipe: Recipe): Look {
  return { className: "gl-glass", style: recipeVars(recipe) as CSSProperties };
}

/**
 * A pane of the material with the surface's own shape classes on it.
 *
 * ★ `data-gl-pane` IS THE HARNESS'S HANDLE, and `data-gl-ink` marks what sits
 * on it. The contrast numbers are read off the RENDERED pane rather than
 * computed from the material's numbers, which means the harness has to find
 * each pane inside the frame's own document and hide its glyphs so only the
 * material is in the shot. Marking them here is what keeps the measurement
 * honest when a surface moves.
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

/** Anything drawn ON a pane: the harness hides these to shoot the material. */
function Ink({ className, children, ...rest }: React.ComponentProps<"span">) {
  return (
    <span data-gl-ink="" {...rest} className={className}>
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
 * the whole board, warm in the cache by the second option.
 */
const TILE_SIZES = "384px";
/** The lightbox's own photograph, the widest thing the sheet draws. */
const HERO_SIZES = "750px";

/** The lightbox's action glyph, quoted: a 36px hit area, a 20px white icon. */
const ACTION =
  "flex size-9 items-center justify-center rounded-full text-white";
/** A tile chip, quoted from host-media-grid.tsx's ACTION_BASE. */
const CHIP = "flex size-7 items-center justify-center rounded-full text-white";

/** The phone's album column, everywhere it is drawn. */
const PHONE = 375;

/* ── the sheet's furniture ────────────────────────────────────────────────── */

/**
 * One bay of the sheet: a label outside the photograph, then the surface at
 * true size, cropped. The label sits OUTSIDE on purpose, because a word
 * printed over the material is a word competing with the thing being judged.
 *
 * Named a bay rather than a cell because `Cell` is a piece the lab kit owns
 * (kit-discipline.test.ts) and a board imports the kit's pieces rather than
 * declaring its own under the same name.
 */
function Bay({
  label,
  hint,
  h,
  pad,
  children,
  anchor = "center",
}: {
  label: string;
  hint?: string;
  h: number;
  /** False at a phone, where the media box is full-bleed so a 375 column fits exactly. */
  pad: boolean;
  anchor?: "center" | "bottom";
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className={cn("flex items-baseline gap-2 pb-1.5", pad || "px-4")}>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint ? (
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-black/20",
          anchor === "bottom" ? "flex items-end" : "flex items-center",
          "justify-center",
        )}
        style={{ height: h, borderRadius: pad ? "var(--radius-tile)" : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 1. the lightbox's action pill ────────────────────────────────────────── */

/**
 * THE SURFACE THE MATERIAL IS DECIDED ON, drawn on the ground round one ruled
 * for it: `behind=album`, the album blurred at half brightness rather than
 * today's 90 percent wall, so the pane sits over a photograph with a room
 * behind it.
 *
 * ★ THE ATTRIBUTION CAPSULE IS DRAWN AS A SURFACE YOU PRESS, and that is his
 * `grades=one` note carried forward: "With our guest/profile work, the bottom
 * uploader credit UI may become clickable soon too." One grade means it wears
 * the full material whether or not it is a control yet; the chevron says it
 * opens, and what it opens is `profile-page` round two's quick-look, so the
 * glass wiring and the profile wiring meet on this one capsule.
 */
export function LightboxCell({
  recipe,
  ground,
  w,
}: {
  recipe: Recipe;
  ground: GroundId;
  w: number;
}) {
  const l = look(recipe);
  const img = groundSrc(ground);
  const narrow = w < 560;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* The album the lightbox opened from, blurred at half brightness. */}
      <div
        className="absolute inset-0 p-2"
        style={{ columnCount: narrow ? 3 : 5, columnGap: 6 }}
      >
        {ALBUM.slice(0, 16).map((t) => (
          <div
            key={t.id}
            className="relative mb-1.5 w-full overflow-hidden"
            style={{ aspectRatio: t.ratio, borderRadius: 6 }}
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
      <div className="gl-behind absolute inset-0" />

      {/* THE PHOTOGRAPH, PORTRAIT, FILLING THE HEIGHT.
          ★ A LANDSCAPE HERE WOULD PUT THE CHROME ON THE BACKDROP, NOT ON THE
          PHOTOGRAPH. The lightbox draws an upload `object-contain`, so a 3:2
          still on a wide screen is letterboxed and the pills at the foot land
          on the black instead of on the picture: round one's first capture
          showed exactly that, and a material judged over a black wall is
          judged over nothing. A guest's phone shoots 3:4 portraits most of the
          time and those fill the height, so the ground is cropped to 3:4 here
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
        look={l}
        data-gl-pane="close"
        className="absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full text-white"
      >
        <Ink className="contents">
          <X className="size-4" />
        </Ink>
      </Pane>

      {/* The two nav zones: a soft gradient flank and a round button. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[28%] items-center bg-gradient-to-r from-black/15 to-transparent pl-1.5">
        <Pane look={l} data-gl-pane="nav" className={ACTION}>
          <Ink className="contents">
            <ChevronLeft className="size-5" />
          </Ink>
        </Pane>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-[28%] items-center justify-end bg-gradient-to-l from-black/15 to-transparent pr-1.5">
        <Pane look={l} data-gl-pane="nav" className={ACTION}>
          <Ink className="contents">
            <ChevronRight className="size-5" />
          </Ink>
        </Pane>
      </div>

      {/* THE FLOATING PILL STACK: the action pill over the attribution capsule,
          centred at the foot. Every action lives here now, which is his tiles
          rule: "let's handle all actions and controls in the lightbox controls". */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-1.5">
        <Pane
          look={l}
          data-gl-pane="pill"
          className={cn(
            "flex items-center rounded-full py-2.5",
            narrow ? "gap-2 px-3" : "gap-4 px-5",
          )}
        >
          {/* THE ACTIVE ICON, the thing his first criterion is about. */}
          <Ink data-gl-active="" className={ACTION}>
            <Heart className="size-5 fill-like/25 text-like" />
          </Ink>
          <Ink className="text-xs font-medium text-white tabular-nums">12</Ink>
          <Ink className={ACTION}>
            <Download className="size-5" />
          </Ink>
          <Ink className={ACTION}>
            <Share2 className="size-5" />
          </Ink>
          <Ink aria-hidden className="h-5 w-px bg-white/20" />
          <Ink className={ACTION}>
            <EyeOff className="size-5" />
          </Ink>
          <Ink className={ACTION}>
            <Trash2 className="size-5" />
          </Ink>
        </Pane>
        <Pane
          look={l}
          data-gl-pane="credit"
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-white/90"
        >
          <Ink className="contents">
            <span>{EVENT.guest}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70 tabular-nums">7 of 40</span>
            <Opens className="size-3 text-white/60" />
          </Ink>
        </Pane>
      </div>
    </div>
  );
}

/* ── 2. the mobile card's three permitted marks ───────────────────────────── */

/**
 * THE PHONE'S ALBUM COLUMN, ALWAYS AT 375 WHEREVER THIS CELL IS DRAWN, because
 * "the mobile media card icon background glass" is exactly the surface his note
 * named and a 700px column is not it.
 *
 * ★ THREE MARKS AND NOTHING ELSE, which is his own answer to `tiles` and a
 * standing rule for `media-viewer`, `app-vocabulary`, `guest-shape` and
 * `host-curation`: an ACTIVE like mark (never an unliked one, because that
 * would be a control), a video play mark, and a like count drawn subtly. Round
 * one drew a like and a save chip over every tile; the difference between the
 * two drawings is the point of the rule.
 */
export function MarksCell({
  recipe,
  ground,
}: {
  recipe: Recipe;
  ground: GroundId;
}) {
  const chip = look(recipe);
  // ★ THE MARKED CARDS SIT ON THE PHOTOGRAPH THE KNOB NAMES, the unmarked ones
  // stay album. Round one only ever moved the lightbox's ground, so the mobile
  // card's marks were judged over one photograph for a whole round while the
  // question was whether the material holds "in any situation". A card is
  // marked or it is not, so only the marked ones have to follow the knob, and
  // an album of one repeated photograph would be a worse lie than the first.
  const g = groundSrc(ground).src;
  return (
    <div
      className="gl-scroll h-full shrink-0 overflow-hidden"
      style={{ width: PHONE }}
    >
      <div style={{ columnCount: 2, columnGap: 8, padding: "0 16px" }}>
        {MARKS.map((t) => (
          <TileWithMarks
            key={t.id}
            tile={
              t.liked || t.likes > 0 || t.kind === "video"
                ? { ...t, src: g }
                : t
            }
            chip={chip}
          />
        ))}
      </div>
    </div>
  );
}

function TileWithMarks({ tile: t, chip }: { tile: Tile; chip: Look }) {
  return (
    <div
      data-gl-tile
      className="relative mb-2 w-full overflow-hidden bg-black/10"
      style={{ aspectRatio: t.ratio, borderRadius: "var(--radius-tile)" }}
    >
      <Image
        src={t.src}
        alt=""
        fill
        sizes={TILE_SIZES}
        style={t.at ? { objectPosition: t.at } : undefined}
        className="object-cover"
      />
      {/* 1. The ACTIVE like mark. Quoted from like-button.tsx's liked tile
             state: the rose stays visible off-hover, which is why it is the
             one mark a guest sees at rest. */}
      {t.liked && (
        <Pane
          look={chip}
          data-gl-pane="mark"
          className={cn(CHIP, "absolute top-1.5 right-1.5 z-10")}
        >
          <Ink data-gl-active="" className="contents">
            <Heart className="size-4 fill-like/25 text-like" />
          </Ink>
        </Pane>
      )}
      {/* 2. The video play mark, quoted from guest-masonry.tsx. */}
      {t.kind === "video" && (
        <Pane
          look={chip}
          data-gl-pane="play"
          className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full"
        >
          <Ink className="contents">
            <Play className="ml-px size-2.5 fill-white text-white" />
          </Ink>
        </Pane>
      )}
      {/* 3. The like count, "design to be more subtle": a state, not a control. */}
      {t.likes > 0 && (
        <Pane
          look={chip}
          data-gl-pane="count"
          className="pointer-events-none absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium text-white"
        >
          <Ink className="contents">
            <Heart className="size-3 fill-white" />
            <span className="tabular-nums">{t.likes}</span>
          </Ink>
        </Pane>
      )}
    </div>
  );
}

/* ── 3. the reel's controls, over playing video ───────────────────────────── */

/**
 * THE ONE SURFACE WHOSE BACKDROP MOVES EVERY FRAME, and the surface where he
 * picked white: "for this reel demo the white glass looks better". It is drawn
 * here in whichever material is being asked, beside the solid white Download it
 * has to live next to, because that pair is the whole reason white won here.
 *
 * Under reduced motion the reel rests on a real frame of itself (bible 14),
 * which is also what `lab:demo` sees, so the three options are compared on
 * identical pixels.
 */
export function ReelCell({ recipe }: { recipe: Recipe }) {
  const still = useStill();
  const l = look(recipe);

  return (
    <div
      className="relative h-full shrink-0 overflow-hidden bg-black"
      style={{ width: PHONE }}
    >
      {/* ★ THE REST STATE IS A FRAME OF THE REEL, NOT ITS POSTER. The poster is
          the reel's first frame and that frame is letterboxed (the engine's
          opening shot is a landscape clip inside a portrait cut), so the whole
          cell would judge glass over a black band. Under reduced motion the
          video is seeked into the second shot and paused, which is a real frame
          at the real aspect and identical between the three options; with
          motion it plays, which is the condition a backdrop filter is
          expensive under. */}
      <video
        ref={(el) => {
          if (!el) return;
          el.currentTime = REEL.restAt;
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

      {/* The take-away row: a glass Share beside a solid white Download. The
          solid button is the constant, so the row shows the material against
          the one thing it has to sit beside. */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        <div className="flex items-center gap-2">
          <Pane
            look={l}
            data-gl-pane="reel"
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-white"
          >
            <Ink className="contents">
              <Share2 className="size-4" />
              Share
            </Ink>
          </Pane>
          <span className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-medium text-zinc-900">
            <Download className="size-4" />
            Download
          </span>
        </div>
      </div>

      <Pane
        look={l}
        data-gl-pane="reel-close"
        className="absolute top-3 right-3 z-50 flex size-9 items-center justify-center rounded-full text-white/85"
      >
        <Ink className="contents">
          <X className="size-4" />
        </Ink>
      </Pane>
    </div>
  );
}

/* ── 4. the host's row, one bar ───────────────────────────────────────────── */

/**
 * THE HOST'S TILE ROW AS ONE PANE HOLDING THREE GLYPHS (`row=bar`, ruled
 * 2026-09-20: "This feels much cleaner and more cohesive"). It is no longer a
 * question of shape, so the bar is the ground and what varies is the material
 * it is made of. The first glyph is drawn ACTIVE, because a host's own like is
 * the curation signal and it is the second place the active-icon question lands.
 *
 * The tile under the bar takes the width its screen really gives it (the host's
 * five columns at 1440, the phone's two), while the bar itself is the same size
 * either way, which is exactly how the product behaves.
 */
export function HostBarCell({
  recipe,
  ground,
  tileW,
}: {
  recipe: Recipe;
  ground: GroundId;
  tileW: number;
}) {
  const l = look(recipe);
  // The tile the bar sits on follows the knob; the rest are the album.
  const tiles = ALBUM.slice(4, 8).map((t, i) =>
    i === 0 ? { ...t, src: groundSrc(ground).src } : t,
  );
  return (
    <div className="flex h-full items-start gap-2 overflow-hidden p-2">
      {tiles.map((t, i) => (
        <div
          key={t.id}
          data-gl-tile
          className="relative shrink-0 overflow-hidden bg-black/10"
          style={{
            width: tileW,
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
          {i === 0 && (
            <Pane
              look={l}
              data-gl-pane="bar"
              className="gl-bar absolute top-1.5 right-1.5 z-10 flex items-center rounded-full px-0.5"
            >
              <Ink data-gl-active="" className={CHIP}>
                <Heart className="size-4 fill-like/25 text-like" />
              </Ink>
              <Ink className={CHIP}>
                <Download className="size-4" />
              </Ink>
              <Ink className={CHIP}>
                <EyeOff className="size-4" />
              </Ink>
            </Pane>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── 5. a chip on the paper posture ───────────────────────────────────────── */

/**
 * THE SAME MATERIAL ON THE APP'S LIGHT THEME (`paper=dark`, ruled 2026-09-20):
 * chrome over a photograph belongs to the photograph, not to the page, so it
 * never changes when the theme does. That is a ruling, so the cell does not ask
 * it; it exists because a material that reads beautifully in the dark room and
 * punches a hole in a pale card is not the global he asked for.
 *
 * `surface-paper` forces the light token block (globals.css's sanctioned
 * subtree-scoped light), and the card is the dashboard's real event card, whose
 * remove control is the app's one piece of chrome that already follows the
 * theme.
 */
export function PaperCell({
  recipe,
  ground,
  w,
}: {
  recipe: Recipe;
  ground: GroundId;
  w: number;
}) {
  const l = look(recipe);
  return (
    <div className="surface-paper flex h-full w-full items-center justify-center bg-background p-3">
      <div
        className="overflow-hidden border border-border bg-card"
        style={{ width: Math.min(w - 24, 320), borderRadius: "var(--radius)" }}
      >
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={groundSrc(ground).src}
            alt=""
            fill
            sizes={TILE_SIZES}
            className="object-cover"
          />
          <Pane
            look={l}
            data-gl-pane="paper"
            className="absolute top-2.5 left-2.5 flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white"
          >
            <Ink className="contents">
              <Eye className="size-3" />
              Public
            </Ink>
          </Pane>
          <Pane
            look={l}
            data-gl-pane="paper-x"
            className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full text-white"
          >
            <Ink className="contents">
              <X className="size-4" />
            </Ink>
          </Pane>
        </div>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">{EVENT.name}</p>
          <p className="text-xs text-muted-foreground">
            {EVENT.date} · 40 items
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── 6. the guest's Add photos pill ───────────────────────────────────────── */

/**
 * THE ONE PLACE THE MATERIAL MEETS A PRIMARY ACTION. `FloatingAddButton` ships
 * SOLID (`bg-primary`, `shadow-layer`) and floats over an album that keeps
 * scrolling behind it, which makes it the surface most like a piece of glass
 * that is not one yet.
 *
 * ★ IT IS DRAWN IN THE MATERIAL IN ALL THREE OPTIONS, AND THAT IS A CALL THE
 * LANE TOOK, not a ruling: the board carries it as a call for him to overrule
 * (`call:add-pill`). It is here because a global material has to be judged
 * where it would carry the app's loudest action over the album's own scroll,
 * and because the upload button is the thing a guest presses more than anything
 * else on the page.
 */
export function AddPillCell({
  recipe,
  ground,
}: {
  recipe: Recipe;
  ground: GroundId;
}) {
  const l = look(recipe);
  // The pill floats over the album's foot, so the two tiles under it follow
  // the knob and the rest stay album.
  const g = groundSrc(ground).src;
  return (
    <div
      className="relative h-full shrink-0 overflow-hidden"
      style={{ width: PHONE }}
    >
      <div style={{ columnCount: 2, columnGap: 8, padding: "0 16px" }}>
        {ALBUM.slice(8, 14).map((t, i) => (
          <div
            key={t.id}
            className="relative mb-2 w-full overflow-hidden bg-black/10"
            style={{
              aspectRatio: t.ratio,
              borderRadius: "var(--radius-tile)",
            }}
          >
            <Image
              src={i >= 4 ? g : t.src}
              alt=""
              fill
              sizes={TILE_SIZES}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
        <Pane
          look={l}
          data-gl-pane="add"
          className="flex h-11 items-center gap-3 rounded-full px-5 text-sm font-medium text-white shadow-layer"
        >
          <Ink className="contents">
            <ImageUp className="size-4" />
            Add photos
          </Ink>
        </Pane>
      </div>
    </div>
  );
}

/* ── the sheet ────────────────────────────────────────────────────────────── */

export type ScreenId = "375" | "1440";
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/**
 * The frame each screen is drawn in: a laptop, and one long phone capture.
 *
 * ★ THE PHONE FRAME IS TALLER THAN A PHONE ON PURPOSE. It is still a real 375
 * viewport, so every breakpoint and every column resolves exactly as it does on
 * the device; it is simply not cut off at 812, because the round's whole job is
 * one material seen doing six jobs AT ONCE and a frame he has to scroll inside
 * turns that back into six comparisons held in memory. Both heights are the
 * sheet's own measured height plus a few pixels, so no option ever scrolls.
 */
export const SHEET: Record<ScreenId, { w: number; h: number }> = {
  "375": { w: 375, h: 1784 },
  "1440": { w: 1440, h: 960 },
};

/** The media box of each cell, so both layouts agree on what is croppable. */
const H = {
  lightbox: 380,
  marks: 320,
  reel: 230,
  bar: 210,
  paper: 250,
  add: 210,
} as const;

/**
 * SIX SURFACES, ONE MATERIAL, ONE FRAME. Two columns at a laptop and one at a
 * phone, in leverage order: the surface the material is decided on, then the
 * two his notes named by hand (the mobile card, the reel), then the three that
 * only have to survive it.
 */
export function MaterialSheet({
  recipe,
  ground,
  screen,
}: {
  recipe: Recipe;
  ground: GroundId;
  screen: ScreenId;
}) {
  const two = screen === "1440";
  // The bay's inner width. At a laptop the sheet is padded and split in two;
  // at a phone the media boxes are FULL BLEED, because three of the six cells
  // draw a 375 column and a padded sheet would hand them 343 and crop the
  // album's own gutter off both sides.
  const cellW = two ? (SHEET["1440"].w - 32 - 16) / 2 : SHEET["375"].w;
  // The host's tile is the width its real grid gives it: five columns inside
  // max-w-7xl at a laptop, the phone's two at 375.
  const hostTile = two ? 237 : 171;

  return (
    <div className="gl-scroll h-full w-full overflow-y-auto bg-background">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: two ? "1fr 1fr" : "1fr",
          gap: 16,
          padding: two ? 16 : "16px 0",
          alignItems: "start",
        }}
      >
        <Bay
          label="The lightbox's action pill"
          pad={two}
          hint="the album behind it, as ruled"
          h={H.lightbox}
        >
          <LightboxCell recipe={recipe} ground={ground} w={cellW} />
        </Bay>

        <Bay
          label="The card's three marks, at 375"
          pad={two}
          hint="active like, play, count"
          h={H.marks}
        >
          <MarksCell recipe={recipe} ground={ground} />
        </Bay>

        <Bay
          label="The reel's controls, playing"
          pad={two}
          hint="beside the solid Download"
          h={H.reel}
          anchor="bottom"
        >
          <ReelCell recipe={recipe} />
        </Bay>

        <Bay
          label="The host's row, one bar"
          pad={two}
          hint="its like drawn active"
          h={H.bar}
        >
          <HostBarCell recipe={recipe} ground={ground} tileW={hostTile} />
        </Bay>

        <Bay
          label="On paper"
          pad={two}
          hint="dark glass whatever the theme"
          h={H.paper}
        >
          <PaperCell recipe={recipe} ground={ground} w={cellW} />
        </Bay>

        <Bay
          label="The guest's Add photos pill"
          pad={two}
          hint="solid today: a call, not a ruling"
          h={H.add}
          anchor="bottom"
        >
          <AddPillCell recipe={recipe} ground={ground} />
        </Bay>
      </div>
    </div>
  );
}
