"use client";

import Image from "next/image";
import { Play, QrCode, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { PHOTOS } from "../screens/sample-photos";
import {
  DesktopFrame,
  Reveal,
  useInView,
  usePrefersReducedMotion,
} from "./marketing-lab-shared";

/**
 * DIRECTION C: LIVE EVENT ENERGY (marketing-identity round, 2026-07-03).
 * The product demos itself: the hero's right half is a replayable choreography
 * of the core loop (QR pulses, a scan beam sweeps, tiles FLY from the phone
 * into a masonry, live toasts pop, counters tick, the reel card lands).
 * Motion language: PLAYFUL STAGGER on a subtly springy curve (--mkt-ease-pop),
 * quick 300-460ms beats; energy, but crafted. Light paper chrome so the
 * flying media carries all the color. The signature section retells the
 * night as a timeline that fills in as you scroll.
 *
 * The choreography is a phase machine (idle -> scan -> tiles -> reel) driven
 * by timeouts once the stage scrolls into view; Replay re-runs it. Reduced
 * motion skips to the final phase (the story still lands, without theater).
 */

type Phase = "idle" | "scan" | "tiles" | "reel";
const PHASE_ORDER: Phase[] = ["idle", "scan", "tiles", "reel"];
const after = (a: Phase, b: Phase) =>
  PHASE_ORDER.indexOf(a) >= PHASE_ORDER.indexOf(b);

/** The masonry tiles: three CSS columns, heights varied so it reads organic. */
const TILES: { src: string; h: string }[] = [
  { src: PHOTOS[2], h: "h-24" },
  { src: PHOTOS[0], h: "h-32" },
  { src: PHOTOS[6], h: "h-20" },
  { src: PHOTOS[9], h: "h-28" },
  { src: PHOTOS[1], h: "h-20" },
  { src: PHOTOS[10], h: "h-32" },
  { src: PHOTOS[5], h: "h-24" },
  { src: PHOTOS[8], h: "h-24" },
  { src: PHOTOS[3], h: "h-28" },
];

const TOASTS: { at: Phase; text: string }[] = [
  { at: "tiles", text: "Maya added 3 photos" },
  { at: "tiles", text: "Jay is in" },
  { at: "reel", text: "12 more from the dance floor" },
];

export function MarketingLiveDirection() {
  return (
    <DesktopFrame>
      <LiveNav />
      <LiveHero />
      <TimelineSection />
      <LiveClose />
    </DesktopFrame>
  );
}

function LiveNav() {
  return (
    <header className="flex items-center justify-between px-10 pt-6 pb-4">
      <span data-dir-display className="text-lg">
        Partyreel
      </span>
      <nav className="flex items-center gap-6 text-[13px] text-muted-foreground">
        <span>How it works</span>
        <span>Pricing</span>
        <button
          type="button"
          data-dir-press
          className="h-8 rounded-[var(--radius-action-sm)] bg-primary px-4 text-[13px] font-medium text-primary-foreground"
        >
          Start free
        </button>
      </nav>
    </header>
  );
}

function LiveHero() {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);

  // Every step (including the reset) is timeout-scheduled: setState stays out
  // of the effect body (lint) AND a replay visibly restarts from a clean stage.
  useEffect(() => {
    if (!inView) return;
    const timers = reduced
      ? [setTimeout(() => setPhase("reel"), 0)]
      : [
          setTimeout(() => setPhase("idle"), 0),
          setTimeout(() => setPhase("scan"), 400),
          setTimeout(() => setPhase("tiles"), 1600),
          setTimeout(() => setPhase("reel"), 3600),
        ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced, runId]);

  return (
    <section ref={ref} className="grid grid-cols-12 gap-x-8 px-10 pt-6 pb-16">
      <div className="col-span-5 flex flex-col justify-center gap-6">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <LiveDot on={after(phase, "tiles")} />
          Filling live right now
        </span>
        <h1 data-dir-display className="text-[52px] leading-[1.0] text-balance">
          Watch the night pour in.
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Guests scan, photos land, the album builds itself while the party is
          still going. No app, no account, no chasing.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Start free
          </button>
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] border px-5 text-sm font-medium"
          >
            Try the live demo
          </button>
        </div>
        <LiveCounters key={runId} phase={phase} reduced={reduced} />
      </div>

      {/* The stage: the core loop, acted out. */}
      <div className="col-span-7">
        <div
          data-phase={phase}
          className="relative overflow-hidden rounded-[var(--radius)] border bg-muted/40 p-6"
        >
          <div className="flex gap-6">
            {/* The phone: where everything launches from. */}
            <div className="w-40 shrink-0">
              <div className="rounded-[14px] border bg-background p-3 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.35)]">
                <p className="text-center text-[11px] font-medium">
                  Scan to join
                </p>
                <div
                  data-mkt-pulse={
                    phase === "idle" || phase === "scan" ? "" : undefined
                  }
                  className="relative mx-auto mt-2 flex size-28 items-center justify-center overflow-hidden rounded-[6px] border"
                >
                  <QrCode
                    className="size-20 text-foreground"
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
                  Maya &amp; Jay&apos;s Wedding
                </p>
              </div>
            </div>

            {/* The masonry the night pours into. */}
            <div className="min-w-0 flex-1 columns-3 gap-1.5">
              {TILES.map((tile, i) => (
                <div
                  key={tile.src}
                  data-mkt-fly
                  data-on={after(phase, "tiles") ? "true" : undefined}
                  className={`relative mb-1.5 ${tile.h} w-full overflow-hidden rounded-[var(--radius-tile)]`}
                  style={
                    {
                      "--i": i,
                      "--fly-x": "-72px",
                      "--fly-y": `${(i % 3) * 14 - 14}px`,
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* The payoff: the reel card lands once the album has filled. */}
          <div
            data-mkt-toast
            data-on={after(phase, "reel") ? "true" : undefined}
            className="absolute right-6 bottom-6 flex items-center gap-3 rounded-[var(--radius)] border bg-background/95 p-3 pr-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.4)] backdrop-blur"
          >
            <div className="relative size-12 overflow-hidden rounded-[var(--radius-tile)]">
              <Image
                src={PHOTOS[0]}
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
                0:47 · Built from tonight
              </p>
            </div>
          </div>

          {/* Live toasts: the room, arriving. */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2">
            {TOASTS.map((toast, i) => (
              <span
                key={toast.text}
                data-mkt-toast
                data-on={after(phase, toast.at) ? "true" : undefined}
                className="w-fit rounded-full border bg-background/95 px-3 py-1.5 text-xs font-medium shadow-[0_10px_24px_-14px_rgba(0,0,0,0.35)] backdrop-blur"
                style={{ transitionDelay: `${i * 220}ms` }}
              >
                {toast.text}
              </span>
            ))}
          </div>

          <button
            type="button"
            data-dir-press
            onClick={() => setRunId((n) => n + 1)}
            className="absolute top-4 right-4 flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border bg-background px-3 text-xs font-medium text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Replay
          </button>
        </div>
      </div>
    </section>
  );
}

function LiveDot({ on }: { on: boolean }) {
  return (
    <span className="relative flex size-2">
      {on && (
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
const COUNTER_TARGETS = { photos: 128, guests: 23 };

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
    <p className="font-mono text-[13px] text-muted-foreground tabular-nums">
      {shown.photos} photos · {shown.guests} guests · 1 reel
    </p>
  );
}

/* The signature scroll section: the night retold as a timeline that fills in
   as you scroll, each beat landing with the same playful stagger. */
function TimelineSection() {
  const beats = [
    {
      time: "9:02 PM",
      title: "First scan",
      body: "The QR hits the tables. Grandma is uploading before the starters land.",
      tiles: [PHOTOS[1], PHOTOS[5], PHOTOS[6]],
    },
    {
      time: "11:48 PM",
      title: "The dance floor",
      body: "Forty phones, one album. Every angle of the same song.",
      tiles: [PHOTOS[9], PHOTOS[10], PHOTOS[7], PHOTOS[8]],
    },
    {
      time: "7:30 AM",
      title: "The morning after",
      body: "Nothing to chase. One link, everything in it, and the reel is already cut.",
      tiles: [PHOTOS[0], PHOTOS[4]],
    },
  ];
  return (
    <section className="border-t bg-muted/30 px-10 py-16">
      <Reveal>
        <p
          data-mkt-reveal
          className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
        >
          One night with Partyreel
        </p>
        <h2
          data-dir-display
          data-mkt-reveal
          className="mt-3 text-[40px] leading-[1.02]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          The album builds itself.
        </h2>
      </Reveal>
      <div className="mt-10 flex flex-col gap-10">
        {beats.map((beat) => (
          <Reveal
            key={beat.time}
            className="grid grid-cols-12 items-center gap-x-8"
          >
            <div className="col-span-5">
              <p
                data-mkt-reveal
                className="font-mono text-[12px] text-muted-foreground tabular-nums"
              >
                {beat.time}
              </p>
              <h3
                data-dir-display
                data-mkt-reveal
                className="mt-1 text-2xl"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                {beat.title}
              </h3>
              <p
                data-mkt-reveal
                className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                {beat.body}
              </p>
            </div>
            <div className="col-span-7 flex gap-2">
              {beat.tiles.map((src, i) => (
                <div
                  key={src}
                  data-mkt-reveal
                  className="relative h-28 flex-1 overflow-hidden rounded-[var(--radius-tile)]"
                  style={
                    {
                      "--i": i + 2,
                      "--mkt-reveal-ms": "450ms",
                    } as React.CSSProperties
                  }
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LiveClose() {
  return (
    <section className="px-10 py-16">
      <Reveal className="flex flex-col items-center gap-6 text-center">
        <h2
          data-dir-display
          data-mkt-reveal
          className="text-[44px] leading-[1.0]"
        >
          Host the kind of night people relive.
        </h2>
        <p
          data-mkt-reveal
          className="max-w-md text-[15px] leading-relaxed text-muted-foreground"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          Create an event free, print one QR code, and let your guests do the
          rest.
        </p>
        <div data-mkt-reveal style={{ "--i": 4 } as React.CSSProperties}>
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Create your event
          </button>
        </div>
      </Reveal>
    </section>
  );
}
