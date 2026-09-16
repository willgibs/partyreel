"use client";

import { type CSSProperties } from "react";

import {
  GroundBox,
  Loupe,
  ReplayButton,
  useReplay,
  type Mode,
} from "@/components/lab";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { EventCard } from "@/components/app/event-card";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { QrFrame, ReelFrame } from "@/components/marketing/frames";
import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { ProCardBeam } from "@/components/marketing/sections/home/pro-card-beam";
import { Glow } from "@/components/shared/glow";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { Light, type Placement } from "./composer";
import { type TreatmentId } from "./kit";
import { Copy, Photo, SectionCrop } from "./shared";

/**
 * THE TWELVE, AS PICTURES (round seven, the stepped review, 2026-09-16).
 *
 * ★ THREE SPECIMENS, ONE PER JOB, AND THE TREATMENT IS THE ONLY VARIABLE.
 * Will's stop on this board was "some I can't even tell what the treatment is
 * from the comparison", and the cause was twelve cards drawn on twelve
 * different objects: a comparison of two pictures that differ in six ways
 * cannot isolate the one that matters. So the cards of one JOB now share the
 * same object, crop, ground and canvas:
 *
 *   fill      one real chapter (the closer) on cinema, at the canvas width
 *   separate  one pair of overlapping event tiles in a panel, on the app's dark
 *   mark      one reel frame, on the app's dark
 *
 * ★ AND EVERY CARD IS THE SAME PICTURE TWICE: as today, then with it. The
 * before is not a stand-in or a diagram; it is the identical specimen with the
 * treatment removed, so the difference is the only thing there is to see. A
 * cue too fine to read at card size gets a Loupe over BOTH halves (never a
 * bigger or a different specimen, which would be the fault this round fixes).
 *
 * ★ LABELS SIT UNDER THE JUDGED AREA, NEVER INSIDE IT. Every cue here is an
 * edge treatment, so a caption box drawn around a specimen would be a fifth cue
 * competing with the four.
 */

export type Phase = "before" | "after";

/** Which job's specimen a card is judged on. The grouping is `kit.ts`'s. */
export const SPECIMEN_OF: Record<TreatmentId, "chapter" | "tiles" | "reel"> = {
  seam: "chapter",
  throw: "chapter",
  aurora: "chapter",
  step: "tiles",
  ring: "tiles",
  lift: "tiles",
  float: "tiles",
  face: "tiles",
  sweep: "reel",
  bloom: "reel",
  halo: "reel",
  beam: "reel",
};

/** The three cues whose whole delta is one hairline, so the pair takes a lens. */
const HAIRLINE: ReadonlySet<TreatmentId> = new Set<TreatmentId>([
  "step",
  "ring",
  "face",
]);

/** The marks run once and are over, so their pair shares one Replay. */
const ONE_SHOT: ReadonlySet<TreatmentId> = new Set<TreatmentId>([
  "sweep",
  "bloom",
]);

/* ── Furniture ───────────────────────────────────────────────────────────── */

/**
 * A one-shot has already finished by the time a reviewer reaches it, and the
 * honest way to run one again is to REMOUNT it: the incrementing key is the
 * whole mechanism, and an animationend listener races the compositor.
 *
 * ★ THE BUTTON'S ROW IS A FIXED HEIGHT, AND THE HALF WITHOUT ONE KEEPS IT. The
 * pair is bottom-aligned by the kit, so a Replay under only the "with it" half
 * lifted that specimen above its own before and the two stopped being the same
 * picture in the same place, which is the one thing a delta cannot afford.
 */
const REPLAY_ROW = "h-7";

function Replayable({
  render,
}: {
  render: (runId: number) => React.ReactNode;
}) {
  const { runId, replay } = useReplay();
  return (
    <div className="flex flex-col gap-2">
      {render(runId)}
      <div className={REPLAY_ROW}>
        <ReplayButton runId={runId} onReplay={replay} />
      </div>
    </div>
  );
}

/* ── Specimen 1: one real chapter (the fill job) ─────────────────────────── */

const CHAPTER_H = { desktop: 510, phone: 600 } as const;

/**
 * THE CLOSER, THE SHORTEST REAL CHAPTER ON THE HOME PAGE, drawn whole.
 *
 * ★ WHOLE, NOT WINDOWED VERTICALLY. A field at a chapter's own boundaries is
 * 42 percent of the SECTION's height at each end, so a crop shorter than the
 * section would put the light at the crop's edges instead of the chapter's and
 * show a grammar nobody proposed. All 510 pixels of it, every time.
 */
