"use client";

import "@/components/guest/reel/live-reel.css";

import { type CSSProperties, type ReactNode, useState } from "react";
import {
  Clock3,
  ImagePlus,
  MonitorPlay,
  Palette,
  Pause,
  QrCode,
  Video,
  Wand2,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { holdLabel, liveMoods } from "@/lib/guest/reel-prefs";
import { DEFAULT_HOLD_SEC } from "@/lib/reel/defaults";
import { resolveLiveStyleId } from "@/lib/reel/live/window";
import { cn } from "@/lib/utils";

import { PHOTO } from "../../fixtures";
import { useInUse } from "../in-use";
import type { ScreenProps } from "../screen-props";

/**
 * THE LIVE REEL'S STYLE MENU: Maya plays her wedding's reel (the view her
 * guests watch, which she opens with every gate passed), a photograph full
 * bleed, the dock up, and presses Style: the moods, the one playing chosen,
 * and her own footer under them (this device's look, and Set for everyone).
 *
 * ★ QUOTED, NOT MOUNTED (`live-reel-view.tsx`): the player reads the album's
 * live window, so the view's own composition is drawn here line for line over
 * one still, in its words: the picture, the whisper at the top, Close, and
 * the dock (`ReelDock`: the bar grown into the glass pane, its controls, the
 * timeline, Make your own), its menus production's `DropdownMenu` with its
 * radio items, opened the real way (a pointer's press on Style). At a desk
 * the dock adds the code's toggle and Play on a screen, as it does for an
 * owner there. ★ Nothing writes: a look chosen here stays on the picture.
 */

/** The bar's pill at rest and the dock's corner (`live-reel-view.tsx`'s own numbers). */
const BAR_W = 132;
const BAR_H = 34;
const DOCK_R = 22;

const CHROME = cn(
  "flex size-10 shrink-0 items-center justify-center rounded-full text-white outline-none",
  "transition-[transform,background-color] duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100",
  "focus-visible:ring-2 focus-visible:ring-white/70",
  "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/12",
);

/** One of the dock's round keys, its label in a tooltip (`ChromeButton`). */
function ChromeButton({
  label,
  pressed,
  stagger,
  className,
  children,
}: {
  label: string;
  pressed?: boolean;
  stagger?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          data-lr-stagger={stagger === undefined ? undefined : ""}
          style={
            stagger === undefined
              ? undefined
              : ({ "--lr-i": stagger } as CSSProperties)
          }
          className={cn(CHROME, pressed && "bg-white/18", className ?? GLASS)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/** A dock key that opens a menu over the dock (`MenuButton`). */
function MenuButton({
  label,
  icon,
  stagger,
  contentClassName,
  children,
}: {
  label: string;
  icon: ReactNode;
  stagger: number;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={label}
              data-lr-stagger=""
              style={{ "--lr-i": stagger } as CSSProperties}
              className={cn(CHROME, "data-[state=open]:bg-white/18")}
            >
              {icon}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={10}
        className={cn("w-44", contentClassName)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The owner's footer under the Style list (`SetForEveryoneFooter`): this device's look, not yet everyone's. */
function SetForEveryoneFooter() {
  return (
    <DropdownMenuFooter data-reel-set-everyone>
      <p className="px-2 pt-1 text-caption text-muted-foreground">
        Only on this device, for now
      </p>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        className="mx-1 mb-1 h-8 justify-center rounded-full border border-border font-medium"
      >
        Set for everyone
      </DropdownMenuItem>
    </DropdownMenuFooter>
  );
}

/** The loop's progress (`Timeline`), a third of the way round. */
function Timeline({ progress }: { progress: number }) {
  return (
    <span
      aria-hidden
      className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
    >
      <span
        className="absolute inset-0 origin-left rounded-full bg-white/85"
        style={{ transform: `scaleX(${progress})` }}
      />
    </span>
  );
}

function Dock({ desk }: { desk: boolean }) {
  const moods = liveMoods();
  // The device's own pick: a mood other than the event's default, so the owner's footer has a look to set.
  const [styleId, setStyleId] = useState(
    () => moods[1]?.id ?? resolveLiveStyleId(null),
  );
  const styleLabel = moods.find((m) => m.id === styleId)?.label ?? "Cinematic";
  let i = 0;
  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={250}>
      <div
        className={cn(
          "lr-pane absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 text-white",
          "w-max max-w-[calc(100vw-1.5rem)] min-w-[15rem]",
          GLASS,
        )}
        style={
          {
            "--lr-bar-w": `${BAR_W}px`,
            "--lr-bar-h": `${BAR_H}px`,
            "--lr-dock-r": `${DOCK_R}px`,
            borderRadius: DOCK_R,
          } as CSSProperties
        }
        data-state="up"
        data-reel-dock="up"
      >
        <div className="lr-dock-content flex flex-col gap-2 p-2">
          <div className="flex items-center justify-center gap-1">
            <ChromeButton label="Pause" stagger={i++} className="">
              <Pause
                className={cn("size-[18px] fill-white", GLASS_MARK_LIT)}
                aria-hidden
              />
            </ChromeButton>
            <ChromeButton
              label="Videos play"
              pressed
              stagger={i++}
              className=""
            >
              <Video
                className={cn("size-[18px]", GLASS_MARK_LIT)}
                aria-hidden
              />
            </ChromeButton>
            <MenuButton
              label={`Style: ${styleLabel}`}
              icon={
                <Palette
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              }
              stagger={i++}
              contentClassName="w-60"
            >
              <DropdownMenuLabel>Style</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={styleId}
                onValueChange={setStyleId}
              >
                {moods.map((mood) => (
                  <DropdownMenuRadioItem key={mood.id} value={mood.id}>
                    {mood.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <SetForEveryoneFooter />
            </MenuButton>
            <MenuButton
              label={`Hold: ${holdLabel(DEFAULT_HOLD_SEC)} a photo`}
              icon={
                <Clock3
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              }
              stagger={i++}
            >
              <DropdownMenuLabel>Each photo holds</DropdownMenuLabel>
            </MenuButton>
            {desk && (
              <ChromeButton label="Show the code" stagger={i++} className="">
                <QrCode
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              </ChromeButton>
            )}
            <ChromeButton label="Add yours" stagger={i++} className="">
              <ImagePlus
                className={cn("size-[18px]", GLASS_MARK_LIT)}
                aria-hidden
              />
            </ChromeButton>
            {desk && (
              <ChromeButton label="Play on a screen" stagger={i++} className="">
                <MonitorPlay
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              </ChromeButton>
            )}
          </div>
          <button
            type="button"
            aria-label="Hide the controls"
            className="group mx-1 flex h-4 items-center outline-none"
          >
            <Timeline progress={0.36} />
          </button>
          <div className="relative flex flex-col">
            <button
              type="button"
              data-lr-stagger=""
              data-reel-make="ready"
              style={{ "--lr-i": i++ } as CSSProperties}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold outline-none",
                "transition-transform duration-150 ease-emphasis active:scale-[0.98] motion-reduce:active:scale-100",
                "focus-visible:ring-2 focus-visible:ring-white/70",
                "bg-reel text-white",
              )}
            >
              <Wand2 className="size-4" aria-hidden />
              Make your own
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Show the reel's controls"
          aria-expanded
          inert
          className="lr-bar-content absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2.5 px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ width: BAR_W, height: BAR_H, borderRadius: BAR_H / 2 }}
          data-reel-bar
        >
          <Pause
            className={cn("size-3 fill-white", GLASS_MARK_LIT)}
            aria-hidden
          />
          <Timeline progress={0.36} />
        </button>
      </div>
    </TooltipProvider>
  );
}

/** Opens Style the way a mouse does: Radix's menu trigger answers a pointer's press. */
function openStyle() {
  const style = document.querySelector<HTMLElement>(
    'button[aria-label^="Style:"]',
  );
  style?.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      pointerType: "mouse",
    }),
  );
}

const OPEN_STYLE: readonly (readonly [number, () => void])[] = [
  [700, openStyle],
];

export function StyleScreen({ w }: ScreenProps) {
  useInUse(OPEN_STYLE);
  return (
    <div
      data-live-reel-view="view"
      className="fixed inset-0 z-50 overflow-hidden bg-black text-white outline-none select-none"
    >
      <div className="absolute inset-0" data-reel-picture>
        {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
        <img
          src={PHOTO.golden}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: "45% 40%" }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent"
      />
      <div
        className="lr-follow absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-30"
        data-state="up"
      >
        <TooltipProvider delayDuration={350} skipDelayDuration={250}>
          <ChromeButton label="Close">
            <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
          </ChromeButton>
        </TooltipProvider>
      </div>
      <Dock desk={w === 1440} />
    </div>
  );
}
