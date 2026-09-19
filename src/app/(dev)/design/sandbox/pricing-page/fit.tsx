"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  recommendPlan,
  type Recommendation,
} from "@/components/marketing/sections/pricing/recommend";
import { STOP_GB } from "@/components/marketing/sections/pricing/calculator";
import { Switch } from "@/components/ui/switch";
import {
  MARKETING_IMAGES,
  marketingImage,
} from "@/lib/constants/marketing-media";
import {
  annualPlanFor,
  formatCapacity,
  friendlyCapacity,
  GIGABYTE,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { BuyButton } from "./scene";

/**
 * "FIND YOUR SIZE": THE PAGE'S ONE PIECE OF TEACHING, THREE WAYS.
 *
 * Nobody knows what 100 GB of a wedding looks like, which is the whole reason
 * a storage-priced page needs this block at all. The question is how much
 * machinery that is worth: today's slider over a filling album wall (the ruled
 * V1, 2026-08-27), one flat line of capacity under the plans, or the two
 * questions that actually change the answer.
 *
 * ★ THE BRAIN IS PRODUCTION'S, NOT A COPY. `recommendPlan` and its stop ladder
 * are imported from `sections/pricing/`, where `recommend.test.ts` pins every
 * answer, so all three options here recommend exactly what the live page
 * recommends. Only the chrome around it differs, and the buy control is dead
 * (`BuyButton`): the shipped calculator mounts a real `CheckoutButton`.
 */

export type Fit = "wall" | "cut" | "ask";

const WALL_COLS = 12;
const WALL_ROWS = 4;
const WALL_CELLS = WALL_COLS * WALL_ROWS;
const WALL_IDS = MARKETING_IMAGES.filter(
  (m) => !m.id.startsWith("hero-candidate"),
).map((m) => m.id);
const CLIP_TIMES = ["0:08", "0:12", "0:24", "0:31"];

/** The receipt, shared by the two options that compute one. */
function Verdict({ rec }: { rec: Recommendation }) {
  const annual = annualPlanFor(rec.planId);
  return (
    <div aria-live="polite" className="mt-5 rounded-xl border bg-background/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-heading text-subsection">
          {rec.planId === "free"
            ? "Free covers it"
            : rec.planId === "event_pass"
              ? "The Event Pass fits"
              : `${rec.plan.name} fits`}
        </p>
        <span data-pp-price className="text-lg font-semibold tabular-nums">
          {rec.plan.priceLabel}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{rec.reason}</p>
      {annual ? (
        <p className="mt-1.5 text-xs text-faint">
          Or {annual.priceLabel} billed yearly, two months free.
        </p>
      ) : null}
      {rec.alternative ? (
        <p className="mt-3 text-xs text-pretty text-faint">{rec.alternative}</p>
      ) : null}
      <div className="mt-5">
        <BuyButton variant="outline">
          {rec.planId === "free"
            ? "Start free"
            : rec.planId === "event_pass"
              ? "Buy a pass"
              : `Get ${rec.plan.name}`}
        </BuyButton>
      </div>
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
    <div className="rounded-2xl border bg-card/40 p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-heading text-section tabular-nums">
          {formatBytes(bytes)}
        </span>
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
          <span className={video ? "" : "text-muted-foreground"}>
            Guests will add video
          </span>
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
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-tile bg-muted"
            >
              {isFilled && !isClip ? (
                <Image
                  src={m.src}
                  alt=""
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
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
  );
}

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

/* ── 2. Cut: one flat line of capacity, and nothing computes ─────────────── */

function Flat() {
  const free = planById("free");
  const pass = planById("event_pass");
  const pro = plansForTier("pro");
  const rows = [
    { name: free.name, room: formatBytes(free.storageBytes), holds: formatCapacity(free.storageBytes, { video: false }) },
    { name: pass.name, room: formatBytes(pass.storageBytes), holds: formatCapacity(pass.storageBytes) },
    {
      name: "Pro",
      room: `${formatBytes(pro[0].storageBytes)} to ${formatBytes(pro[pro.length - 1].storageBytes)}`,
      holds: `up to ${formatCapacity(pro[pro.length - 1].storageBytes)}`,
    },
  ];
  return (
    <div className="mx-auto max-w-3xl divide-y rounded-2xl border bg-card/40">
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
        >
          <span className="font-heading text-subsection">{r.name}</span>
          <span className="text-sm font-medium tabular-nums">{r.room}</span>
          <span className="text-sm text-muted-foreground sm:text-right">
            holds about {r.holds}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── 3. Two questions, no slider ─────────────────────────────────────────── */

function Ask() {
  const [video, setVideo] = useState(true);
  const [again, setAgain] = useState(false);
  // No slider, so the size question is answered by the honest default for a
  // whole event: the pass's own room, which is what one party collects.
  const rec = useMemo(
    () =>
      recommendPlan({
        bytes: (again ? 500 : 75) * GIGABYTE,
        video,
        hostingAgain: again,
      }),
    [video, again],
  );
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border bg-card/40 p-6 sm:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Is this one event, or will you host again?</span>
          <OnceOrAgain again={again} setAgain={setAgain} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">Will guests add video?</span>
          <Switch checked={video} onCheckedChange={setVideo} />
        </div>
      </div>
      <Verdict rec={rec} />
    </div>
  );
}

/* ── The section ─────────────────────────────────────────────────────────── */

const HEAD: Record<Fit, { eyebrow: string; heading: string; subhead: string }> = {
  wall: {
    eyebrow: "Fit",
    heading: "Find your size.",
    subhead:
      "Slide to how much your event will collect, and we point at the plan that fits.",
  },
  cut: {
    eyebrow: "Room",
    heading: "What each plan holds.",
    subhead: "Typical phone photos and 1080p video. No calculator, no guessing game.",
  },
  ask: {
    eyebrow: "Fit",
    heading: "Two questions.",
    subhead: "They are the only two that change the answer, so they are the only two we ask.",
  },
};

export function FitBlock({ fit }: { fit: Fit }) {
  const head = HEAD[fit];
  return (
    <SectionShell id="fit" eyebrow={head.eyebrow} heading={head.heading} subhead={head.subhead}>
      <div className="mx-auto mt-12 max-w-3xl">
        {fit === "wall" ? <Wall /> : fit === "cut" ? <Flat /> : <Ask />}
      </div>
    </SectionShell>
  );
}