function ChapterSpecimen({
  treatment,
  phase,
  mode,
  landing,
}: {
  treatment: TreatmentId;
  phase: Phase;
  mode: Mode;
  landing: Placement;
}) {
  const h = CHAPTER_H[mode];
  const shape =
    treatment === "seam" ? "seam" : treatment === "throw" ? "throw" : "aurora";
  return (
    <SectionCrop ground="cinema" mode={mode} height={h}>
      <div className="relative isolate h-full w-full overflow-hidden">
        {phase === "after" ? (
          <Light
            treatment={shape}
            // The seam is a BOUNDARY: it sits on the cut where this chapter
            // ends. The throw is anchored low and cast upward, which is the
            // shape a rim has no answer for. The aurora takes the placement
            // under review.
            placement={
              shape === "aurora" ? landing : shape === "seam" ? "bottom" : "top"
            }
            ground="cinema"
            register="accent"
            clock={shape === "aurora" ? "aurora" : "lamp"}
            height={h}
            grain={shape === "aurora"}
            drive="mask"
          />
        ) : null}
        <div className="relative">
          <CinemaClose />
        </div>
      </div>
    </SectionCrop>
  );
}

/* ── Specimen 2: two overlapping event tiles in a panel (the separate job) ── */

const TILE_W = { desktop: 236, phone: 170 } as const;

/**
 * ★ THE SPECIMEN HAS TO FIT A 375 COLUMN. A lab card at 375 is about 330 pixels
 * wide, so the ground's padding plus the panel's plus the object is a budget,
 * not a taste: the first build put a 380-pixel specimen in a 330-pixel card and
 * the phone canvas scrolled sideways on a card that had no reason to.
 */
const PAD = { desktop: "p-6", phone: "p-3" } as const;
const PANEL_PAD = { desktop: "p-5", phone: "p-3" } as const;

/** The dashboard's own card, the production component, with a real cover. */
function Tile({
  id,
  cue,
  ring,
  width,
}: {
  id: string;
  cue?: string;
  ring?: boolean;
  width: number;
}) {
  return (
    <div
      style={{ width, borderRadius: "var(--radius-tile)" }}
      className={cn(ring && "ring-1 ring-foreground/10")}
      data-lgt-cue={cue}
    >
      <EventCard
        href={null}
        name={id === "a" ? "Sam and Priya" : "The Ridgeway summer"}
        coverUrl={
          marketingImage(id === "a" ? "reception-hall" : "wedding-toast").src
        }
        dateLabel={id === "a" ? "14 June" : "2 August"}
        itemsLabel={id === "a" ? "238 items" : "96 items"}
        statusLabel="Open"
      />
    </div>
  );
}

/**
 * THE ONE PAIR EVERY DEPTH CUE IS JUDGED ON: two event tiles of the same
 * lightness, overlapping, inside the panel that holds them on the dashboard.
 *
 * ★ THE PANEL IS HOW THE STEP IS SHOWN. A step is a surface one token lighter
 * than the one under it, and an event tile is a photograph, not a surface: the
 * thing that takes the step is the panel the tiles sit in. So the step's
 * "before" paints that panel at the ground's own colour and its "after" leaves
 * it at the shipped card token. The tiles never move, which is what keeps the
 * five cards on one specimen.
 */
function TilesSpecimen({
  treatment,
  phase,
  mode,
}: {
  treatment: TreatmentId;
  phase: Phase;
  mode: Mode;
}) {
  const w = TILE_W[mode];
  const on = phase === "after";
  const flat = treatment === "step" && !on;
  const cue =
    on &&
    (treatment === "lift" || treatment === "float" || treatment === "face")
      ? treatment === "face"
        ? "lit"
        : treatment
      : undefined;
  return (
    <GroundBox
      ground="app-dark"
      className={cn("overflow-hidden rounded-lg", PAD[mode])}
      style={{ width: "fit-content" }}
    >
      {/* ★ THE PANEL IS PADDED SO IT CAN BE SEEN. A step is a surface against
          the surface under it, so the specimen has to show a real band of both:
          the first build gave the panel four pixels of visible edge and the
          step card read as two identical pictures, which is the exact failure
          this round exists to fix. */}
      <div
        className={cn("rounded-xl", PANEL_PAD[mode])}
        style={{
          // The step, and nothing else: the panel is the shipped card token,
          // or the ground it sits on, which is the same surface with the step
          // taken away.
          background: flat ? "var(--background)" : "var(--card)",
        }}
      >
        {/* The offsets are the overlap's whole subject: enough of the back tile
            showing for the touching edges to be a real edge, and enough of the
            front tile's own chrome clear of it that the pair reads as two
            cards rather than as one collision. */}
        <div
          className="relative"
          style={{ width: Math.round(w * 1.58), height: (w * 10) / 16 + 36 }}
          aria-hidden
        >
          {[
            { id: "a", x: 0, y: 0, z: 0 },
            { id: "b", x: Math.round(w * 0.58), y: 34, z: 1 },
          ].map((t) => (
            <div
              key={t.id}
              className="absolute"
              style={{ left: t.x, top: t.y, zIndex: t.z }}
            >
              <Tile
                id={t.id}
                width={w}
                cue={cue}
                ring={on && treatment === "ring"}
              />
            </div>
          ))}
        </div>
      </div>
    </GroundBox>
  );
}

