"use client";

import { type CSSProperties } from "react";

import {
  CellLabel,
  GroundBox,
  ReplayButton,
  useMountOnApproach,
  useReplay,
  type Ground,
  type Mode,
} from "@/components/lab";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { EventCard } from "@/components/app/event-card";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { QrFrame, ReelFrame } from "@/components/marketing/frames";
import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import { ProCardBeam } from "@/components/marketing/sections/home/pro-card-beam";
import { Glow } from "@/components/shared/glow";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { Light, type Placement, type Register } from "./composer";
import { type TreatmentId } from "./kit";
import { Copy, Photo, useCentredCrop } from "./shared";

/**
 * ONE CARD'S PREVIEW: THE REAL SURFACE WEARING ONE TREATMENT (round six, the
 * revamp, 2026-09-16).
 *
 * ★ EVERY PREVIEW IS AT TRUE SIZE AND NOTHING IS SCALED (Will, 2026-09-15:
 * "never zoom, scale or transform a specimen whose size is being judged"). A
 * card-scale treatment is its production component at its natural pixels; a
 * section-scale one is the real section rendered at the canvas width inside a
 * CROP, which is a window onto it rather than a shrunken picture of it. Scroll
 * the crop sideways and the rest of the section is there, at the same pixels.
 *
 * ★ AND A DELTA IS SHOWN AS A DELTA. Will's round-five review stopped at the
 * depth question because the previews could not answer it ("hard to visibly
 * tell what Family and Lift are"). Five of the twelve are a cue that either is
 * or is not on a surface, and for those the card is the SAME surface twice,
 * touching: without it, then with it. Nothing else differs, so the difference
 * is the only thing there is to see.
 *
 * ★ THE LABELS SIT UNDER THE JUDGED AREA, NEVER INSIDE IT. Every cue here is an
 * edge treatment, so a caption box drawn around a specimen would be a fifth cue
 * competing with the four.
 */

/* ── Furniture ───────────────────────────────────────────────────────────── */

/** The same surface twice, touching: without the treatment, then with it. */
function Delta({
  ground,
  without,
  with: withIt,
  left = "Without",
  right = "With it",
}: {
  ground: Ground;
  without: React.ReactNode;
  with: React.ReactNode;
  left?: string;
  right?: string;
}) {
  return (
    <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <figure className="flex flex-col gap-1.5">
          {without}
          <figcaption className="text-[10px] text-muted-foreground">
            {left}
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-1.5">
          {withIt}
          <figcaption className="text-[10px] text-muted-foreground">
            {right}
          </figcaption>
        </figure>
      </div>
    </GroundBox>
  );
}

/**
 * A WINDOW ONTO A REAL SECTION, AT 1:1.
 *
 * ★ A CROP IS NOT A SCALE. The section is laid out at the canvas width and this
 * box shows as much of it as the card is wide, with the rest one sideways
 * scroll away. Every pixel inside it is the pixel the page ships, which is the
 * whole reason a stage that zoom-fits was ruled out.
 *
 * ★ AND IT MOUNTS ON APPROACH. Twelve cards carrying two real marketing
 * sections and a footer is a board that stutters for ten seconds before it can
 * be read; the observer is 300px ahead of the reader, which is one flick.
 *
 * ★ data-inview="true" IS LOAD-BEARING, NOT DECORATION. marketing.css keys the
 * chapter-1 entrance grammar off `[data-inview="true"] [data-mkt-reveal]`, and
 * a section's own Reveal needs an IntersectionObserver ratio its wrapper cannot
 * reach inside a 340px window onto a 790px chapter: the copy then sits at
 * opacity 0 for ever and the card reads as an empty box. Declaring the settled
 * state on the crop is the type-scale board's own remedy, and it is the right
 * one here too, because this board judges LIGHT and not an entrance.
 */
function Crop({
  ground,
  mode,
  height,
  children,
}: {
  ground: Ground;
  mode: Mode;
  height: number;
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
        style={{ width, height }}
      >
        {/* The settled entrance, declared rather than observed: see the third
            landmine. It rides an inner div because marketing.css's rule is a
            DESCENDANT selector, so any ancestor carrying it will do. */}
        <div data-inview="true" className="h-full w-full">
          {near ? children : null}
        </div>
      </GroundBox>
    </div>
  );
}

/**
 * ONE CARD'S OWN REPLAY (Will's brief for this round: every card that runs a
 * one-shot carries its own). A one-shot has already finished by the time a
 * reviewer reaches its card, and the honest way to run one again is to REMOUNT
 * it: the incrementing key is the whole mechanism, and an animationend listener
 * races the compositor.
 */
function CardReplay({
  render,
}: {
  render: (runId: number) => React.ReactNode;
}) {
  const { runId, replay } = useReplay();
  return (
    <div className="flex flex-col gap-2">
      {render(runId)}
      <div>
        <ReplayButton runId={runId} onReplay={replay} />
      </div>
    </div>
  );
}

