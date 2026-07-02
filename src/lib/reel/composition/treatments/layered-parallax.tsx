import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../reel-types";
import { seeded, seededPick, seededRange } from "../seed";

// A COMPOSITIONAL treatment: ONE continuous camera PUSH through a foggy depth-tunnel where the guest's photos
// hang as lit glass cards on receding Z-rails. Built on REAL CSS 3D (perspective + preserve-3d + translateZ):
// the CAMERA (one #camera element) dollies forward in Z; each card sits at a FIXED worldZ; the differential
// parallax (near cards sweep past fast, far cards crawl) is EMERGENT from the perspective divide, never a
// per-layer speed constant. SIGNATURE: the rack-focus arrival + fly-through — as the lens reaches each card's
// focal plane ONE proximity scalar (`near`) fires synced effects (snap sharp, ignite a warm glaze, deepen the
// depth-shadow, part the surrounding haze) while the previous hero sails huge + soft + translucent PAST the
// lens (you fly THROUGH it) as the next rises from the deep. Owns DEPTH — the one thing framed-gallery (fixed
// camera, coplanar wall) and Float (2D drift) structurally cannot do. Orientation-invariant (pushing INTO the
// screen is the same move both ways). COVER-filled cards take the photo's OWN aspect (a mismatched photo
// becomes a differently-shaped glass card, never letterboxed or zoom-cropped). Deterministic (seeded) + inline
// (WYSIWYG in Lambda; CSS 3D + filters only, no WebGL / no SVG filters). NO text. theme.grade on the photo only.

const LAUNCH = 20; // the camera eases out of rest; the reel emerges from haze into the first hero
const TAIL = 46; // the finale rest on the last hero (a calm landing, not a hard cut)
const TRAVEL_FRAC = 0.52; // fraction of each slot spent gliding to the next card (the rest is the focal hold)

const EASE_DOLLY = Easing.bezier(0.33, 0, 0.15, 1); // slow launch, long cruise, gentle arrive
const EASE_PROX = Easing.bezier(0.5, 0, 0.2, 1); // the focus COMMITS (a card decides to be the hero, no mush)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clamp01 = (t: number) => clamp(t, 0, 1);
const TAU = Math.PI * 2;

// Per-photo beat, eased down as the album grows so long reels still complete (~1.7s -> ~1.1s).
function slotFrames(n: number): number {
  return Math.round(lerp(40, 26, clamp01((n - 6) / 8)));
}

export function layeredParallaxDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, LAUNCH + n * slotFrames(n) + TAIL);
}

// The lens's focal target (0..n-1): emerge from behind, then settle-and-glide (hold on each card, ease to the
// next) — a Z-axis clone of the framed-gallery dolly. n===1 gets a slow reverent push from behind to just past.
function focalAt(frame: number, n: number, slot: number): number {
  if (n <= 1) {
    const total = LAUNCH + slot + TAIL;
    return interpolate(frame, [0, total], [-0.5, 0.34], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_DOLLY,
    });
  }
  if (frame < LAUNCH)
    return interpolate(frame, [0, LAUNCH], [-0.5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_DOLLY,
    });
  const t = frame - LAUNCH;
  const idx = Math.floor(t / slot);
  if (idx >= n - 1) return n - 1;
  const local = t - idx * slot;
  const holdF = slot * (1 - TRAVEL_FRAC);
  if (local < holdF) return idx;
  return (
    idx +
    interpolate(local, [holdF, slot], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_DOLLY,
    })
  );
}

