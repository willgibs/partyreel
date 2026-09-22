"use client";

import type { ReactNode } from "react";
import {
  Clapperboard,
  Lock,
  Play,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import {
  formatReelMeta,
  PosterCard,
  PosterCardChip,
} from "@/components/reel/poster-card";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { DEFAULT_STYLE_ID, EVENT, ONE_STILL } from "./fixtures";

/**
 * THE LEAF PIECES, EVERY ONE QUOTED OR REAL. `PosterCard`/`PosterCardChip`/
 * `formatReelMeta` are the shipped reel face (`src/components/reel/poster-card.tsx`,
 * this lane's own read) — imported directly, never re-typed, because they carry
 * no hooks and no portal. The welcome sheet and the hub's cards row DO carry
 * state and a provider (`entry-modal.tsx`'s session reads, `useEventShare()`),
 * so those are QUOTED markup (guest-capture's own rule, carried here): a Radix
 * portal or a live Supabase read inside a lab frame lands on the LAB PAGE, or on
 * whoever this machine is signed in as, never on Priya or on Maya.
 */

/* ── the crossfade: real engine frames or plain stills, CSS-only ─────────── */

/**
 * Six images, one shared keyframe (`reel-front.css`), phase-shifted by a
 * negative delay so each gets its own sixth of the cycle. `holdSec` is the
 * whole difference between the two crossfade options: about 1.1s reads as the
 * reel actually playing; about 3.2s reads as a slow rotation of stills.
 *
 * ★ `restIndex` IS NOT THE "HERO" FRAME — it is whichever image reduced motion
 * freezes on (bible 14: every animation lives inside that block), and the
 * caller's choice here is a real decision, not a default. `lab:demo` captures
 * under `prefers-reduced-motion: reduce` (its own still-picture mode), which
 * is how a `hub` pairing was FOUND landing on the identical picture: the
 * "living" thumb and the "still, with the count" option both froze on the
 * SAME index. `CanvasReelPlayer` itself rests on frame 0 under reduced
 * motion, never a curated one, so every "this is playing" caller passes 0
 * here; a caller drawing a deliberately chosen single cover frame (the
 * "framed still", the door's "one still") uses `StillFrame` instead, never
 * this component at n=1.
 */
export function Crossfade({
  images,
  holdSec,
  restIndex = 0,
  className,
}: {
  images: readonly string[];
  holdSec: number;
  restIndex?: number;
  className?: string;
}) {
  const n = images.length || 1;
  const total = holdSec * n;
  return (
    <div
      data-rf-crossfade
      data-rf-count={n}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew, or a local fixture still
        <img
          key={src.slice(-24) + i}
          src={src}
          alt=""
          data-rf-hero={i === restIndex ? "" : undefined}
          className="rf-crossfade-img"
          style={
            {
              "--rf-hold": holdSec,
              "--rf-delay": i * holdSec - total,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** One locked frame, no motion — the "framed still" option and every door
 *  backdrop that is explicitly NOT the moving reel. */
export function StillFrame({
  src,
  className,
}: {
  src: string | null;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew, or a local fixture still
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="size-full bg-[oklch(0.16_0_0)]" />
      )}
    </div>
  );
}

/* ── the living tile itself ───────────────────────────────────────────────── */

export type Verb2 = "add" | "make" | null;

const VERB2_LABEL: Record<Exclude<Verb2, null>, string> = {
  add: "Add yours",
  make: "Make your own",
};

function Verb2Chip({ verb2 }: { verb2: Verb2 }) {
  if (!verb2) return null;
  const Icon = verb2 === "add" ? Plus : Sparkles;
  return (
    <span
      data-rf-verb2
      className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-lift"
    >
      <Icon className="size-3" aria-hidden />
      {VERB2_LABEL[verb2]}
    </span>
  );
}

/** The corner mark: the plain "The reel" chip, or the personalised
 *  acknowledgement the `yours` ask's first option wears in its place. Never
 *  both — a card announcing itself and congratulating the viewer in the same
 *  breath is two ideas fighting for one corner. */
function TileBadge({ yours }: { yours?: boolean }) {
  if (yours) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-[oklch(0.32_0.09_300)]/90 px-2 py-0.5 text-label font-semibold text-white uppercase backdrop-blur-sm">
        <Sparkles className="size-2.5" aria-hidden />
        Yours is in it
      </span>
    );
  }
  return <PosterCardChip label="The reel" />;
}

/**
 * THE LIVING TILE: `PosterCard` reshaped horizontal (the shipped card is a 4:5
 * keepsake portrait; this slot is full-bleed above the album, the same box
 * `aboveAlbum` already owns — event-experience.tsx's BLEED area, never the
 * words column). `aspectClassName` carries that reshape; everything else
 * (the gradient, the name, the meta line, the chip, the play badge) is
 * `PosterCard`'s own, unmodified.
 */
export function TileCard({
  media,
  count,
  yours = false,
  verb2 = null,
  playBadge = false,
  aspect = "aspect-[2/1] sm:aspect-[21/9]",
}: {
  media: ReactNode;
  count: number;
  yours?: boolean;
  verb2?: Verb2;
  playBadge?: boolean;
  aspect?: string;
}) {
  const meta = formatReelMeta({
    styleLabel: resolveStyleEntry(DEFAULT_STYLE_ID).label,
    momentCount: count,
  });
  return (
    <div data-rf-tile className="relative">
      <PosterCard
        eventName={EVENT.name}
        meta={meta}
        chip={<TileBadge yours={yours} />}
        playBadge={playBadge}
        media={<div className={cn("relative w-full", aspect)}>{media}</div>}
      />
      <Verb2Chip verb2={verb2} />
    </div>
  );
}

/* ── the small states: nothing yet, or not yet enough ─────────────────────── */

export function SmallStateSlot({
  kind,
  count,
}: {
  kind: "line" | "dimmed";
  count: 0 | 1 | 2;
}) {
  const remaining = 3 - count;
  const words = remaining === 1 ? "One more" : `${remaining} more`;
  if (kind === "line") {
    return (
      <p
        data-rf-state="line"
        className="py-2 text-center text-working text-muted-foreground"
      >
        {words} and the reel begins.
      </p>
    );
  }
  return (
    <div
      data-rf-state="dimmed"
      className="relative flex aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 opacity-60 sm:aspect-[21/9]"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Lock className="size-4 text-muted-foreground" aria-hidden />
        <p className="text-xs font-medium text-muted-foreground">
          {count} of 3 &middot; {words} to begin
        </p>
      </div>
    </div>
  );
}

/* ── the after-upload beat: a toast, quoted (sonner portals; see host-curation) ── */

export function YoursToast() {
  return (
    <div
      data-rf-toast
      className="flex items-center gap-2.5 rounded-[var(--radius-float)] border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-layer"
    >
      <Sparkles className="size-4 shrink-0 text-[oklch(0.7_0.14_300)]" aria-hidden />
      Yours is in the reel.
    </div>
  );
}

/* ── the album's ground: header, then the slot, then the grid ───────────────── */

export function GuestHeader({ named = true }: { named?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <div className="flex h-8 items-center">
        {named ? (
          <span className="flex items-center gap-2">
            <Avatar size="sm" seed="rf-guest">
              <AvatarFallback className="text-[10px]">T</AvatarFallback>
            </Avatar>
            <span className="text-sm">Theo</span>
          </span>
        ) : (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        )}
      </div>
    </header>
  );
}

export function AlbumStrip({ items }: { items: GridMedia[] }) {
  return (
    <div data-rf-strip className={cn(GALLERY_COLUMNS, "px-4 pb-6")}>
      {items.map((item) => (
        <div
          key={item.id}
          data-media-tile
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
            borderRadius: "var(--radius-tile)",
          }}
          className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/** The whole guest page's ground, `event-experience.tsx`'s own two boxes: a
 *  COLUMN for the header (reading measure, pinned left) and a BLEED for the
 *  reel's slot, the demo's own slot and the album (the gutter alone, full
 *  width in the frame). `data-bleed-slot` marks each BLEED block in DOM order,
 *  so a measure function can confirm the tile is its own slot, never stacked
 *  with `aboveAlbum` (the `tile` ask's own demo-order requirement). */
export function Ground({
  named = true,
  slot,
  above,
  items,
}: {
  named?: boolean;
  /** The reel's own slot — its OWN box directly above `aboveAlbum`, null when
   *  the `states` ask's "nothing" option has nothing to put there at all. */
  slot: ReactNode;
  /** `aboveAlbum` — the demo's turn card, one slot below the reel's. Only the
   *  `tile` ask's demo scene passes this; every other ask's real event has none. */
  above?: ReactNode;
  items: GridMedia[];
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestHeader named={named} />
      <div className="mx-auto max-w-[900px] px-4 pt-4 pb-1">
        <h1 className="font-heading text-subsection text-balance">
          {EVENT.name}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Hosted by {EVENT.host} &middot; {EVENT.date}
        </p>
      </div>
      {slot && (
        <div
          data-bleed-slot="tile"
          className="mx-auto max-w-[900px] px-4 pt-3 pb-1"
        >
          {slot}
        </div>
      )}
      {above && (
        <div
          data-bleed-slot="above-album"
          className="mx-auto max-w-[900px] px-4 pb-1"
        >
          {above}
        </div>
      )}
      <div className="mx-auto max-w-[900px]">
        <AlbumStrip items={items} />
      </div>
    </div>
  );
}

/* ── the door: the held welcome, quoted (entry-modal.tsx portals via vaul/Sheet) ── */

/** The welcome step's own copy and shape, quoted rather than mounted: the real
 *  `EntryModal` reads a live Supabase session on mount and its shell
 *  (`entry-shell.tsx`) opens a Radix `Sheet`/vaul `Drawer`, both of which
 *  portal to `document.body` — the LAB PAGE's, not the frame's (frame.tsx's own
 *  landmine; guest-capture's scene.tsx names the same trap for its own
 *  account-menu quotes). */
export function WelcomeSheetQuote({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      data-rf-sheet
      className={cn(
        "absolute border-border bg-popover text-popover-foreground shadow-layer",
        desktop
          ? "inset-y-0 right-0 w-[26rem] max-w-[80%] border-l px-8 py-10"
          : "inset-x-0 bottom-0 rounded-t-float border-t px-6 pt-5 pb-7",
      )}
    >
      {!desktop && (
        <div className="mx-auto h-1 w-9 rounded-full bg-muted-foreground/30" />
      )}
      <p className="mt-4 text-label font-medium text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">
        {EVENT.name}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
        <span className="text-faint">Hosted by</span>
        <Avatar size="sm" seed="rf-maya">
          <AvatarFallback className="text-[10px]">M</AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">{EVENT.host}</span>
        <span aria-hidden className="text-faint">
          &middot;
        </span>
        <span>{EVENT.date}</span>
      </p>
      <Button size="lg" className="mt-5 w-full" tabIndex={-1}>
        Continue
      </Button>
    </div>
  );
}

/** The backdrop dim/blur every itinerary step sits over — vaul's own overlay
 *  class, quoted (`entry-shell.tsx`'s `Drawer.Overlay`, this lane's own read). */
export function DoorScrim() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-black/10 backdrop-blur-xs"
    />
  );
}

/** The door's third option: one big still, no grid, no motion. */
export function OneStillBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
      <img
        src={ONE_STILL.src}
        alt=""
        className="size-full object-cover opacity-90"
      />
    </div>
  );
}