/* ── Specimen 3: one reel frame (the mark job) ───────────────────────────── */

const REEL_W = { desktop: 360, phone: 250 } as const;

/** The violet temperature: the five narrowed to violet and its neighbour, taken
 *  from the lamp set's own literals, so a beat reads violet without a single
 *  colour entering the system that was not already in it. */
export const LEANED: CSSProperties = {
  "--lamp-1": LAMP_SET[4],
  "--lamp-2": LAMP_SET[3],
  "--lamp-3": LAMP_SET[4],
  "--lamp-4": LAMP_SET[4],
  "--lamp-5": LAMP_SET[3],
} as CSSProperties;

/**
 * ONE REEL FRAME, AND EVERY MARK LANDS ON IT.
 *
 * ★ A MARK'S LIGHT LIVES IN A BOX BIGGER THAN THE OBJECT. `[data-glw]` is
 * overflow:hidden, so a glow inset to the frame cannot spill past it and reads
 * as a rounded rectangle of colour (the reel treatment and the QR plate both
 * found this the hard way). The host is -inset-20.
 */
function ReelSpecimen({
  treatment,
  phase,
  mode,
  runId,
}: {
  treatment: TreatmentId;
  phase: Phase;
  mode: Mode;
  runId: number;
}) {
  const w = REEL_W[mode];
  const on = phase === "after";
  return (
    // ★ THE GROUND IS PADDED TO THE MARK'S OWN REACH. A bloom and a halo rest
    // at a BASE, which fills their host, so a host wider than the ground is
    // clipped into a hard-edged rectangle of colour: the fence "never a light
    // box that ends on screen", drawn by accident. Ten is the host's inset.
    <GroundBox
      ground="app-dark"
      className={cn(
        "overflow-hidden rounded-lg",
        mode === "desktop" ? "p-10" : "p-8",
      )}
      style={{ width: "fit-content" }}
    >
      <div className="relative isolate" style={{ width: w }}>
        {on && treatment === "sweep" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ "--glw-radius": "16px" } as CSSProperties}
          >
            <Glow
              shape="sweep"
              edge
              runId={runId}
              vars={{
                "--glw-scale": "1.35",
                "--glw-radius": "16px",
                "--glw-dur": "6s",
                "--glw-strength": "0.6",
                "--glw-base": "0.35",
              }}
            />
          </div>
        ) : null}
        {on && treatment === "bloom" ? (
          <div aria-hidden className="absolute -inset-10" style={LEANED}>
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
        ) : null}
        {on && treatment === "halo" ? (
          <div
            aria-hidden
            className="absolute -inset-10 overflow-hidden rounded-2xl"
            style={{ "--glw-radius": "16px" } as CSSProperties}
          >
            <Glow
              shape="halo"
              vars={{
                "--glw-blur": "10px",
                "--glw-core": "44%",
                "--glw-strength": "0.95",
                "--glw-base": "0.8",
                "--glw-dur": "5s",
              }}
            />
          </div>
        ) : null}
        {on && treatment === "beam" ? (
          <ProCardBeam>
            <ReelFrame />
          </ProCardBeam>
        ) : (
          <div className="relative">
            <ReelFrame />
          </div>
        )}
      </div>
    </GroundBox>
  );
}

/* ── One card's picture: one half of it ──────────────────────────────────── */

/**
 * ONE HALF OF A CARD'S EVIDENCE: the job's specimen, with the treatment or
 * without it.
 *
 * ★ THE KIT PAIRS THE TWO HALVES, NOT THIS BOARD. `Catalog` takes a `before`
 * and a `render` and draws them through `BeforeAfter` when a card is walked
 * alone, so this returns ONE specimen and the walk owns the composition. The
 * two things a half still owns are its own: a lens, because a hairline is a
 * hairline whichever half it is on, and a Replay, which belongs under the half
 * that actually runs something.
 */
