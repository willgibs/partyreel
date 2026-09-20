"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  recommendPlan,
  type Recommendation,
} from "@/components/marketing/sections/pricing/recommend";
import { StatRow } from "@/components/marketing/sections/pricing/plan-cards";
import { STOP_GB } from "@/components/marketing/sections/pricing/calculator";
import { Switch } from "@/components/ui/switch";
import {
  MARKETING_IMAGES,
  marketingImage,
} from "@/lib/constants/marketing-media";
import {
  annualPlanFor,
  friendlyCapacity,
  GIGABYTE,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { BuyButton } from "./scene";
import { PassTicketGiven, PlanPairGiven } from "./plans";

/**
 * "FIND YOUR SIZE", ROUND TWO: his ask by name (docs/design/rulings.md, the
 * sixth batch, verbatim): "Could use a bit of a redesign to feel more
 * polished, but definitely the most engaging option. I think Higgsfield does a
 * good job of their 'find the best plan for you' (explore
 * https://higgsfield.ai/pricing in code and visually) where they show a
 * designed plan card as the result in a frame to the right, with the config
 * in the left half. Would like to see a couple more explorations." `wall` is
 * today, unchanged; `split` is that shape, built fresh (their words and marks
 * copied nowhere: only the two-pane idea, described in `docs/tracks/pricing-fit.md`'s
 * own reading of the page, is reused); `inline` cuts the block entirely, since
 * the slider Pro's card already carries is arguably the whole answer.
 *
 * ★ EVERY OPTION STANDS UNDER THE REAL PAIR AND THE REAL TICKET (`PlanPairGiven`,
 * `PassTicketGiven`, `plans.tsx`), because the question this round asks is where
 * a size-teaching block earns its keep AFTER the pair already carries its own
 * slider, not in isolation. `inline` is drawn by NOT adding anything below them.
 *
 * ★ THE BRAIN IS STILL PRODUCTION'S. `recommendPlan` and `STOP_GB` are read
 * from `sections/pricing/`, never retyped, so all three options recommend
 * exactly what the live page recommends. The buy control stays dead
 * (`BuyButton`); the shipped calculator mounts a real `CheckoutButton`.
 */

export type Fit = "wall" | "split" | "inline";

const WALL_COLS = 12;
const WALL_ROWS = 4;
const WALL_CELLS = WALL_COLS * WALL_ROWS;
const WALL_IDS = MARKETING_IMAGES.filter(
  (m) => !m.id.startsWith("hero-candidate"),
).map((m) => m.id);
const CLIP_TIMES = ["0:08", "0:12", "0:24", "0:31"];

function OnceOrAgain({
  again,
  setAgain,
}: {
  again: boolean;
  setAgain: (v: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="How often you host"
      className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
        style={{ transform: `translateX(calc(${again ? 1 : 0} * (100% + 0.25rem)))` }}
      />
      {(["One event", "Hosting again"] as const).map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={again === (i === 1)}
          onClick={() => setAgain(i === 1)}
          className={cn(
            "relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
            again === (i === 1)
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── 1. Today: the slider over the filling album wall ────────────────────── */

function Wall() {
  const [stop, setStop] = useState(5);
  const [video, setVideo] = useState(true);
  const [again, setAgain] = useState(false);

  const bytes = STOP_GB[stop] * GIGABYTE;
  const rec = useMemo(
    () => recommendPlan({ bytes, video, hostingAgain: again }),
    [bytes, video, again],
  );
  const need = friendlyCapacity(bytes);
  const filled = Math.round(((stop + 1) / STOP_GB.length) * WALL_CELLS);

  return (
    <SectionShell
      id="fit"
      eyebrow="Fit"
      heading="Find your size."
      subhead="Slide to how much your event will collect, and we point at the plan that fits."
    >
      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card/40 p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-heading text-section tabular-nums">{formatBytes(bytes)}</span>
          <span className="text-right text-sm text-muted-foreground">
            about {need.photos.toLocaleString()} photos
            {video
              ? ` or ${
                  need.videoMinutes >= 120
                    ? `${Math.round(need.videoMinutes / 60).toLocaleString()} hours`
                    : `${need.videoMinutes.toLocaleString()} minutes`
                } of video`
              : ""}
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
            "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-foreground",
            "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground",
          )}
        />
        <div className="mt-2 flex justify-between text-[10px] tracking-[0.1em] text-faint uppercase">
          <span>{formatBytes(STOP_GB[0] * GIGABYTE)}</span>
          <span>{formatBytes(STOP_GB[STOP_GB.length - 1] * GIGABYTE)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Switch checked={video} onCheckedChange={setVideo} />
            <span className={video ? "" : "text-muted-foreground"}>Guests will add video</span>
          </label>
          <OnceOrAgain again={again} setAgain={setAgain} />
        </div>

        <div
          aria-hidden
          className="mt-6 grid gap-[var(--gap-gallery)] rounded-xl border bg-background/40 p-3"
          style={{ gridTemplateColumns: `repeat(${WALL_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: WALL_CELLS }, (_, i) => {
            const isFilled = i < filled;
            const isClip = video && isFilled && i % 7 === 3;
            const m = marketingImage(WALL_IDS[i % WALL_IDS.length]);
            return (
              <div key={i} className="relative aspect-square overflow-hidden rounded-tile bg-muted">
                {isFilled && !isClip ? (
                  <Image src={m.src} alt="" width={48} height={48} className="size-full object-cover" />
                ) : null}
                {isClip ? (
                  <div className="flex size-full items-center justify-center bg-foreground">
                    <span className="text-[7px] text-background tabular-nums">
                      {CLIP_TIMES[i % CLIP_TIMES.length]}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-faint">
          {formatBytes(bytes)} of the plan&apos;s {formatBytes(rec.plan.storageBytes)}
        </p>

        <Verdict rec={rec} />
      </div>
    </SectionShell>
  );
}

/* ── 2. Split: the configurator left, a designed result right ────────────── */

/** The result: a small DESIGNED PLAN CARD, not a text receipt (his ask). Built
 *  on the same photograph-plus-price grammar the real cards use, at a card's
 *  own size rather than the whole pair's, so it reads as a specific answer
 *  rather than a fourth plan. */
function ResultCard({ rec, bytes }: { rec: Recommendation; bytes: number }) {
  const cap = friendlyCapacity(rec.plan.storageBytes);
  const annual = annualPlanFor(rec.planId);
  const fill = Math.min(100, Math.round((bytes / rec.plan.storageBytes) * 100));
  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-lift sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-subsection">
            {rec.planId === "free" ? "Free" : rec.planId === "event_pass" ? "Event Pass" : rec.plan.name}
          </h3>
          <p className="mt-1 text-xs text-pretty text-muted-foreground">{rec.reason}</p>
        </div>
        <span className="shrink-0 font-heading text-lg font-semibold tabular-nums">{rec.plan.priceLabel}</span>
      </div>

      {/* The expected-room bar: how much of the recommended plan this slider
          setting actually spends, the one thing a flat card cannot show. */}
      <div>
        <div className="flex items-center justify-between text-[10px] tracking-[0.1em] text-faint uppercase">
          <span>Expected room</span>
          <span className="tabular-nums">{fill}% of {formatBytes(rec.plan.storageBytes)}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-150 ease-emphasis motion-reduce:transition-none"
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      <StatRow
        stats={[
          { value: formatBytes(rec.plan.storageBytes), label: "Storage" },
          { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
          { value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`, label: "Video" },
        ]}
      />

      {annual ? (
        <p className="-mt-2 text-xs text-faint">Or {annual.priceLabel} billed yearly, two months free.</p>
      ) : null}
      {rec.alternative ? <p className="-mt-2 text-xs text-pretty text-faint">{rec.alternative}</p> : null}

      <BuyButton className="w-full">
        {rec.planId === "free" ? "Start free" : rec.planId === "event_pass" ? "Buy a pass" : `Get ${rec.plan.name}`}
      </BuyButton>
    </div>
  );
}

function Split() {
  const [stop, setStop] = useState(5);
  const [video, setVideo] = useState(true);
  const [again, setAgain] = useState(false);
  const bytes = STOP_GB[stop] * GIGABYTE;
  const rec = useMemo(
    () => recommendPlan({ bytes, video, hostingAgain: again }),
    [bytes, video, again],
  );
  const need = friendlyCapacity(bytes);

  return (
    <SectionShell
      id="fit"
      eyebrow="Fit"
      heading="Find your size."
      subhead="Set the shape of your event on the left, and watch the answer take form on the right."
    >
      <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border bg-card/30">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          {/* The configurator: the recessed half. */}
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  How much room
                </span>
                <span className="font-heading text-subsection tabular-nums">{formatBytes(bytes)}</span>
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
                  "mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none",
                  "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-foreground",
                  "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground",
                )}
              />
              <div className="mt-2 flex justify-between text-[10px] tracking-[0.1em] text-faint uppercase">
                <span>{formatBytes(STOP_GB[0] * GIGABYTE)}</span>
                <span>about {need.photos.toLocaleString()} photos</span>
                <span>{formatBytes(STOP_GB[STOP_GB.length - 1] * GIGABYTE)}</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background/40 px-4 py-3 text-sm">
              <span className={video ? "" : "text-muted-foreground"}>Guests will add video</span>
              <Switch checked={video} onCheckedChange={setVideo} />
            </label>

            <div className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">How often you host</span>
              <OnceOrAgain again={again} setAgain={setAgain} />
            </div>
          </div>

          {/* The result: the elevated half, a designed plan card in a frame. */}
          <div className="flex flex-col gap-3 border-t bg-background/50 p-6 sm:p-8 lg:border-t-0 lg:border-l">
            <p className="text-xs text-muted-foreground">
              We recommend{" "}
              <span className="font-medium text-foreground">
                {rec.planId === "free" ? "Free" : rec.planId === "event_pass" ? "the Event Pass" : rec.plan.name}
              </span>
            </p>
            <ResultCard rec={rec} bytes={bytes} />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* ── 3. Inline: the wall is gone, the Pro card's own slider is the answer ──
 * Nothing renders here on purpose: the pair above (with Pro's own slider and
 * its StatRow) is already drawn by `FitBlock`, and this option's whole claim
 * is that nothing more is needed. A quiet strip says so, rather than leaving
 * a reviewer to wonder whether the page simply stopped short. */

function InlineNote() {
  return (
    <div className="mx-auto mt-10 max-w-4xl border-t border-dashed pt-6 text-center">
      <p className="text-sm text-pretty text-muted-foreground">
        No separate section here. Pro&apos;s own slider, just above, and the room it
        holds are the whole answer.
      </p>
    </div>
  );
}

/* ── The shared receipt (wall only; split builds its own designed card) ──── */

function Verdict({ rec }: { rec: Recommendation }) {
  const annual = annualPlanFor(rec.planId);
  return (
    <div aria-live="polite" className="mt-5 rounded-xl border bg-background/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-heading text-subsection">
          {rec.planId === "free" ? "Free covers it" : rec.planId === "event_pass" ? "The Event Pass fits" : `${rec.plan.name} fits`}
        </p>
        <span data-pp-price className="text-lg font-semibold tabular-nums">
          {rec.plan.priceLabel}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{rec.reason}</p>
      {annual ? <p className="mt-1.5 text-xs text-faint">Or {annual.priceLabel} billed yearly, two months free.</p> : null}
      {rec.alternative ? <p className="mt-3 text-xs text-pretty text-faint">{rec.alternative}</p> : null}
      <div className="mt-5">
        <BuyButton variant="outline">
          {rec.planId === "free" ? "Start free" : rec.planId === "event_pass" ? "Buy a pass" : `Get ${rec.plan.name}`}
        </BuyButton>
      </div>
    </div>
  );
}

/* ── The section, over the real pair and ticket ──────────────────────────── */

export function FitBlock({ fit }: { fit: Fit }) {
  return (
    <>
      <PlanPairGivenWithContext />
      {fit === "wall" ? <Wall /> : fit === "split" ? <Split /> : <InlineNote />}
    </>
  );
}

/** The given pair and ticket, wrapped once so `FitBlock` reads as one shape
 *  whichever option is on stage. */
function PlanPairGivenWithContext() {
  return (
    <SectionShell id="plans" eyebrow="Pricing" heading="Free and Pro, side by side.">
      <div className="mt-8">
        <PlanPairGiven />
        <PassTicketGiven />
      </div>
    </SectionShell>
  );
}
