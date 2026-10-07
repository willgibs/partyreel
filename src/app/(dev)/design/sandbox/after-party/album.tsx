"use client";

import {
  Flag,
  ImageUp,
  Images,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";

import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { GuestList, type GuestListItem } from "@/components/social/guest-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlyphCount } from "@/components/ui/glyph-count";
import { Shutter } from "@/components/ui/shutter";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";
import { cn, formatEventDate } from "@/lib/utils";

import {
  ALBUM,
  COVER_SIX,
  type Moment,
  PARTY,
  PRIYA,
  type Still,
  WEDDING,
} from "./fixtures";
import type { Screen } from "./knobs";

/**
 * MAYA & JAY'S ALBUM AS A GUEST HOLDS IT, PRODUCTION'S: the guest's header on
 * the cover (`guest-header.tsx`'s `over`), the cover (`AlbumCover`'s own
 * markup in production's `EventHead` and `HeadStills`), the line under it, the
 * album's bar (its count, Select, View), its rows laid by production's own
 * engine (`album-rows.ts`), the Guests section (production's `GuestList`), the
 * report line, and the shutter's dock once the cover's actions have gone.
 *
 * ★ AN OPTION DRAWS ONLY ITS SLOTS: the header's corner, the cover's eyebrow,
 * what stands under its byline, its actions, the line under it, the bar's
 * quiet Add, the album's end and the dock. Everything else is the album as
 * built, so two options differ where their slots do.
 *
 * ★ THE COVER IS `AlbumCover`'S OWN WORDS, RECOMPOSED: production's cover has
 * no slot under its byline (her own photographs' strip), so this draws its
 * markup around one. Its photographs dissolve as production's do
 * (`HeadStills`, six slots of one keyframe), or stand still where an option
 * says so.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the faces
 * fixtures, the counts the board's (`fixtures.ts`), and every press is inert.
 */

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
export const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;

/** A tile of the album: a still under a key of its own (a still may stand twice). */
type Tile = { key: string; still: Still };

const tilesOf = (stills: readonly Still[], repeat = 6): Tile[] =>
  [...stills, ...stills.slice(0, repeat)].map((s, i) => ({
    key: `${s.id}-${i}`,
    still: s,
  }));

/** Production's justified rows for these tiles, newest first, at this width. */
function planRows(tiles: readonly Tile[], width: number) {
  const perRow = perRowFor(width, 1);
  const base = tiles.map((t) => ({ id: t.key, ratio: t.still.ratio }));
  const features = pickFeatures(base, RHYTHM_SEED, perRow);
  const items: RowItem[] = base.map((it) =>
    features.has(it.id) ? { ...it, feature: true } : it,
  );
  const layout = layoutRows(items, {
    width,
    gap: GAP,
    perRow,
    anchor: "end",
    feature: "double",
  });
  const byKey = new Map(tiles.map((t) => [t.key, t]));
  const placed: { tile: Tile; x: number; y: number; w: number; h: number }[] =
    [];
  let y = 0;
  for (const row of layout.rows) {
    let x = 0;
    row.ids.forEach((id, k) => {
      const w = row.widths[k]!;
      placed.push({ tile: byKey.get(id)!, x, y, w, h: row.height });
      x += w + GAP;
    });
    y += row.height + GAP;
  }
  return { placed, height: Math.max(0, y - GAP) };
}

/** The rows: each tile the album tile's box, a photograph covering its place. */
export function Rows({
  width,
  stills = ALBUM,
  repeat = 6,
  mark,
}: {
  width: number;
  /** The album's photographs, newest first (her own, under the Yours lens). */
  stills?: readonly Still[];
  /** How many of the first stand again at the end, so the album runs past a screen; 0 for a lens's exact set. */
  repeat?: number;
  /** What a tile wears over its photograph (select mode's marks), by its key (`<still>-<place in the album>`). */
  mark?: (key: string) => ReactNode;
}) {
  const { placed, height } = planRows(tilesOf(stills, repeat), width);
  return (
    <div className="relative" style={{ height }} data-ap-rows="">
      {placed.map((p) => (
        <div
          key={p.tile.key}
          className="absolute overflow-hidden rounded-tile bg-black/10"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one */}
          <img
            src={p.tile.still.src}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: p.tile.still.focus }}
          />
          {mark?.(p.tile.key)}
        </div>
      ))}
    </div>
  );
}

