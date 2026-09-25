"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import type { BoardState } from "@/components/lab/board-spec";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import {
  DEFAULT_ROW_STEP,
  perRowFor,
  ROW_STEP_COUNT,
  type RowStep,
} from "@/lib/shared/album-rows";
import { cn } from "@/lib/utils";

import { ALBUM, RowsAlbum } from "./album";
import { Canvas, Ground, readRows } from "./canvas";
import { SCREENS, screenOf, type ScreenId } from "./screens";

export type StepsOption = "menu" | "segments" | "pinch" | "both";

const STEPS = Array.from({ length: ROW_STEP_COUNT }, (_, i) => i as RowStep);

/** "5 a row", or "1 or 2 a row" for a step that alternates. */
export function perRowLabel(n: number): string {
  return Number.isInteger(n)
    ? `${n} a row`
    : `${Math.floor(n)} or ${Math.ceil(n)} a row`;
}

/** N small bars: a step drawn as the photographs a row it holds. */
function RowGlyph({ count }: { count: number }) {
  const n = Math.max(1, Math.round(count));
  return (
    <span aria-hidden className="flex h-3 items-stretch gap-px">
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="rounded-[1px] bg-current"
          style={{ width: n > 5 ? 2 : 3 }}
        />
      ))}
    </span>
  );
}

/**
 * THE STEPPED SLIDER: a stop a step (three since the round's pick, five when it
 * was asked), the densest at the left, the largest at the right (the Photos and
 * Finder slider's own direction: smaller to the left). Real radio buttons on a
 * drawn track, so a keyboard and a screen reader get a group of choices rather
 * than a range of pixels. Production's is `shared/density-control.tsx`.
 */
function StepSlider({
  step,
  onStep,
  box,
}: {
  step: RowStep;
  onStep: (s: RowStep) => void;
  box: number;
}) {
  // Position 0 is the densest (step 4), position 4 the largest (step 0).
  return (
    <div className="px-2 pt-1 pb-2">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <span aria-hidden className="grid size-3.5 grid-cols-3 gap-px">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="rounded-[1px] bg-current" />
          ))}
        </span>
        <div
          role="radiogroup"
          aria-label="Size"
          className="relative flex h-6 flex-1 items-center justify-between"
        >
          <span
            aria-hidden
            className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border"
          />
          {STEPS.map((pos) => {
            const s = (ROW_STEP_COUNT - 1 - pos) as RowStep;
            const on = s === step;
            return (
              <button
                key={pos}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={perRowLabel(perRowFor(box, s))}
                onClick={() => onStep(s)}
                className="relative flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "rounded-full transition-[width,height,background-color] duration-150 ease-emphasis",
                    on
                      ? "size-3.5 bg-foreground"
                      : "size-1.5 bg-muted-foreground/60",
                  )}
                />
              </button>
            );
          })}
        </div>
        <span aria-hidden className="size-3.5 rounded-[2px] bg-current" />
      </div>
    </div>
  );
}

/**
 * THE VIEW MENU, DRAWN OPEN. The real one is a radix dropdown, which portals
 * to the BOARD's body rather than the frame's, so the lab draws it by hand on
 * the shipped panel's own parts (`floatingPanel`, `floatingRow`, the group
 * label's type): the trigger, and the panel under it with the steps as one
 * more group beside the ones the guest's menu already carries.
 */
function DrawnViewMenu({
  step,
  onStep,
  box,
}: {
  step: RowStep;
  onStep: (s: RowStep) => void;
  box: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-action border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.97]"
      >
        <SlidersHorizontal className="size-4" /> View
      </button>
      {open && (
        <div
          className={cn("absolute top-10 right-0 z-20 w-60 p-1", floatingPanel)}
        >
          <div className="flex items-baseline justify-between gap-3 px-2 pt-0.5 pb-1 text-xs text-foreground">
            <span className="opacity-70">Size</span>
            <span className="text-micro text-muted-foreground tabular-nums">
              {perRowLabel(perRowFor(box, step))}
            </span>
          </div>
          <StepSlider step={step} onStep={onStep} box={box} />
          <div className="px-2 pt-1.5 pb-1 text-xs text-foreground opacity-70">
            Showing
          </div>
          {["Everyone's", "Yours (6)"].map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex items-center py-1.5 pr-8 pl-2 text-sm",
                floatingRow,
                i === 0 && "bg-accent text-accent-foreground",
              )}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** SEGMENTS beside View (one a step), each drawn as the photographs a row it holds. */
function Segments({
  step,
  onStep,
  box,
}: {
  step: RowStep;
  onStep: (s: RowStep) => void;
  box: number;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <div
        role="radiogroup"
        aria-label="Size"
        className="inline-flex items-center gap-0.5 rounded-action bg-muted p-0.5"
      >
        {STEPS.map((s) => {
          const on = s === step;
          const count = perRowFor(box, s);
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={perRowLabel(count)}
              title={perRowLabel(count)}
              onClick={() => onStep(s)}
              className={cn(
                "flex h-7 min-w-9 cursor-pointer items-center justify-center rounded-[calc(var(--radius-action)_-_2px)] px-2 transition-colors active:scale-[0.97]",
                on
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RowGlyph count={count} />
            </button>
          );
        })}
      </div>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-action border border-border bg-background px-3 text-sm font-medium">
        <SlidersHorizontal className="size-4" /> View
      </span>
    </div>
  );
}

/**
 * PINCH, AND CTRL-SCROLL: the gesture itself, read straight off the events the
 * browser already sends. Two fingers on a touch screen (pointer events, the
 * distance between them), or a trackpad pinch, which Chrome and Safari both
 * deliver as a `wheel` with `ctrlKey` (so ctrl-and-scroll with a mouse is the
 * same gesture). A native listener, not React's: React's wheel listener is
 * passive, and a pinch that cannot `preventDefault` zooms the whole page.
 * Spreading the fingers makes the photographs bigger, as it does everywhere.
 */
function usePinchSteps(
  el: HTMLElement | null,
  step: RowStep,
  onStep: (s: RowStep) => void,
) {
  const stepRef = useRef(step);
  const onStepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = step;
    onStepRef.current = onStep;
  });
  useEffect(() => {
    if (!el) return;
    let wheel = 0;
    const nudge = (bigger: boolean) => {
      const next = stepRef.current + (bigger ? -1 : 1);
      if (next < 0 || next >= ROW_STEP_COUNT) return;
      stepRef.current = next as RowStep;
      onStepRef.current(next as RowStep);
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      wheel += e.deltaY;
      if (Math.abs(wheel) < 40) return;
      nudge(wheel < 0);
      wheel = 0;
    };
    const points = new Map<number, { x: number; y: number }>();
    let start = 0;
    const spread = () => {
      const [a, b] = [...points.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (e: PointerEvent) => {
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size === 2) start = spread();
    };
    const move = (e: PointerEvent) => {
      if (!points.has(e.pointerId)) return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size !== 2 || start === 0) return;
      const ratio = spread() / start;
      if (ratio > 1.25 || ratio < 0.8) {
        nudge(ratio > 1);
        start = spread();
      }
    };
    const up = (e: PointerEvent) => {
      points.delete(e.pointerId);
      if (points.size < 2) start = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [el]);
}

/** While pinching, the count; a beat later, nothing. */
function PinchCount({ label, shown }: { label: string; shown: boolean }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed top-6 left-1/2 z-30 -translate-x-1/2 rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-opacity duration-200",
        floatingPanel,
        shown ? "opacity-100" : "opacity-0",
      )}
    >
      {label}
    </div>
  );
}

