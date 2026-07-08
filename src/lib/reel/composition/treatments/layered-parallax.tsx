import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelClip, ReelProps, ReelTheme } from "../../engine/reel-types";
import { seeded } from "../../engine/seed";

// A COMPOSITIONAL treatment: each photo becomes an immersive full-frame MOMENT — a huge, soft, color-bleeding
// BLURRED copy of ITSELF washes the entire frame (the far plane) while the crisp photo floats in front (the
// near plane). The two drift at DIFFERENT rates (a slow Ken-Burns each, opposed) → real parallax depth, and
// each memory SWAPS to the next as a staggered depth-dissolve: the incoming wash leads (the room re-colors
// first), then the crisp photo CONDENSES out of its own blur into focus, while the outgoing photo melts back
// into its wash. SIGNATURE: "each memory fills the room with its own colour, then condenses out of it" — a
// wave shot floods the frame aqua, a sunset floods it gold, and each photo emerges from + dissolves into that
// colour. Pure media (no surface, no object) — distinct from the physical-object treatments AND the flat
// moods. It also solves mismatched aspects natively: the floating photo is NEVER cropped or letterboxed — its
// own blurred wash fills whatever margin the frame leaves. Orientation-agnostic (the wash always covers; the
// float sizes to the photo). Deterministic (seeded) + inline (WYSIWYG in Lambda). NO text. Honors theme.grade.

const HOLD = 44; // frames a photo holds (~1.8s at 24fps)
const TRANS = 22; // the depth-dissolve swap (~0.9s)
const CYCLE = HOLD + TRANS;
const TAIL = 28;
const INTRO = 14; // the first photo condenses in rather than snapping on

const EASE = Easing.bezier(0.4, 0, 0.2, 1); // a smooth cinematic dissolve

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function layeredParallaxDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, INTRO + (n - 1) * CYCLE + HOLD + TAIL);
}

