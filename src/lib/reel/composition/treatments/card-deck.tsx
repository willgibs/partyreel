import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../reel-types";
import { seeded, seededRange } from "../seed";

// A COMPOSITIONAL treatment: the photos as a fanned deck of cards. The top card holds, then flicks away
// (seeded direction, spring-snappy) to reveal the next, while the cards behind promote one depth. Snappy +
// social. Deterministic + inline (WYSIWYG in Lambda). NO text. Honors theme.grade.

const HOLD = 30;
const SWIPE = 15;
const CYCLE = HOLD + SWIPE;
const TAIL = 30;
const STACK = 3; // how many cards behind the top are visible

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export function cardDeckDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

type Pose = { scale: number; ty: number; opacity: number; rotate: number };

// A behind-the-top card at a given stack depth (0 = top). Each card keeps a small seeded base tilt so the
// deck looks hand-set; deeper cards shrink + sink + dim.
function pose(depth: number, baseTilt: number): Pose {
  return {
    scale: 1 - depth * 0.05,
    ty: depth * 20,
    opacity: depth >= STACK + 1 ? 0 : 1 - depth * 0.16,
    rotate: baseTilt + depth * baseTilt * 0.6,
  };
}

export const CardDeck: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const n = clips.length;
  const cardW = width * 0.66;
  const cardH = cardW * 1.34;

  const rawC = Math.floor(frame / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = frame - c * CYCLE;
  const inSwipe = !isLast && local > HOLD;
  const frac = inSwipe
    ? interpolate(local, [HOLD, CYCLE], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_OUT,
      })
    : 0;

  // Render the active card + the visible stack behind it (back-to-front so z-order is correct).
  const visible: number[] = [];
  for (let i = Math.min(c + STACK, n - 1); i >= c; i--) visible.push(i);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 100% at 50% 30%, #232228 0%, #131217 70%)",
      }}
    >
      {visible.map((i) => {
        const depth = i - c;
        const baseTilt = seededRange(seed, i, 1, -3.5, 3.5);
        const dir = seeded(seed, i, 2) > 0.5 ? 1 : -1;

        let t: Pose;
        let extraOpacity = 1;
        let tx = 0;
        if (depth === 0 && inSwipe) {
          // The top card flies off.
          t = {
            scale: interpolate(frac, [0, 1], [1, 1.06]),
            ty: interpolate(frac, [0, 1], [0, -height * 0.04]),
            opacity: 1,
            rotate: baseTilt + frac * dir * 16,
          };
          extraOpacity = interpolate(frac, [0.45, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          tx = frac * dir * width * 1.25;
        } else if (depth === 0) {
          t = pose(0, baseTilt);
        } else {
          // Behind cards promote from depth → depth-1 as the top card leaves.
          const from = pose(depth, baseTilt);
          const to = pose(depth - 1, baseTilt);
          t = {
            scale: interpolate(frac, [0, 1], [from.scale, to.scale]),
            ty: interpolate(frac, [0, 1], [from.ty, to.ty]),
            opacity: interpolate(frac, [0, 1], [from.opacity, to.opacity]),
            rotate: interpolate(frac, [0, 1], [from.rotate, to.rotate]),
          };
        }

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width / 2 - cardW / 2,
              top: height / 2 - cardH / 2,
              width: cardW,
              height: cardH,
              opacity: t.opacity * extraOpacity,
              zIndex: 100 - depth,
              transformOrigin: "center 70%",
              transform: `translate(${tx}px, ${t.ty}px) rotate(${t.rotate}deg) scale(${t.scale})`,
              borderRadius: 28,
              overflow: "hidden",
              background: "#0a0a0a",
              border: "5px solid rgba(255,255,255,0.92)",
              boxShadow:
                "0 30px 60px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.4)",
            }}
          >
            {clips[i].url ? (
              <Img
                src={clips[i].url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: theme.grade,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
