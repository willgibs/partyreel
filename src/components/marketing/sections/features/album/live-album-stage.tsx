"use client";

// The stage's own sheet: its two geometries, the album's window, the dissolve
// and the halo's object. No keyframe in it (src/app/keyframe-uniqueness.test.ts).
import "./live-album.css";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { BrowserFrame } from "@/components/marketing/frames";
import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import {
  AlbumStreamTarget,
  type StreamTarget,
} from "@/components/shared/album-stream/album-stream";
import {
  GAP,
  mod,
  STAGE,
  STREAM,
} from "@/components/shared/album-stream/stream-engine";
import { Glow } from "@/components/shared/glow";
import { MasonryColumns } from "@/components/shared/masonry";
import { marketingImage } from "@/lib/constants/marketing-media";
import { DEFAULT_ROW_STEP } from "@/lib/shared/album-rows";
import { ARRIVAL_GLOW_MS, useArrivalMarks } from "@/lib/shared/arrival";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE LIVE ALBUM, UNDER THE HEADLINE (the album-wiring lane, 2026-09-19; its
 * arrivals, album-motion r1, 2026-09-29).
 *
 * Will's `visual=live` on the album page: the real guest album under the
 * host's own header and the Live now pill. So the page's hero stops showing an
 * album FILLING (a demo of a mechanic) and shows the album ITSELF, which is what
 * the page is about; and since his `fall=push`, the album takes each photograph
 * the stream above it hands over the way a guest's album takes an upload: its
 * row opens from the left edge, its neighbours gliding aside, only a glow
 * fading (`arrival=push`, `arrival.css`).
 *
 * ★ IT IS THE SHIPPED COMPONENT, COMPOSED, NOT A MOCK. The album is the guest
 * album's own rows (`MasonryColumns` in `rows`, the grid `GalleryRows` mounts
 * for a guest, its step and its entrance), laid PLAIN: the guest's `double`
 * rhythm leads about one row in six with a landscape at twice the height, and on
 * a stage that shows two rows that is one photograph filling the album. The
 * arrival is the rows' own push, written by the rows themselves in the render
 * that lands the photograph, and the glow is the grammar's own hold
 * (`useArrivalMarks`), so nothing here draws an arrival of its own.
 *
 * ★ THE ALBUM SCROLLS IN ITS OWN WINDOW, NEVER THE PAGE (live-album.css's
 * `.alb-clip`). The rows keep what a reader is looking at still by scrolling
 * their scroller as far as an arrival moved it, and a clipped stage's rows go on
 * far below what it shows; anchored on the page, every arrival would move the
 * page under a reader scrolled a little past the album's first row.
 *
 * ★ 896, THE SCALE'S STEP; ITS FOOT DISSOLVES and its light is a HALO (his
 * `light=halo`). Every number here is the STREAM's (`STAGE`, `GAP`), so the
 * photographs falling in dissolve on the edge that is really drawn.
 *
 * ★ DECORATIVE, AND NOTHING IN IT IS FOCUSABLE. The album's tiles are buttons
 * that open a lightbox on the real product; on a marketing page they are a
 * picture of an album. `inert` takes the whole stage out of the tab order and
 * off the accessibility tree without touching the component.
 *
 * ★ THE MEDIA IS A SLOT (his note: "We will replace the album media before
 * launch, likely with Higgsfield generations", ASSETS row 22). Every frame is
 * resolved through the media manifest by id, so the swap is a data change and
 * nothing here names a picture.
 */

/** One photograph in the album: its id, and which of the twelve stills it is. */
type Still = { id: string; photo: number };

/**
 * THE ALBUM, AS IT OPENS: the twelve manifest stills, none twice.
 *
 * ★ TWELVE, AND NONE TWICE, EVER. Two rows of three at 896 (about three rows of
 * two at a phone) is as much as the stage shows, so twelve fills it with the
 * rest under the dissolve and no photograph appears in the frame twice,
 * which a repeat inside one screen reads as at once. It is also what a tile
 * costs: it serves the source file straight (a real guest tile is a
 * server-sized preview, and a marketing still has no derivative), so every
 * extra tile is the whole still decoded. The arrivals keep it twelve
 * (`LiveAlbum`).
 */
const OPENING: readonly Still[] = STREAM_FRAMES.map((id, i) => ({
  id: `alb-${id}-${i}`,
  photo: i,
}));

/** The ids the album gives its arrivals, so the glow can find them. */
const ARRIVAL = "alb-arrival-";

/** A still at its real dimensions, as the rows lay a guest's photograph. */
function mediaOf({ id, photo }: Still): GridMedia {
  const img = marketingImage(STREAM_FRAMES[photo]);
  return {
    id,
    type: "photo",
    url: img.src,
    width: img.width,
    height: img.height,
  };
}

const LiveAlbumState = createContext<readonly Still[] | null>(null);

/** How far ahead the album readies its photographs: every frame the stream
 *  has in the air at its busiest, and the next to leave. */
export const READY_AHEAD =
  Math.max(STREAM.lg.facts.lit, STREAM.base.facts.lit) + 1;

/**
 * THE ALBUM THE STREAM FALLS INTO: holds it, and hands the stream its end of
 * it (`AlbumStreamTarget`). It wraps the hero, since the stream is the hero's
 * backdrop and the stage its child; both only read the context, so the lockup
 * between them stays server-rendered.
 *
 * ★ THE ALBUM IS A RING OF THE TWELVE. Each arrival is taken from the album's
 * own TAIL, under the dissolve where nobody sees it go, and pushed in at the
 * head: the album never grows, never holds a still twice, and costs the same an
 * hour in as at load. The stream asks which still comes next (`upcoming`: the
 * tail, then the one above it), so the photograph that dissolves at the edge is
 * the one whose row opens. A turn of the ring is one push at the head and one
 * hide at the tail, which the rows lay as a local reflow at every width the
 * stage is drawn at, so every arrival pushes rather than re-laying the album
 * (`live-album-stage.test.tsx` holds both).
 */
export function LiveAlbum({ children }: { children: ReactNode }) {
  const [album, setAlbum] = useState<readonly Still[]>(OPENING);
  // The stream asks between renders, so the album it reads is the one the last
  // arrival left, not the one the last render drew.
  const current = useRef(album);
  const count = useRef(0);
  /** The stills already fetched and decoded into this document, by address. */
  const ready = useRef(new Map<string, HTMLImageElement>());

  const target = useMemo<StreamTarget>(
    () => ({
      upcoming: (ahead) => {
        const a = current.current;
        return a[mod(a.length - 1 - ahead, a.length)].photo;
      },
      arrive: (photo) => {
        const a = current.current;
        // Its own copy leaves as it goes in (the tail, unless the stream was
        // interrupted mid-album); a still the album somehow lacks takes the
        // tail's place instead, so it stays twelve either way.
        const at = a.findIndex((s) => s.photo === photo);
        const rest =
          at >= 0 ? [...a.slice(0, at), ...a.slice(at + 1)] : a.slice(0, -1);
        const next = [{ id: `${ARRIVAL}${++count.current}`, photo }, ...rest];
        current.current = next;
        setAlbum(next);
      },
    }),
    [],
  );

  // ★ EACH PHOTOGRAPH IS READY BEFORE ITS ROW OPENS. The album's tail sits
  // under the dissolve, where its lazy tiles never come near enough the view
  // to load, and it is exactly what the next arrivals take: each would open
  // its row on a shimmer and fade its photograph in late. So the stills the
  // album takes next are fetched and decoded into this document as they come
  // up, and the push reveals a photograph. A tile that mounts on an image this
  // document already holds is also one the grid never aborts: in development,
  // React's second pass over a ref ran the grid's cleanup, which cancels an
  // unfinished download (`abortUnfinishedImages`), on every arrival, and left
  // it blank.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let k = 0; k < Math.min(READY_AHEAD, album.length); k++) {
      const { src } = marketingImage(
        STREAM_FRAMES[album[album.length - 1 - k].photo],
      );
      if (ready.current.has(src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.decode?.().catch(() => {});
      ready.current.set(src, img);
    }
  }, [album]);

  return (
    <AlbumStreamTarget.Provider value={target}>
      <LiveAlbumState.Provider value={album}>
        {children}
      </LiveAlbumState.Provider>
    </AlbumStreamTarget.Provider>
  );
}