export const LayeredParallax: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const main = landscape ? width : height;
  const cross = landscape ? height : width;
  const px = (v: number) => v * (main / 1080);
  const n = clips.length;
  const slot = slotFrames(n);

  // Seeded scene character (the variation axes, baked to ONE stable take per reel).
  const PERSP = px(seededRange(seed, 0, 80, 1350, 1950)); // lens length: short = dramatic rush-past, long = telephoto glide
  const SWEET = px(520); // the focal standoff — a card here is the sharp, lit hero
  const SLOT_Z = px(660); // spacing between consecutive cards along the track
  const NEAR_WINDOW = px(600); // width of the in-focus zone around SWEET
  const projFocal = PERSP / SWEET; // the perspective magnification at the focal plane

  const focalT = focalAt(frame, n, slot);
  const breath = Math.sin(frame * 0.02) * px(7); // a felt-not-seen lens breath
  const camZ = PERSP - SWEET + focalT * SLOT_Z + breath;

  // Camera drift = the life. Applied to the CAMERA, so near cards swing far more than far ones for FREE (real
  // parallax, not tuned per-layer sines). driftAmp: locked-off dolly -> loose hand-cranked sway.
  const driftAmp = seededRange(seed, 0, 73, 0.5, 1.15);
  const driftX = Math.sin(frame * 0.011 + seeded(seed, 0, 70) * TAU) * px(26) * driftAmp;
  const pitch = Math.sin(frame * 0.009 + seeded(seed, 0, 71) * TAU) * 0.75 * driftAmp;
  const yaw = Math.sin(frame * 0.007 + seeded(seed, 0, 72) * TAU) * 0.65 * driftAmp;

  const originX = 50;
  const originY = landscape ? 46 : 42; // the vanishing point sits a touch higher in portrait (a deeper tunnel)
  const godrays = seeded(seed, 0, 60) > 0.45;

  // The current hero (drives the haze-part clearing + god-ray pulse).
  const focalIdx = clamp(Math.round(focalT), 0, Math.max(0, n - 1));
  const focalDist = SWEET + (focalIdx - focalT) * SLOT_Z - breath;
  const focalNear = clamp01(1 - Math.abs(focalDist - SWEET) / NEAR_WINDOW);

  const cards = clips.map((clip, i) => {
    const dist = SWEET + (i - focalT) * SLOT_Z - breath; // world distance from the lens (SWEET = in focus)
    if (dist < px(-120) || dist > px(3600)) return null; // deterministic frustum cull (bounds the live DOM)

    const near = clamp01(1 - Math.abs(dist - SWEET) / NEAR_WINDOW);
    const nearE = EASE_PROX(near);

    // Card element sized so it projects to a comfortable on-screen size AT the focal plane. The card takes the
    // photo's OWN (clamped) aspect, so a mismatched-orientation photo is just a differently-shaped glass card
    // (cover-filled) — never letterboxed, never zoom-cropped.
    const rawAspect =
      clip.width && clip.height ? clip.width / clip.height : seededPick(seed, i, 22, [4 / 5, 1, 5 / 4]);
    const aspect = clamp(rawAspect, 0.62, 1.6);
    const targetShort = cross * (landscape ? 0.58 : 0.72); // desired on-screen SHORT edge of the focal hero
    const elShort = targetShort / projFocal;
    const wide = aspect >= 1;
    const cardW = wide ? elShort * aspect : elShort;
    const cardH = wide ? elShort : elShort / aspect;

    // World placement: fixed even depth, a modest lateral rail (small so the focal hero stays near center; the
    // perspective magnifies it as the card nears, so near cards SWEEP PAST the frame edge), a little vertical
    // stagger, and a few degrees of face turn so each reads as hand-hung glass catching light.
    const side = i % 2 === 0 ? 1 : -1;
    const railX = (side * seededRange(seed, i, 30, 0.05, 0.11) * cross) / projFocal;
    const railY = (seededRange(seed, i, 31, -0.05, 0.05) * cross) / projFocal;
    const zc = -i * SLOT_Z;
    const faceYaw = seededRange(seed, i, 20, -7, 7);
    const faceTilt = seededRange(seed, i, 21, -4, 4);

    // The ONE scalar drives everything, synced.
    const dofBlur = Math.min(px(8), (Math.abs(dist - SWEET) / px(1500)) * px(8));
    const brightness = lerp(0.72, 1.08, nearE);
    const saturate = lerp(0.8, 1.07, nearE);
    const fadeFar = interpolate(dist, [SWEET + px(760), SWEET + px(2050)], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fadeThrough = interpolate(dist, [px(90), px(380)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fade = Math.min(fadeFar, fadeThrough);
    const zIndex = Math.round(6000 - dist);
    const hazeA = lerp(0, 0.22, clamp01((dist - SWEET) / px(1500))); // atmospheric perspective — far cards fog out
    const glaze = near * near; // the projector "finding" the card — only lights right AT the plane

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: cardW,
          height: cardH,
          marginLeft: -cardW / 2,
          marginTop: -cardH / 2,
          transform: `translate3d(${railX.toFixed(1)}px, ${railY.toFixed(1)}px, ${zc.toFixed(1)}px) rotateY(${faceYaw.toFixed(2)}deg) rotateX(${faceTilt.toFixed(2)}deg)`,
          opacity: Number(fade.toFixed(3)),
          zIndex,
          borderRadius: px(14),
          background: "#0d0b13",
          // A warm 3-layer depth-cast shadow (the Comeau layered move) that DEEPENS + grounds as the card
          // ignites, plus a glass bezel (lit top-lip / dark under-edge) and a rim-light firing at the focal plane.
          boxShadow: [
            `0 ${px(6)}px ${px(16)}px rgba(18,14,26,0.34)`,
            `0 ${px(26)}px ${px(60)}px rgba(14,10,22,${(0.32 * near).toFixed(3)})`,
            `0 ${px(58)}px ${px(128)}px rgba(10,8,18,${(0.22 * near).toFixed(3)})`,
            `inset 0 1px 0 rgba(255,248,236,0.16)`,
            `inset 0 -1px 0 rgba(0,0,0,0.5)`,
            `inset 0 0 0 ${px(1.5)}px rgba(255,248,236,${(0.5 * near).toFixed(3)})`,
          ].join(", "),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: px(4),
            overflow: "hidden",
            borderRadius: px(11),
            background: "#000",
          }}
        >
          {clip.url ? (
            <Img
              src={clip.url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: `${theme.grade} blur(${dofBlur.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`,
              }}
            />
          ) : null}
          {/* SIGNATURE glaze — a warm diagonal specular that ignites only at the focal plane. */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(118deg, rgba(255,250,240,${(0.24 * glaze).toFixed(3)}) 0%, rgba(255,250,240,0.03) 26%, transparent 52%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
          {/* Atmospheric haze veil — far cards fog toward the vanishing color. */}
          <AbsoluteFill style={{ background: `rgba(32,27,44,${hazeA.toFixed(3)})`, pointerEvents: "none" }} />
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        // The warm volumetric fog lives on the FIXED root (full frame, always covers) so no parallaxing layer
        // edge can slide into view — the framed-gallery tracking-seam lesson. The warm center IS the key light.
        background: `radial-gradient(120% 94% at ${originX}% ${originY}%, #322841 0%, #1d1826 46%, #0e0b15 100%)`,
      }}
    >
      {/* THE LENS + THE CAMERA (one preserve-3d element that dollies through Z) + the fixed-depth cards. */}
      <AbsoluteFill
        style={{ perspective: `${PERSP.toFixed(1)}px`, perspectiveOrigin: `${originX}% ${originY}%` }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${camZ.toFixed(1)}px) translateX(${driftX.toFixed(1)}px) rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`,
          }}
        >
          {cards}
        </div>
      </AbsoluteFill>

      {/* SIGNATURE — the haze PARTS at the vanishing point as a card commits to the focal plane. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(${(30 + focalNear * 16).toFixed(0)}% ${(26 + focalNear * 13).toFixed(0)}% at ${originX}% ${originY}%, rgba(255,244,224,${(0.11 * focalNear).toFixed(3)}) 0%, transparent 62%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {/* Volumetric god-ray shafts (seed-gated) — a projector beam through dust, drifting slowly. */}
      {godrays ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(64deg, transparent 32%, rgba(255,242,214,0.035) 43%, transparent 53%), linear-gradient(71deg, transparent 60%, rgba(255,238,206,0.026) 67%, transparent 75%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            transform: `translateX(${(Math.sin(frame * 0.006) * px(34)).toFixed(1)}px)`,
          }}
        />
      ) : null}
      {/* Grounded vignette that seats the tunnel into the dark. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 104% 94% at ${originX}% ${originY}%, transparent 56%, rgba(0,0,0,0.44) 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
