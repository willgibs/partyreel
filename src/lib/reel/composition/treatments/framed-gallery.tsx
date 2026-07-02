import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { fitClip } from "../framing";
import type { ReelProps } from "../reel-types";
import { seeded, seededPick, seededRange } from "../seed";

// A COMPOSITIONAL treatment: the guest's photos hung as matted, FRAMED pieces in a bright white-cube
// gallery, a camera dollying along the wall and SETTLING in front of each work (a visitor's tour, not a
// scroll). The premium is in real framing — a thin matte molding, a generous warm cotton-rag mat with a
// 45deg BEVEL-CUT window, a recessed glass-glazed print — and in one ~30deg-above key that EVERYTHING agrees
// with: directional wall cast-shadows, top-weighted bevel shadows, lit top-lips. SIGNATURE: a warm
// picture-light that WARMS + centers each piece as the dolly arrives (one proximity scalar drives the
// spotlight + the piece brightness + its cast-shadow depth + its glass glaze, in sync). Landscape = a stroll
// along the wall; PORTRAIT rotates the conceit 90deg to a vertical stairwell hang craning down. Deterministic
// (seeded) + inline (WYSIWYG in Lambda). NO text. Honors theme.grade on the photo only.

const INTRO = 16;
const TRAVEL = 18;
const OUTRO = 40;

const EASE_STEP = Easing.bezier(0.45, 0, 0.15, 1); // a decisive accel + a long gentle "arrive"

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

function holdFrames(n: number): number {
  return Math.round(lerp(30, 22, clamp01((n - 6) / 6)));
}

export function framedGalleryDuration(props: ReelProps): number {
  const n = props.clips.length;
  const hold = holdFrames(n);
  return Math.max(1, INTRO + (n - 1) * TRAVEL + n * hold + OUTRO);
}

// The settle-and-hold dolly position (0..n-1): hold on a piece, then ease to the next.
function travelAt(frame: number, n: number, hold: number): number {
  if (frame < INTRO)
    return interpolate(frame, [0, INTRO], [-0.1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_STEP,
    });
  const t = frame - INTRO;
  const cycle = hold + TRAVEL;
  const idx = Math.min(Math.floor(t / cycle), n - 1);
  const local = t - idx * cycle;
  if (idx >= n - 1 || local < hold) return idx;
  return Math.min(
    idx +
      interpolate(local, [hold, cycle], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_STEP,
      }),
    n - 1,
  );
}

