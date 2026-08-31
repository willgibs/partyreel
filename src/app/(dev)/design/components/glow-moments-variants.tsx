"use client";

import Image from "next/image";
import { Camera, Check, Copy, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
      <ScanThrough />
      <WholePage />
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
                      // Will's note: a solid card blocks the lamp and reads
                      // harsh against it. Translucent, so the light passes
                      // THROUGH the album that is still arriving, which is also
                      // the more honest picture of what is happening.
                      background: "oklch(0.19 0 0 / 0.45)",
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
  const [live, setLive] = useState(0);

  return (
    <Moment
      n="06"
      title="The QR plate switching on"
      verdict="ship"
      verdictLabel="Ship the second one"
      lede={
        <>
          <p>
            The only object in the product aimed at another person&rsquo;s
            phone, and the host&rsquo;s highest-stakes action. The light stays
            strictly outside the plate and never touches the modules or the
            quiet zone, because scannability is a contract, not a style.
          </p>
          <p className="mt-2">
            Your instinct that there was a more polished version was right, and
            the reason is a state rather than a strength. The first one FLASHES:
            it blooms and decays back to almost nothing, so all it tells you is
            that a click registered, which the button already said. The second
            one ignites and then STAYS lit at a low resting glow. That is the
            code reporting that it is live, which is a thing worth knowing and
            worth looking at while you carry your phone to the table.
          </p>
        </>
      }
      lamp="the code, at the moment it is handed over"
      direction="outward from under the plate"
      colour="fallback five (the plate is not a photograph)"
      law="Law 1, once per share, and it earns a resting state"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec
          name="Ignite, then stay lit (recommended)"
          note="Blooms on the share and settles to a resting glow. The code is now live, and it looks it."
        >
          <QrStage runId={live} resting onFire={() => setLive((c) => c + 1)} />
        </Spec>
        <Spec
          name="Flash and decay"
          note="What you approved. Confirms the click and then says nothing."
        >
          <QrStage runId={copied} onFire={() => setCopied((c) => c + 1)} />
        </Spec>
      </div>
    </Moment>
  );
}

