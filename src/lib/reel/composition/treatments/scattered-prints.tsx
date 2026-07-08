import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../../engine/reel-types";
import { seeded, seededPick, seededRange } from "../../engine/seed";

// A COMPOSITIONAL treatment: the guest's photos as physical lab PRINTS laid out into a premium editorial
// flat-lay on a warm, softly-lit lightbox — placed by a seeded GOLDEN-ANGLE field (organized randomness,
// never a grid), each a warm-paper mat (asymmetric, heavier bottom chin) with a recessed glossy photo + a
// 4-layer WARM grounded shadow that glues it to the surface. SIGNATURE: after the flat-lay assembles, the
// HERO print (the last one, near center) RISES off the pile toward the camera — growing, straightening to
// level, its shadow detaching + spreading (real lifting-paper physics) while the rest of the board dims +
// recedes. "The whole album spreads, then one memory rises to meet you." Works portrait + landscape from one
// core; deterministic (seeded) + inline (WYSIWYG in Lambda). NO text. Honors theme.grade on the photo only.

const SETTLE = 26;
const HERO_BEAT = 10;
const LIFT = 40;
const OUTRO = 40;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const MOUNTS = ["#f7f2e9", "#f3ede2", "#efe9dd", "#fcfbf8"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// Frames between print landings — eased down as the pile grows so a big flat-lay still completes in time.
function dropInterval(n: number): number {
  return Math.round(lerp(18, 12, clamp01((n - 6) / 8)));
}

export function scatteredPrintsDuration(props: ReelProps): number {
  const n = props.clips.length;
  const di = dropInterval(n);
  return Math.max(1, (n - 1) * di + SETTLE + HERO_BEAT + LIFT + OUTRO);
}

type Spot = { cx: number; cy: number; rot: number };

// Seeded golden-angle (phyllotaxis) placement — fills the frame yet reads hand-laid. The hero (last print)
// is reserved a near-center, near-level slot. Small counts get bespoke, intentional layouts.
function place(i: number, n: number, seed: number, landscape: boolean): Spot {
  const isHero = i === n - 1;
  if (n === 1) return { cx: 0.5, cy: 0.46, rot: seededRange(seed, 0, 1, -3, 3) };
  if (n === 2) {
    return i === 0
      ? { cx: 0.4, cy: 0.56, rot: 5 }
      : { cx: 0.58, cy: 0.42, rot: -3 };
  }
  if (isHero) return { cx: 0.5, cy: 0.46, rot: seededRange(seed, i, 1, -3, 3) };

  const aspectX = landscape ? 1.3 : 1.0;
  const aspectY = landscape ? 1.0 : 1.06;
  const angle = i * 2.39996 + seededRange(seed, i, 20, -0.5, 0.5);
  const rNorm = 0.1 + 0.4 * Math.sqrt(i / n);
  const r = rNorm * seededRange(seed, i, 22, 0.86, 1.14);
  const cx = clamp(
    0.5 + r * Math.cos(angle) * aspectX + seededRange(seed, i, 11, -0.045, 0.045),
    0.1,
    0.9,
  );
  const cy = clamp(
    0.5 + r * Math.sin(angle) * aspectY + seededRange(seed, i, 12, -0.045, 0.045),
    0.1,
    0.9,
  );
  return { cx, cy, rot: seededRange(seed, i, 1, -11, 11) };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// The 4-layer warm grounded shadow. settleP 0→1 = mid-air→landed (the CONTACT layer tightens on touch);
// lift 0→1 = hero rising (the cast grows + softens while contact detaches — real lifting-paper physics).
function groundShadow(ps: number, settleP: number, lift: number, depthJ: number): string {
  const offX = ps * 0.01;
  const contactBlur = lerp(ps * 0.16, ps * 0.006, settleP);
  const contactA = lerp(0.3, 0.05, lift);
  const ease = 0.6 + 0.4 * settleP; // cast layers ease in with the settle
  const grow = 1 + lift * 1.3; // ~2.3x at full lift
  const layers = [
    `0 ${ps * 0.004}px ${contactBlur.toFixed(2)}px rgba(46,30,12,${contactA.toFixed(3)})`,
    `${offX.toFixed(2)}px ${(ps * 0.016 * ease).toFixed(2)}px ${(ps * 0.026 * ease).toFixed(2)}px rgba(50,32,12,0.22)`,
    `${offX.toFixed(2)}px ${(ps * 0.034 * ease * grow).toFixed(2)}px ${(ps * 0.054 * ease * grow).toFixed(2)}px rgba(52,32,10,${(0.2 * depthJ).toFixed(3)})`,
    `${offX.toFixed(2)}px ${(ps * 0.06 * ease * grow).toFixed(2)}px ${(ps * 0.1 * ease * grow).toFixed(2)}px rgba(48,30,10,${(0.18 * depthJ).toFixed(3)})`,
  ];
  if (lift > 0.001) {
    layers.push(
      `${offX.toFixed(2)}px ${(ps * 0.16 * lift).toFixed(2)}px ${(ps * 0.24 * lift).toFixed(2)}px rgba(40,26,8,${(0.16 * lift).toFixed(3)})`,
    );
  }
  // The milled-paper bevel (cut edge catching the upper-left key).
  layers.push("inset 0 1px 0 rgba(255,255,255,0.55)", "inset 0 -1px 0 rgba(74,52,28,0.12)");
  return layers.join(", ");
}

const Print: React.FC<{
  clip: ReelProps["clips"][number];
  theme: ReelProps["theme"];
  seed: number;
  i: number;
  n: number;
  base: number;
  width: number;
  height: number;
  landscape: boolean;
  isHero: boolean;
  frame: number;
  fps: number;
  buildStart: number; // frame this print starts dropping
  lift: number; // hero lift progress (0 for non-hero)
  anticip?: number; // hero wind-up press just before the lift (0 for non-hero)
}> = ({ clip, theme, seed, i, n, base, width, height, landscape, isHero, frame, fps, buildStart, lift, anticip = 0 }) => {
  if (frame < buildStart) return null;
  const p = spring({ frame: frame - buildStart, fps, config: { damping: 17, stiffness: 140, mass: 0.8 } });

  const spot = place(i, n, seed, landscape);
  const sizeMax = lerp(0.4, 0.32, clamp01((n - 6) / 8));
  const sizeFrac = isHero ? sizeMax + 0.04 : seededRange(seed, i, 5, 0.21, sizeMax);
  const printShort = base * sizeFrac;

  const aspect =
    clip.width && clip.height
      ? clamp(clip.width / clip.height, 0.72, 1.4)
      : seededPick(seed, i, 23, [4 / 5, 1, 5 / 4]);
  const wide = aspect >= 1;
  const photoW = wide ? printShort * aspect : printShort;
  const photoH = wide ? printShort : printShort / aspect;
  const side = printShort * 0.052;
  const bottom = printShort * 0.09;
  const mountW = photoW + side * 2;
  const mountH = photoH + side + bottom;

  // Entry: a controlled toss — fall from just above (or a short edge slide), overshoot, settle.
  const slide = seeded(seed, i, 7) > 0.7 && !isHero;
  const dir = seeded(seed, i, 8) > 0.5 ? 1 : -1;
  const fromRot = spot.rot + (seeded(seed, i, 4) > 0.5 ? 12 : -12);
  const fromX = slide ? dir * base * 0.1 : 0;
  const fromY = slide ? -base * 0.12 : -base * 0.42;
  const txEntry = interpolate(p, [0, 1], [fromX, 0]);
  const tyEntry = interpolate(p, [0, 1], [fromY, 0]);
  const scEntry = interpolate(p, [0, 1], [1.1, 1]);
  const rotEntry = interpolate(p, [0, 1], [fromRot, spot.rot]);
  const op = interpolate(p, [0, 0.18], [0, 1], { extrapolateRight: "clamp" });

  // A tactile landing squash — the weight of paper hitting the surface (a brief scaleY dip on contact).
  const land = Math.max(0, 1 - Math.abs(p - 0.86) / 0.08);
  const squash = 1 - land * 0.016;

  // Hero lift stacks on the settled entry: a wind-up press, then rise + grow + straighten + nudge to center.
  const heroScale = landscape ? 1.14 : 1.18;
  const tx = txEntry + (0.5 * width - spot.cx * width) * 0.4 * lift;
  const ty = tyEntry - base * 0.05 * lift + base * 0.012 * anticip;
  const sc = scEntry * lerp(1, heroScale, lift) * (1 - 0.02 * anticip);
  const rot = lerp(rotEntry, 0, lift);

  const depthJ = seededRange(seed, i, 22, 0.86, 1.14);
  const shadow = groundShadow(printShort, p, lift, depthJ);

  const glossTop = lerp(0.16, 0.22, lift);
  // The highlight sweeps a touch as the hero tips toward the lens.
  const glossAngle = 122 + seededRange(seed, i, 25, -8, 8) + lift * 8;
  const recess = `inset 0 0 0 1px rgba(46,30,12,0.07), inset 0 ${lift > 0.5 ? "2px 5px" : "1px 3px"} rgba(40,26,10,${(0.16 + 0.04 * lift).toFixed(3)})`;

  return (
    <div
      style={{
        position: "absolute",
        left: spot.cx * width - mountW / 2,
        top: spot.cy * height - mountH / 2,
        width: mountW,
        height: mountH,
        opacity: op,
        zIndex: isHero ? 999 : i,
        transformOrigin: "center",
        transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc}) scaleY(${squash})`,
        background: seededPick(seed, i, 21, MOUNTS),
        borderRadius: 3,
        padding: `${side}px ${side}px ${bottom}px`,
        boxShadow: shadow,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 1,
          background: "#181410",
          boxShadow: recess,
        }}
      >
        {clip.url ? (
          <Img
            src={clip.url}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: theme.grade }}
          />
        ) : null}
        {/* Semi-gloss sheen on the emulsion only (matte paper, glossy photo). */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(${glossAngle.toFixed(1)}deg, rgba(255,255,255,${glossTop.toFixed(3)}) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.06) 88%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

export const ScatteredPrints: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const landscape = width > height;
  const base = Math.min(width, height);
  const n = clips.length;
  const di = dropInterval(n);

  const buildEnd = (n - 1) * di + SETTLE;
  const lift = interpolate(frame, [buildEnd + HERO_BEAT, buildEnd + HERO_BEAT + LIFT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  // A whisper of life on the held hero so the final frame isn't dead-still — but ONLY after the lift fully
  // settles, eased in from zero amplitude AND zero phase, so it never pops/bounces as it finds its place.
  const liftEnd = buildEnd + HERO_BEAT + LIFT;
  const floatAmp = interpolate(frame, [liftEnd + 4, liftEnd + 20], [0, base * 0.003], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const heroFloat = Math.sin((frame - liftEnd) * 0.08) * floatAmp;

  // The hero winds up (a brief press) over the beat just before it releases into the lift.
  const antP = interpolate(frame, [buildEnd, buildEnd + HERO_BEAT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const heroPress = antP * (1 - lift);

  // The board (every non-hero print) dims + recedes + softens as the hero rises (rack-focus depth cue).
  const boardDim = lerp(1, 0.92, lift);
  const boardScale = lerp(1, 0.985, lift);
  const boardBlur = lift * base * 0.0026;

  const heroIndex = n - 1;
  const common = { theme, seed, n, base, width, height, landscape, frame, fps };

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(135% 105% at 50% 34%, #efe9df 0%, #e3dbcd 46%, #d2c5b0 100%)",
      }}
    >
      {/* Warm key-light pool the gloss + shadows agree with. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 38% 28%, rgba(255,247,232,0.55) 0%, rgba(255,247,232,0) 50%)",
          pointerEvents: "none",
        }}
      />

      {/* The board of non-hero prints (dims + recedes on the hero lift). */}
      <AbsoluteFill
        style={{
          filter: `brightness(${boardDim.toFixed(3)})${boardBlur > 0.15 ? ` blur(${boardBlur.toFixed(2)}px)` : ""}`,
          transform: `scale(${boardScale})`,
          transformOrigin: "center",
        }}
      >
        {clips.map((clip, i) =>
          i === heroIndex ? null : (
            <Print
              key={i}
              {...common}
              clip={clip}
              i={i}
              isHero={false}
              buildStart={i * di}
              lift={0}
            />
          ),
        )}
      </AbsoluteFill>

      {/* The hero, rendered separately at top z so only it lifts. */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${heroFloat}px)` }}>
        <Print
          {...common}
          clip={clips[heroIndex]}
          i={heroIndex}
          isHero
          buildStart={heroIndex * di}
          lift={lift}
          anticip={heroPress}
        />
      </div>

      {/* A whisper of paper/linen tooth across the whole scene (prints included). */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(96deg, rgba(120,96,60,0.018) 0 2px, transparent 2px 5px), repeating-linear-gradient(6deg, rgba(120,96,60,0.012) 0 2px, transparent 2px 5px)",
          mixBlendMode: "soft-light",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      {/* A minimal warm vignette that centers the eye + deepens a hair on the lift. */}
      <AbsoluteFill
        style={{
          background: landscape
            ? `radial-gradient(ellipse 88% 60% at 50% 46%, transparent 56%, rgba(70,50,28,${(0.1 + 0.04 * lift).toFixed(3)}) 100%)`
            : `radial-gradient(ellipse 72% 78% at 50% 46%, transparent 56%, rgba(70,50,28,${(0.16 + 0.05 * lift).toFixed(3)}) 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
