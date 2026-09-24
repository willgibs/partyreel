"use client";

import { type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clapperboard,
  Download,
  EyeOff,
  Film,
  Heart,
  Hourglass,
  Pause,
  Play,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  X,
} from "lucide-react";

import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

import {
  CUT,
  EVENT,
  FILL_LABEL,
  FILLS,
  GUEST_POOL,
  POOL,
  STYLES,
} from "./fixtures";
import type { AlbumItem, FillId } from "./fixtures";
import { RoomChip, type ScreenId } from "./room";
import { CutStill } from "./stills";

/**
 * EVERY PIECE THE NINE DECISIONS MOVE, AND NOTHING ELSE.
 *
 * ★ NOTHING HERE MOUNTS A RADIX PORTAL (Dialog, Sheet, Popover, Tooltip,
 * DropdownMenu). A portal opened inside a portalled lab frame renders on the
 * LAB PAGE's document, not inside the phone being judged (`guest-capture` and
 * `host-curation` both name the same landmine). So the export modal and the
 * blocked tile's tooltip are QUOTED markup: the real classes and the real
 * copy, none of the real primitives.
 *
 * ★ NOTHING HERE PLAYS, PRESIGNS OR ENCODES. Every cut frame is a still the
 * engine drew once (stills.tsx); every count under a frame is read off the
 * document by the board, never written here.
 *
 * ★ THE WORDS ARE PLACEHOLDERS EXCEPT WHERE THEY ARE RULED. "Make your own",
 * "Add to the album" and the cut itself are the concept's own names (rulings,
 * 2026-09-22); the three fills, the export verb and the mark's line are this
 * board's, and a copy round may take all three.
 */

/* ── the reel's own view, which is where a cut begins ─────────────────────── */

/** A round control in the view's weighted dock: the ruled shape (reel-view
 *  round one), reused here as ground. */
function ViewControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span
      data-rc-view-control
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/85 backdrop-blur-sm"
    >
      {children}
    </span>
  );
}

/** What stands where "Make your own" would: the whole of `noencode`. */
export type MakeSlot = "line" | "greyed" | "none";

/**
 * THE VIEW: the live reel full bleed, its chrome DECIDED now (reel-view round
 * one, carried here as ground): a top-left arrival chip, no event name on
 * screen, a weighted dock (a slim utility row, "Add yours" an icon, "Make
 * your own" the one primary beneath it) and the event's code as a plate
 * bottom right. `entry` asks what happens when "Make your own" is tapped and
 * `noencode` asks what stands in the primary's place when it cannot be;
 * neither asks anything else about this row, which is `reel-view`'s round.
 */
