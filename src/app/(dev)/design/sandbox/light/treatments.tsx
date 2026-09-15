"use client";

import { type CSSProperties } from "react";

import { Stage, type Ground, type Mode } from "@/components/lab";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { ReelFrame } from "@/components/marketing/frames";
import { QrHero } from "@/components/marketing/sections/features/qr/qr-hero";
import { Glow } from "@/components/shared/glow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Labeled } from "@/components/lab";

import { treatmentById, type TreatmentId } from "./kit";
import { sectionById } from "./sections";
import { LampCard, Photo, Recipe, Takeaway } from "./shared";

/**
 * THE TREATMENTS, EACH ON THE REAL SECTION IT BELONGS TO (round four).
 *
 * The spill doctrine board proved five shapes on real GROUNDS: a slab, a card,
 * a pill, at the right tokens. That was the correct experiment for the question
 * it was asking, and it is not the same as showing a treatment on the section
 * of the site that will wear it. Will's note asks for the second thing: "I'd
 * love to see more UI examples for comparison, especially if they can be live
 * production components."
 *
 * So: six treatments, six real production surfaces, at 1:1, each with the lamp
 * card that admits it and the mount a wiring round pastes. Three of them ship
 * today and are shown exactly as they ship (the footer's seam, the QR plate's
 * ignition, the Pro card's beam), which is the strongest thing on this board:
 * half the kit is already running in production and nobody had written down
 * what it was called.
 *
 * The seventh treatment, the aurora, has the composer below as its specimen,
 * because it is the one that has to be configured rather than looked at.
 */
function Spec({
  id,
  treatment,
  surface,
  place,
  direction,
  colour,
  admitted,
  takeaway,
  lands,
  children,
}: {
  id: string;
  treatment: TreatmentId;
  /** The production surface this is mounted on, named. */
  surface: string;
  place: string;
  direction: string;
  colour: string;
  admitted: string;
  takeaway: React.ReactNode;
  lands?: string;
  children: React.ReactNode;
}) {
  const t = treatmentById(treatment);
  return (
    <div id={id} className="flex scroll-mt-6 flex-col gap-3 pt-4">
      <div className="max-w-2xl">
        <h3 className="text-[13px] font-semibold">
          {t.name}
          <span className="ml-2 font-normal text-muted-foreground">
            on {surface}
          </span>
          {t.ships ? (
            <span className="ml-2 rounded-full border border-foreground/25 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ships today
            </span>
          ) : null}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t.is}
        </p>
      </div>
      {children}
      <LampCard
        place={place}
        direction={direction}
        colour={colour}
        admitted={admitted}
      />
      <Recipe mount={t.mount} />
      <Takeaway lands={lands}>{takeaway}</Takeaway>
    </div>
  );
}

/* ──────────────────────────────  THE SWEEP  ─────────────────────────────── */

/** A frame arriving. The production ReelFrame, with the engine's own sweep and
 *  its phase-locked edge ring: the half of the recipe that has never shipped. */
function Arriving({ runId, small }: { runId: number; small: boolean }) {
  const w = small ? 300 : 520;
  return (
    <div
      className="relative isolate"
      style={{ width: w, "--glw-radius": "18px" } as CSSProperties}
    >
      <Glow
        shape="sweep"
        edge
        runId={runId}
        vars={{
          "--glw-scale": "1.35",
          "--glw-radius": "18px",
          "--glw-dur": "6s",
          "--glw-strength": "0.6",
          "--glw-base": "0.35",
        }}
      />
      <div className="relative">
        <ReelFrame />
      </div>
    </div>
  );
}

/* ──────────────────────────────  THE HALO  ──────────────────────────────── */

/** ★ THE HALO NEEDS A DARK OBJECT, AND OUR PRIMARY CTA IS WHITE. The doctrine
 *  board measured it on a hand-made pill ("a light wash over a white primary
 *  has no headroom to show in") and then demonstrated the shape on a pill it
 *  had darkened itself. On the real Button, in the real variants, that finding
 *  becomes a rule with a consequence: the halo can light a secondary action and
 *  cannot light the primary one, so the treatment's place is an action at the
 *  END of a flow rather than the CTA at the top of a page. Both are here, side
 *  by side, because the failure is the argument. */
function HaloButton({
  variant,
  label,
}: {
  variant: "default" | "secondary";
  label: string;
}) {
  return (
    <span
      className="relative isolate inline-flex overflow-hidden rounded-[var(--radius-action)]"
      style={{ "--glw-radius": "var(--radius-action)" } as CSSProperties}
    >
      <Glow
        shape="halo"
        vars={{
          "--glw-blur": "8px",
          "--glw-strength": "0.95",
          "--glw-base": "0.8",
          "--glw-core": "36%",
          "--glw-dur": "5s",
        }}
      />
      <Button variant={variant} size="lg" className="relative h-11 px-6">
        {label}
      </Button>
    </span>
  );
}

