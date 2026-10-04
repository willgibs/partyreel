"use client";

import {
  ImageUp,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import { UserMenu } from "@/components/app/user-menu";
import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";
import { formatEventDate } from "@/lib/utils";

import { COVER, HOST, type Photo, PRIYA, WEDDING } from "./fixtures";
import { type Screen } from "./knobs";
import {
  LiveWord,
  ORDER_CHOICES,
  orderWords,
  TAKE_CHOICES,
  takeWords,
} from "./settings";

/**
 * THE ALBUM, PRODUCTION'S, IN WHICHEVER ORDER AN OPTION RUNS IT: the guest's
 * page (`event-experience.tsx`: the header on the cover, the real
 * `AlbumCover` over the real `HeadStills`, then the album's box) and the
 * host's hub (its bar, its heading, the album's own row of verbs), their rows
 * laid by production's own engine (`album-rows.ts`: the justified rows at
 * the middle step, with its rhythm) so a photograph stands where the album
 * would stand it.
 *
 * ★ THE ORDER IS THE WHOLE PICTURE. Each frame is scrolled down to the album
 * (the cover's foot in sight above it), because the question is which way
 * its first rows run: the arch and the rings first, or the dance floor.
 *
 * ★ A CHOICE DRAWN OPEN is production's live word (`SettingWord`), its menu
 * pressed open once the frame paints; every press in it works and changes
 * nothing outside it.
 */

/** Radix sizes a popper's wrapper by the LAB's window; a menu open from the first paint needs its layer back. */
const FRAME_SHEET = "[data-radix-popper-content-wrapper]{z-index:50!important}";

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 11;

type Tile = { photo: Photo; x: number; y: number; w: number; h: number };

/** Production's justified rows for these photographs, in this order, at this box width. */
function planRows(
  photos: readonly Photo[],
  width: number,
): { tiles: Tile[]; height: number } {
  const perRow = perRowFor(width, 1);
  const base = photos.map((p) => ({ id: p.id, ratio: p.ratio }));
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
  const byId = new Map(photos.map((p) => [p.id, p]));
  const tiles: Tile[] = [];
  let y = 0;
  for (const row of layout.rows) {
    let x = 0;
    row.ids.forEach((id, k) => {
      const w = row.widths[k]!;
      tiles.push({ photo: byId.get(id)!, x, y, w, h: row.height });
      x += w + GAP;
    });
    y += row.height + GAP;
  }
  return { tiles, height: Math.max(0, y - GAP) };
}

/** The box's own width, read once it lays out (the hub's container is the shell's, never a number of ours). */
function useBoxWidth(): [RefObject<HTMLDivElement | null>, number | null] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
  }, []);
  return [ref, width];
}

/** The rows, each tile `album-tile.tsx`'s box: a photograph covering its place. */
function Rows({
  photos,
  width: given,
}: {
  photos: readonly Photo[];
  /** The box's width where the page knows it; read off the box where it does not. */
  width?: number;
}) {
  const [ref, read] = useBoxWidth();
  const width = given ?? read;
  if (width === null) return <div ref={ref} data-cz-rows="" />;
  const { tiles, height } = planRows(photos, width);
  return (
    <div ref={ref} className="relative" style={{ height }} data-cz-rows="">
      {tiles.map((t, i) => (
        <div
          key={t.photo.id}
          data-cz-tile={t.photo.id}
          data-cz-place={i + 1}
          className="absolute overflow-hidden rounded-tile bg-muted"
          style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one */}
          <img
            src={t.photo.src}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: t.photo.focus }}
          />
        </div>
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

/* ── the guest's page ──────────────────────────────────────────────────── */

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
 * PRIYA'S PAGE: the header, the cover, and the album's box with its own row
 * (the count, Select, View), the frame scrolled to the album.
 */
export function GuestAlbum({
  screen,
  photos,
  count,
}: {
  screen: Screen;
  /** The photographs in the order this option runs them, first first. */
  photos: readonly Photo[];
  count: number;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(screen === "1440" ? 150 : 96);
  return (
    <div
      data-cz-guest-album={photos[0]?.id}
      className="relative min-h-screen bg-background pb-24 text-foreground"
    >
      <style>{FRAME_SHEET}</style>
      <GuestBar />
      <AlbumCover
        className="-mt-14"
        ground={
          <div className="absolute inset-0">
            <HeadStills
              stills={COVER.map((p, i) => ({ id: `${p.id}-${i}`, tile: p.src }))}
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
      <div ref={box} className="mt-5 px-3 sm:px-5" data-cz-album-box="">
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
        <Rows photos={photos} width={albumWidth(w)} />
      </div>
    </div>
  );
}

/* ── the host's hub ────────────────────────────────────────────────────── */

/**
 * THE ALBUM SAYING HOW GUESTS SEE IT (the `home` ask's `album`): one quiet
 * line under the album's own row, in Settings' idiom, each choice a live word
 * (production's `SettingWord`), so the event's own choices stand on the very
 * album they shape. Her own view (the size, her sort) stays in View, untouched:
 * this line is the party's, never her view's.
 */
function AlbumLine() {
  const [order, setOrder] = useState("turns");
  const [take, setTake] = useState("own");
  return (
    <p
      data-cz-album-line=""
      className="text-caption leading-5 text-pretty text-muted-foreground"
    >
      <span>Your guests see it </span>
      <LiveWord
        title="How the album runs"
        choices={ORDER_CHOICES}
        value={order}
        onChoose={setOrder}
        words={orderWords[order]!}
        open
      />
      <span>, and take home </span>
      <LiveWord
        title="What guests take home"
        choices={TAKE_CHOICES}
        value={take}
        onChoose={setTake}
        words={takeWords[take]!}
      />
      <span>.</span>
    </p>
  );
}

/**
 * MAYA'S HUB, ITS ALBUM SAYING HOW GUESTS SEE IT (the `home` ask's `album`):
 * the app's bar, the wedding's name and date, the album's row (its count, Add
 * photos, Download all, Select, View), the line, its order's choice open, and
 * the album's first rows.
 */
export function HubAlbum({
  screen,
  photos,
}: {
  screen: Screen;
  photos: readonly Photo[];
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{FRAME_SHEET}</style>
      <AppShell
        headerActions={
          <span inert className="flex items-center">
            <UserMenu
              email={HOST.email}
              displayName={HOST.name}
              avatarUrl={null}
              seed={HOST.seed}
              planName="Event Pass"
            />
          </span>
        }
      >
        <div className="space-y-5" data-cz-hub="">
          <SetCrumbs
            trail={[
              { label: "Partyreel", href: "/dashboard" },
              { label: WEDDING.name },
            ]}
          />
          <div className="space-y-1">
            <PageHeading>{WEDDING.name}</PageHeading>
            <p className="text-sm text-muted-foreground">
              {formatEventDate(WEDDING.date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Album{" "}
              <span className="text-muted-foreground tabular-nums">
                {formatCount(214)}
              </span>
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Button variant="outline" size="sm" tabIndex={-1}>
                <ImageUp /> Add photos
              </Button>
              {screen === "1440" ? (
                <>
                  <Button variant="outline" size="sm" tabIndex={-1}>
                    <Download /> Download all
                  </Button>
                  <Button variant="outline" size="sm" tabIndex={-1}>
                    <ListChecks /> Select
                  </Button>
                </>
              ) : null}
              <Button variant="outline" size="sm" tabIndex={-1}>
                <SlidersHorizontal /> View
              </Button>
            </div>
          </div>
          <AlbumLine />
          <div className="pt-1">
            <Rows photos={photos} />
          </div>
        </div>
      </AppShell>
    </div>
  );
}
