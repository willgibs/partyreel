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

import { CoverLight } from "./cover-light";
import { ALBUM, COVER, type Light, type Still, WEDDING } from "./fixtures";
import type { Ground, Screen } from "./knobs";
import { conicOf, huesOf, lampColor, Puck } from "./light";

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
 * ★ THE SEAM IS THE HUB'S OWN, UNDER THE GUEST'S COVER (`cover-light.tsx`:
 * production's drawing and maths, at the hub's reach), the album standing
 * 8 px past it. ★ AND THE COVER'S SCRIM LIFTS AT ITS VERY FOOT, as the hub's
 * does (`signature.css`, after `event-hub-head-seam.css`): the photograph
 * shows its own colours along the edge the light is born at, or the light
 * would seem to come from black. The words and the actions keep their scrim.
 *
 * ★ THE RING IS PRODUCTION'S SHUTTER: today's three hues where an option is
 * today, and Aperture's Ring (the album's key light at three depths, lit from
 * the top-left, its envelope a halo centred on it) where an option is new.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the cover
 * holds one still (production dissolves through several), the dock is
 * composed as `guest-action-dock.tsx` draws it with its controls held, and
 * every press is inert.
 */

/** The hub's Seam at each screen (`event-hub-head-seam.css`'s `--hub-reach` and `--hub-strip`), for the scroll's maths. */
export const SEAM_AT: Record<Screen, { reach: number; strip: number }> = {
  "375": { reach: 72, strip: 30 },
  "1440": { reach: 120, strip: 36 },
};

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
  /**
   * Aperture's Ring (every new option): the album's key light at three depths, lit from the top-left, resting low,
   * its envelope a halo centred on it. Absent, production's own three hues.
   */
  key?: boolean;
};

/**
 * THE RING ROUND THE ADD: production's `Shutter` in the album's light, held at
 * a beat. On paper it stands in its puck, a piece of the room, so its light is
 * the room's whatever the page.
 */
export function Ring({
  beat,
  light,
  keyLight,
  ground,
  wrapRef,
}: {
  beat: RingBeat;
  /** The album's light: production's three hues. */
  light: Light;
  /** The album's key light, for Aperture's Ring (`key` is React's own word, so not that). */
  keyLight: Light;
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
  const vars: CSSProperties & Record<`--${string}`, string | number> = {};
  if (lifted) vars["--sg-lift"] = beat.lift!;
  if (beat.key) {
    vars["--sg-key-conic"] = conicOf(keyLight, "room");
    vars["--sg-halo"] = lampColor(keyLight[1] ?? keyLight[0]!, "room");
  }
  return (
    <span
      ref={wrapRef}
      data-sg-ring={beat.kind}
      data-sg-state={beat.state}
      data-sg-lift={lifted ? "" : undefined}
      data-sg-held={beat.held ? "" : undefined}
      data-sg-still={beat.still ? "" : undefined}
      data-sg-key={beat.key ? "" : undefined}
      data-sg-paper={ground === "paper" ? "" : undefined}
      className="relative inline-flex"
      style={vars}
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
        {/* The flanks are production's rounds on the page's own ground (`GuestShare look="round"`, the reel's). */}
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
        {ring}
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

/* ── the page ──────────────────────────────────────────────────────────── */

/**
 * Where a frame stands in the album: its first screen; the hand-over, the
 * cover's actions just gone (so the dock has risen) while the cover's foot and
 * its Seam are still in view; or in the album, the cover and its Seam gone.
 */
export type AlbumScroll = "top" | "handover" | "in";

/** How far below the frame's top the album's box stands, per scroll and screen (the actions stand 24 or 36 px above the cover's foot). */
function offsetOf(
  scroll: AlbumScroll,
  screen: Screen,
  ground: Ground,
  seam: boolean,
): number | null {
  if (scroll === "top") return null;
  if (scroll === "in") return screen === "1440" ? 24 : 16;
  const actions = screen === "1440" ? 36 : 24;
  const light = seam
    ? ground === "paper"
      ? SEAM_AT[screen].strip + 16
      : SEAM_AT[screen].reach + 8
    : 20;
  // The actions' foot 4 px above the frame's top: the row has just left, so the dock stands.
  return actions - 4 + light;
}

/**
 * PRIYA'S PAGE: the header, the cover, the cover's Seam where an option lights
 * it, the album's box and its rows, and the dock once the cover's actions have
 * scrolled away.
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
  /** The cover's Seam: production's, under the cover. */
  seam: boolean;
  scroll: AlbumScroll;
  dock?: ReactNode;
}) {
  const w = screen === "1440" ? 1440 : 375;
  const box = useScrollTo(offsetOf(scroll, screen, ground, seam));
  return (
    <div
      data-sg-album={seam ? "seam" : "plain"}
      data-sg-scroll={scroll}
      className="relative min-h-screen bg-background pb-28 text-foreground"
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
        mediaCount={WEDDING.photos}
        guestCount={WEDDING.guests}
        actions={<CoverActions />}
      />
      {seam ? <CoverLight still={COVER} /> : null}
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
      {scroll !== "top" && dock ? dock : null}
    </div>
  );
}
