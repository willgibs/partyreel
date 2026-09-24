"use client";

import { type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, Link2, MessageCircle, Share, Square } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { CornerPlayBadge, GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn, formatEventDate } from "@/lib/utils";

import { ALBUM, EVENT, OPENED } from "./fixtures";

/**
 * THE ALBUM THE VIEWER OPENS OUT OF, IN PARTS, SO ONLY THE VIEWER MOVES.
 *
 * Every picture on this board is one open wedding at a real screen with exactly
 * one thing changed, and that thing is always what a tap on a tile opened. The
 * page under it is NOT a variable here: the album is the ruled column rule
 * (`GALLERY_COLUMNS`) and the shipped `MediaTile`, and the header is the
 * shipped header's shape. `guest-shape` owns the chrome around the album and
 * `gallery-width` ruled the columns; both are worn here as settled law.
 *
 * ★ WHAT IS THE SHIPPED COMPONENT AND WHAT IS QUOTED. The tile (`MediaTile`),
 * the column rule (`GALLERY_COLUMNS`), the corner play marker
 * (`CornerPlayBadge`), the wordmark (`Logo`) and every button (`Button`) are
 * imported and never edited. Three things are quoted, each for a landmine
 * rather than a preference:
 *
 *  1. `MasonryColumns` MOUNTS the lightbox (`MediaLightboxLazy`) and a
 *     `LikeButton` per tile, and this whole board is about replacing that
 *     lightbox: every option but today's would have to go around it. So the
 *     album is laid out here with the same rule and the same tile, and nothing
 *     on this board opens a real dialog.
 *  2. `guest-header.tsx` resolves the visitor's Supabase session on mount, so
 *     in a frame it would draw whoever the author is signed in as and fetch
 *     `/api/me/menu` once per frame on the stage.
 *  3. A radix Dialog portals to `document.body`, which inside a lab frame is
 *     the BOARD's body and not the frame's, so a real `MediaLightbox` would
 *     leave the picture entirely. The viewer is reproduced in `viewer.tsx`,
 *     class for class where it is today's answer.
 *
 * Nothing quoted carries a rule of its own: the tokens, the type steps, the
 * corners and the material are read from the real sheet the frame copies.
 */

/* ── the screens ─────────────────────────────────────────────────────────── */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** Board state arrives as strings; anything unknown falls back to phone first. */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/* ── the album ───────────────────────────────────────────────────────────── */

/** Today's own-item mark, quoted at rest (`masonry.tsx`'s `MineMark`, its
 *  unlabeled glass dot, top-left, the `dot` option). */
function MineDot() {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full",
        GLASS_MARK,
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-white", GLASS_MARK_LIT)} />
    </span>
  );
}

/** The same corner, worded (the `label` option): legible cold, no tap or
 *  tooltip needed to learn what the dot never says. */
function MineLabel() {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1.5 left-1.5 z-10 flex h-5 items-center rounded-full px-2 text-[10px] font-semibold text-white",
        GLASS_MARK,
      )}
    >
      Yours
    </span>
  );
}

/**
 * The album, laid out by the ruled column rule with the shipped tile. `lit`
 * marks the tile a tap opened: `opening`'s growing photograph flies out of its
 * box and `wayout`'s swipe down puts it back, so both need to know where it is
 * and both MEASURE it rather than assuming.
 *
 * `mineIds`/`mineStyle` are round 2's `mine`: every other ask leaves both
 * unset, so nothing here changes for them. `ring` wears no corner glyph at
 * all (a soft accent ring round the whole tile instead); `none` marks the
 * `data-mv-mine` attribute for measurement but draws nothing.
 */
export function LabMasonry({
  items = ALBUM,
  lit,
  mineIds,
  mineStyle,
}: {
  items?: GridMedia[];
  /** The index whose tile the viewer came out of. */
  lit?: number;
  /** The tiles this device added, for `mine`'s own-item mark. */
  mineIds?: ReadonlySet<string>;
  /** Which of `mine`'s four treatments a marked tile wears. */
  mineStyle?: "dot" | "label" | "ring" | "none";
}) {
  return (
    <div className={GALLERY_COLUMNS}>
      {items.map((item, i) => {
        const mine = mineIds?.has(item.id) ?? false;
        return (
          <div
            key={item.id}
            data-media-tile
            data-mv-lit={i === lit ? "" : undefined}
            data-mv-mine={mine ? (mineStyle ?? "none") : undefined}
            style={
              {
                aspectRatio: `${item.width} / ${item.height}`,
                borderRadius: "var(--radius-tile)",
              } as CSSProperties
            }
            className={cn(
              "group relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10",
              mine &&
                mineStyle === "ring" &&
                "ring-2 ring-brand ring-offset-2 ring-offset-background",
            )}
          >
            <MediaTile item={item} playBadge="none" />
            {item.type === "video" && <CornerPlayBadge />}
            {mine && mineStyle === "dot" && <MineDot />}
            {mine && mineStyle === "label" && <MineLabel />}
          </div>
        );
      })}
    </div>
  );
}

/* ── the page ────────────────────────────────────────────────────────────── */

/**
 * The guest album page at a real screen, scrolled so the album fills it. The
 * scroll is what makes "the album is still there behind the viewer" a real
 * question rather than a picture of a header.
 */