/** The demo event the whole site already uses. */
const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June 2026",
  photos: 142,
  guests: 23,
  url: "partyreel.com/a/maya-and-jay",
} as const;

/**
 * ★ THE HALO LIGHTS AN OBJECT FROM BEHIND, ITS FACE CLEAN (Will's fence on the
 * halo, 2026-09-17, and his words here: the rim and the chrome glow, the
 * photographs stay clean). The frame's card is lifted off it and put under the
 * wash, so the colour climbs the rim, the window bar and the header type while
 * the photographs, which are opaque, are untouched. The clip is a `clip-path`
 * in the object's own silhouette and not an `overflow` (live-album.css).
 */
function Halo({
  colors,
  children,
}: {
  colors?: readonly string[];
  children: ReactNode;
}) {
  return (
    <div
      className="alb-halo relative isolate"
      style={{ "--glw-radius": "var(--radius-2xl)" } as CSSProperties}
    >
      <Glow
        shape="halo"
        colors={colors}
        vars={{
          "--glw-blur": "22px",
          "--glw-core": "38%",
          "--glw-strength": "0.9",
          "--glw-base": "0.75",
          // The one lamp clock, read from its token (8s on the whole
          // page): never a literal, or this lamp drifts out of the
          // page's register the next time that number changes.
          "--glw-dur": "var(--spill-cadence)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function LiveAlbumStage() {
  const host = useRef<HTMLDivElement | null>(null);
  // Colour: the light is the colour of what the visitor is looking at, read off
  // the photographs once they have painted; the house five stand in until then.
  const colors = useSampledPaletteFromDom(host, { limit: 6 });
  // Inside `LiveAlbum` the album takes the stream's arrivals; on its own it is
  // the album as it opens, still.
  const album = useContext(LiveAlbumState) ?? OPENING;
  const items = useMemo(() => album.map(mediaOf), [album]);
  // Every arrival glows once, for the grammar's own two seconds, exactly as a
  // guest's album marks a photograph somebody else sent.
  const arrivals = useMemo(
    () => album.filter((s) => s.id.startsWith(ARRIVAL)).map((s) => s.id),
    [album],
  );
  const arrived = useArrivalMarks(arrivals, ARRIVAL_GLOW_MS);

  return (
    <div
      ref={host}
      aria-hidden
      inert
      className="alb-stage relative isolate mx-auto w-full max-w-4xl"
      // Every one of these is the stream's own number, so the album's top edge
      // is where the engine aims the photographs and the two cannot drift; the
      // glow's life rides the album's box, as it does on a guest's.
      style={
        {
          "--alb-h-base": `${STAGE.base.h}px`,
          "--alb-h-lg": `${STAGE.lg.h}px`,
          "--alb-fade-base": `${STAGE.base.fade}px`,
          "--alb-fade-lg": `${STAGE.lg.fade}px`,
          "--alb-gap-base": `${GAP.base}px`,
          "--alb-gap-lg": `${GAP.lg}px`,
          "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
        } as CSSProperties
      }
    >
      {/* THE DISSOLVE IS OUTSIDE THE LIGHT, and the light's box is the album a
          reader can SEE. The halo's mask is a share of its own box, so wrapping
          it around the frame's full natural height would put the clear core far
          below the fold and light the album by accident. Inside the clip it is
          the album as it is drawn, and the foot's fade takes the light down with
          the photographs so the album goes out rather than stopping. */}
      <div className="alb-clip">
        <Halo colors={colors ?? undefined}>
          <BrowserFrame label={EVENT.url} className="alb-frame">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1 pt-1 pb-4 sm:px-2 sm:pt-2 sm:pb-5">
              <div className="min-w-0">
                {/* The event's name wears exactly what the real guest page
                    gives it (`event-experience.tsx`): the `page` step, on the
                    heading face, balanced. A stage that draws the product may
                    not invent a size for it. */}
                <p className="font-heading text-page text-balance">
                  {EVENT.name}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    <span className="text-muted-foreground/70">Hosted by </span>
                    <span className="font-medium text-foreground">
                      {EVENT.host}
                    </span>
                  </span>
                  <span aria-hidden className="text-muted-foreground/50">
                    ·
                  </span>
                  <span>{EVENT.date}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {EVENT.photos} photos &amp; videos from {EVENT.guests} guests
                </p>
              </div>
              {/* --success stays the dot's colour: feedback state, never
                  decoration. No ping here: the stream above is the page's one
                  piece of live motion, and a second clock beside it is noise. */}
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-success"
                />
                Live now
              </span>
            </div>
            <div className="alb-grid">
              <MasonryColumns
                layout="rows"
                items={items}
                stagger
                rowStep={DEFAULT_ROW_STEP}
                arrivedIds={arrived}
                // Not the page's subject: an open photograph (which `inert`
                // forbids anyway) would not claim the page's address.
                photoAddress={false}
              />
            </div>
          </BrowserFrame>
        </Halo>
      </div>
    </div>
  );
}
