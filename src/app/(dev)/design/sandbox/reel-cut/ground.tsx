"use client";

import { type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clapperboard,
  Download,
  FileDown,
  Film,
  Hourglass,
  Images,
  Pause,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";
import { ClipStill } from "./stills";

/**
 * WHAT ROUND ONE SETTLED, DRAWN AS HE AMENDED IT, NEVER ASKED AGAIN. The
 * `stage` knob walks each direction through the rest of the creator so the
 * clip lane builds from a picture, not a paragraph: the export's minute
 * (`wait=stack`), the finish (`finish=save`, then his swap: Share leads, Save
 * opens the platform's options, Add to event waits behind a confirm, and
 * nothing leaves the finish), and a device with no encoder (`noencode=greyed`,
 * the reason on a tap rather than over the reel). `sound=silent` is drawn by
 * absence: no speaker, no track, anywhere.
 *
 * ★ QUOTED, NEVER MOUNTED: the menu is the shipped DropdownMenu's material
 * and the confirm is DialogContent's, as markup, because a Radix portal inside
 * a portalled frame renders on the lab page instead of the phone.
 */

/* ── the export's minute: the clip's own frame stacks and counts ─────────── */

export function StackingClip({
  src,
  left,
  total,
  compact,
}: {
  src: string | null;
  left: number;
  total: number;
  compact?: boolean;
}) {
  return (
    <div data-rc-progress="stack" className="relative">
      {/* Two edges peeking above the frame, BEHIND it: the frame stays opaque
          and a scrim does the dimming, or the edges show through the photo
          as two grey bars across its top. */}
      <span
        aria-hidden
        className="absolute inset-x-5 -top-3 h-6 rounded-t-xl bg-white/[0.09]"
      />
      <span
        aria-hidden
        className="absolute inset-x-2.5 -top-1.5 h-6 rounded-t-xl bg-white/[0.16]"
      />
      <div className="relative">
        <ClipStill src={src} label="Your clip, being drawn" />
        <span aria-hidden className="absolute inset-0 rounded-xl bg-black/55" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
        <p
          className={cn(
            "font-heading text-white tabular-nums",
            compact ? "text-card-title" : "text-subsection",
          )}
        >
          {`${left} of ${total} moments left`}
        </p>
        <p className="max-w-[24ch] text-caption text-white/65">
          Drawing your clip on this device. Keep this tab open.
        </p>
        <span className="mt-1 flex h-8 items-center rounded-full border border-white/25 px-3.5 text-caption font-medium text-white/85">
          Cancel
        </span>
      </div>
    </div>
  );
}

/* ── the finish ──────────────────────────────────────────────────────────── */

type Done = "save" | "share" | "add";

/** One door. `loud` is Share's; a done door keeps its place and says so. */
function Door({
  icon,
  label,
  loud,
  done,
  doneLabel,
  menu,
}: {
  icon: ReactNode;
  label: string;
  loud?: boolean;
  done?: boolean;
  doneLabel?: string;
  /** Opens the platform's options (iOS's Save). */
  menu?: boolean;
}) {
  return (
    <span
      data-rc-door={loud ? "loud" : "pair"}
      data-rc-done={done ? "" : undefined}
      className={cn(
        "flex h-11 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-action)] px-4 text-working font-medium whitespace-nowrap",
        loud
          ? "bg-reel text-white"
          : done
            ? "border border-white/15 bg-white/[0.06] text-white/80"
            : "border border-white/20 text-white/90",
      )}
    >
      {done ? (
        <Check className="size-4 text-[oklch(0.8_0.14_150)]" aria-hidden />
      ) : (
        icon
      )}
      <span className="truncate">{done ? (doneLabel ?? label) : label}</span>
      {menu && !done ? (
        <ChevronDown className="size-3.5 text-white/50" aria-hidden />
      ) : null}
    </span>
  );
}

/**
 * THE DOORS, as he amended round one's pick: Share the one loud door, Save and
 * Add to event a pair under it, Make another a quiet link. Each action leaves
 * her HERE with its done state, so save-then-share or add-then-share is two
 * taps on one screen. A free event has no Add to event: Save stands alone.
 */
export function FinishDoors({
  paid,
  platform,
  done = [],
}: {
  paid: boolean;
  /** iOS's Save opens its options; everywhere else it is the download. */
  platform: "ios" | "desk";
  done?: readonly Done[];
}) {
  return (
    <div data-rc-doors className="flex w-full flex-col gap-2.5">
      <Door
        loud
        icon={<Share2 className="size-4" aria-hidden />}
        label="Share"
      />
      <div className={cn("grid gap-2.5", paid ? "grid-cols-2" : "grid-cols-1")}>
        <Door
          icon={<Download className="size-4" aria-hidden />}
          label="Save"
          menu={platform === "ios"}
          done={done.includes("save")}
          doneLabel="Saved"
        />
        {paid ? (
          <Door
            icon={<Plus className="size-4" aria-hidden />}
            label="Add to event"
            done={done.includes("add")}
            doneLabel="Added"
          />
        ) : null}
      </div>
      <p className="pt-1 text-center">
        <span className="text-caption text-white/60 underline decoration-white/25 underline-offset-4">
          Make another
        </span>
      </p>
    </div>
  );
}

/** The finish in the bench's panel at a laptop: the clip keeps playing at full
 *  height beside it, so the panel is only the words and the doors. */
export function FinishPanel({
  paid,
  done,
  children,
}: {
  paid: boolean;
  done?: readonly Done[];
  children?: ReactNode;
}) {
  return (
    <div data-rc-finish="panel" className="flex h-full flex-col">
      <div className="flex items-center gap-2 text-white/55">
        <ArrowLeft className="size-3.5" aria-hidden />
        <span className="text-caption">Back to editing, your picks kept</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6 px-10">
        <div className="flex flex-col gap-1">
          <p className="text-label font-semibold text-white/45 uppercase">
            Your clip is ready
          </p>
          <p className="font-heading text-page text-white">
            It&rsquo;s on this device.
          </p>
          <p className="text-working text-white/55">
            Nothing is uploaded until you share it or add it.
          </p>
        </div>
        <div className="max-w-[420px]">
          <FinishDoors paid={paid} platform="desk" done={done} />
        </div>
        {children}
      </div>
    </div>
  );
}

/** The finish as its own screen in a hand, as round one drew it, amended. */
export function FinishScreen({
  src,
  paid,
  done,
  overlay,
  mark,
}: {
  src: string | null;
  paid: boolean;
  done?: readonly Done[];
  overlay?: ReactNode;
  /** The free event's quiet line, under the clip. */
  mark?: ReactNode;
}) {
  return (
    <div
      data-rc-finish="screen"
      className="relative flex h-dvh flex-col bg-[oklch(0.11_0_0)] px-4 pt-4 pb-5 text-white"
    >
      <div className="flex items-center gap-2 pb-3">
        <span className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white/75">
          <ArrowLeft className="size-4" aria-hidden />
        </span>
        <p className="text-label font-medium text-white/50 uppercase">
          Your clip is ready
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="relative flex aspect-[9/16] h-full min-h-0 flex-col">
          <ClipStill src={src} label="Your finished clip, one frame" />
        </div>
        {mark}
      </div>
      <div className="relative pt-4">
        <FinishDoors paid={paid} platform="ios" done={done} />
        {overlay}
      </div>
    </div>
  );
}

/**
 * SAVE'S OPTIONS ON iOS, photos first (the viewer's own menu and words,
 * share-save.ts's `saveChoices`): Save to Photos through the system sheet,
 * then the plain file. Anchored above the pair's left door.
 */
export function SaveMenu() {
  return (
    <div
      data-rc-save-menu
      role="menu"
      aria-label="Save"
      className="absolute bottom-[calc(100%-4.25rem)] left-0 z-20 w-52 rounded-float bg-popover p-1 text-popover-foreground shadow-layer ring-1 ring-foreground/10"
    >
      <span
        role="menuitem"
        className="flex items-center gap-2 rounded-[calc(var(--radius-float)_-_4px)] bg-accent px-2 py-1.5 text-sm text-accent-foreground"
      >
        <Images className="size-4 text-muted-foreground" aria-hidden />
        Save to Photos
      </span>
      <span
        role="menuitem"
        className="flex items-center gap-2 rounded-[calc(var(--radius-float)_-_4px)] px-2 py-1.5 text-sm"
      >
        <FileDown className="size-4 text-muted-foreground" aria-hidden />
        Download file
      </span>
    </div>
  );
}

/**
 * ADD TO EVENT, BEHIND A CONFIRM LIKE THE HOST'S OWN (his words: so they know
 * what they're doing and don't click it by accident). DialogContent's panel,
 * header and footer, quoted in place over the finish.
 */
export function AddConfirm() {
  return (
    <div
      data-rc-confirm
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
    >
      <div
        role="dialog"
        aria-label={`Add your clip to ${EVENT.name}?`}
        className="grid w-full max-w-sm gap-4 rounded-float bg-popover p-4 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
      >
        <div className="flex flex-col gap-2">
          <p className="font-heading text-card-title leading-none font-medium">
            {`Add your clip to ${EVENT.name}?`}
          </p>
          <p className="text-sm text-muted-foreground">
            It&rsquo;s uploaded to the event&rsquo;s album, where everyone can
            watch and save it. The live reel won&rsquo;t play it.
          </p>
        </div>
        <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-float border-t bg-muted/50 p-4">
          <span className="flex h-9 items-center rounded-[var(--radius-action)] border border-border bg-background px-4 text-sm font-medium">
            Cancel
          </span>
          <span className="flex h-9 items-center rounded-[var(--radius-action)] bg-primary px-4 text-sm font-medium text-primary-foreground">
            Add to event
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── no encoder here: the reel's own view, its door greyed ───────────────── */

function ViewControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/85 backdrop-blur-sm"
    >
      {children}
    </span>
  );
}

/**
 * THE REEL'S VIEW ON A BROWSER WITH NO ENCODER, as he amended `noencode`:
 * "Make your own" stays in its slot, visibly disabled, and a tap bubbles up
 * why, rather than a paragraph standing over the reel. The bubble is drawn as
 * it looks right after the tap. The view's chrome is `reel-view`'s own round,
 * worn here as ground.
 */
export function NoEncoderView({
  still,
  wide,
}: {
  still: string | null;
  wide?: boolean;
}) {
  return (
    <div
      data-rc-view
      className="relative flex h-dvh flex-col overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
          <img
            src={still}
            alt="The event's live reel"
            className={cn(
              "opacity-90",
              wide ? "h-full object-contain" : "size-full object-cover",
            )}
          />
        ) : null}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/55 to-transparent"
        />
      </div>
      <div className="relative flex items-start justify-between p-3">
        <span className="rounded-full bg-black/40 px-3 py-1.5 text-caption text-white/85 backdrop-blur-sm">
          Ruby just added a photo
        </span>
        <ViewControl label="Close">
          <X className="size-4" aria-hidden />
        </ViewControl>
      </div>
      <div className="relative mt-auto flex flex-col items-center gap-3 px-4 pb-7">
        <div className="flex items-center gap-2">
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
        <div className="relative flex flex-col items-center">
          <span
            data-rc-noencode-bubble
            role="status"
            className="absolute bottom-[calc(100%+10px)] w-max max-w-[27ch] rounded-float bg-popover px-3 py-2 text-center text-caption text-popover-foreground shadow-layer ring-1 ring-foreground/10"
          >
            This browser can&rsquo;t make clips. Open the album on another
            device to make one.
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-popover"
            />
          </span>
          <span
            data-rc-make-own="greyed"
            aria-disabled
            className="flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-working font-medium text-white/35"
          >
            <Clapperboard className="size-4" aria-hidden />
            Make your own
          </span>
        </div>
      </div>
      <span
        aria-label="Scan to add yours, at partyreel.com"
        className="absolute right-3 bottom-3 z-10 flex size-9 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lift"
      >
        <QrCode className="size-4" aria-hidden />
      </span>
    </div>
  );
}
