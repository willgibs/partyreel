"use client";

import "./album.css";

import type { CSSProperties } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";

import { FRAMES, type Mode } from "../home-hero/shared";

/**
 * THE LIVE ALBUM, WIDE (the album-hero track, round one, 2026-09-15).
 *
 * Will's ruling: "keep an album page visual wide below as the actual live album
 * product, with less animation so the hero images and album animation don't
 * conflict and get too overwhelming". So the hero is the feeling and this is the
 * product, and the split is what keeps either of them readable.
 *
 * IT IS THE SHIPPED COMPONENT, COMPOSED, NOT A DRAWING OF ONE. The grid is
 * `GuestMasonry` from src/components/guest, the real guest album: the same
 * `MediaTile`, the same natural-ratio masonry at a 3 px gap, the same
 * lightbox trigger on every tile, the same corner play badge on a video. Its
 * entrance is the product's own (globals.css fades and rises `[data-media-tile]`
 * on mount with a 45 ms stagger capped at 540 ms), which is the ONLY motion on
 * this half of the page: nothing here loops, nothing drifts, and the hero above
 * keeps the whole of the eye's appetite for movement. Production components are
 * composed and never edited, so the production change this board argues for is
 * made from the outside, in album.css, where it can be read as a diff.
 *
 * THE ONE ARGUMENT: THE ALBUM'S WIDTH, AND IT IS TWO DECLARATIONS, NOT ONE.
 * `GuestMasonry` is `columns-2` at every width, which is right on the phone it
 * was designed for. But the number that actually decides the tile is the
 * CONTAINER, and the shipped guest page caps its whole column at `max-w-2xl`
 * with `px-5` (event-experience.tsx line 165, the only place GuestMasonry is
 * ever rendered, through live-gallery.tsx): 632 px of content at EVERY
 * viewport, 1440 included. So a shipped tile today is about 314 px, not the
 * 576 px this board's own 1154 px frame gives it, and raising the column count
 * ALONE would cut those same 632 px into four tiles of about 156 px, which is
 * worse than what ships. The candidate is therefore the column rule AND a
 * wider laptop cap. The board shows the end state under the dock's Album
 * switch: 2 columns is `column-count: 2` exactly as it ships, responsive is
 * the same component with that one number driven from the width it was given
 * (album.css), inside a frame already about as wide as the widened cap would
 * be. It is an APP-UI change and therefore a candidate, not a fait accompli:
 * Will opened the app's UI to the lab tracks on 2026-09-15, and the arithmetic
 * for both declarations is in BoardMeta.
 *
 * BIBLE 4: a guest surface is the HOST'S. The chrome above the grid is the
 * event's own identity, in the shape the shipped guest page uses (the
 * left-editorial header: the event name in the heading face, the byline, then
 * the stats line), with no Partyreel mark anywhere inside the frame. The one
 * thing that is ours is the browser frame around it, which is the marketing
 * page's furniture and not the album's.
 */

/** The stand-in album: the twelve manifest photographs, at their real
 *  dimensions so the masonry lays them out at natural ratios exactly as it will
 *  lay out a guest's. Will's 24 squares (ASSETS row 2) and the 4:5 portraits
 *  (row 9) replace them by id, and the portraits are what this grid most wants:
 *  eleven of the twelve stand-ins are landscape, so the masonry reads flatter
 *  here than a real album does. Every tile is a photograph until Will's clips
 *  land: MediaTile renders a real <video> for a video item, and pointing one at
 *  a jpg would show an empty box rather than the corner play badge the grid is
 *  being judged on (asked for in BoardMeta). */
const ALBUM_ITEMS: GridMedia[] = FRAMES.map((id) => {
  const img = marketingImage(id);
  return {
    id: `alb-${id}`,
    type: "photo",
    url: img.src,
    width: img.width,
    height: img.height,
  } satisfies GridMedia;
});

/** The demo event the whole site already uses for its album stand-in, so the
 *  page does not invent a second one (arrivals-stage.tsx ships this name). */
const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June 2026",
  photos: 142,
  guests: 23,
  url: "partyreel.com/a/maya-and-jay",
} as const;

export function AlbumVisual({
  mode,
  cols,
  runId,
}: {
  mode: Mode;
  /** The masonry's column count: 2 is what ships, the rest is the candidate. */
  cols: number;
  /** Bumped by Replay; remounts the grid so the product's entrance replays. */
  runId: number;
}) {
  const phone = mode === "phone";
  return (
    /* The album is its own chapter under a full-bleed hero, so it opens on
       real air rather than butting the field's dissolving edge: the top pad is
       deliberately larger than the bottom one, which is the hand-off Will asked
       to be able to judge (the hero is the feeling, this is the product). */
    <div
      className={`alb-album ${phone ? "px-4 pt-12 pb-10" : "px-16 pt-20 pb-16"}`}
    >
      <BrowserFrame
        label={EVENT.url}
        className={phone ? "" : "mx-auto max-w-[1180px]"}
      >
        {/* THE HOST'S EVENT, not ours (bible 4). The shape is the shipped guest
            header's: name, byline, stats. */}
        <div
          className={`flex flex-wrap items-end justify-between gap-3 ${phone ? "px-2 pt-1 pb-4" : "px-3 pt-2 pb-6"}`}
        >
          <div className="min-w-0">
            <p
              className={`font-heading leading-snug text-balance ${phone ? "text-[22px]" : "text-[28px]"}`}
            >
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
          {/* The album's one live signal, and the only thing on this half of the
              page that moves on its own: a 2 s pulse on a 6 px dot. Feedback
              colour as STATE, the product's own green, and it stops dead under
              reduced motion (album.css). */}
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span aria-hidden className="alb-live-dot" />
            Live now
          </span>
        </div>
        <div
          key={`${mode}-${cols}-${runId}`}
          className="alb-grid"
          style={{ "--alb-cols": cols } as CSSProperties}
        >
          <GuestMasonry items={ALBUM_ITEMS} />
        </div>
      </BrowserFrame>
    </div>
  );
}
