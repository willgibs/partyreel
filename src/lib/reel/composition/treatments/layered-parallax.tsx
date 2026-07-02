import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelClip, ReelProps, ReelTheme } from "../reel-types";
import { seeded } from "../seed";

// A COMPOSITIONAL treatment: each photo becomes an immersive full-frame MOMENT — a huge, soft, color-bleeding
// BLURRED copy of ITSELF washes the entire frame (the far plane) while the crisp photo floats in front (the
// near plane). The two drift at DIFFERENT rates (a slow Ken-Burns each, opposed) → real parallax depth, and
// each memory dissolves into the next in a smooth cinematic SWAP where the whole ambient colour morphs.
// SIGNATURE: "each memory fills the room with its own colour" — because the wash is a blur of the same photo,
// a wave shot floods the frame aqua, a sunset floods it gold; the crossfade morphs that colour as it swaps.
// Pure media (no surface, no object) — distinct from the physical-object treatments AND the flat moods. It
// also solves mismatched aspects natively: the floating photo is NEVER cropped or letterboxed — its own
// blurred wash fills whatever margin the frame leaves. Orientation-agnostic (the wash always covers; the
// float sizes to the photo). Deterministic (seeded) + inline (WYSIWYG in Lambda). NO text. Honors theme.grade.

const HOLD = 44; // frames a photo holds (~1.8s at 24fps)
const TRANS = 20; // the crossfade swap (~0.8s)
const CYCLE = HOLD + TRANS;
const TAIL = 28;

const EASE = Easing.bezier(0.4, 0, 0.2, 1); // a smooth cinematic crossfade

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function layeredParallaxDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

// One immersive slide: the blurred self-wash (far) + the floating crisp photo (near), each with its own slow
// Ken-Burns so they part into parallax. u01 = the slide's life progress (drives the drift, continuous across
// the swap so nothing jumps). opacity / extraScale / extraBlur carry the enter/exit of the crossfade.
const Slide: React.FC<{
  clip: ReelClip;
  theme: ReelTheme;
  width: number;
  height: number;
  px: (v: number) => number;
  seed: number;
  i: number;
  u01: number;
  opacity: number;
  extraScale: number;
  extraBlur: number;
}> = ({ clip, theme, width, height, px, seed, i, u01, opacity, extraScale, extraBlur }) => {
  if (!clip.url) {
    return <AbsoluteFill style={{ opacity, background: theme.background }} />;
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

  const bgScale = lerp(1.16, 1.32, u01) * (1 + (extraScale - 1) * 0.45);
  const bgX = dir * d * width * 0.06;
  const bgY = dirY * d * height * 0.04;

  const fgScale = lerp(1.0, 1.05, u01) * extraScale;
  const fgX = -dir * d * width * 0.022;
  const fgY = -dirY * d * height * 0.016;
  const fgRadius = Math.min(cardW, cardH) * 0.045;

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* FAR plane — the blurred, colour-bleeding wash of the same photo. */}
      <Img
        src={clip.url}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `${theme.grade} blur(${px(46).toFixed(1)}px) brightness(0.6) saturate(1.28)`,
          transform: `translate(${bgX.toFixed(1)}px, ${bgY.toFixed(1)}px) scale(${bgScale.toFixed(4)})`,
        }}
      />
      {/* A vignette + a soft top-down darken so the float reads against its own wash. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 92% 84% at 50% 48%, transparent 40%, rgba(0,0,0,0.5) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* A soft key glow lifting the float off the wash. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(46% 38% at 50% 46%, rgba(255,252,246,0.07) 0%, transparent 70%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {/* NEAR plane — the crisp photo floating in front (parallaxing slower than its wash). */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
        <div
          style={{
            width: cardW,
            height: cardH,
            transform: `translate(${fgX.toFixed(1)}px, ${fgY.toFixed(1)}px) scale(${fgScale.toFixed(4)})`,
            borderRadius: fgRadius,
            overflow: "hidden",
            boxShadow: `0 ${px(30)}px ${px(72)}px rgba(0,0,0,0.52), 0 ${px(8)}px ${px(22)}px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)`,
          }}
        >
          <Img
            src={clip.url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: extraBlur > 0.2 ? `${theme.grade} blur(${extraBlur.toFixed(2)}px)` : theme.grade,
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

  const rawC = Math.floor(frame / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = frame - c * CYCLE;
  const inTrans = !isLast && local > HOLD;
  const transFrac = inTrans
    ? interpolate(local, [HOLD, CYCLE], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      })
    : 0;

  // A whisper of blur on both slides during the crossfade masks the dissolve (the two states read as one
  // smooth morph, not two photos swapping) — the emil blur-to-mask move.
  const blurMask = inTrans ? Math.sin(transFrac * Math.PI) * px(5) : 0;

  const common = { theme, width, height, px, seed };

  return (
    <AbsoluteFill style={{ background: theme.background, overflow: "hidden" }}>
      {/* The outgoing (or held) photo — during the swap it eases forward + dissolves. */}
      <Slide
        {...common}
        clip={clips[c]}
        i={c}
        u01={(frame - c * CYCLE) / CYCLE}
        opacity={inTrans ? 1 - transFrac : 1}
        extraScale={inTrans ? lerp(1, 1.06, transFrac) : 1}
        extraBlur={blurMask}
      />
      {/* The incoming photo — rises from slightly back into focus as its wash fades in. */}
      {inTrans && clips[c + 1] ? (
        <Slide
          {...common}
          clip={clips[c + 1]}
          i={c + 1}
          u01={(frame - (c + 1) * CYCLE) / CYCLE}
          opacity={transFrac}
          extraScale={lerp(0.95, 1, transFrac)}
          extraBlur={blurMask}
        />
      ) : null}
    </AbsoluteFill>
  );
};