function QrStage({
  runId,
  resting = false,
  onFire,
}: {
  runId: number;
  resting?: boolean;
  onFire: () => void;
}) {
  const fired = runId > 0;
  return (
    <Ground
      on="slab"
      className="relative isolate flex min-h-64 items-center justify-center"
    >
      <div className="relative isolate">
        {/* The light needs room OUTSIDE the object it comes from, and it stays
            clear of the modules and the quiet zone. */}
        <div className="absolute -inset-24 isolate -z-10">
          <Glow
            shape="bloom"
            drive="mask"
            runId={runId}
            vars={{
              "--glw-from-x": "50%",
              "--glw-from-y": "50%",
              "--glw-reach": "78%",
              "--glw-strength": "0.95",
              // The whole difference between the two: what it decays TO.
              "--glw-base": resting && fired ? "0.34" : "0.1",
              "--glw-blur": "26px",
            }}
          />
        </div>
        <div
          className="relative grid size-36 grid-cols-8 gap-0.5 rounded-lg p-3 transition-shadow duration-500"
          style={{
            background: "oklch(0.99 0 0)",
            boxShadow:
              resting && fired
                ? "0 0 0 1px oklch(1 0 0 / 0.12)"
                : "0 0 0 1px oklch(1 0 0 / 0)",
          }}
        >
          {Array.from({ length: 64 }, (_, i) => (
            <span
              key={i}
              className="aspect-square rounded-[1px]"
              style={{
                background: (i * 7) % 5 < 2 ? "oklch(0.13 0 0)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="absolute bottom-5"
        onClick={onFire}
      >
        {fired ? <Check /> : <Copy />}
        {fired ? "Link copied" : "Copy link"}
      </Button>
    </Ground>
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
      verdict="work"
      verdictLabel="Bug fixed; the quiet variant is the one to rule on"
      lede={
        <>
          <p>
            You were right to ask. What you reviewed WAS broken: the wash was
            rendering in a padded box around the button instead of on the pill
            itself, so it read as a soft rectangle floating behind a capsule.
            The recipe puts its wash ON the pill with the pill&rsquo;s own
            radius and clips it there. Fixed, and it now hugs the capsule.
          </p>
          <p className="mt-2">
            The other half of your question: your reference is the recipe on a
            DARK pill, which is why it reads as a subtle premium object rather
            than a white primary. That variant is built here as its own
            specimen, and I think it is the one worth having. It leaves the
            white primary alone to do its blunt job.
          </p>
          <p className="mt-2">
            Which also corrects my argument. I claimed a rim fails law 2 for
            having no direction. That was wrong: a halo is an object backlit
            from behind, which is a nameable vector. Law 1 decides it instead,
            and it is the reason the note under these specimens is about WHERE
            the quiet variant can go rather than whether it is pretty.
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
      <div className="grid gap-6 sm:grid-cols-2">
        <Spec
          name="The quiet variant (what your reference actually is)"
          note="A dark pill with the colour at its rim. transitions.dev shows the recipe on their dark theme, which is why it reads as a subtle premium object rather than a white primary. This is the one worth having."
        >
          <Ground
            on="slab"
            className="flex min-h-40 items-center justify-center"
          >
            <span
              className="relative isolate inline-flex overflow-hidden rounded-full"
              style={
                {
                  background: "oklch(0.24 0 0)",
                  boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.08)",
                  "--glw-radius": "9999px",
                } as React.CSSProperties
              }
            >
              <Glow
                shape="halo"
                vars={{
                  "--glw-blur": "8px",
                  "--glw-strength": "0.95",
                  "--glw-base": "0.8",
                  "--glw-core": "36%",
                  "--glw-dur": "5s",
                  "--glw-radius": "9999px",
                }}
              />
              <span className="relative px-6 py-2.5 text-sm font-medium text-[oklch(0.97_0_0)]">
                Get Pro
              </span>
            </span>
          </Ground>
        </Spec>
        <Spec
          name="The same mechanic on the white primary"
          note="Fixed since your review: the wash now lives ON the pill, clipped by its own radius, instead of floating behind it as a rectangle. Correct, and it costs the primary its bluntness."
        >
          <Ground
            on="slab"
            className="flex min-h-40 items-center justify-center"
          >
            <span
              className="relative isolate inline-flex overflow-hidden rounded-full bg-primary"
              style={{ "--glw-radius": "9999px" } as React.CSSProperties}
            >
              <Glow
                shape="halo"
                vars={{
                  "--glw-blur": "6px",
                  "--glw-strength": "0.8",
                  "--glw-base": "0.65",
                  "--glw-core": "40%",
                  "--glw-dur": "5s",
                  "--glw-radius": "9999px",
                }}
              />
              <Button
                size="lg"
                className="relative rounded-full bg-transparent px-6"
              >
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
      <div className="rounded-2xl border border-border p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">
            Where the quiet variant legitimately lives, since you asked.
          </span>{" "}
          Not the primary CTA: that is 33 call sites and at least three per
          page, the tier the craft standard says never to add theater to. It
          earns its place on a button that is RARE and that has something behind
          it. Two real candidates: the Pro upgrade button on the pricing page,
          whose card already carries stacked photographs, and the share control
          in the reel Studio, which sits against a canvas playing real frames.
        </p>
        <p className="mt-2">
          <span className="text-foreground">The honest caveat.</span> On a
          button with genuinely nothing behind it, this is decoration by law 1,
          however nice it looks. I would rather write that down than let it in
          quietly, because the whole point of naming the lamp is that it is
          answerable.
        </p>
      </div>
    </Moment>
  );
}

/* ── 09 ─────────────────────────────────────────────────────────────────── */

function PaperProbe() {
  const img = marketingImage("wedding-arch");
  // The PAPER register, not the dark one. Over near-white a mid-light wash
  // darkens what it covers and reads as stain; this sits near the paper's own
  // lightness so it reads as light.
  const sampled = useSampledPalette(img.src, "paper");
  return (
    <Moment
      n="09"
      title="The paper probe"
      verdict="work"
      verdictLabel="Better than expected, and worth a look"
      lede={
        <>
          <p>
            Polished since your note, and the diagnosis was worth having. The
            first version sampled a foliage-and-white-dress photograph into five
            hues between 34 and 158 degrees, all in one quadrant, which
            composites to mud. Two things were wrong: the sampler let five
            neighbours count as a spread (now a fifth of the wheel apart
            minimum), and the spill used the DARK register on white.
          </p>
          <p className="mt-2">
            On a dark ground light ADDS. Over near-white the same mid-light wash
            DARKENS what it covers, which is why it read as stain rather than
            light. Paper now has its own register: lighter, calmer, broader and
            fainter. The measurement still says paper is four times more
            forgiving on contrast (muted text crosses 4.5:1 at alpha 0.47
            against 0.115 on the slab), so dark remains where it looks best and
            where it is most fragile.
          </p>
        </>
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
                // Lower strength AND a wider reach than the dark grounds use:
                // paper wants a broad, faint field, not a concentrated one.
                // A tight bright wash on white reads as a smudge.
                "--glw-from-x": "76%",
                "--glw-from-y": "34%",
                "--glw-reach": "120%",
                "--glw-strength": "0.32",
                "--glw-base": "0.3",
                "--glw-blur": "34px",
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
      verdict="ship"
      verdictLabel="Light plus bar"
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
            Will&rsquo;s ruling, and it is the right one: keep both. The light
            carries the feeling and the bar carries the fact, because ninety
            percent and a hundred are nearly indistinguishable as light alone,
            and a large file on a slow connection is exactly when a guest needs
            to know the difference. The bar gets to be thinner than it would be
            on its own, since it is now the precision under the light rather
            than the only signal. Because the value is tweened rather than
            snapped, a stalled upload still drifts instead of freezing, which
            reads as working rather than stuck.
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
        <div className="grid gap-6 sm:grid-cols-3">
          <Spec
            name="Both (recommended)"
            note="The light carries the feeling, the bar carries the fact. Ninety percent and a hundred are indistinguishable as light alone, which on a slow upload is exactly when a guest needs to know."
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
                {/* Quieter than the control's bar on purpose: it is the
                    precision under the light, not the headline. */}
                <div className="absolute inset-x-2 bottom-2 h-0.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white/90 transition-[width] duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </Ground>
          </Spec>
          <Spec
            name="Light alone"
            note="Beautiful, and imprecise near the end. This is the version your note is about."
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

/* ── 12 ─────────────────────────────────────────────────────────────────── */

type Flight = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
};

const QR_CELLS = 49;
/** Which cells are ink, and therefore which can become photographs. */
const QR_INK = Array.from({ length: QR_CELLS }, (_, i) => (i * 5) % 4 < 2);
const MOD_PHOTOS = [
  "wedding-golden",
  "concert-confetti",
  "party-balloons",
  "wedding-toast",
  "festival-lights",
  "reception-table",
] as const;

type Handoff = "beam" | "pour" | "become";

const HANDOFFS: { id: Handoff; name: string; note: string }[] = [
  {
    id: "become",
    name: "The code becomes the album",
    note: "The modules resolve into the photographs they stand for, then the plate goes to the phone. Says the code IS the album, which is the actual product claim.",
  },
  {
    id: "pour",
    name: "The album pours",
    note: "Photographs leave the code and land in the phone. The most literal reading of scan-and-your-photos-go-here, and the easiest to understand cold.",
  },
  {
    id: "beam",
    name: "The beam",
    note: "What I built first: one measured light crossing the gap. Correct, and it says the least.",
  },
];

function ScanThrough() {
  const [dir, setDir] = useState<Handoff>("become");
  const [runId, setRunId] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [resolved, setResolved] = useState(false);
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
    setResolved(false);
    setRunId((r) => r + 1);
    if (dir === "become") {
      // Let the modules resolve first, then send the plate.
      window.setTimeout(() => setResolved(true), 120);
    }
  };

  const flyVars = flight
    ? ({
        "--glw-fly-dx": `${flight.dx}px`,
        "--glw-fly-dy": `${flight.dy}px`,
      } as React.CSSProperties)
    : {};

  return (
    <Moment
      n="11"
      title="The scan-through"
      verdict="work"
      verdictLabel="Three directions, none ruled"
      lede={
        <>
          <p>
            The one idea here that is about the product rather than the surface.
            A QR code is the only object Partyreel makes whose entire purpose is
            to move something from one screen to another, and every diagram we
            draw of it is two static objects with a caption between them.
          </p>
          <p className="mt-2">
            You were right that the beam says too little. The concept is worth
            far more than my first execution of it, so here are three, and the
            two new ones move the ALBUM rather than a glow. That is the
            difference between showing that something happened and showing what
            it was.
          </p>
        </>
      }
      lamp="the code, then the phone that answers it"
      direction="from the code to the screen"
      colour="sampled from the album on the other side"
      law="Law 1 twice, with the handoff between them"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {HANDOFFS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setDir(h.id);
                setResolved(false);
                setFlight(null);
              }}
              aria-pressed={dir === h.id}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                dir === h.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {h.name}
            </button>
          ))}
        </div>

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
              {Array.from({ length: QR_CELLS }, (_, i) => {
                const ink = QR_INK[i];
                const canResolve = dir === "become" && ink;
                return (
                  <span
                    key={i}
                    data-glw-mod={canResolve ? "" : undefined}
                    data-resolved={canResolve && resolved ? "true" : undefined}
                    className="aspect-square rounded-[1px]"
                    style={
                      {
                        background: ink ? "oklch(0.13 0 0)" : "transparent",
                        "--glw-mod-i": i % 12,
                      } as React.CSSProperties
                    }
                  >
                    {canResolve && (
                      <>
                        <span
                          data-glw-mod-ink
                          style={{ background: "oklch(0.13 0 0)" }}
                        />
                        <Image
                          data-glw-mod-photo
                          src={
                            marketingImage(MOD_PHOTOS[i % MOD_PHOTOS.length])
                              .src
                          }
                          alt=""
                          fill
                          sizes="12px"
                        />
                      </>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* What crosses the gap, per direction. */}
          {flight && dir === "beam" && (
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
                  ...flyVars,
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

          {flight && dir === "pour" && (
            <>
              {MOD_PHOTOS.map((id, i) => (
                <div
                  key={`${runId}-${id}`}
                  data-glw-tile
                  className="pointer-events-none overflow-hidden rounded-[3px]"
                  style={
                    {
                      left: flight.x,
                      top: flight.y,
                      width: 46,
                      height: 58,
                      marginLeft: -23,
                      marginTop: -29,
                      "--glw-tile-i": i,
                      ...flyVars,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={marketingImage(id).src}
                    alt=""
                    fill
                    sizes="46px"
                    className="object-cover"
                  />
                </div>
              ))}
            </>
          )}

          {flight && dir === "become" && (
            <div
              key={runId}
              data-glw-tile
              className="pointer-events-none overflow-hidden rounded-md"
              style={
                {
                  left: flight.x,
                  top: flight.y,
                  width: 96,
                  height: 96,
                  marginLeft: -48,
                  marginTop: -48,
                  "--glw-fly-dur": "1400ms",
                  "--glw-tile-i": 3,
                  ...flyVars,
                } as React.CSSProperties
              }
            >
              <div className="grid h-full w-full grid-cols-3 gap-px">
                {MOD_PHOTOS.slice(0, 6).map((id) => (
                  <div key={id} className="relative overflow-hidden">
                    <Image
                      src={marketingImage(id).src}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
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

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={scan}>
            Scan the code
          </Button>
          <span className="text-xs text-muted-foreground">
            {HANDOFFS.find((h) => h.id === dir)?.note}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          All three measure the real distance between the two objects at click
          rather than assuming a layout, so any of them survives the phone
          moving below the code on a narrow screen. My preference is the first:
          it is the only one that makes a claim rather than a demonstration, and
          the modules resolving into photographs is the single frame I would put
          on the QR feature page.
        </p>
      </div>
    </Moment>
  );
}

/* ── 13 ─────────────────────────────────────────────────────────────────── */

/**
 * THE SYNTHESIS. Every other specimen is a lamp in isolation, which is exactly
 * the condition under which a light system looks good and then falls apart in
 * situ. Law 2 says one lamp per view, and nothing on this board tested that
 * claim against an actual scroll until now.
 *
 * Three lamps across a whole page, in the places the board recommends, with a
 * single switch. The point of the switch is that it is the same page: if the
 * lit column only wins because it is livelier, that is worth knowing before we
 * spend the identity on it.
 */
/**
 * A lamp counts as IN VIEW once a quarter of it is showing. Below that it is a
 * tail entering or leaving at a scroll boundary, which is unavoidable on a
 * continuous page and reads as a doorway rather than a second room.
 */
const IN_VIEW_FRACTION = 0.25;

function WholePage() {
  const [lit, setLit] = useState(true);
  const [inView, setInView] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  // The specimen measures its own claim rather than asserting it. Scrolling is
  // the only way to test law 2, so the count has to move with the scroll.
  const countLamps = () => {
    const sc = scroller.current;
    if (!sc) return;
    const win = sc.getBoundingClientRect();
    const n = [...sc.querySelectorAll("[data-glw]")].filter((el) => {
      const r = el.getBoundingClientRect();
      const overlap = Math.min(r.bottom, win.bottom) - Math.max(r.top, win.top);
      return r.height > 0 && overlap / r.height > IN_VIEW_FRACTION;
    }).length;
    setInView(n);
  };
  const sampled = useSampledPalette(
    WALL_IDS.map((id) => marketingImage(id).src),
  );
  const cardColors = useSampledPalette(marketingImage("reception-table").src);

  return (
    <Moment
      n="12"
      title="The whole page"
      verdict="ship"
      verdictLabel="The scarcity test"
      lede={
        <>
          <p>
            Every specimen above is a lamp on its own, which is the condition
            under which any light system looks good. This is the same three
            recommended lamps down one scroll: the hero underlight, the album
            card where it crosses the chapter cut, and the footer seam that
            already ships. Between them are sections with no light at all, which
            is most of the page and is the point.
          </p>
          <p className="mt-2">
            Scroll it. If more than one lamp is ever in view at once, scarcity
            is not holding and the doctrine needs a real quota rather than a
            rule about rooms. Switch it off and on: the honest question is not
            whether the lit version is livelier, it is whether it looks like the
            same company being more itself.
          </p>
        </>
      }
      lamp="three across a page, never two in a view"
      direction="each declares its own"
      colour="sampled at the hero and the card, fallback five at the footer"
      law="Law 2, which is the only law a single specimen cannot test"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setLit((v) => !v)}>
            {lit ? "Lights off" : "Lights on"}
          </Button>
          <span
            className={cn(
              "font-mono text-xs",
              inView > 1 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {inView} lamp{inView === 1 ? "" : "s"} in view
            {inView > 1 ? " (law 2 is not holding here)" : ""}
          </span>
        </div>

        <div
          ref={scroller}
          onScroll={countLamps}
          className="h-[34rem] overflow-y-auto rounded-2xl border border-border"
        >
          {/* 1. THE HERO. Lamp one. */}
          <Ground on="cinema" className="rounded-none p-0">
            <div className="relative">
              <PhotoWall cols={4} />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0.11 0 0), transparent)",
                }}
              />
            </div>
            <div className="relative isolate px-8 pt-10 pb-14">
              {lit && (
                <Glow
                  shape="seam"
                  drive="mask"
                  colors={sampled ?? undefined}
                  vars={{
                    "--glw-blur": "24px",
                    "--glw-strength": "0.5",
                    "--glw-h": "150px",
                  }}
                />
              )}
              <div className="relative">
                <p data-dir-display className="text-3xl leading-tight">
                  Everyone was holding a camera.
                </p>
                <p className="mt-3 max-w-md text-[15px] text-muted-foreground">
                  Guests scan the code and their photos land in one album. No
                  app, no account.
                </p>
              </div>
            </div>
          </Ground>

          {/* 2. NO LAMP. Most of a page looks like this, on purpose. */}
          <Ground on="cinema" className="rounded-none px-8 py-14">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              How it works
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              {[
                ["Share one code", "A QR on the table, or a link in the chat."],
                ["Guests upload", "From their own phones, in seconds."],
                ["You curate", "Hide, sort, and publish the reel."],
              ].map(([h, b]) => (
                <div key={h}>
                  <p className="text-sm font-medium">{h}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>
          </Ground>

          {/* 3. THE CHAPTER CUT. Lamp two rides the card, never the seam. */}
          <div className="px-0" style={{ background: "oklch(0.99 0 0)" }}>
            <div className="px-8 pt-14 pb-24">
              <p
                data-dir-display
                className="text-2xl"
                style={{ color: "oklch(0.13 0 0)" }}
              >
                The morning after.
              </p>
              <p
                className="mt-2 max-w-sm text-[15px]"
                style={{ color: "oklch(0.45 0 0)" }}
              >
                Everything everyone shot, already in one place.
              </p>
            </div>
          </div>
          <Ground on="cinema" className="relative rounded-none pb-16">
            <div className="relative -mt-16 px-8">
              <div className="relative isolate">
                {lit && (
                  <div className="absolute -inset-x-10 -top-6 -bottom-16 isolate -z-10 overflow-hidden">
                    <Glow
                      shape="throw"
                      drive="mask"
                      colors={cardColors ?? undefined}
                      vars={{
                        "--glw-from-x": "50%",
                        "--glw-from-y": "40%",
                        "--glw-reach": "100%",
                        "--glw-strength": "0.55",
                        "--glw-base": "0.5",
                        "--glw-blur": "26px",
                      }}
                    />
                  </div>
                )}
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={marketingImage("reception-table").src}
                      alt=""
                      fill
                      sizes="620px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Ground>

          {/* 4. NO LAMP AGAIN. */}
          <Ground on="cinema" className="rounded-none px-8 py-16">
            <p className="max-w-lg text-lg text-muted-foreground">
              A long stretch of ordinary page, which is what most of a site is
              and what a light system has to be able to leave alone.
            </p>
          </Ground>

          {/* 5. THE FOOTER. Lamp three, already shipped. */}
          <Ground
            on="slab"
            className="relative isolate rounded-none px-8 pt-16 pb-12"
          >
            {lit && (
              <>
                <Glow
                  shape="seam"
                  drive="mask"
                  vars={{ "--glw-blur": "16px" }}
                />
                <div data-glw-seamline />
              </>
            )}
            <p className="relative font-heading text-2xl">
              The whole event, in one album.
            </p>
            <p className="relative mt-2 max-w-sm text-[15px] text-muted-foreground">
              Muted copy at the slab&rsquo;s real token value, where the
              footer&rsquo;s first line sits.
            </p>
          </Ground>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The chapter cut here carries NO light of its own. The card crossing it
          does. That distinction is the whole of your bespoke note: pin a lamp
          to the object and a page has three, pin it to the seam and a page has
          one per section forever.
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