/** The door's shipped option: the real album grid, plain, as a locked or
 *  mid-itinerary guest already meets it today (no engine — these are the
 *  album's own photographs, not the reel). */
export function NineStillsBackdrop({ items }: { items: GridMedia[] }) {
  return (
    <div className="absolute inset-0 overflow-y-hidden overflow-x-hidden opacity-90">
      <div className={cn(GALLERY_COLUMNS, "px-3 pt-3")}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              aspectRatio: `${item.width} / ${item.height}`,
              borderRadius: "var(--radius-tile)",
            }}
            className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
          >
            <MediaTile item={item} playBadge="none" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── the host's hub: the cards row, quoted (useEventShare() needs its provider) ── */

/** `event-cards-row.tsx`'s own card shell (`h-24 w-40 rounded-xl border`),
 *  quoted at rest (never `stuck`): the real row needs `EventShareProvider` for
 *  its three other doors, which this ask does not touch. The shell carries no
 *  padding of its own so a picture variant can bleed to every edge; the
 *  labelled variant supplies its own `p-3`. */
export function HubCardsRow({ reel }: { reel: ReactNode }) {
  return (
    <div role="group" aria-label="This event" className="flex gap-2 py-0.5">
      <div className="h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-border">
        {reel}
      </div>
      <HubStub label="Guests" value="12 contributors" icon={<Users className="size-4" />} />
    </div>
  );
}

