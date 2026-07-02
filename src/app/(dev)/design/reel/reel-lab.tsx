"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  CardDeck,
  cardDeckDuration,
  FilmStrip,
  filmStripDuration,
  FPS,
  FramedGallery,
  framedGalleryDuration,
  LayeredParallax,
  layeredParallaxDuration,
  type Orientation,
  planReel,
  PolaroidStack,
  polaroidStackDuration,
  Reel,
  reelDimensions,
  type ReelClip,
  type ReelProps,
  type ReelTheme,
  resolveTheme,
  ScatteredPrints,
  scatteredPrintsDuration,
  THEME_IDS,
  THEME_LABELS,
  type ThemeId,
} from "@/lib/reel/composition";

// Mixed-aspect sample stills (portrait / landscape / square) so the cover-fit + the new fit-with-space
// framing (mismatched-orientation media) are both visible. picsum is fine for the in-browser <Img> (no CORS
// to DISPLAY). Live video is a later round; this lab is image-only (posterMode). Clips carry width/height so
// fitClip can decide cover vs fit.
const ASPECTS: [number, number][] = [
  [1080, 1920],
  [1920, 1080],
  [1200, 1200],
  [1080, 1350],
  [1600, 1100],
  [1080, 1620],
  [1500, 1000],
  [1200, 1500],
];
const SAMPLE = (n: number): ReelClip[] =>
  ASPECTS.slice(0, n).map(([w, h], i) => ({
    url: `https://picsum.photos/seed/preel${i}/${w}/${h}`,
    type: "photo",
    width: w,
    height: h,
  }));
const FULL = SAMPLE(8);

const LENGTHS: { label: string; value: number | null }[] = [
  { label: "Auto", value: null },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
];

// The STYLIZED treatments — each a designed composition + its own duration fn + a BAKED default grade (one
// complete look per style, per the flat-catalog model). The themeId is the treatment's native vibe.
const TREATMENTS: {
  id: string;
  label: string;
  themeId: ThemeId;
  component: React.FC<ReelProps>;
  duration: (p: ReelProps) => number;
}[] = [
  { id: "polaroid", label: "Polaroid stack", themeId: "warm", component: PolaroidStack, duration: polaroidStackDuration },
  { id: "filmstrip", label: "Film strip", themeId: "classic", component: FilmStrip, duration: filmStripDuration },
  { id: "scattered", label: "Scattered prints", themeId: "warm", component: ScatteredPrints, duration: scatteredPrintsDuration },
  { id: "framed", label: "Framed gallery", themeId: "editorial", component: FramedGallery, duration: framedGalleryDuration },
  { id: "carddeck", label: "Card deck", themeId: "punchy", component: CardDeck, duration: cardDeckDuration },
  { id: "parallax", label: "Layered parallax", themeId: "classic", component: LayeredParallax, duration: layeredParallaxDuration },
];

// Cap a media-first reel to a target length using the Motion timeline (planReel). Treatments cap in Phase 2.
function capClips(clips: ReelClip[], theme: ReelTheme, seed: number, lengthSec: number | null) {
  if (!lengthSec) return clips;
  const plan = planReel({ clips, theme, seed });
  const lenFrames = lengthSec * plan.fps;
  let cum = 0;
  let kept = 1;
  for (let k = 0; k < plan.clips.length; k++) {
    cum += plan.clips[k].durationInFrames;
    if (k > 0) cum -= plan.gaps[k - 1].durationInFrames;
    if (k === 0 || cum <= lenFrames) kept = k + 1;
    else break;
  }
  return clips.slice(0, Math.max(1, kept));
}

// One reel player, sized to the orientation.
function ReelPlayerTile({
  component,
  props,
  duration,
  orientation,
  restartKey,
}: {
  component: React.FC<ReelProps>;
  props: ReelProps;
  duration: number;
  orientation: Orientation;
  restartKey?: string;
}) {
  const { width, height } = reelDimensions(orientation);
  const landscape = width > height;
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {
    ref.current?.seekTo(0);
    ref.current?.play();
  }, [restartKey]);
  return (
    <div
      className="overflow-hidden rounded-xl border bg-black"
      style={{ width: landscape ? 360 : 220 }}
    >
      <Player
        ref={ref}
        component={component}
        inputProps={props}
        durationInFrames={duration}
        fps={FPS}
        compositionWidth={width}
        compositionHeight={height}
        autoPlay
        loop
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      />
    </div>
  );
}

export function ReelLab() {
  const [seed, setSeed] = useState(73);
  const [lengthSec, setLengthSec] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reel style catalog</h1>
        <p className="text-sm text-muted-foreground">
          The full catalog of complete looks, two families. Toggle orientation (portrait / landscape) and
          shuffle. Media that doesn&apos;t match the reel orientation is fit with designed space (never
          zoom-cropped). (Video preview is a later round, stills only here.)
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setSeed((s) => (s * 16807 + 1) % 1_000_000)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
        >
          <Shuffle className="size-4" /> Shuffle
        </button>
        <div className="h-5 w-px bg-border" aria-hidden />
        <div className="flex items-center gap-1" role="group" aria-label="Orientation">
          {(["portrait", "landscape"] as Orientation[]).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={o === orientation}
              onClick={() => setOrientation(o)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-transform ease-emphasis active:scale-95 ${o === orientation ? "bg-foreground text-background" : ""}`}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" aria-hidden />
        <div className="flex items-center gap-1" role="group" aria-label="Length">
          {LENGTHS.map((l) => (
            <button
              key={l.label}
              type="button"
              aria-pressed={l.value === lengthSec}
              onClick={() => setLengthSec(l.value)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95 ${l.value === lengthSec ? "bg-foreground text-background" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">seed {seed}</span>
      </div>

      {/* Media-first family */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium">Media-first looks</h2>
          <p className="text-xs text-muted-foreground">
            One engine, distinct moods, the photos are the show. Tuned to event vibes.
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          {THEME_IDS.map((id) => {
            const theme = resolveTheme(id);
            const props: ReelProps = {
              clips: capClips(FULL, theme, seed, lengthSec),
              theme,
              seed,
              orientation,
              posterMode: true,
            };
            return (
              <div key={id} className="space-y-1.5">
                <div className="text-xs font-medium">{THEME_LABELS[id]}</div>
                <ReelPlayerTile
                  component={Reel}
                  props={props}
                  duration={Math.max(1, planReel(props).totalFrames)}
                  orientation={orientation}
                  restartKey={`${id}-${seed}-${lengthSec}-${orientation}`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Stylized family */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium">Stylized treatments</h2>
          <p className="text-xs text-muted-foreground">
            Designed compositions, the photos become physical objects in a crafted scene.
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          {TREATMENTS.map(({ id, label, themeId, component, duration }) => {
            const props: ReelProps = {
              clips: FULL,
              theme: resolveTheme(themeId),
              seed,
              orientation,
              posterMode: true,
            };
            return (
              <div key={id} className="space-y-1.5">
                <div className="text-xs font-medium">{label}</div>
                <ReelPlayerTile
                  component={component}
                  props={props}
                  duration={Math.max(1, duration(props))}
                  orientation={orientation}
                  restartKey={`${id}-${seed}-${orientation}`}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
