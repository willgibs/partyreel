"use client";

// The stage's own sheet (the column's two geometries, the dissolve, the halo's
// object): production's, read, so the stage below draws at its numbers.
import "@/components/marketing/sections/features/album/live-album.css";

import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { BrowserFrame } from "@/components/marketing/frames";
import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import {
  GAP,
  STAGE,
  type Variant,
} from "@/components/shared/album-stream/stream-engine";
import { Glow } from "@/components/shared/glow";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { DEFAULT_ROW_STEP } from "@/lib/shared/album-rows";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

import { PushStream } from "./push-stream";

/**
 * THE ALBUM PAGE'S HERO, ITS ALBUM LAID OUT IN ROWS (the marketing refresh,
 * 2026-09-28). The board used to draw the shipped `ArrivalsHero` whole, and
 * that hero's stage still draws `GuestMasonry`: columns, which the real album
 * left for rows at milestone 29 (album-rows, album-window, the guest and host
 * wirings). A fall judged over an album the product no longer has is judged
 * against the wrong thing, so every option now stands on the album as it is.
 *
 * ★ PRODUCTION'S HERO, RECOMPOSED, NOT REDRAWN. The lockup is `ArrivalsHero`'s
 * own props on `PageHero` (the same eyebrow, headline, subhead, actions and
 * class string); the stage is `LiveAlbumStage` line for line (its frame, its
 * header, its halo, its sheet, its numbers from `STAGE` and `GAP`) with one
 * swap: the one grid in its justified rows (`layout="rows"`, the grid
 * `GalleryRows` mounts for a guest) where it mounts `GuestMasonry`, laid
 * plain (the grid's own note below says why). The first four falls are
 * production's `AlbumStream`, the pick still a one-word change to `SHIPPED`;
 * the stage's swap is the wiring's other line, whichever fall wins.
 *
 * ★ ONLY THE PUSH'S ALBUM MOVES. The other four draw what production draws: an
 * album that never takes the photograph in, because nothing reaches it. The
 * push hands every photograph over, so its stage receives them the way a
 * guest's album does: prepended at the head in the SAME update that marks its
 * glow (a mark set a commit later would show the tile whole for a frame), the
 * rows writing `data-entering` for the push themselves, and the glow let go
 * after the grammar's own `ARRIVAL_GLOW_MS`.
 */

/** A still of the album's twelve at its real dimensions, as the stage lays them. */
function still(i: number, id: string): GridMedia {
  const img = marketingImage(STREAM_FRAMES[i]);
  return {
    id,
    type: "photo",
    url: img.src,
    width: img.width,
    height: img.height,
  };
}

/** The stage's album: `LiveAlbumStage`'s own twelve, none twice. */
const ALBUM: GridMedia[] = STREAM_FRAMES.map((key, i) =>
  still(i, `alb-${key}-${i}`),
);

/** The demo event the whole site already uses (`LiveAlbumStage`'s own). */
const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June 2026",
  photos: 142,
  guests: 23,
  url: "partyreel.com/a/maya-and-jay",
} as const;

/** `LiveAlbumStage`'s halo: the object lit from behind, its face clean. */
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
          "--glw-dur": "var(--spill-cadence)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** `LiveAlbumStage` with its album in rows: decorative, inert, one swap. */
function RowsStage({
  items,
  arrivedIds,
}: {
  items: GridMedia[];
  arrivedIds?: ReadonlySet<string>;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const colors = useSampledPaletteFromDom(host, { limit: 6 });
  return (
    <div
      ref={host}
      aria-hidden
      inert
      className="alb-stage relative isolate mx-auto w-full max-w-4xl"
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
      <div className="alb-clip">
        <Halo colors={colors ?? undefined}>
          <BrowserFrame label={EVENT.url} className="alb-frame">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1 pt-1 pb-4 sm:px-2 sm:pt-2 sm:pb-5">
              <div className="min-w-0">
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
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-success"
                />
                Live now
              </span>
            </div>
            <div className="alb-grid">
              {/* The guest album's rows (`GalleryRows`' own grid and step,
                  its entrance stagger and its arrival marks), laid PLAIN: its
                  `double` rhythm leads about one row in six with a landscape
                  at twice the height, and on a stage that shows two rows that
                  is one photograph filling the album. The address stays off:
                  the stage is not the page's subject. */}
              <MasonryColumns
                layout="rows"
                items={items}
                stagger
                rowStep={DEFAULT_ROW_STEP}
                arrivedIds={arrivedIds}
                photoAddress={false}
              />
            </div>
          </BrowserFrame>
        </Halo>
      </div>
    </div>
  );
}

/** `ArrivalsHero`'s lockup, its backdrop and its stage handed in. */
function Hero({
  backdrop,
  children,
}: {
  backdrop: ReactNode;
  children: ReactNode;
}) {
  const page = featurePage("album");
  return (
    <PageHero
      entrance="cut"
      eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
      heading={page.h1}
      subhead={page.heroSub}
      actions={
        <>
          <Button asChild size="cta">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </>
      }
      backdrop={backdrop}
      className="relative overflow-x-clip pt-14 pb-[110px] sm:pt-20 lg:pb-[150px]"
    >
      {children}
    </PageHero>
  );
}

/** One of production's four falls, over the album in rows. */
export function RowsHero({ variant }: { variant: Variant }) {
  return (
    <Hero backdrop={<AlbumStream variant={variant} />}>
      <RowsStage items={ALBUM} />
    </Hero>
  );
}

/** The push: each photograph that goes in opens the album's first row. */
export function PushHero() {
  const [album, setAlbum] = useState<{
    items: GridMedia[];
    arrived: ReadonlySet<string>;
  }>({ items: ALBUM, arrived: new Set() });
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  const arrive = useCallback((n: number, photo: number) => {
    const id = `alm-arrival-${n}`;
    setAlbum((prev) =>
      prev.items.some((m) => m.id === id)
        ? prev
        : {
            items: [still(photo, id), ...prev.items],
            arrived: new Set([...prev.arrived, id]),
          },
    );
    const t = setTimeout(() => {
      timers.current.delete(t);
      setAlbum((prev) => {
        const arrived = new Set(prev.arrived);
        arrived.delete(id);
        return { ...prev, arrived };
      });
    }, ARRIVAL_GLOW_MS);
    timers.current.add(t);
  }, []);

  return (
    <Hero backdrop={<PushStream onArrive={arrive} />}>
      <RowsStage items={album.items} arrivedIds={album.arrived} />
    </Hero>
  );
}
