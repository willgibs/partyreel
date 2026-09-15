"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Mode,
} from "@/components/dev/board";
import { MARKETING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import {
  getTunerServerSnapshot,
  getTunerSnapshot,
  setTunerValue,
  subscribeTuner,
} from "@/components/dev/tuner-store";

import type { LightCandidate } from "./candidates";

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

/** The board's own text sizes. The lab's caption atom is `text-xs`; a board
 *  this dense wants one step under it for the per-cell labels, and the label is
 *  the body face with tabular figures, never a mono face (bible 7 is retiring). */
export function CellLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 text-[11px] leading-snug text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A named specimen: the thing, then its label. `note` is the one line that
 *  says what this cell is evidence FOR; `proposed` marks the cell the board
 *  lands on.
 *
 *  ★ THE MARK IS IN THE LABEL, NEVER AROUND THE SPECIMEN. A dashed outline at
 *  an offset is the obvious way to say "this one", and on a board whose whole
 *  subject is edge treatments it is a fifth cue: the eye reads the outlined
 *  card as the one with the extra edge. Tried it, removed it. */
export function Cell({
  name,
  note,
  proposed,
  className,
  children,
}: {
  name: string;
  note?: string;
  proposed?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {children}
      </div>
      <CellLabel>
        <span
          className={cn(
            "font-medium",
            proposed ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {proposed ? (
          <span className="block text-foreground">
            <span className="mr-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-foreground align-middle" />
            {proposed}
          </span>
        ) : null}
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/**
 * A labelled FULL-WIDTH block: a stage and the line that says what it is.
 *
 * ★ NOT `Cell`. Cell centres its child in a flex row, and Stage measures the
 * box it is given to decide its zoom, so a Stage inside a flex row shrinks to
 * its content width, measures ~100px and renders a 1440px canvas at 7 percent.
 * It looks like a thumbnail and nothing about it says it is wrong. Stages go
 * here; specimens go in Cell.
 */
export function Labeled({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col">
      {children}
      <CellLabel>
        <span className="font-medium text-foreground">{name}</span>
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/** A section of the board: the heading, the call it answers, the case for the
 *  section, the stages.
 *
 *  ★ ROUND THREE: `rules` IS NOT DECORATION. Walking this board cold, the one
 *  thing a stranger could not tell at any point was which ruling the stage in
 *  front of them belonged to: the asks lived only in the meta panel, seventeen
 *  thousand pixels down. Every part now says its own call at the top, in the
 *  same words the panel uses, and the index at the top of the board links
 *  here. One array in board.tsx feeds all three, so they cannot drift. */
export function Part({
  n,
  title,
  rules,
  lede,
  children,
}: {
  n: string;
  title: string;
  /** The ask (or asks) this part answers, verbatim from the board's ASKS. */
  rules?: string[];
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // The id is the part's anchor: five parts on one long board, and a ruling
    // conversation wants to point at one of them.
    <section id={`lgt-${n.toLowerCase()}`} className="flex flex-col gap-4">
      <div className="max-w-2xl scroll-mt-6">
        <h2 className="text-sm font-semibold tracking-tight">
          <span className="mr-2 text-muted-foreground tabular-nums">{n}</span>
          {title}
        </h2>
        {rules?.length ? (
          <ul className="mt-2 space-y-1">
            {rules.map((r) => (
              <li
                key={r}
                className="flex gap-2 text-[11px] leading-snug text-foreground"
              >
                <span
                  aria-hidden
                  className="mt-[5px] size-1.5 shrink-0 rounded-full bg-foreground"
                />
                <span>
                  <span className="text-muted-foreground">Rule on: </span>
                  {r}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-1.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {lede}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * A TOGGLE WITH ITS NAME BESIDE IT (round three).
 *
 * The board shell's Toggle carries an ariaLabel and nothing visible, which is
 * right for a board with one control and wrong for part B, which has six in
 * two rows: "Accent | Identity" and "House five | Warm | Cool" sitting side by
 * side with no names on them is the first thing a stranger stumbles over, and
 * no amount of prose further down repairs it, because the prose is read after
 * the control is pressed. The name goes on the control.
 */
export function Knob({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

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
 * Part B sets it on the aurora's bands and part C puts it on a strip beside the
 * two under ruling, so it must be one number or the board is arguing with
 * itself. Three laps of --spill-cadence: the ratio is the proposal, not the
 * literal, and the ruling on part C picks the lamp's clock this multiplies.
 */
export const AURORA_CADENCE = "33s";

/** Desktop lays a matrix out in columns; 375 cannot, so it pairs them. One
 *  helper rather than a responsive class, because the stage renders at a REAL
 *  viewport width and a breakpoint inside a zoomed stage would read the lab's
 *  width, not the stage's. */
export function matrixCols(mode: Mode, desktop: number): number {
  return mode === "desktop" ? desktop : 2;
}

/* ───────────────────────  ROUND TWO: THE SITE CONTROLS  ─────────────────── */

/**
 * "APPLY TO THE SITE" (round two, 2026-09-14).
 *
 * A board proposes CSS; the shell can now hand that exact CSS to every page
 * with a tuner island, so a candidate is judged on the real dashboard and the
 * real pricing page rather than only on a stage. One block stands at a time,
 * so this control is a RADIO across the board's candidates and not a checkbox
 * on each: the store's newest block replaces the last, and showing four
 * independent "Applied" states while only one is live would be a lie.
 *
 * The button reads the store rather than local state (useTunerCandidate), so
 * clearing from the tuner panel, or applying a different board's block in
 * another tab of the lab, is reflected here on the next render.
 */
export function ApplyToSite({
  candidate,
  className,
}: {
  candidate: LightCandidate;
  className?: string;
}) {
  const applied = useTunerCandidate();
  const on = applied?.label === candidate.label;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() =>
          on ? clearCandidate() : setCandidateCss(candidate.label, candidate.css)
        }
        aria-pressed={on}
        className={cn(
          "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
          on
            ? "bg-foreground text-background"
            : "border border-border bg-card text-foreground hover:border-foreground/30",
        )}
      >
        {on ? "Applied to the site" : "Apply to the site"}
      </button>
      {on ? (
        <span className="text-[11px] text-muted-foreground">
          Walk: {candidate.pages}. It persists until you clear it.
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">
          {candidate.what}
        </span>
      )}
    </div>
  );
}

/** The board's own clear, so a walk can be ended without hunting for the tuner
 *  panel. Renders nothing while no block stands. */
export function AppliedBanner() {
  const applied = useTunerCandidate();
  if (!applied) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/25 bg-card px-3 py-2 text-[11px]">
      <span className="font-medium text-foreground">
        On the site: {applied.label}
      </span>
      <button
        type="button"
        onClick={clearCandidate}
        className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
      >
        Clear
      </button>
    </div>
  );
}

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
 * The ruling as a paste: the exact block, in the body face (there is no mono
 * face in the product), with the copy the Orchestrator would land.
 *
 * ★ ROUND THREE: COLLAPSED BY DEFAULT, AND THAT IS A JUDGEMENT ABOUT THE WALK.
 * Nine of these at full height were 6,300px of the board, more than a third of
 * it, and a reviewer does not read CSS and markdown end to end on a walk: he
 * checks that the block exists, that it says what the stage above it said, and
 * copies it. Collapsed, part E is a list of nine landings he can scan in one
 * screen and open one at a time. Nothing is hidden that a click does not
 * return, and the Copy button always copies the WHOLE block, open or not.
 */
export function Paste({
  css,
  label,
  lines = 6,
}: {
  css: string;
  label: string;
  /** How many lines the collapsed preview shows. */
  lines?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const total = css.split("\n").length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-[12px] font-medium">{label}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
        >
          {open ? "Collapse" : `Read all ${total} lines`}
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(css).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              },
              () => setCopied(false),
            );
          }}
          className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        data-lgt-paste={open ? undefined : ""}
        style={{ "--lgt-paste-lines": lines } as React.CSSProperties}
        className="overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-sans text-[11px] leading-relaxed whitespace-pre tabular-nums"
      >
        {css}
      </pre>
    </div>
  );
}

/* ──────────────────────  ROUND THREE: THE WALK'S TOOLS  ─────────────────── */

/**
 * THE INDEX OF WHAT IS BEING RULED ON (round three).
 *
 * The board is seventeen thousand pixels and the asks were at the bottom of
 * it. A walk that starts by reading the eight calls, each one a link to the
 * part that argues it, is a different walk: the reviewer knows what he is
 * being asked before the first stage rather than after the last. The array is
 * the board's ASKS, so the index, each part's own header and the meta panel
 * are one source and cannot drift.
 */
export type Ask = {
  /** The part that argues it: "a" .. "e", the anchor's own letter. */
  at: string;
  /** The ask, verbatim. One word answers it. */
  text: string;
};

export function RuleIndex({ asks }: { asks: Ask[] }) {
  return (
    <div className="flex max-w-2xl flex-col gap-2 rounded-lg border border-foreground/15 bg-card px-4 py-3">
      <p className="text-[12px] font-medium">
        The calls, in the order the board argues them
      </p>
      <ol className="flex flex-col gap-1">
        {asks.map((a, i) => (
          <li key={a.text} className="flex gap-2 text-[11px] leading-snug">
            <span className="w-4 shrink-0 text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            <a
              href={`#lgt-${a.at}`}
              className="text-muted-foreground underline decoration-foreground/20 underline-offset-2 transition-colors duration-150 ease-emphasis hover:text-foreground hover:decoration-foreground/50 motion-reduce:transition-none"
            >
              <span className="mr-1.5 font-medium text-foreground uppercase">
                {a.at}
              </span>
              {a.text}
            </a>
          </li>
        ))}
      </ol>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The first one is the whole board. The seven under it are the individual
        calls inside it, so answer only the ones you want to differ on.
      </p>
    </div>
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

/* ────────────────────────────  THE COST METER  ──────────────────────────── */

export type GlowDriveId = "mask" | "transform";

const PHASES: { id: "off" | GlowDriveId; label: string }[] = [
  { id: "off", label: "No lamp (the chapter alone)" },
  { id: "mask", label: "The aurora as built (mask drive)" },
  { id: "transform", label: "The same aurora, transform drive" },
];

type Row = {
  label: string;
  mean: number;
  worst: number;
  dropped: number;
  frames: number;
};

function sampleFrames(ms: number): Promise<Row["mean"][]> {
  return new Promise((resolve) => {
    const gaps: number[] = [];
    let last = performance.now();
    const start = last;
    const step = (now: number) => {
      gaps.push(now - last);
      last = now;
      if (now - start < ms) requestAnimationFrame(step);
      else resolve(gaps.slice(1));
    };
    requestAnimationFrame(step);
  });
}

/**
 * WHAT THE AURORA COSTS, MEASURED HERE, NOW (round three).
 *
 * Every other number on this board is a value someone chose. These are the two
 * that have to be measured or they are worth nothing: what the field costs to
 * run, and how much of the screen it is filtering. So the board measures
 * rather than claims.
 *
 * ★ THE MEASUREMENT ISOLATES ITS SPECIMEN. Twenty-two lamps are mounted on
 * this board and a frame time taken with all of them running measures the
 * board, not the proposal. While it runs, board.css hides every lamp except
 * the one inside [data-lgt-solo-target], which is the specimen directly above
 * the meter, and the three phases differ in exactly one thing each.
 *
 * ★ AND IT REPORTS WHAT IT CANNOT SEE. A frame gap counts the frames the page
 * MISSED; it cannot see how hard the GPU worked to make the ones it hit. So
 * the static half of this block (the filtered area, the layer count) is the
 * part that carries over to a slower machine, and the line under the table
 * says so rather than letting a clean 60 read as "free".
 */
export function CostMeter({
  drive,
  setDrive,
  targetRef,
}: {
  drive: GlowDriveId;
  setDrive: (d: GlowDriveId) => void;
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [facts, setFacts] = useState<string | null>(null);
  const running = useRef(false);

  // The static half: read off the specimen itself, so it is never a stale
  // literal. The stage is zoom-fitted to the column, so every measured box is
  // divided back out to the 1:1 pixels the chapter would really paint.
  useEffect(() => {
    const host = targetRef.current;
    if (!host) return;
    const stage = host.querySelector<HTMLElement>("[data-ground]");
    const fields = [...host.querySelectorAll<HTMLElement>("[data-glw-field]")];
    if (!stage || !fields.length) return;
    const zoom = Number(getComputedStyle(stage).zoom) || 1;
    const dpr = window.devicePixelRatio || 1;
    const box = fields[0].getBoundingClientRect();
    const w = Math.round(box.width / zoom);
    const h = Math.round(box.height / zoom);
    const mpx = ((w * h * dpr * dpr) / 1e6).toFixed(1);
    const layers = host.querySelectorAll("[data-glw] div").length;
    const filter = getComputedStyle(fields[0]).filter.replace(/"/g, "");
    setFacts(
      `${fields.length} lamps and ${layers} painted layers: a filtered field each, over a resting base and a travelling band. Each field is ${w} by ${h} css pixels at 1:1, ${mpx} megapixels at this screen's ${dpr}x, and each one carries ${filter}.`,
    );
  }, [targetRef, drive]);

  async function run() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setRows(null);
    const out: Row[] = [];
    const root = document.documentElement;
    const before = drive;
    try {
      for (const p of PHASES) {
        if (p.id !== "off") setDrive(p.id);
        root.dataset.lgtSolo = p.id === "off" ? "none" : "target";
        // One beat for React to commit the phase and for the compositor to
        // settle before the clock starts; a sample taken across the switch
        // measures the switch.
        await new Promise((r) => window.setTimeout(r, 650));
        const gaps = await sampleFrames(1800);
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        out.push({
          label: p.label,
          mean: Number(mean.toFixed(1)),
          worst: Number(Math.max(...gaps).toFixed(1)),
          dropped: gaps.filter((g) => g > 17).length,
          frames: gaps.length,
        });
      }
    } finally {
      delete root.dataset.lgtSolo;
      setDrive(before);
      setRows(out);
      setBusy(false);
      running.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className={cn(
            "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
            busy
              ? "border border-border bg-card text-muted-foreground"
              : "bg-foreground text-background",
          )}
        >
          {busy ? "Measuring, about six seconds" : "Measure the three states"}
        </button>
        <span className="text-[11px] text-muted-foreground">
          Three 1.8 second samples on the chapter above, every other lamp on the
          board hidden while it runs.
        </span>
      </div>

      {facts ? (
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            What is on the screen:{" "}
          </span>
          {facts}
        </p>
      ) : null}

      {rows ? (
        <div className="max-w-2xl overflow-x-auto">
          <table className="w-full text-left text-[11px] tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-4 font-medium">State</th>
                <th className="py-1 pr-4 font-medium">Mean frame</th>
                <th className="py-1 pr-4 font-medium">Longest</th>
                <th className="py-1 font-medium">Frames over 17ms</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-1.5 pr-4 text-foreground">{r.label}</td>
                  <td className="py-1.5 pr-4">{r.mean} ms</td>
                  <td className="py-1.5 pr-4">{r.worst} ms</td>
                  <td className="py-1.5">
                    {r.dropped} of {r.frames}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            A frame gap counts what the page MISSED, so three clean sixteens
            mean the field is inside budget on this machine, not that it is
            free: the work it does is raster the numbers above cannot see. The
            static line is the half that carries to a slower one.
          </p>
        </div>
      ) : null}
    </div>
  );
}
