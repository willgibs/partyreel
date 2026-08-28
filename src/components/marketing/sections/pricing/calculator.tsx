"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { friendlyCapacity, GIGABYTE } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { recommendPlan } from "./recommend";

/**
 * "Find your size" (Will's ruled input model, 2026-08-27): a storage slider
 * annotated with real-world equivalents, a video toggle, and the one-event vs
 * hosting-again switch (the actual Pass-vs-Pro fork). The brain is the pure
 * recommendPlan (unit-tested); this island only holds the controls.
 *
 * The slider walks a CURATED LADDER of stops instead of a raw byte range:
 * meaningful detents (the 2 GB Free cap, the 75 GB pass, the three Pro sizes),
 * clean keyboard steps, honest numbers. Interaction is HIGH-frequency, so the
 * result swaps instantly (no theater); the capacity meter's fill is the one
 * standard transition. The album-fill delight direction goes through the lab
 * before it lands here.
 */

/** The curated stop ladder (exported for the lab's calculator prototypes). */
export const STOP_GB = [1, 2, 5, 10, 25, 50, 75, 100, 150, 250, 500, 750, 1024, 1536, 2048];

export function Calculator() {
  const [stop, setStop] = useState(5); // 50 GB — a real wedding's neighborhood
  const [video, setVideo] = useState(true);
  const [hostingAgain, setHostingAgain] = useState(false);

  const bytes = STOP_GB[stop] * GIGABYTE;
  const rec = useMemo(
    () => recommendPlan({ bytes, video, hostingAgain }),
    [bytes, video, hostingAgain],
  );
  const need = friendlyCapacity(bytes);
  const planCap = rec.plan.storageBytes;
  const fillPct = Math.min(100, Math.round((bytes / planCap) * 100));

  return (
    <SectionShell
      id="fit"
      eyebrow="Fit"
      heading="Find your size."
      subhead="Slide to how much your event will collect, and we point at the plan that fits."
    >
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div
          data-mkt-reveal
          style={{ "--i": 3 } as CSSProperties}
          className="rounded-2xl border bg-card/40 p-6 sm:p-8"
        >
          {/* The slider + its live annotation. */}
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-mono text-3xl font-medium tracking-tight tabular-nums">
              {formatBytes(bytes)}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              about {need.photos.toLocaleString()} photos
              {video &&
                ` or ${
                  need.videoMinutes >= 120
                    ? `${Math.round(need.videoMinutes / 60).toLocaleString()} hours`
                    : `${need.videoMinutes.toLocaleString()} minutes`
                } of video`}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={STOP_GB.length - 1}
            step={1}
            value={stop}
            onChange={(e) => setStop(Number(e.target.value))}
            aria-label="How much storage your event needs"
            aria-valuetext={formatBytes(bytes)}
            className={cn(
              "mt-5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none",
              "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-emphasis [&::-webkit-slider-thumb]:active:scale-110",
              "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
          <div className="mt-2 flex justify-between text-[10px] tracking-[0.1em] text-muted-foreground/60 uppercase">
            <span>{formatBytes(STOP_GB[0] * GIGABYTE)}</span>
            <span>{formatBytes(STOP_GB[STOP_GB.length - 1] * GIGABYTE)}</span>
          </div>

          {/* The two forks. */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <Switch checked={video} onCheckedChange={setVideo} />
              <span className={video ? "" : "text-muted-foreground"}>
                Guests will add video
              </span>
            </label>
            <div
              role="group"
              aria-label="How often you host"
              className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
            >
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background shadow-sm transition-transform ease-emphasis [transition-duration:var(--mkt-tabs-dur)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(calc(${hostingAgain ? 1 : 0} * (100% + 0.25rem)))`,
                }}
              />
              {(["One event", "Hosting again"] as const).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={hostingAgain === (i === 1)}
                  onClick={() => setHostingAgain(i === 1)}
                  className={cn(
                    "relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/50",
                    "active:scale-[0.98] motion-reduce:active:scale-100",
                    hostingAgain === (i === 1)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* The verdict. aria-live so keyboard sliding announces the change. */}
          <div
            aria-live="polite"
            className="mt-7 rounded-xl border bg-background/40 p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-heading text-lg">
                {rec.planId === "free"
                  ? "Free covers it"
                  : rec.planId === "event_pass"
                    ? "The Event Pass fits"
                    : `${rec.plan.name} fits`}
              </p>
              <span className="font-mono text-lg font-medium tracking-tight tabular-nums">
                {rec.plan.priceLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
              {rec.reason}
            </p>

            {/* The capacity meter: your need inside the plan's room. */}
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-emphasis motion-reduce:transition-none"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground/60">
                {formatBytes(bytes)} of the plan&apos;s{" "}
                {formatBytes(planCap)}
              </p>
            </div>

            {rec.alternative && (
              <p className="mt-3 text-xs text-pretty text-muted-foreground/70">
                {rec.alternative}
              </p>
            )}

            <div className="mt-5">
              {rec.planId === "free" ? (
                <Button asChild variant="outline">
                  <Link href="/login">Start free</Link>
                </Button>
              ) : (
                <CheckoutButton planId={rec.planId} variant="outline">
                  {rec.planId === "event_pass"
                    ? "Buy a pass"
                    : `Get ${rec.plan.name}`}
                </CheckoutButton>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