/* ── The real surfaces ───────────────────────────────────────────────────── */

/** The dashboard's own card, the production component, with a real cover. */
function RealEventCard({
  cue,
  ring,
  width = 250,
}: {
  cue?: "lift" | "float" | "lit";
  ring?: boolean;
  width?: number;
}) {
  return (
    <div
      style={{ width, borderRadius: "var(--radius-tile)" }}
      className={cn(ring && "ring-1 ring-foreground/10")}
      data-lgt-cue={cue}
    >
      <EventCard
        href={null}
        name="Sam and Priya"
        coverUrl={marketingImage("wedding-golden").src}
        dateLabel="14 June"
        itemsLabel="238 items"
        statusLabel="Open"
      />
    </div>
  );
}

/** A layer over content the page keeps living behind: the popover's own tokens,
 *  at the float radius, because a radix portal leaves every wrapper a board
 *  paints and cannot be shown wearing a candidate at all. */
function RealLayer({ cue }: { cue?: "float" }) {
  return (
    <div className="relative" style={{ width: 250, height: 172 }} aria-hidden>
      <Copy lines={5} width={250} className="absolute inset-x-0 top-1" />
      <div
        className="absolute right-0 bottom-0 w-[70%] border border-border bg-popover p-3"
        style={{ borderRadius: "var(--radius-float)" }}
        data-lgt-cue={cue}
      >
        <div className="space-y-2">
          {[86, 64, 74, 52].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-foreground/25"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Two photographs of the same lightness, overlapping. The lift's own case. */
function Overlap({ cue }: { cue?: "lift" }) {
  return (
    <div className="relative" style={{ width: 250, height: 180 }} aria-hidden>
      {[
        { id: "reception-hall", x: 0, r: -7, z: 0 },
        { id: "wedding-toast", x: 82, r: 6, z: 1 },
      ].map((s) => (
        <Photo
          key={s.id}
          id={s.id}
          sizes="160px"
          cue={cue}
          className="absolute top-1/2"
          style={{
            left: s.x,
            width: 168,
            height: 142,
            zIndex: s.z,
            translate: "0 -50%",
            rotate: `${s.r}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** The player's canvas: the one surface globals.css declares identical in
 *  light and dark, so the lit face keeps its dark form on every ground. */
function Screen({ cue }: { cue?: "lit" }) {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-xl bg-gallery"
      style={{ width: 250, height: 140 }}
      data-lgt-cue={cue}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-white/90">
          <span
            aria-hidden
            className="ml-0.5 border-y-[5px] border-l-[8px] border-y-transparent border-l-black/80"
          />
        </span>
      </div>
      <div className="absolute inset-x-3 bottom-2.5 h-1 rounded-full bg-white/25">
        <div className="h-full w-1/3 rounded-full bg-gallery-foreground/90" />
      </div>
    </div>
  );
}

/** The violet temperature: the five narrowed to violet and its neighbour, taken
 *  from the lamp set's own literals, so the beat reads violet without a single
 *  colour entering the system that was not already in it. */
const LEANED: CSSProperties = {
  "--lamp-1": LAMP_SET[4],
  "--lamp-2": LAMP_SET[3],
  "--lamp-3": LAMP_SET[4],
  "--lamp-4": LAMP_SET[4],
  "--lamp-5": LAMP_SET[3],
} as CSSProperties;

/* ── The twelve ──────────────────────────────────────────────────────────── */

export function TreatmentPreview({
  id,
  ground,
  mode,
  landing,
  register,
}: {
  id: TreatmentId;
  ground: Ground;
  mode: Mode;
  landing: Placement;
  register: Register;
}) {
  switch (id) {
    /* ── SEPARATE ──────────────────────────────────────────────────────── */
    case "step":
      return (
        <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
          <div className="flex flex-wrap gap-3">
            <RealEventCard />
            <RealEventCard />
          </div>
        </GroundBox>
      );

    case "ring":
      return (
        <Delta
          ground={ground}
          without={<RealEventCard />}
          with={<RealEventCard ring />}
        />
      );

    case "lift":
      return (
        <Delta
          ground={ground}
          without={<Overlap />}
          with={<Overlap cue="lift" />}
        />
      );

    case "float":
      return (
        <Delta
          ground={ground}
          without={<RealLayer />}
          with={<RealLayer cue="float" />}
        />
      );

    case "face":
      return (
        <Delta
          ground={ground}
          without={<Screen />}
          with={<Screen cue="lit" />}
        />
      );

    /* ── FILL ──────────────────────────────────────────────────────────── */
    case "seam":
      // Pinned to ink: the footer IS the boundary treatment, and its whole
      // subject is two grounds meeting.
      return (
        <Crop ground="ink" mode={mode} height={300}>
          <MarketingFooter />
        </Crop>
      );

    case "throw":
      return (
        <Delta
          ground={ground}
          left="The plate's shipped bloom"
          right="The throw"
          without={
            <div
              className="relative isolate"
              style={{ width: "min(210px, 100%)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-20 -z-10"
              >
                <Glow
                  shape="bloom"
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "50%",
                    "--glw-reach": "60%",
                    "--glw-strength": "0.95",
                    "--glw-base": "0.34",
                    "--glw-blur": "26px",
                  }}
                />
              </div>
              <QrFrame />
            </div>
          }
          with={
            <div
              className="relative isolate"
              style={{ width: "min(210px, 100%)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-20 -z-10"
              >
                <Glow
                  shape="throw"
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "72%",
                    "--glw-reach": "72%",
                    "--glw-strength": "0.5",
                    "--glw-base": "0.5",
                    "--glw-blur": "26px",
                  }}
                />
              </div>
              <QrFrame />
            </div>
          }
        />
      );

    case "aurora": {
      // ★ A WHOLE CHAPTER, NOT A WINDOW ONTO ONE. The aurora's bands are 42
      // percent of the SECTION's height at each of its own boundaries, so a
      // crop shorter than the section would put the light at the crop's edges
      // instead of the chapter's and show a grammar nobody proposed. The closer
      // is the shortest real chapter on the home page and it is the aurora's
      // own phase-2 call site, so the card is all 510 pixels of it.
      //
      // The footer is NOT in question under any Landing: it keeps its own seam
      // either way, which is the confusion this switch exists to end.
      const g = ground === "app-dark" ? "cinema" : ground;
      const h = mode === "desktop" ? 510 : 600;
      return (
        <Crop ground={g} mode={mode} height={h}>
          <div className="relative isolate h-full w-full overflow-hidden">
            <Light
              treatment="aurora"
              placement={landing}
              ground={g}
              register={register}
              clock="aurora"
              height={h}
              grain
              drive="mask"
            />
            <div className="relative">
              <CinemaClose />
            </div>
          </div>
        </Crop>
      );
    }

    /* ── MARK ──────────────────────────────────────────────────────────── */
    case "sweep":
      return (
        <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
          <CardReplay
            render={(runId) => (
              <div
                className="relative isolate"
                style={
                  {
                    width: "min(380px, 100%)",
                    "--glw-radius": "18px",
                  } as CSSProperties
                }
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
            )}
          />
        </GroundBox>
      );

    case "bloom":
      return (
        <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
          <CardReplay
            render={(runId) => (
              <div className="relative" style={{ width: "min(380px, 100%)" }}>
                {/* ★ A BLOOM'S LIGHT LIVES IN A BOX BIGGER THAN THE OBJECT.
                    [data-glw] is overflow:hidden, so a glow inset to the frame
                    cannot spill past it and reads as a rounded rectangle of
                    colour (the reel treatment and the QR plate both found this
                    the hard way). The host is -inset-20. */}
                <div aria-hidden className="absolute -inset-20" style={LEANED}>
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
              </div>
            )}
          />
        </GroundBox>
      );

    case "halo":
      // ★ THE HALO NEEDS A DARK OBJECT, AND OUR PRIMARY IS WHITE. On the real
      // Button, in the real variants, that becomes a rule with a consequence:
      // the halo can light a secondary action and cannot light the primary one.
      // Both are here, because the failure is the argument.
      return (
        <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <figure className="flex flex-col gap-1.5">
              <HaloButton variant="default" label="Create an event" />
              <figcaption className="text-[10px] text-muted-foreground">
                The primary: no headroom
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-1.5">
              <HaloButton variant="secondary" label="See the album" />
              <figcaption className="text-[10px] text-muted-foreground">
                A secondary: it reads
              </figcaption>
            </figure>
          </div>
        </GroundBox>
      );

    case "beam":
      return (
        <GroundBox ground={ground} className="overflow-hidden rounded-lg p-3">
          <div style={{ width: "min(300px, 100%)" }}>
            <ProCardBeam>
              <div className="rounded-[var(--radius-card)] border border-border bg-card p-4">
                <p className="text-[13px] font-medium">Pro</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Unlimited events, 250 GB, no watermark.
                </p>
                <Button size="sm" className="mt-3 h-8 w-full text-[12px]">
                  Go Pro
                </Button>
              </div>
            </ProCardBeam>
          </div>
        </GroundBox>
      );

    default:
      return null;
  }
}

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

/** The one line under the grid, so a reviewer knows what he is looking at
 *  before he starts pressing things. */
export function CatalogNote() {
  return (
    <CellLabel className="max-w-2xl">
      Pick drives the whole page; A and B set the compare under it. Rule each
      card keep, refine or kill in its own row. Two keeps on Lift and Float is
      the shadow family, one keep is the lift only, two kills is dark stays
      shadowless.
    </CellLabel>
  );
}
