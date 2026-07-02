import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { ReelProps } from "../reel-types";
import { seeded, seededRange } from "../seed";

// A COMPOSITIONAL treatment: the guest's photos as a premium DECK dealt on a table under a dealer's lamp. A
// hand-set stack (each card its own seeded tilt + jitter, deeper cards sinking + dimming so their edges peek)
// holds the top card, then FLICKS it away — a real card-throw: a tiny wind-up press (anticipation), a fast
// whip-throw off toward a seeded corner (motion-blurred, lifting toward the lamp), and the card beneath
// SPRINGS forward into focus to become the new top. SIGNATURES: the anticipation → whip → settle deal, the
// warm dealer's-lamp key everything's highlights + contact-shadow agree with, and the visible deck THICKNESS
// (edge slivers beneath the stack) that thins as the reel deals through it. Snappy + social (the "punchy"
// vibe). Portrait = tall cards; LANDSCAPE = wide cards, both from one core. Every card fills edge-to-edge
// (objectFit COVER) so a small uniform card never reads as awkwardly gapped — Will's call for THIS style; the
// media-first reels + framed gallery keep the designed negative space instead. Deterministic (seeded) +
// inline (WYSIWYG in Lambda). NO text. Honors theme.grade on the photo only.

const HOLD = 26; // frames a card rests as the top (~1.1s at 24fps)
const FLICK = 12; // frames of the throw + promotion (~0.5s)
const CYCLE = HOLD + FLICK;
const TAIL = 28; // the final card rests
const INTRO = 12; // the deck is placed on the table
const STACK = 3; // real cards drawn behind the top
const MAX_SLIVERS = 4; // implied extra depth (edge slivers) beneath the visible stack

// A wind-up release that ACCELERATES the card off the table (fast departure, gone before it decelerates).
const EASE_THROW = Easing.bezier(0.42, 0, 0.86, 0.36);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clamp01 = (t: number) => clamp(t, 0, 1);

export function cardDeckDuration(props: ReelProps): number {
  const n = props.clips.length;
  return Math.max(1, (n - 1) * CYCLE + HOLD + TAIL);
}

type Pose = { scale: number; tx: number; ty: number; rot: number; bright: number; op: number };

// The resting transform for a card at stack depth (0 = top), carrying its OWN seeded hand-set tilt + lateral
// jitter (deeper cards a touch more askew + offset) so the deck reads shuffled by hand, and sinking + dimming
// with depth so lower cards' edges peek and read as "underneath". depth STACK+1 rests at op 0 (the incoming
// card, invisible until it promotes in during a flick — no pop when the loop reaches it).
function restPose(depth: number, tilt: number, jx: number, step: number): Pose {
  const d = Math.max(0, depth);
  return {
    scale: 1 - d * 0.045,
    tx: jx * (1 + d * 0.22),
    ty: d * step,
    rot: tilt * (1 + d * 0.16),
    bright: 1 - d * 0.075,
    op: d > STACK ? 0 : 1 - d * 0.05,
  };
}

const CARD_STOCK = "linear-gradient(158deg, #faf8f3 0%, #f3efe7 58%, #ebe6db 100%)";

