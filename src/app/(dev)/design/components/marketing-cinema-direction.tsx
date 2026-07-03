"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import { PHOTOS } from "../screens/sample-photos";
import {
  DesktopFrame,
  Reveal,
  usePrefersReducedMotion,
} from "./marketing-lab-shared";

/**
 * DIRECTION B: THE REEL IS THE HERO (marketing-identity round, 2026-07-03).
 * Cinema-first: a full-bleed autoplaying montage IS the hero, always dark
 * (media surfaces are always dark; this direction wears that as the whole
 * site's skin). The motion grammar is borrowed from the reel itself:
 * story-style progress segments, perpetual Ken Burns drift on every shot
 * (negative delays, so a crossfade never snaps a transform), HARD film cuts
 * on the kinetic headline word (a cut, not a fade: cinema, not editorial),
 * and a linear film-strip conveyor in the signature section. Type is huge
 * and lower-third. The reel montage carries every drop of color.
 */

const SHOTS = [
  { src: PHOTOS[3], word: "wedding" },
  { src: PHOTOS[10], word: "birthday" },
  { src: PHOTOS[7], word: "festival" },
  { src: PHOTOS[4], word: "send-off" },
];
const HOLD_MS = 3400;

export function MarketingCinemaDirection() {
  return (
    <DesktopFrame>
      <div className="bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)]">
        <CinemaHero />
        <FilmStripSection />
        <CinemaClose />
      </div>
    </DesktopFrame>
  );
}

function CinemaHero() {
  const reduced = usePrefersReducedMotion();
  const [shot, setShot] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setShot((s) => (s + 1) % SHOTS.length);
    }, HOLD_MS);
    return () => clearInterval(t);
  }, [reduced]);

  // Reduced motion holds the universal line instead of cycling event types.
  const word = reduced ? "event" : SHOTS[shot].word;

  return (
    <section className="relative h-[560px] overflow-hidden">
      {/* The montage: stacked shots crossfade; every shot keeps drifting. */}
      {SHOTS.map((s, i) => (
        <div
          key={s.src}
          className="absolute inset-0 transition-opacity duration-[800ms] ease-linear"
          style={{ opacity: i === shot ? 1 : 0 }}
        >
          <div
            data-mkt-shot
            className="absolute inset-0"
            style={{ "--shot-i": i } as React.CSSProperties}
          >
            <Image
              src={s.src}
              alt=""
              fill
              sizes="992px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        </div>
      ))}
      {/* The scrim keeps the lower-third type legible over any shot. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-10 py-6">
        <span data-dir-display className="text-lg">
          Partyreel
        </span>
        <div className="flex items-center gap-6 text-[13px] text-white/70">
          <span>Pricing</span>
          <button
            type="button"
            data-dir-press
            className="h-8 rounded-[var(--radius-action-sm)] border border-white/25 px-4 text-[13px] font-medium text-white"
          >
            Sign in
          </button>
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 px-10 pb-8">
        <p className="text-[12px] font-medium tracking-[0.22em] text-white/60 uppercase">
          Shot by everyone. Edited by no one.
        </p>
        <h1 data-dir-display className="mt-3 text-[64px] leading-[0.98]">
          {/* The kinetic word cuts WITH the shot: film grammar, no fade. */}
          <span className="block">Every {word}</span>
          <span className="block">ends with a reel.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
          Guests scan one QR code and shoot the night from every angle.
          Partyreel cuts their best moments into a highlight reel you can share
          or download.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-white px-6 text-sm font-medium text-black"
          >
            Start free
          </button>
          <button
            type="button"
            data-dir-press
            className="flex h-11 items-center gap-2 rounded-[var(--radius-action)] border border-white/25 px-5 text-sm font-medium text-white"
          >
            <Play className="size-4 fill-current" />
            Watch a sample reel
          </button>
        </div>

        {/* The reel's own progress language: one segment per shot. */}
        <div className="mt-7 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5">
            {SHOTS.map((s, i) => (
              <span
                key={s.src}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <span
                  key={`${shot}-${i}`}
                  className="block h-full w-full origin-left bg-white"
                  style={{
                    transform: i < shot ? "scaleX(1)" : "scaleX(0)",
                    animation:
                      !reduced && i === shot
                        ? `mkt-progress ${HOLD_MS}ms linear both`
                        : undefined,
                  }}
                />
              </span>
            ))}
          </div>
          <span className="font-mono text-[11px] text-white/50 tabular-nums">
            00:{String(shot * 6).padStart(2, "0")} / 00:24
          </span>
        </div>
      </div>
    </section>
  );
}

