import { type CalculateMetadataFunction, Composition } from "remotion";

import { FPS, REEL_HEIGHT, REEL_WIDTH, reelDimensions } from "./constants";
import { planReel } from "./layout";
import { Reel } from "./Reel";
import { type ReelProps, THEME_CLASSIC } from "./reel-types";

// Duration is derived from the seeded plan (the timeline), and the DIMENSIONS from the orientation, so what
// the <Composition> reports always matches what it renders, in either orientation. (The <Player> can't call
// this — it derives both the same way, via planReel + reelDimensions, in reel-player.tsx.)
const calculateMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => {
  const { totalFrames } = planReel(props);
  const { width, height } = reelDimensions(props.orientation);
  return { durationInFrames: Math.max(1, totalFrames), width, height };
};

// Studio default props — public placeholder images so Studio renders out-of-the-box. The real Lambda
// render passes presigned-R2 inputProps via `--props` (workers/reel-render/scripts/build-props.ts).
const SAMPLE: ReelProps = {
  clips: [
    { url: "https://picsum.photos/seed/pr1/1080/1920", type: "photo" },
    { url: "https://picsum.photos/seed/pr2/1920/1080", type: "photo" },
    { url: "https://picsum.photos/seed/pr3/1200/1200", type: "photo" },
    { url: "https://picsum.photos/seed/pr4/1080/1350", type: "photo" },
    { url: "https://picsum.photos/seed/pr5/1600/1200", type: "photo" },
  ],
  theme: THEME_CLASSIC,
  seed: 42,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      fps={FPS}
      width={REEL_WIDTH}
      height={REEL_HEIGHT}
      durationInFrames={120}
      defaultProps={SAMPLE}
      calculateMetadata={calculateMetadata}
    />
  );
};