/* ──────────────────────────────  THE BLOOM  ─────────────────────────────── */

type BeatId = "shipped" | "house" | "leaned";

const BEATS: { id: BeatId; label: string; note: string }[] = [
  {
    id: "shipped",
    label: "As shipped",
    note: "rxp-pubglow: an inset shadow at oklch(0.62 0.2 300), the --reel action hue. 700ms, then nothing, and nothing at all under reduced motion.",
  },
  {
    id: "house",
    label: "The house five",
    note: "A bloom with no colours, the QR plate's model. No meaning in the hue at all.",
  },
  {
    id: "leaned",
    label: "The five, leaned to 305",
    note: "The same bloom, the surface narrowing the five toward violet. The aurora's own grammar, on a moment.",
  },
];

/** The violet temperature: the five narrowed to violet and its neighbour, taken
 *  from the lamp set's literals. The beat reads violet without a single colour
 *  entering the system that was not already in it. */
const LEANED: CSSProperties = {
  "--lamp-1": LAMP_SET[4],
  "--lamp-2": LAMP_SET[3],
  "--lamp-3": LAMP_SET[4],
  "--lamp-4": LAMP_SET[4],
  "--lamp-5": LAMP_SET[3],
} as CSSProperties;

function PublishFrame({
  beat,
  runId,
  published,
  small,
}: {
  beat: BeatId;
  runId: number;
  published: boolean;
  small: boolean;
}) {
  const w = small ? 150 : 268;
  const h = Math.round(w * 0.62);
  const bloom = beat !== "shipped";
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* ★ A BLOOM'S LIGHT LIVES IN A BOX BIGGER THAN THE OBJECT. [data-glw] is
          overflow:hidden, so a glow inset to the frame cannot spill past it and
          reads as a rounded rectangle of colour (design-system.md found this
          twice: the reel treatment and the QR plate). The host is -inset-20. */}
      {bloom ? (
        <div
          aria-hidden
          className="absolute -inset-20"
          style={beat === "leaned" ? LEANED : undefined}
        >
          <Glow
            shape="bloom"
            runId={runId}
            vars={{
              "--glw-base": published ? "0.22" : "0.06",
              "--glw-strength": "0.72",
              "--glw-reach": "62%",
              "--glw-blur": "26px",
            }}
          />
        </div>
      ) : null}
      <div
        className="relative h-full w-full overflow-hidden border border-border"
        style={{ borderRadius: "var(--radius)" }}
      >
        <Photo
          id="concert-confetti"
          sizes="260px"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/90">
            <span
              aria-hidden
              className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-black/80"
            />
          </span>
        </div>
        {/* The shipped beat, verbatim: the production attribute and the
            production keyframe in globals.css, re-keyed to replay. It declares
            nothing outside its animation, so its rest state is no state, which
            is the difference the other two are arguing with. */}
        {beat === "shipped" && published ? (
          <div
            key={runId}
            aria-hidden
            data-rxp-pubglow
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: "var(--radius)" }}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ──────────────────────────────  THE THROW  ─────────────────────────────── */

/** The plate's two lights, side by side on the same real frame: the shipped
 *  ignition (centred, no vector, a MARK that says the code is live) and the
 *  throw (anchored under the plate, a vector, spill). */