export function ReelView({
  still,
  make,
  screen,
  over,
}: {
  still: string | null;
  make: MakeSlot;
  screen: ScreenId;
  /** Anything drawn over the view (the entry's rising sheet). */
  over?: ReactNode;
}) {
  const phone = screen === "375";
  return (
    <div
      data-rc-view
      className="relative flex h-dvh flex-col overflow-hidden bg-black"
    >
      <div className="absolute inset-0">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
          <img
            src={still}
            alt="The event's live reel"
            className="size-full object-cover opacity-90"
          />
        ) : null}
        {/* The chrome sits on a scrim rather than on the picture: a reel of
            a balloon wall is the brightest thing an album holds, and white on
            it at 60 percent is unreadable (measured on this very still). */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/55 to-transparent"
        />
      </div>

      {/* No event name on screen (ruled): the arrival chip takes the
          top-left corner instead, a live-feel beat rather than a label. */}
      <div className="relative flex items-start justify-between p-3">
        <span className="rounded-full bg-black/40 px-3 py-1.5 text-caption text-white/85 backdrop-blur-sm">
          Ruby just added a photo
        </span>
        <ViewControl label="Close">
          <X className="size-4" aria-hidden />
        </ViewControl>
      </div>

      <div className="relative mt-auto flex flex-col items-center gap-3 px-4 pb-6">
        <div
          className={cn(
            "flex items-center gap-2",
            phone ? "justify-center" : "justify-center gap-3",
          )}
        >
          <ViewControl label="Pause">
            <Pause className="size-4" aria-hidden />
          </ViewControl>
          <ViewControl label="Include videos">
            <Film className="size-4" aria-hidden />
          </ViewControl>
          <ViewControl label="Style">
            <Sparkles className="size-4" aria-hidden />
          </ViewControl>
          <ViewControl label="Hold">
            <Hourglass className="size-4" aria-hidden />
          </ViewControl>
          <ViewControl label="Show the code">
            <QrCode className="size-4" aria-hidden />
          </ViewControl>
          <ViewControl label="Add yours">
            <Plus className="size-4" aria-hidden />
          </ViewControl>
        </div>
        {/* "Make your own" the one primary beneath the row (ruled): removing
            it for `noencode` empties this slot rather than disabling one icon
            among many. */}
        {make === "greyed" ? (
          <span
            data-rc-make-own="greyed"
            aria-disabled
            className="flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-working font-medium text-white/35"
          >
            <Clapperboard className="size-4" aria-hidden />
            Make your own
          </span>
        ) : null}
        {make === "line" || make === "greyed" ? (
          <p
            data-rc-noencode-line
            className="max-w-[46ch] text-center text-caption text-white/75"
          >
            Making your own clip needs a newer browser. The reel plays here
            either way.
          </p>
        ) : null}
      </div>

      {/* The event's code, a white plate bottom right (ruled): "Scan to add
          yours" is the whole of it, so it never fights the centred dock for
          width at 375. */}
      <span
        aria-label="Scan to add yours, at partyreel.com"
        className="absolute right-3 bottom-3 z-10 flex size-9 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lift"
      >
        <QrCode className="size-4" aria-hidden />
      </span>

      {over}
    </div>
  );
}

/* ── the entry's third shape: the album's own page, the creator beneath ───── */

/** The album page a guest came from, with the reel's living tile at its head:
 *  headed "Highlight reel" and described "Make your own clip to share"
 *  (ruled, reel-front round one) rather than the plain caption this replaced. */
export function AlbumPage({
  still,
  children,
}: {
  still: string | null;
  children?: ReactNode;
}) {
  return (
    <div data-rc-album className="min-h-full bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <span className="font-heading text-card-title">{EVENT.name}</span>
        <span className="text-caption text-muted-foreground">
          {EVENT.items} items
        </span>
      </header>
      <div className="px-4 pt-4">
        <div
          data-rc-album-reel
          className="relative overflow-hidden rounded-float bg-black"
        >
          <div className="flex h-36 items-center justify-center overflow-hidden">
            {still ? (
              // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
              <img
                src={still}
                alt="The event's live reel"
                className="w-full object-cover opacity-90"
              />
            ) : null}
          </div>
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"
          />
          <span className="absolute inset-x-3 bottom-2 flex flex-col gap-0.5">
            <span className="font-heading text-working text-white">
              Highlight reel
            </span>
            <span className="text-caption text-white/70">
              Make your own clip to share
            </span>
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * THE TILE'S OWN DESCRIPTION, ECHOED for `noencode`'s second surface: what
 * "Make your own clip to share" becomes on a device that cannot cut, in the
 * same three shapes the view's primary slot wears (`MakeSlot`), never a
 * fourth vocabulary for the same question.
 */
export function TileDescriptionEcho({ make }: { make: MakeSlot }) {
  return (
    <div
      data-rc-tile-echo
      className="mx-auto w-full max-w-[320px] rounded-float border border-border bg-background p-4 text-foreground"
    >
      <p className="font-heading text-card-title">Highlight reel</p>
      {make === "none" ? null : (
        <p
          data-rc-tile-echo-line
          className={cn(
            "mt-1 text-working",
            make === "greyed" ? "text-muted-foreground/60" : "text-muted-foreground",
          )}
        >
          Clips need a newer browser here.
        </p>
      )}
    </div>
  );
}

/* ── the looks: fourteen frames of HER cut, in three postures ─────────────── */

function LookTile({
  src,
  label,
  active,
  big,
}: {
  src: string | null;
  label: string;
  active?: boolean;
  big?: boolean;
}) {
  return (
    <span
      data-rc-look
      className={cn(
        "flex shrink-0 flex-col gap-1",
        big ? "w-[104px]" : "w-full",
      )}
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-lg bg-white/5",
          active && "ring-2 ring-white",
        )}
      >
        <CutStill src={src} label={label} className="rounded-lg" />
        {active ? (
          <span
            aria-hidden
            className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white text-zinc-900"
          >
            <Check className="size-2.5" />
          </span>
        ) : null}
      </span>
      <span className="truncate text-micro text-white/65">{label}</span>
    </span>
  );
}