export function AlbumPage({
  screen,
  lit = OPENED,
  children,
  /** The browser's own bar over the page, which only `link` asks about. */
  browser,
  /** `mv-returning` lights the tile a dismissing photograph is heading for. */
  pageClass,
  /** `mine`'s own two: the tiles this device added, and their treatment. */
  mineIds,
  mineStyle,
  /** False shows the page from its own top (`mine`'s ground: the grid is the
   *  whole question, so the header stands rather than scrolling off). */
  scrolled = true,
}: {
  screen: ScreenId;
  lit?: number;
  pageClass?: string;
  /** Whatever stands over the album: the viewer, in one of its shapes. */
  children?: ReactNode;
  browser?: ReactNode;
  mineIds?: ReadonlySet<string>;
  mineStyle?: "dot" | "label" | "ring" | "none";
  scrolled?: boolean;
}) {
  const phone = screen === "375";
  return (
    <div
      className={cn(
        "relative min-h-dvh bg-background text-foreground",
        pageClass,
      )}
    >
      {/* The page, scrolled to the album by default. A negative margin on the
          scroller is how a frame shows the MIDDLE of a page without a script:
          the header is above the fold and the album fills the screen, exactly
          as it does when a guest taps a tile. `mine` turns it off: the grid
          is the whole question, so its own header stands rather than
          scrolling away. */}
      <div
        className={cn(
          "px-5",
          scrolled && (phone ? "-mt-[212px]" : "mx-auto -mt-[184px] max-w-[1180px]"),
          !scrolled && !phone && "mx-auto max-w-[1180px]",
        )}
      >
        <header className="flex items-center justify-between gap-2 py-3">
          <Logo />
          <Button variant="ghost" size="sm">
            Start for free
          </Button>
        </header>
        <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
        <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-faint">Hosted by</span>
          <span className="font-medium text-foreground">{EVENT.host}</span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(EVENT.date)}</span>
        </p>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          {ALBUM.length} photos &amp; videos from {EVENT.guests} guests
        </p>
        <LabMasonry lit={lit} mineIds={mineIds} mineStyle={mineStyle} />
      </div>
      {browser}
      {children}
    </div>
  );
}

/* ── the browser's own bar, for the one decision about an address ────────── */

/**
 * Safari's bottom bar at a phone and the address field at a laptop, quoted.
 * `link` is the only decision that asks what the URL says, and a URL a reader
 * cannot see is not an answer: this draws the one line that changes.
 */
export function BrowserBar({ screen, url }: { screen: ScreenId; url: string }) {
  if (screen === "375")
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center gap-3 border-t border-white/10 bg-[#1c1c1e] px-4 pt-2.5 pb-5 text-white/90">
        <ChevronLeft aria-hidden className="size-5 text-white/35" />
        <span
          data-mv-url
          className="flex-1 truncate rounded-lg bg-white/10 px-3 py-1.5 text-center text-[13px]"
        >
          {url}
        </span>
        <Share aria-hidden className="size-5 text-white/70" />
        <Square aria-hidden className="size-5 text-white/70" />
      </div>
    );
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center gap-3 border-b border-white/10 bg-[#1c1c1e] px-4 py-2 text-white/90">
      <ChevronLeft aria-hidden className="size-4 text-white/35" />
      <span
        data-mv-url
        className="flex-1 truncate rounded-lg bg-white/10 px-3 py-1 text-[13px]"
      >
        {url}
      </span>
      <Share aria-hidden className="size-4 text-white/70" />
    </div>
  );
}

/**
 * The system share sheet, quoted: it is the OS's surface and never ours, so
 * what `link` really asks is WHAT IS IN IT. The row at the top is what the
 * phone would hand on: a link card, a link card that carries this photograph,
 * or the photograph itself.
 */
export function ShareSheet({
  kind,
  thumb,
  title,
  subtitle,
  screen,
}: {
  kind: "link" | "image";
  thumb: string;
  title: string;
  subtitle: string;
  screen: ScreenId;
}) {
  return (
    <div
      data-mv-sheet
      // What the system is being handed, said in the markup rather than
      // guessed from a file extension: the link option's card carries THIS
      // photograph as its thumbnail, so a reader of the src alone called a
      // link "the photograph's own bytes".
      data-mv-carries={kind}
      // It stands ON the phone's own bottom bar, never under it: a sheet whose
      // last row is behind Safari's chrome is a sheet nobody can read. A laptop
      // hands a panel rather than a full-width sheet.
      className={cn(
        "absolute z-[70] rounded-t-[20px] bg-[#2c2c2e] px-4 pt-3 pb-6 text-white shadow-[0_-12px_40px_rgb(0_0_0/0.5)]",
        screen === "375"
          ? "inset-x-0 bottom-[70px]"
          : "bottom-0 left-1/2 w-[420px] -translate-x-1/2",
      )}
    >
      <span
        aria-hidden
        className="mx-auto mb-4 block h-1 w-9 rounded-full bg-white/25"
      />
      <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a lab fixture, not a served asset */}
        <img
          src={thumb}
          alt=""
          className={cn(
            "size-12 shrink-0 object-cover",
            kind === "image" ? "rounded-md" : "rounded-lg",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">
            {title}
          </span>
          <span className="block truncate text-[13px] text-white/55">
            {subtitle}
          </span>
        </span>
      </div>
      <div className="mt-4 flex items-center gap-5 text-[11px] text-white/70">
        <span className="flex flex-col items-center gap-1.5">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#34c759]/90">
            <MessageCircle aria-hidden className="size-5 text-white" />
          </span>
          Messages
        </span>
        <span className="flex flex-col items-center gap-1.5">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/12">
            <Link2 aria-hidden className="size-5 text-white" />
          </span>
          Copy
        </span>
      </div>
    </div>
  );
}
