"use client";

import type { ReactNode } from "react";
import {
  ChevronDown,
  ImagePlay,
  Lock,
  RectangleHorizontal,
  RectangleVertical,
  Timer,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuMeta,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GalleryItem } from "@/lib/events/gallery-reel";
import {
  CLIP_LENGTHS,
  CLIP_ORIENTATIONS,
  lengthOffered,
  type ClipLength,
} from "@/lib/reel/clip-selection";
import { lengthWords } from "@/lib/reel/clip-words";
import type { Orientation } from "@/lib/reel/engine/constants";
import { cn } from "@/lib/utils";

import { ROOM_FOCUS, ROOM_PRESS } from "./clip-room";

/**
 * THE TRAY: the three settings that style what is already there (reel-cut's carried call, taken in
 * every direction): Length, Layout and Opening, each showing its value and opening a small menu, so
 * none of them takes the bench's panel from the moments and the looks.
 *
 * Length offers Auto (the clip's own length, up to the plan's cap) and 15, 30 and 60 seconds under
 * that cap: a free event's 60 wears a lock and says who has it, because the cap is the host's plan
 * (`ClipFacts.maxSeconds`) and a guest cannot lift it.
 */

const ORIENTATION_LABEL: Record<Orientation, string> = {
  portrait: "Portrait",
  landscape: "Landscape",
};

function TrayChip({
  icon,
  label,
  display,
  valueText,
  compact,
  disabled,
  ...rest
}: {
  icon: ReactNode;
  label: string;
  /** The value as drawn: words, or a moment's thumbnail. */
  display: ReactNode;
  /** The value in words, for a reader who cannot see a thumbnail. */
  valueText: string;
  compact?: boolean;
  disabled?: boolean;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${label}: ${valueText}`}
      {...rest}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/15 px-2.5 text-caption whitespace-nowrap text-white/85 hover:border-white/30 data-[state=open]:border-white/40",
        ROOM_FOCUS,
        ROOM_PRESS,
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <span className="text-white/50">{icon}</span>
      {compact ? null : <span className="text-white/45">{label}</span>}
      <span className="font-medium">{display}</span>
      <ChevronDown className="size-3.5 text-white/40" aria-hidden />
    </button>
  );
}

export function Tray({
  length,
  maxSeconds,
  onLength,
  orientation,
  onOrientation,
  opening,
  openingPicked,
  openers,
  onOpening,
  isOwner,
  compact,
  disabled,
  className,
}: {
  length: ClipLength;
  /** The plan's cap (`ClipFacts.maxSeconds`). */
  maxSeconds: number;
  onLength: (length: ClipLength) => void;
  orientation: Orientation;
  onOrientation: (orientation: Orientation) => void;
  /** The moment that opens the clip (the order's first). */
  opening: GalleryItem | null;
  /** Whether she chose it (Auto otherwise: whatever is first in her order). */
  openingPicked: boolean;
  /** The moments that may open it: the ones the length plays. */
  openers: readonly GalleryItem[];
  /** A moment, or null for Auto. */
  onOpening: (id: string | null) => void;
  isOwner: boolean;
  compact?: boolean;
  /** The export's minute: nothing here moves until it is done. */
  disabled?: boolean;
  className?: string;
}) {
  const lengthValue = lengthWords(length === "auto" ? "auto" : length).value;
  return (
    <div data-clip-tray className={cn("flex items-center gap-1.5", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TrayChip
            compact={compact}
            disabled={disabled}
            icon={<Timer className="size-3.5" aria-hidden />}
            label="Length"
            display={lengthValue}
            valueText={lengthValue}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel>Length</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(length)}
            onValueChange={(v) =>
              onLength(v === "auto" ? "auto" : (Number(v) as ClipLength))
            }
          >
            {CLIP_LENGTHS.map((option) => {
              const offered = lengthOffered(option, maxSeconds);
              return (
                <DropdownMenuRadioItem
                  key={String(option)}
                  value={String(option)}
                  disabled={!offered}
                >
                  {offered ? null : <Lock aria-hidden />}
                  {lengthWords(option).item}
                  {option === "auto" ? (
                    <DropdownMenuMeta>{`Up to ${maxSeconds} s`}</DropdownMenuMeta>
                  ) : offered ? null : (
                    <DropdownMenuMeta>
                      {isOwner ? "With Pro" : "Pro events"}
                    </DropdownMenuMeta>
                  )}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TrayChip
            compact={compact}
            disabled={disabled}
            icon={
              orientation === "landscape" ? (
                <RectangleHorizontal className="size-3.5" aria-hidden />
              ) : (
                <RectangleVertical className="size-3.5" aria-hidden />
              )
            }
            label="Layout"
            display={ORIENTATION_LABEL[orientation]}
            valueText={ORIENTATION_LABEL[orientation]}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="center" className="w-44">
          <DropdownMenuLabel>Layout</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={orientation}
            onValueChange={(v) => onOrientation(v as Orientation)}
          >
            {CLIP_ORIENTATIONS.map((o) => (
              <DropdownMenuRadioItem key={o} value={o}>
                {o === "landscape" ? (
                  <RectangleHorizontal aria-hidden />
                ) : (
                  <RectangleVertical aria-hidden />
                )}
                {ORIENTATION_LABEL[o]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TrayChip
            compact={compact}
            disabled={disabled || openers.length === 0}
            icon={<ImagePlay className="size-3.5" aria-hidden />}
            label="Opening"
            display={
              openingPicked && opening ? (
                <Thumb item={opening} size="chip" />
              ) : (
                "Auto"
              )
            }
            valueText={openingPicked ? "your pick" : "Auto"}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="max-h-80 w-60">
          <DropdownMenuLabel>Opening shot</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={openingPicked && opening ? opening.id : "auto"}
            onValueChange={(v) => onOpening(v === "auto" ? null : v)}
          >
            <DropdownMenuRadioItem value="auto">
              Auto
              <DropdownMenuMeta>First in your order</DropdownMenuMeta>
            </DropdownMenuRadioItem>
            {openers.map((item, i) => (
              <DropdownMenuRadioItem key={item.id} value={item.id}>
                <Thumb item={item} size="row" />
                {`Moment ${i + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {openers.length === 0 ? (
            <DropdownMenuItem disabled>Pick a moment first</DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** A moment's still at a chip's or a menu row's size. */
function Thumb({ item, size }: { item: GalleryItem; size: "chip" | "row" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a presigned preview
    <img
      src={item.previewUrl ?? (item.type === "video" ? "" : item.url)}
      alt=""
      className={cn(
        "shrink-0 rounded-[3px] object-cover",
        size === "chip" ? "h-5 w-4" : "h-8 w-6",
      )}
    />
  );
}
