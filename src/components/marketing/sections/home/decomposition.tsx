"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { ReelFrame } from "@/components/marketing/frames";
import { Container } from "@/components/shared/container";
import { marketingImage } from "@/lib/constants/marketing-media";
import { DECOMPOSITION_FACTS } from "@/lib/constants/marketing-voice";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * LOUD (the loud/quiet map): the page's SIGNATURE move (IA section 3, the
 * made-from spine's anchor beat). V1 ONE-SHOT PLAY per the F5 lab round: the
 * reel comes APART into its source tiles once on scroll-into-view, while the
 * three byte-pinned facts land with counting numbers. Replay remounts the
 * stage via runId.
 *
 * MECHANIC CONTRACT (kept swap-bounded on purpose): the burst lives entirely
 * inside <DecompositionStage>; if Will rules in the V2 scroll-driven variant
 * at Sitting 1, only the stage's internals change (a sticky wrapper + a
 * progress-scrubbed transform writer), never the section export, the copy, or
 * the tile-field geometry below.
 *
 * The burst rides the chapter-1 [data-mkt-fly] vocabulary INVERTED: each tile
 * is SEATED at its final spot and its --fly-x/--fly-y point back at the reel
 * card's center, so the pre-fire state is "gathered behind the reel" and the
 * fire is the outward burst (the same pop ease family as the demo's tiles-fly,
 * exactly the IA's "reverse of the demo" instruction). Reduced motion: the
 * fly's reduce block fades tiles in already settled and the facts jump to
 * their final numbers, "facts fade over the settled field".
 *
 * Geometry scales via container-query units: seats were tuned in px on a
 * 940x470 design stage (the lab values, judged by Will), converted to cqw so
 * one seat map serves every viewport (both axes share the width scale because
 * the stage keeps its aspect).
 */

/* The tile field: 12 manifest tiles seated around the centered reel card.
   x/y are the seat's offset from the card center in DESIGN px; r the settled
   tilt; w the tile width. Same numbers drive layout AND the burst vector. */
type BurstTile = { id: string; x: number; y: number; r: number; w: number };

const TILES: BurstTile[] = [
  { id: "wedding-golden", x: -370, y: -140, r: -7, w: 120 },
  { id: "reception-table", x: -250, y: 45, r: 4, w: 104 },
  { id: "party-balloons", x: -345, y: 130, r: 6, w: 112 },
  { id: "concert-confetti", x: -140, y: -160, r: -4, w: 96 },
  { id: "wedding-rings", x: -115, y: 160, r: 5, w: 88 },
  { id: "reception-hall", x: 130, y: -158, r: 6, w: 104 },
  { id: "party-dj", x: 275, y: -115, r: -6, w: 128 },
  { id: "wedding-toast", x: 150, y: 158, r: -5, w: 110 },
  { id: "festival-lights", x: 390, y: 15, r: 5, w: 120 },
  { id: "festival-crowd", x: 300, y: 145, r: 8, w: 104 },
  { id: "wedding-arch", x: -425, y: -25, r: -5, w: 96 },
  { id: "wedding-petals", x: 408, y: -140, r: 7, w: 78 },
];

const STAGE_W = 940;

/** Design-px to container-query width units (the stage is the container).
 *  --dscale (1 by default) is the MOBILE readability knob: below sm the stage
 *  sets it to 1.6 so the surviving tiles render at a legible size (a 375px
 *  container at 1x made 104px seats into ~41px thumbnails — the flagged
 *  uniform-scale tradeoff, now solved by cropping instead of shrinking: the
 *  far seats hide below sm and the near field scales up). */
const cq = (px: number) =>
  `calc(${((px / STAGE_W) * 100).toFixed(3)}cqw * var(--dscale, 1))`;

/** Seats beyond this |x| fall outside the mobile crop; they hide below sm. */
const MOBILE_CROP_X = 310;

// The closing line, in the made-from register. Recast from the IA's draft:
// "night" is banned as identity language (Will's round-2 ruling).
const CLOSING_LINE =
  "Partyreel turns everyone's camera roll into the film of the whole event.";

/* The byte-pinned facts render verbatim; the number inside each animates, so
   the visible copy IS the constant. home-sections.test.ts pins parseability. */
type FactParts = { before: string; value: number | null; after: string };

function splitFact(fact: string): FactParts {
  const m = fact.match(/^(\D*)(\d+)(.*)$/);
  return m
    ? { before: m[1], value: Number(m[2]), after: m[3] }
    : { before: fact, value: null, after: "" };
}

const FACTS: FactParts[] = DECOMPOSITION_FACTS.map(splitFact);

const easeOutCubic = (n: number) => 1 - Math.pow(1 - n, 3);

/** JS count-up for one fact number (reduced motion jumps to the target).
 *  Everything (the reduced jump included) is timeout-scheduled so setState
 *  stays out of the effect body (the live-direction lint lesson). */
function CountUp({
  to,
  on,
  reduced,
  delayMs,
  durMs = 1250,
}: {
  to: number;
  on: boolean;
  reduced: boolean;
  delayMs: number;
  durMs?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let start: number | null = null;
    const delay = setTimeout(
      () => {
        if (reduced) {
          setN(to);
          return;
        }
        const tick = (t: number) => {
          if (start === null) start = t;
          const p = Math.min((t - start) / durMs, 1);
          setN(Math.round(to * easeOutCubic(p)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      reduced ? 0 : delayMs,
    );
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [on, reduced, to, delayMs, durMs]);
  return <span className="font-mono tabular-nums">{n}</span>;
}

function TilePhoto({ id }: { id: string }) {
  const m = marketingImage(id);
  return (
    <div
      className="relative w-full overflow-hidden rounded-[3px]"
      style={{ aspectRatio: `${m.width} / ${m.height}` }}
    >
      <Image src={m.src} alt="" fill sizes="140px" className="object-cover" />
    </div>
  );
}

export function Decomposition() {
  const [runId, setRunId] = useState(0);
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <DecompositionStage key={runId} onReplay={() => setRunId((n) => n + 1)} />
    </section>
  );
}

function DecompositionStage({ onReplay }: { onReplay: () => void }) {
  const reduced = usePrefersReducedMotion();
  // 0.3: the burst fires once roughly a third of the stage has scrolled in.
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <div ref={ref} data-inview={inView ? "true" : "false"}>
      {/* The container-query stage: aspect-locked, seats in cqw. Below sm the
          stage CROPS instead of shrinking: --dscale grows the near field, the
          taller aspect gives the scaled seats vertical room, and the far
          seats (hidden there) would have left the frame anyway. */}
      <div className="[container-type:inline-size] relative mx-auto w-full max-w-[940px] overflow-hidden max-sm:[--dscale:1.6]">
        <div className="relative aspect-[940/470] max-sm:aspect-[940/700]">
          {TILES.map((t, i) => (
            <div
              key={t.id}
              data-mkt-fly
              data-on={inView ? "true" : undefined}
              className={`absolute ${Math.abs(t.x) > MOBILE_CROP_X ? "max-sm:hidden" : ""}`}
              style={
                {
                  left: `calc(50% + ${cq(t.x)})`,
                  top: `calc(50% + ${cq(t.y)})`,
                  width: cq(t.w),
                  translate: "-50% -50%",
                  // Individual `rotate` stays constant through the flight: the
                  // fly transition animates `transform` only, so the tilt never
                  // fights the burst vector.
                  rotate: `${t.r}deg`,
                  "--fly-x": cq(-t.x),
                  "--fly-y": cq(-t.y),
                  "--i": i,
                } as CSSProperties
              }
            >
              <TilePhoto id={t.id} />
            </div>
          ))}
          <div className="absolute top-1/2 left-1/2 z-10 w-[36cqw] max-w-[340px] min-w-[180px] -translate-x-1/2 -translate-y-1/2">
            <ReelFrame />
          </div>
        </div>
      </div>

      {/* The three facts land while the tiles fly; counts tick in Geist Mono
          tabular. Sequential stagger so each fact gets its beat. */}
      <Container className="mt-8">
        <div className="flex flex-wrap items-baseline justify-center gap-x-10 gap-y-2 text-center">
          {FACTS.map((fact, i) => (
            <p
              key={DECOMPOSITION_FACTS[i]}
              data-mkt-reveal
              className="font-heading text-2xl leading-tight text-foreground sm:text-[26px]"
              style={{ "--i": i, "--mkt-stagger-ms": "260ms" } as CSSProperties}
            >
              {fact.before}
              {fact.value !== null && (
                <CountUp
                  to={fact.value}
                  on={inView}
                  reduced={reduced}
                  delayMs={350 + i * 260}
                />
              )}
              {fact.after}
            </p>
          ))}
        </div>
        <p
          data-mkt-reveal
          className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground"
          style={{ "--i": 4, "--mkt-stagger-ms": "260ms" } as CSSProperties}
        >
          {CLOSING_LINE}
        </p>
      </Container>

      <button
        type="button"
        onClick={onReplay}
        className="absolute top-6 right-4 flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground transition-transform duration-150 active:scale-95 sm:right-6"
      >
        <RotateCcw className="size-3.5" />
        Replay
      </button>
    </div>
  );
}