export type LooksShape = "wall" | "rail" | "three";

/** Three to start: one per family, then the rest behind More. */
const THREE = ["classic", "mono", "polaroid"];

export function Looks({
  shape,
  byStyle,
  picked = CUT.styleId,
}: {
  shape: LooksShape;
  byStyle: ReadonlyMap<string, string>;
  picked?: string;
}) {
  if (shape === "rail") {
    return (
      <div data-rc-looks="rail" className="flex gap-2 overflow-x-auto pb-1">
        {STYLES.map((s) => (
          <LookTile
            key={s.id}
            big
            src={byStyle.get(s.id) ?? null}
            label={s.label}
            active={s.id === picked}
          />
        ))}
      </div>
    );
  }
  if (shape === "three") {
    return (
      <div data-rc-looks="three" className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          {THREE.map((id) => {
            const s = STYLES.find((x) => x.id === id);
            if (!s) return null;
            return (
              <LookTile
                key={s.id}
                src={byStyle.get(s.id) ?? null}
                label={s.label}
                active={s.id === picked}
              />
            );
          })}
        </div>
        <span className="flex items-center justify-center gap-1 rounded-[var(--radius-action-sm)] border border-white/20 py-2 text-caption font-medium text-white/80">
          More looks
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </div>
    );
  }
  return (
    <div data-rc-looks="wall" className="grid grid-cols-4 gap-2">
      {STYLES.map((s) => (
        <LookTile
          key={s.id}
          src={byStyle.get(s.id) ?? null}
          label={s.label}
          active={s.id === picked}
        />
      ))}
    </div>
  );
}

/* ── the moments: the three fills, and the pool under them ───────────────── */

export function Fills({ fill }: { fill: FillId }) {
  return (
    <div data-rc-fills className="mb-2 flex items-center gap-1.5">
      {FILLS.map((f) => (
        <RoomChip key={f} active={f === fill}>
          {FILL_LABEL[f]}
        </RoomChip>
      ))}
    </div>
  );
}

export type BlockedShape = "caption" | "toast" | "tooltip";

/**
 * THE POOL, in the room's own dark grid (deliberately bespoke rather than
 * `SelectableMediaGrid`, which hard-codes the app's light palette and this
 * room is oklch(0.11): the shipped picker says the same thing about itself).
 *
 * `blocked` only ever renders for the HOST, because a hidden photograph is not
 * in a guest's pool at all. The badge is a POSITION rather than a check: in a
 * cut, "in" matters less than "where", and the number is the bridge between
 * this grid and the dock.
 */
