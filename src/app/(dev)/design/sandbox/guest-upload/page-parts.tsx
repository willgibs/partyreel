"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { Bookmark, Check, ImageUp, Play, QrCode } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, type Picked } from "./fixtures";

/**
 * THE GUEST PAGE AROUND THE UPLOAD, IN PARTS, SO ONLY THE UPLOAD MOVES.
 *
 * Every picture on this board is one open wedding at a real screen with exactly
 * one thing changed, and that thing is always the act of adding a photograph.
 * The page's own shape is NOT a variable here: the chrome is the shipped column
 * (`guest-shape` is asking whether it should be), the album is the shipped
 * `GALLERY_COLUMNS` rule and the shipped `MediaTile`, and the words above it
 * are the shipped header. Anything this board changes, it changes inside the
 * upload.
 *
 * ★ WHAT IS THE SHIPPED COMPONENT AND WHAT IS QUOTED. The wordmark (`Logo`),
 * every button (`Button`), the floating pill (`FloatingAddButton`), the tile
 * (`MediaTile`) and the album's column rule (`GALLERY_COLUMNS`) are imported
 * and never edited. Three things are quoted, each for a reason that is a
 * landmine rather than a preference:
 *
 *  1. `guest-header.tsx` resolves the visitor's Supabase session on mount, so
 *     in a frame it would draw whoever the author is signed in as and fetch
 *     `/api/me/menu` once per frame on the stage.
 *  2. `event-experience.tsx` is the page's own shell: it wants a gallery
 *     PROMISE, four imperative handles and a router, and what this board asks
 *     about is one slot inside the shape it composes.
 *  3. `GuestMasonry` accepts exactly ONE pending-tile shape (a bar, or a
 *     dimmed retry button) and five of this board's decisions are about
 *     REPLACING that shape, so every option but today's would have to go
 *     around it. Rather than judge today's chrome through one component and
 *     its alternatives through another, ALL of them are drawn through
 *     `LabMasonry` below, whose landed tile is `guest-masonry.tsx`'s copied
 *     line for line and whose in-flight tile is that file's pending tile
 *     copied the same way. The chrome under decision is the only thing that
 *     differs between options, which is the whole point of a board.
 *
 * Nothing quoted carries a rule of its own: the tokens, the type steps, the
 * corners and the material are all read from the real sheet the frame copies.
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

/** The words' column and the album's bleed, quoted from `event-experience.tsx`. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-5";

/* ── the top bar ─────────────────────────────────────────────────────────── */

/**
 * `guest-header.tsx`, quoted: the wordmark and the one Partyreel sentence a
 * host's event carries (bible 4). Held constant across every option, so no
 * decision here is secretly a decision about the growth hook.
 */
export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </div>
    </header>
  );
}

/* ── the event block ─────────────────────────────────────────────────────── */

/** The left-editorial header, quoted: name, byline, count, description. */
export function EventBlock({ count }: { count: number }) {
  return (
    <header>
      <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
      <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="text-faint">Hosted by</span>
          <span className="font-medium text-foreground">{EVENT.host}</span>
        </span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span>{formatEventDate(EVENT.date)}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {count} photos &amp; videos from {EVENT.guests} guests
      </p>
      <p className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground">
        {EVENT.description}
      </p>
    </header>
  );
}

/* ── the actions ─────────────────────────────────────────────────────────── */

/**
 * The shipped action block: a full-width primary Add over the Save and Invite
 * row. `add` replaces the primary (that is what `tap` asks) and `under` is the
 * line beneath it (that is what `warning` asks).
 */