function HubStub({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex h-24 w-40 shrink-0 flex-col justify-between gap-1 rounded-xl border border-border p-3 text-muted-foreground">
      {icon}
      <span>
        <span className="block font-heading text-card-title font-medium text-foreground">
          {label}
        </span>
        <span className="block truncate text-xs">{value}</span>
      </span>
    </div>
  );
}

/** The Reel card's own three faces — the only thing the `hub` ask varies. Each
 *  fills the FULL `h-24 w-40` shell `HubCardsRow` hands it, so all four cards
 *  in the row keep one box whichever face this one wears. */
export function HubReelCardBody({
  variant,
  media,
  count,
  on,
}: {
  variant: "living" | "labelled" | "counted";
  media: ReactNode;
  count: number;
  on: boolean;
}) {
  if (variant === "labelled") {
    return (
      <div data-rf-hub-reel className="flex h-full flex-col justify-between p-3">
        <Clapperboard className="size-4 text-muted-foreground" aria-hidden />
        <span>
          <span className="block font-heading text-card-title font-medium">
            Reel
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {on ? `${count} items` : "Off"}
          </span>
        </span>
      </div>
    );
  }
  return (
    <div data-rf-hub-reel className="relative h-full w-full">
      {media}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/70 to-transparent" />
      {variant === "living" ? (
        <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] font-semibold text-white">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-[oklch(0.72_0.19_25)]"
          />
          {on ? "Live" : "Off"}
        </span>
      ) : (
        <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] font-semibold text-white">
          <Play className="size-2.5 fill-white" aria-hidden />
          {on ? `${count}` : "Off"}
        </span>
      )}
    </div>
  );
}
