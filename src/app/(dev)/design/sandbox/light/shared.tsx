"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { MARKETING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import {
  getTunerServerSnapshot,
  getTunerSnapshot,
  setTunerValue,
  subscribeTuner,
} from "@/components/dev/tuner-store";

/**
 * THE LIGHT BOARD'S ATOMS (the review wave, 2026-09-14; cut to what the catalog
 * uses at the revamp, 2026-09-16).
 *
 * Two rules decide everything in this file, and both come from what the board
 * is judging:
 *
 * 1. A LABEL IS NEVER INSIDE THE JUDGED AREA. Every cue on this board is an
 *    edge treatment, so a caption box drawn around a specimen would be a fifth
 *    cue competing with the four. Captions sit under the specimen, on the bare
 *    ground, in the ground's own muted ink.
 * 2. A SPECIMEN SITS ON THE GROUND, NOT IN A FRAME. Same reason.
 *
 * ★ WHAT LEFT AT THE REVAMP. `Takeaway`, `Proposal`, `KnobNote` and `LampCard`
 * were the round-four board's voice: a paragraph under every specimen saying
 * what to carry away from it. The catalog's card says the same thing in a line
 * and four facts, and the reading budget counts the difference (round five was
 * 10,164 words outside its folds). A specimen that needs a paragraph to be read
 * is the specimen that should change.
 */

/** A real photograph, because two grey rectangles cannot argue about whether
 *  two photographs need separating. Sized in CSS by the caller. */
export function Photo({
  id,
  className,
  style,
  cue,
  sizes = "240px",
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  /** board.css's depth cue, applied to the photograph's own box. */
  cue?: string;
  sizes?: string;
}) {
  const img = marketingImage(id);
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius: "var(--radius-tile)", ...style }}
      data-lgt-cue={cue}
    >
      <Image src={img.src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}

/** Body copy stand-in: the thing a floating layer has to detach FROM. Real line
 *  lengths, real leading. */
export function Copy({
  lines = 3,
  width = 280,
  className,
}: {
  lines?: number;
  width?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)} style={{ width }}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full bg-foreground/15"
          style={{ width: `${i === lines - 1 ? 58 : 92 - i * 6}%` }}
        />
      ))}
    </div>
  );
}

/**
 * THE AURORA'S CLOCK, the board's one home for it.
 *
 * Three laps of --spill-cadence: the ratio is the proposal, not the literal,
 * and the cadence ruling picks the lamp's clock this multiplies.
 *
 * ★ EVERY AURORA ON THE BOARD PASSES THIS EXACT STRING, AND board.css SECTION
 * 6 IS WHAT MAKES IT RESOLVE. Round four moved the clock from a literal ("33s")
 * to the sibling token, which is right (the ratio follows the cadence knobs
 * instead of contradicting them) but the token was declared nowhere the board
 * loads, so every band it reached computed animation-name: none and the aurora
 * sat frozen with its base still lit. The token now has a declaration; do not
 * pass a bare literal here again, and do not reference a token this board does
 * not declare. The full anatomy of the failure is in board.css section 6.
 */
export const AURORA_DUR = "var(--aurora-cadence)";

/** Which drive the aurora's band takes: the mask the engine ships, or the cheap
 *  transform. The board's own type; the kit knows nothing about lamps. */
export type GlowDriveId = "mask" | "transform";

/**
 * A CROP OPENS ON THE MIDDLE OF ITS CANVAS, NOT ON ITS LEFT GUTTER.
 *
 * ★ THE FIRST BUILD OF THIS ROUND SHOWED 440 PIXELS OF EMPTY MARGIN. A
 * marketing chapter is a centred column inside a 1440 canvas, so the left edge
 * of that canvas is gutter: the aurora card rendered the real closer, correctly
 * and at true size, and what a reviewer saw was the blank strip beside it. A
 * scroll offset is the honest fix, because it moves the WINDOW rather than the
 * specimen: every pixel is still the pixel the page ships, and the rest of the
 * section is one sideways scroll away in either direction.
 *
 * ★ IT IS A HOOK BECAUSE THE COMPILER SAYS SO. `react-hooks/immutability`
 * refuses `ref.current.scrollLeft = n` written inline against a ref another
 * hook returned ("consider moving the modification into the hook where the
 * value is constructed"), which is a fair rule and this is its answer: one
 * hook, three callers, one place to read it.
 */
export function useCentredCrop(
  ref: React.RefObject<HTMLDivElement | null>,
  ready: boolean,
  width: number,
) {
  const done = useRef(false);
  useEffect(() => {
    const box = ref.current;
    if (!box || !ready || done.current) return;
    // One pass, after the canvas exists: re-centring on every resize would
    // fight a reviewer who has scrolled the crop himself.
    box.scrollLeft = Math.max(0, (width - box.clientWidth) / 2);
    done.current = true;
  }, [ref, ready, width]);
}

/* ─────────────────────────  THE SITE'S OWN CLOCK  ───────────────────────── */

/**
 * A KNOB ON THE SITE. The cadence ruling is a token, not a block, and the tuner
 * already owns it: this writes the same override the panel's slider writes, so
 * "8s on the site" is one tap and then a walk.
 *
 * ★ THE CONTROL OBJECT IS THE KEY, NOT THE STRING. setTunerValue keys off
 * control.cssVar and compares against control.default to decide whether to
 * store an override or drop one, so passing a hand-made object with the wrong
 * default would leave a phantom override that Reset never clears.
 */
const CADENCE = MARKETING_TUNER_CONTROLS.find(
  (c) => c.cssVar === "--spill-cadence",
);

/** The tuner's live overrides. motion-tuner.tsx keeps its own copy of this
 *  subscription; the store is the shared root, so a board reads it the same way
 *  rather than reaching into the panel. */
function useTunerOverrides() {
  return useSyncExternalStore(
    subscribeTuner,
    getTunerSnapshot,
    getTunerServerSnapshot,
  );
}

/**
 * THE TWO CLOCKS AS NUMBERS, READ OFF THE PAGE ITSELF.
 *
 * ★ IT READS THE COMPUTED CASCADE, NOT THE TUNER STORE, AND THE DIFFERENCE IS
 * THE WHOLE POINT. Tapping "8s on the site" writes an override into the store,
 * but the lab layout mounts CandidateStyle and NOT the tuner panel, so nothing
 * on a board page wears that override: the crops below keep whatever the sheet
 * declares. A caption driven by the store would therefore print 24s over a
 * field still running at 33s. `getComputedStyle` on the element the stages
 * inherit from cannot drift from them by construction, and it also picks up an
 * applied candidate block, which is the one thing on a lab page that CAN move
 * the token.
 */
export function useClocks(): { lamp: number; aurora: number } {
  const fallback = CADENCE ? Number(CADENCE.default) : 11;
  const lamp = useSyncExternalStore(
    subscribeTuner,
    () => {
      const seconds = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--spill-cadence",
        ),
      );
      return Number.isFinite(seconds) ? seconds : fallback;
    },
    () => fallback,
  );
  return { lamp, aurora: lamp * 3 };
}

export function CadenceKnob({ seconds }: { seconds: number }) {
  const live = useTunerOverrides();
  if (!CADENCE) return null;
  const current = live[CADENCE.cssVar] ?? CADENCE.default;
  const on = Number(current) === seconds;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setTunerValue(CADENCE, seconds)}
      className={cn(
        "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium tabular-nums transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
        on
          ? "bg-foreground text-background"
          : "border border-border bg-card text-foreground hover:border-foreground/30",
      )}
    >
      {seconds}s on the site
    </button>
  );
}
