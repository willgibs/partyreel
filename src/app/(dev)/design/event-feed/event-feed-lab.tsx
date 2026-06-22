"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw } from "lucide-react";

import { MotionTuner } from "@/components/dev/motion-tuner";
import { EVENT_PAGE_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  GallerySection,
  PillRow,
  ReelSection,
  ReviewsSection,
  type Filter,
  type ReviewsState,
  type SectionKey,
} from "./feed-sections";
import { GALLERY_TILES, REEL_TILES, REVIEW_TILES } from "./sample-feed";
import { useFlip } from "./use-flip";

// C3 (the motion reorder) is dynamic-imported so `motion` ships ONLY when C3 is
// selected, inside this gated dev route - never the production app bundle.
const MotionReorder = dynamic(
  () => import("./reorder-motion").then((m) => m.MotionReorder),
  { ssr: false },
);

function readMs(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const n = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(varName).trim(),
    10,
  );
  return Number.isFinite(n) ? n : fallback;
}

type PillVariant = "A1" | "A2" | "A3";
type SwapVariant = "B1" | "B2" | "B3";
type ReorderVariant = "C1" | "C2" | "C3";

export function EventFeedLab() {
  const [reviewsState, setReviewsState] = useState<ReviewsState>("pending");
  const [pillVariant, setPillVariant] = useState<PillVariant>("A1");
  const [swapVariant, setSwapVariant] = useState<SwapVariant>("B2");
  const [reorderVariant, setReorderVariant] = useState<ReorderVariant>("C2");
  const [filter, setFilter] = useState<Filter>("all");
  const [cleared, setCleared] = useState(false);
  const [beatOn, setBeatOn] = useState(false);

  const { sentinelRef, inView } = useInViewSentinel<HTMLDivElement>();

  // Urgency order: Reviews floats to the top while there's a queue; else it sinks last.
  const reviewsFirst = reviewsState === "pending" && !cleared;
  const order: SectionKey[] = reviewsFirst
    ? ["reviews", "gallery", "reel"]
    : ["gallery", "reel", "reviews"];
  const flipRegister = useFlip(order.join());

  function onClear() {
    if (beatOn || cleared) return;
    setBeatOn(true);
    window.setTimeout(() => {
      setBeatOn(false);
      setCleared(true); // flips the order -> the C variant animates the reorder
    }, 850);
  }
  function reset() {
    setCleared(false);
    setBeatOn(false);
    setFilter("all");
  }

  const reviewsCount = reviewsFirst ? REVIEW_TILES.length : undefined;
  const labelFor = (k: SectionKey) =>
    k === "reviews"
      ? {
          value: "reviews" as Filter,
          label: "Reviews",
          count: reviewsCount,
          amber: true,
        }
      : k === "gallery"
        ? {
            value: "gallery" as Filter,
            label: "Gallery",
            count: GALLERY_TILES.length,
          }
        : { value: "reel" as Filter, label: "Reel", count: REEL_TILES.length };
  const pills = [
    { value: "all" as Filter, label: "All" },
    ...order.map(labelFor),
  ];

  const nodeFor = (k: SectionKey) =>
    k === "reviews" ? (
      <ReviewsSection
        state={reviewsState}
        cleared={cleared}
        beatOn={beatOn}
        onClear={onClear}
      />
    ) : k === "gallery" ? (
      <GallerySection />
    ) : (
      <ReelSection />
    );

  // The feed body. The C reorder applies only in the "all" stack.
  let feed: React.ReactNode;
  if (filter !== "all") {
    feed = nodeFor(filter as SectionKey);
  } else if (reorderVariant === "C3") {
    feed = (
      <div className="space-y-8">
        <MotionReorder
          items={order.map((k) => ({ key: k, node: nodeFor(k) }))}
          durationMs={readMs("--tune-reorder-ms", 360)}
        />
      </div>
    );
  } else {
    feed = (
      <div className="space-y-8">
        {order.map((k) => (
          <div
            key={k}
            ref={reorderVariant === "C2" ? flipRegister(k) : undefined}
          >
            {nodeFor(k)}
          </div>
        ))}
      </div>
    );
  }

  // B swap: re-key the feed on filter change so the entrance (@starting-style) re-fires;
  // B1 is instant (no data hook), B2 crossfade+rise, B3 adds the blur-mask.
  const swapAttrs =
    swapVariant === "B1"
      ? {}
      : {
          "data-section-swap": "",
          ...(swapVariant === "B3" ? { "data-blur": "" } : {}),
        };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-40">
      <header className="py-6">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          The lab · prototype
        </p>
        <h1 data-dir-display className="mt-1 text-3xl tracking-tight">
          Event feed
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          The host event page as a stacked, pill-filtered feed. Scroll to feel
          the pills (A), tap pills for the swap (B), Approve all for the reorder
          (C). The panel switches variants + Reviews states; the tuner times
          them.
        </p>
        <div className="mt-6">
          <h2 data-dir-display className="text-2xl tracking-tight">
            Maya &amp; Jay&rsquo;s Wedding
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            June 14 · 34 photos · 12 guests
          </p>
        </div>
      </header>

      {/* A — pill behavior */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {pillVariant === "A2" ? (
        <>
          <div className="py-2">
            <PillRow pills={pills} active={filter} onSelect={setFilter} />
          </div>
          {!inView && (
            <div className="fixed top-4 left-3 z-30 rounded-full border border-border bg-background/90 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.12)] backdrop-blur lg:left-[244px]">
              <PillRow
                pills={pills}
                active={filter}
                onSelect={setFilter}
                condensed
              />
            </div>
          )}
        </>
      ) : (
        <div
          data-stuck={!inView ? "" : undefined}
          className="sticky top-0 z-30 -mx-4 px-4 py-2 transition-[box-shadow,border-color] duration-200 data-[stuck]:border-b data-[stuck]:border-border data-[stuck]:bg-background/85 data-[stuck]:backdrop-blur"
        >
          <PillRow
            pills={pills}
            active={filter}
            onSelect={setFilter}
            condensed={pillVariant === "A3" && !inView}
          />
        </div>
      )}

      {/* B swap + the feed */}
      <div key={filter} {...swapAttrs} className="mt-4">
        {feed}
      </div>

      <LabControls
        reviewsState={reviewsState}
        setReviewsState={(s) => {
          setReviewsState(s);
          reset();
        }}
        pillVariant={pillVariant}
        setPillVariant={setPillVariant}
        swapVariant={swapVariant}
        setSwapVariant={setSwapVariant}
        reorderVariant={reorderVariant}
        setReorderVariant={setReorderVariant}
        onReset={reset}
      />
      <MotionTuner controls={EVENT_PAGE_TUNER_CONTROLS} />
    </div>
  );
}

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
              value === o.v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LabControls({
  reviewsState,
  setReviewsState,
  pillVariant,
  setPillVariant,
  swapVariant,
  setSwapVariant,
  reorderVariant,
  setReorderVariant,
  onReset,
}: {
  reviewsState: ReviewsState;
  setReviewsState: (s: ReviewsState) => void;
  pillVariant: PillVariant;
  setPillVariant: (v: PillVariant) => void;
  swapVariant: SwapVariant;
  setSwapVariant: (v: SwapVariant) => void;
  reorderVariant: ReorderVariant;
  setReorderVariant: (v: ReorderVariant) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="fixed bottom-3 left-3 z-[9998] w-64 font-mono">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm"
      >
        {open ? "Hide" : "Prototype controls"}
      </button>
      {open && (
        <div className="space-y-2.5 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Seg
            label="Reviews"
            value={reviewsState}
            onChange={setReviewsState}
            options={[
              { v: "pending", label: "Queue" },
              { v: "caught-up", label: "Clear" },
              { v: "moderation-off", label: "Off" },
            ]}
          />
          <div className="border-t border-border/60" />
          <Seg
            label="A · pills"
            value={pillVariant}
            onChange={setPillVariant}
            options={[
              { v: "A1", label: "Sticky" },
              { v: "A2", label: "Float" },
              { v: "A3", label: "Condense" },
            ]}
          />
          <Seg
            label="B · swap"
            value={swapVariant}
            onChange={setSwapVariant}
            options={[
              { v: "B1", label: "Instant" },
              { v: "B2", label: "Fade" },
              { v: "B3", label: "Blur" },
            ]}
          />
          <Seg
            label="C · reorder"
            value={reorderVariant}
            onChange={setReorderVariant}
            options={[
              { v: "C1", label: "Collapse" },
              { v: "C2", label: "FLIP" },
              { v: "C3", label: "motion" },
            ]}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onReset}
          >
            <RotateCcw /> Reset
          </Button>
        </div>
      )}
    </div>
  );
}