/** The one line that tells a reader the gesture exists. */
function PinchHint({ touch }: { touch: boolean }) {
  return (
    <span className="inline-flex h-8 items-center rounded-full border border-dashed border-border px-3 text-xs text-muted-foreground">
      {touch ? "Pinch to resize" : "Pinch the trackpad, or ctrl and scroll"}
    </span>
  );
}

function StepsShowcase({
  option,
  screen,
  report,
}: {
  option: StepsOption;
  screen: ScreenId;
  report: (text: string) => void;
}) {
  const [step, setStep] = useState<RowStep>(DEFAULT_ROW_STEP);
  const [counting, setCounting] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  // The album box: the frame less the 20px gutters.
  const box = SCREENS[screen].w - 40;
  const phone = screen === "375";
  const pinch = option === "pinch" || option === "both";

  // The count shows while the fingers move and goes a beat after they stop.
  const quiet = useRef<ReturnType<typeof setTimeout> | null>(null);
  usePinchSteps(pinch ? root : null, step, (s) => {
    setStep(s);
    setCounting(true);
    if (quiet.current) clearTimeout(quiet.current);
    quiet.current = setTimeout(() => setCounting(false), 900);
  });
  useEffect(
    () => () => {
      if (quiet.current) clearTimeout(quiet.current);
    },
    [],
  );

  // What a row really holds now, read off the frame after the glide.
  useEffect(() => {
    if (!root) return;
    const t = setTimeout(() => {
      const rows = readRows(root).slice(0, -1);
      if (rows.length === 0) return;
      const mean = rows.reduce((n, r) => n + r.ids.length, 0) / rows.length;
      const where =
        option === "segments" && phone
          ? "no control on a phone: "
          : `step ${step + 1} of ${ROW_STEP_COUNT}: `;
      report(`${where}${mean.toFixed(1)} photos a row, measured`);
    }, 700);
    return () => clearTimeout(t);
  }, [root, step, option, phone, report]);

  let control: ReactNode = null;
  if (option === "menu" || option === "both")
    control = <DrawnViewMenu step={step} onStep={setStep} box={box} />;
  else if (option === "segments" && !phone)
    control = <Segments step={step} onStep={setStep} box={box} />;

  return (
    <div
      ref={setRoot}
      className="min-h-full"
      style={pinch ? { touchAction: "pan-y" } : undefined}
    >
      <Ground>
        {/* The gesture's hint on the left, the control on the right: an open
            menu never covers the line that says pinch works too. */}
        <div className="mb-3 flex min-h-8 items-start justify-between gap-3">
          <div>{pinch && <PinchHint touch={phone} />}</div>
          <div className="min-w-0 flex-1">{control}</div>
        </div>
        <RowsAlbum
          items={ALBUM}
          step={option === "segments" && phone ? DEFAULT_ROW_STEP : step}
        />
      </Ground>
      {pinch && (
        <PinchCount
          label={perRowLabel(perRowFor(box, step))}
          shown={counting}
        />
      )}
    </div>
  );
}

const TITLE: Record<StepsOption, string> = {
  menu: "A stepped slider in View",
  segments: "Segments at a desk",
  pinch: "Pinch, no control",
  both: "The slider, and pinch too",
};

export function stepsPreview(state: BoardState, option: StepsOption) {
  const screen = screenOf(state.screen);
  return (
    <Canvas id={`steps-${option}`} screen={screen} title={TITLE[option]}>
      {(report) => (
        <StepsShowcase option={option} screen={screen} report={report} />
      )}
    </Canvas>
  );
}