// One immersive slide: the blurred self-wash (far) + the floating crisp photo (near), each with its own slow
// Ken-Burns so they part into parallax. u01 = the slide's life progress (drives the drift, continuous across
// the swap so nothing jumps). The wash + the float carry SEPARATE opacities so the swap can stagger them (the
// colour leads, the photo follows); fgBlur condenses the photo out of / melts it back into its own wash.
const Slide: React.FC<{
  clip: ReelClip;
  theme: ReelTheme;
  width: number;
  height: number;
  px: (v: number) => number;
  seed: number;
  i: number;
  u01: number;
  bgOpacity: number;
  fgOpacity: number;
  fgScale: number;
  fgBlur: number;
}> = ({ clip, theme, width, height, px, seed, i, u01, bgOpacity, fgOpacity, fgScale, fgBlur }) => {
  if (!clip.url) {
    return <AbsoluteFill style={{ opacity: Math.max(bgOpacity, fgOpacity), background: theme.background }} />;
  }

  // The float sizes to the PHOTO's own aspect (so it's never cropped); its blurred self fills any margin.
  const aspect = clip.width && clip.height ? clip.width / clip.height : 1;
  const boxW = width * 0.86;
  const boxH = height * 0.8;
  const wide = aspect > boxW / boxH;
  const cardW = wide ? boxW : boxH * aspect;
  const cardH = wide ? boxW / aspect : boxH;

  // Opposed slow drifts → the parallax. The wash pushes bigger + one way; the float drifts smaller + the other.
  const dir = seeded(seed, i, 40) > 0.5 ? 1 : -1;
  const dirY = seeded(seed, i, 41) > 0.5 ? 1 : -1;
  const d = u01 - 0.5; // centered so the drift crosses zero mid-hold

  const bgScale = lerp(1.16, 1.32, u01);
  const bgX = dir * d * width * 0.07;
  const bgY = dirY * d * height * 0.045;

  const fgSc = lerp(1.0, 1.05, u01) * fgScale;
  const fgX = -dir * d * width * 0.024;
  const fgY = -dirY * d * height * 0.017;
  const fgRadius = Math.min(cardW, cardH) * 0.045;

  return (
    <AbsoluteFill>
      {/* FAR plane — the blurred, colour-bleeding wash of the same photo (+ its framing overlays). */}
      <AbsoluteFill style={{ opacity: bgOpacity }}>
        <Img
          src={clip.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `${theme.grade} blur(${px(46).toFixed(1)}px) brightness(0.68) saturate(1.34)`,
            transform: `translate(${bgX.toFixed(1)}px, ${bgY.toFixed(1)}px) scale(${bgScale.toFixed(4)})`,
          }}
        />
        {/* A soft vignette so the float reads against its own wash (kept light so the colour stays vivid). */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 94% 86% at 50% 48%, transparent 44%, rgba(0,0,0,0.44) 100%)`,
            pointerEvents: "none",
          }}
        />
        {/* A soft key glow lifting the float off the wash. */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(46% 38% at 50% 46%, rgba(255,252,246,0.08) 0%, transparent 70%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>

      {/* NEAR plane — the crisp photo floating in front (parallaxing slower than its wash). */}
      <AbsoluteFill
        style={{ opacity: fgOpacity, justifyContent: "center", alignItems: "center", pointerEvents: "none" }}
      >
        <div
          style={{
            width: cardW,
            height: cardH,
            transform: `translate(${fgX.toFixed(1)}px, ${fgY.toFixed(1)}px) scale(${fgSc.toFixed(4)})`,
            borderRadius: fgRadius,
            overflow: "hidden",
            // A large, soft floating shadow so the crisp photo clearly sits ABOVE its wash.
            boxShadow: `0 ${px(44)}px ${px(96)}px rgba(0,0,0,0.5), 0 ${px(16)}px ${px(40)}px rgba(0,0,0,0.4), 0 ${px(4)}px ${px(10)}px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.07)`,
          }}
        >
          <Img
            src={clip.url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: fgBlur > 0.2 ? `${theme.grade} blur(${fgBlur.toFixed(2)}px)` : theme.grade,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const LayeredParallax: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const main = Math.max(width, height);
  const px = (v: number) => v * (main / 1920);
  const n = clips.length;

  // A short lead-in shifts the whole timeline so the first photo can condense in over INTRO frames.
  const t = Math.max(0, frame - INTRO);
  const rawC = Math.floor(t / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = t - c * CYCLE;
  const inTrans = !isLast && local > HOLD;
  const transFrac = inTrans
    ? interpolate(local, [HOLD, CYCLE], [0, 1], { ...clamp, easing: EASE })
    : 0;

  const BLUR = px(9); // how far the photo blurs when condensing out of / melting into its wash

  // The held/outgoing (current) photo.
  let curBgOp: number;
  let curFgOp: number;
  let curScale: number;
  let curBlur: number;
  if (inTrans) {
    // Melts back into its wash: the photo leaves first (fg fades + blurs up), the colour lingers.
    curFgOp = interpolate(transFrac, [0, 0.72], [1, 0], clamp);
    curBgOp = interpolate(transFrac, [0.3, 1], [1, 0], clamp);
    curScale = lerp(1, 1.05, transFrac);
    curBlur = lerp(0, px(6), transFrac);
  } else {
    // Holding — with the first photo condensing in over the intro.
    const intro = c === 0 ? interpolate(frame, [0, INTRO], [0, 1], { ...clamp, easing: EASE }) : 1;
    curBgOp = intro;
    curFgOp = intro;
    curScale = lerp(0.985, 1, intro);
    curBlur = lerp(BLUR, 0, intro);
  }

  const common = { theme, width, height, px, seed };

  return (
    <AbsoluteFill style={{ background: theme.background, overflow: "hidden" }}>
      <Slide
        {...common}
        clip={clips[c]}
        i={c}
        u01={(t - c * CYCLE) / CYCLE}
        bgOpacity={curBgOp}
        fgOpacity={curFgOp}
        fgScale={curScale}
        fgBlur={curBlur}
      />
      {/* The incoming photo — its wash LEADS (the room re-colors), then the crisp photo condenses out of it. */}
      {inTrans && clips[c + 1] ? (
        <Slide
          {...common}
          clip={clips[c + 1]}
          i={c + 1}
          u01={(t - (c + 1) * CYCLE) / CYCLE}
          bgOpacity={interpolate(transFrac, [0, 0.62], [0, 1], clamp)}
          fgOpacity={interpolate(transFrac, [0.3, 1], [0, 1], clamp)}
          fgScale={lerp(0.95, 1, transFrac)}
          fgBlur={lerp(BLUR, 0, transFrac)}
        />
      ) : null}
    </AbsoluteFill>
  );
};
