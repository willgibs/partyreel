import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../reel-types";
import { seeded } from "../seed";

// A COMPOSITIONAL treatment: a 35mm film strip threaded through a projector gate. The strip advances
// INTERMITTENTLY (the authentic "hold, then pull" of a real movement, not a smooth scroll) so each frame
// registers at the lit gate, holds, then snaps to the next. The look is built to REAL Kodak-Standard (KS)
// geometry: 4 backlit rounded-rectangle perforations per frame (the gate lamp glows THROUGH the holes, not
// painted dots), a warm-neutral celluloid base with a convex cross-strip sheen + a tooth of static grain, a
// near-sharp gate window, and a steady warm lamp flicker. SIGNATURES: the intermittent pull-down (with a
// motion-blur) + the backlit gate lamp. Runs VERTICAL in portrait + HORIZONTAL in landscape from one core.
// Flat/straight-on (no tilt → always clean edges). Deterministic + inline (WYSIWYG in Lambda). NO text.

const HOLD = 30;
const ADVANCE = 12;
const CYCLE = HOLD + ADVANCE;
const TAIL = 26;
const PERFS = 4; // the classic 4-perf 35mm pull

const EASE_PULL = Easing.bezier(0.55, 0, 0.1, 1); // a mechanical film pull-down

// A faint, STATIC celluloid grain tooth (precomputed once; never animated → byte-stable WYSIWYG).
const GRAIN_IMAGE =
  "repeating-radial-gradient(circle at 50% 50%, rgba(255,250,240,0.5) 0 0.5px, transparent 0.6px)";

export function filmStripDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

function stripPosition(frame: number, n: number): number {
  const idx = Math.floor(frame / CYCLE);
  const local = frame - idx * CYCLE;
  const adv =
    local <= HOLD
      ? 0
      : interpolate(local, [HOLD, CYCLE], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_PULL,
        });
  return Math.min(idx + adv, n - 1);
}

