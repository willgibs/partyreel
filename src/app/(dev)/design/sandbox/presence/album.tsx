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
import { GhostRiver } from "@/components/guest/gallery-empty-state";
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
  COVER,
  type Guest,
  PARTY,
  type Still,
  WEDDING,
} from "./fixtures";
import type { Ground, Screen } from "./knobs";

/**
 * MAYA & JAY'S ALBUM AS PRIYA HOLDS IT, PRODUCTION'S: the guest's header on
 * the cover (production's `EventHead` and `HeadStills`, the cover's words as
 * `AlbumCover` sets them), the album's bar (its count, Select, View), its rows
 * laid by production's own engine (`album-rows.ts`), the Guests section at its
 * end (production's own `GuestList`, as the page composes it), the report
 * line, and the shutter's dock once the cover's actions have gone.
 *
 * ★ AN OPTION DRAWS ONLY ITS ROW: where the party's faces stand (the cover,
 * the bar or the foot) and how they answer. Everything else is the album as
 * built, so two options differ where their row does.
 *
 * ★ THE COVER IS `AlbumCover`'S OWN WORDS, RECOMPOSED: production's cover has
 * no place for a row, so this draws its markup (the name, the byline with the
 * host's face, the desk's glyph counts, the actions) around the row's slot.
 * Where the row is on the cover, the guests' glyph leaves the byline: the row
 * says it.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the cover
 * holds one still (production dissolves through several), the faces are
 * fixtures (`fixtures.ts`), and every press is inert.
 */

/** Where the party's row stands on the album (the `album` decision). */
export type Place = "foot" | "cover" | "bar";

/** Where a frame stands in the album: its first screen, scrolled to the row, or at the album's end. */
export type Scroll = "top" | "row" | "end";

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;

/** A tile of the album: a still under a key of its own (a still may stand twice). */
type Tile = { key: string; still: Still };

/** The album as the rows draw it: every still, then the first six again, so a laptop's screen is full. */
const TILES: readonly Tile[] = [...ALBUM, ...ALBUM.slice(0, 6)].map((s, i) => ({
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
export function Rows({ width }: { width: number }) {
  const { placed, height } = planRows(TILES, width);
  return (
    <div className="relative" style={{ height }} data-pr-rows="">
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
        </div>
      ))}
    </div>
  );
}

/**
 * Scrolls the frame's own window to an element (the offset above it), once
 * the webfont and the cover settle; `end` scrolls to the page's foot.
 */
