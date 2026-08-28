"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Glow, GlowFilter, type GlowVars } from "@/components/dev/glow";
import {
  alphaAtAaFloor,
  effectiveAlpha,
  seamCoverage,
  worstCaseGround,
} from "@/components/dev/glow-contrast";
import { useSampledPalette } from "@/components/dev/sampled-palette";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  GROUNDS,
  Ground,
  type GroundName,
  LampCard,
  PhotoWall,
  Section,
  Spec,
  Verdict,
} from "./glow-lab-shared";

/**
 * Touchpoint: THE SPILL DOCTRINE (the glow round, 2026-08-28).
 *
 * Will asked for the footer's organic-shimmer glow to become core to the visual
 * design, without it turning up everywhere and losing its magic. That is a
 * doctrine problem before it is an engineering one, so this board proposes the
 * doctrine and the engine; the moments board argues the placements.
 *
 * The engine is lab-local on purpose (see the design.css banner): the repo's
 * ratified sequence is lab, then ruling, then promotion into globals.css.
 */

const FALLBACK_PALETTE = [
  "oklch(0.72 0.17 25)",
  "oklch(0.8 0.15 85)",
  "oklch(0.72 0.14 155)",
  "oklch(0.7 0.14 255)",
  "oklch(0.68 0.16 305)",
];

const LAWS: { n: string; name: string; rule: string; kills: string }[] = [
  {
    n: "1",
    name: "Source",
    rule: "Name the lamp. If you cannot point at the object emitting, there is no spill.",
    kills:
      "Decorative glow on section edges, cards, borders, anything that could use some life.",
  },
  {
    n: "2",
    name: "Direction",
    rule: "Spill has a vector. Every instance declares where it comes from.",
    kills: "Even rims, concentric halos, premium pill treatments.",
  },
  {
    n: "3",
    name: "Colour of the lit thing",
    rule: "Where real media exists the spill takes its colour from that media. Where none exists, the ratified five. Never a house token, never a state colour.",
    kills:
      "The glow becoming a second brand palette. Amber storage warnings, violet reel glows.",
  },
  {
    n: "4",
    name: "Falloff",
    rule: "Fades with distance, never draws an edge, sits behind content, always warped, always an always-on base under any travelling band.",
    kills: "The paused-state invisibility trap.",
  },
];

const NEVER: { where: string; why: string }[] = [
  {
    where: "Nav panels and dropdowns",
    why: "No lamp, and the frequency doctrine forbids theater on the most-used controls on the site.",
  },
  {
    where: "The storage meter near its cap",
    why: "Law 3. The moment spill can mean warning, it is a state colour and the system is decoration.",
  },
  {
    where: "Upload errors and retry tiles",
    why: "Same. Failure is --destructive, full stop.",
  },
  {
    where: "Generic skeletons",
    why: "Nothing is lit yet. A skeleton is an absence; spill needs a presence.",
  },
  {
    where: "Every CtaBand",
    why: "This is the every-section-gets-a-version failure under another name.",
  },
  {
    where: "The admin portal",
    why: "No media, no lamp, and an operator surface is the wrong place to spend delight.",
  },
];

const LAMP_CHOICES = [
  "wedding-golden",
  "concert-confetti",
  "festival-lights",
  "party-balloons",
  "wedding-petals",
] as const;

export function GlowDoctrineVariants() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      {/* One turbulence field for the whole page. SVG ids are document-global,
          so this is rendered by the BOARD and never by the effect. */}
      <GlowFilter />
      <Thesis />
      <Laws />
      <Experiment />
      <Shapes />
      <Register />
      <States />
      <ContrastInstrument />
      <Calibration />
    </div>
  );
}

function Thesis() {
  return (
    <div className="flex flex-col gap-4">
      <blockquote className="max-w-3xl border-l-2 border-foreground pl-4">
        <p data-dir-display className="text-2xl leading-snug text-balance">
          In Partyreel, light is never a material. It is always spill from a lit
          thing.
        </p>
      </blockquote>
      <div className="max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground">
        <p>
          Spill is the film-lighting word for light that escapes past the
          subject it was aimed at. It is already the word in our own CSS: the
          footer comment says its mask exists &ldquo;so it reads as spill rather
          than a stripe&rdquo;.
        </p>
        <p className="mt-3">
          Naming a physical situation rather than a material is what keeps it
          rare. A material invites &ldquo;where else can we put it&rdquo;. A
          situation asks &ldquo;is this that situation&rdquo;, which anyone can
          answer without me in the room. My first draft of this doctrine said
          the glow belongs &ldquo;at an edge where media is, arrives, or is
          about to&rdquo;, and in a media product that disqualifies nothing: it
          passed all ten candidates I could think of in one sitting.
        </p>
      </div>
    </div>
  );
}

