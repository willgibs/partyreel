"use client";

import { type CSSProperties } from "react";

import {
  ApplyToSite,
  CellLabel,
  GroundBox,
  Labeled,
  ReplayButton,
  useMountOnApproach,
  useReplay,
  type Mode,
} from "@/components/lab";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { ReelFrame } from "@/components/marketing/frames";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { Glow } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import { PAPER_FIVE, PAPER_FIVE_VALUES, PAPER_FLAT_VALUES } from "./candidates";
import { Light, type Register } from "./composer";
import { CadenceKnob, useCentredCrop, useClocks } from "./shared";

/**
 * THE FOUR CALLS THAT ARE NOT A CARD (round six, the revamp, 2026-09-16).
 *
 * Everything that could be LOOKED at became a card in the catalog above, which
 * is what round six is for. What is left is the four things ruling twelve cards
 * cannot answer: an order, a number every lamp on the site shares, a row of
 * five hues on one ground, and a ratified colour being moved five degrees.
 *
 * ★ EACH ONE IS A PICTURE FIRST AND A SENTENCE SECOND. Round five asked all
 * four in prose under a wall of measurements, and Will answered none of them.
 * The clock is two crops of one real chapter touching; the hues are the same
 * real paper chapter three times; the beat is three frames with three Replays.
 * The order is the only one that is genuinely a list, and it is three rows.
 */

