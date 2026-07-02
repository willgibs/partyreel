import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  linearTiming,
  springTiming,
  type TransitionPresentation,
  TransitionSeries,
} from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { ClipMedia } from "./clip-media";
import { Overlay } from "./effects";
import {
  type ClipMotion,
  planReel,
  type PlannedClip,
  type PlannedGap,
} from "./layout";
import type { MotionStyle, ReelProps, ReelTheme } from "./reel-types";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Move = { scale: number; tx: number; ty: number; rotate: number };

// The Ken-Burns CHARACTER per theme. Base zoom is sized to the pan so the cover-fill never reveals an
// edge (pan ≤ overscan margin at every frame); each style spends that motion budget differently.
function computeMotion(
  style: MotionStyle,
  frame: number,
  dur: number,
  m: ClipMotion,
  width: number,
): Move {
  const baseZoom = 1 + 2 * m.panFrac + 0.015;
  const panPx = m.panFrac * width;
  const p = dur > 0 ? frame / dur : 0;

  if (style === "punch") {
    const snap = interpolate(
      frame,
      [0, Math.min(10, dur)],
      [1 + Math.max(m.punch, 0.12), 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
    );
    const drift = interpolate(
      frame,
      [0, dur],
      [baseZoom, baseZoom + m.zoomDelta * 0.5],
      { extrapolateRight: "clamp" },
    );
    return {
      scale: drift * snap,
      tx: interpolate(frame, [0, dur], [0, m.panX * panPx * 0.4], {
        extrapolateRight: "clamp",
      }),
      ty: interpolate(frame, [0, dur], [0, m.panY * panPx * 0.4], {
        extrapolateRight: "clamp",
      }),
      rotate: 0,
    };
  }

  if (style === "float") {
    const ph = m.panX * Math.PI;
    return {
      scale: interpolate(frame, [0, dur], [baseZoom, baseZoom + m.zoomDelta], {
        extrapolateRight: "clamp",
      }),
      tx: Math.sin(p * Math.PI * 1.2 + ph) * m.panX * panPx,
      ty: Math.sin(p * Math.PI * 1.2 + ph + 1.2) * m.panY * panPx,
      rotate: Math.sin(p * Math.PI * 2 + ph) * 0.5,
    };
  }

  if (style === "freezeGo") {
    const go = interpolate(p, [0.45, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });
    return {
      scale: baseZoom + go * m.zoomDelta,
      tx: go * m.panX * panPx,
      ty: go * m.panY * panPx,
      rotate: 0,
    };
  }

  // drift (default) — gentle linear push + pan, with an optional small entry punch.
  const punch = m.punch
    ? interpolate(frame, [0, Math.min(7, dur)], [1 + m.punch, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      })
    : 1;
  return {
    scale:
      interpolate(frame, [0, dur], [baseZoom, baseZoom + m.zoomDelta], {
        extrapolateRight: "clamp",
      }) * punch,
    tx: interpolate(frame, [0, dur], [0, m.panX * panPx], {
      extrapolateRight: "clamp",
    }),
    ty: interpolate(frame, [0, dur], [0, m.panY * panPx], {
      extrapolateRight: "clamp",
    }),
    rotate: 0,
  };
}

// --- One clip: a cinematic Ken-Burns still (or a real video). The TransitionSeries owns the inter-clip
// blend now, so a clip just renders at full opacity + moves with its theme's motion character. --------
const ClipLayer: React.FC<{
  clip: PlannedClip;
  theme: ReelTheme;
  posterMode: boolean;
}> = ({ clip, theme, posterMode }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const dur = clip.durationInFrames;
  const sig = theme.signature ?? {};
  const mv = computeMotion(
    theme.motionStyle ?? "drift",
    frame,
    dur,
    clip.motion,
    width,
  );

  // A posterless clip (a NULL-preview video in posterMode) → a solid theme-background hold, so the
  // timeline LENGTH still reflects the curation even without an image to show.
  if (!clip.url) {
    return <AbsoluteFill style={{ backgroundColor: theme.background }} />;
  }

  // The shared media primitive owns cover-vs-fit framing, the style's negative-space backdrop, the
  // photo/poster/(export)video paths, the grade, and the highlight-bloom halation. The mood passes its
  // seeded Ken-Burns motion + its signature backdrop/inset.
  return (
    <ClipMedia
      url={clip.url}
      type={clip.type}
      mediaWidth={clip.width}
      mediaHeight={clip.height}
      trimStartSec={clip.trimStartSec}
      durationInFrames={dur}
      posterMode={posterMode}
      grade={theme.grade}
      motion={mv}
      halation={sig.halation}
      backdrop={theme.backdrop ?? "theme"}
      background={theme.background}
      paper={sig.paper}
      inset={sig.inset}
    />
  );
};

// --- Transition mapping: the seeded plan's gap → a @remotion/transitions presentation + timing. A "cut"
// is a 2-frame fade (reads as a hard cut). All durations come from the plan so the timeline never drifts.
// The presentations have distinct generic props, so we widen to one TransitionPresentation for the union.
function presentationFor(
  gap: PlannedGap,
  width: number,
  height: number,
): TransitionPresentation<Record<string, unknown>> {
  const pres =
    gap.kind === "slide"
      ? slide({ direction: gap.dir })
      : gap.kind === "wipe"
        ? wipe({ direction: gap.dir })
        : gap.kind === "flip"
          ? flip({ direction: gap.dir })
          : gap.kind === "clockWipe"
            ? clockWipe({ width, height })
            : fade(); // "fade" + "cut" (a 2-frame fade)
  return pres as unknown as TransitionPresentation<Record<string, unknown>>;
}

function timingFor(gap: PlannedGap) {
  return gap.timing === "spring"
    ? springTiming({ durationInFrames: gap.durationInFrames, config: { damping: 200 } })
    : linearTiming({ durationInFrames: gap.durationInFrames });
}

// NOTE: the free-tier wordmark used to live + render here. It was hoisted to ./style-render (StyleDispatch)
// so ALL 14 styles (moods + treatments) stamp it uniformly — a treatment reel must not export unmarked.

export const Reel: React.FC<ReelProps> = (props) => {
  const { theme, seed, posterMode = false } = props;
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const plan = planReel(props);
  const sig = theme.signature ?? {};

  // Flat, alternating children (Sequence, Transition, Sequence, …) — the shape TransitionSeries requires.
  const children: React.ReactNode[] = [];
  plan.clips.forEach((clip, i) => {
    children.push(
      <TransitionSeries.Sequence
        key={`s${clip.index}`}
        durationInFrames={clip.durationInFrames}
      >
        <ClipLayer clip={clip} theme={theme} posterMode={posterMode} />
      </TransitionSeries.Sequence>,
    );
    const gap = plan.gaps[i];
    if (gap) {
      children.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={presentationFor(gap, width, height)}
          timing={timingFor(gap)}
        />,
      );
    }
  });

  // Output-timeline start frame of each clip (TransitionSeries overlaps each gap), for cut-timed signatures.
  const starts: number[] = [];
  let acc = 0;
  plan.clips.forEach((clip, i) => {
    if (i > 0) acc += plan.clips[i - 1].durationInFrames - plan.gaps[i - 1].durationInFrames;
    starts.push(acc);
  });

  // Composition-level signatures: gate weave (Film), scale-pulse + cut-flash (Pulse), whip-blur (Kinetic).
  const weaveX = sig.weave ? Math.sin(frame * 0.55 + seed) * sig.weave : 0;
  const weaveY = sig.weave ? Math.cos(frame * 0.43 + seed * 1.3) * sig.weave : 0;
  const pulseScale = sig.pulse ? 1 + Math.sin(frame * 0.6) * sig.pulse : 1;

  let whip = 0;
  if (sig.whipBlur) {
    for (let i = 1; i < starts.length; i++) {
      const g = plan.gaps[i - 1]?.durationInFrames ?? 0;
      if (g <= 0) continue;
      const d = frame - starts[i];
      if (d >= 0 && d <= g) whip = Math.max(whip, 9 * (1 - Math.abs(d - g / 2) / (g / 2)));
    }
  }

  let flash = 0;
  if (sig.flashOnCut) {
    const FL = 3;
    for (let i = 1; i < starts.length; i++) {
      const d = frame - starts[i];
      if (d >= -1 && d <= FL) flash = Math.max(flash, 1 - Math.abs(d) / FL);
    }
  }

  const contentTransform =
    weaveX !== 0 || weaveY !== 0 || pulseScale !== 1
      ? `translate(${weaveX}px, ${weaveY}px) scale(${pulseScale})`
      : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AbsoluteFill
        style={{
          transform: contentTransform,
          filter: whip > 0.05 ? `blur(${whip}px)` : undefined,
        }}
      >
        <TransitionSeries>{children}</TransitionSeries>
      </AbsoluteFill>
      {theme.overlays?.map((kind) => (
        <Overlay key={kind} kind={kind} seed={seed} />
      ))}
      {flash > 0 ? (
        <AbsoluteFill
          style={{
            backgroundColor: "#fff",
            opacity: flash * 0.5,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
