"use client";

import { useState } from "react";
import {
  Clapperboard,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  Sparkles,
  Video,
  X,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { DEFAULT_MOOD_ID, EVENT, MOODS, REEL_POSTER } from "./fixtures";

export type ReelViewExtra = "style" | "screen" | "switch" | "review" | "none";

/**
 * THE REEL VIEW, THIS BOARD'S OWN APPROXIMATION OF IT. `reel-view` is a
 * sibling board building the real full-screen player (its own chrome, its
 * own fade, its own control order); this is not a second opinion about any
 * of that. It is just enough of the plan's own prose (section C: "full-bleed
 * live player... play/pause, Include videos, Style, Add yours, Make your
 * own, Close... chrome fading on a resting pointer") to judge where ONE
 * host-only extra sits, across four of this board's six questions.
 *
 * ★ ONE COMPONENT, ONE VARYING PROP. `extra` is the only thing that moves:
 * `style` for the Style ask's `view`/`both` options, `switch` for the
 * switch's `inview` option, `screen` for the screen door's `view` option,
 * `review` for the review banner's `viewsays` option. Every other control in
 * the chrome (play/pause, Include videos, Add yours, Make your own, Close)
 * is drawn identically no matter which extra is on, so a reviewer is never
 * comparing two different views by accident.
 *
 * ★ `fixed`, NEVER `min-h-full` (scene.tsx's `SheetGround` carries the full
 * reason, found on the same pass): this board's frame has no ancestor that
 * hands a real height down to a percentage-based `min-h-full`, so the view
 * collapsed to the height of its own two content rows, a thin band with the
 * rest of the frame simply black. Standalone (`mode="fixed"`, the default),
 * it covers the true viewport, which is also the more honest shape for a
 * full-bleed overlay. `style=both` needs it CROPPED into a real pane instead
 * of covering the whole frame (`mode="contain"`, `absolute inset-0` filling
 * whatever real, pixel-sized box its caller gives it: never a percentage
 * one, the same trap one level up).
 */
export function ReelView({
  extra = "none",
  mode = "fixed",
}: {
  extra?: ReelViewExtra;
  mode?: "fixed" | "contain";
}) {
  const [playing] = useState(true);
  const [reelOn, setReelOn] = useState(true);
  const mood = MOODS.find((m) => m.id === DEFAULT_MOOD_ID);

  return (
    <div
      data-rh-reel-view
      data-rh-extra={extra}
      className={cn(
        "flex flex-col overflow-hidden bg-black text-white",
        mode === "fixed" ? "fixed inset-0" : "absolute inset-0",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a lab still, never a real presign */}
      <img
        src={REEL_POSTER}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/50" />

      <div className="relative z-10 flex items-center justify-between p-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
          <X className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-medium">{EVENT.name}</span>
        <span className="size-8 shrink-0" aria-hidden />
      </div>

      {extra === "review" && (
        <div
          data-rh-review-banner
          className="relative z-10 mx-4 mt-1 flex items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-xs text-white/90"
        >
          <Clapperboard className="size-3.5 shrink-0 text-reel" aria-hidden />
          <span className="min-w-0 flex-1">
            3 waiting won&apos;t play until you review them.
          </span>
          <span className="shrink-0 font-medium underline underline-offset-2">
            Review
          </span>
        </div>
      )}

      <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 p-4">
        <button
          type="button"
          tabIndex={-1}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-medium"
        >
          <Video className="size-3.5" aria-hidden />
          Include videos
        </button>

        {extra === "style" && (
          <span
            data-rh-style-control
            className="flex h-9 items-center gap-1.5 rounded-full border border-reel/60 bg-reel/20 px-3 text-xs font-medium"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Style: {mood?.label}
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
              sets the default
            </span>
          </span>
        )}

        <button
          type="button"
          tabIndex={-1}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-medium"
        >
          <Plus className="size-3.5" aria-hidden />
          Add yours
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-black"
        >
          Make your own
        </button>

        {extra === "screen" && (
          <button
            type="button"
            tabIndex={-1}
            data-rh-screen-control
            className="flex h-9 items-center gap-1.5 rounded-full border border-reel/60 bg-reel/20 px-3 text-xs font-medium"
          >
            <MonitorPlay className="size-3.5" aria-hidden />
            Play on a screen
          </button>
        )}

        {extra === "switch" && (
          <label
            data-rh-host-switch
            className={cn(
              "ml-auto flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-medium",
              "border-reel/60 bg-reel/20",
            )}
          >
            Reel
            <Switch
              checked={reelOn}
              onCheckedChange={setReelOn}
              aria-label="Show the reel"
            />
          </label>
        )}
      </div>
    </div>
  );
}

/** A number read off the reel view's own chrome, never asserted: which of
 *  the four host-only extras it actually drew. Shared by every ask that
 *  points a preview at this scene. */
export const measureReelView = (root: HTMLElement): string | null => {
  const view = root.querySelector<HTMLElement>("[data-rh-reel-view]");
  if (!view) return null;
  const style = view.querySelector("[data-rh-style-control]");
  const screenCtl = view.querySelector("[data-rh-screen-control]");
  const hostSwitch = view.querySelector("[data-rh-host-switch]");
  const banner = view.querySelector("[data-rh-review-banner]");
  const extras = [
    style && "a Style control",
    screenCtl && "a Play on a screen control",
    hostSwitch && "the host's own on/off switch",
    banner && "a waiting-count banner",
  ].filter(Boolean);
  return extras.length
    ? `Measured: the reel view's chrome carries ${extras.join(", ")}.`
    : "Measured: the reel view's chrome carries none of this board's four host extras.";
};
