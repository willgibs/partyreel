"use client";

import {
  ImageUp,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useRef,
} from "react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Shutter, type ShutterState } from "@/components/ui/shutter";
import { formatMediaCount } from "@/lib/format/count";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";

import { ALBUM, COVER, type Light, type Still, WEDDING } from "./fixtures";
import type { Ground, Screen } from "./knobs";
import { huesOf, Puck, Seam, Strip } from "./light";

/**
 * MAYA & JAY'S ALBUM AS PRIYA HOLDS IT, PRODUCTION'S: the guest's header on
 * the real `AlbumCover` over the real `HeadStills`, the album's box (its count,
 * Select, View) and its rows laid by production's own engine (`album-rows.ts`),
 * and the dock at the foot with production's `Shutter` at its centre.
 *
 * ★ AN OPTION DRAWS ONLY ITS LIGHT: the cover's Seam (with the edge it is
 * born at, below) and the Ring's state round the shutter. Everything else is
 * the album as built, so two options differ where their light does.
 *
 * ★ THE SEAM IS THE HUB'S, UNDER THE GUEST'S COVER (event-header r6's numbers,
 * retyped): 72 px at a phone and 120 at a desk, at full strength, the album
 * standing 8 px past its reach; on paper a strip of the room 30 or 36 px tall.
 * ★ AND THE COVER'S SCRIM LIFTS AT ITS VERY FOOT (r6's correction): the
 * photograph shows its own colours along the edge the light is born at, or the
 * light would seem to come from black. The words above keep their scrim.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the cover
 * holds one still (production dissolves through several), the dock is
 * composed as `guest-action-dock.tsx` draws it with its controls held, and
 * every press is inert.
 */

/** Where the Seam stands under a cover, per screen (event-header r6's, retyped). */
export const SEAM_AT: Record<Screen, { reach: number; strip: number }> = {
  "375": { reach: 72, strip: 30 },
  "1440": { reach: 120, strip: 36 },
};

/** How far the photograph shows its own colours at the cover's foot. */
const EDGE_BAND = 22;

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;

/** A tile of the album: a still under a key of its own (a still may stand twice). */
export type Tile = { key: string; still: Still };

/** The album as the rows draw it: every still, then the first six again, so a laptop's screen is full. */
export const TILES: readonly Tile[] = [...ALBUM, ...ALBUM.slice(0, 6)].map(
  (still, i) => ({ key: `${still.id}-${i}`, still }),
);

type Placed = { tile: Tile; x: number; y: number; w: number; h: number };

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