export function PoolGrid({
  items,
  selected,
  blocked = "tooltip",
  columns = 3,
  limit,
  hovered,
}: {
  items: readonly AlbumItem[];
  selected: readonly string[];
  blocked?: BlockedShape;
  columns?: number;
  limit?: number;
  /** The tile the pointer is resting on, for the quoted tooltip. */
  hovered?: string;
}) {
  const position = new Map(selected.map((id, i) => [id, i + 1]));
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div
      data-rc-pool
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {shown.map((m) => {
        const hidden = m.status === "hidden";
        const at = position.get(m.id);
        return (
          // ★ THE TOOLTIP LIVES OUTSIDE THE CROP. The tile has to clip its own
          // photograph (object-cover at 4:5) and a tooltip standing above the
          // tile is clipped by exactly that rule: the first capture of
          // `blocked=tooltip` showed a dimmed tile and no tooltip at all, which
          // would have read as the option drawing nothing. So the clip is an
          // inner box and the tooltip is its sibling.
          <span
            key={m.id}
            data-rc-tile={hidden ? "blocked" : at ? "in" : "out"}
            className="relative block"
            style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
          >
            <span className="absolute inset-0 block overflow-hidden rounded-[var(--radius-tile)] bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
              <img
                src={m.previewUrl ?? m.url}
                alt=""
                className={cn(
                  "size-full object-cover",
                  hidden ? "opacity-30" : at ? "opacity-100" : "opacity-70",
                )}
              />
              {at ? (
                <span className="absolute top-1 left-1 flex size-5 items-center justify-center rounded-full bg-white text-micro font-semibold text-zinc-900 tabular-nums">
                  {at}
                </span>
              ) : null}
              {m.type === "video" ? (
                <span
                  aria-hidden
                  className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-black/55"
                >
                  <Play className="size-2 fill-white text-white" />
                </span>
              ) : null}
              {m.likeCount ? (
                <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-micro text-white/80">
                  <Heart className="size-2.5" aria-hidden />
                  {m.likeCount}
                </span>
              ) : null}
              {hidden ? (
                <span
                  aria-hidden
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white/80"
                >
                  <EyeOff className="size-2.5" />
                </span>
              ) : null}
              {hidden && blocked === "caption" ? (
                <span
                  data-rc-blocked="caption"
                  className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 px-1.5 py-1 text-micro text-white/85"
                >
                  Hidden
                  <span className="font-medium text-white underline">Show</span>
                </span>
              ) : null}
            </span>
            {hidden && blocked === "tooltip" && hovered === m.id ? (
              <span
                data-rc-blocked="tooltip"
                role="tooltip"
                className="absolute -top-1 left-1/2 z-10 w-max max-w-[22ch] -translate-x-1/2 -translate-y-full rounded-md bg-popover px-2 py-1 text-micro text-popover-foreground shadow-layer"
              >
                Hidden moments cannot go in a clip. Show it first.
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

/** The line a tap gets, quoted as the house toast rather than mounted. */
export function BlockedLine() {
  return (
    <div
      data-rc-blocked="toast"
      className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 rounded-float bg-popover px-3 py-2.5 text-caption text-popover-foreground shadow-layer"
    >
      <span>That moment is hidden, so a clip cannot take it.</span>
      <span className="shrink-0 font-medium underline">Show</span>
    </div>
  );
}

/* ── the export's minute ──────────────────────────────────────────────────── */

/** What a backgrounded tab and a lost context do, said on every option. */
export function WaitNote({ children }: { children: ReactNode }) {
  return (
    <p
      data-rc-wait-note
      className="mx-auto mt-2 max-w-[42ch] text-center text-micro text-white/45"
    >
      {children}
    </p>
  );
}

export const WAIT_NOTE =
  "Leave the tab and the draw pauses, then picks up where it stopped. Lose the context and you land back here, your picks intact, with one Retry.";

/** The bar across the cut's foot: the preview keeps running behind it. */
export function FrameProgress({ progress }: { progress: number }) {
  return (
    <div
      data-rc-progress="bar"
      className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-3"
    >
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
        <span
          className="block h-full rounded-full bg-reel"
          style={{ width: `${progress}%` }}
        />
      </span>
      <span className="text-micro text-white/80 tabular-nums">{progress}%</span>
      <span className="flex size-6 items-center justify-center rounded-full border border-white/25 text-white/80">
        <X className="size-3" aria-hidden />
      </span>
    </div>
  );
}

/**
 * THE HOUSE IDIOM IN PLACE: the cut's own frame stacks and counts the moments
 * still to draw. It stops playing, because the device is busy drawing them.
 */
export function StackingFrame({
  src,
  left,
  total,
}: {
  src: string | null;
  left: number;
  total: number;
}) {
  return (
    <div data-rc-progress="stack" className="relative">
      <span
        aria-hidden
        className="absolute inset-x-3 -top-2 h-6 rounded-t-xl bg-white/10"
      />
      <span
        aria-hidden
        className="absolute inset-x-1.5 -top-1 h-6 rounded-t-xl bg-white/15"
      />
      <CutStill src={src} label="The cut, being drawn" className="opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-card-title text-white">
          {`${left} of ${total} moments left`}
        </p>
        <p className="max-w-[26ch] text-caption text-white/60">
          Drawing your clip on this device. Keep this tab open.
        </p>
        <span className="mt-1 flex h-8 items-center rounded-full border border-white/25 px-3 text-caption font-medium text-white/85">
          Cancel
        </span>
      </div>
    </div>
  );
}

/** The shipped stitching dialog, quoted (no Radix portal inside a frame). */
export function QuotedExportModal({ progress }: { progress: number }) {
  return (
    <div
      data-rc-progress="modal"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-6"
    >
      <div className="w-full max-w-sm rounded-float bg-popover p-6 text-popover-foreground shadow-layer">
        <p className="font-heading text-card-title">Creating your video</p>
        <p className="mt-1 text-working text-muted-foreground">
          Your clip is encoding right here in your browser. This usually takes
          a few seconds.
        </p>
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="relative flex size-16 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-reel/20 border-t-reel"
            />
            <Clapperboard className="size-7 text-reel" aria-hidden />
          </span>
          <div className="flex w-full items-center gap-2">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full bg-reel"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right text-caption text-muted-foreground tabular-nums">
              {`${progress}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── the finish ──────────────────────────────────────────────────────────── */

export type FinishShape = "four" | "share" | "save";

function Door({
  icon,
  label,
  loud,
  quiet,
  wide,
}: {
  icon: ReactNode;
  label: string;
  loud?: boolean;
  quiet?: boolean;
  wide?: boolean;
}) {
  return (
    <span
      data-rc-door={loud ? "loud" : quiet ? "quiet" : "equal"}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[var(--radius-action-sm)] font-medium whitespace-nowrap",
        wide ? "h-11 w-full" : "h-11",
        // A quiet door drops a step and loses its icon, so three of them, one
        // the five-word "Add to the album", sit on ONE line at 375 instead of
        // wrapping to two. Measured on the capture, not guessed: with icons and
        // px-3 the row wanted 374 px of the 343 a phone has.
        quiet ? "px-1 text-caption" : "px-3 text-working",
        loud
          ? "bg-reel text-white"
          : quiet
            ? "text-white/70 underline"
            : "border border-white/20 text-white/85",
      )}
    >
      {quiet ? null : icon}
      {label}
    </span>
  );
}

/**
 * THE FINISH: the file exists on her device and nothing has been uploaded.
 * Share is its OWN tap here and never chained off the encode, because iOS
 * spends the activation during the render and `share()` then throws; the
 * button is probed with the real file, so where it cannot carry one this row
 * is drawn without it and Save takes the lead.
 */
export function Finish({
  shape,
  paid,
  children,
}: {
  shape: FinishShape;
  /** A free event has no "Add to the album": a clean mark is not a licence. */
  paid: boolean;
  /** The cut's own frame, above the doors. */
  children: ReactNode;
}) {
  const save = <Download className="size-4" aria-hidden />;
  const share = <Share2 className="size-4" aria-hidden />;
  const add = <Plus className="size-4" aria-hidden />;
  const again = <Clapperboard className="size-4" aria-hidden />;
  return (
    <div
      data-rc-finish={shape}
      className="flex h-dvh flex-col bg-[oklch(0.11_0_0)] px-4 pt-5 pb-6"
    >
      <div className="flex items-center gap-2 pb-3">
        <span className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white/75">
          <ArrowLeft className="size-4" aria-hidden />
        </span>
        <p className="text-micro font-medium tracking-[0.24em] text-white/50 uppercase">
          Your clip is ready
        </p>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex aspect-[9/16] h-full max-w-full items-center">
          {children}
        </div>
      </div>
      <div data-rc-doors className="pt-4">
        {shape === "four" ? (
          <div className="grid grid-cols-2 gap-2">
            <Door icon={save} label="Save to Photos" />
            <Door icon={share} label="Share" />
            {paid ? <Door icon={add} label="Add to the album" /> : null}
            <Door icon={again} label="Make another" />
          </div>
        ) : null}
        {shape === "share" ? (
          <div className="flex flex-col gap-2">
            <Door icon={share} label="Share" loud wide />
            <div className="flex items-center justify-center gap-4 pt-1">
              <Door icon={save} label="Save to Photos" quiet />
              {paid ? <Door icon={add} label="Add to the album" quiet /> : null}
              <Door icon={again} label="Make another" quiet />
            </div>
          </div>
        ) : null}
        {shape === "save" ? (
          <div className="flex flex-col gap-2">
            <Door icon={save} label="Save to Photos" loud wide />
            <div className="grid grid-cols-2 gap-2">
              <Door icon={share} label="Share" />
              {paid ? <Door icon={add} label="Add to the album" /> : null}
            </div>
            <div className="flex justify-center pt-1">
              <Door icon={again} label="Make another" quiet />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── the free mark ───────────────────────────────────────────────────────── */

export type MarkShape = "line" | "bare" | "chip";

/** The line under the cut that names what removes the mark. */
export function MarkLine() {
  return (
    <p
      data-rc-mark="line"
      className="mx-auto mt-2 max-w-[38ch] text-center text-micro text-white/50"
    >
      Free clips carry the small mark and run to 30 seconds. Pro removes both.
    </p>
  );
}

/** The chip beside the cut that says which plan this is. */
export function MarkChip() {
  return (
    <span
      data-rc-mark="chip"
      className="absolute top-2 left-2 z-20 flex h-7 items-center gap-1 rounded-full bg-black/55 px-2.5 text-micro font-medium text-white/85 backdrop-blur-sm"
    >
      Free
      <ChevronRight className="size-3" aria-hidden />
    </span>
  );
}

/* ── the small furniture the board reuses ────────────────────────────────── */

/** The cut's settings, as the room's chips read them: what is not being asked. */
export function SettingsRow({ moments }: { moments: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-micro text-white/45">
      <span>{`${moments} moments`}</span>
      <span aria-hidden>·</span>
      <span>Portrait</span>
      <span aria-hidden>·</span>
      <span>0:30</span>
    </div>
  );
}

/** The host's pool: the same, plus what she hid, which is the blocked tile. */
export function hostPool(): readonly AlbumItem[] {
  return POOL;
}

/** The first hidden tile in the host's pool: what `blocked` is drawn on. */
export const FIRST_HIDDEN =
  POOL.find((m) => m.status === "hidden")?.id ?? POOL[0].id;

/** The album's own count against the creator's, so the gap can be captioned. */
export const CUTS_IN_ALBUM = EVENT.items - POOL.length;

/** What Maya hid: in the host's pool, blocked; absent from a guest's entirely. */
export const HIDDEN_COUNT = POOL.length - GUEST_POOL.length;
