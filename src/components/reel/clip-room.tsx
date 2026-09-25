"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, Clapperboard } from "lucide-react";

import { markWords } from "@/lib/reel/clip-words";
import { cn } from "@/lib/utils";

/**
 * THE CLIP'S ROOM: the pieces every part of the creator stands in.
 *
 * ★ THE ROOM PAINTS ITS OWN GROUND AND NOTHING ELSE. It is always dark, whatever the site's theme,
 * because the clip is the picture and the room exists to hold it (the reel's view is black for the
 * same reason). Its near-black, its one raised surface and its white type are literal; a menu, a
 * confirm or the reel's violet read the theme exactly as they do over the reel.
 */

/** The room's ground and its one raised surface, in one place. */
export const ROOM = "bg-[oklch(0.11_0_0)]";
export const PANEL = "bg-[oklch(0.14_0_0)] ring-1 ring-white/[0.07]";

/** The room's own focus ring: white on the dark, never the theme's. */
export const ROOM_FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-white/70";

/** The press every control in the room answers with (instant under reduced motion). */
export const ROOM_PRESS =
  "transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

/** A chip: a fill, a tray setting. White when it is the one in force. */
export function RoomChip({
  active,
  disabled,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-caption font-medium whitespace-nowrap",
        ROOM_FOCUS,
        ROOM_PRESS,
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80 hover:border-white/35 hover:text-white",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A view's label row: what it is on the left, a count on the right. */
export function PanelLabel({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="text-label font-semibold text-white/45 uppercase">
        {children}
      </h3>
      {aside ? (
        <p className="text-micro text-white/40 tabular-nums">{aside}</p>
      ) : null}
    </div>
  );
}

/**
 * The room's head: Back to the reel, whose night it is and what the clip is, and the one loud
 * action. The event's name leads (bible 7: a guest surface belongs to the host's event), then the
 * object, then the clip's own line ("0:30 · Cinematic · 8 moments").
 */
export function RoomHead({
  eventName,
  meta,
  onBack,
  backLabel,
  right,
  compact,
}: {
  eventName: string;
  meta: string;
  onBack: () => void;
  backLabel: string;
  /** The loud action, or a spacer of its width so the title stays centred. */
  right: ReactNode;
  compact?: boolean;
}) {
  return (
    <header
      data-clip-head
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-2",
        compact
          ? "pt-[calc(0.5rem+env(safe-area-inset-top))]"
          : "pt-[calc(0.75rem+env(safe-area-inset-top))]",
      )}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 hover:text-white",
          ROOM_FOCUS,
          ROOM_PRESS,
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 text-center">
        <p className="truncate text-label font-medium text-white/45 uppercase">
          {eventName}
        </p>
        <h2 className="truncate text-working font-medium text-white/90">
          Your clip
        </h2>
        <p
          data-clip-meta
          className="truncate text-micro text-white/40 tabular-nums"
          aria-live="polite"
        >
          {meta}
        </p>
      </div>
      {right}
    </header>
  );
}

/** The room's one loud action. The encode starts here and nothing else starts it. */
export function MakeButton({
  onMake,
  making,
  disabled,
  compact,
}: {
  onMake: () => void;
  making?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onMake}
      disabled={disabled || making}
      data-clip-make={making ? "making" : "ready"}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3.5 text-caption font-medium text-white",
        ROOM_FOCUS,
        ROOM_PRESS,
        "disabled:pointer-events-none",
        making ? "bg-reel/40 text-white/70" : disabled && "opacity-40",
        compact && "px-3",
      )}
    >
      <Clapperboard className="size-3.5" aria-hidden />
      {making ? "Making" : "Make it"}
    </button>
  );
}

/** The width the loud action takes, held when it is not drawn (the finish), so nothing re-centres. */
export function MakeSpacer() {
  return <span aria-hidden className="w-[86px] shrink-0" />;
}

/**
 * THE FREE MARK'S LINE, QUIETER BUT FINDABLE (`mark=line`). The engine stamps the mark in the
 * clip's corner exactly where the file carries it; this one line sits under the clip at the room's
 * quietest step. A guest's says which events mark; the host's names the way past it (her upgrade,
 * `onUpgrade`), and only hers is a control.
 */
export function MarkLine({
  isOwner,
  onUpgrade,
  align = "end",
}: {
  isOwner: boolean;
  onUpgrade?: () => void;
  align?: "end" | "center";
}) {
  const words = markWords(isOwner);
  return (
    <p
      data-clip-mark
      className={cn(
        "mt-2 w-full text-micro text-white/35",
        align === "end" ? "text-right" : "text-center",
      )}
    >
      {words.lead}{" "}
      {isOwner && onUpgrade ? (
        <button
          type="button"
          onClick={onUpgrade}
          className={cn(
            "rounded-sm text-white/65 underline decoration-white/30 underline-offset-2 hover:text-white",
            ROOM_FOCUS,
          )}
        >
          {words.tail}
        </button>
      ) : (
        <span className="text-white/60">{words.tail}</span>
      )}
    </p>
  );
}

/**
 * THE CLIP'S BOX: the largest rectangle of the clip's own shape inside whatever room it is given.
 *
 * ★ HEIGHT-BOUND OR WIDTH-BOUND, WHICHEVER BINDS, IN CSS. The box is a size container, and the clip
 * inside takes `min(the width, the height times the ratio)`, so a portrait clip at a laptop takes the
 * room's height and a landscape one takes its width, and nothing is measured in script (a lab
 * board's first try let a 9:16 clip take a laptop's width and drew it 2,560 px tall).
 */
export function FitBox({
  ratio,
  children,
  className,
}: {
  /** Width over height. */
  ratio: number;
  children: ReactNode;
  className?: string;
}) {
  const inner: CSSProperties = {
    width: `min(100cqw, calc(100cqh * ${ratio}))`,
    aspectRatio: String(ratio),
  };
  return (
    <div
      className={cn(
        "[container-type:size] flex min-h-0 w-full items-center justify-center",
        className,
      )}
    >
      <div data-clip-frame className="relative" style={inner}>
        {children}
      </div>
    </div>
  );
}
