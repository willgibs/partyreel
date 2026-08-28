"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { STOP_GB } from "@/components/marketing/sections/pricing/calculator";
import { recommendPlan } from "@/components/marketing/sections/pricing/recommend";
import { marketingImage, MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { friendlyCapacity, GIGABYTE } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

/**
 * Touchpoint: PRICING CALCULATOR (the pricing round, 2026-08-27).
 *
 * The shipped /pricing#fit uses the restrained receipt meter. This page decides
 * whether the slider earns its delight layer:
 *
 *  V1 ALBUM FILL — the slider fills a tiny album wall with real tiles (the
 *     "Watch your album fill up" golden line made mechanical). Video ON swaps
 *     every seventh tile to a clip tile with a duration chip. Newly filled
 *     tiles pop with an 80ms scale; reduced motion just appears.
 *  V2 RECEIPT METER — the shipped baseline, reproduced here so the two sit on
 *     one screen for the ruling.
 *
 * Both share the shipped stop ladder + the pure recommendPlan brain, so the
 * verdict line is identical: only the EXPRESSION differs.
 */

const WALL_COLS = 12;
const WALL_ROWS = 4;
const WALL_CELLS = WALL_COLS * WALL_ROWS;
const WALL_IDS = MARKETING_IMAGES.filter(
  (m) => !m.id.startsWith("hero-candidate"),
).map((m) => m.id);

function useCalc() {
  const [stop, setStop] = useState(5);
  const [video, setVideo] = useState(true);
  const [again, setAgain] = useState(false);
  const bytes = STOP_GB[stop] * GIGABYTE;
  const rec = useMemo(
    () => recommendPlan({ bytes, video, hostingAgain: again }),
    [bytes, video, again],
  );
  return { stop, setStop, video, setVideo, again, setAgain, bytes, rec };
}

function Controls({
  calc,
}: {
  calc: ReturnType<typeof useCalc>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        type="range"
        min={0}
        max={STOP_GB.length - 1}
        step={1}
        value={calc.stop}
        onChange={(e) => calc.setStop(Number(e.target.value))}
        aria-label="Storage"
        className="h-1.5 w-56 cursor-pointer appearance-none rounded-full bg-border [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
      />
      <span className="w-16 font-mono text-sm tabular-nums">
        {formatBytes(calc.bytes)}
      </span>
      <label className="flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={calc.video}
          onChange={(e) => calc.setVideo(e.target.checked)}
        />
        video
      </label>
      <label className="flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={calc.again}
          onChange={(e) => calc.setAgain(e.target.checked)}
        />
        hosting again
      </label>
    </div>
  );
}

function Verdict({ calc }: { calc: ReturnType<typeof useCalc> }) {
  return (
    <p className="text-sm">
      <span className="font-heading">{calc.rec.plan.name}</span>{" "}
      <span className="font-mono text-xs tabular-nums">
        {calc.rec.plan.priceLabel}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {calc.rec.reason}
      </span>
    </p>
  );
}

function AlbumFill() {
  const calc = useCalc();
  // The wall fills proportionally to the slider's position along the ladder,
  // so the FEELING of growth is linear even though the bytes are not.
  const filled = Math.round(
    ((calc.stop + 1) / STOP_GB.length) * WALL_CELLS,
  );
  return (
    <div className="space-y-4">
      <Controls calc={calc} />
      <div
        className="grid gap-1 rounded-xl border bg-background p-3"
        style={{ gridTemplateColumns: `repeat(${WALL_COLS}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: WALL_CELLS }, (_, i) => {
          const isFilled = i < filled;
          const isClip = calc.video && isFilled && i % 7 === 3;
          const m = marketingImage(WALL_IDS[i % WALL_IDS.length]);
          return (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-[2px] bg-muted"
            >
              {isFilled && !isClip && (
                <Image
                  src={m.src}
                  alt=""
                  width={40}
                  height={40}
                  className="size-full animate-in object-cover duration-150 zoom-in-75 motion-reduce:animate-none"
                />
              )}
              {isClip && (
                <div className="flex size-full items-center justify-center bg-foreground animate-in duration-150 zoom-in-75 motion-reduce:animate-none">
                  <span className="font-mono text-[6px] text-background">
                    0:12
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Verdict calc={calc} />
    </div>
  );
}

function ReceiptMeter() {
  const calc = useCalc();
  const cap = friendlyCapacity(calc.bytes);
  const pct = Math.min(
    100,
    Math.round((calc.bytes / calc.rec.plan.storageBytes) * 100),
  );
  return (
    <div className="space-y-4">
      <Controls calc={calc} />
      <div className="rounded-xl border bg-background p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span>
            about {cap.photos.toLocaleString()} photos
            {calc.video && ` or ${Math.round(cap.videoMinutes / 60)} h of video`}
          </span>
          <span className="font-mono text-xs tabular-nums">
            {formatBytes(calc.bytes)} / {formatBytes(calc.rec.plan.storageBytes)}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-emphasis motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Verdict calc={calc} />
    </div>
  );
}

export function PricingCalculatorVariants() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
            V1
          </span>
          <h3 className="font-heading text-lg">Album fill</h3>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The slider fills a tiny album wall with real tiles; video swaps in
          clip tiles. The golden line made mechanical: watch your album fill
          up.
        </p>
        <div className={cn("rounded-2xl border bg-card/40 p-6")}>
          <AlbumFill />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
            V2
          </span>
          <h3 className="font-heading text-lg">Receipt meter</h3>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The shipped baseline from /pricing#fit: the capacity meter and the
          plain receipt, no wall.
        </p>
        <div className="rounded-2xl border bg-card/40 p-6">
          <ReceiptMeter />
        </div>
      </section>
    </div>
  );
}