function useScrollTo(target: "row" | "end" | null, offset: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || target === null) return;
    const go = () => {
      if (target === "end") {
        win.scrollTo(0, el.ownerDocument.documentElement.scrollHeight);
        return;
      }
      const row = el.querySelector<HTMLElement>("[data-pr-place]");
      if (row)
        win.scrollTo(0, row.getBoundingClientRect().top + win.scrollY - offset);
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

/** The guest's header on the cover (`guest-header.tsx`, `over`): the wordmark and her name. */
function GuestBar() {
  return (
    <header
      data-surface="photo"
      className="dark relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-transparent px-5 text-foreground"
    >
      <Logo />
      <span className="flex items-center gap-2 text-sm">
        <Avatar size="sm" seed="guest-priya">
          <AvatarFallback className="text-[10px]">P</AvatarFallback>
        </Avatar>
        Priya
      </span>
    </header>
  );
}

/** The cover's actions on a Live album: Add photos, the reel, Invite; an empty album has no reel yet. */
function CoverActions({ empty = false }: { empty?: boolean }) {
  return (
    <>
      <Button
        type="button"
        variant="on-photo"
        size="cta"
        tabIndex={-1}
        className="min-w-0 flex-1 md:flex-none"
      >
        <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
      </Button>
      {empty ? null : (
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Watch the highlight reel"
        >
          <Play className="fill-current" />
        </Button>
      )}
      <Button
        type="button"
        variant="glass"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Invite"
      >
        <QrCode />
      </Button>
    </>
  );
}

/**
 * THE COVER, AS `AlbumCover` DRAWS IT, with the row's slot under the byline
 * (`row`), and its ground (`ground`): the cover's photograph, or a light
 * where the album has none yet.
 */
export function Cover({
  screen,
  row,
  ground,
  empty = false,
}: {
  screen: Screen;
  row?: ReactNode;
  ground?: ReactNode;
  /** A party nobody has added to yet: no counts, the first photo asked for, no reel. */
  empty?: boolean;
}) {
  const desk = screen === "1440";
  const counts = empty
    ? null
    : { photos: WEDDING.photos, guests: WEDDING.guests };
  return (
    <EventHead
      side="album"
      className="-mt-14"
      ground={
        ground ?? (
          <div className="absolute inset-0">
            <HeadStills stills={[{ id: COVER.id, tile: COVER.src }]} />
          </div>
        )
      }
    >
      <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div className="min-w-0 md:max-w-2xl">
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
            {desk && counts && counts.photos > 0 ? (
              <span className="flex items-center gap-x-2.5">
                <span aria-hidden className="text-white/45">
                  ·
                </span>
                <GlyphCount
                  icon={<Images />}
                  count={counts.photos}
                  label={formatMediaCount(counts.photos)}
                />
                {row ? null : (
                  <GlyphCount
                    icon={<Users />}
                    count={counts.guests}
                    label={`${formatCount(counts.guests)} guests`}
                  />
                )}
              </span>
            ) : null}
          </p>
          {row ? (
            <div data-pr-place="cover" className="mt-4 md:mt-5">
              {row}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-0 md:shrink-0 md:flex-row-reverse md:flex-nowrap">
          <CoverActions empty={empty} />
        </div>
      </div>
    </EventHead>
  );
}

/** The album's bar: its count, Select and View; with a row beside the count where it stands there. */
function AlbumBar({ row, screen }: { row?: ReactNode; screen: Screen }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2.5">
        <p className="px-0.5 text-working text-muted-foreground tabular-nums">
          {formatMediaCount(WEDDING.photos)}
        </p>
        {row && screen === "1440" ? (
          <div data-pr-place="bar" className="flex items-center gap-3">
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
            {row}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <ListChecks className="size-4" /> Select
        </span>
        <Button type="button" variant="outline" size="sm" tabIndex={-1}>
          <SlidersHorizontal /> View
        </Button>
      </div>
      {row && screen === "375" ? (
        <div data-pr-place="bar" className="basis-full px-0.5">
          {row}
        </div>
      ) : null}
    </div>
  );
}

/** Today's Guests section at the album's end, as the page composes it: production's `GuestList`. */
function GuestsToday() {
  // Production's own order: the people with a profile by name, then the named-but-unproven by name.
  const items: GuestListItem[] = [...PARTY]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p: Guest, i) =>
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

/** The foot's section, where the row stands there in place of today's list. */
function GuestsRow({ row }: { row: ReactNode }) {
  return (
    <section aria-label="Guests" className="mt-10 space-y-3">
      <h2 className="text-label font-semibold text-muted-foreground uppercase">
        Guests
      </h2>
      <div data-pr-place="foot">{row}</div>
    </section>
  );
}

/** The foot, as `guest-action-dock.tsx` draws it: the page's ground rising, Invite, the Add, the reel. */
function Dock() {
  return (
    <div
      data-pr-dock=""
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
        {/* The album's own three hues (its stills' sampled light), as production's dock hands the shutter. */}
        <Shutter
          state="idle"
          hues={[52, 67, 248]}
          tabIndex={-1}
          aria-label="Add photos"
        />
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
 * PRIYA'S PAGE: the header, the cover, the album's bar and rows, its Guests
 * section and its foot; the party's row where the place puts it (`row`), and
 * today's list at the foot where it stands nowhere else.
 */
export function GuestAlbum({
  screen,
  place,
  row,
  scroll,
  rowOffset = 160,
}: {
  screen: Screen;
  ground?: Ground;
  /** Where the row stands; `foot` with no row is today's list. */
  place: Place;
  /** The row, drawn for its place. */
  row?: ReactNode;
  scroll: Scroll;
  /** How far below the frame's top the row stands, scrolled to it. */
  rowOffset?: number;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(scroll === "top" ? null : scroll, rowOffset);
  return (
    <div
      ref={box}
      data-pr-album={place}
      data-pr-scroll={scroll}
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar />
      <Cover screen={screen} row={place === "cover" ? row : undefined} />
      <div className="mt-5 px-3 sm:px-5" data-pr-album-box="">
        <AlbumBar row={place === "bar" ? row : undefined} screen={screen} />
        <Rows width={albumWidth(w)} />
      </div>
      <div className="flex justify-center">
        <div className={cn("w-full max-w-2xl px-5")}>
          {place === "foot" && row ? (
            <GuestsRow row={row} />
          ) : place === "foot" ? (
            <GuestsToday />
          ) : null}
        </div>
      </div>
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
      {/* The dock rises once the cover's actions have gone: at the album's end, never beside the cover. */}
      {scroll === "end" ? <Dock /> : null}
    </div>
  );
}

/**
 * A PARTY NOBODY HAS ADDED TO YET, AS ITS FIRST GUEST MEETS IT: the cover on
 * its ground (the house light today, or the party's seed), the first photo
 * asked for, and the album's photographic promise under it (production's
 * `GhostRiver` and its title, `gallery-empty-state.tsx`).
 */
export function EmptyAlbum({
  screen,
  ground,
}: {
  screen: Screen;
  ground?: ReactNode;
}) {
  return (
    <div
      data-pr-album="empty"
      className="relative min-h-screen bg-background pb-16 text-foreground"
    >
      <GuestBar />
      <Cover screen={screen} ground={ground} empty />
      <div className="flex justify-center">
        <div className="relative mt-5 w-full max-w-2xl px-3 sm:px-5">
          <GhostRiver />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-heading text-subsection text-balance">
              The album starts with you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