function Laws() {
  return (
    <Section
      n="01"
      title="The four laws"
      lede="Scarcity is derived, not budgeted: one lamp per view. A room has one dominant source, and a second spill on a page is the same lamp seen from somewhere else. That is the rule you asked for, stated as a fact about rooms instead of a quota someone has to police."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {LAWS.map((law) => (
          <div key={law.n} className="rounded-2xl border border-border p-4">
            <p className="font-mono text-xs text-muted-foreground">{law.n}</p>
            <h3 className="mt-1 font-heading text-base font-semibold">
              {law.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-pretty">
              {law.rule}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-pretty text-muted-foreground">
              Kills: {law.kills}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-2xl border border-border p-4">
        <h3 className="font-heading text-base font-semibold">
          Where it must never go
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The rejects are worth more than more ideas. Each one is a case the
          laws decide on their own.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {NEVER.map((n) => (
            <li key={n.where} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium">{n.where}</span>
              <span className="text-xs text-muted-foreground">{n.why}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** Section 02: the round's central, falsifiable question. */
function Experiment() {
  const [lampId, setLampId] = useState<string>(LAMP_CHOICES[0]);
  const lamp = marketingImage(lampId);
  const sampled = useSampledPalette(lamp.src);

  return (
    <Section
      n="02"
      title="The experiment: does the photograph's colour matter?"
      lede={
        <>
          <p>
            Today the glow is the one place on the site where colour is invented
            rather than photographed, which makes it an exception to the
            ratified identity dressed as an expression of it. Law 3 says the
            spill should take its hues from the media it is lighting. Both
            stages below are the same lamp at the same strength; only the hues
            differ.
          </p>
          <p className="mt-2 text-foreground">
            If these look the same, law 3 is wrong and a fixed palette is right.
            Change the lit photograph and watch whether the light follows it.
          </p>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">The lit thing:</span>
        {LAMP_CHOICES.map((id) => {
          const img = marketingImage(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setLampId(id)}
              aria-pressed={id === lampId}
              className={cn(
                "relative size-12 overflow-hidden rounded-lg border-2 transition-[border-color,opacity] duration-150",
                id === lampId
                  ? "border-foreground"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image
                src={img.src}
                alt={img.subject}
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Spec
          name="Sampled from the media"
          note={
            sampled ? (
              <span className="flex flex-wrap items-center gap-1">
                Hues lifted off the photograph, normalised into the atmosphere
                register so the two stages differ in exactly one variable.
                {sampled.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="inline-block size-3 rounded-full align-middle"
                    style={{ background: c }}
                  />
                ))}
              </span>
            ) : (
              "Sampling."
            )
          }
        >
          <ExperimentStage lampId={lampId} colors={sampled ?? undefined} />
        </Spec>
        <Spec
          name="The ratified five"
          note="The confetti palette, exactly as the shipped footer uses it."
        >
          <ExperimentStage lampId={lampId} />
        </Spec>
      </div>
    </Section>
  );
}

function ExperimentStage({
  lampId,
  colors,
}: {
  lampId: string;
  colors?: readonly string[];
}) {
  const img = marketingImage(lampId);
  return (
    <Ground on="cinema" className="p-0">
      {/* The lamp: a lit screen. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={img.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 460px, 90vw"
          className="object-cover"
        />
      </div>
      {/* The room below it, catching what the screen throws down. */}
      <div className="relative isolate min-h-44 px-6 pt-10 pb-8">
        <Glow
          shape="seam"
          drive="mask"
          colors={colors}
          vars={{
            "--glw-blur": "22px",
            "--glw-h": "150px",
            "--glw-strength": "0.45",
            "--glw-base": "0.45",
          }}
        />
        <div className="relative">
          <p className="font-heading text-xl">The whole event, in one album.</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Guests scan the code and their photos land here. No app, no account.
          </p>
        </div>
      </div>
    </Ground>
  );
}

const SHAPES: {
  shape: "seam" | "throw" | "sweep" | "bloom";
  name: string;
  note: string;
  lamp: string;
  direction: string;
}[] = [
  {
    shape: "seam",
    name: "Seam",
    note: "Spill across a boundary. The shipped footer, generalised.",
    lamp: "the lit page above the cut",
    direction: "down, perpendicular to the edge",
  },
  {
    shape: "throw",
    name: "Throw",
    note: "An origin-anchored cast. Replaces a rim, because a rim has no vector.",
    lamp: "a screen, a card, a plate",
    direction: "outward from --glw-from-x / -y",
  },
  {
    shape: "sweep",
    name: "Sweep",
    note: "The comet plus the phase-locked edge beam: the half of the recipe we never adopted.",
    lamp: "something arriving from outside",
    direction: "diagonally across, and around the border",
  },
  {
    shape: "bloom",
    name: "Bloom",
    note: "A one-shot that decays to the base, never to zero, so the lamp stays lit afterwards.",
    lamp: "a moment that just happened",
    direction: "outward, once",
  },
];

const SHAPE_VARS: Record<string, GlowVars> = {
  // A seam lights the top third of what it meets, never the whole box.
  seam: { "--glw-h": "42%", "--glw-strength": "0.55", "--glw-base": "0.55" },
  // Thrown up from the bottom edge, like a card overhanging a dark field.
  throw: {
    "--glw-from-y": "100%",
    "--glw-reach": "95%",
    "--glw-strength": "0.5",
    "--glw-base": "0.5",
  },
  // The edge beam's geometry is pixel-tuned for a 142px tile, so the scale
  // token is doing real work here: without it the ring sits 20px inside a
  // 250px stage and reads as a second box.
  sweep: { "--glw-scale": "1.9", "--glw-radius": "16px", "--glw-dur": "6s" },
  bloom: {
    "--glw-from-y": "50%",
    "--glw-reach": "120%",
    "--glw-strength": "0.85",
    "--glw-base": "0.25",
  },
};

function Shapes() {
  const [runId, setRunId] = useState(0);
  return (
    <Section
      n="03"
      title="Four shapes, one engine"
      lede="Each on production's real ground, beside its unlit control. The lab's own mock sheet uses a pure-white card and the app's 0.14 night; the cinema room is 0.11 and the ink slab is 0.155, so every stage here redeclares the real tokens."
    >
      <div className="flex flex-col gap-8">
        {SHAPES.map((s) => (
          <Spec key={s.shape} name={s.name} note={s.note}>
            <div className="grid grid-cols-2 gap-3">
              <Ground on="slab" className="relative isolate aspect-[16/9]">
                <Glow
                  shape={s.shape}
                  drive="mask"
                  edge={s.shape === "sweep"}
                  runId={runId}
                  vars={SHAPE_VARS[s.shape]}
                />
                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-muted-foreground">
                  lit
                </span>
              </Ground>
              <Ground on="slab" className="relative aspect-[16/9]">
                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-muted-foreground">
                  control
                </span>
              </Ground>
            </div>
            <LampCard
              lamp={s.lamp}
              direction={s.direction}
              colour="fallback five (no media on this stage)"
              law={
                s.shape === "bloom" ? "Law 4 (decays to base)" : "Laws 1 and 2"
              }
            />
          </Spec>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRunId((r) => r + 1)}
        className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors duration-150 hover:bg-muted"
      >
        Replay the bloom
      </button>
    </Section>
  );
}

/** Section 04: one slider beats three fixed columns for a register ruling. */
function Register() {
  const [strength, setStrength] = useState(0.62);
  const [scale, setScale] = useState(1);
  const [dur, setDur] = useState(11);
  const [ground, setGround] = useState<GroundName>("slab");

  const vars: GlowVars = {
    "--glw-base": String(strength),
    "--glw-strength": String(strength),
    "--glw-scale": String(scale),
    "--glw-dur": `${dur}s`,
  };

  return (
    <Section
      n="04"
      title="The register"
      lede="The shipped footer runs base and band at 0.62, which is the calibration everything else is judged against. Scale exists because the recipe's geometry is pixel-tuned for a 142px tile: without it a 40px pill and a 1440px hero would share an overhang."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Ground on={ground} className="relative isolate min-h-64 p-8">
          <Glow shape="seam" drive="mask" vars={vars} />
          <div className="relative">
            <p className="font-heading text-2xl">Every guest, one album.</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This paragraph is muted text at the surface&rsquo;s real token
              value, so the legibility cost of the wash is visible while you
              tune it.
            </p>
          </div>
        </Ground>
        <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
          <Slider
            label="Strength"
            value={strength}
            min={0}
            max={1}
            step={0.01}
            onChange={setStrength}
            display={strength.toFixed(2)}
          />
          <Slider
            label="Scale"
            value={scale}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setScale}
            display={`${scale.toFixed(1)}x`}
          />
          <Slider
            label="Duration"
            value={dur}
            min={2}
            max={24}
            step={1}
            onChange={setDur}
            display={`${dur}s`}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Ground</span>
            <div className="flex gap-1">
              {(Object.keys(GROUNDS) as GroundName[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGround(g)}
                  aria-pressed={g === ground}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
                    g === ground
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {GROUNDS[g].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {GROUNDS[ground].note}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {display}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
      />
    </label>
  );
}

const STATE_ROWS: { name: string; note: string }[] = [
  {
    name: "Running",
    note: "The normal case: base lit, comet travelling.",
  },
  {
    name: "Paused (offscreen)",
    note: "The DEFAULT state for anything below the fold. The base must still be lit here, or the glow is invisible on most page loads.",
  },
  {
    name: "Two lamps, one page",
    note: "The only real test of law 2. If this reads as decoration rather than a room, scarcity is not optional.",
  },
];

function States() {
  return (
    <Section
      n="05"
      title="The states this has to survive"
      lede="A swept layer rests fully off-layer, so a band without a base shows nothing whenever it is paused, and the global reduced-motion guard forces animation-iteration-count to 1. Base plus band is load-bearing, not layering."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <Spec name={STATE_ROWS[0].name} note={STATE_ROWS[0].note}>
          <Ground on="slab" className="relative isolate aspect-[4/3]">
            <Glow shape="seam" drive="mask" />
          </Ground>
        </Spec>
        <Spec name={STATE_ROWS[1].name} note={STATE_ROWS[1].note}>
          <Ground on="slab" className="relative isolate aspect-[4/3]">
            {/* Forced paused: exactly what useAmbientPause produces offscreen. */}
            <div
              data-glw
              data-glw-shape="seam"
              data-glw-drive="mask"
              data-paused="true"
              aria-hidden
            >
              <div data-glw-field>
                <div data-glw-base />
                <div data-glw-band />
              </div>
            </div>
          </Ground>
        </Spec>
        <Spec name={STATE_ROWS[2].name} note={STATE_ROWS[2].note}>
          <Ground on="slab" className="relative isolate aspect-[4/3]">
            <Glow shape="seam" drive="mask" />
            <div className="absolute inset-x-0 bottom-0 isolate h-1/2">
              <Glow
                shape="throw"
                drive="mask"
                vars={{ "--glw-from-y": "100%" }}
              />
            </div>
          </Ground>
        </Spec>
      </div>
      <div className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-pretty text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">
            Verified separately, because they cannot be shown side by side:
          </span>{" "}
          reduced motion (emulate it and every stage above should still arrive
          lit, with nothing moving), forced-colors (the engine sets display
          none, so the surface simply loses its light), print (the same), and
          the filter host unmounting.
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">
            The filter host is the one real fragility.
          </span>{" "}
          Every spill on the page references one SVG id. Duplicate ids resolve
          by document order, which is unstable under portals and reconciliation,
          and if the node that owns the field unmounts, every other consumer is
          left holding a dangling reference. In production this belongs in the
          root layout, which is a cost the wiring round should say out loud
          rather than discover.
        </p>
      </div>
    </Section>
  );
}

const AA_FLOOR = 4.5;

function ContrastInstrument() {
  const [alpha, setAlpha] = useState(0.12);

  const rows = useMemo(
    () =>
      (Object.keys(GROUNDS) as GroundName[]).map((g) => {
        const ground = GROUNDS[g];
        const report = worstCaseGround(
          ground.bg,
          ground.fg,
          ground.muted,
          FALLBACK_PALETTE,
          alpha,
        );
        return {
          key: g,
          label: ground.label,
          floor: alphaAtAaFloor(ground.bg, ground.muted, FALLBACK_PALETTE),
          muted: report?.mutedRatio ?? 0,
          body: report?.bodyRatio ?? 0,
        };
      }),
    [alpha],
  );

  const footerModel = effectiveAlpha({
    layerOpacity: 0.62,
    coverage: seamCoverage(80, 210),
  });

  return (
    <Section
      n="06"
      title="What the wash costs in legibility"
      lede="footer-contract.test.ts pins the ink slab's token redeclarations as source text, not as measured ratios, so a wash that lifts the ground passes every test in the repo while eating the headroom those pins exist to protect. This computes it."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 font-medium">Ground</th>
                <th className="p-3 font-medium">Muted text</th>
                <th className="p-3 font-medium">Body text</th>
                <th className="p-3 font-medium">Fails AA at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3">{r.label}</td>
                  <td
                    className={cn(
                      "p-3 font-mono text-xs",
                      r.muted < AA_FLOOR && "font-bold",
                    )}
                  >
                    {r.muted.toFixed(2)}:1{r.muted < AA_FLOOR ? " (fails)" : ""}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {r.body.toFixed(2)}:1
                  </td>
                  <td className="p-3 font-mono text-xs">alpha {r.floor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <Slider
            label="Effective alpha at the text"
            value={alpha}
            min={0}
            max={0.6}
            step={0.005}
            onChange={setAlpha}
            display={alpha.toFixed(3)}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Effective alpha is not the layer opacity. Three multipliers stack:
            the brightest blob&rsquo;s own mix, the layer opacity, and the
            container mask&rsquo;s coverage where the text sits.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-pretty">
        <p className="font-medium">Two findings worth the ruling.</p>
        <p className="mt-2 text-muted-foreground">
          <span className="text-foreground">
            Paper is four times more forgiving than the slab.
          </span>{" "}
          Muted text crosses 4.5:1 at alpha 0.115 on the ink slab and 0.15 on
          the cinema room, but not until 0.47 on paper. A mid-light wash lifts a
          near-black ground straight toward muted grey, while on near-white
          paper it has much further to travel. That inverts the intuition that
          this is a dark-surface effect: dark is where it looks best and where
          it is most fragile.
        </p>
        <p className="mt-2 text-muted-foreground">
          <span className="text-foreground">
            Body text is never the problem.
          </span>{" "}
          It stays above 7:1 at every alpha in this range, which is why the
          doctrine can allow a lamp near a heading and not near a caption.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          These are modelled upper bounds: the model ignores each blob&rsquo;s
          own radial falloff and the 16px blur, both of which only reduce what a
          text run meets. At the shipped footer&rsquo;s geometry the model puts
          its first text line at alpha {footerModel.toFixed(3)}, past the
          slab&rsquo;s floor, while the real footer plainly reads fine. The
          measured value from the live page is in the handoff report; treat the
          table as a ceiling, not a measurement.
        </p>
      </div>
    </Section>
  );
}

function Calibration() {
  return (
    <Section
      n="07"
      title="Calibration: the one glow already ruled beautiful"
      lede="The shipped seam glow is the reference. The left stage is the engine reproducing it from the same values; the right is the same surface with no light at all, which is what the slab looked like before the footer round."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Spec
          name="The engine, at the footer's values"
          note="210px layer, base and band at 0.62, 11s, 16px blur, fallback five."
        >
          <FooterMock lit />
        </Spec>
        <Spec name="No light" note="The hard cut the footer round was fixing.">
          <FooterMock />
        </Spec>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Verdict kind="ship">Doctrine proposed</Verdict>
        <span className="text-xs text-muted-foreground">
          Nothing here is wired. The engine is lab-local, and promotion into
          globals.css wants your ruling first.
        </span>
      </div>
    </Section>
  );
}

function FooterMock({ lit = false }: { lit?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="bg-white p-6" style={{ background: "oklch(0.99 0 0)" }}>
        <PhotoWall
          ids={[
            "wedding-golden",
            "party-balloons",
            "wedding-toast",
            "festival-lights",
          ]}
          cols={4}
        />
      </div>
      <Ground
        on="slab"
        className="relative isolate min-h-56 rounded-none px-6 pt-20 pb-8"
      >
        {lit && (
          <>
            <Glow shape="seam" drive="mask" vars={{ "--glw-blur": "16px" }} />
            <div data-glw-seamline />
          </>
        )}
        <p className="relative font-heading text-2xl">
          The whole event, in one album.
        </p>
        <p className="relative mt-2 max-w-sm text-[15px] text-muted-foreground">
          Muted body copy at the slab&rsquo;s real token value, sitting where
          the footer&rsquo;s first text line sits.
        </p>
      </Ground>
    </div>
  );
}