export function TreatmentSpecimen({
  id,
  phase,
  mode,
  landing,
}: {
  id: TreatmentId;
  phase: Phase;
  mode: Mode;
  landing: Placement;
}) {
  const kind = SPECIMEN_OF[id];
  const body = (runId: number) =>
    kind === "chapter" ? (
      <ChapterSpecimen
        treatment={id}
        phase={phase}
        mode={mode}
        landing={landing}
      />
    ) : kind === "tiles" ? (
      <TilesSpecimen treatment={id} phase={phase} mode={mode} />
    ) : (
      <ReelSpecimen treatment={id} phase={phase} mode={mode} runId={runId} />
    );

  // Only the "with it" half of a mark has anything to replay; a Replay under
  // the half that does nothing would be a button that lies. The other half
  // keeps the row, so the two specimens stay level.
  if (ONE_SHOT.has(id))
    return phase === "after" ? (
      <Replayable render={body} />
    ) : (
      <div className="flex flex-col gap-2">
        {body(0)}
        <div className={REPLAY_ROW} aria-hidden />
      </div>
    );
  if (HAIRLINE.has(id)) return <Loupe zoom={3}>{body(0)}</Loupe>;
  return body(0);
}

/* ── Where it already lives: up to two real surfaces, small ──────────────── */