export function ActionBlock({
  add,
  under,
}: {
  add?: ReactNode;
  under?: ReactNode;
}) {
  return (
    <div data-gu-actions className="mt-4">
      {add ?? (
        <Button type="button" size="lg" className="w-full">
          <ImageUp /> Add photos
        </Button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-9 w-full">
          <Bookmark /> Save
        </Button>
        <Button type="button" variant="outline" className="h-9 w-full">
          <QrCode /> Invite
        </Button>
      </div>
      {under}
    </div>
  );
}

/* ── the moderation banner ───────────────────────────────────────────────── */

export type WordSize = "xs" | "read";

/**
 * `guest-upload.tsx`'s hold-for-approval banner, quoted with its classes. It is
 * `text-xs`, 12px, the smallest type on a page whose reading copy is 15px, and
 * it says the same sentence whether or not anything of this guest's is waiting:
 * both of those are questions on this board (`words`, `held`).
 */
export function ModerationBanner({
  size = "xs",
  children,
}: {
  size?: WordSize;
  children?: ReactNode;
}) {
  return (
    <p
      data-gu-banner
      data-gu-said
      className={cn(
        "rounded-md bg-muted px-3 py-2 text-center text-muted-foreground",
        size === "xs" ? "text-xs" : "text-[15px]",
      )}
    >
      {children ?? "The host reviews uploads before they appear in the album."}
    </p>
  );
}

/* ── the album ───────────────────────────────────────────────────────────── */

/**
 * ONE LANDED TILE, copied line for line from `guest-masonry.tsx`: the box that
 * owns the radius and the bright edge, the aspect reserved from the plumbed
 * width and height so nothing shifts as a photograph decodes, the corner play
 * badge on video, and the ~2.5s landed check as its own child.
 */
function LandedTile({
  item,
  landed,
  mine,
}: {
  item: GridMedia;
  /** The shipped state badge, or the banked shimmer spent on one tile. */
  landed?: "check" | "sweep";
  /** This device sent it. Carried for the measurement, never drawn. */
  mine?: boolean;
}) {
  const ratio =
    item.width && item.height ? `${item.width} / ${item.height}` : "1 / 1";
  return (
    <div
      data-media-tile
      data-gu-mine={mine ? "" : undefined}
      data-lit=""
      style={
        {
          aspectRatio: ratio,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="group relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
    >
      <MediaTile item={item} playBadge="none" />
      {item.type === "video" && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm"
        >
          <Play className="ml-px size-2.5 fill-white text-white" />
        </span>
      )}
      {landed === "check" && (
        <span
          aria-hidden
          data-gu-landed
          className="pointer-events-none absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-success text-success-foreground"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {landed === "sweep" && (
        <span aria-hidden data-gu-landed className="gu-sweep" />
      )}
    </div>
  );
}

/**
 * ONE IN-FLIGHT TILE: the same box, so a photograph does not change shape at
 * the moment it stops uploading. `foot` is the strip at its bottom edge, `over`
 * anything covering it, `mark` a corner badge.
 *
 * ★ THE ASPECT IS DECLARED, WHERE THE SHIPPED TILE GETS IT FOR FREE. The real
 * pending tile draws `<img src={objectURL}>` at the file's natural size; here
 * the stand-in still has a shape of its own, so the box is pinned to the shape
 * the picked file declares and the still is cropped into it, exactly as the
 * landed tile crops a real upload.
 *
 * ★ AND `drawable: false` DRAWS NOTHING, WHICH IS NOT A BUG. A `.mov` off an
 * iPhone (and a HEIC anywhere but Safari) renders an empty box in the pending
 * tile today, and how that reads is one of the questions.
 */
export function FlightTile({
  file,
  dim,
  foot,
  over,
  mark,
}: {
  file: Picked;
  dim?: boolean;
  foot?: ReactNode;
  over?: ReactNode;
  mark?: ReactNode;
}) {
  return (
    <div
      data-media-tile
      data-gu-flight=""
      data-lit=""
      style={
        {
          aspectRatio: `${file.width} / ${file.height}`,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
    >
      {file.drawable === false ? (
        <div className="size-full bg-black" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for an object URL
        <img
          src={file.url}
          alt=""
          className={cn("size-full object-cover", dim && "opacity-40")}
        />
      )}
      {mark}
      {over}
      {/* LAST, so a strip at the foot is still readable under a cover that
          takes the whole tile (the stack's count, a held tile's clock). */}
      {foot && <div className="absolute inset-x-0 bottom-0">{foot}</div>}
    </div>
  );
}

/**
 * THE ALBUM. The shipped column rule and the shipped tile; `lead` is whatever
 * this guest's own upload is doing, flowed at the head of the same columns the
 * way the real pending tiles are.
 */
export function LabMasonry({
  items,
  lead,
  landedId,
  landed,
  mine,
}: {
  items: GridMedia[];
  lead?: ReactNode;
  /** The id in its landed window, if any. */
  landedId?: string;
  landed?: "check" | "sweep";
  /** The ids this device sent, which the measurement counts. */
  mine?: ReadonlySet<string>;
}) {
  return (
    <div className={GALLERY_COLUMNS}>
      {lead}
      {items.map((item) => (
        <LandedTile
          key={item.id}
          item={item}
          landed={item.id === landedId ? landed : undefined}
          mine={mine?.has(item.id)}
        />
      ))}
    </div>
  );
}

/* ── the scroll ──────────────────────────────────────────────────────────── */

/**
 * ★ THE PAGE IS REALLY SCROLLED, NEVER FAKED. Five of these decisions live at
 * the head of the album, which on a 375 screen is 420px below the fold, and a
 * negative margin or a cropped box would be a lie about where a guest is
 * standing. So the frame's OWN window is scrolled, which is honest and has a
 * second consequence that belongs in the picture: once the header's Add leaves
 * the screen the shipped floating pill takes over, which is the shipped
 * "never both" rule doing its job.
 *
 * It runs on mount and again as photographs decode and the column heights
 * settle, because a scroll taken before the album has a height lands nowhere.
 */
function useScrollTo(offset: number, on: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!on) return;
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const run = () => {
      const top = el.getBoundingClientRect().top + win.scrollY - offset;
      win.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };
    run();
    const timers = [200, 700, 1300].map((ms) => win.setTimeout(run, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset, on]);
  return ref;
}

/* ── the whole page ──────────────────────────────────────────────────────── */

/**
 * THE PAGE. `banner` is the hold-for-approval notice, `album` the masonry with
 * whatever this guest's upload is doing in it, `overlay` anything standing over
 * the page, and `focus` scrolls the frame to the block a decision is about.
 */
export function GuestPage({
  screen,
  count,
  add,
  under,
  banner,
  aboveAlbum,
  album,
  overlay,
  dim = false,
  focus = null,
  uploading = 0,
}: {
  screen: ScreenId;
  count: number;
  add?: ReactNode;
  under?: ReactNode;
  banner?: ReactNode;
  aboveAlbum?: ReactNode;
  album: ReactNode;
  overlay?: ReactNode;
  dim?: boolean;
  /** Scroll the frame so the album's head, or the banner, sits near the top. */
  focus?: "album" | "banner" | null;
  /** The pill's live chip, once the header's Add has scrolled away. */
  uploading?: number;
}) {
  const wide = screen === "1440";
  const albumRef = useScrollTo(wide ? 24 : 16, focus === "album");
  const bannerRef = useScrollTo(wide ? 24 : 16, focus === "banner");

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="min-h-0 flex-1 py-8">
        <div className={COLUMN}>
          <EventBlock count={count} />
          <ActionBlock add={add} under={under} />
          {banner && (
            <div ref={bannerRef} className="mt-7">
              {banner}
            </div>
          )}
        </div>
        {/* The anchor holds whatever sits ABOVE the photographs too: a count
            line scrolled off the top of the frame is a line nobody judged. */}
        <div ref={albumRef} className={cn("mt-7", BLEED)}>
          {aboveAlbum}
          {album}
        </div>
      </div>
      {/* The shipped pill, under the shipped rule: it appears only once the
          header's Add is out of view, which here means only on a scrolled
          picture, and never under a surface standing over the page. */}
      <FloatingAddButton
        show={focus !== null && !dim}
        uploadingCount={uploading}
        onClick={() => {}}
      />
      {dim && <div className="gu-scrim" />}
      {overlay}
    </div>
  );
}
