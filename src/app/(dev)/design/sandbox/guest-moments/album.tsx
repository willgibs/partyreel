"use client";

import {
  ArrowUp,
  ImageUp,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import { type CSSProperties, useLayoutEffect, useRef } from "react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import {
  ARRIVAL_GLIDE_MS,
  ARRIVAL_GLOW_MS,
  ARRIVAL_SWEEP_MS,
} from "@/lib/shared/arrival";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";

import {
  ALBUM_COUNT,
  COVER,
  HOST,
  type Photo,
  PRIYA,
  WEDDING,
} from "./fixtures";
import { type Screen } from "./knobs";

/**
 * PRIYA'S ALBUM AT THE PARTY, PRODUCTION'S, scrolled to its top: the guest's
 * header on the real `AlbumCover` over the real `HeadStills`, then the
 * album's box (its count, Select, View) and its rows, laid by production's
 * own engine (`album-rows.ts`: the justified rows, newest first, with the
 * rhythm's features), so a photograph stands where the album stands it.
 *
 * ★ THE LIGHTS ARE PRODUCTION'S NUMBERS, DRAWN HERE (`guest-moments.css`):
 * the glow's rim and wash, the sweep's tilted band and the push's wipe are
 * `arrival.css`'s values, and their lives `arrival.ts`'s
 * (`ARRIVAL_GLOW_MS`, `ARRIVAL_SWEEP_MS`, `ARRIVAL_GLIDE_MS`), written on the
 * box as production writes them. A held beat is the light at that instant,
 * fixed; the moving frame replays it on a loop.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the
 * neighbours' glide is drawn as its end (each beat lays the rows as they
 * stand at that instant), and every press is inert.
 */

/**
 * WHAT A TILE WEARS AT ONE INSTANT:
 *  - `glow`, `glow-late`: the arrival's rim and wash at its peak, and most of
 *    the way out;
 *  - `sweep`: her own landing's band, mid-pass;
 *  - `first`: the glow with a word on the tile ("Yours is in");
 *  - `wipe`: the push's reveal a third of the way in, the rest of its place
 *    the bare page; `empty`: its place open, nothing revealed yet;
 *  - `grey`: let in before its picture decoded: the tile's ground and the
 *    breathing skeleton.
 */
export type Mark =
  | "glow"
  | "glow-late"
  | "sweep"
  | "first"
  | "wipe"
  | "empty"
  | "grey";

/**
 * HOW THE MOVING FRAME REPLAYS ITS TILES (each a CSS loop in
 * `guest-moments.css`, held still under reduced motion and while its option
 * is hidden):
 *  - `sweep`, `glow`, `first`: the light of her own landing;
 *  - `push`: the six wipe in at once, the slow one grey till it draws;
 *  - `settle`: each stands whole and glows; `file`: one after another;
 *  - `pill` is the frame's own: the pill, then the six.
 */
export type Loop = "sweep" | "glow" | "first" | "push" | "settle" | "file";

export type AlbumTile = Photo & { mark?: Mark; loop?: Loop };

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;

type Placed = { tile: AlbumTile; x: number; y: number; w: number; h: number };

/** Production's justified rows for these tiles, newest first, at this box width. */
function planRows(tiles: readonly AlbumTile[], width: number) {
  const perRow = perRowFor(width, 1);
  const base = tiles.map((t) => ({ id: t.key, ratio: t.ratio }));
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
  const placed: Placed[] = [];
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

/** The word a first landing wears in the `first` option. */
export const FIRST_WORD = "Yours is in";

function Tile({ p, order }: { p: Placed; order: number }) {
  const { tile } = p;
  const grey = tile.mark === "grey";
  return (
    <div
      data-gm-tile={tile.key}
      data-gm-mark={tile.mark}
      data-gm-loop={tile.loop}
      className="gm-tile absolute overflow-hidden rounded-tile bg-black/10"
      style={
        {
          left: p.x,
          top: p.y,
          width: p.w,
          height: p.h,
          "--gm-i": order,
        } as CSSProperties
      }
    >
      {grey ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one
        <img
          src={tile.src}
          alt=""
          draggable={false}
          className="gm-pic absolute inset-0 size-full object-cover"
          style={{ objectPosition: tile.focus }}
        />
      )}
      {tile.loop === "push" && order === 5 ? (
        // The slow one: grey until its picture draws, then the picture over it.
        <Skeleton className="gm-slow absolute inset-0 size-full rounded-none" />
      ) : null}
      {tile.mark === "first" || tile.loop === "first" ? (
        <span
          data-gm-word=""
          className={`gm-word absolute bottom-2 left-2 z-10 flex h-7 items-center rounded-full px-2.5 text-caption font-medium text-white ${GLASS}`}
        >
          <span className={GLASS_MARK_LIT}>{FIRST_WORD}</span>
        </span>
      ) : null}
    </div>
  );
}

