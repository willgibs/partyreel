"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  Clapperboard,
  Copy,
  Download,
  ImageUp,
  ListChecks,
  type LucideIcon,
  Play,
  QrCode,
  RotateCcw,
  Settings,
  Share2,
  TriangleAlert,
  Undo2,
  Users,
} from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import {
  formatReelDuration,
  formatReelMeta,
  PosterCard,
  PosterCardChip,
} from "@/components/reel/poster-card";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, POOL, REEL, TIMELINE } from "./fixtures";
import { ReelStill } from "./stills";

/**
 * THE TWO SURFACES ON EITHER SIDE OF THE STUDIO: the host's event hub, where
 * the door is, and the guest's album, where the reel ends up.
 *
 * ★ THESE ARE MOSTLY SHIPPED COMPONENTS, NOT REPLICAS. `PosterCard`,
 * `PosterCardChip`, `MediaTile`, `GALLERY_COLUMNS` and the reel's own
 * formatters are imported and never edited, so what Will judges on the guest's
 * side is what ships. The hub's cards row is the one thing copied rather than
 * mounted, and its own note below says why.
 *
 * ★ WHAT THE CARD REALLY MEASURES AT A LAPTOP. `CanvasReelPlayer` caps itself
 * at `max-w-[360px] mx-auto`, and `PosterCard` is a full-width block around it,
 * so a poster in a wide column is over a thousand pixels wide with a 360 px
 * reel floating in the middle of it. That is not a claim this board makes; it
 * is what the stage draws and what the caption reads back.
 */

export const meta = (styleId: string) =>
  formatReelMeta({
    durationLabel: formatReelDuration(REEL.seconds),
    styleLabel: resolveStyleEntry(styleId).label,
    momentCount: TIMELINE.length,
  });

/* ── the host's event hub ───────────────────────────────────────────────── */

/** What the hub's Reel card shows: the `door` decision's option ids. */
export type DoorShape = "card" | "face";
export const doorOf = (v: string | undefined): DoorShape =>
  v === "face" ? "face" : "card";

/**
 * THE HUB'S CARDS ROW, quoted class for class rather than imported.
 *
 * ★ WHY THE DOOR MOVED AT ALL (the overtaken audit, 2026-09-21). Round one
 * asked about an 11 px link in a status row beside a poster card. `event=hub`
 * (Will, 2026-09-20: "I love this view. The additional controls feel much more
 * beautiful, actionable, and intuitive to hosts than the album-heavy page")
 * deleted that row: the Reel SECTION became a Reel CARD and a room behind it,
 * and the poster now lives inside the room. So the three options are gone with
 * the surface they sat on, and the question is what the card shows.
 *
 * ★ THE ROW IS COPIED, NOT MOUNTED. `EventCardsRow` is a client component that
 * calls `useEventShare` (a provider this board has no business standing up),
 * observes its own stickiness and renders a `next/link` per card. This decision
 * is about the row AT REST, so the geometry, the ladder step and the three
 * neighbouring cards are taken verbatim from event-cards-row.tsx (`h-24 w-36
 * sm:w-40`, `font-heading text-card-title`, the `text-xs` value line) and
 * nothing here navigates.
 */
const CARD_SHELL =
  "flex h-24 w-36 shrink-0 flex-col justify-between gap-1 rounded-xl border p-3 sm:w-40";

function RoomCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
}) {
  return (
    <div data-rs-card-room className={cn(CARD_SHELL, "border-border")}>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="font-heading text-card-title font-medium">{label}</span>
      <span className="truncate text-xs text-muted-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

/** The one card this decision is about, in whichever shape is being judged. */
function ReelCard({
  door,
  still,
}: {
  door: DoorShape;
  still: string | null;
}) {
  const clips = `${TIMELINE.length} clips`;
  if (door === "card") {
    return (
      <div data-rs-door className={cn(CARD_SHELL, "border-border")}>
        <Clapperboard
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="font-heading text-card-title font-medium">Reel</span>
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {clips}
        </span>
      </div>
    );
  }
  return (
    <div
      data-rs-door
      className={cn(
        CARD_SHELL,
        "relative justify-between overflow-hidden border-transparent p-0",
      )}
    >
      <div data-rs-face className="absolute inset-0 bg-[oklch(0.16_0_0)]">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
          <img src={still} alt="The reel" className="size-full object-cover" />
        ) : null}
        {/* The wash is what keeps the corner chip and the count legible over a
            frame nobody chose: the picture is the host's own cut, so it can be
            any grade at all. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/40"
        />
      </div>
      <span className="relative m-2 flex items-center gap-1 self-start rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        <Clapperboard
          className="size-2.5 text-[oklch(0.8_0.14_300)]"
          aria-hidden
        />
        Edit reel
      </span>
      <span className="relative mx-3 mb-3 truncate text-xs font-medium text-white tabular-nums">
        {clips}
      </span>
    </div>
  );
}

/**
 * The event hub the door lives on: the live code at the left of the title, the
 * row of cards into the rooms, and the album beneath them.
 *
 * ★ THE CODE IS HELD, NOT DRAWN. `EventCodeDoor` mounts `StyledQr`, which
 * dynamically imports `qr-code-styling` and builds an SVG in an effect; inside
 * a lab frame that lands after the capture and this decision is not about it.
 * Its 112 px square is held exactly, so the header's geometry, which is what
 * the cards row sits under, is true.
 */
export function EventPage({
  door = "card",
  still = null,
  children,
}: {
  door?: DoorShape;
  still?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <Logo />
        <span className="size-7 rounded-full bg-muted" />
      </header>
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-7xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex size-28 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
              <QrCode className="size-16 text-foreground/85" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-page text-balance">
                {EVENT.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatEventDate(EVENT.date)} · {EVENT.photos} photos from{" "}
                {EVENT.guests} guests
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-faint">
                partyreel.com/e/{EVENT.token}
                <Copy className="size-3" aria-hidden />
              </p>
            </div>
          </div>
          <div
            role="group"
            aria-label="This event"
            className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <RoomCard
              label="Review"
              value="All caught up"
              Icon={ListChecks}
            />
            <ReelCard door={door} still={still} />
            <RoomCard
              label="Guests"
              value={`${EVENT.guests} guests`}
              Icon={Users}
            />
            <RoomCard label="Settings" value="Public" Icon={Settings} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── sharing, and taking it back ─────────────────────────────────────────── */

/** The way back, held for a few seconds after the reel stops being shared. */
export function UndoToast() {
  return (
    <div
      data-rs-toast
      data-rs-wayback
      role="status"
      className="absolute inset-x-4 bottom-4 z-30 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-lg bg-white/95 px-3 py-2 shadow-layer"
    >
      <p data-rs-said className="text-[12px] font-medium text-zinc-900">
        Your reel is private again
      </p>
      <span className="flex items-center gap-1 text-[12px] font-semibold text-zinc-900 underline underline-offset-2">
        <Undo2 className="size-3.5" aria-hidden />
        Undo
      </span>
    </div>
  );
}

/** The panel under the Shared chip, naming who loses the reel. */
export function StopSharingPanel() {
  return (
    <div
      data-rs-wayback
      role="dialog"
      aria-label="Stop sharing"
      className="absolute top-12 right-3 z-30 w-64 rounded-[var(--radius-float)] border border-white/10 bg-[oklch(0.17_0_0)] p-3 shadow-layer"
    >
      <p data-rs-said className="text-[12px] leading-snug text-white/85">
        {EVENT.guests} guests can watch this reel right now.
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <span className="flex h-8 flex-1 items-center justify-center rounded-[var(--radius-action-sm)] bg-white text-[11px] font-medium text-zinc-900">
          Keep sharing
        </span>
        <span className="flex h-8 flex-1 items-center justify-center rounded-[var(--radius-action-sm)] border border-white/25 text-[11px] font-medium text-white/85">
          Stop sharing
        </span>
      </div>
    </div>
  );
}

/* ── the wait ────────────────────────────────────────────────────────────── */

/**
 * The export dialog, replicated rather than mounted: a real radix `Dialog`
 * portals to `document.body`, which inside a lab frame is the BOARD's body, so
 * the surface would leave the picture entirely (guest-upload's lesson). The
 * material, the corner, the spinner and the words are the shipped ones.
 */
export function StitchingDialog({ progress }: { progress: number }) {
  return (
    <>
      <div data-rs-scrim className="absolute inset-0 z-40 bg-black/50" />
      <div
        data-rs-wait
        role="dialog"
        aria-label="Creating your video"
        className="absolute top-1/2 left-1/2 z-50 w-[min(24rem,90%)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-float)] border border-border bg-popover p-6 text-popover-foreground shadow-layer"
      >
        <p className="font-heading text-subsection">Creating your video</p>
        <p data-rs-said className="mt-1 text-sm text-muted-foreground">
          Your reel is encoding right here in your browser. This usually takes a
          few seconds.
        </p>
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="relative flex size-16 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-reel/20 border-t-reel"
            />
            <Clapperboard className="size-7 text-reel" />
          </span>
          <div className="flex w-full items-center gap-2">
            <span className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-reel"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** The bar on the reel itself: the thing being made, saying so. */
export function FrameProgress({ progress }: { progress: number }) {
  return (
    <div
      data-rs-wait
      className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 rounded-b-xl bg-black/55 px-2.5 py-2 backdrop-blur-sm"
    >
      <span className="h-1 w-full overflow-hidden rounded-full bg-white/20">
        <span
          className="block h-full rounded-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </span>
      <span
        data-rs-said
        className="shrink-0 text-[11px] font-medium text-white tabular-nums"
      >
        {progress}%
      </span>
      <span className="shrink-0 text-[11px] text-white/60">Cancel</span>
    </div>
  );
}

/**
 * THE HOUSE IDIOM, ON THE REEL'S OWN FRAME (the overtaken audit, 2026-09-21:
 * `app-pricing` r1 ruled the celebration modal for a moment worth FEELING, and
 * `guest-upload` r1 ruled a stacked tile counting down as what a run in
 * progress looks like).
 *
 * Quoted from `UploadStackTile` rather than invented: two ghost edges behind the
 * object being made (bible 10's lift, which is really one thing sitting on
 * several), everything the tile SAYS in one strip at its foot, and that strip on
 * the ONE material at the marks' blur with the tint re-pointed to 0.34, which is
 * the measured number that puts white at 4.78:1 over the brightest frame a reel
 * could draw. What changes is what is being counted: not files still to send,
 * but moments still to draw.
 */
const READING_PANE = { "--glass-tint": "0.34" } as CSSProperties;

export function StackProgress({
  remaining,
  progress,
}: {
  /** Moments of the cut still to be drawn, this one included. */
  remaining: number;
  progress: number;
}) {
  return (
    <>
      {/* The edge is two boxes, not a shadow: they sit BEHIND the frame inside
          its own isolate, so only the offset stubs show. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1.5 -right-1.5 -z-10 size-full rounded-xl bg-white/12"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[3px] -right-[3px] -z-10 size-full rounded-xl bg-white/20"
      />
      <div
        data-rs-wait
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-b-xl px-2.5 py-2",
        )}
      >
        <span
          data-rs-said
          className={cn(
            GLASS_MARK_LIT,
            "shrink-0 text-[11px] font-medium text-white tabular-nums",
          )}
        >
          {remaining} to go
        </span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <span
            className="block h-full rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </span>
        <span className="shrink-0 text-[11px] text-white/70">Cancel</span>
      </div>
    </>
  );
}

/** The quiet line: the encode is behind you, and it will say when it lands. */
export function QuietLine() {
  return (
    <p
      data-rs-wait
      data-rs-said
      className="mt-2 text-center text-[11px] text-white/55"
    >
      Making your video in the background. Keep working, we will tell you when
      it is ready.
    </p>
  );
}

/** The failure the dialog is also responsible for, kept for the record. */
export function WaitError() {
  return (
    <span className="flex items-center gap-1 text-[11px] text-destructive">
      <TriangleAlert className="size-3" aria-hidden />
      <RotateCcw className="size-3" aria-hidden />
    </span>
  );
}

/* ── the guest's album ───────────────────────────────────────────────────── */

/** How a guest meets the reel: the `guests` decision's option ids. */
export type GuestShape = "overlay" | "playing" | "inline";
export const guestOf = (v: string | undefined): GuestShape =>
  v === "playing" || v === "inline" ? v : "overlay";

export const momentOf = (v: string | undefined): "rest" | "tap" =>
  v === "tap" ? "tap" : "rest";

/** The guest's two verbs, quoted from the overlay's take-away row. */
function TakeAway({ dark = true }: { dark?: boolean }) {
  return (
    <div data-rs-verbs className="mt-2 flex items-center gap-2">
      <span
        className={cn(
          "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action)] text-sm font-medium",
          dark ? "bg-white/12 text-white" : "border border-border",
        )}
      >
        <Share2 className="size-4" aria-hidden />
        Share
      </span>
      <span
        className={cn(
          "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action)] text-sm font-medium",
          dark ? "bg-white text-zinc-900" : "bg-foreground text-background",
        )}
      >
        <Download className="size-4" aria-hidden />
        Download
      </span>
    </div>
  );
}

/** The shipped card: the 4:5 cover still under the play badge. */
function CoverCard({ styleId }: { styleId: string }) {
  const cover = POOL[3];
  return (
    <div data-rs-card>
      <PosterCard
        eventName={EVENT.name}
        meta={meta(styleId)}
        chip={<PosterCardChip />}
        playBadge
        media={
          // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
          <img
            src={cover.url}
            alt=""
            className="aspect-[4/5] w-full object-cover"
          />
        }
      />
    </div>
  );
}

/**
 * The card as the reel itself, 9:16, already moving.
 *
 * ★ CAPPED AT 360, LIKE THE PLAYER ITSELF. `CanvasReelPlayer` is
 * `mx-auto w-full max-w-[360px]`, so a 9:16 reel in the album's 672 px column
 * would be 1195 px tall if the card spread to the column. The card hugs the
 * reel instead, which is what a new surface should do and what the host's
 * poster does not (the `door` decision's third option is the same fix).
 */
function LiveCard({
  still,
  styleId,
  badge,
}: {
  still: string | null;
  styleId: string;
  /** The tap still opens the cinema, so it still says so. */
  badge?: boolean;
}) {
  return (
    <div data-rs-card className="mx-auto w-full max-w-[360px]">
      <PosterCard
        eventName={EVENT.name}
        meta={meta(styleId)}
        chip={<PosterCardChip />}
        playBadge={badge}
        media={
          <ReelStill src={still} className="rounded-none" label="The reel" />
        }
      />
    </div>
  );
}

export function GuestReelBlock({
  shape,
  still,
  styleId,
}: {
  shape: GuestShape;
  still: string | null;
  styleId: string;
}) {
  return (
    <div data-rs-guestreel>
      {shape === "overlay" ? (
        <CoverCard styleId={styleId} />
      ) : (
        <LiveCard still={still} styleId={styleId} badge={shape === "playing"} />
      )}
      {shape === "inline" ? (
        <div className="mx-auto w-full max-w-[360px]">
          <TakeAway dark={false} />
        </div>
      ) : null}
    </div>
  );
}

/** The full bleed cinema, quoted from guest-reel-overlay.tsx's settled act. */
export function Cinema({ still }: { still: string | null }) {
  return (
    <div
      data-rs-cinema
      className="absolute inset-0 z-40 overflow-hidden bg-[oklch(0.09_0_0)]"
    >
      <div className="absolute inset-x-0 top-1/2 z-30 mx-auto w-full max-w-[min(360px,47dvh)] -translate-y-1/2 px-2">
        <ReelStill src={still} label="The reel, full bleed" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5 pb-5">
        <TakeAway />
        <p className="mt-2 text-center text-[11px] text-white/45">
          Download uses the host&rsquo;s video when it is ready
        </p>
      </div>
      <span className="absolute top-3 right-3 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm">
        <span className="text-sm leading-none">&times;</span>
      </span>
    </div>
  );
}

/** The guest album around the reel, at whatever width the frame is. */
export function GuestAlbum({
  reel,
  overlay,
}: {
  reel: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <Button variant="ghost" size="sm">
          Start for free
        </Button>
      </header>
      <div className="flex-1 py-8">
        <div className="mx-auto w-full max-w-2xl px-5">
          <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-faint">Hosted by</span>
            <span className="font-medium text-foreground">{EVENT.host}</span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {EVENT.photos} photos &amp; videos from {EVENT.guests} guests
          </p>
          <div className="mt-4">
            <Button type="button" size="lg" className="w-full">
              <ImageUp /> Add photos
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-9 w-full">
                <QrCode /> Invite
              </Button>
              <Button type="button" variant="outline" className="h-9 w-full">
                <Play /> Save
              </Button>
            </div>
          </div>
          {/* The ruled placement: under the action block while uploads are
              open (guest-flow.md). This board never moves it. */}
          <div className="mt-6">{reel}</div>
        </div>
        <div className="mt-7 px-5">
          <div className={GALLERY_COLUMNS}>
            {POOL.filter((m) => m.status === "approved")
              .slice(0, 16)
              .map((item) => (
                <div
                  key={item.id}
                  data-media-tile
                  data-lit=""
                  style={{
                    aspectRatio:
                      item.width && item.height
                        ? `${item.width} / ${item.height}`
                        : "1 / 1",
                    borderRadius: "var(--radius-tile)",
                  }}
                  className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
                >
                  <MediaTile item={item} playBadge="none" />
                </div>
              ))}
          </div>
        </div>
      </div>
      {overlay}
    </div>
  );
}
