"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { type Mode, Paste } from "@/components/lab";
import { MARKETING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import {
  getTunerServerSnapshot,
  getTunerSnapshot,
  setTunerValue,
  subscribeTuner,
} from "@/components/dev/tuner-store";


/**
 * THE LIGHT BOARD'S ATOMS (the review wave, 2026-09-14).
 *
 * Two rules decide everything in this file, and both come from what the board
 * is judging:
 *
 * 1. A LABEL IS NEVER INSIDE THE JUDGED AREA. Every cue on this board is an
 *    edge treatment, so a caption box drawn around a specimen would be a fifth
 *    cue competing with the four. Captions sit under the specimen, on the bare
 *    ground, in the ground's own muted ink.
 * 2. A SPECIMEN SITS ON THE GROUND, NOT IN A FRAME. Same reason. The
 *    glow-doctrine board learned this the other way round (its beam specimens
 *    are bare divs with no ring, and un-applying their lit surface to re-judge
 *    them would change what they are).
 */

/** The one line that says what the knobs currently hold, in plain words. A
 *  toggle says what it is; this says what it DOES, and it changes as it is
 *  pressed, which is the only way a control explains itself. */
export function KnobNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** The proposal a section lands on, stated on the board rather than in a doc. */
export function Proposal({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-2xl border-l-2 border-foreground/25 pl-3 text-xs leading-relaxed text-foreground">
      {children}
    </p>
  );
}

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

/** Body copy stand-in: the thing a floating layer has to detach FROM, and the
 *  thing an aurora must not wash over. Real line lengths, real leading. */
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
 * The composer sets it on the aurora's bands and the evidence block prints it
 * beside the lamp's clock, so it must be one number or the board is arguing
 * with itself. Three laps of --spill-cadence: the ratio is the proposal, not
 * the literal, and the cadence ruling picks the lamp's clock this multiplies.
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

/** Desktop lays a matrix out in columns; 375 cannot, so it pairs them. One
 *  helper rather than a responsive class, because the stage renders at a REAL
 *  viewport width and a breakpoint inside a zoomed stage would read the lab's
 *  width, not the stage's. */
export function matrixCols(mode: Mode, desktop: number): number {
  return mode === "desktop" ? desktop : 2;
}

/* ───────────────────────  ROUND TWO: THE SITE CONTROLS  ─────────────────── */

/**
 * A KNOB ON THE SITE. The cadence ruling is a token, not a block, and the
 * tuner already owns it: this writes the same override the panel's slider
 * writes, so "8s on the site" is one tap and then a walk.
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
 *  subscription; the store is the shared root, so a board reads it the same
 *  way rather than reaching into the panel. */
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
 * The board's invariant is that every number it prints is the number the stage
 * is rendering, and the clock row is where that is hardest to hold: the aurora
 * is `calc(var(--spill-cadence) * 3)` now, so the caption cannot be a literal.
 *
 * ★ IT READS THE COMPUTED CASCADE, NOT THE TUNER STORE, AND THE DIFFERENCE IS
 * THE WHOLE POINT. Tapping "8s on the site" writes an override into the store,
 * but the lab layout mounts CandidateStyle and NOT the tuner panel, so nothing
 * on a board page wears that override: the stage below keeps whatever the
 * sheet declares. A caption driven by the store would therefore print 24s over
 * a field still running at 33s, which is the same class of lie the literal was.
 * `getComputedStyle` on the element the stages inherit from cannot drift from
 * them by construction, and it also picks up an applied candidate block, which
 * is the one thing on a lab page that CAN move the token.
 *
 * It rides the tuner store's own subscription rather than an effect, so the
 * snapshot is a plain number React can compare: applying or clearing a block is
 * the only thing on a lab page that moves the token, and useSyncExternalStore
 * re-checks the snapshot after the commit that renders the block's <style>.
 * The server snapshot is the sheet's default, which is what a lab page with no
 * block applied computes anyway, so nothing flickers on hydration.
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

/**
 * THE WIPE (round three): one chapter, unlit on the left of the handle and lit
 * on the right of it.
 *
 * Round two printed the chapter twice, unlit above and lit below, 800px apart,
 * which asks a reviewer to hold a very quiet field in his memory while he
 * scrolls. The whole question about a light this low is "can you see it at
 * all", and the honest instrument for that is the two states touching. The
 * light layers are clipped at the handle; nothing else in the chapter moves,
 * so the seam down the middle IS the difference.
 *
 * ★ IT IS A RANGE INPUT ON PURPOSE. A custom drag handle would need pointer
 * capture, a keyboard story and a focus ring to be operable at all; a range
 * has all three for free, and the board is judged on the light rather than on
 * its own chrome.
 */
export function WipeControl({
  value,
  onChange,
  left = "Unlit",
  right = "Lit",
}: {
  value: number;
  onChange: (v: number) => void;
  left?: string;
  right?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-medium text-muted-foreground">
        {left}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={`Wipe between ${left} and ${right}`}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--foreground)" }}
        className="h-4 w-64 cursor-ew-resize"
      />
      <span className="text-[11px] font-medium text-muted-foreground">
        {right}
      </span>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {value}% lit
      </span>
    </div>
  );
}

/** Which drive the aurora's band takes: the mask the engine ships, or the
 *  cheap transform the evidence block measures against it. The board's own
 *  type; the kit knows nothing about lamps. */
export type GlowDriveId = "mask" | "transform";

/* ─────────────────────  ROUND FOUR: THE KIT'S FURNITURE  ────────────────── */

/**
 * THE TAKEAWAY (round four).
 *
 * Will's review of round three: the board read as "a fun research report
 * without many applicable takeaways to carry into the platform". `Proposal`
 * already stated what a section landed on, but it read as the end of an
 * argument. This states it as the thing to CARRY, in the kit's own words, and
 * every block on the board now ends in one. A specimen that cannot produce a
 * takeaway is cut rather than captioned.
 */
export function Takeaway({
  children,
  lands,
}: {
  children: React.ReactNode;
  /** What a wiring round types, if this one ends in a file. */
  lands?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-1 rounded-lg border border-foreground/25 bg-card px-3.5 py-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Takeaway
      </p>
      <p className="text-xs leading-relaxed text-foreground">{children}</p>
      {lands ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Lands as: </span>
          {lands}
        </p>
      ) : null}
    </div>
  );
}

/**
 * THE FOUR-QUESTION LAMP CARD, which design-system.md calls the anti-sprawl
 * mechanism: a placement that cannot answer all four cannot be built, and the
 * form is answerable by someone other than its author. Question one is restated
 * for this board's correction: not "what object is emitting" but "what PLACE is
 * the light entering from".
 */
export function LampCard({
  place,
  direction,
  colour,
  admitted,
}: {
  place: string;
  direction: string;
  colour: string;
  admitted: string;
}) {
  const rows = [
    ["Place", place],
    ["Direction", direction],
    ["Colour", colour],
    ["Admitted by", admitted],
  ];
  return (
    <dl className="grid max-w-2xl grid-cols-1 gap-x-4 gap-y-1 text-[11px] leading-relaxed sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-1.5">
          <dt className="shrink-0 font-medium text-foreground">{k}:</dt>
          <dd className="text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A treatment's production mount, beside the treatment. `Paste` in the body
 *  face (there is no mono face in the product), collapsed to its first lines
 *  with the whole block one click and one copy away. */
export function Recipe({ mount, label }: { mount: string; label?: string }) {
  return <Paste label={label ?? "The mount"} code={mount} lines={7} />;
}
