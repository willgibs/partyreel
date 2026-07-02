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

// A COMPOSITIONAL treatment: each photo lands as a physical instant PRINT tossed onto a GROWING heap on a
// warm, dimly-lit table. This is the deliberate ADDITIVE twin of the Card deck: where the deck DEALS DOWN
// (pulls the top card off, thinning the deck to a single card), the Polaroid PILES UP — every print stays,
// the heap accumulates + builds toward the camera, and the reel ends on a full, abundant pile of memories.
// SIGNATURE: each print DEVELOPS in — it lands dark, desaturated + soft and resolves to a full image over ~1s,
// the way an instant photo appears (the deck has nothing like it). Warm/nostalgic, hand-tossed (jaunty angles,
// a landing flex), the classic thick white bottom-chin border — vs the deck's cool, neat, glossy uniform cards.
// Sized to the min frame dimension so it works in both orientations. Deterministic (seeded) + inline (WYSIWYG
// in Lambda). NO text. Honors theme.grade on the photo only.

const DROP_INTERVAL = 22; // a lively build (prints keep landing while earlier ones still develop)
const TAIL = 46; // hold on the full, settled heap

export function polaroidStackDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, n * DROP_INTERVAL + TAIL);
}

type Spot = { x: number; y: number; rot: number };

// Where a print settles in the heap. The footprint GROWS with the build (sqrt so it's a tight overlapping pile,
// not a wide scatter — that's Scattered prints' job), and newer prints sit a touch higher so the pile visibly
// builds UP toward the camera. A seeded angle + jitter keeps it hand-tossed.
function pileSpot(i: number, n: number, seed: number, base: number): Spot {
  const t = n > 1 ? i / (n - 1) : 0; // 0..1 build progress
  const spread = base * (0.015 + 0.055 * Math.sqrt(t));
  const ang = seededRange(seed, i, 20, 0, Math.PI * 2);
  const x = Math.cos(ang) * spread + seededRange(seed, i, 2, -0.03, 0.03) * base;
  const y =
    Math.sin(ang) * spread * 0.66 +
    seededRange(seed, i, 3, -0.03, 0.03) * base -
    t * base * 0.05; // the heap grows upward as it accumulates
  return { x, y, rot: seededRange(seed, i, 1, -11, 11) };
}

export const PolaroidStack: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const base = Math.min(width, height);
  const n = clips.length;
  const cardW = base * 0.5;
  const borderSide = cardW * 0.045;
  const borderBottom = cardW * 0.16; // the classic thick Polaroid chin (the tell vs the deck's slim border)
  const photo = cardW - borderSide * 2;
  const cardH = photo + borderSide + borderBottom;

  const prints = clips.map((clip, i) => {
    const dropStart = i * DROP_INTERVAL;
    if (frame < dropStart) return null;
    const local = frame - dropStart;
    const t = n > 1 ? i / (n - 1) : 0;

    const p = spring({
      frame: local,
      fps,
      config: { damping: 14, stiffness: 110, mass: 0.8 },
    });

    const spot = pileSpot(i, n, seed, base);
    // The pile builds toward the camera: newer prints a touch bigger, so the freshest memory sits biggest on top.
    const sizeF = 1 + t * 0.06;

    // Toss variety: ~40% slide in from a side, the rest drop from above; each carries a little extra spin.
    const slideIn = seeded(seed, i, 7) > 0.6;
    const dir = seeded(seed, i, 8) > 0.5 ? 1 : -1;
    const fromRot = spot.rot + (slideIn ? dir * 14 : seeded(seed, i, 4) > 0.5 ? 22 : -22);
    const fromX = slideIn ? dir * width * 0.9 : 0;
    const fromY = slideIn ? -height * 0.12 : -height * 1.2;

    const tx = interpolate(p, [0, 1], [fromX, spot.x]);
    const ty = interpolate(p, [0, 1], [fromY, spot.y]);
    const rot = interpolate(p, [0, 1], [fromRot, spot.rot]);
    const sc = interpolate(p, [0, 1], [1.12, 1]) * sizeF;
    const op = interpolate(p, [0, 0.22], [0, 1], { extrapolateRight: "clamp" });

    // A tactile landing flex as the print slaps onto the pile (a brief scaleY dip on contact).
    const land = Math.max(0, 1 - Math.abs(p - 0.82) / 0.1);
    const squashY = 1 - land * 0.05;

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

    // A chunky WARM grounded shadow — prints higher in the heap sit on more, so cast a little deeper. This
    // stacked depth is what makes the pile read as a real physical heap building up.
    const zLift = 0.45 + 0.55 * t;
    const shadow = [
      `0 ${(base * 0.004).toFixed(1)}px ${(base * 0.006).toFixed(1)}px rgba(24,14,6,0.5)`,
      `0 ${(base * 0.012 * zLift).toFixed(1)}px ${(base * 0.02 * zLift).toFixed(1)}px rgba(26,15,7,0.4)`,
      `0 ${(base * 0.03 * zLift).toFixed(1)}px ${(base * 0.05 * zLift).toFixed(1)}px rgba(22,12,5,0.34)`,
      "inset 0 1px 0 rgba(255,255,255,0.7)",
    ].join(", ");

    const left = (width - cardW) / 2;
    const top = (height - cardH) / 2;

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
          transformOrigin: "center 62%",
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)}) scaleY(${squashY.toFixed(4)})`,
          background: "linear-gradient(160deg, #fdfbf6 0%, #f7f3ea 100%)",
          borderRadius: 6,
          padding: `${borderSide}px ${borderSide}px ${borderBottom}px`,
          boxShadow: shadow,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "#141210",
            boxShadow: "inset 0 0 0 1px rgba(30,20,10,0.14), inset 0 2px 5px rgba(20,12,6,0.28)",
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
        // A warm, dim, intimate tabletop (nostalgic) — deliberately warmer than the Card deck's cool charcoal.
        background: "radial-gradient(120% 92% at 50% 44%, #241c14 0%, #17110b 46%, #0c0806 100%)",
      }}
    >
      {/* A soft warm key pooled where the heap builds (gentler + warmer than the deck's crisp dealer's lamp). */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(58% 46% at 50% 40%, rgba(255,232,196,0.14) 0%, rgba(255,226,184,0.05) 44%, transparent 68%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {prints}
      {/* A quiet warm vignette that cradles the pile. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 82% at 50% 46%, transparent 58%, rgba(10,6,3,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