export const FramedGallery: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const main = landscape ? width : height;
  const cross = landscape ? height : width;
  const px = (v: number) => v * (main / 1080);
  const n = clips.length;
  const hold = holdFrames(n);

  const travel = travelAt(frame, n, hold);
  const slot = main * 0.62;
  const camMain = travel * slot;

  // ONE proximity scalar → the spotlight swells, the room dims between pieces.
  const nearest = Math.round(travel);
  const p = 1 - clamp(Math.abs(travel - nearest), 0, 1);

  // n===1 gets a slow reverent push-in instead of a dolly.
  const soloPush =
    n === 1
      ? interpolate(frame, [INTRO, INTRO + hold + OUTRO], [1, 1.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_STEP,
        })
      : 1;

  // Cross-axis centerline (the museum hang line) — landscape Y, portrait X.
  const crossCenter = landscape ? height * 0.46 : width * 0.5;

  const frames = clips.map((clip, i) => {
    const material = seededPick(seed, i, 31, ["black", "black", "black", "wood"]);
    const isWood = material === "wood";
    const aspect =
      clip.width && clip.height
        ? clamp(clip.width / clip.height, 0.7, 1.4)
        : seededPick(seed, i, 8, [4 / 5, 1, 5 / 4]);
    const sizeFrac = seededRange(seed, i, 7, landscape ? 0.5 : 0.6, landscape ? 0.64 : 0.76);
    const frameCrossDim = cross * sizeFrac;
    const frameMainDim = landscape ? frameCrossDim * aspect : frameCrossDim / aspect;
    const frameW = landscape ? frameMainDim : frameCrossDim;
    const frameH = landscape ? frameCrossDim : frameMainDim;
    const frameLong = Math.max(frameW, frameH);
    const frameShort = Math.min(frameW, frameH);

    const moldFace = frameLong * seededRange(seed, i, 30, 0.03, 0.04);
    // The over-matting trick — smaller works get a proportionally wider mat.
    const matFrac = seededRange(seed, i, 32, 0.13, 0.17) + (0.64 - sizeFrac) * 0.1;
    const matSide = frameShort * matFrac;
    const matBottom = matSide * 1.18;
    const hasGroove = seeded(seed, i, 33) > 0.45;
    const depthJ = seededRange(seed, i, 36, 0.88, 1.12);
    const crossJitter = frameShort * seededRange(seed, i, 34, -0.012, 0.012);

    // The dolly proximity for THIS piece → brightness pop, cast-shadow depth, glass glaze.
    const pi = interpolate(Math.abs(travel - i), [0, 1.3], [1, 0], { extrapolateRight: "clamp" });
    const brightness = lerp(0.86, 1.06, pi);
    const litA = lerp(0.13, 0.2, pi);
    const castMul = lerp(1, 1.3, pi);
    const leanScale = 1 + 0.025 * pi;

    const mainCoord = i * slot;
    const left = landscape ? mainCoord - frameW / 2 : crossCenter - frameW / 2 + crossJitter;
    const top = landscape ? crossCenter - frameH / 2 + crossJitter : mainCoord - frameH / 2;

    const moldBg = isWood
      ? "linear-gradient(168deg, #c9a878 0%, #b1895f 50%, #9a7148 100%)"
      : "#141414";
    const moldLips = isWood
      ? "inset 0 1px 0 rgba(255,240,214,0.22), inset 0 -1px 0 rgba(60,40,20,0.40)"
      : "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.55)";
    const matBg = isWood
      ? "linear-gradient(178deg, #f8f3e8 0%, #f3ebdc 100%)"
      : "linear-gradient(178deg, #f6f3ed 0%, #f0ece1 100%)";

    const cast = [
      `0 ${px(2)}px ${px(3)}px rgba(28,26,24,${litA.toFixed(3)})`,
      `0 ${(frameLong * 0.018 * castMul * depthJ).toFixed(1)}px ${(frameLong * 0.028 * castMul * depthJ).toFixed(1)}px rgba(28,26,24,0.13)`,
      `0 ${(frameLong * 0.04 * castMul * depthJ).toFixed(1)}px ${(frameLong * 0.07 * depthJ).toFixed(1)}px -${(frameLong * 0.012).toFixed(1)}px rgba(28,26,24,0.10)`,
      `${px(4)}px ${px(8)}px ${(frameLong * 0.05).toFixed(1)}px -${(frameLong * 0.016).toFixed(1)}px rgba(28,26,24,0.07)`,
    ].join(", ");

    const glassAngle = 122 + clamp((i - travel) * 3, -6, 6);

    return (
      <div key={i} style={{ position: "absolute", left, top, width: frameW, height: frameH }}>
        {/* Shadow caster (the wall cast-shadow rides with the piece). */}
        <div style={{ width: "100%", height: "100%", borderRadius: px(2), boxShadow: cast }}>
          {/* Brightness + the reverent forward lean as the dolly centers it. */}
          <div
            style={{
              width: "100%",
              height: "100%",
              filter: `brightness(${brightness.toFixed(3)})`,
              transform: `scale(${leanScale.toFixed(4)})`,
              transformOrigin: "center",
            }}
          >
            {/* Molding (matte black / warm wood) — depth from lit top-lip + dark underside + rabbet ring. */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: moldBg,
                borderRadius: px(2),
                padding: moldFace,
                boxShadow: `${moldLips}, inset 0 0 0 1px rgba(0,0,0,0.32), inset 0 1px 2px rgba(0,0,0,0.34)`,
              }}
            >
              {/* The museum mat (warm cotton-rag, weighted bottom). */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  background: matBg,
                  padding: `${matSide}px ${matSide}px ${matBottom}px`,
                }}
              >
                {hasGroove ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: matSide * 0.5,
                      boxShadow:
                        "inset 0 0 0 1px rgba(60,42,20,0.14), inset 0 1px 0 rgba(255,253,247,0.65)",
                    }}
                  />
                ) : null}
                {/* Photo well — recessed under the 45deg bevel-cut window. */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: px(1),
                    background: "#0c0c0c",
                    boxShadow:
                      "inset 0 0 0 1.5px #fffdf7, inset 0 3px 6px rgba(40,28,12,0.40), inset 0 -1px 2px rgba(255,255,255,0.30), inset 0 0 0 1px rgba(0,0,0,0.16)",
                  }}
                >
                  {clip.url ? (
                    <Img
                      src={clip.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit:
                          fitClip(clip.width, clip.height, frameW, frameH) === "cover"
                            ? "cover"
                            : "contain",
                        filter: theme.grade,
                      }}
                    />
                  ) : null}
                  {/* A whisper of museum glass — catches the diagonal light only as the piece centers. */}
                  <AbsoluteFill
                    style={{
                      background: `linear-gradient(${glassAngle.toFixed(1)}deg, rgba(255,253,247,0.07) 0%, rgba(255,253,247,0.02) 18%, transparent 36%)`,
                      mixBlendMode: "screen",
                      opacity: 0.5 + 0.5 * pi,
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const spotA = 0.05 + 0.16 * p;

  return (
    <AbsoluteFill style={{ background: "#eceae5", overflow: "hidden" }}>
      {/* WALL plane (slowest parallax) — plaster tone + the ceiling wall-wash pool + the floor sliver. */}
      <AbsoluteFill
        style={{
          transform: landscape
            ? `translateX(${-camMain * 0.42}px)`
            : `translateY(${-camMain * 0.42}px)`,
        }}
      >
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, #efedE8 0%, #eceae5 46%, #e4e1da 100%)",
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(80% 60% at 50% 28%, rgba(255,255,255,0.45) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        {landscape ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "9%",
              background: "linear-gradient(180deg, #e4e1da 0%, #d6d2c9 100%)",
              boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)",
            }}
          />
        ) : null}
      </AbsoluteFill>

      {/* FRAMES plane (full rate). */}
      <div
        style={{
          position: "absolute",
          left: landscape ? width / 2 : 0,
          top: landscape ? 0 : height / 2,
          width: landscape ? undefined : "100%",
          height: landscape ? "100%" : undefined,
          transform: `${landscape ? `translateX(${-camMain}px)` : `translateY(${-camMain}px)`} scale(${soloPush.toFixed(4)})`,
          transformOrigin: landscape ? "left center" : "center top",
        }}
      >
        {frames}
      </div>

      {/* SIGNATURE — the warm picture-light that swells as the dolly arrives at each piece. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 46% at 50% 42%, rgba(255,246,228,${spotA.toFixed(3)}) 0%, rgba(255,242,220,${(spotA * 0.4).toFixed(3)}) 40%, transparent 64%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {/* A whisper of warm-grey vignette (the white cube stays bright). */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 100% 90% at 50% 42%, transparent 64%, rgba(120,116,108,0.11) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
