import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";

import { layoutReel, type PlacedClip } from "./layout";
import type { ReelProps, ReelTheme } from "./reel-types";
import { seeded } from "./seed";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Ken-Burns pan directions (unit-ish); the seed picks one per photo.
const PANS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.8, 0.8],
  [-0.8, -0.8],
  [0.8, -0.8],
  [-0.8, 0.8],
];

// A base zoom so there's always margin for the pan (no edge reveal under objectFit:cover).
const BASE_ZOOM = 1.1;

const ClipLayer: React.FC<{
  clip: PlacedClip;
  theme: ReelTheme;
  seed: number;
}> = ({ clip, theme, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const crossFrames = Math.max(1, Math.round(theme.crossfadeSec * fps));
  const totalFrames = Math.round(clip.activeSec * fps) + crossFrames;

  // Fade IN over the crossfade overlap with the previous clip; hold at 1 after. (CSS opacity, not a
  // CSS transition — transitions are forbidden in Remotion.)
  const opacity = interpolate(frame, [0, crossFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  if (clip.type === "video") {
    const start = clip.trimStartSec ?? 0;
    return (
      <AbsoluteFill style={{ opacity }}>
        <Video
          src={clip.url}
          muted
          trimBefore={Math.round(start * fps)}
          trimAfter={Math.round((start + clip.activeSec) * fps)}
          // @remotion/media's <Video> reads objectFit from a DEDICATED prop, not from
          // `style` (it warns + ignores objectFit-in-style; the style default is
          // "contain" = letterbox). Pass it as a prop so a landscape clip cover-fills
          // the 9:16 frame. style carries only sizing + the theme color grade.
          objectFit="cover"
          style={{
            width: "100%",
            height: "100%",
            filter: theme.grade,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Photo: a slow seeded Ken-Burns (push-in + pan). Individual scale/translate props (NOT a transform
  // string) so the animation stays editable in Studio.
  const pan = PANS[Math.floor(seeded(seed, clip.index, 1) * PANS.length) % PANS.length];
  const panAmt = 40 + seeded(seed, clip.index, 2) * 30; // 40-70px (under the BASE_ZOOM margin)
  const zoomDelta = theme.kenBurnsZoom * (0.7 + seeded(seed, clip.index, 3) * 0.6);
  const scale = interpolate(frame, [0, totalFrames], [BASE_ZOOM, BASE_ZOOM + zoomDelta], {
    extrapolateRight: "clamp",
  });
  const tx = interpolate(frame, [0, totalFrames], [0, pan[0] * panAmt], {
    extrapolateRight: "clamp",
  });
  const ty = interpolate(frame, [0, totalFrames], [0, pan[1] * panAmt], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={clip.url}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale,
          translate: `${tx}px ${ty}px`,
          filter: theme.grade,
        }}
      />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { theme, seed } = props;
  const { fps } = useVideoConfig();
  const { placed } = layoutReel(props);
  const crossFrames = Math.max(1, Math.round(theme.crossfadeSec * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      {placed.map((clip) => (
        <Sequence
          key={clip.index}
          from={Math.round(clip.fromSec * fps)}
          durationInFrames={Math.round(clip.activeSec * fps) + crossFrames}
        >
          <ClipLayer clip={clip} theme={theme} seed={seed} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