/** The rows: each tile the album tile's box, a photograph covering its place. */
export function Rows({
  tiles,
  width,
}: {
  tiles: readonly Tile[];
  width: number;
}) {
  const { placed, height } = planRows(tiles, width);
  return (
    <div className="relative" style={{ height }} data-sg-rows="">
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

/** Scrolls the frame's own window to an element, the offset above it, once the webfont and the cover settle. */
export function useScrollTo(offset: number | null) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || offset === null) return;
    const go = () =>
      win.scrollTo(0, el.getBoundingClientRect().top + win.scrollY - offset);
    go();
    const t1 = win.setTimeout(go, 400);
    const t2 = win.setTimeout(go, 1200);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
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
        <Avatar size="sm" seed={WEDDING.guest.seed}>
          <AvatarFallback className="text-[10px]">
            {WEDDING.guest.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        {WEDDING.guest.name}
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
 * THE PHOTOGRAPH AT ITS OWN EDGE: the cover's still again, placed exactly as
 * the cover places it, shown only along the last few pixels over the scrim,
 * so the edge the Seam is born at is seen in its own colours.
 */
export function EdgeBand({ still }: { still: Still }) {
  return (
    <div
      aria-hidden
      data-sg-edge=""
      className="pointer-events-none absolute inset-0"
      style={{
        WebkitMaskImage: `linear-gradient(to top, #000 0, rgb(0 0 0 / 0.55) ${EDGE_BAND * 0.45}px, transparent ${EDGE_BAND}px)`,
        maskImage: `linear-gradient(to top, #000 0, rgb(0 0 0 / 0.55) ${EDGE_BAND * 0.45}px, transparent ${EDGE_BAND}px)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the cover's own still, at its edge */}
      <img
        src={still.src}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: still.focus, filter: "brightness(0.82)" }}
      />
    </div>
  );
}

/**
 * THE SEAM UNDER A COVER: in the room its whole reach in the page, words
 * past it; on paper a strip of the room under the photograph. `edge` is the
 * light of the cover's own bottom edge.
 */
export function CoverSeam({
  screen,
  ground,
  light,
}: {
  screen: Screen;
  ground: Ground;
  light: Light;
}) {
  const at = SEAM_AT[screen];
  if (ground === "paper")
    return <Strip light={light} height={at.strip} className="w-full" />;
  return (
    <div
      className="relative w-full"
      style={{ height: at.reach }}
      data-sg-cover-seam=""
    >
      <Seam light={light} edge="top" reach={at.reach} />
    </div>
  );
}

/* ── the dock and its Ring ─────────────────────────────────────────────── */

/** The Ring's state at one instant: production's shutter state, and its light's level. */
export type RingBeat = {
  /** `lit`: the album's light at rest; `unlit`: a hairline until something sends. */
  kind: "lit" | "unlit";
  state: ShutterState;
  progress?: number;
  count?: number;
  /** The envelope's level at this instant, 0 at rest to 1 at its peak; absent is production's own. */
  lift?: number;
  /** Held still: no breath (a beat drawn at an instant). */
  held?: boolean;
  /** A Ring whose light moves only when something happens: production's breath stood down. */
  still?: boolean;
};

/**
 * THE RING ROUND THE ADD: production's `Shutter` in the album's light, held at
 * a beat. On paper it stands in its puck, a piece of the room, so its light is
 * the room's whatever the page.
 */
export function Ring({
  beat,
  light,
  ground,
  wrapRef,
}: {
  beat: RingBeat;
  light: Light;
  ground: Ground;
  /** A live driver writes the envelope's level on this element itself (`--sg-lift`), never through a render. */
  wrapRef?: Ref<HTMLSpanElement>;
}) {
  const shutter = (
    <Shutter
      state={beat.state}
      progress={beat.progress ?? 0}
      count={beat.count ?? 0}
      hues={huesOf(light)}
      tabIndex={-1}
      aria-label={
        beat.state === "sending"
          ? `Add photos, ${beat.count ?? 0} uploading`
          : "Add photos"
      }
    />
  );
  const lifted = beat.lift !== undefined;
  return (
    <span
      ref={wrapRef}
      data-sg-ring={beat.kind}
      data-sg-state={beat.state}
      data-sg-lift={lifted ? "" : undefined}
      data-sg-held={beat.held ? "" : undefined}
      data-sg-still={beat.still ? "" : undefined}
      className="relative inline-flex"
      style={lifted ? ({ "--sg-lift": beat.lift } as CSSProperties) : undefined}
    >
      {ground === "paper" ? <Puck size={64}>{shutter}</Puck> : shutter}
    </span>
  );
}

/** The foot, as `guest-action-dock.tsx` draws it: the page's ground rising, Invite, the Add, the reel. */
export function Dock({ ring }: { ring: ReactNode }) {
  return (
    <div
      data-sg-dock=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <div className="relative flex items-center justify-center gap-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Invite"
        >
          <QrCode />
        </Button>
        {ring}
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Watch the highlight reel"
        >
          <Play className="fill-current" />
        </Button>
      </div>
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────────── */

/**
 * PRIYA'S PAGE: the header, the cover, the cover's Seam where an option lights
 * it, the album's box and its rows, and the dock where the cover has scrolled
 * away. `scroll` scrolls the frame into the album (the cover gone); `dock` is
 * what stands at the foot then.
 */
export function GuestAlbum({
  screen,
  ground,
  seam,
  scroll,
  dock,
}: {
  screen: Screen;
  ground: Ground;
  /** The cover's Seam: its light, or none. */
  seam: Light | null;
  /** Scrolled into the album, the cover gone. */
  scroll: boolean;
  dock?: ReactNode;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(scroll ? (screen === "1440" ? 24 : 16) : null);
  const at = SEAM_AT[screen];
  return (
    <div
      data-sg-album={seam ? "seam" : "plain"}
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar />
      <AlbumCover
        className="-mt-14"
        ground={
          <div className="absolute inset-0">
            <HeadStills stills={[{ id: COVER.id, tile: COVER.src }]} />
            {seam ? <EdgeBand still={COVER} /> : null}
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
        mediaCount={WEDDING.photos}
        guestCount={WEDDING.guests}
        actions={<CoverActions />}
      />
      {seam ? <CoverSeam screen={screen} ground={ground} light={seam} /> : null}
      <div
        ref={box}
        className="px-3 sm:px-5"
        style={{
          marginTop: seam ? (ground === "paper" ? 16 : 8) : 20,
        }}
        data-sg-album-box=""
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
          <p className="px-0.5 text-working text-muted-foreground tabular-nums">
            {formatMediaCount(WEDDING.photos)}
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
        <Rows tiles={TILES} width={albumWidth(w)} />
      </div>
      {scroll && dock ? dock : null}
      {/* The reach the room's Seam takes, so a reader of the frame can say it. */}
      <span
        hidden
        data-sg-reach={seam ? (ground === "paper" ? at.strip : at.reach) : 0}
      />
    </div>
  );
}
