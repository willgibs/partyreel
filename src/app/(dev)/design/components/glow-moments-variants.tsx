"use client";

import Image from "next/image";
import { Camera, Check, Copy, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { Glow, GlowFilter } from "@/components/dev/glow";
import { useSampledPalette } from "@/components/dev/sampled-palette";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  Ground,
  LampCard,
  PhotoWall,
  Section,
  Spec,
  Verdict,
  WALL_IDS,
  type VerdictKind,
} from "./glow-lab-shared";

/**
 * Touchpoint: SPILL PLACEMENTS (the glow round, 2026-08-28).
 *
 * The doctrine board proposes the rule; this one argues the cases. Every
 * specimen names its lamp, its direction, its colour source and the law that
 * admits it, and carries my verdict. The rejects are deliberately built rather
 * than described: a placement you have seen and turned down stays turned down,
 * where one you only read about comes back next quarter.
 *
 * Nothing here is wired into production.
 */

function Moment({
  n,
  title,
  verdict,
  verdictLabel,
  lede,
  lamp,
  direction,
  colour,
  law,
  children,
}: {
  n: string;
  title: string;
  verdict: VerdictKind;
  verdictLabel: string;
  lede: React.ReactNode;
  lamp: string;
  direction: string;
  colour: string;
  law: string;
  children: React.ReactNode;
}) {
  return (
    <Section
      n={n}
      title={title}
      lede={
        <div className="flex flex-col gap-2">
          <div>{lede}</div>
          <div className="flex items-center gap-2">
            <Verdict kind={verdict}>{verdictLabel}</Verdict>
          </div>
        </div>
      }
    >
      {children}
      <LampCard lamp={lamp} direction={direction} colour={colour} law={law} />
    </Section>
  );
}

export function GlowMomentsVariants() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      <GlowFilter />
      <HeroUnderlight />
      <LockedDoor />
      <Doorbell />
      <AwaitingMedia />
      <AlbumStraddle />
      <QrPlate />
      <PublishBeat />
      <CtaQuestion />
      <PaperProbe />
      <UploadAsLight />
      <PointerLamp />
      <ScanThrough />
      <Catalogue />
    </div>
  );
}

/* ── 01 ─────────────────────────────────────────────────────────────────── */

function HeroUnderlight() {
  // The lamp is the WALL, not one tile in it, so the sample reads all of it.
  const sampled = useSampledPalette(
    WALL_IDS.map((id) => marketingImage(id).src),
  );
  return (
    <Moment
      n="01"
      title="The hero underlight"
      verdict="ship"
      verdictLabel="Ship first"
      lede={
        <p>
          The flagship, and the one you named. A wall of photographs is a lit
          screen, and the section under it is the room that screen is lighting.
          It is also the only candidate that forces the whole doctrine into
          existence to work: it needs a named lamp, it needs a direction, and a
          fixed palette under a wall of real photographs reads as a gradient
          sitting below photos rather than light coming off them.
        </p>
      }
      lamp="the hero's media wall"
      direction="down, out of a lit screen"
      colour="sampled from the wall's own photographs"
      law="Law 1, and it is what proves law 3"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Spec
          name="Sampled"
          note="The light is the colour of the photographs above it."
        >
          <HeroStage colors={sampled ?? undefined} />
        </Spec>
        <Spec name="Fallback five" note="The same lamp on the fixed palette.">
          <HeroStage />
        </Spec>
      </div>
    </Moment>
  );
}