/** A window onto a real section at 1:1, mounted when the reader is near it. */
function Crop({
  ground,
  mode,
  height,
  style,
  children,
}: {
  ground: "cinema" | "paper";
  mode: Mode;
  height: number;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  const [box, near] = useMountOnApproach();
  const width = mode === "desktop" ? 1440 : 375;
  useCentredCrop(box, near, width);
  return (
    <div ref={box} className="overflow-x-auto" style={{ height }}>
      <GroundBox
        ground={ground}
        className="relative overflow-hidden rounded-lg"
        style={{ width, height, ...style }}
      >
        {/* The settled entrance (previews.tsx's Crop carries the full note). */}
        <div data-inview="true" className="h-full w-full">
          {near ? children : null}
        </div>
      </GroundBox>
    </div>
  );
}

/** The five hues as a row, read off the same strings the chapter beside it
 *  paints, so a swatch here cannot drift from a colour there. */
function Swatches({ row }: { row: readonly string[] }) {
  return (
    <div aria-hidden className="mt-1.5 flex gap-1">
      {row.map((c) => (
        <span
          key={c}
          className="h-3 flex-1 rounded-full"
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

/** The five, as a style object. A row is set on the wrapper the field reads
 *  from, never on the engine element, so the aurora's own vars still win. */
function five(row: readonly string[]): CSSProperties {
  return {
    "--lamp-1": row[0],
    "--lamp-2": row[1],
    "--lamp-3": row[2],
    "--lamp-4": row[3],
    "--lamp-5": row[4],
  } as CSSProperties;
}

/* ── 1. The order ────────────────────────────────────────────────────────── */

const SECOND: { id: string; name: string; lands: string; needs: string }[] = [
  {
    id: "home-arc",
    name: "The home page's two ends",
    lands:
      "The aurora at Accent on two sections: the guest ledger, and the closer above the footer.",
    needs: "The grain tile. A stand-in ships meanwhile.",
  },
  {
    id: "paper",
    name: "Paper",
    lands:
      "The five hues re-declared on the light ground, then the aurora on the paper chapters.",
    needs: "The palette board's paper ramp, in the same merge.",
  },
  {
    id: "features",
    name: "The feature pages",
    lands:
      "The seam on every feature hero with a screen; the throw and the lit face on the plates.",
    needs: "The media kit's feature art: these lights are sampled.",
  },
];

function Order() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SECOND.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <p className="text-[12px] font-medium">{s.name}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {s.lands}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            <span className="text-foreground">Needs: </span>
            {s.needs}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── 2. The clock ────────────────────────────────────────────────────────── */

function Clock({ mode, register }: { mode: Mode; register: Register }) {
  const clocks = useClocks();
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <Labeled
          name="At the lamp's clock"
          note={`--spill-cadence, ${clocks.lamp}s as this page computes it.`}
        >
          <Crop ground="cinema" mode={mode} height={280}>
            <div className="relative isolate h-full w-full overflow-hidden">
              <Light
                treatment="aurora"
                placement="both"
                ground="cinema"
                register={register}
                clock="lamp"
                height={280}
                grain={false}
                drive="mask"
              />
              <div className="relative">
                <NoApp />
              </div>
            </div>
          </Crop>
        </Labeled>
        <Labeled
          name="At the field's clock"
          note={`${clocks.aurora}s: three laps of the lamp, a sibling token.`}
        >
          <Crop ground="cinema" mode={mode} height={280}>
            <div className="relative isolate h-full w-full overflow-hidden">
              <Light
                treatment="aurora"
                placement="both"
                ground="cinema"
                register={register}
                clock="aurora"
                height={280}
                grain={false}
                drive="mask"
              />
              <div className="relative">
                <NoApp />
              </div>
            </div>
          </Crop>
        </Labeled>
      </div>
      {/* ★ THIS PAIR CANNOT SETTLE 8 AGAINST 11 AND IS NOT MEANT TO. Two crops
          show that two numbers are two numbers; they cannot show what three
          lamps a viewport apart feel like on a page you are scrolling, which is
          the actual question. So the ruling gets the instrument the tuner's
          slider has: write the token, leave the lab, walk the home page. */}
      <div className="flex flex-wrap items-center gap-2">
        <CadenceKnob seconds={8} />
        <CadenceKnob seconds={11} />
        <CellLabel className="mt-0 max-w-md">
          Writes the clock on the real site, for the walk. The crops above will
          not move: a lab page wears an applied block, not the tuner&rsquo;s
          overrides.
        </CellLabel>
      </div>
    </div>
  );
}

/* ── 3. The hues ─────────────────────────────────────────────────────────── */

const ROWS: {
  id: string;
  name: string;
  note: string;
  row: readonly string[];
}[] = [
  {
    id: "dark",
    name: "The dark five, unchanged",
    note: "What a paper lamp wears today. No override exists.",
    row: LAMP_SET,
  },
  {
    id: "flat",
    name: "One flat correction",
    note: "l 0.88, c 0.08 for every hue: the sampled path's answer.",
    row: PAPER_FLAT_VALUES,
  },
  {
    id: "hand-tuned",
    name: "The hand-tuned five",
    note: "85 and 155 lifted and desaturated; 255 and 305 carry the chroma.",
    row: PAPER_FIVE_VALUES,
  },
];

function Hues({ mode, register }: { mode: Mode; register: Register }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn("grid gap-4", mode === "desktop" ? "lg:grid-cols-3" : "")}
      >
        {ROWS.map((r) => (
          <Labeled key={r.id} name={r.name} note={r.note}>
            <Crop ground="paper" mode={mode} height={260} style={five(r.row)}>
              <div className="relative isolate h-full w-full overflow-hidden">
                <Light
                  treatment="aurora"
                  placement="both"
                  ground="paper"
                  register={register}
                  clock="aurora"
                  height={260}
                  grain={false}
                  drive="mask"
                />
                <div className="relative">
                  <Privacy />
                </div>
              </div>
            </Crop>
            <Swatches row={r.row} />
          </Labeled>
        ))}
      </div>
      <ApplyToSite block={PAPER_FIVE} />
    </div>
  );
}

/* ── 4. The beat ─────────────────────────────────────────────────────────── */

const LEANED: CSSProperties = {
  "--lamp-1": LAMP_SET[4],
  "--lamp-2": LAMP_SET[3],
  "--lamp-3": LAMP_SET[4],
  "--lamp-4": LAMP_SET[4],
  "--lamp-5": LAMP_SET[3],
} as CSSProperties;

const BEATS: { id: string; name: string; note: string }[] = [
  {
    id: "300",
    name: "As shipped",
    note: "An inset flash at the reel's hue, then nothing at all.",
  },
  {
    id: "house-five",
    name: "The house five",
    note: "The lamp set with no lean, decaying to a base.",
  },
  {
    id: "305",
    name: "The five, leaned to 305",
    note: "Narrowed toward violet. Five degrees, and a base.",
  },
];

function Beat({ mode }: { mode: Mode }) {
  return (
    <GroundBox ground="app-dark" className="overflow-hidden rounded-lg p-4">
      <div
        className={cn("grid gap-5", mode === "desktop" ? "sm:grid-cols-3" : "")}
      >
        {BEATS.map((b) => (
          <OneBeat key={b.id} id={b.id} name={b.name} note={b.note} />
        ))}
      </div>
    </GroundBox>
  );
}

function OneBeat({
  id,
  name,
  note,
}: {
  id: string;
  name: string;
  note: string;
}) {
  const { runId, replay } = useReplay();
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative" style={{ width: "min(268px, 100%)" }}>
        {id === "300" ? (
          <div className="relative overflow-hidden rounded-[var(--radius)]">
            <ReelFrame />
            {/* The shipped beat, verbatim: the production attribute and the
                production keyframe, re-keyed to replay. It declares nothing
                outside its animation, so its rest state is no state, which is
                the difference the other two are arguing with. */}
            <div
              key={runId}
              aria-hidden
              data-rxp-pubglow
              className="pointer-events-none absolute inset-0"
              style={{ borderRadius: "var(--radius)" }}
            />
          </div>
        ) : (
          <>
            <div
              aria-hidden
              className="absolute -inset-20"
              style={id === "305" ? LEANED : undefined}
            >
              <Glow
                shape="bloom"
                runId={runId}
                vars={{
                  "--glw-base": "0.22",
                  "--glw-strength": "0.72",
                  "--glw-reach": "62%",
                  "--glw-blur": "26px",
                }}
              />
            </div>
            <div className="relative">
              <ReelFrame />
            </div>
          </>
        )}
      </div>
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium">{name}</span>
        <span className="text-[10px] leading-snug text-muted-foreground">
          {note}
        </span>
        <span>
          <ReplayButton runId={runId} onReplay={replay} />
        </span>
      </figcaption>
    </figure>
  );
}

/* ── The section ─────────────────────────────────────────────────────────── */

export function OpenPart({
  mode,
  register,
}: {
  mode: Mode;
  register: Register;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Labeled
        name="The order"
        note="Phase 1, the shadows, is ruled. These three are the candidates for second."
      >
        <Order />
      </Labeled>
      <Labeled
        name="The clock"
        note="One real chapter, one register, one set of five. Only the clock differs."
      >
        <Clock mode={mode} register={register} />
      </Labeled>
      <Labeled
        name="The hues, on paper"
        note="One real paper chapter three times. The five hues are identical; the lightness and chroma per hue are not."
      >
        <Hues mode={mode} register={register} />
      </Labeled>
      <Labeled
        name="The publish beat"
        note="Three frames, three Replays. Watch what each leaves behind."
      >
        <Beat mode={mode} />
      </Labeled>
    </div>
  );
}
