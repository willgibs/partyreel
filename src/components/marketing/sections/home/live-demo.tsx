"use client";

import { Play, QrCode, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { ConfettiBurst } from "@/components/marketing/sections/shared/confetti-burst";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * LOUD (the loud/quiet map): the ratified Direction-C phase machine re-skinned
 * to the always-dark cinema room (the live-direction lab reference), acting
 * out the core loop: QR pulses, the scan beam sweeps, tiles FLY from the
 * phone into the album, live toasts pop, the reel card lands, counters tick.
 *
 *  - Phases idle -> scan (400ms) -> tiles (1600ms) -> reel (3600ms),
 *    timeout-scheduled ONCE the stage scrolls into view (useInViewOnce 0.35);
 *    Replay bumps runId for a clean re-run (the reset is a remount, never a
 *    setState-in-effect). Reduced motion jumps straight to the reel phase.
 *  - The toasts are the ratified [data-mkt-toast] CSS, NEVER sonner (cinema
 *    surfaces never call sonner; its root Toaster follows the session theme).
 *  - LiveDot stays --success green (feedback color as STATE, the one allowed
 *    non-mono accent here); its infinite ping gates on the ambient pause.
 *  - Fixtures are manifest images + art-directed display names, no real PII.
 *  - The demo beats are JS constants mirroring the lab's ruling; they have no
 *    --mkt-* CSS vars (marketing.css is closed to this track), so wiring them
 *    into the motion tuner is an orchestrator follow-up if wanted.
 */

type Phase = "idle" | "scan" | "tiles" | "reel";
const PHASE_ORDER: Phase[] = ["idle", "scan", "tiles", "reel"];
const after = (a: Phase, b: Phase) =>
  PHASE_ORDER.indexOf(a) >= PHASE_ORDER.indexOf(b);

const SCAN_AT_MS = 400;
const TILES_AT_MS = 1600;
const REEL_AT_MS = 3600;

/** The album tiles: three CSS columns, heights varied so it reads organic. */
const TILES: { id: string; h: string }[] = [
  { id: "wedding-golden", h: "h-24" },
  { id: "reception-table", h: "h-32" },
  { id: "party-balloons", h: "h-20" },
  { id: "concert-confetti", h: "h-28" },
  { id: "wedding-rings", h: "h-20" },
  { id: "reception-hall", h: "h-32" },
  { id: "party-dj", h: "h-24" },
  { id: "wedding-toast", h: "h-24" },
  { id: "festival-crowd", h: "h-28" },
];

// Art-directed fixtures (the IA's Maya & Jay demo event), not real people.
const DEMO_EVENT_NAME = "Maya & Jay's Wedding";
// `phoneOnly: false` drops a toast from the MOBILE composition (R4/A4): below
// sm the stage stacks instead of overlaying, and the reel beat is carried by
// the payoff card alone — a third chip there was one element too many.
const TOASTS: { at: Phase; text: string; mobile: boolean }[] = [
  { at: "tiles", text: "Maya added 3 photos", mobile: true },
  { at: "tiles", text: "Jay is in", mobile: true },
  { at: "reel", text: "12 more from the dance floor", mobile: false },
];
const COUNTER_TARGETS = { photos: 128, guests: 23 };

const SUBHEAD =
  "Guests scan, photos land, and the album builds itself while the party is still going.";

export function LiveDemo() {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.35);
  const { ref: pauseRef, paused } = useAmbientPause<HTMLDivElement>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);
  const payoffRef = useRef<HTMLDivElement | null>(null);

  // Every step (including the reset) is timeout-scheduled: setState stays out
  // of the effect body (lint) AND a replay visibly restarts from a clean stage.
  useEffect(() => {
    if (!inView) return;
    const timers = reduced
      ? [setTimeout(() => setPhase("reel"), 0)]
      : [
          setTimeout(() => setPhase("idle"), 0),
          setTimeout(() => setPhase("scan"), SCAN_AT_MS),
          setTimeout(() => setPhase("tiles"), TILES_AT_MS),
          setTimeout(() => setPhase("reel"), REEL_AT_MS),
        ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced, runId]);

  const reelCover = marketingImage("wedding-golden");

  return (
    <SectionShell
      align="left"
      eyebrow="Live demo"
      heading={SECTION_HEADERS.liveDemo.line}
      subhead={SUBHEAD}
    >
      <div ref={ref} className="mx-auto mt-10 max-w-4xl">
        {/* The stage: the core loop, acted out. data-paused freezes the QR
            pulse (chapter-1 pause contract) when the stage leaves the screen. */}
        <div
          ref={pauseRef}
          data-phase={phase}
          data-paused={paused ? "true" : undefined}
          className="relative overflow-hidden rounded-2xl border bg-card/60 p-4 sm:p-6"
        >
          <div className="flex gap-4 sm:gap-6">
            {/* The phone: where everything launches from. */}
            <div className="w-32 shrink-0 sm:w-40">
              <div className="rounded-[14px] border bg-card p-3 ring-1 ring-foreground/5">
                <p className="text-center text-[11px] font-medium">
                  Scan to join
                </p>
                <div
                  data-mkt-pulse={
                    phase === "idle" || phase === "scan" ? "" : undefined
                  }
                  className="relative mx-auto mt-2 flex size-24 items-center justify-center overflow-hidden rounded-md border sm:size-28"
                >
                  <QrCode
                    className="size-16 text-foreground sm:size-20"
                    strokeWidth={1.2}
                  />
                  {/* The scan beam: one confident sweep. */}
                  <span
                    data-mkt-scan
                    data-on={phase === "scan" ? "true" : undefined}
                    className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-foreground/25 to-transparent opacity-0 data-[on=true]:opacity-100"
                  />
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  {DEMO_EVENT_NAME}
                </p>
              </div>
            </div>

            {/* The album the party pours into. */}
            <div className="min-w-0 flex-1 columns-3 gap-1.5">
              {TILES.map((tile, i) => {
                const m = marketingImage(tile.id);
                return (
                  <div
                    key={tile.id}
                    data-mkt-fly
                    data-on={after(phase, "tiles") ? "true" : undefined}
                    className={`relative mb-1.5 ${tile.h} w-full overflow-hidden rounded-[3px]`}
                    style={
                      {
                        "--i": i,
                        "--fly-x": "-72px",
                        "--fly-y": `${(i % 3) * 14 - 14}px`,
                      } as CSSProperties
                    }
                  >
                    <Image
                      src={m.src}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* THE CELEBRATORY BEAT (the achromatic ruling's canonical accent):
              colored confetti with real physics rains once per run when the
              reel lands, colliding with the payoff card below. One-shot, never
              a loop; reduced motion skips it inside the component (and the
              reduced path never staggers phases anyway). */}
          {!reduced && (
            <ConfettiBurst
              fire={after(phase, "reel") ? runId + 1 : 0}
              targetRef={payoffRef}
            />
          )}

          {/* Live toasts: the room, arriving. The ratified [data-mkt-toast]
              vocabulary, deliberately NOT sonner. Same mobile rule as the
              payoff card below: a wrapped chip row in flow under sm, the
              floating stack from sm up. DOM order is the STORY order (toasts
              during the tiles phase, then the reel card), which is what the
              stacked mobile layout reads out loud. */}
          <div className="mt-3 flex flex-wrap gap-2 sm:absolute sm:bottom-6 sm:left-6 sm:mt-0 sm:flex-col">
            {TOASTS.map((toast, i) => (
              <span
                key={toast.text}
                data-mkt-toast
                data-on={after(phase, toast.at) ? "true" : undefined}
                className={`w-fit rounded-full border bg-popover/95 px-3 py-1.5 text-xs font-medium backdrop-blur ${
                  toast.mobile ? "" : "max-sm:hidden"
                }`}
                style={{ transitionDelay: `${i * 220}ms` }}
              >
                {toast.text}
              </span>
            ))}
          </div>

          {/* The payoff: the reel card lands once the album has filled.
              MOBILE COMPOSITION (R4/A4): below sm the card sits IN FLOW under
              the mosaic (full width) instead of floating over it — at 375 the
              overlay collided with both the tiles and the toast chips. From sm
              up it floats over the album exactly as before (the landing card
              IS the praised beat). ConfettiBurst reads the card's live rect,
              so the physics target follows either layout. */}
          <div
            ref={payoffRef}
            data-mkt-toast
            data-on={after(phase, "reel") ? "true" : undefined}
            className="mt-3 flex items-center gap-3 rounded-xl border bg-popover/95 p-3 backdrop-blur sm:absolute sm:right-6 sm:bottom-6 sm:mt-0 sm:pr-4"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-[3px]">
              <Image
                src={reelCover.src}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="size-4 fill-white text-white" />
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">Reel ready</p>
              <p className="text-xs text-muted-foreground">
                0:47 · Built from the party
              </p>
            </div>
          </div>
        </div>

        {/* The status line under the stage: live state, the counters, and the
            Replay control. Replay used to float INSIDE the stage's top-right
            corner, where it sat on a tile at every width (R4/A4); out here it
            is a real control on a real row, and the frame stays pure media. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <LiveDot on={after(phase, "tiles")} paused={paused} />
            Filling live right now
          </span>
          <div className="flex items-center gap-3">
            <LiveCounters key={runId} phase={phase} reduced={reduced} />
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-card px-3 text-xs font-medium text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-[0.97]"
            >
              <RotateCcw className="size-3.5" />
              Replay
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/** --success stays the dot's color: feedback state, not decoration. The ping
 *  is an infinite loop, so it honors the ambient pause by unmounting. */
function LiveDot({ on, paused }: { on: boolean; paused: boolean }) {
  return (
    <span className="relative flex size-2">
      {on && !paused && (
        <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:hidden" />
      )}
      <span
        className={`relative size-2 rounded-full transition-colors duration-300 ${on ? "bg-success" : "bg-border"}`}
      />
    </span>
  );
}

/* The counters tick up while the tiles land (JS count-up so reduced motion
   can jump straight to the final numbers). The parent re-keys this on Replay,
   so the reset is a remount, never a setState-in-effect. */
function LiveCounters({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const [counts, setCounts] = useState({ photos: 0, guests: 0 });
  const counting = after(phase, "tiles");

  useEffect(() => {
    if (!counting || reduced) return;
    const started = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - started) / 1100, 1);
      // Ease the count so it lands softly instead of braking hard.
      const eased = 1 - Math.pow(1 - p, 3);
      setCounts({
        photos: Math.round(COUNTER_TARGETS.photos * eased),
        guests: Math.round(COUNTER_TARGETS.guests * eased),
      });
      if (p === 1) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [counting, reduced]);

  // Reduced motion skips the tick and shows the destination numbers.
  const shown = counting && reduced ? COUNTER_TARGETS : counts;

  return (
    <p className="text-[13px] text-muted-foreground tabular-nums">
      {shown.photos} photos · {shown.guests} guests · 1 reel
    </p>
  );
}
