"use client";

import { type PointerEvent, useRef } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import {
  STYLE_MOMENTS,
  type StyleMoment,
} from "@/components/app/event-settings/camera-settings-style-picture";
import { cn } from "@/lib/utils";

/**
 * THE NIGHT, UNDER THE PICTURES (create-wizard r1's `mode=night`, settled; the add step's slider): a track, three
 * moments, a knob. It moves every album picture from guests arriving, through the party, to the morning after, so a
 * host sees what each style gives up and when, with nothing to read.
 *
 * ★ THE MOMENTS ARE NAMED BY WHAT HAPPENS, NEVER BY A CLOCK (the round's direction: nothing depends on a timeline, so a
 * morning-only or a two-day event reads as well as an evening's).
 *
 * ★ THE TRACK IS A POINTER'S CONVENIENCE, THE WORDS ARE THE CONTROL: a press or a drag anywhere on the track lands on
 * the nearest moment, and its three words are a radio group, so a keyboard and a screen reader get the arrows (Radix's
 * roving focus), choosing as they go, like the album styles above it.
 */

export const MOMENT_WORDS: Record<StyleMoment, string> = {
  arrive: "Arriving",
  party: "The party",
  morning: "Next morning",
};

export function Night({
  moment,
  onMoment,
  className,
}: {
  moment: StyleMoment;
  onMoment: (m: StyleMoment) => void;
  className?: string;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const last = STYLE_MOMENTS.length - 1;
  const i = STYLE_MOMENTS.indexOf(moment);
  const pct = (i / last) * 100;

  const nearest = (e: PointerEvent) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1) return;
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onMoment(STYLE_MOMENTS[Math.round(x * last)]!);
  };

  return (
    <div data-night={moment} className={cn("w-full", className)}>
      <div
        ref={track}
        aria-hidden
        data-night-track=""
        className="cr-night mx-[11px] cursor-pointer"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          nearest(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          // A press eases the knob to its moment; a drag has it follow the finger, never a beat behind.
          e.currentTarget.dataset.dragging = "";
          nearest(e);
        }}
        onPointerUp={(e) => delete e.currentTarget.dataset.dragging}
        onPointerCancel={(e) => delete e.currentTarget.dataset.dragging}
      >
        <span className="cr-night-track" />
        <span className="cr-night-fill" style={{ width: `${pct}%` }} />
        {STYLE_MOMENTS.map((m, k) => (
          <span
            key={m}
            className="cr-night-stop"
            data-on={k <= i ? "" : undefined}
            style={{ left: `${(k / last) * 100}%` }}
          />
        ))}
        <span className="cr-night-knob" style={{ left: `${pct}%` }} />
      </div>
      <RadioGroupPrimitive.Root
        value={moment}
        onValueChange={(v) => onMoment(v as StyleMoment)}
        aria-label="Through the night"
        loop
        className="mt-1 grid grid-cols-3 text-caption"
      >
        {STYLE_MOMENTS.map((m, k) => (
          <RadioGroupPrimitive.Item
            key={m}
            value={m}
            data-moment-word={m}
            className={cn(
              "min-h-9 cursor-pointer rounded-md px-0.5 transition-colors duration-150 outline-none focus-halo",
              k === 0 ? "text-left" : k === 1 ? "text-center" : "text-right",
              "data-[state=checked]:font-medium data-[state=checked]:text-foreground data-[state=unchecked]:text-muted-foreground",
            )}
          >
            {MOMENT_WORDS[m]}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}