export const CardDeck: React.FC<ReelProps> = ({ clips, theme, seed }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const landscape = width > height;
  const base = Math.min(width, height);
  const n = clips.length;

  // Uniform card geometry (a real deck IS uniform) — tall in portrait, wide in landscape, from one core.
  const cardShort = base * 0.62;
  const cardLong = cardShort * 1.4;
  const cardW = landscape ? cardLong : cardShort;
  const cardH = landscape ? cardShort : cardLong;
  const radius = cardShort * 0.05;
  const pad = cardShort * 0.035; // the slim card-stock margin around the photo well
  const step = base * 0.02; // deck-edge peek per depth
  const cx = width / 2 - cardW / 2;
  const cy = height / 2 - cardH / 2;

  const rawC = Math.floor(frame / CYCLE);
  const c = Math.min(rawC, n - 1);
  const isLast = c === n - 1;
  const local = frame - c * CYCLE;
  const inFlick = !isLast && local >= HOLD;
  const swipeFrame = local - HOLD;

  // The deck is set on the table (drop-in from just above + fade) over the first INTRO frames.
  const introP = interpolate(frame, [0, INTRO], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const introY = (1 - introP) * -base * 0.05;

  // The wind-up (a brief press, consumed as the throw releases) + the throw progress (accelerating off).
  const windRaw = inFlick
    ? interpolate(swipeFrame, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const go = inFlick
    ? interpolate(swipeFrame, [1, FLICK], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_THROW,
      })
    : 0;
  const wind = windRaw * (1 - go);
  // The cards behind PROMOTE with a spring so the new top arrives with a lively settle (no mechanical slide).
  const sp = inFlick
    ? spring({ frame: swipeFrame, fps, config: { damping: 15, stiffness: 210, mass: 0.7 } })
    : 0;

  // The flicked card's seeded throw character.
  const throwDir = seeded(seed, c, 2) > 0.5 ? 1 : -1;
  const throwUp = seededRange(seed, c, 6, -0.1, 0.28);

  // Render the incoming card (depth STACK+1, fades in as it promotes) down through the resting stack to the
  // top — back-to-front so DOM order + zIndex agree.
  const deepest = Math.min(c + STACK + 1, n - 1);
  const cards: React.ReactNode[] = [];
  for (let i = deepest; i >= c; i--) {
    const clip = clips[i];
    const depth = i - c;
    const tilt = seededRange(seed, i, 1, -4, 4);
    const jx = seededRange(seed, i, 3, -0.03, 0.03) * cardShort;

    let tx: number;
    let ty: number;
    let rot: number;
    let scale: number;
    let bright: number;
    let op: number;
    let blur = 0;
    let lift = 0; // 0 at rest → 1 fully thrown (drives the shadow spread + gloss catch)

    if (depth === 0 && inFlick) {
      // The top card flies off: a wind-up press-back, then an accelerating whip toward a seeded corner,
      // scaling up as it lifts toward the lamp, fading as it clears.
      lift = go;
      const throwX = go * throwDir * (width * 0.5 + cardW);
      const throwY = go * (-throwUp * height * 0.5) - go * base * 0.03;
      tx = jx + throwX;
      ty = wind * base * 0.02 + throwY;
      rot = tilt - throwDir * 5 * wind + go * throwDir * 22;
      scale = (1 - 0.03 * wind) * (1 + go * 0.08);
      bright = 1 + go * 0.06;
      op = interpolate(go, [0.5, 0.92], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      blur = base * 0.02 * Math.sin(clamp01(go) * Math.PI);
    } else if (depth === 0) {
      // The resting top card — brightens into focus over the first frames it becomes the top.
      const p = restPose(0, tilt, jx, step);
      tx = p.tx;
      ty = p.ty;
      rot = p.rot;
      scale = p.scale;
      op = p.op;
      bright = interpolate(local, [0, 6], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    } else if (inFlick) {
      // Behind cards promote depth → depth-1 on the spring (the incoming deepest fades in from op 0).
      const from = restPose(depth, tilt, jx, step);
      const to = restPose(depth - 1, tilt, jx, step);
      tx = lerp(from.tx, to.tx, sp);
      ty = lerp(from.ty, to.ty, sp);
      rot = lerp(from.rot, to.rot, sp);
      scale = lerp(from.scale, to.scale, sp);
      bright = lerp(from.bright, to.bright, sp);
      op = lerp(from.op, to.op, sp);
    } else {
      const p = restPose(depth, tilt, jx, step);
      tx = p.tx;
      ty = p.ty;
      rot = p.rot;
      scale = p.scale;
      bright = p.bright;
      op = p.op;
    }

    // The grounded card shadow — tight when resting, spreading + softening as the top card lifts to flick.
    const cardShadow = [
      `0 ${(step * 0.5 + base * 0.05 * lift).toFixed(1)}px ${(step * 0.9 + base * 0.09 * lift).toFixed(1)}px rgba(12,10,14,${(0.4 - 0.16 * lift).toFixed(3)})`,
      `0 ${(base * 0.006).toFixed(1)}px ${(base * 0.014).toFixed(1)}px rgba(12,10,14,0.3)`,
      "inset 0 1px 0 rgba(255,255,255,0.75)",
      "inset 0 0 0 1px rgba(20,16,24,0.16)",
    ].join(", ");

    const glossAngle = 122 + seededRange(seed, i, 25, -10, 10) + lift * throwDir * 12;
    const glossA = clamp(0.16 - depth * 0.03 + lift * 0.08, 0, 0.24);

    cards.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: cardW,
          height: cardH,
          opacity: op,
          zIndex: 100 - depth,
          transformOrigin: "center 60%",
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
          filter: blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : undefined,
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius,
            background: CARD_STOCK,
            padding: pad,
            boxShadow: cardShadow,
            filter: `brightness(${bright.toFixed(3)})`,
          }}
        >
          {/* The recessed photo well (mismatched media fits onto the card stock, never zoom-cropped). */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: radius * 0.62,
              background: "#efeae0",
              boxShadow:
                "inset 0 0 0 1px rgba(40,30,14,0.10), inset 0 2px 5px rgba(30,22,10,0.16)",
            }}
          >
            {clip.url ? (
              <Img
                src={clip.url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: theme.grade,
                }}
              />
            ) : null}
            {/* A semi-gloss sheen on the card face — catches the dealer's lamp, sweeps as the card flicks. */}
            <AbsoluteFill
              style={{
                background: `linear-gradient(${glossAngle.toFixed(1)}deg, rgba(255,255,255,${glossA.toFixed(3)}) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 48%)`,
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>,
    );
  }

  // Edge slivers — the compressed edges of the cards still in the deck beneath the visible stack. Their count
  // = the remaining depth, so the deck visibly THINS as the reel deals through it. They ride the promotion.
  const remaining = n - 1 - c;
  const sliverCount = clamp(remaining - (STACK + 1), 0, MAX_SLIVERS);
  const slivers: React.ReactNode[] = [];
  for (let k = 0; k < sliverCount; k++) {
    const effDepth = STACK + 1 + k - (inFlick ? sp : 0);
    const sScale = Math.max(0.7, 1 - effDepth * 0.045);
    const sw = cardW * sScale;
    const sJx = seededRange(seed, c + STACK + 1 + k, 3, -0.02, 0.02) * cardShort;
    slivers.push(
      <div
        key={`sl-${k}`}
        style={{
          position: "absolute",
          left: width / 2 - sw / 2 + sJx,
          top: cy + effDepth * step,
          width: sw,
          height: step * 1.7,
          borderRadius: radius * 0.5,
          background: "linear-gradient(180deg, #f4f0e7 0%, #ddd7cb 100%)",
          boxShadow: "0 2px 5px rgba(12,10,14,0.28), inset 0 1px 0 rgba(255,255,255,0.6)",
          opacity: clamp(0.9 - k * 0.16, 0.2, 0.9),
          zIndex: 100 - Math.round(effDepth),
        }}
      />,
    );
  }

  return (
    <AbsoluteFill
      style={{
        // A premium card table: a warm dealer's-lamp pool over deep charcoal.
        background:
          "radial-gradient(92% 70% at 50% 34%, #2c2a31 0%, #1a1920 52%, #0e0d12 100%)",
      }}
    >
      {/* Faint felt tooth on the table. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5) 0 0.5px, transparent 0.6px 3px)",
          backgroundSize: `${(base * 0.004).toFixed(1)}px ${(base * 0.004).toFixed(1)}px`,
          opacity: 0.03,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {/* The deck group (drops in on the intro). */}
      <AbsoluteFill style={{ transform: `translateY(${introY.toFixed(1)}px)`, opacity: introP }}>
        {/* The stack's soft contact shadow on the table (grounds the whole deck). */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - cardW * 0.56,
            top: cy + cardH * 0.9,
            width: cardW * 1.12,
            height: cardH * 0.16,
            borderRadius: "50%",
            background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)",
            filter: `blur(${(base * 0.012).toFixed(1)}px)`,
            pointerEvents: "none",
          }}
        />
        {slivers}
        {cards}
      </AbsoluteFill>

      {/* SIGNATURE — the warm dealer's lamp the cards' highlights + shadows agree with. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(58% 44% at 50% 30%, rgba(255,247,232,0.16) 0%, rgba(255,243,222,0.05) 42%, transparent 66%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {/* A quiet vignette that seats the table into the dark. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 92% 82% at 50% 44%, transparent 56%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
