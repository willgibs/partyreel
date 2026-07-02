import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type {
  EffectKind,
  MotionStyle,
  OverlayKind,
  ParticleKind,
} from "./reel-types";
import { seeded } from "./seed";

// The reel "design magic" palette — overlays + particle fields composed OVER the clips (outside the
// TransitionSeries, so they persist across the whole reel). Everything is procedural + seeded + inline
// (no audio, no external asset, no text), so it renders IDENTICALLY in the browser player and in
// Lambda's headless Chrome (WYSIWYG). Particle motion recycles continuously so the looped reel always
// has life on screen. The EffectKind / ParticleKind unions live in reel-types.ts (pure, no remotion).

export const PARTICLE_KINDS: ParticleKind[] = ["confetti", "bokeh", "sparkle"];

export const TEXTURE_OVERLAYS: OverlayKind[] = [
  "grain",
  "vignette",
  "lightleak",
  "flares",
  "letterbox",
  "colorwash",
];

export const MOTION_STYLES: MotionStyle[] = [
  "drift",
  "punch",
  "float",
  "freezeGo",
];

export function isParticle(kind: EffectKind): kind is ParticleKind {
  return (PARTICLE_KINDS as string[]).includes(kind);
}

// --- Grain (static film noise via inline feTurbulence) -----------------------------------------------
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_URI = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

const CONFETTI_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#fde047",
];

export const Overlay: React.FC<{ kind: EffectKind; seed: number }> = ({
  kind,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = durationInFrames > 0 ? frame / durationInFrames : 0;

  if (isParticle(kind)) return <ParticleField kind={kind} seed={seed} />;

  if (kind === "grain") {
    return (
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN_URI,
          backgroundSize: "180px 180px",
          opacity: 0.07,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "vignette") {
    return (
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.46) 100%)",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "bloom") {
    // Soft warm highlight halation that gently breathes — the glow of film highlights (Film, Sunset).
    const a = 0.1 + 0.05 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(72% 56% at 50% 40%, rgba(255,240,214,${a}) 0%, rgba(255,240,214,0) 68%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "lightsweep") {
    // A slow warm light sweeping across the frame over the reel (Sunset, golden-hour light).
    const x = -15 + t * 130;
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 80% at ${x}% 32%, rgba(255,214,156,0.2) 0%, rgba(255,214,156,0) 55%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "softedge") {
    // A dreamy soft-focus edge falloff — a foggy glow that lifts the frame edges (Float).
    return (
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 78% 72% at 50% 48%, transparent 52%, rgba(255,250,246,0.22) 100%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "letterbox") {
    // Cinematic bars — orientation-aware. In LANDSCAPE (16:9) a true ~2.40:1 crop (~13% bars). In PORTRAIT
    // 2.40:1 bars would eat the frame (the clipping Will flagged), so portrait skips them: the cinematic
    // feel there comes from the grade + freeze-go beat + vignette, with NO clipping.
    if (width <= height) return null;
    const h = interpolate(frame, [0, 10], [0, 13], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${h}%`,
            background: "#000",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${h}%`,
            background: "#000",
          }}
        />
      </AbsoluteFill>
    );
  }

  if (kind === "colorwash") {
    // A duotone-ish stylized cast: a slowly-rotating two-tone gradient, soft-light blended.
    const angle = 110 + t * 30;
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${angle}deg, rgba(56,189,248,0.22), rgba(217,70,239,0.20))`,
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "flares") {
    // Two warm light flares sweeping on opposite drifts + a breathing bloom (screen-blended).
    const a = 0.1 + 0.08 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    const b = 0.08 + 0.07 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 + 1.7));
    const x1 = 12 + t * 70;
    const x2 = 90 - t * 65;
    return (
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(60% 40% at ${x1}% 8%, rgba(255,196,128,${a}) 0%, rgba(255,170,90,0) 60%),` +
            `radial-gradient(45% 55% at ${x2}% 92%, rgba(255,120,160,${b}) 0%, rgba(255,120,160,0) 60%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    );
  }

  // lightleak — the original subtle warm drift.
  const x = 20 + t * 60;
  const glow = 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 80% at ${x}% -10%, rgba(255,176,102,${glow}) 0%, rgba(255,140,80,0) 55%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

// --- Particle fields ---------------------------------------------------------------------------------
const ParticleField: React.FC<{ kind: ParticleKind; seed: number }> = ({
  kind,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = durationInFrames > 0 ? frame / durationInFrames : 0;

  const count = kind === "bokeh" ? 22 : kind === "sparkle" ? 30 : 46;

  const nodes = [];
  for (let i = 0; i < count; i++) {
    const x0 = seeded(seed, i, 1) * 100;
    const sz = seeded(seed, i, 2);
    const phase = seeded(seed, i, 3);
    const speed = 0.5 + seeded(seed, i, 4);

    if (kind === "confetti") {
      // Continuous staggered fall + sway + spin (recycles via frac so the reel always has confetti).
      const p = phase + (t / (0.7 + sz * 0.6)) * speed;
      const local = p - Math.floor(p);
      const y = -8 + local * 118;
      const x = x0 + Math.sin(local * Math.PI * 3 + i) * 7;
      const rot = local * 720 * (i % 2 ? 1 : -1);
      const size = 6 + sz * 8;
      nodes.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size * 0.5,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            transform: `rotate(${rot}deg)`,
            borderRadius: 1,
            opacity: 0.92,
          }}
        />,
      );
    } else if (kind === "bokeh") {
      // Soft glows drifting slowly upward, gently breathing.
      const p = phase + (t / 2.2) * speed;
      const local = p - Math.floor(p);
      const y = 110 - local * 130;
      const x = x0 + Math.sin(local * Math.PI * 2 + i) * 4;
      const size = 26 + sz * 70;
      const op = (0.1 + sz * 0.2) * (0.5 + 0.5 * Math.sin(local * Math.PI * 2));
      nodes.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,244,224,0.9) 0%, rgba(255,228,180,0) 70%)",
            opacity: op,
            filter: "blur(1px)",
          }}
        />,
      );
    } else {
      // sparkle — fixed glints that twinkle (opacity + scale pop on a seeded phase).
      const y0 = seeded(seed, i, 5) * 100;
      const tw = Math.sin((t * (4 + speed * 4) + phase * 6) * Math.PI);
      const op = Math.max(0, tw) ** 2;
      const s = 0.6 + op * 0.8;
      const size = 4 + sz * 5;
      nodes.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x0}%`,
            top: `${y0}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            boxShadow: `0 0 ${size}px ${size * 0.4}px rgba(255,244,210,0.9)`,
            opacity: op,
            transform: `scale(${s})`,
          }}
        />,
      );
    }
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: kind === "confetti" ? "normal" : "screen" }}>
      {nodes}
    </AbsoluteFill>
  );
};
