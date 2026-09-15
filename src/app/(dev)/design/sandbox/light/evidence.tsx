"use client";

import { type CSSProperties, useRef, useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { Glow } from "@/components/shared/glow";
import { cn } from "@/lib/utils";

import {
  PAPER_FIVE,
  PAPER_FIVE_VALUES,
  PAPER_FLAT_VALUES,
} from "./candidates";
import {
  Light,
  lampVars,
  type Clock,
  type Register,
  type Temperature,
} from "./composer";
import { sectionById, type SectionId } from "./sections";
import {
  ApplyToSite,
  AURORA_CADENCE,
  CadenceKnob,
  CostMeter,
  Knob,
  Labeled,
  Part,
  Takeaway,
  WipeControl,
  type GlowDriveId,
} from "./shared";

/**
 * WHAT DECIDED THE NUMBERS (round four, 2026-09-15).
 *
 * Round three's parts B and C carried five instruments: the cost meter, the two
 * drifts, the paper five, the grain and the cadence strips. Will's note is that
 * the board reads as research, and the honest response is not to delete the
 * measurements: it is to demote them. A measurement earns its place on this
 * board only if it DECIDED a line in the kit, so each block here opens with
 * nothing and ends in the takeaway it produced, and anything that produced none
 * was cut.
 *
 * What was cut, and why: round three's three-strip cadence stage (8s, 11s and
 * 33s as three seams in a column) proved that three numbers are three numbers.
 * The ruling it serves cannot be made on a stage at all, by its own argument
 * ("the whole page at 11s against the whole page at 8s", footer-glow.tsx), so
 * what survives of it is the pair of knobs that write the token and send the
 * reviewer to the real page. One strip stays, as the reference for what a lap
 * looks like.
 */
function LitSection({
  id,
  mode,
  ground,
  register,
  clock,
  temp = "house",
  paperRow,
  drive = "transform",
  grain = true,
  placement = "both",
  wipe,
}: {
  id: SectionId;
  mode: Mode;
  ground: Ground;
  register: Register;
  clock: Clock;
  temp?: Temperature;
  paperRow?: readonly string[];
  drive?: GlowDriveId;
  grain?: boolean;
  placement?: "both" | "middle";
  /** Percent lit, left to right. Undefined renders the light whole. */
  wipe?: number;
}) {
  const section = sectionById(id);
  const height = section.h[mode];
  const lit = (
    <Light
      treatment="aurora"
      placement={placement}
      ground={ground}
      register={register}
      clock={clock}
      height={height}
      grain={grain}
      drive={drive}
    />
  );
  return (
    <Stage mode={mode} ground={ground} height={height}>
      <div
        className="relative isolate flex h-full flex-col justify-center"
        style={lampVars(ground, temp, paperRow)}
      >
        {wipe === undefined ? (
          lit
        ) : (
          <>
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
        <div className="relative">{section.render()}</div>
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

export function EvidencePart({
  mode,
  ground,
  register,
  rules,
}: {
  mode: Mode;
  ground: Ground;
  register: Register;
  rules: string[];
}) {
  const [drive, setDrive] = useState<GlowDriveId>("transform");
  const [grainWipe, setGrainWipe] = useState(50);
  const specimen = useRef<HTMLDivElement | null>(null);
  const cinemaSection: SectionId = "guests";

  return (
    <Part
      n="05"
      id="evidence"
      title="What decided the numbers"
      rules={rules}
      lede={
        <p>
          Five instruments, each kept only because it decided a line in the kit.
          Every block ends in the line it produced. A measurement that produced
          none is not on this board.
        </p>
      }
    >
      {/* ── THE DRIVE, AND WHAT IT COSTS ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <h3 className="text-[13px] font-semibold">
          The drive: what a field costs, and which one it should take
        </h3>
        <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            A field at chapter scale is the one thing in the kit that adds work
            to every frame, so the board measures it rather than claiming it is
            cheap. The engine has two ways to move a lamp and the doctrine never
            said which a field should take: the mask drive repaints the whole
            filtered layer every frame, and the transform drive moves the comet
            on the compositor. globals.css calls the second one the cheap one in
            its own comment.
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
            options={[
              { id: "transform" as GlowDriveId, label: "Transform" },
              { id: "mask" as GlowDriveId, label: "Mask" },
            ]}
            value={drive}
            onChange={setDrive}
          />
        </Knob>
        <div ref={specimen} data-lgt-solo-target>
          <Labeled
            name="The guest ledger at the accent register"
            note="The meter runs on this specimen with every other lamp on the board hidden."
          >
            <LitSection
              id={cinemaSection}
              mode={mode}
              ground={ground === "paper" ? "paper" : "cinema"}
              register={register}
              clock="aurora"
              drive={drive}
            />
          </Labeled>
        </div>
        <CostMeter drive={drive} setDrive={setDrive} targetRef={specimen} />
        <Takeaway lands="one line of globals.css: glw-drift-x's from-keyframe, declared outside the reduced-motion block.">
          The field takes the transform drive and a lamp keeps the mask drive:
          the same light, a fraction of the repaint, and the difference between
          the two only reads at a size no lamp ever is. One line of the engine
          has to move with it, and it is a law 4 fix rather than a new feature:
          the transform band{"'"}s rest state is the comet parked dead centre at
          full strength, because glw-drift-x runs from 32 percent to minus 32
          and zero is the middle of its travel. Nobody has seen it because no
          shipped lamp uses that drive, and the aurora is the first thing that
          should.
        </Takeaway>
      </div>

      {/* ── THE CLOCK ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-6">
        <h3 className="text-[13px] font-semibold">
          The clock: a lamp{"'"}s and a field{"'"}s
        </h3>
        <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            The same section, the same register, the same five. Only the clock
            differs. A field the size of a chapter moving at a lamp{"'"}s eight
            to eleven seconds reads as something moving behind the copy; three
            laps of it reads as the room having a temperature. Watch the two
            together rather than either alone.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Labeled
            name="At the lamp's clock"
            note="--spill-cadence, whatever the tuner currently holds."
          >
            <LitSection
              id={cinemaSection}
              mode={mode}
              ground={ground === "paper" ? "paper" : "cinema"}
              register={register}
              clock="lamp"
            />
          </Labeled>
          <Labeled
            name="At the aurora's clock"
            note={`${AURORA_CADENCE}: three laps of the lamp, the proposed sibling token.`}
          >
            <LitSection
              id={cinemaSection}
              mode={mode}
              ground={ground === "paper" ? "paper" : "cinema"}
              register={register}
              clock="aurora"
            />
          </Labeled>
        </div>

        {/* ★ THE STRIP CANNOT SETTLE THE 8s-VS-11s RULING AND IS NOT MEANT TO.
            Seams in a column show that two numbers are two numbers; they
            cannot show what three lamps a viewport apart feel like on a page
            you are scrolling, which is the actual question ("the whole page at
            11s against the whole page at 8s", footer-glow.tsx). So the ruling
            gets the same instrument the tuner's slider has: write the token,
            leave the lab, walk the home page. */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CadenceKnob seconds={8} />
          <CadenceKnob seconds={11} />
          <span className="max-w-prose text-[11px] text-muted-foreground">
            Writes --spill-cadence on the site, the same override the tuner
            panel{"'"}s slider writes. Then walk the home page: the footer seam,
            the film strip and the reel pool are a viewport apart, and that is
            the comparison no stage in a lab can make.
          </span>
        </div>
        <Takeaway lands="--aurora-cadence: calc(var(--spill-cadence) * 3), beside the lamp's token.">
          One register for a lamp, and it should be the engine{"'"}s own 8
          seconds: 11 was the footer alone with nothing else moving, and on a
          page with three lamps the slower clock reads as three things drifting
          rather than one room breathing. The aurora is not a lamp and takes a
          multiple, so --spill-cadence stays one token and gains a sibling
          rather than a second opinion. The ratio is the proposal; the ruling on
          8 or 11 picks what it multiplies.
        </Takeaway>
      </div>

      {/* ── THE PAPER FIVE ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-6">
        <h3 className="text-[13px] font-semibold">The paper five</h3>
        <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            globals.css declares the lamp set once, at the dark register, and
            nothing re-declares it on paper. A house lamp on a paper chapter is
            wearing a colour chosen for a near black room, which is the dirty
            rather than lit failure the sampled paper register was invented to
            fix. It fixed it for lamps with media; the house five never got the
            same treatment.
          </p>
          <p>
            Three specimens on one real paper chapter: the five as they ship,
            the flat paper row (l 0.88, c 0.08 for every hue, what the sampled
            path would hand them), and the hand-tuned five. The five hues are
            identical in all three. What changes is lightness and chroma per
            hue, because the failure is per hue: 85 and 155 go dirty against
            white long before 255 and 305 do.
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
            <LitSection
              id="privacy"
              mode={mode}
              ground="paper"
              register={register}
              clock="aurora"
              paperRow={LAMP_SET}
            />
          </Labeled>
          <Labeled
            name="The flat paper row"
            note="l 0.88, c 0.08 for every hue. Cleaner than the dark five, and the amber and the green still sit flat."
          >
            <LitSection
              id="privacy"
              mode={mode}
              ground="paper"
              register={register}
              clock="aurora"
              paperRow={PAPER_FLAT_VALUES}
            />
          </Labeled>
          <Labeled
            name="The hand-tuned five (proposed)"
            note="Same hues. 85 and 155 lifted and desaturated, 255 and 305 left to carry the chroma."
          >
            <LitSection
              id="privacy"
              mode={mode}
              ground="paper"
              register={register}
              clock="aurora"
              paperRow={PAPER_FIVE_VALUES}
            />
          </Labeled>
        </div>

        <ApplyToSite candidate={PAPER_FIVE} />
        <Takeaway lands="--lamp-1..5, re-declared on .surface-paper.">
          A ground changes what a hue means, so the lamp set needs a second
          declaration rather than a global compromise. The hues do not move: 85
          and 155 are lifted and desaturated, 255 and 305 are left to carry the
          chroma, and the paper chapter stops wearing a colour picked for a near
          black room. It is the first time --lamp-* would be re-declared per
          ground, which is why it is an ask rather than a detail.
        </Takeaway>
      </div>

      {/* ── THE GRAIN ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-6">
        <h3 className="text-[13px] font-semibold">The grain</h3>
        <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            An aurora is a very low alpha gradient across a very large box,
            which is the exact recipe for 8 bit banding: the engine{"'"}s
            turbulence warp displaces the colour but adds no entropy, so the
            steps survive it. Grain is the standard fix and the honest one here,
            since film grain is what a dark room actually looks like.
          </p>
          <p>
            The stand-in is generated inside its own data URI and it is honest
            about resolution: a tile laid out at its pixel size on a 2x screen
            is doubled, so the dither becomes a mottle and the band it was
            hiding comes back. Halved on 2dppx it lands one tile pixel per
            device pixel. Magnified below so the difference is visible at all.
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
          <GrainWipeSection
            mode={mode}
            ground={ground === "paper" ? "paper" : "cinema"}
            register={register}
            wipe={grainWipe}
          />
        </Labeled>
        <Takeaway lands="one asset and six lines of CSS: a seamless 256px tile at 5.5 percent, halved at 2dppx.">
          The dither is not optional at this register, and its SIZE is not a
          detail. A tile is measured in device pixels, not CSS pixels, so a
          256px tile laid out at 256 CSS px on the screens most people are
          looking at is a 2x mottle and the band it was added to hide comes
          straight back. The asset request names the tile{"'"}s pixel size and
          its intended CSS size separately for exactly that reason.
        </Takeaway>
      </div>

      {/* ── THE ERROR, KEPT ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-6">
        <h3 className="text-[13px] font-semibold">
          The placement error, kept on the board
        </h3>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The same light, the same register, the same clock, at the section
          {"'"}s middle instead of its boundaries. Nothing here is a strawman
          except the placement, which is the point: the grammar is the only
          variable, so what goes wrong is attributable to it and to nothing
          else. It is on the board because {"“"}never the middle{"”"}{" "}
          is the half of the grammar a wiring round is most likely to get wrong,
          and a rule you have watched fail is a rule you keep.
        </p>
        <Labeled
          name="The aurora at the middle"
          note="The copy is now sitting IN the light instead of in the clean band between two of them."
        >
          <LitSection
            id={cinemaSection}
            mode={mode}
            ground={ground === "paper" ? "paper" : "cinema"}
            register={register}
            clock="aurora"
            placement="middle"
          />
        </Labeled>
      </div>
    </Part>
  );
}

/** The grain row's own wipe: one grain node, clipped, so the two states touch.
 *  A band's soft edge is the most forgettable thing on this board, and a
 *  comparison across 800px of scroll is a memory test. */
function GrainWipeSection({
  mode,
  ground,
  register,
  wipe,
}: {
  mode: Mode;
  ground: Ground;
  register: Register;
  wipe: number;
}) {
  const section = sectionById("guests");
  const height = section.h[mode];
  const band = Math.round(height * 0.42);
  const vars = {
    "--glw-base": ground === "paper" ? "0.52" : "0.30",
    "--glw-strength": ground === "paper" ? "0.24" : "0.13",
    "--glw-blur": "38px",
    "--glw-dur": "var(--aurora-cadence)",
  } as const;
  return (
    <Stage mode={mode} ground={ground} height={height}>
      <div
        className="relative isolate flex h-full flex-col justify-center"
        style={lampVars(ground, "house")}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{ height: band }}
        >
          <Glow
            shape="seam"
            drive="transform"
            vars={{ "--glw-h": `${band}px`, ...vars } as never}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{ height: band, scale: "1 -1" }}
        >
          <Glow
            shape="seam"
            drive="transform"
            vars={{ "--glw-h": `${band}px`, ...vars } as never}
          />
        </div>
        <div
          data-lgt-wipe
          style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
        >
          <div data-lgt-grain className="absolute inset-0" />
        </div>
        <div
          data-lgt-wipe-line
          aria-hidden
          style={{ "--lgt-wipe": `${100 - wipe}%` } as CSSProperties}
        />
        <div className="relative">{section.render()}</div>
      </div>
    </Stage>
  );
}
