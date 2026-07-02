import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../reel-types";
import { seeded, seededRange } from "../seed";

// A COMPOSITIONAL treatment: each photo lands as a physical Polaroid print, tossed onto a growing pile with
// spring physics + a seeded resting angle. SIGNATURE: each print DEVELOPS in — it lands dark, desaturated +
// soft and resolves to a full image over ~1s, the way an instant photo appears. Some prints drop from above,
// some slide in from a side (variety). Sized to the min frame dimension so it works in both orientations.
// Deterministic (seeded) + inline (WYSIWYG in Lambda). NO text.

const DROP_INTERVAL = 30;
const TAIL = 44;

export function polaroidStackDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, n * DROP_INTERVAL + TAIL);
}

export const PolaroidStack: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const base = Math.min(width, height);
  const cardW = base * 0.6;
  const borderSide = cardW * 0.04;
  const borderBottom = cardW * 0.14;
  const photo = cardW - borderSide * 2;
  const cardH = photo + borderSide + borderBottom;

  const prints = clips.map((clip, i) => {
    const dropStart = i * DROP_INTERVAL;
    if (frame < dropStart) return null;
    const local = frame - dropStart;

    const p = spring({
      frame: local,
      fps,
      config: { damping: 14, stiffness: 110, mass: 0.8 },
    });

    const restX = seededRange(seed, i, 2, -0.06, 0.06) * base;
    const restY = seededRange(seed, i, 3, -0.05, 0.05) * base;
    const restRot = seededRange(seed, i, 1, -8, 8);

    // Toss variety: ~40% slide in from a side, the rest drop from above; each carries a little extra spin.
    const slideIn = seeded(seed, i, 7) > 0.6;
    const dir = seeded(seed, i, 8) > 0.5 ? 1 : -1;
    const fromRot =
      restRot + (slideIn ? dir * 14 : seeded(seed, i, 4) > 0.5 ? 22 : -22);
    const fromX = slideIn ? dir * width * 0.9 : 0;
    const fromY = slideIn ? -height * 0.12 : -height * 1.25;

    const tx = interpolate(p, [0, 1], [fromX, 0]);
    const ty = interpolate(p, [0, 1], [fromY, 0]);
    const rot = interpolate(p, [0, 1], [fromRot, restRot]);
    const sc = interpolate(p, [0, 1], [1.12, 1]);
    const op = interpolate(p, [0, 0.22], [0, 1], { extrapolateRight: "clamp" });

    // SIGNATURE — develop-in: lands dark + desaturated + soft, resolves to full over ~1.1s.
    const dev = interpolate(local, [8, 8 + fps * 1.1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const developFilter = `${theme.grade} brightness(${(0.34 + dev * 0.66).toFixed(3)}) saturate(${(0.18 + dev * 0.82).toFixed(3)}) contrast(${(0.82 + dev * 0.18).toFixed(3)}) blur(${((1 - dev) * 3).toFixed(2)}px)`;

    // A whisper of Ken-Burns inside the print so the settled pile still breathes.
    const kb = interpolate(local, [0, DROP_INTERVAL * 3], [1.02, 1.06], {
      extrapolateRight: "clamp",
    });

    const left = (width - cardW) / 2 + restX;
    const top = (height - cardH) / 2 + restY;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left,
          top,
          width: cardW,
          height: cardH,
          zIndex: i,
          opacity: op,
          transformOrigin: "center",
          transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`,
          background: "#fbfaf6",
          borderRadius: 6,
          padding: `${borderSide}px ${borderSide}px ${borderBottom}px`,
          boxShadow: "0 22px 48px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "#141210",
          }}
        >
          {clip.url ? (
            <Img
              src={clip.url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: developFilter,
                scale: String(kb),
              }}
            />
          ) : null}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 90% at 50% 40%, #1c1a17 0%, #0b0a09 70%)",
      }}
    >
      {prints}
    </AbsoluteFill>
  );
};