function Usage({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-1.5">
      {children}
      <figcaption className="text-[10px] text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

/** A small plate on open dark, the throw's and the bloom's real call site. */
function Plate({ light }: { light: "throw" | "bloom" | null }) {
  return (
    <GroundBox ground="cinema" className="overflow-hidden rounded-lg p-5">
      <div className="relative isolate" style={{ width: 168 }}>
        {light ? (
          <div aria-hidden className="pointer-events-none absolute -inset-16">
            <Glow
              shape={light}
              vars={
                light === "throw"
                  ? {
                      "--glw-from-x": "50%",
                      "--glw-from-y": "72%",
                      "--glw-reach": "72%",
                      "--glw-strength": "0.5",
                      "--glw-base": "0.5",
                      "--glw-blur": "22px",
                    }
                  : {
                      "--glw-from-x": "50%",
                      "--glw-from-y": "50%",
                      "--glw-reach": "60%",
                      "--glw-strength": "0.95",
                      "--glw-base": "0.34",
                      "--glw-blur": "22px",
                    }
              }
            />
          </div>
        ) : null}
        <QrFrame />
      </div>
    </GroundBox>
  );
}

/** The player's canvas: the one surface declared identical in light and dark,
 *  so the lit face keeps its dark form on every ground. */
function Canvas({ lit, ring }: { lit?: boolean; ring?: boolean }) {
  return (
    <GroundBox ground="app-dark" className="overflow-hidden rounded-lg p-4">
      <div
        aria-hidden
        className={cn(
          "relative overflow-hidden rounded-xl bg-gallery",
          ring && "ring-1 ring-foreground/10",
        )}
        style={{ width: 230, height: 130 }}
        data-lgt-cue={lit ? "lit" : undefined}
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
    </GroundBox>
  );
}

/** A layer over content the page keeps living behind: the popover's own tokens,
 *  at the float radius, because a radix portal leaves every wrapper a board
 *  paints and so cannot be shown wearing a candidate at all. */
function Popover() {
  return (
    <GroundBox ground="app-dark" className="overflow-hidden rounded-lg p-4">
      <div className="relative" style={{ width: 236, height: 160 }} aria-hidden>
        <Copy lines={5} width={236} className="absolute inset-x-0 top-1" />
        <div
          className="absolute right-0 bottom-0 w-[70%] border border-border bg-popover p-3"
          style={{ borderRadius: "var(--radius-float)" }}
          data-lgt-cue="float"
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
    </GroundBox>
  );
}

/** The halo's own failure, kept as a usage: it cannot light a white primary. */
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

/**
 * UP TO TWO REAL SURFACES ALREADY WEARING THE TREATMENT, small.
 *
 * ★ THIS IS THE HALF THE BEFORE AND AFTER CANNOT CARRY. The specimen holds
 * every variable still, which is what makes the delta readable and also what
 * makes it abstract: the lamps are judged on one chapter, so the seam's own
 * footer and the throw's own plate would never appear. A usage is where the
 * treatment actually lands, at its natural size, and it is the direct answer to
 * "how will each be applied platform wide?" beside the card's `lands` line.
 */
export function Usages({ id, mode }: { id: TreatmentId; mode: Mode }) {
  const nodes = usageNodes(id, mode);
  if (nodes.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start gap-4">
      {nodes.map((u) => (
        <Usage key={u.label} label={u.label}>
          {u.node}
        </Usage>
      ))}
    </div>
  );
}

function usageNodes(
  id: TreatmentId,
  mode: Mode,
): { label: string; node: React.ReactNode }[] {
  switch (id) {
    case "seam":
      return [
        {
          label: "The footer, as it ships today",
          node: (
            <SectionCrop ground="ink" mode={mode} height={220}>
              <MarketingFooter />
            </SectionCrop>
          ),
        },
      ];
    case "throw":
      return [
        {
          label: "A QR plate on open dark",
          node: <Plate light="throw" />,
        },
      ];
    case "aurora":
      return [
        {
          label: "The guest ledger, a chapter with no media",
          node: (
            <SectionCrop ground="cinema" mode={mode} height={300}>
              <div className="relative isolate h-full w-full overflow-hidden">
                <Light
                  treatment="aurora"
                  placement="top"
                  ground="cinema"
                  register="accent"
                  clock="aurora"
                  height={300}
                  grain
                  drive="mask"
                />
                <div className="relative">
                  <NoApp />
                </div>
              </div>
            </SectionCrop>
          ),
        },
        {
          label: "A paper chapter, the same field",
          node: (
            <SectionCrop ground="paper" mode={mode} height={300}>
              <div className="relative isolate h-full w-full overflow-hidden">
                <Light
                  treatment="aurora"
                  placement="top"
                  ground="paper"
                  register="accent"
                  clock="aurora"
                  height={300}
                  grain
                  drive="mask"
                />
                <div className="relative">
                  <Privacy />
                </div>
              </div>
            </SectionCrop>
          ),
        },
      ];
    case "step":
      return [
        {
          label: "Every panel and well in the app, today",
          node: (
            <GroundBox
              ground="app-dark"
              className="overflow-hidden rounded-lg p-4"
            >
              <div className="w-[236px] rounded-xl bg-card p-3">
                <Copy lines={3} width={212} />
              </div>
            </GroundBox>
          ),
        },
      ];
    case "ring":
      return [
        {
          label: "A media frame, at the heavier register",
          node: <Canvas ring />,
        },
      ];
    case "lift":
      return [
        {
          label: "The host's tiles, where two covers touch",
          node: <TilesSpecimen treatment="lift" phase="after" mode={mode} />,
        },
      ];
    case "float":
      return [
        {
          label: "A popover over content that keeps living",
          node: <Popover />,
        },
      ];
    case "face":
      return [
        { label: "The gallery canvas", node: <Canvas lit /> },
        { label: "The QR plate", node: <Plate light={null} /> },
      ];
    case "sweep":
      return [
        {
          label: "A frame landing in the strip",
          node: (
            <GroundBox
              ground="cinema"
              className="overflow-hidden rounded-lg p-6"
            >
              <Replayable
                render={(runId) => (
                  <div
                    className="relative isolate"
                    style={
                      { width: 210, "--glw-radius": "12px" } as CSSProperties
                    }
                  >
                    <Glow
                      shape="sweep"
                      edge
                      runId={runId}
                      vars={{
                        "--glw-scale": "1.35",
                        "--glw-radius": "12px",
                        "--glw-dur": "6s",
                        "--glw-strength": "0.6",
                        "--glw-base": "0.35",
                      }}
                    />
                    <div className="relative">
                      <Photo id="reception-hall" className="h-[132px] w-full" />
                    </div>
                  </div>
                )}
              />
            </GroundBox>
          ),
        },
      ];
    case "bloom":
      return [
        {
          label: "The QR plate's ignition, already shipping",
          node: <Plate light="bloom" />,
        },
      ];
    case "halo":
      return [
        {
          label: "A white primary: no headroom for it",
          node: (
            <GroundBox
              ground="app-dark"
              className="overflow-hidden rounded-lg p-4"
            >
              <HaloButton variant="default" label="Create an event" />
            </GroundBox>
          ),
        },
        {
          label: "A secondary action: it reads",
          node: (
            <GroundBox
              ground="app-dark"
              className="overflow-hidden rounded-lg p-4"
            >
              <HaloButton variant="secondary" label="See the album" />
            </GroundBox>
          ),
        },
      ];
    case "beam":
      return [
        {
          label: "The Pro card at rest, the standing exception",
          node: (
            <GroundBox
              ground="cinema"
              className="overflow-hidden rounded-lg p-4"
            >
              <div style={{ width: 236 }}>
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
          ),
        },
      ];
    default:
      return [];
  }
}