function Plate({
  light,
  small,
}: {
  light: "shipped" | "throw";
  small: boolean;
}) {
  const w = small ? 150 : 210;
  return (
    <div className="relative isolate" style={{ width: w }}>
      <div aria-hidden className="pointer-events-none absolute -inset-24 -z-10">
        <Glow
          shape={light === "shipped" ? "bloom" : "throw"}
          drive="mask"
          vars={
            light === "shipped"
              ? {
                  "--glw-from-x": "50%",
                  "--glw-from-y": "50%",
                  "--glw-reach": "60%",
                  "--glw-strength": "0.95",
                  "--glw-base": "0.34",
                  "--glw-blur": "26px",
                }
              : {
                  "--glw-from-x": "50%",
                  "--glw-from-y": "72%",
                  "--glw-reach": "72%",
                  "--glw-strength": "0.5",
                  "--glw-base": "0.5",
                  "--glw-blur": "26px",
                }
          }
        />
      </div>
      <div className="w-full rounded-2xl border bg-card p-3 ring-1 ring-foreground/5">
        <div className="grid grid-cols-9 gap-px rounded-lg bg-white p-2">
          {Array.from({ length: 81 }, (_, i) => {
            const r = Math.floor(i / 9);
            const c = i % 9;
            const finder =
              (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
            const on = finder || (i * 7) % 5 < 2;
            return (
              <span
                key={i}
                className={cn(
                  "aspect-square rounded-[1px]",
                  on ? "bg-black" : "bg-transparent",
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TreatmentsPart({
  mode,
  ground,
  runId,
}: {
  mode: Mode;
  ground: Ground;
  runId: number;
}) {
  const small = mode === "phone";
  const footer = sectionById("footer");
  const pricing = sectionById("pricing");

  return (
    <div className="flex flex-col gap-4">
      <Spec
        id="lgt-t-seam"
        treatment="seam"
        surface="the real marketing footer"
        place="the cut between the page and the ink slab"
        direction="down, perpendicular to the edge"
        colour="the house five (no media on this surface)"
        admitted="The place rule. Law 1 as written forbids it, which is the correction this board proposes."
        takeaway={
          <>
            The seam is the model for every boundary light on the site, and its
            calibration is not a starting point to tune from: 210px, 0.62 base
            and band, 16px blur, the 4 5 1 2 3 hue order, the 100 degree nine
            stop comet at 280 percent. Copy the composition too, not only the
            numbers. The lamp and the hairline are siblings, the parent is the
            positioning context, and the content comes after the lamp and is
            positioned, so the light stays behind the copy with no z-index
            anywhere on the page.
          </>
        }
      >
        <Labeled
          name="The footer, as it ships"
          note="Pinned to ink, because this is the ground the footer actually has: it is the boundary treatment, and its whole subject is two grounds meeting."
        >
          <Stage mode={mode} ground="ink" height={footer.h[mode]}>
            {footer.render()}
          </Stage>
        </Labeled>
      </Spec>

      <Spec
        id="lgt-t-throw"
        treatment="throw"
        surface="the QR plate, beside the light that ships there"
        place="under the plate, where it meets the dark"
        direction="upward and outward from --glw-from-x / -y"
        colour="the house five, or sampled where the object has media"
        admitted="Laws 1 and 2: a plate on open dark is a place, and the origin anchor is the vector."
        takeaway={
          <>
            A finding rather than a preference, and it corrects the kit{"'"}s
            own first draft. The QR plate{"'"}s light is NOT spill: it is a
            bloom, centred at 50 by 50, with no vector at all, decaying to a
            resting 0.34. Under law 2 a vectorless field is exactly the even rim
            the doctrine refuses, and it is admitted here because it is a MARK
            and not a fill: the plate is lit because the code is live. So the
            plate keeps its bloom, and the throw is the treatment for a plate
            that is merely PRESENT rather than live. Naming which job a light is
            doing is what makes both legal.
          </>
        }
      >
        <Labeled
          name="The feature hero, as it ships"
          note="The real /features/qr hero. The plate's light is the shipped bloom: a mark, not a field."
        >
          <Stage mode={mode} ground={ground === "paper" ? "paper" : "cinema"}>
            <div className="h-full overflow-hidden">
              <QrHero />
            </div>
          </Stage>
        </Labeled>
        <Labeled
          name="The two lights on the same plate"
          note="Left: the shipped ignition, centred, no vector. Right: the throw, anchored under the plate, with one."
        >
          <Stage
            mode={mode}
            ground={ground}
            height={small ? 620 : 420}
            className="grid place-items-center"
          >
            <div
              className={cn(
                "grid w-full place-items-center gap-10",
                small ? "grid-cols-1 px-8" : "grid-cols-2 px-16",
              )}
            >
              <Plate light="shipped" small={small} />
              <Plate light="throw" small={small} />
            </div>
          </Stage>
        </Labeled>
      </Spec>

      <Spec
        id="lgt-t-sweep"
        treatment="sweep"
        surface="the production reel frame, arriving"
        place="outside the frame, passing across it"
        direction="diagonally across, and around the border"
        colour="the house five, or sampled from the media that arrived"
        admitted="Laws 2 and 4: the comet declares its vector and the ring rests at a base rather than going dark."
        takeaway={
          <>
            The sweep is the one shape in the kit that nothing in production
            uses, and it is the one an arrival wants. Its edge ring is the half
            of the recipe we never adopted, and our deviation from that recipe
            is the part worth keeping: a faint always-on ring under the
            travelling comet, so the edge survives the paused and reduced motion
            states the original leaves dark. Its scale token is doing real work,
            not decoration: without it the ring sits inside the object and reads
            as a second box.
          </>
        }
        lands="nothing new. The engine already has it; it needs a call site, and the first one should be an upload landing."
      >
        <Labeled
          name="A frame arriving"
          note="Press Replay in the dock to run it again. The ring rests lit, which is the difference from the recipe."
        >
          <Stage
            mode={mode}
            ground={ground}
            height={small ? 400 : 480}
            className="grid place-items-center"
          >
            <Arriving runId={runId} small={small} />
          </Stage>
        </Labeled>
      </Spec>

      <Spec
        id="lgt-t-bloom"
        treatment="bloom"
        surface="the publish moment, on the reel's own frame"
        place="the object the moment happened to"
        direction="outward, once, from the object's centre"
        colour="the house five, leaned toward the nearest hue by the surface"
        admitted="Law 4: it decays to a base rather than to nothing, so the object stays lit while it is live."
        takeaway={
          <>
            Light never takes its colour from a meaning. A moment that wants a
            hue takes the nearest of the five and leans the set toward it, which
            is the aurora{"'"}s own grammar applied to a beat: 300 becomes 305,
            the violet is kept, law 3 stands, and the engine gains nothing it
            did not already have. The second finding decides it on its own: the
            shipped beat declares nothing outside its animation, so a visitor
            who asked for less motion is told nothing at all when their reel
            goes live. A bloom rests at its base in both states.
          </>
        }
        lands="the reel's publish flourish swaps rxp-pubglow for a bloom at the leaned five."
      >
        <Labeled
          name="Publish, three ways"
          note="Replay in the dock is the publish. Watch what each one leaves BEHIND, not what it does."
        >
          <Stage
            mode={mode}
            ground={ground === "paper" ? "app-light" : "app-dark"}
            height={small ? 700 : 400}
          >
            <div
              className={cn(
                "grid h-full items-center gap-8",
                small ? "grid-cols-1 px-6" : "grid-cols-3 px-12",
              )}
            >
              {BEATS.map((b) => (
                <div key={b.id} className="flex flex-col items-center gap-2">
                  <div
                    className="flex w-full items-center justify-center"
                    style={{ height: small ? 132 : 210 }}
                  >
                    <PublishFrame
                      beat={b.id}
                      runId={runId}
                      published={runId > 0}
                      small={small}
                    />
                  </div>
                  <div className="max-w-[26ch] text-center">
                    <p className="text-[11px] font-medium">{b.label}</p>
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      {b.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Stage>
        </Labeled>
      </Spec>

      <Spec
        id="lgt-t-halo"
        treatment="halo"
        surface="the production Button, in both of its variants"
        place="behind the object, clipped by the object's own radius"
        direction="from behind, outward, the centre cleared"
        colour="the house five"
        admitted="The beam's standing exception: a premium object at rest. Anything else has to argue."
        takeaway={
          <>
            The halo needs a dark object, and our primary action is white. The
            doctrine board measured that on a pill it had darkened itself; on
            the real Button it becomes a rule with a consequence. The halo can
            light a SECONDARY action and it cannot light the primary one, so its
            place is an action at the end of a flow rather than the call to
            action at the top of a page. The left specimen is the failure, kept
            on the board because the failure is the argument.
          </>
        }
      >
        <Labeled
          name="The same halo on both variants"
          note="Left: the default (white) action, with nowhere for a light wash to show. Right: the secondary, which has the headroom."
        >
          <Stage
            mode={mode}
            ground={ground}
            height={small ? 300 : 260}
            className="grid place-items-center"
          >
            <div
              className={cn(
                "flex w-full items-center justify-center gap-12",
                small ? "flex-col gap-8" : "flex-row",
              )}
            >
              <HaloButton variant="default" label="Create an event" />
              <HaloButton variant="secondary" label="See a real album" />
            </div>
          </Stage>
        </Labeled>
      </Spec>

      <Spec
        id="lgt-t-beam"
        treatment="beam"
        surface="the real pricing band, where the one standing exception ships"
        place="the object itself, while its state runs"
        direction="around the border, at the object's own radius"
        colour="the live register: the same five hues at effect-grade chroma"
        admitted="Beam law 1 for a live subject, and the one standing exception for Pro at rest."
        takeaway={
          <>
            The beam is the only treatment in the kit that is not the spill
            engine, and it must stay that way: it is the vendored border beam at
            a DERIVED register of the same five hues, generated rather than
            tokenised, and it cannot be a var() because the vendor file parses
            rgb() strings to compute its alpha variants. One wrapper per
            subject, theme passed explicitly, and never a raw beam at a call
            site. The ground is why this one ships and the two other beam
            surfaces did not: ink takes the beam, paper takes spill.
          </>
        }
      >
        <Labeled
          name="The pricing band, as it ships"
          note="Pinned to cinema: the home pricing teaser sits in the closing cinema chapter, which is the whole reason this beam was allowed."
        >
          <Stage mode={mode} ground="cinema" height={pricing.h[mode]}>
            {pricing.render()}
          </Stage>
        </Labeled>
      </Spec>
    </div>
  );
}
