import { type CalculateMetadataFunction, Composition } from "remotion";

import { FPS, REEL_HEIGHT, REEL_WIDTH } from "./constants";
import { layoutReel } from "./layout";
import { Reel } from "./Reel";
import { type ReelProps, THEME_CLASSIC } from "./reel-types";

// Duration is derived from the clip list (the timeline layout), so what the <Composition> reports
// always matches what it renders. (The <Player> can't call this — it derives duration the same way,
// via layoutReel, in reel-player.tsx.)
const calculateMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => {
  const { totalSec } = layoutReel(props);
  return { durationInFrames: Math.max(1, Math.round(totalSec * FPS)) };
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
