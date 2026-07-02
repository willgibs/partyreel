import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelClip, ReelProps, ReelTheme } from "../reel-types";

// A COMPOSITIONAL treatment: each photo as TWO depth planes — a big blurred copy of itself filling the
// frame (the far plane) and a crisp framed card floating in front (the near plane). They push at different
// rates → real parallax depth, and clips swap with a 3D card push. The most cinematic of the set (less
// "object," more "camera"). Deterministic + inline (WYSIWYG in Lambda). NO text. Honors theme.grade.

const HOLD = 32;
const TRANS = 18;
const CYCLE = HOLD + TRANS;
const TAIL = 30;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function layeredParallaxDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

const Plane: React.FC<{
  clip: ReelClip;
  theme: ReelTheme;
  width: number;
  height: number;
  bgScale: number;
  cardScale: number;
  rotateY: number;
  opacity: number;
}> = ({ clip, theme, width, height, bgScale, cardScale, rotateY, opacity }) => {
  if (!clip.url) return null;
  const cardW = width * 0.82;
  const cardH = height * 0.62;
  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Far plane: the same photo, scaled up + blurred. */}
      <Img
        src={clip.url}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `${theme.grade} blur(34px) brightness(0.5)`,
          transform: `scale(${bgScale})`,
        }}
      />
      {/* Near plane: the crisp framed subject. */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: cardW,
            height: cardH,
            transform: `perspective(1500px) rotateY(${rotateY}deg) scale(${cardScale})`,
            transformOrigin: "center",
            borderRadius: 20,
            overflow: "hidden",
            background: "#0a0a0a",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.45)",
          }}
        >
          <Img
            src={clip.url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: theme.grade,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const LayeredParallax: React.FC<ReelProps> = ({ clips, theme }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

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

  // The current clip's parallax push (near plane slower than far plane).
  const pushP = interpolate(local, [0, HOLD + TRANS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curBgScale = interpolate(pushP, [0, 1], [1.12, 1.24]);
  const curCardScale = inTrans
    ? interpolate(transFrac, [0, 1], [1.05, 0.84])
    : interpolate(pushP, [0, 1], [1.0, 1.05]);
  const curCardRotY = inTrans ? interpolate(transFrac, [0, 1], [0, -14]) : 0;
  const curOpacity = inTrans
    ? interpolate(transFrac, [0.35, 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill style={{ background: theme.background }}>
      <Plane
        clip={clips[c]}
        theme={theme}
        width={width}
        height={height}
        bgScale={curBgScale}
        cardScale={curCardScale}
        rotateY={curCardRotY}
        opacity={curOpacity}
      />
      {inTrans && clips[c + 1] ? (
        <Plane
          clip={clips[c + 1]}
          theme={theme}
          width={width}
          height={height}
          bgScale={interpolate(transFrac, [0, 1], [1.0, 1.12])}
          cardScale={interpolate(transFrac, [0, 1], [1.16, 1.0])}
          rotateY={interpolate(transFrac, [0, 1], [12, 0])}
          opacity={interpolate(transFrac, [0, 0.6], [0, 1], {
            extrapolateRight: "clamp",
          })}
        />
      ) : null}
    </AbsoluteFill>
  );
};