/** The rows: each tile the album tile's box, a photograph covering its place. */
function Rows({
  tiles,
  width,
}: {
  tiles: readonly AlbumTile[];
  width: number;
}) {
  const { placed, height } = planRows(tiles, width);
  // The new ones count from the top: the order a `file` loop lets them in.
  let n = 0;
  return (
    <div className="relative" style={{ height }} data-gm-rows="">
      {placed.map((p) => (
        <Tile key={p.tile.key} p={p} order={p.tile.loop ? n++ : 0} />
      ))}
    </div>
  );
}

/** Scrolls the frame's own window so the album stands near the top, the cover's foot above it. */
function useScrollTo(offset: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () =>
      win.scrollTo(0, el.getBoundingClientRect().top + win.scrollY - offset);
    go();
    // Again once the webfont and the cover settle, so the album's place is its final one.
    const t = win.setTimeout(go, 500);
    return () => win.clearTimeout(t);
  }, [offset]);
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
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        {PRIYA.name}
      </span>
    </header>
  );
}

/** The cover's actions on a Live album: Add photos, the reel, Invite. */
function CoverActions() {
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
      <Button
        type="button"
        variant="glass"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Watch the highlight reel"
      >
        <Play className="fill-current" />
      </Button>
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
 * THE ARRIVALS PILL, `AlbumNewsPill`'s own glass and words ("↑ 6 new"),
 * standing at the album's top where production stands it only past the
 * first row (the `pill` option's whole change).
 */
export function NewsPill({ count, loop }: { count: number; loop?: boolean }) {
  return (
    <div
      className="gm-pill-row pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center"
      data-gm-pill-loop={loop ? "" : undefined}
    >
      <span
        data-gm-pill={count}
        className={`flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-white ${GLASS}`}
      >
        <span
          className={`flex items-center gap-1.5 tabular-nums ${GLASS_MARK_LIT}`}
        >
          <ArrowUp className="size-4" aria-hidden />
          {formatCount(count)} new
        </span>
      </span>
    </div>
  );
}

/**
 * PRIYA'S PAGE: the header, the cover, and the album's box with its own row
 * (the count, Select, View), the frame scrolled to the album. `tiles` are the
 * rows at one instant; `before` and `pill`, where given, are the `pill`
 * option's moving frame: the rows as they stood under the pill, then `tiles`.
 */
export function GuestAlbum({
  screen,
  tiles,
  count = ALBUM_COUNT,
  pill,
  before,
}: {
  screen: Screen;
  tiles: readonly AlbumTile[];
  count?: number;
  /** "N new" over the album's top. */
  pill?: number;
  /** The rows the pill stands over, in a moving frame that then lets `tiles` in. */
  before?: readonly AlbumTile[];
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(screen === "1440" ? 150 : 96);
  return (
    <div
      className="relative min-h-screen bg-background pb-24 text-foreground"
      style={
        {
          "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
          "--arrival-glide-ms": `${ARRIVAL_GLIDE_MS}ms`,
        } as CSSProperties
      }
      data-gm-album=""
    >
      <GuestBar />
      <AlbumCover
        className="-mt-14"
        ground={
          <div className="absolute inset-0">
            <HeadStills
              stills={COVER.map((p, i) => ({
                id: `${p.key}-${i}`,
                tile: p.src,
              }))}
            />
          </div>
        }
        name={WEDDING.name}
        host={{ name: HOST.name, avatarUrl: null, seed: HOST.seed }}
        date={WEDDING.date}
        description={null}
        mediaCount={count}
        guestCount={38}
        actions={<CoverActions />}
      />
      <div ref={box} className="mt-5 px-3 sm:px-5" data-gm-album-box="">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
          <p className="px-0.5 text-working text-muted-foreground tabular-nums">
            {formatMediaCount(count)}
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
              <ListChecks className="size-4" /> Select
            </span>
            <Button type="button" variant="outline" size="sm" tabIndex={-1}>
              <SlidersHorizontal /> View
            </Button>
          </div>
        </div>
        <div className="relative">
          {pill !== undefined && !before ? <NewsPill count={pill} /> : null}
          {before ? (
            <div className="relative" data-gm-pill-stage="">
              <NewsPill count={pill ?? 0} loop />
              <div className="gm-before">
                <Rows tiles={before} width={albumWidth(w)} />
              </div>
              <div className="gm-after absolute inset-x-0 top-0">
                <Rows tiles={tiles} width={albumWidth(w)} />
              </div>
            </div>
          ) : (
            <Rows tiles={tiles} width={albumWidth(w)} />
          )}
        </div>
      </div>
    </div>
  );
}
