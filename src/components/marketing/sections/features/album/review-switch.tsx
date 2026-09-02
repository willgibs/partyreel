"use client";

import { Check, EyeOff, ListChecks, Radio, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * LIVE OR REVIEW: the one question the old page never resolved ("do uploads
 * go public before I see them?"), answered as a switch you can flip. Two
 * segments on the app's own lifted-pill control (the privacy page's access
 * switch mechanics), driving one upload's path: in Live it lands in the
 * album the moment it arrives; in Review it waits in the amber queue until
 * [Approve all] (the feed's real controls, quoted), and the guest sees the
 * real toast. Reduced motion swaps the panels instantly.
 */

type Mode = "live" | "review";

const SEGMENTS: { mode: Mode; label: string; Icon: typeof Radio }[] = [
  { mode: "live", label: "Live", Icon: Radio },
  { mode: "review", label: "Review", Icon: ShieldCheck },
];

const HINT: Record<Mode, string> = {
  live: "Uploads appear for everyone the moment they land. Hide any of them with a tap.",
  review: "Every upload waits for you. The guest sees: Sent, waiting for host approval",
};

export function ReviewSwitch() {
  const [mode, setMode] = useState<Mode>("live");
  const index = SEGMENTS.findIndex((s) => s.mode === mode);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div
        role="group"
        aria-label="How uploads reach the album"
        className="relative mx-auto grid w-full max-w-xs grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
      >
        {/* The sliding lift: translateX(100%) is the pill's own width, so
            (100% + 4px) hops exactly one segment plus the gap. */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background shadow-sm transition-transform ease-emphasis [transition-duration:var(--mkt-tabs-dur)] motion-reduce:transition-none"
          style={{ transform: `translateX(calc(${index} * (100% + 0.25rem)))` }}
        />
        {SEGMENTS.map(({ mode: value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              "active:scale-[0.98] motion-reduce:active:scale-100",
              mode === value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* The path: the phone, the middle, the album. Only the middle changes. */}
      <div
        aria-hidden
        className="grid grid-cols-[1fr_auto_1.4fr_auto_1fr] items-center gap-2 rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 sm:gap-3 sm:p-5"
      >
        <Node label="The phone">
          <span className="relative block aspect-square w-full overflow-hidden rounded-[4px]">
            <Image
              src={marketingImage("wedding-toast").src}
              alt=""
              fill
              sizes="120px"
              className="object-cover opacity-80"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/35 p-1">
              <span className="block h-1 w-full overflow-hidden rounded-full bg-white/30">
                <span className="block h-full w-full rounded-full bg-white" />
              </span>
            </span>
          </span>
        </Node>
        <Arrow />
        <div className="grid">
          <Panel active={mode === "live"}>
            <Node label="The album">
              <span className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span className="text-xs font-medium">Lands at once</span>
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <EyeOff className="size-3 text-warning" /> Hide
                </span>
              </span>
            </Node>
          </Panel>
          <Panel active={mode === "review"}>
            <Node label="Your queue">
              <span className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wide text-warning uppercase">
                    Review
                  </span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
                    1
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex h-7 items-center gap-1 rounded-lg border bg-background px-2 text-[11px] font-medium">
                    <ListChecks className="size-3" /> Select
                  </span>
                  <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2 text-[11px] font-medium text-primary-foreground">
                    <Check className="size-3" /> Approve all
                  </span>
                </span>
              </span>
            </Node>
          </Panel>
        </div>
        <Arrow />
        <Node label="Everyone's album">
          <span className="grid grid-cols-2 gap-1">
            {["wedding-golden", "party-balloons", "reception-table"].map(
              (id) => (
                <span
                  key={id}
                  className="relative block aspect-square overflow-hidden rounded-[3px]"
                >
                  <Image
                    src={marketingImage(id).src}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </span>
              ),
            )}
            <span
              className={cn(
                "relative block aspect-square overflow-hidden rounded-[3px] transition-opacity ease-emphasis [transition-duration:var(--mkt-tabs-dur)]",
                mode === "live" ? "opacity-100" : "opacity-30",
              )}
            >
              <Image
                src={marketingImage("wedding-toast").src}
                alt=""
                fill
                sizes="60px"
                className="object-cover"
              />
            </span>
          </span>
        </Node>
      </div>

      <MonoCaption aria-live="polite" className="text-center">
        <TextSwap value={HINT[mode]} />
      </MonoCaption>
    </div>
  );
}

function Node({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-center text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <span className="h-px w-4 bg-border sm:w-6" aria-hidden />
  );
}

function Panel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "transition-opacity ease-emphasis [grid-area:1/1] [transition-duration:var(--mkt-tabs-dur)] motion-reduce:transition-none",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {children}
    </div>
  );
}
