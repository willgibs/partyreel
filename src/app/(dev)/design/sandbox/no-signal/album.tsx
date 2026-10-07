"use client";

import {
  ImageUp,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { UploadStackTile } from "@/components/guest/upload/stack-tile";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Shutter } from "@/components/ui/shutter";
import { formatMediaCount } from "@/lib/format/count";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";
import "./ns.css";

import { ALBUM, COVER, LANDED, type Still, UNSENT, WEDDING } from "./fixtures";
import { namedFile } from "./scene";

/**
 * MAYA & JAY'S ALBUM AS PRIYA HOLDS IT, PRODUCTION'S: the guest's header on
 * the cover, the cover itself (production's `AlbumCover`, its words, its
 * actions), the album's bar, its rows laid by production's own engine
 * (`album-rows.ts`) with the head's one slot where her send stands (as
 * `album-window-plan.ts` lays it: a square, first), the stack in it
 * (production's `UploadStackTile`, sending), the band above the foot where
 * production's stand-in stands, and the foot itself as `guest-action-dock.tsx`
 * draws it around production's `Shutter`.
 *
 * ★ AN OPTION DRAWS ONLY WHAT IT CHANGES: the head's slot, the shutter's
 * state, what stands above the shutter, a layer over the page (a sheet, the
 * list, a toast). Everything else is the album as built, so two options
 * differ where their answers do.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the cover
 * holds one still (production dissolves through several), the toast is drawn
 * where production's toaster stands (sonner's, a page singleton the lab's own
 * page also wears), and every press is inert.
 */

/** Where the frame stands in the album: its cover, the album's head under the bar, or scrolled on into its rows. */
export type Scroll = "top" | "head" | "rows";

/** The album's box: the window less its gutter (`px-3`), and the gallery's gap. */
const ALBUM_W = 375 - 24;
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;
const HEAD = "rows-head:send";

/** The album as the rows draw it: her landed photo first where it has landed, then everyone's. */
function tilesFor(landed: readonly Still[]) {
  return [...landed, ...ALBUM].map((s, i) => ({
    key: `${s.id}-${i}`,
    still: s,
  }));
}

type Placed = { id: string; x: number; y: number; w: number; h: number };

/** Production's justified rows at a phone, newest first, the head's slot first where something stands there. */
function planRows(
  tiles: readonly { key: string; still: Still }[],
  head: boolean,
): { placed: Placed[]; height: number } {
  const perRow = perRowFor(ALBUM_W, 1);
  const base = tiles.map((t) => ({ id: t.key, ratio: t.still.ratio }));
  const features = pickFeatures(base, RHYTHM_SEED, perRow);
  const items: RowItem[] = [
    ...(head ? [{ id: HEAD, ratio: 1 }] : []),
    ...base.map((it) => (features.has(it.id) ? { ...it, feature: true } : it)),
  ];
  const layout = layoutRows(items, {
    width: ALBUM_W,
    gap: GAP,
    perRow,
    anchor: "end",
    feature: "double",
  });
  const placed: Placed[] = [];
  let y = 0;
  for (const row of layout.rows) {
    let x = 0;
    row.ids.forEach((id, k) => {
      const w = row.widths[k]!;
      placed.push({ id, x, y, w, h: row.height });
      x += w + GAP;
    });
    y += row.height + GAP;
  }
  return { placed, height: Math.max(0, y - GAP) };
}