/* The signature section: the night as a film strip on a linear conveyor
   (constant motion stays linear, the craft rule), with three scene cards
   that land as hard cuts while you scroll. */
function FilmStripSection() {
  const scenes = [
    {
      scene: "Scene 01",
      title: "Scan",
      body: "One QR code on the table. Guests are in straight from their camera app, no app and no account.",
    },
    {
      scene: "Scene 02",
      title: "Shoot",
      body: "Photos and videos land in the album live while the night happens, from every phone in the room.",
    },
    {
      scene: "Scene 03",
      title: "Screen",
      body: "Partyreel cuts the best moments into the night's highlight reel, ready to share or download.",
    },
  ];
  return (
    <section className="border-t border-white/10 py-16">
      <Reveal className="px-10">
        <p
          data-mkt-reveal
          className="text-[12px] font-medium tracking-[0.22em] text-white/50 uppercase"
        >
          How it works
        </p>
        <h2
          data-dir-display
          data-mkt-reveal
          className="mt-3 text-[40px] leading-[1.02]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          From two hundred phones to one cut.
        </h2>
      </Reveal>

      <div className="mt-10 overflow-hidden">
        <div data-mkt-marquee className="flex w-max">
          <FilmStrip />
          <FilmStrip />
        </div>
      </div>

      <Reveal className="mt-12 grid grid-cols-3 gap-6 px-10">
        {scenes.map((s, i) => (
          <div
            key={s.scene}
            data-mkt-cut
            className="rounded-[var(--radius)] border border-white/10 bg-white/[0.04] p-6"
            style={{ "--i": i, opacity: 0 } as React.CSSProperties}
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/45 uppercase">
              {s.scene}
            </p>
            <h3 data-dir-display className="mt-2 text-2xl">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {s.body}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* One copy of the strip; the marquee renders two back to back so the -50%
   loop is seamless. Sprocket holes ride inside the copy and travel with it. */
function FilmStrip() {
  return (
    <div className="flex shrink-0 flex-col gap-1.5 bg-black px-1 py-2">
      <Sprockets />
      <div className="flex gap-1.5 px-1">
        {PHOTOS.map((src) => (
          <div
            key={src}
            className="relative h-28 w-44 shrink-0 overflow-hidden rounded-[2px]"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <Sprockets />
    </div>
  );
}

function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-2 w-full bg-[repeating-linear-gradient(90deg,transparent_0_18px,rgba(255,255,255,0.22)_18px_26px)]"
    />
  );
}

function CinemaClose() {
  return (
    <section className="border-t border-white/10 px-10 py-16">
      <Reveal className="flex flex-col items-center gap-6 text-center">
        <h2
          data-dir-display
          data-mkt-reveal
          className="text-[48px] leading-[1.0]"
        >
          Roll credits on the group chat.
        </h2>
        <p
          data-mkt-reveal
          className="max-w-md text-[15px] leading-relaxed text-white/65"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          Free to host. Guests join with one scan. The reel builds itself.
        </p>
        <div data-mkt-reveal style={{ "--i": 4 } as React.CSSProperties}>
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-white px-6 text-sm font-medium text-black"
          >
            Start free
          </button>
        </div>
        <p className="font-mono text-[11px] text-white/35">
          A Partyreel production · partyreel.com
        </p>
      </Reveal>
    </section>
  );
}