/** Where a frame stands in the album: her first screen, scrolled into the album, or at the album's end. */
export type Scroll = "top" | "album" | "end";

/**
 * Scrolls the frame's own window: into the album (its bar a little under the
 * frame's top) or to the page's foot, once the webfont and the cover settle.
 */
function useScrollTo(target: Scroll, offset: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || target === "top") return;
    const go = () => {
      if (target === "end") {
        win.scrollTo(0, el.ownerDocument.documentElement.scrollHeight);
        return;
      }
      const bar = el.querySelector<HTMLElement>("[data-ap-bar]");
      if (bar)
        win.scrollTo(0, bar.getBoundingClientRect().top + win.scrollY - offset);
    };
    go();
    const t1 = win.setTimeout(go, 400);
    const t2 = win.setTimeout(go, 1200);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
  }, [target, offset]);
  return ref;
}

/* ── the header ─────────────────────────────────────────────────────────── */

/** The header's corner, as `guest-header.tsx` draws it signed out: the quiet Start for free. */
export function StartForFree({ words = "Start for free" }: { words?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
      {words}
    </Button>
  );
}

/** Priya's own corner, a guest the device knows (`guest-name-menu.tsx`): her disc and her name. */
export function HerName() {
  return (
    <span className="flex items-center gap-2 text-sm">
      <Avatar size="sm" seed={PRIYA.seed}>
        <AvatarFallback className="text-[10px]">P</AvatarFallback>
      </Avatar>
      {PRIYA.name}
    </span>
  );
}

/** The guest's header on the cover (`guest-header.tsx`, `over`): the wordmark, and its corner. */
export function GuestBar({ corner }: { corner?: ReactNode }) {
  return (
    <header
      data-ap-header=""
      data-surface="photo"
      className="dark relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-transparent px-5 text-foreground"
    >
      <Logo />
      <div data-ap-corner="" className="flex h-8 items-center">
        {corner ?? <StartForFree />}
      </div>
    </header>
  );
}

/* ── the cover ──────────────────────────────────────────────────────────── */

/** The cover's acts on a live album: Add photos, the reel, Invite (`event-experience.tsx`). */
export function LiveActions() {
  return (
    <>
      <Button
        type="button"
        variant="on-photo"
        size="cta"
        tabIndex={-1}
        className="min-w-0 flex-1 md:flex-none"
      >
        <ImageUp /> Add photos
      </Button>
      <ReelRound />
      <InviteRound />
    </>
  );
}

/** The reel's round on the cover (`Watch the highlight reel`). */
export function ReelRound() {
  return (
    <Button
      type="button"
      variant="glass"
      size="icon-cta"
      tabIndex={-1}
      aria-label="Watch the highlight reel"
    >
      <Play className="fill-current" />
    </Button>
  );
}

/** Invite on the cover (`GuestShare`, `glass`). */
export function InviteRound() {
  return (
    <Button
      type="button"
      variant="glass"
      size="icon-cta"
      tabIndex={-1}
      aria-label="Invite"
    >
      <QrCode />
    </Button>
  );
}

/**
 * THE COVER, AS `AlbumCover` DRAWS IT: the eyebrow, the name, the byline
 * (the host's face, the date, and at a desk the counts as glyphs), whatever
 * an option stands under the byline (`beneath`), the host's note, and the
 * actions; on its photographs, dissolving or held still.
 */
