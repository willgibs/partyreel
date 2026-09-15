"use client";

import { type CSSProperties, useRef, useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { Glow, type GlowVars } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import {
  AURORA_REGISTER,
  PAPER_FIVE,
  PAPER_FIVE_VALUES,
  PAPER_FLAT_VALUES,
} from "./candidates";
import { CHAPTERS, chapterById, type ChapterId } from "./chapters";
import {
  AURORA_CADENCE,
  ApplyToSite,
  CostMeter,
  Knob,
  KnobNote,
  Labeled,
  Part,
  Proposal,
  WipeControl,
  type GlowDriveId,
} from "./shared";

/**
 * PART B: THE LAMP WITHOUT MEDIA, AND THE AURORA.
 *
 * SPILL's law 1 as written ("if you cannot point at the object emitting, there
 * is no spill") does not admit the footer's seam, which is the one production
 * lamp with no media and the one Will named as the model. The law is not wrong
 * about what it was killing (even rims, concentric halos, a premium pill); it
 * is wrong about what it was looking for. A lamp does not need an OBJECT. It
 * needs a PLACE: an edge, a boundary, a screen, a plate, a horizon. The footer
 * seam has one, the rim of a button does not, and the same verdicts fall out.
 *
 * ── WHAT THE PART SHOWS, AND HOW IT GOT THERE ──
 *
 * Round one lit a chapter it had built itself: one heading, three centred
 * steps, a button, air at both boundaries. Every claim it made was true of
 * that specimen and unproven of the page. So the specimen is gone and the real
 * chapters are mounted in its place (chapters.tsx). Round two printed each one
 * twice, unlit above and lit below; round three puts the two states in ONE
 * frame with a wipe, because a field this quiet compared across 800px of
 * scroll is compared from memory.
 *
 * Four lights, and only the first two are candidates:
 *
 *   THE AURORA    both boundaries, low and slow, the hue set narrowed to the
 *                 chapter's temperature, the copy in the clean middle.
 *   THE SEAM      the footer's own lamp, unchanged in kind, at a chapter's top
 *                 edge. The tune: nothing new.
 *   THE MIDDLE    the same register, centred. The placement ERROR, demonstrated
 *                 rather than asserted, because "never the middle" is the half
 *                 of the grammar a wiring round is most likely to get wrong.
 *   THE ROOM      no boundary at all: one field behind everything.
 *
 * ★ THE ROOM IS THE THING THE ENGINE WARNS ABOUT, ON PURPOSE. globals.css: "a
 * seam is a band, not a fill ... generalising that away is what turns spill
 * into a wash sitting on the copy". The room is exactly that generalisation,
 * at a register low enough that it might survive it. It is on the board so the
 * warning can be tested rather than quoted, not so it can be chosen.
 *
 * The colour is the engine's own hook and not a new mechanism: [data-glw]
 * declares --glw-c1..5 as var(--lamp-*), and "an ancestor can retune these" is
 * written into globals.css as a feature. A chapter setting --lamp-* recolours
 * every lamp inside it, so a temperature is a narrowing of the identity's five,
 * never a sixth colour. That is the whole claim of the aurora as identity.
 */

type Candidate = "seam" | "aurora" | "middle" | "room";
type Register = "accent" | "identity";
type Temperature = "house" | "warm" | "cool";

/** ★ ROUND THREE: THE STRONGEST FIRST, AND THE LOSERS NAMED AS LOSERS. Round
 *  two lettered these A to D and led with the seam, which reads as a ranking
 *  and ranks the proposal third. Two of the four were never candidates at all:
 *  the middle is the placement error and the room is the engine's own warning,
 *  both on the board as evidence. Calling them candidates asked Will to rule
 *  on four options when there are two. */
const CANDIDATES: { id: Candidate; label: string }[] = [
  { id: "aurora", label: "The aurora" },
  { id: "seam", label: "The seam" },
  { id: "middle", label: "The middle: the error" },
  { id: "room", label: "The room: the warning" },
];

const REGISTERS: { id: Register; label: string }[] = [
  { id: "accent", label: "Accent" },
  { id: "identity", label: "Identity" },
];

const TEMPERATURES: { id: Temperature; label: string }[] = [
  { id: "house", label: "House five" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
];

const DRIVES: { id: GlowDriveId; label: string }[] = [
  { id: "mask", label: "Mask" },
  { id: "transform", label: "Transform" },
];

/** What each knob's current setting MEANS, in one line, under the knobs. A
 *  toggle says what it is; this says what it does. */
const REGISTER_NOTE: Record<Register, string> = {
  accent:
    "Accent: one chapter on a page carries the light, so it can be seen. Base 0.30 on cinema, 0.52 on paper.",
  identity:
    "Identity: every chapter carries it, which is only survivable much lower. Base 0.17 on cinema, 0.30 on paper.",
};

const TEMPERATURE_NOTE: Record<Temperature, string> = {
  house: "House five: the lamp set in its own order, nothing narrowed.",
  warm: "Warm: coral, amber and violet take all five slots. Green and blue drop out of the field.",
  cool: "Cool: blue, violet and green take the slots. A narrowing, never a sixth hue.",
};

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
];

/** A temperature is a re-ORDERING and narrowing of the five, never a new hue:
 *  the warm chapter drops green and blue out of the field and lets coral,
 *  amber and violet take their slots. Written from the literals in lamp-set.ts
 *  rather than as var(--lamp-n) aliases, so a slot can reference a slot this
 *  same block is also rewriting without a resolution cycle. */
function lampVars(
  ground: Ground,
  temp: Temperature,
  paperRow: readonly string[] = PAPER_FIVE_VALUES,
): CSSProperties {
  const base = ground === "paper" ? paperRow : LAMP_SET;
  const pick: Record<Temperature, number[]> = {
    house: [0, 1, 2, 3, 4],
    warm: [0, 1, 4, 0, 1],
    cool: [3, 4, 2, 3, 4],
  };
  const out: Record<string, string> = {};
  pick[temp].forEach((src, i) => {
    out[`--lamp-${i + 1}`] = base[src];
  });
  return out as CSSProperties;
}

/**
 * THE REGISTERS. Accent is one chapter on a page carrying the light; identity
 * is every chapter carrying it, which is only survivable much lower. The
 * difference is deliberately a RATIO on the same two knobs the footer ships
 * (0.62 base, 0.62 band) rather than a second set of shapes.
 *
 * ★ THE GROUND CHANGES THE NUMBERS, NOT THE REGISTER. Paper needs MORE opacity
 * for the same presence, not less, and that is the opposite of the instinct:
 * a tint at l 0.88 against a near-white page has far less contrast with its
 * ground than the same tint has against oklch(0.11), so the dark values read
 * as almost nothing on paper. Measured by eye on the board, both grounds side
 * by side. It is the same finding the paper register itself came from (sampled
 * light made a paper card "look dirty rather than lit"), one step further on.
 */
const REGISTER_VARS: Record<
  "dark" | "paper",
  Record<Register, { base: string; strength: string }>
> = {
  dark: {
    accent: { base: "0.30", strength: "0.13" },
    identity: { base: "0.17", strength: "0.07" },
  },
  paper: {
    accent: { base: "0.52", strength: "0.24" },
    identity: { base: "0.30", strength: "0.13" },
  },
};

function registerVars(ground: Ground, register: Register) {
  return REGISTER_VARS[ground === "paper" ? "paper" : "dark"][register];
}

/** One lamp, positioned. The bottom band is the same seam flipped on its own
 *  axis: the engine has no bottom-seam shape, and it should not grow one, since
 *  a seam's geometry is identical and only its direction differs (law 2 is
 *  about a vector, and a vector can be turned by the caller). */
function Band({
  edge,
  height,
  vars,
  drive = "mask",
}: {
  edge: "top" | "bottom";
  height: number;
  vars: GlowVars;
  drive?: GlowDriveId;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0"
      style={{
        [edge]: 0,
        height,
        ...(edge === "bottom" ? { scale: "1 -1" } : {}),
      }}
    >
      <Glow
        shape="seam"
        drive={drive}
        vars={{ "--glw-h": `${height}px`, ...vars } as never}
      />
    </div>
  );
}

function Lit({
  candidate,
  ground,
  register,
  height,
  grain,
  clock,
  drive = "mask",
  grainWipe,
}: {
  candidate: Candidate | null;
  ground: Ground;
  register: Register;
  height: number;
  grain: boolean;
  clock: string;
  drive?: GlowDriveId;
  /** Percent GRAINED, left to right, for the grain row's own wipe. */
  grainWipe?: number;
}) {
  const r = registerVars(ground, register);
  // ★ ONE GRAIN NODE, WIPED OR WHOLE. The grain row compares the same field
  // with and without the dither, and the two states have to touch or the
  // comparison is a memory test: a band's soft edge is the most forgettable
  // thing on this board.
  const grainNode = !grain ? null : grainWipe === undefined ? (
    <div data-lgt-grain className="absolute inset-0" />
  ) : (
    <>
      <div
        data-lgt-wipe
        style={{ "--lgt-wipe": `${100 - grainWipe}%` } as CSSProperties}
      >
        <div data-lgt-grain className="absolute inset-0" />
      </div>
      <div
        data-lgt-wipe-line
        aria-hidden
        style={{ "--lgt-wipe": `${100 - grainWipe}%` } as CSSProperties}
      />
    </>
  );
  if (candidate === null) return null;

  if (candidate === "seam") {
    // A: the footer's lamp verbatim. Its register is the SHIPPED one (0.62 /
    // 0.62 at 210px on the house cadence), not the aurora's, because the
    // candidate is "use the thing we already have" and re-tuning it would make
    // it a different candidate wearing its name.
    return (
      <Band
        edge="top"
        height={210}
        vars={{ "--glw-dur": "var(--spill-cadence)" }}
      />
    );
  }

  // The blur scales with the band: 16px on a 210px seam is the same softness
  // as roughly 44px on a 560px one, and the engine's --glw-blur is a literal,
  // not a ratio.
  const vars: GlowVars = {
    "--glw-base": r.base,
    "--glw-strength": r.strength,
    "--glw-dur": clock,
    "--glw-blur": "38px",
  };
  const band = Math.round(height * 0.42);

  if (candidate === "aurora") {
    return (
      <>
        <Band edge="top" height={band} vars={vars} drive={drive} />
        <Band edge="bottom" height={band} vars={vars} drive={drive} />
        {grainNode}
      </>
    );
  }

  if (candidate === "middle") {
    // C: the same light, the same register, the same clock, at the chapter's
    // MIDDLE. Nothing here is a strawman except the placement, which is the
    // point: the grammar is the only variable, so what goes wrong is
    // attributable to it and to nothing else.
    return (
      <>
        <div
          aria-hidden
          className="absolute inset-x-0"
          style={{ top: `calc(50% - ${Math.round(band / 2)}px)`, height: band }}
        >
          <Glow
            shape="seam"
            drive={drive}
            vars={{ "--glw-h": `${band}px`, ...vars } as never}
          />
        </div>
        {grainNode}
      </>
    );
  }

  // D: no boundary. `throw` has no shape rules of its own, so it is the base
  // engine: one radial field filling its wrapper, anchored by --glw-from-*.
  // Anchored low and centred, so the chapter sits on the light rather than
  // under it.
  return (
    <div aria-hidden className="absolute inset-0">
      <Glow
        shape="throw"
        drive={drive}
        vars={{
          ...vars,
          "--glw-blur": "48px",
          "--glw-from-x": "50%",
          "--glw-from-y": "88%",
          "--glw-reach": "120%",
        }}
      />
      {grainNode}
    </div>
  );
}

/** The chapter, on its stage, lit or not. One component for every specimen in
 *  this part, so a comparison can never accidentally differ in two things. */
function ChapterStage({
  id,
  mode,
  ground,
  candidate,
  register,
  temp,
  grain,
  clock = "var(--lgt-aurora-dur, 33s)",
  paperRow,
  drive,
  wipe,
  grainWipe,
  height: heightOverride,
}: {
  id: ChapterId;
  mode: Mode;
  ground: Ground;
  candidate: Candidate | null;
  register: Register;
  temp: Temperature;
  grain: boolean;
  clock?: string;
  paperRow?: readonly string[];
  drive?: GlowDriveId;
  /** Percent LIT, left to right. Undefined renders the light whole. */
  wipe?: number;
  /** Percent GRAINED, left to right. Undefined renders the grain whole. */
  grainWipe?: number;
  height?: number;
}) {
  const chapter = chapterById(id);
  const height = heightOverride ?? chapter.h[mode];
  const lit = (
    <Lit
      candidate={candidate}
      ground={ground}
      register={register}
      height={height}
      grain={grain}
      clock={clock}
      drive={drive}
      grainWipe={grainWipe}
    />
  );
  return (
    <Stage mode={mode} ground={ground} height={height}>
      {/* The shipped composition's skeleton: `relative isolate` so the light
          has something to pin to and cannot escape the chapter, the lamp
          first, the content after it and positioned, so the light stays behind
          the copy without a z-index anywhere. */}
      <div
        className="relative isolate flex h-full flex-col justify-center"
        style={lampVars(ground, temp, paperRow)}
      >
        {wipe === undefined ? (
          lit
        ) : (
          <>
            {/* The clip runs from the left, so the var is the UNLIT share. */}
            <div
              data-lgt-wipe
              style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
            >
              {lit}
            </div>
            <div
              data-lgt-wipe-line
              aria-hidden
              style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
            />
          </>
        )}
        <div className="relative">{chapter.render()}</div>
      </div>
    </Stage>
  );
}

/** The footer seam as the model: a page, then the ink slab it meets. This is
 *  the shipped composition, not an approximation of it (the glow and the
 *  hairline are siblings, the slab is `relative isolate`, the content is
 *  `relative` so the light stays behind it). */
function TheModel({ mode, ground }: { mode: Mode; ground: Ground }) {
  const small = mode === "phone";
  return (
    <Stage mode={mode} ground={ground} height={small ? 380 : 400}>
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex flex-1 items-end justify-center pb-10",
            small ? "px-6" : "px-10",
          )}
        >
          <p className="max-w-[46ch] text-center text-[13px] leading-relaxed text-muted-foreground">
            The page above the slab. Nothing here is emitting.
          </p>
        </div>
        <div className="surface-ink relative isolate bg-background text-foreground">
          <Glow shape="seam" vars={{ "--glw-dur": "var(--spill-cadence)" }} />
          <div data-glw-seamline aria-hidden />
          <div
            className={cn(
              "relative flex flex-col gap-2",
              small ? "px-6 py-10" : "px-12 py-14",
            )}
          >
            <p className="font-heading text-[22px]">Partyreel</p>
            <p className="text-[12px] text-muted-foreground">
              The light is the boundary, not an object on it.
            </p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/** The five, as swatches, so the paper proposal can be read as colour and not
 *  only as an effect. A lamp hue is LIGHT, so the swatch is the hue over the
 *  ground it will light rather than a filled chip on white. */
function FiveSwatches({
  row,
  label,
  ground,
}: {
  row: readonly string[];
  label: string;
  ground: Ground;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium">{label}</p>
      <div
        className={cn(
          "flex gap-1.5 rounded-lg p-2",
          ground === "paper" ? "bg-[oklch(0.97_0_0)]" : "bg-[oklch(0.11_0_0)]",
        )}
      >
        {row.map((c) => (
          <span
            key={c}
            className="h-9 flex-1 rounded-md"
            style={{ background: c }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums">
        {row.join("  ")}
      </p>
    </div>
  );
}

export function AuroraPart({
  mode,
  rules,
}: {
  mode: Mode;
  rules: string[];
}) {
  const [ground, setGround] = useState<Ground>("cinema");
  const [chapter, setChapter] = useState<ChapterId>("guests");
  const [candidate, setCandidate] = useState<Candidate>("aurora");
  const [register, setRegister] = useState<Register>("accent");
  const [temp, setTemp] = useState<Temperature>("house");
  const [grain, setGrain] = useState(true);
  const [drive, setDrive] = useState<GlowDriveId>("mask");
  // The wipe opens at half, which is the whole point of it: the first frame a
  // reviewer sees already has the unlit chapter and the lit one touching.
  const [wipe, setWipe] = useState(50);
  const specimen = useRef<HTMLDivElement | null>(null);
  const current = chapterById(chapter);

  return (
    <Part
      n="B"
      title="Lamps without media: the model, then the aurora on real chapters"
      rules={rules}
      lede={
        <>
          <p>
            First the model, unedited: the footer seam, the one shipped lamp
            with nothing emitting. Its lamp is a place, the boundary between two
            grounds, and that is the correction law 1 needs. A rim on a button
            is still refused, because a rim is not a place.
          </p>
          <p>
            Then the question that opens: a chapter has boundaries of its own,
            so how big can an honest lamp be? Four candidates, on the home
            arc{"'"}s actual media-less chapters, each one printed twice, unlit
            and lit, because the only honest question about a field this quiet
            is whether you can see it at all with the unlit version beside it.
            The third candidate is the error: the same light at the middle
            instead of the boundaries.
          </p>
        </>
      }
    >
      <Knob label="Ground">
        <Toggle
          ariaLabel="Ground"
          options={GROUNDS}
          value={ground}
          onChange={setGround}
        />
      </Knob>

      <Labeled
        name="The model"
        note="footer-glow.tsx as it ships: seam, 210px, 0.62 base and band, the house five, the site cadence."
      >
        <TheModel mode={mode} ground={ground} />
      </Labeled>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
        <Knob label="Chapter">
          <Toggle
            ariaLabel="Chapter"
            options={CHAPTERS.map((c) => ({ id: c.id, label: c.label }))}
            value={chapter}
            onChange={setChapter}
          />
        </Knob>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Knob label="Light">
          <Toggle
            ariaLabel="Candidate"
            options={CANDIDATES}
            value={candidate}
            onChange={setCandidate}
          />
        </Knob>
        <Knob label="Register">
          <Toggle
            ariaLabel="Register"
            options={REGISTERS}
            value={register}
            onChange={setRegister}
          />
        </Knob>
        <Knob label="Temperature">
          <Toggle
            ariaLabel="Temperature"
            options={TEMPERATURES}
            value={temp}
            onChange={setTemp}
          />
        </Knob>
        <Knob label="Grain">
          <Toggle
            ariaLabel="Grain"
            options={[
              { id: "on", label: "On" },
              { id: "off", label: "Off" },
            ]}
            value={grain ? "on" : "off"}
            onChange={(v) => setGrain(v === "on")}
          />
        </Knob>
      </div>

      <KnobNote>
        <span className="font-medium text-foreground">{current.label}</span>{" "}
        ships on {current.ships === "paper" ? "paper" : "the cinema room"}.{" "}
        {current.note}
        <span className="mt-1 block">{REGISTER_NOTE[register]}</span>
        <span className="block">{TEMPERATURE_NOTE[temp]}</span>
        {candidate === "seam" ? (
          <span className="mt-1 block text-foreground">
            The seam is the footer{"'"}s lamp verbatim, so it keeps the shipped
            register (0.62 base and band, 210px, the site cadence), the shipped
            mask drive, and no grain. The register, grain and drive knobs do
            not move it, and that is the candidate rather than an omission:
            re-tune any of them and it is a different candidate wearing its
            name. The other three lights take the drive toggle.
          </span>
        ) : null}
      </KnobNote>

      {/* ★ ONE STAGE, WIPED, RATHER THAN TWO STACKED. Round two printed the
          chapter unlit and then lit, 800px apart, and asked the eye to carry a
          field this quiet across the gap. Here the two states touch: drag the
          handle and the light arrives across the chapter, with the copy, the
          rules and the type identical on both sides of it. */}
      <WipeControl value={wipe} onChange={setWipe} />

      <div ref={specimen} data-lgt-solo-target>
        <Labeled
          name={CANDIDATES.find((c) => c.id === candidate)?.label ?? ""}
          note={`${NOTES[candidate]} Left of the handle is the chapter exactly as it ships.`}
        >
          <ChapterStage
            id={chapter}
            mode={mode}
            ground={ground}
            candidate={candidate}
            register={register}
            temp={temp}
            grain={grain}
            drive={drive}
            wipe={wipe}
          />
        </Labeled>
      </div>

      <Proposal>
        A lamp needs a place, not an object: an edge, a boundary, a screen, a
        plate, a horizon. The aurora is the largest honest one. It is a register
        (a low base, a band near zero, and higher numbers on paper than on
        cinema, because a tint has less contrast with a near white page than
        with a near black room), a placement grammar (the chapter{"'"}s own
        boundaries, never its middle, never centred on a card or a control, and
        never a fill: the copy lives in the clean band between them), and a
        clock several times slower than a lamp{"'"}s. Its colour is the house
        five narrowed to a temperature by the section above it, which is the one
        way marketing carries colour of its own without growing a sixth.
      </Proposal>

      <ApplyToSite candidate={AURORA_REGISTER} />

      <CostRow
        drive={drive}
        setDrive={setDrive}
        specimen={specimen}
        candidate={candidate}
      />

      <DriftRow mode={mode} chapter={chapter} ground={ground} temp={temp} />

      <PaperFiveRow mode={mode} temp={temp} />

      <GrainRow mode={mode} chapter={chapter} ground={ground} temp={temp} />
    </Part>
  );
}

/* ──────────────────────────────  THE COST  ──────────────────────────────── */

/**
 * WHAT THE FIELD COSTS, AND THE DRIVE FINDING UNDER IT (round three).
 *
 * The aurora is the one proposal on this board that ADDS work to every frame,
 * and two rounds asserted it was cheap without measuring it. It is also the
 * one place where the engine already has a cheaper option and the doctrine
 * never said which to use: [data-glw-drive] is "mask" by default, a static
 * colour field windowed by a travelling mask, which globals.css itself calls
 * "faithful but repainting every frame", against "transform", which moves the
 * comet on the compositor and which the same comment calls "the cheap one".
 * At pill size that difference is noise. At chapter size it is two filtered
 * layers of roughly 1500 by 360 css pixels each.
 *
 * ★ AND THE CHEAP DRIVE ARRIVES WITH A LAW 4 DEFECT, WHICH IS THE REAL
 * FINDING. glw-drift-x runs from translate 32% to -32%, and the rest state
 * outside the reduced-motion block is therefore translate 0: the comet parked
 * dead centre at full --glw-strength. That is precisely the bug the mask drive
 * had fixed when its resting mask-position was moved to its own from-keyframe
 * ("the band at full strength was that law inverted", globals.css). Nobody has
 * seen it because no shipped lamp uses the transform drive. Switching the
 * field to it without that one line would hand every reduced-motion visitor
 * the brightest frame of the animation as their permanent state. The line is
 * in part E.
 */
function CostRow({
  drive,
  setDrive,
  specimen,
  candidate,
}: {
  drive: GlowDriveId;
  setDrive: (d: GlowDriveId) => void;
  specimen: React.RefObject<HTMLDivElement | null>;
  candidate: Candidate;
}) {
  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
        <h3 className="text-[13px] font-semibold text-foreground">
          What it costs, and which drive it should take
        </h3>
        <p>
          A field at chapter scale is the one thing on this board that adds work
          to every frame, so the board measures it rather than claiming it is
          cheap. The engine already has two ways to move a lamp and the doctrine
          never said which a field should take: the mask drive repaints the
          whole filtered layer every frame, and the transform drive moves the
          comet on the compositor. globals.css calls the second one the cheap
          one in its own comment.
        </p>
        <p>
          Press the drive toggle and watch the light rather than the numbers
          first: the mask drive reads as a shimmer passing over a fixed field,
          the transform drive as a light source going by. If they are the same
          to you at this register, the field should take the cheap one.
        </p>
      </div>

      <Knob label="Drive">
        <Toggle
          ariaLabel="Drive"
          options={DRIVES}
          value={drive}
          onChange={setDrive}
        />
      </Knob>

      {candidate === "aurora" ? null : (
        <p className="text-[11px] text-muted-foreground">
          The drive and the meter act on the light above, whichever candidate is
          selected. The numbers below are the aurora{"'"}s when the aurora is
          the one showing.
        </p>
      )}

      <CostMeter drive={drive} setDrive={setDrive} targetRef={specimen} />

      <Proposal>
        The field takes the transform drive and a lamp keeps the mask drive:
        same light, a fraction of the repaint, and the difference between the
        two only reads at a size no lamp ever is. One line of the engine has to
        move with it, and it is a law 4 fix rather than a new feature: the
        transform band{"'"}s rest state is the comet parked dead centre at full
        strength, because glw-drift-x runs from 32 percent to minus 32 and zero
        is the middle of its travel. Declare the from-keyframe outside the
        reduced-motion block, exactly as the mask drive already does, and the
        cheap drive rests off-layer like every other lamp.
      </Proposal>
    </div>
  );
}

/* ─────────────────────────────  THE DRIFT  ──────────────────────────────── */

/**
 * A lamp's clock and a field's, on the same chapter, at the same moment.
 *
 * ★ THIS IS THE ONE COMPARISON THAT CANNOT BE MADE FROM A DESCRIPTION. "Three
 * laps of the lamp" is a ratio anyone can agree to on paper and nobody can
 * picture. Side by side, the lamp-clocked field reads as something moving
 * behind the copy and the slow one reads as the room having a temperature,
 * and that difference is the entire argument for --spill-cadence gaining a
 * sibling rather than a second opinion.
 */
function DriftRow({
  mode,
  chapter,
  ground,
  temp,
}: {
  mode: Mode;
  chapter: ChapterId;
  ground: Ground;
  temp: Temperature;
}) {
  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
        <h3 className="text-[13px] font-semibold text-foreground">
          The drift: a lamp{"'"}s clock and a field{"'"}s
        </h3>
        <p>
          The same chapter, the same register, the same five. Only the clock
          differs. A field the size of a chapter moving at a lamp{"'"}s eight to
          eleven seconds reads as something moving behind the copy; three laps
          of it reads as the room having a temperature. Watch the two together
          rather than either alone.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Labeled
          name="At the lamp's clock"
          note="--spill-cadence, whatever the tuner currently holds."
        >
          <ChapterStage
            id={chapter}
            mode={mode}
            ground={ground}
            candidate="aurora"
            register="accent"
            temp={temp}
            grain
            clock="var(--spill-cadence)"
          />
        </Labeled>
        <Labeled
          name="At the aurora's clock"
          note={`${AURORA_CADENCE}: three laps of the lamp, the proposed sibling token.`}
        >
          <ChapterStage
            id={chapter}
            mode={mode}
            ground={ground}
            candidate="aurora"
            register="accent"
            temp={temp}
            grain
            clock={AURORA_CADENCE}
          />
        </Labeled>
      </div>
    </div>
  );
}

/* ───────────────────────────  THE PAPER FIVE  ───────────────────────────── */

/**
 * The hand-tuned paper five against the flat row, on a real paper chapter.
 *
 * ★ THE CONTROL IS NOT "NO LAMPS", IT IS THE FLAT ROW. SPILL_REGISTER.paper is
 * l 0.88 / c 0.08 for every hue, which is what the sampled path would hand the
 * house five, and it is the thing the proposal has to beat. Showing the tuned
 * five against an unlit chapter would prove only that light is visible.
 *
 * There is a third specimen and it is the one that makes the case: the five as
 * globals.css actually declares them, at the DARK register, which is what a
 * media-less lamp on a paper chapter is wearing today, because nothing
 * re-declares --lamp-* on paper.
 */
function PaperFiveRow({ mode, temp }: { mode: Mode; temp: Temperature }) {
  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
        <h3 className="text-[13px] font-semibold text-foreground">
          The paper five
        </h3>
        <p>
          globals.css declares the lamp set once, at the dark register, and
          nothing re-declares it on paper. A house lamp on a paper chapter is
          wearing a colour chosen for a near black room, which is the dirty
          rather than lit failure the sampled paper register was invented to
          fix. It fixed it for lamps with media; the house five never got the
          same treatment.
        </p>
        <p>
          Three specimens on one paper chapter: the five as they ship, the flat
          paper row (l 0.88, c 0.08 for every hue, what the sampled path would
          hand them), and the hand-tuned five. The five hues are identical in
          all three. What changes is lightness and chroma per hue, because the
          failure is per hue: 85 and 155 go dirty against white long before 255
          and 305 do.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FiveSwatches
          row={PAPER_FLAT_VALUES}
          label="The flat paper row (SPILL_REGISTER.paper)"
          ground="paper"
        />
        <FiveSwatches
          row={PAPER_FIVE_VALUES}
          label="The hand-tuned five (proposed)"
          ground="paper"
        />
      </div>

      {/* ★ ROUND THREE: THE THREE ARE ADJACENT NOW. They were stacked full
          width, 900px apart, which is the one layout in which three tints
          cannot be compared at all: by the time the third is on the screen the
          first is a memory. Side by side the type is small, and that is the
          right trade, because the question in this row is colour. The winner
          is printed at full size directly under them. */}
      <div
        className={cn(
          "grid gap-4",
          mode === "desktop" ? "grid-cols-3" : "grid-cols-1",
        )}
      >
        <Labeled
          name="As they ship: the dark five"
          note="No paper override exists. This is what a media-less lamp on the paper chapter wears today."
        >
          <ChapterStage
            id="privacy"
            mode={mode}
            ground="paper"
            candidate="aurora"
            register="accent"
            temp={temp}
            grain
            paperRow={LAMP_SET}
          />
        </Labeled>
        <Labeled
          name="The flat paper row"
          note="l 0.88, c 0.08 for every hue. Cleaner than the dark five, and the amber and the green still sit flat."
        >
          <ChapterStage
            id="privacy"
            mode={mode}
            ground="paper"
            candidate="aurora"
            register="accent"
            temp={temp}
            grain
            paperRow={PAPER_FLAT_VALUES}
          />
        </Labeled>
        <Labeled
          name="The hand-tuned five (proposed)"
          note="Same hues. 85 and 155 lifted and desaturated, 255 and 305 left to carry the chroma."
        >
          <ChapterStage
            id="privacy"
            mode={mode}
            ground="paper"
            candidate="aurora"
            register="accent"
            temp={temp}
            grain
            paperRow={PAPER_FIVE_VALUES}
          />
        </Labeled>
      </div>

      <Labeled
        name="The hand-tuned five, at size"
        note="The proposal on the real paper chapter, full width, so the tint is judged at the scale it ships at."
      >
        <ChapterStage
          id="privacy"
          mode={mode}
          ground="paper"
          candidate="aurora"
          register="accent"
          temp={temp}
          grain
          paperRow={PAPER_FIVE_VALUES}
        />
      </Labeled>

      <ApplyToSite candidate={PAPER_FIVE} />
    </div>
  );
}

/* ──────────────────────────────  THE GRAIN  ─────────────────────────────── */

/**
 * ★ A GRAIN TILE IS SIZED IN DEVICE PIXELS, NOT CSS PIXELS. A 180px tile laid
 * out at 180 CSS px on a 2x display is upscaled two device pixels per tile
 * pixel, so a "1px grain" is a 2px grain and the dither stops dithering: the
 * band it was added to hide comes back on exactly the screens most people are
 * looking at. board.css halves the CSS size at 2dppx, which is also why the
 * asset request names the tile's pixel size and its intended CSS size
 * separately rather than just "256 square".
 *
 * The magnified pair is pixelated on purpose: at 1:1 the difference between
 * the two is a single device pixel and invisible by construction.
 */
function GrainRow({
  mode,
  chapter,
  ground,
  temp,
}: {
  mode: Mode;
  chapter: ChapterId;
  ground: Ground;
  temp: Temperature;
}) {
  const [grainWipe, setGrainWipe] = useState(50);
  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
        <h3 className="text-[13px] font-semibold text-foreground">
          The grain
        </h3>
        <p>
          An aurora is a very low alpha gradient across a very large box, which
          is the exact recipe for 8 bit banding: the engine{"'"}s turbulence
          warp displaces the colour but adds no entropy, so the steps survive
          it. Grain is the standard fix and the honest one here, since film
          grain is what a dark room actually looks like.
        </p>
        <p>
          The stand-in is generated inside its own data URI, and round two makes
          it honest about resolution: a tile laid out at its pixel size on a 2x
          screen is doubled, so the dither becomes a mottle and the band it was
          hiding comes back. Halved on 2dppx it lands one tile pixel per device
          pixel. Magnified below so the difference is visible at all.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled
          name="Doubled (one tile pixel over two device pixels)"
          note="What a tile laid out at its own pixel size does on a 2x screen. A mottle, not a dither."
        >
          <div
            data-lgt-grain-detail
            className="h-28 w-full rounded-lg"
            style={{ "--lgt-grain-size": "24px" } as CSSProperties}
          />
        </Labeled>
        <Labeled
          name="One tile pixel per device pixel"
          note="The same tile at the size board.css lands on a 2x screen. Fine, even, and it disappears at 1:1."
        >
          <div
            data-lgt-grain-detail
            className="h-28 w-full rounded-lg"
            style={{ "--lgt-grain-size": "12px" } as CSSProperties}
          />
        </Labeled>
      </div>

      <WipeControl
        value={grainWipe}
        onChange={setGrainWipe}
        left="No grain"
        right="Grain"
      />
      <Labeled
        name="The same field, dithered right of the handle"
        note="5.5 percent of noise. Watch the band's soft edge, three quarters of the way up the light, where it crosses the handle."
      >
        <ChapterStage
          id={chapter}
          mode={mode}
          ground={ground}
          candidate="aurora"
          register="accent"
          temp={temp}
          grain
          grainWipe={grainWipe}
        />
      </Labeled>
    </div>
  );
}

const NOTES: Record<Candidate, string> = {
  seam: "The footer's lamp moved to a chapter's top edge, register untouched. Honest, and it reads as a footer.",
  aurora:
    "Both boundaries, 42 percent of the chapter each, 38px blur, a 33s drift. The copy sits in the clean middle.",
  middle:
    "The error. Same light, same register, same clock, at the chapter's middle: the copy is now sitting in the light instead of in the clean band between two of them.",
  room: "One field behind everything, anchored at 50 by 88 percent. The engine's own warning, tested rather than quoted.",
};
