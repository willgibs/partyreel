"use client";

// The stage's own sheet: the column count, the dissolve and the halo's object.
// No keyframe in it (src/app/keyframe-uniqueness.test.ts).
import "./live-album.css";

import { type CSSProperties, type ReactNode, useRef } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { BrowserFrame } from "@/components/marketing/frames";
import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { GAP, STAGE } from "@/components/shared/album-stream/stream-engine";
import { Glow } from "@/components/shared/glow";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE LIVE ALBUM, UNDER THE HEADLINE (the album-wiring lane, 2026-09-19).
 *
 * Will's `visual=live` on the album page: "The real guest album under the
 * host's own header: the masonry, three columns at 896 and two at a phone, the
 * Live now pill." So the page's hero stops showing an album FILLING (a demo of
 * a mechanic) and shows the album ITSELF, which is what the page is about.
 *
 * ★ IT IS THE SHIPPED COMPONENT, COMPOSED, NOT A MOCK. The masonry is
 * `GuestMasonry`, the real guest album, under the host's own header (bible 4: a
 * guest surface is the host's, so no Partyreel mark inside the frame). Its
 * column count is set from OUTSIDE, through a variable the sheet reads, so the
 * product is never forked for a marketing stage.
 *
 * ★ 896, THE SCALE'S STEP. Will ruled 880 on the album hero's width step; the
 * container scale's nearest step is `max-w-4xl` (896), so the column takes that
 * and the page gains no one-off width. At a phone it is the container less the
 * page's gutter, which is what the product ships on a phone.
 *
 * ★ ITS FOOT DISSOLVES and its light is a HALO (his `light=halo`: "This is
 * gorgeous and a beautiful delight to make the photos falling into the album
 * feel more infused"). `ScreenLamp` leaves this hero with it: a lamp under the
 * frame lights a floor the album no longer has, because the album no longer
 * ends, it fades. Every number here is the STREAM's (`STAGE`, `GAP`), so the
 * photographs falling in land on the edge that is really drawn.
 *
 * ★ DECORATIVE, AND NOTHING IN IT IS FOCUSABLE. `GuestMasonry`'s tiles are
 * buttons that open a lightbox on the real product; on a marketing page they
 * are a picture of an album. `inert` takes the whole stage out of the tab order
 * and off the accessibility tree without touching the component.
 *
 * ★ THE MEDIA IS A SLOT (his note: "We will replace the album media before
 * launch, likely with Higgsfield generations", ASSETS row 22). Every frame is
 * resolved through the media manifest by id (bible 18), so the swap is a data
 * change and nothing here names a picture.
 */

/**
 * The stand-in album: the twelve manifest photographs at their real dimensions,
 * so the masonry lays them out exactly as it lays out a guest's.
 *
 * ★ TWELVE, AND NONE TWICE. Three columns over the album's visible 600 px is
 * about nine tiles, so twelve fills it with room to spare and no photograph
 * appears in the frame twice, which a repeat inside one screen reads as at
 * once. It is also what a `MediaTile` costs: it serves the source file
 * straight (a real guest tile is a server-sized preview, and a marketing still
 * has no derivative), so every extra tile is the whole still decoded for a
 * 287 px box. The generated set fixes the other half of that (ASSETS row 22).
 */
const ITEMS: GridMedia[] = STREAM_FRAMES.map((id, i) => {
  const img = marketingImage(id);
  return {
    id: `alb-${id}-${i}`,
    type: "photo",
    url: img.src,
    width: img.width,
    height: img.height,
  } satisfies GridMedia;
});

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
          // The one lamp clock, read from its token (Will ruled 8s on the whole
          // page, 2026-09-17): never a literal, or this lamp drifts out of the
          // page's register the next time the ruling moves.
          "--glw-dur": "var(--spill-cadence)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function LiveAlbumStage() {
  const host = useRef<HTMLDivElement | null>(null);
  // Law 3: the light is the colour of what the visitor is looking at, read off
  // the photographs once they have painted; the house five stand in until then.
  const colors = useSampledPaletteFromDom(host, { limit: 6 });

  return (
    <div
      ref={host}
      aria-hidden
      inert
      className="alb-stage relative isolate mx-auto w-full max-w-4xl"
      // Every one of these is the stream's own number, so the album's top edge
      // is where the engine aims the photographs and the two cannot drift.
      style={
        {
          "--alb-h-base": `${STAGE.base.h}px`,
          "--alb-h-lg": `${STAGE.lg.h}px`,
          "--alb-fade-base": `${STAGE.base.fade}px`,
          "--alb-fade-lg": `${STAGE.lg.fade}px`,
          "--alb-gap-base": `${GAP.base}px`,
          "--alb-gap-lg": `${GAP.lg}px`,
        } as CSSProperties
      }
    >
      {/* THE DISSOLVE IS OUTSIDE THE LIGHT, and the light's box is the album a
          reader can SEE. The halo's mask is a share of its own box, so wrapping
          it around the frame's full natural height (about 1600 px at 896) would
          put the clear core a thousand pixels below the fold and light the
          album by accident. Inside the clip it is 896 by 600, the album as it
          is drawn, and the foot's fade takes the light down with the
          photographs so the album goes out rather than stopping. */}
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
              <GuestMasonry items={ITEMS} />
            </div>
          </BrowserFrame>
        </Halo>
      </div>
    </div>
  );
}