function HeroStage({ colors }: { colors?: readonly string[] }) {
  return (
    <Ground on="cinema" className="p-0">
      <div className="relative">
        <PhotoWall cols={4} className="p-0" />
        {/* The wall's own bottom ramp, exactly as the cinema hero has one. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background: "linear-gradient(to top, oklch(0.11 0 0), transparent)",
          }}
        />
      </div>
      <div className="relative isolate min-h-40 px-6 pt-8 pb-10">
        <Glow
          shape="seam"
          drive="mask"
          colors={colors}
          vars={{ "--glw-blur": "24px", "--glw-strength": "0.5" }}
        />
        <div className="relative">
          <p data-dir-display className="text-2xl leading-tight text-balance">
            Everyone was holding a camera. Now you have the photos.
          </p>
          <Button size="lg" className="mt-4 h-11 px-6 text-base">
            Start free
          </Button>
        </div>
      </div>
    </Ground>
  );
}

/* ── 02 ─────────────────────────────────────────────────────────────────── */

function LockedDoor() {
  return (
    <Moment
      n="02"
      title="The locked door"
      verdict="ship"
      verdictLabel="Ship"
      lede={
        <p>
          A guest hits a password-gated event and sees a lock, a count, and a
          grid of empty tiles. Our own component comment calls it
          &ldquo;standing in for the gallery a guest can&rsquo;t see yet&rdquo;.
          This is the only surface in the product where light behind a closed
          door is literally true, and it is the screen where a guest decides
          whether to bother typing the password, so it turns a refusal into a
          promise.
        </p>
      }
      lamp="the album behind the gate"
      direction="up and through the 3px tile gaps"
      colour="fallback five (the media is exactly what cannot be shown)"
      law="Law 1, at its most literal"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec name="Lit" note="The room behind the door is full.">
          <LockStage lit />
        </Spec>
        <Spec name="Today" note="Correct, and completely inert.">
          <LockStage />
        </Spec>
      </div>
    </Moment>
  );
}

function LockStage({ lit = false }: { lit?: boolean }) {
  return (
    <Ground on="cinema" className="relative isolate p-6">
      {/* The spill sits BEHIND the grid: the tiles stay empty, and the light
          between them is what says the room is full. */}
      {lit && (
        <div className="absolute inset-0 isolate -z-10">
          <Glow
            shape="throw"
            drive="mask"
            vars={{
              "--glw-from-y": "55%",
              "--glw-reach": "80%",
              "--glw-strength": "0.75",
              "--glw-base": "0.7",
            }}
          />
        </div>
      )}
      <div className="relative mx-auto max-w-56">
        <div aria-hidden className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center border border-border/70"
              style={{
                borderRadius: "var(--radius-tile)",
                background: "oklch(0.11 0 0 / 0.86)",
              }}
            >
              {i % 4 === 1 && (
                <Camera className="size-4 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-center gap-1 text-center">
          <Lock className="size-4 text-muted-foreground" />
          <p className="text-[15px] font-medium">
            247 photos and videos inside
          </p>
          <p className="text-sm text-muted-foreground">
            Ask the host for the password.
          </p>
        </div>
      </div>
    </Ground>
  );
}

/* ── 03 ─────────────────────────────────────────────────────────────────── */

function Doorbell() {
  const [runId, setRunId] = useState(0);
  const arrived = marketingImage("concert-confetti");
  const sampled = useSampledPalette(arrived.src);
  return (
    <Moment
      n="03"
      title="The doorbell arrival"
      verdict="work"
      verdictLabel="Wants a real device pass"
      lede={
        <p>
          Someone else&rsquo;s photo just landed in your album. This is the
          product&rsquo;s actual miracle and it currently has zero ceremony by
          design: doorbell tiles carry a zero stagger index so they land
          immediately, while a whole marketing section simulates the same moment
          with flying tiles and a toast. One lap of the edge beam around the
          gallery says &ldquo;something came in from outside&rdquo;, and the
          bloom is sampled from the photo that actually arrived.
        </p>
      }
      lamp="the tile that just merged in"
      direction="outward from the new tile, then once around the container"
      colour="sampled from the arriving photograph"
      law="Law 1, and law 4 (a bloom decays to the base)"
    >
      <div className="flex flex-col gap-4">
        <Ground on="cinema" className="relative isolate p-4">
          <Glow
            shape="bloom"
            drive="mask"
            edge
            runId={runId}
            colors={sampled ?? undefined}
            vars={{
              "--glw-from-x": "18%",
              "--glw-from-y": "28%",
              "--glw-radius": "16px",
              "--glw-scale": "1.6",
            }}
          />
          <div className="relative grid grid-cols-4 gap-[var(--gap-gallery)]">
            {[
              "concert-confetti",
              "wedding-toast",
              "party-dj",
              "festival-crowd",
              "wedding-petals",
              "reception-table",
              "party-balloons",
              "wedding-arch",
            ].map((id, i) => {
              const img = marketingImage(id);
              return (
                <div
                  key={id}
                  className="relative aspect-[4/5] overflow-hidden"
                  style={{ borderRadius: "var(--radius-tile)" }}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute inset-x-1 bottom-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                      just arrived
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Ground>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setRunId((r) => r + 1)}>
            Ring the doorbell
          </Button>
          <p className="text-xs text-muted-foreground">
            At a 200-guest wedding this must fire on the coalescer&rsquo;s
            leading edge only, once per collapsed burst, and never for your own
            upload: those already carry the green success check, and spill over
            a state colour muddles a signal.
          </p>
        </div>
      </div>
    </Moment>
  );
}

/* ── 04 ─────────────────────────────────────────────────────────────────── */

/** A real rAF frame meter, so the perf claim on this board is measured. */
function useFrameRate(active: boolean) {
  const [fps, setFps] = useState<number | null>(null);
  const frames = useRef(0);
  const start = useRef(0);
  useEffect(() => {
    // No sync reset here: the meter DERIVES idle from `active` on the way out
    // (the repo bans setState-in-effect sync resets).
    if (!active) return;
    let raf = 0;
    frames.current = 0;
    start.current = performance.now();
    const tick = (now: number) => {
      frames.current += 1;
      const elapsed = now - start.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        start.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return active ? fps : null;
}

const TILE_COUNT = 30;

/** The album that fills, for the reveal specimen. */
const FILL_IDS = [
  "wedding-golden",
  "concert-confetti",
  "party-balloons",
  "reception-table",
  "festival-lights",
  "wedding-toast",
  "party-dj",
  "wedding-petals",
  "festival-crowd",
  "wedding-arch",
  "reception-hall",
  "wedding-rings",
] as const;

function AwaitingMedia() {
  const [mode, setMode] = useState<"off" | "mask" | "transform" | "single">(
    "single",
  );
  const [revealed, setRevealed] = useState(false);
  const fps = useFrameRate(mode !== "off");

  return (
    <Moment
      n="04"
      title="Awaiting media, and what it fills into"
      verdict="ship"
      verdictLabel="One lamp, with skeletons"
      lede={
        <>
          <p>
            One lamp over the whole grid is the elegant answer and also the more
            honest reading of law 2: an album that is filling is one room, not
            thirty. It is the cheap one too. A turbulence displacement plus a
            blur is re-evaluated every frame over a region 3.24 times the
            element&rsquo;s area, so thirty independent lamps is thirty of
            those.
          </p>
          <p className="mt-2">
            The cards underneath are the recipe&rsquo;s own skeleton reveal:
            cross-fade AND cross-blur, staggered so the album fills rather than
            flashing. The blur is what stops the two states reading as two
            objects overlapping. Press Fill to watch the photos land under the
            light.
          </p>
        </>
      }
      lamp="the photographs on their way"
      direction="diagonally across the album"
      colour="fallback five (nothing has decoded yet, so there is nothing to sample)"
      law="Law 1 is weakest here, which is what the single lamp answers"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "Reset" : "Fill the album"}
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          {(
            [
              ["single", "One lamp over the grid"],
              ["mask", `${TILE_COUNT} lamps, mask drive`],
              ["transform", `${TILE_COUNT} lamps, transform drive`],
              ["off", "Off"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                mode === m
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <span className="ml-1 font-mono text-xs text-muted-foreground">
            {fps === null ? "idle" : `${fps} fps`}
          </span>
        </div>
        <Ground on="cinema" className="relative isolate p-4">
          {mode === "single" && (
            <Glow
              shape="sweep"
              drive="transform"
              vars={{ "--glw-scale": "2.4", "--glw-dur": "4s" }}
            />
          )}
          <div className="relative grid grid-cols-6 gap-[var(--gap-gallery)]">
            {Array.from({ length: TILE_COUNT }, (_, i) => {
              const img = marketingImage(FILL_IDS[i % FILL_IDS.length]);
              return (
                <div
                  key={i}
                  className="glw-skel relative isolate aspect-[4/5]"
                  data-revealed={revealed ? "true" : "false"}
                  style={
                    {
                      borderRadius: "var(--radius-tile)",
                      background: "oklch(0.19 0 0)",
                      "--glw-skel-i": i,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="glw-skel-skeleton"
                    data-pulsing={revealed ? "false" : "true"}
                  >
                    <span className="glw-skel-bone" />
                  </div>
                  <div className="glw-skel-content">
                    <Image
                      src={img.src}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover"
                    />
                  </div>
                  {(mode === "mask" || mode === "transform") && (
                    <Glow
                      shape="sweep"
                      drive={mode}
                      vars={{ "--glw-scale": "0.6", "--glw-dur": "3s" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Ground>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Read the frame counter under CPU throttling, not on a desktop at rest.
          The guest device for this product is a mid-range Android phone, and a
          background tab throttles the counter to nothing, so it needs a
          foreground window.
        </p>
      </div>
    </Moment>
  );
}

/* ── 05 ─────────────────────────────────────────────────────────────────── */

function AlbumStraddle() {
  const card = marketingImage("reception-table");
  const sampled = useSampledPalette(card.src);
  return (
    <Moment
      n="05"
      title="The album straddle"
      verdict="ship"
      verdictLabel="Ship, pinned to the card"
      lede={
        <p>
          The home page&rsquo;s album card overhangs the chapter cut by 160px,
          so it is the one seam on the site where an object physically crosses
          the boundary, which means it is the one seam with a nameable lamp.
          Every other chapter cut has none, which is exactly the restraint you
          asked for. Pin this to the card and it is a lit object; pin it to the
          chapter and it becomes the every-seam-on-every-page failure.
        </p>
      }
      lamp="the album card overhanging the cut"
      direction="down and outward from the card's own box"
      colour="sampled from the card's photograph"
      law="Law 1 (an object, not a boundary) and law 2"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec
          name="Lit"
          note="The card casts onto the dark field it overhangs."
        >
          <StraddleStage colors={sampled ?? undefined} lit />
        </Spec>
        <Spec name="Today" note="The card sits on the cut with a light shadow.">
          <StraddleStage />
        </Spec>
      </div>
    </Moment>
  );
}

function StraddleStage({
  lit = false,
  colors,
}: {
  lit?: boolean;
  colors?: readonly string[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="h-16" style={{ background: "oklch(0.99 0 0)" }} />
      <Ground on="cinema" className="relative min-h-52 rounded-none">
        <div className="relative -mt-10 px-8">
          {/* The lamp is the CARD, so the light is pinned to the card's own box
              and thrown outward from it. Pinning it to the section's top edge
              instead put it behind the card, where nothing could see it, and
              pinning it to the CHAPTER is how this becomes the
              every-seam-on-every-page failure. */}
          <div className="relative isolate">
            {lit && (
              <div className="absolute -inset-x-10 -top-6 -bottom-16 isolate -z-10 overflow-hidden">
                <Glow
                  shape="throw"
                  drive="mask"
                  colors={colors}
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "40%",
                    "--glw-reach": "100%",
                    "--glw-strength": "0.6",
                    "--glw-base": "0.55",
                    "--glw-blur": "26px",
                  }}
                />
              </div>
            )}
            <div
              className="relative overflow-hidden rounded-xl border border-border"
              style={{ background: "oklch(0.21 0 0)" }}
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={marketingImage("reception-table").src}
                  alt=""
                  fill
                  sizes="380px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <p className="relative mt-4 pb-10 text-sm text-muted-foreground">
            The morning after, everything is already in one place.
          </p>
        </div>
      </Ground>
    </div>
  );
}

/* ── 06 ─────────────────────────────────────────────────────────────────── */

function QrPlate() {
  const [copied, setCopied] = useState(0);
  return (
    <Moment
      n="06"
      title="The QR plate switching on"
      verdict="ship"
      verdictLabel="Ship"
      lede={
        <p>
          The only object in the product aimed at another person&rsquo;s phone,
          and the host&rsquo;s highest-stakes action. A bloom outward from under
          the plate on copy or share reads as the code switching on. The light
          stays strictly outside the plate and never touches the modules or the
          quiet zone, because scannability is a contract, not a style.
        </p>
      }
      lamp="the code, at the moment it is handed over"
      direction="outward from under the plate"
      colour="fallback five (the plate is not a photograph)"
      law="Law 1, once per share"
    >
      <Ground
        on="slab"
        className="relative isolate flex min-h-64 items-center justify-center"
      >
        <div className="relative isolate">
          {/* The light needs room OUTSIDE the object it comes from. Pinned to
              the plate's own box (what this did first) every pixel of it sat
              behind an opaque white plate, which is why the beat read as
              broken. It also keeps the spill clear of the modules and the
              quiet zone: scannability is a contract, not a style. */}
          <div className="absolute -inset-24 isolate -z-10">
            <Glow
              shape="bloom"
              drive="mask"
              runId={copied}
              vars={{
                "--glw-from-x": "50%",
                "--glw-from-y": "50%",
                "--glw-reach": "78%",
                "--glw-strength": "0.95",
                "--glw-base": "0.1",
                "--glw-blur": "26px",
              }}
            />
          </div>
          {/* A stand-in plate: the point here is the light, not the modules. */}
          <div
            className="relative grid size-36 grid-cols-8 gap-0.5 rounded-lg p-3"
            style={{ background: "oklch(0.99 0 0)" }}
          >
            {Array.from({ length: 64 }, (_, i) => (
              <span
                key={i}
                className="aspect-square rounded-[1px]"
                style={{
                  background:
                    (i * 7) % 5 < 2 ? "oklch(0.13 0 0)" : "transparent",
                }}
              />
            ))}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-5"
          onClick={() => setCopied((c) => c + 1)}
        >
          {copied > 0 ? <Check /> : <Copy />}
          {copied > 0 ? "Link copied" : "Copy link"}
        </Button>
      </Ground>
    </Moment>
  );
}

/* ── 07 ─────────────────────────────────────────────────────────────────── */

function PublishBeat() {
  const [runId, setRunId] = useState(0);
  // A colour-rich frame on purpose: festival-lights is a near-black night shot,
  // which samples to almost nothing and makes a specimen about sampling
  // impossible to read at frame size.
  const frame = marketingImage("concert-confetti");
  const sampled = useSampledPalette(frame.src);
  return (
    <Moment
      n="07"
      title="The publish beat, rebuilt"
      verdict="work"
      verdictLabel="Needs a ruling on the violet"
      lede={
        <p>
          The best lamp in the product: a real canvas playing real frames, once
          per event, at the host&rsquo;s biggest moment. Today it is a flat
          violet glow breathing on the frame. Sampling the reel&rsquo;s own
          current frame makes the light come off the reel instead of being
          painted on it. The care needed: violet is a ratified state colour for
          reel curation, so it has to stay on the controls while the sampled
          spill stays outside the frame, or a state colour has quietly become
          decoration.
        </p>
      }
      lamp="the reel canvas"
      direction="outward from the frame"
      colour="sampled from the frame currently playing"
      law="Law 1 and law 3, with a state-colour caveat"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec name="Sampled spill" note="Light off the reel.">
          <Ground
            on="cinema"
            className="relative isolate flex min-h-64 items-center justify-center p-6"
          >
            <div className="relative isolate">
              {/* The light needs room OUTSIDE the object it comes from. Pinned
                  to the frame's own box (what this did first) every pixel sat
                  behind an opaque frame, which is why the beat read as dead. */}
              <div className="absolute -inset-20 isolate -z-10">
                <Glow
                  shape="bloom"
                  drive="mask"
                  runId={runId}
                  colors={sampled ?? undefined}
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "50%",
                    "--glw-reach": "80%",
                    "--glw-strength": "0.95",
                    "--glw-base": "0.12",
                    "--glw-blur": "24px",
                  }}
                />
              </div>
              <div className="relative aspect-[9/16] w-28 overflow-hidden rounded-lg border border-border">
                <Image
                  src={frame.src}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            </div>
          </Ground>
        </Spec>
        <Spec
          name="Today"
          note="The shipped beat: a flat violet breathing on the frame. It replays with Publish too, so the two are compared moving, not one moving against one still."
        >
          <Ground
            on="cinema"
            className="relative flex min-h-64 items-center justify-center p-6"
          >
            {/* Keyed on the same runId so Publish replays BOTH sides. Comparing
                a live beat against a frozen screenshot is not a comparison. */}
            <div
              key={runId}
              data-rxp-pubglow
              className="relative aspect-[9/16] w-28 overflow-hidden rounded-lg border border-border"
            >
              <Image
                src={frame.src}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          </Ground>
        </Spec>
      </div>
      <Button
        size="sm"
        className="w-fit"
        onClick={() => setRunId((r) => r + 1)}
      >
        Publish
      </Button>
    </Moment>
  );
}

/* ── 08 ─────────────────────────────────────────────────────────────────── */

function CtaQuestion() {
  return (
    <Moment
      n="08"
      title="The CTA rim, answered"
      verdict="reject"
      verdictLabel="Reject in the chrome, allow in the hero"
      lede={
        <>
          <p>
            The first pass of this rendered the recipe through the wrong shape
            and you caught it: its mask is opaque at the origin, so the light
            sat behind an opaque pill and all that showed was a sliver at the
            edge. This is the real mechanic now, ported as its own shape.
          </p>
          <p className="mt-2">
            Which also corrects my argument. I claimed a rim fails law 2 for
            having no direction. That was wrong: a halo is an object backlit
            from behind, which is a nameable vector. What actually decides the
            case is law 1. In the hero there IS something behind the button, the
            media wall, and in the chrome there is nothing at all, so the light
            has no source and is decoration by definition. Same verdict, honest
            reasoning.
          </p>
          <p className="mt-2">
            The frequency finding stands on its own: Start free renders at least
            three times on every marketing page across 33 call sites, which is
            the tier the craft standard says never to add theater to.
          </p>
        </>
      }
      lamp="in the hero, the media wall behind it. In the chrome, nothing."
      direction="from behind the object, outward"
      colour="fallback five on the chrome pill; sampled from the wall in the hero"
      law="Fails law 1 in the chrome (no lamp); passes in the hero"
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <Spec
          name="Rim on the chrome CTA"
          note="What the recipe does. Three of these per page, on every page."
        >
          <Ground
            on="slab"
            className="flex min-h-40 items-center justify-center"
          >
            {/* `halo`, not `throw`. This first rendered through `throw`, whose
                mask is OPAQUE at the origin, so the light sat entirely behind
                an opaque pill and all that showed was a sliver at the edge.
                The recipe masks its centre CLEAR for exactly this reason. */}
            <span className="relative isolate inline-flex p-5">
              <span className="absolute inset-0 isolate">
                <Glow
                  shape="halo"
                  vars={{
                    "--glw-from-x": "50%",
                    "--glw-from-y": "50%",
                    "--glw-blur": "7px",
                    "--glw-strength": "0.7",
                    "--glw-base": "0.55",
                    "--glw-dur": "5s",
                  }}
                />
              </span>
              <Button size="lg" className="relative">
                Start free
              </Button>
            </span>
          </Ground>
        </Spec>
        <Spec name="Today" note="The shipped pill. Nothing wrong with it.">
          <Ground
            on="slab"
            className="flex min-h-40 items-center justify-center"
          >
            <Button size="lg">Start free</Button>
          </Ground>
        </Spec>
        <Spec
          name="Standing in the light"
          note="The hero CTA. The lamp is the wall; the button is just in front of it."
        >
          <Ground
            on="cinema"
            className="relative isolate flex min-h-40 items-end justify-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-70">
              <PhotoWall
                ids={["wedding-golden", "party-balloons", "festival-lights"]}
                cols={3}
              />
            </div>
            {/* The wall needs its own ramp into the room, exactly as the hero
                has one. Without it the wall ends on a hard cut and the light
                below reads as a stripe under a border rather than as spill off
                a screen: the border was the first thing Will saw here. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.11 0 0), transparent)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 isolate h-28">
              <Glow
                shape="seam"
                drive="mask"
                vars={{
                  "--glw-from-y": "0%",
                  "--glw-strength": "0.55",
                  "--glw-h": "100%",
                }}
              />
            </div>
            <Button size="lg" className="relative mb-6">
              Start free
            </Button>
          </Ground>
        </Spec>
      </div>
    </Moment>
  );
}

/* ── 09 ─────────────────────────────────────────────────────────────────── */

function PaperProbe() {
  const img = marketingImage("wedding-arch");
  const sampled = useSampledPalette(img.src);
  return (
    <Moment
      n="09"
      title="The paper probe"
      verdict="work"
      verdictLabel="Better than expected, and worth a look"
      lede={
        <p>
          You expected this to be a dark-surface device, and by eye it probably
          is. The measurement disagrees in one specific way, and it is worth
          knowing: muted text on paper does not cross 4.5:1 until the wash
          composites at alpha 0.47, against 0.115 on the ink slab. A mid-light
          wash lifts a near-black ground straight toward muted grey, while on
          near-white paper it has much further to travel. Paper is four times
          more forgiving. Dark is where it looks best and where it is most
          fragile.
        </p>
      }
      lamp="the press page's one real photograph"
      direction="outward from the image"
      colour="sampled, which is the only honest source on a page that refuses to fake product imagery"
      law="Law 1 and law 3"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec name="Paper, lit" note="At the same strength the footer uses.">
          <Ground on="paper" className="relative isolate min-h-56 p-8">
            <Glow
              shape="throw"
              drive="mask"
              colors={sampled ?? undefined}
              vars={{
                "--glw-from-x": "78%",
                "--glw-from-y": "38%",
                "--glw-reach": "85%",
                "--glw-strength": "0.5",
                "--glw-base": "0.45",
              }}
            />
            <div className="relative flex items-start gap-6">
              <div>
                <p data-dir-display className="text-2xl leading-tight">
                  Press and brand
                </p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Muted copy at paper&rsquo;s real token value, sitting in the
                  light.
                </p>
              </div>
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            </div>
          </Ground>
        </Spec>
        <Spec name="Paper, today" note="Ink on paper.">
          <Ground on="paper" className="relative min-h-56 p-8">
            <div className="flex items-start gap-6">
              <div>
                <p data-dir-display className="text-2xl leading-tight">
                  Press and brand
                </p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Muted copy at paper&rsquo;s real token value.
                </p>
              </div>
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            </div>
          </Ground>
        </Spec>
      </div>
    </Moment>
  );
}

/* ── 10 ─────────────────────────────────────────────────────────────────────
   The three below are NEW this round. Each demonstrates something the engine
   can already do that no placement was using: light bound to a value rather
   than a clock, light that follows a pointer, and light that travels between
   two objects. They are mechanics first and proposals second, which is why
   they sit after the nine argued placements.                                */

function UploadAsLight() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    // A deliberately uneven climb: a real upload is not a metronome, and a
    // perfectly linear demo hides whether the light survives a stall.
    const steps = [0.08, 0.22, 0.31, 0.55, 0.62, 0.79, 0.93, 1];
    let i = 0;
    const id = setInterval(() => {
      setProgress(steps[i]);
      i += 1;
      if (i >= steps.length) {
        clearInterval(id);
        setRunning(false);
      }
    }, 620);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    setProgress(0);
    setRunning(true);
  };

  return (
    <Moment
      n="10"
      title="The upload, as light"
      verdict="work"
      verdictLabel="New mechanic, wants a real device pass"
      lede={
        <>
          <p>
            The engine has a third drive that no placement was using: no clock
            at all. `--glw-t` is a registered custom property, so JS writes a
            TARGET and CSS owns the tween, which is the same shape as the
            measured nav indicator and useFlip. Here the target is upload
            progress, so the comet&rsquo;s position along the tile IS how far
            the photo has got. The light stops meaning atmosphere and starts
            meaning something.
          </p>
          <p className="mt-2">
            Why it might be better than a bar: a progress bar is a second object
            asking to be read, on a surface whose whole job is the photograph. A
            guest uploading at a party is not studying a percentage. Because the
            value is tweened rather than snapped, a stalled upload still drifts
            instead of freezing, which reads as working rather than stuck.
          </p>
        </>
      }
      lamp="the photo arriving"
      direction="across the tile, in step with the bytes"
      colour="sampled from the photo being uploaded (the client already has it)"
      law="Law 1, and it is the one case where the light is a signal"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={start} disabled={running}>
            {running ? "Uploading" : "Upload a photo"}
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Spec
            name="Progress as light"
            note="The comet position is the upload. No second object to read."
          >
            <Ground on="cinema" className="flex justify-center p-6">
              <div className="relative isolate w-40 overflow-hidden rounded-lg">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={marketingImage("wedding-toast").src}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                    style={{ opacity: 0.35 + progress * 0.65 }}
                  />
                </div>
                <Glow
                  shape="sweep"
                  drive="scalar"
                  vars={{
                    "--glw-t": String(progress),
                    "--glw-scale": "1.1",
                    "--glw-strength": "0.9",
                    "--glw-base": "0.3",
                  }}
                />
              </div>
            </Ground>
          </Spec>
          <Spec
            name="A conventional bar"
            note="The control. Legible, and one more thing on the screen."
          >
            <Ground on="cinema" className="flex justify-center p-6">
              <div className="relative w-40 overflow-hidden rounded-lg">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={marketingImage("wedding-toast").src}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                    style={{ opacity: 0.35 + progress * 0.65 }}
                  />
                </div>
                <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </Ground>
          </Spec>
        </div>
      </div>
    </Moment>
  );
}

/* ── 11 ─────────────────────────────────────────────────────────────────── */

function PointerLamp() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const sampled = useSampledPalette(
    WALL_IDS.map((id) => marketingImage(id).src),
  );

  // The tilt-card pattern: track on a flat outer wrapper that is never itself
  // transformed, mouse only, and write CSS vars rather than React state so a
  // pointer move never costs a render.
  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = wrap.current;
    if (!el || reduced || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--glw-origin-x",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    el.style.setProperty(
      "--glw-origin-y",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  };

  return (
    <Moment
      n="11"
      title="The lamp follows you"
      verdict="work"
      verdictLabel="New mechanic, needs a taste ruling"
      lede={
        <>
          <p>
            Law 2 says every spill declares where it comes from, and so far that
            has always been a fixed value. It does not have to be. Here the
            origin follows the pointer across the wall, so the light behaves
            like something in the room with you rather than a texture printed on
            the page. Move your cursor over the photographs.
          </p>
          <p className="mt-2">
            The honest risk: this is decoration that responds to input, which is
            the most seductive kind and the easiest to overuse. It earns its
            place on a hero and nowhere else, and it is mouse-only by
            construction, so it costs a phone nothing.
          </p>
        </>
      }
      lamp="the wall, lit where you are looking"
      direction="outward from the pointer"
      colour="sampled from the wall"
      law="Law 2, with the vector made live"
    >
      <div
        ref={wrap}
        onPointerMove={track}
        className="relative isolate overflow-hidden rounded-2xl"
        style={
          {
            // --glw-origin-*, not --glw-from-*: the engine declares the latter
            // on [data-glw] itself, and a declaration on the element always
            // beats one inherited from an ancestor, so setting it here would be
            // silently shadowed and the lamp would never move.
            "--glw-origin-x": "50%",
            "--glw-origin-y": "50%",
          } as React.CSSProperties
        }
      >
        <Ground on="cinema" className="relative isolate rounded-none p-0">
          <div className="relative opacity-80">
            <PhotoWall cols={4} />
          </div>
          <div className="absolute inset-0 isolate">
            <Glow
              shape="throw"
              drive="mask"
              colors={sampled ?? undefined}
              vars={{
                "--glw-reach": "42%",
                "--glw-strength": "0.75",
                "--glw-base": "0.5",
                "--glw-blur": "30px",
                "--glw-dur": "16s",
              }}
            />
          </div>
        </Ground>
      </div>
      <p className="text-xs text-muted-foreground">
        Reduced motion and touch both fall back to a fixed centre lamp, which is
        the same still image everyone else sees.
      </p>
    </Moment>
  );
}

/* ── 12 ─────────────────────────────────────────────────────────────────── */

type Flight = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
};

function ScanThrough() {
  const [runId, setRunId] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const sampled = useSampledPalette(marketingImage("party-balloons").src);

  // Measured at click, not at mount: the stage is responsive, and a distance
  // captured once would be wrong the moment the pane resizes.
  const scan = () => {
    const s = stage.current?.getBoundingClientRect();
    const a = codeRef.current?.getBoundingClientRect();
    const b = phoneRef.current?.getBoundingClientRect();
    if (!s || !a || !b) return;
    const from = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
    const to = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    setFlight({
      x: from.x - s.left,
      y: from.y - s.top,
      dx: to.x - from.x,
      dy: to.y - from.y,
      size: Math.round(Math.min(a.width, a.height) * 1.6),
    });
    setRunId((r) => r + 1);
  };

  return (
    <Moment
      n="12"
      title="The scan-through"
      verdict="work"
      verdictLabel="The most speculative, and the most ours"
      lede={
        <>
          <p>
            The one idea here that is about the product rather than the surface.
            A QR code is the only object Partyreel makes whose entire purpose is
            to move something from one screen to another, and every diagram we
            draw of it is two static objects with a caption between them. If
            light is our material, the handoff is the thing it should carry: the
            code lights, something travels, the phone answers.
          </p>
          <p className="mt-2">
            It is the most speculative specimen on this board and the one I
            would most like to be told to keep working on. It also has an
            obvious home beyond the marketing page: this is the /features/qr
            story, and it is what the empty demo ticket in the footer is
            gesturing at.
          </p>
        </>
      }
      lamp="the code, then the phone that answers it"
      direction="left to right, from the code to the screen"
      colour="sampled from the album on the other side"
      law="Law 1 twice, with the travel between them"
    >
      <div className="flex flex-col gap-4">
        <Ground
          ref={stage}
          on="slab"
          className="relative isolate flex items-center justify-between gap-6 px-10 py-12"
        >
          {/* The code. */}
          <div ref={codeRef} className="relative isolate shrink-0">
            <div className="absolute -inset-16 isolate -z-10">
              <Glow
                shape="bloom"
                drive="mask"
                runId={runId}
                colors={sampled ?? undefined}
                vars={{
                  "--glw-from-x": "50%",
                  "--glw-from-y": "50%",
                  "--glw-reach": "70%",
                  "--glw-strength": "0.9",
                  "--glw-base": "0.08",
                  "--glw-blur": "22px",
                }}
              />
            </div>
            <div
              className="relative grid size-24 grid-cols-7 gap-0.5 rounded-md p-2"
              style={{ background: "oklch(0.99 0 0)" }}
            >
              {Array.from({ length: 49 }, (_, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-[1px]"
                  style={{
                    background:
                      (i * 5) % 4 < 2 ? "oklch(0.13 0 0)" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          {/* THE MEASURED FLIGHT. The first pass faked this with a fixed
              channel between the two objects, which only works because the
              layout happens to put them side by side. This measures both and
              moves ONE light the real distance, so the same code would work
              if the phone sat below the code, or across a stacked mobile
              layout. JS owns the measurement, CSS owns the tween. */}
          {flight && (
            <div
              key={runId}
              data-glw-fly
              className="pointer-events-none isolate"
              style={
                {
                  left: flight.x,
                  top: flight.y,
                  width: flight.size,
                  height: flight.size,
                  marginLeft: -flight.size / 2,
                  marginTop: -flight.size / 2,
                  "--glw-fly-dx": `${flight.dx}px`,
                  "--glw-fly-dy": `${flight.dy}px`,
                } as React.CSSProperties
              }
            >
              <Glow
                shape="throw"
                drive="mask"
                colors={sampled ?? undefined}
                vars={{
                  "--glw-from-x": "50%",
                  "--glw-from-y": "50%",
                  "--glw-reach": "60%",
                  "--glw-strength": "0.95",
                  "--glw-base": "0.85",
                  "--glw-blur": "16px",
                }}
              />
            </div>
          )}

          {/* The phone that answers. */}
          <div ref={phoneRef} className="relative isolate shrink-0">
            <div className="absolute -inset-14 isolate -z-10">
              <Glow
                shape="bloom"
                drive="mask"
                runId={runId}
                colors={sampled ?? undefined}
                vars={{
                  "--glw-from-x": "50%",
                  "--glw-from-y": "50%",
                  "--glw-reach": "72%",
                  "--glw-strength": "0.85",
                  "--glw-base": "0.1",
                  "--glw-blur": "20px",
                }}
              />
            </div>
            <div
              className="relative aspect-[9/19] w-24 overflow-hidden rounded-[1.1rem] border-2"
              style={{ borderColor: "oklch(0.35 0 0)" }}
            >
              <Image
                src={marketingImage("party-balloons").src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          </div>
        </Ground>
        <Button size="sm" className="w-fit" onClick={scan}>
          Scan the code
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The travel is measured rather than faked: the stage reads both objects
          at click and moves ONE light the real distance between them, the way
          the reveal measures its flight. So the same code holds if the phone
          moves below the code on a narrow screen, which a fixed channel between
          two columns would not.
        </p>
      </div>
    </Moment>
  );
}

/* ── The field the board did not build ───────────────────────────────────── */

const CATALOGUE: { name: string; where: string; why: string }[] = [
  {
    name: "All caught up",
    where: "the host review queue reaching zero",
    why: "The host has just made photos visible to everyone else, which is a literal switching-on, and the 2500ms beat already exists to hold it. Fires only at zero, never on an individual approve: moderation is high-frequency.",
  },
  {
    name: "The first event ever created",
    where: "a brand-new host's empty dashboard",
    why: "Happens exactly once per account, which is the strongest possible case for generosity. It is also the most screenshotted state in the product, so too loud and the glow becomes the brand.",
  },
  {
    name: "The projector warming",
    where: "between the reel reveal's veil and its tiles",
    why: "There is a beat where the lights are down and nothing is lit yet. The reveal grammar is closed and ratified as-built, so this is an amendment needing its own ruling, not a tweak.",
  },
];

const REJECTED: { name: string; why: string }[] = [
  {
    name: "The empty album state",
    why: "Its ghost photos sit at 25 percent grayscale, deliberately not lit. Glowing them contradicts the photographic promise that state already makes well.",
  },
  {
    name: "Generic chapter seams",
    why: "No lamp. The album straddle is the one cut where an object actually crosses the boundary, and it is specimen 05.",
  },
  {
    name: "Gradient headline type",
    why: "Measured on paper, all five hues land between 1.83:1 and 2.98:1, failing even the 3:1 large-text threshold. R8 is WCAG-AA certification and would have to reverse it.",
  },
  {
    name: "The guest upload target",
    why: "An empty dropzone is not lit. The uploading photo is, which is specimen 04's territory.",
  },
];

function Catalogue() {
  return (
    <Section
      n="13"
      title="The rest of the field"
      lede="Documented rather than built, so the ruling has the whole picture without me spending the round on it."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <h3 className="font-heading text-base font-semibold">
            Earned, not built
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {CATALOGUE.map((c) => (
              <li key={c.name}>
                <p className="text-sm font-medium">
                  {c.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({c.where})
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {c.why}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <h3 className="font-heading text-base font-semibold">
            Turned down, with reasons
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {REJECTED.map((c) => (
              <li key={c.name}>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {c.why}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