export const FilmStrip: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const n = clips.length;
  const pos = stripPosition(frame, n);

  // Main = the scroll axis; cross = the strip's thickness axis.
  const main = landscape ? width : height;
  const cross = landscape ? height : width;
  const px = (v: number) => v * (main / 1080); // hold shadow/glow proportions at any render scale

  const stripCross = cross * 0.8;
  const cellMain = main * 0.52;
  const sprocket = stripCross * 0.14; // the celluloid rebate carrying the perfs
  const darkMask = stripCross * 0.03; // bare base between the perf rows + the image
  const photoCross = stripCross - sprocket * 2 - darkMask * 2;
  const photoMain = cellMain * 0.86; // leaves the inter-frame gutter of bare base
  const pitch = cellMain / PERFS;
  const perfShort = sprocket * 0.6; // across the margin
  const perfLong = Math.min(perfShort * 1.41, 0.46 * pitch); // KS 1.41:1, clamped to the pitch
  const perfRadius = Math.min(perfShort, perfLong) * 0.22; // crisp rounded rect, never a pill

  const offset = main / 2 - cellMain / 2 - pos * cellMain;
  const gateCenter = main / 2;

  // SIGNATURE — pull-down motion-blur during the ADVANCE tail (capped so held frames stay crisp).
  const localCyc = frame % CYCLE;
  const advancing = localCyc > HOLD && pos < n - 1;
  const blurAmt = advancing
    ? Math.sin(((localCyc - HOLD) / ADVANCE) * Math.PI) * main * 0.009
    : 0;

  // SIGNATURE — a steady warm gate-lamp breathe (shallow + slow, not a strobe).
  const flick = 0.92 + 0.08 * (0.5 + 0.5 * Math.sin(frame * 1.0 + seed));

  // Warm-neutral celluloid with a convex sheen ACROSS the thickness axis.
  const filmBase = `linear-gradient(${landscape ? "to bottom" : "to right"}, #120e0a 0%, #1f1810 20%, #261d14 50%, #1d160f 80%, #110d09 100%)`;

  const cells = clips.map((clip, i) => {
    const mainCoord = offset + i * cellMain;
    if (mainCoord > main + cellMain || mainCoord < -cellMain) return null;
    const cellW = landscape ? cellMain : stripCross;
    const cellH = landscape ? stripCross : cellMain;
    const left = landscape ? mainCoord : (width - stripCross) / 2;
    const top = landscape ? (height - stripCross) / 2 : mainCoord;
    const pw = landscape ? photoMain : photoCross;
    const ph = landscape ? photoCross : photoMain;

    // Two edges of 4 backlit KS perforations, evenly pitched along the cell's main axis. Each hole's bloom
    // varies a touch (seeded) + brightens as it passes the gate (tying the holes to the lamp).
    const perfs: React.ReactNode[] = [];
    for (let e = 0; e < 2; e++) {
      const nearOff = (sprocket - perfShort) / 2;
      const crossPos = e === 0 ? nearOff : stripCross - sprocket + nearOff;
      for (let k = 0; k < PERFS; k++) {
        const mp = ((k + 0.5) / PERFS) * cellMain;
        const distGate = Math.abs(mainCoord + mp - gateCenter);
        const gateBoost = Math.max(0, 0.12 * (1 - Math.min(1, distGate / (main * 0.3))));
        const variance = (seeded(seed, i * PERFS + k, e + 1) - 0.5) * 0.1;
        const glowA = Math.min(0.72, 0.45 + variance + gateBoost);
        const glowB = glowA * 0.44;
        const pStyle: React.CSSProperties = landscape
          ? { left: mp - perfLong / 2, top: crossPos, width: perfLong, height: perfShort }
          : { top: mp - perfLong / 2, left: crossPos, width: perfShort, height: perfLong };
        perfs.push(
          <div
            key={`${e}-${k}`}
            style={{
              position: "absolute",
              ...pStyle,
              borderRadius: perfRadius,
              background:
                "radial-gradient(75% 75% at 50% 45%, #fff7ea 0%, #f6ead2 50%, #e8d9bb 100%)",
              boxShadow: `inset 0 1px ${px(2)}px rgba(60,32,10,0.45), inset 0 -1px ${px(1)}px rgba(255,240,210,0.28), 0 0 ${px(5)}px ${px(0.5)}px rgba(255,236,190,${glowA.toFixed(3)}), 0 0 ${px(13)}px ${px(2)}px rgba(255,224,170,${glowB.toFixed(3)})`,
            }}
          />,
        );
      }
    }

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left,
          top,
          width: cellW,
          height: cellH,
          background: filmBase,
          borderRadius: px(1.5),
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,244,224,0.07), inset 0 0 ${px(20)}px rgba(0,0,0,0.45)`,
        }}
      >
        {perfs}
        <div
          style={{
            position: "absolute",
            left: (cellW - pw) / 2,
            top: (cellH - ph) / 2,
            width: pw,
            height: ph,
            overflow: "hidden",
            background: "#000",
            borderRadius: 2,
            boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,240,210,0.08), inset 0 0 ${px(18)}px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,246,226,0.05)`,
          }}
        >
          {clip.url ? (
            <Img
              src={clip.url}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: theme.grade }}
            />
          ) : null}
        </div>
      </div>
    );
  });

  // Off-gate dimming: fully opaque warm-black at the very ends (no peek past the strip), clear over the gate.
  const dimGrad = `linear-gradient(${landscape ? "to right" : "to bottom"}, rgba(10,8,6,1) 0%, rgba(10,8,6,1) 6%, rgba(10,8,6,0) 30%, rgba(10,8,6,0) 70%, rgba(10,8,6,1) 94%, rgba(10,8,6,1) 100%)`;

  // A 1px specular highlight skating along the strip thickness center (the lamp on moving celluloid).
  const specular: React.CSSProperties = landscape
    ? { left: 0, top: height / 2 - px(0.75), width: "100%", height: px(1.5) }
    : { top: 0, left: width / 2 - px(0.75), height: "100%", width: px(1.5) };

  return (
    <AbsoluteFill style={{ background: "#0a0806", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: blurAmt > 0.2 ? `blur(${blurAmt}px)` : undefined }}>
        {cells}
      </AbsoluteFill>

      {/* Static celluloid grain tooth. */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN_IMAGE,
          backgroundSize: `${px(3)}px ${px(3)}px`,
          opacity: 0.05,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      {/* Specular lamp skate. */}
      <div
        style={{ position: "absolute", ...specular, background: "rgba(255,255,255,0.06)", mixBlendMode: "screen", pointerEvents: "none" }}
      />
      {/* Off-gate dimming. */}
      <AbsoluteFill style={{ background: dimGrad, pointerEvents: "none" }} />
      {/* Warm gate lamp (screen-blended → adds light onto the centered photo + the perfs at the gate). */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(56% 32% at 50% 50%, rgba(255,235,198,${(0.18 * flick).toFixed(3)}) 0%, rgba(255,228,178,${(0.07 * flick).toFixed(3)}) 38%, rgba(255,228,178,0) 64%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