function Rows({
  head,
  landed,
}: {
  head?: ReactNode;
  landed: readonly Still[];
}) {
  const tiles = tilesFor(landed);
  const byKey = new Map(tiles.map((t) => [t.key, t]));
  const { placed, height } = planRows(tiles, Boolean(head));
  return (
    <div className="relative" style={{ height }} data-ns-rows="">
      {placed.map((p) => {
        if (p.id === HEAD)
          return (
            <div
              key={p.id}
              data-ns-head=""
              className="absolute"
              style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
            >
              {/* The album window forces the slot's height onto the tile from outside (`album-window.tsx`). */}
              <div className="h-full [&_[data-media-tile]]:h-full [&_[data-upload-stack]]:h-full">
                {head}
              </div>
            </div>
          );
        const tile = byKey.get(p.id)!;
        const hers = tiles.indexOf(tile) < landed.length;
        return (
          <div
            key={p.id}
            data-media-tile=""
            data-ns-hers={hers ? "" : undefined}
            className="absolute overflow-hidden rounded-tile bg-black/10"
            style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one */}
            <img
              src={tile.still.src}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: tile.still.focus }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** The guest's header on the cover (`guest-header.tsx`, `over`): the wordmark and the guest's name. */
export function GuestBar({ name = "Priya" }: { name?: string }) {
  return (
    <header
      data-surface="photo"
      className="dark relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 px-5 text-foreground"
    >
      <Logo />
      <span className="flex items-center gap-2 text-sm">
        <Avatar seed={`guest-${name.toLowerCase()}`} size="sm">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        {name}
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
        className="min-w-0 flex-1"
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

/** The album's bar: its count, Select and View. */
function AlbumBar({ count }: { count: number }) {
  return (
    <div
      data-ns-bar=""
      className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5"
    >
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
  );
}

/** The shutter as the foot holds it: at rest, sending (its ring the run's progress), or standing by (no hue). */
export type ShutterLook =
  | { state: "idle" }
  | { state: "sending"; progress: number; count: number }
  | { state: "standby"; progress: number; count: number };

/**
 * THE FOOT, as `guest-action-dock.tsx` draws it: the page's ground rising,
 * Invite, the Add, the reel, in one row. What stands above the shutter
 * (`above`: an option's own pill or chip) stands where production's stand-in
 * stands (`sending-stand-in.tsx`: fixed, 6.25rem up, centred, 18rem at most),
 * so whatever an option draws there is judged in the very band the stack's
 * stand-in uses.
 */
function Dock({ shutter, above }: { shutter: ShutterLook; above?: ReactNode }) {
  const standby = shutter.state === "standby";
  return (
    <>
      <div
        data-ns-dock=""
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
          <span data-ns-standby={standby ? "" : undefined} className="contents">
            <Shutter
              state={shutter.state === "idle" ? "idle" : "sending"}
              progress={shutter.state === "idle" ? 0 : shutter.progress}
              count={shutter.state === "idle" ? 0 : shutter.count}
              hues={WEDDING.hues}
              tabIndex={-1}
              aria-label={
                shutter.state === "idle"
                  ? "Add photos"
                  : `Add photos, ${shutter.count} ${standby ? "waiting" : "uploading"}`
              }
            />
          </span>
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
      {above ? (
        <div
          data-ns-above=""
          className="pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
        >
          {above}
        </div>
      ) : null}
    </>
  );
}

/**
 * A TOAST WHERE PRODUCTION'S TOASTER STANDS (`ui/sonner.tsx`: top centre, 5rem
 * down, the display's own ground, its radius and edge), drawn still: the lab's
 * own page wears the one sonner toaster, so the frame draws its toast as one.
 */
export function ToastStill({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: string;
}) {
  return (
    <div
      data-ns-toast=""
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
    >
      <div className="surface-display flex w-full max-w-[356px] items-center gap-3 rounded-(--radius-float) border border-(--display-edge) bg-(--display) px-4 py-3.5 text-(--display-foreground) shadow-layer">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-pretty">{title}</p>
          {description ? (
            <p className="mt-0.5 text-sm text-pretty opacity-70">
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <span className="shrink-0 rounded-(--radius-action-sm) bg-(--display-foreground) px-2.5 py-1.5 text-xs font-medium text-(--display)">
            {action}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Scrolls the frame's own window: to the album's head (the bar a little under
 * the frame's top, so the dock is up and the head's slot in view), or on into
 * the rows. Once the webfont and the cover settle.
 */
function useScroll(to: Scroll) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || to === "top") return;
    const go = () => {
      const bar = el.querySelector<HTMLElement>("[data-ns-bar]");
      if (!bar) return;
      const top = bar.getBoundingClientRect().top + win.scrollY;
      win.scrollTo(0, to === "head" ? top - 16 : top + 520);
    };
    go();
    const t1 = win.setTimeout(go, 400);
    const t2 = win.setTimeout(go, 1200);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
  }, [to]);
  return ref;
}

/* ── the send, as the head and the foot draw it ─────────────────────────── */

/** Her send at the head, sending: production's stack, its file in the air, the rest under it. */
export function SendStack({
  progress,
  remaining,
}: {
  progress: number;
  remaining: number;
}) {
  const first = UNSENT[0]!;
  return (
    <div data-ns-stack="sending" className="relative h-full">
      <UploadStackTile
        file={namedFile(first.name)}
        url={first.still.src}
        progress={progress}
        remaining={remaining}
        onStop={() => {}}
      />
    </div>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

/**
 * PRIYA'S PAGE: the header, the cover, the album's bar and rows, its foot. The
 * head's slot holds what an option puts there (`head`); `landed` is what of
 * hers is in the album (newest first, at its head); `above` stands over the
 * shutter in the stand-in's band; `over` is a layer over the page (a sheet,
 * her list, a toast).
 */
export function GuestAlbum({
  scroll,
  head,
  landed = [LANDED.still],
  shutter = { state: "idle" },
  above,
  over,
}: {
  scroll: Scroll;
  head?: ReactNode;
  landed?: readonly Still[];
  shutter?: ShutterLook;
  /** What stands above the shutter (a pill, a chip), in the foot's own band. */
  above?: ReactNode;
  over?: ReactNode;
}) {
  const boxRef = useScroll(scroll);
  const count = WEDDING.photos + landed.length;
  return (
    <div
      ref={boxRef}
      data-ns-album={scroll}
      className="relative min-h-screen bg-background pb-40 text-foreground"
    >
      <GuestBar />
      <AlbumCover
        className="-mt-14"
        ground={
          <div className="absolute inset-0">
            <HeadStills stills={[{ id: COVER.id, tile: COVER.src }]} />
          </div>
        }
        name={WEDDING.name}
        host={{
          name: WEDDING.host.name,
          avatarUrl: null,
          seed: WEDDING.host.seed,
        }}
        date={WEDDING.date}
        description={null}
        mediaCount={count}
        guestCount={WEDDING.guests}
        actions={<CoverActions />}
      />
      <div className="mt-5 px-3">
        <AlbumBar count={count} />
        <Rows head={head} landed={landed} />
      </div>
      {scroll === "top" ? null : <Dock shutter={shutter} above={above} />}
      {over}
    </div>
  );
}