export function Cover({
  screen,
  moment,
  eyebrow,
  beneath,
  note = false,
  actions,
  stills = COVER_SIX,
  still = false,
  className,
}: {
  screen: Screen;
  moment: Moment;
  eyebrow?: ReactNode;
  /** What stands under the byline: her own photographs, a line of the party's words. */
  beneath?: ReactNode;
  /** The host's note (two lines at a phone, three at a desk). */
  note?: boolean;
  actions?: ReactNode;
  /** The cover's photographs: the reel's opening six. */
  stills?: readonly Still[];
  /** Held on its first photograph, never dissolving. */
  still?: boolean;
  className?: string;
}) {
  const desk = screen === "1440";
  const shown = still ? stills.slice(0, 1) : stills;
  return (
    <EventHead
      side="album"
      className={cn("-mt-14", className)}
      data-ap-cover={still ? "still" : "dissolve"}
      ground={
        <div className="absolute inset-0">
          <HeadStills
            stills={shown.map((s) => ({
              id: `${s.id}-${s.focus}`,
              tile: s.src,
            }))}
          />
        </div>
      }
    >
      <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div className="min-w-0 md:max-w-2xl">
          {eyebrow ? (
            <p
              data-ap-eyebrow=""
              className="mb-2 text-label font-medium text-white/80 uppercase"
            >
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-title text-balance">
            {WEDDING.name}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <Avatar seed={WEDDING.host.seed} size="sm">
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <span className="font-medium text-white">
                {WEDDING.host.name}
              </span>
            </span>
            <span aria-hidden className="text-white/45">
              ·
            </span>
            <span>
              <RangeText text={formatEventDate(WEDDING.date, null)} />
            </span>
            {desk ? (
              <span className="flex items-center gap-x-2.5">
                <span aria-hidden className="text-white/45">
                  ·
                </span>
                <GlyphCount
                  icon={<Images />}
                  count={moment.album}
                  label={formatMediaCount(moment.album)}
                />
                <GlyphCount
                  icon={<Users />}
                  count={moment.guests}
                  label={`${formatCount(moment.guests)} guests`}
                />
              </span>
            ) : null}
          </p>
          {beneath ? (
            <div data-ap-beneath="" className="mt-3.5 md:mt-4">
              {beneath}
            </div>
          ) : null}
          {note ? (
            <p className="mt-3 line-clamp-2 max-w-xl text-working text-pretty text-white/80 md:line-clamp-3">
              {WEDDING.note}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div
            data-ap-acts=""
            className="mt-5 flex flex-wrap items-center gap-2 md:mt-0 md:shrink-0 md:flex-row-reverse md:flex-nowrap"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </EventHead>
  );
}

/* ── under the cover ────────────────────────────────────────────────────── */

/** Today's closed line (`event-experience.tsx`): what a closed album says under its cover. */
export function ClosedLine() {
  return (
    <p
      data-ap-closed=""
      className="mt-5 text-center text-reading text-muted-foreground"
    >
      The host has closed uploads. You can still browse the album.
    </p>
  );
}

/**
 * The album's bar: its count, Select and View (production's), with an
 * option's slot after the count (`lead`: a lens, a quiet Add).
 */
export function AlbumBar({
  moment,
  lead,
}: {
  moment: Moment;
  lead?: ReactNode;
}) {
  return (
    <div
      data-ap-bar=""
      className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2.5">
        <p className="px-0.5 text-working text-muted-foreground tabular-nums">
          {formatMediaCount(moment.album)}
        </p>
        {lead}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <ListChecks className="size-4" /> Select
        </span>
        <Button type="button" variant="outline" size="sm" tabIndex={-1}>
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/** The Guests section at the album's end, as the page composes it: production's `GuestList`. */
export function GuestsSection({ guests }: { guests: number }) {
  // Production's own order: the people with a profile by name, then the named-but-unproven by name.
  const people = Array.from({ length: guests }, (_, i) => {
    const base = PARTY[i % PARTY.length]!;
    return i < PARTY.length
      ? base
      : {
          name: `${base.name} ${String.fromCharCode(65 + (i % 26))}.`,
          seed: `${base.seed}-${i}`,
        };
  });
  const items: GuestListItem[] = [...people]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p, i) =>
      i % 3 === 2
        ? {
            kind: "unverified",
            id: `row-${p.seed}`,
            displayName: p.name,
            seed: p.seed,
          }
        : {
            id: `user-${p.seed}`,
            displayName: p.name,
            slug: null,
            avatarMarker: null,
            avatarUrl: null,
            seed: p.seed,
          },
    );
  return (
    <section aria-label="Guests" className="mt-10 space-y-3">
      <h2 className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          Guests
        </span>
      </h2>
      <GuestList items={items} />
    </section>
  );
}

/** The report line at the page's foot, as built. */
function Report() {
  return (
    <footer className="mx-3 mt-8 flex justify-center border-t border-border/60 pt-5 sm:mx-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        tabIndex={-1}
        className="text-muted-foreground"
      >
        <Flag /> Report
      </Button>
    </footer>
  );
}

/** The foot's shutter, as `guest-action-dock.tsx` draws it: Invite, the Add (where the album takes photos), the reel. */
export function Dock({ add = true }: { add?: boolean }) {
  return (
    <div
      data-ap-dock={add ? "add" : "look"}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <div className="relative flex items-center justify-center gap-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="outline"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Invite"
          className="bg-background shadow-layer"
        >
          <QrCode />
        </Button>
        {add ? (
          // The album's own three hues (its stills' sampled light), as production's dock hands the shutter.
          <Shutter
            state="idle"
            hues={[52, 67, 248]}
            tabIndex={-1}
            aria-label="Add photos"
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Watch the highlight reel"
          className="bg-background shadow-layer"
        >
          <Play className="fill-current" />
        </Button>
      </div>
    </div>
  );
}

/**
 * A GUEST'S PAGE: the header, the cover, the line under it, the album's bar
 * and rows, its Guests and its foot; each slot an option fills, and the
 * frame's place in it (`scroll`).
 */
export function GuestAlbum({
  screen,
  moment,
  corner,
  cover,
  under,
  barLead,
  bar,
  lens,
  stills,
  repeat,
  mark,
  end,
  dock,
  foot,
  scroll = "top",
  offset = 120,
}: {
  screen: Screen;
  moment: Moment;
  /** The header's corner: Start for free (signed out), or her name. */
  corner?: ReactNode;
  /** The cover, drawn by the option (`Cover`). */
  cover: ReactNode;
  /** What stands under the cover, before the album: today's closed line, or nothing. */
  under?: ReactNode;
  /** The bar's slot after the count. */
  barLead?: ReactNode;
  /** The album's row turned over (select mode's bar), in the bar's place; it carries `data-ap-bar`, so a scroll finds it. */
  bar?: ReactNode;
  /** A line under the bar: the View menu's lens ("Showing yours"). */
  lens?: ReactNode;
  /** The album's photographs, newest first, where an option shows other than the album's own. */
  stills?: readonly Still[];
  /** How many of the first stand again at the end (`Rows`): 0 for a lens's exact set. */
  repeat?: number;
  /** What a tile wears over its photograph (`Rows`): select mode's marks. */
  mark?: (key: string) => ReactNode;
  /** What stands at the album's end, above Report. */
  end?: ReactNode;
  /** The foot's shutter in a scrolled frame: with Add, without it, or none. */
  dock?: "add" | "look" | null;
  /** A foot of the option's own in a scrolled frame, in the dock's place (select mode's Save). */
  foot?: ReactNode;
  scroll?: Scroll;
  /** Scrolled into the album: how far under the frame's top its bar stands. */
  offset?: number;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(scroll, offset);
  return (
    <div
      ref={box}
      data-ap-album={scroll}
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar corner={corner} />
      {cover}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-5">{under}</div>
      </div>
      <div className="mt-5 px-3 sm:px-5" data-ap-album-box="">
        {bar ?? <AlbumBar moment={moment} lead={barLead} />}
        {lens}
        <Rows
          width={albumWidth(w)}
          stills={stills}
          repeat={repeat}
          mark={mark}
        />
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-5">
          <GuestsSection guests={moment.guests} />
          {end ? (
            <div data-ap-end="" className="mt-10">
              {end}
            </div>
          ) : null}
        </div>
      </div>
      <Report />
      {/* The dock rises once the cover's actions have gone: never beside the cover. */}
      {scroll === "top"
        ? null
        : (foot ?? (dock ? <Dock add={dock === "add"} /> : null))}
    </div>
  );
}
