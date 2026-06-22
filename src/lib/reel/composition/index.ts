// The reel composition — the ONE Remotion source shared by the in-app @remotion/player preview AND the
// Lambda render (workers/reel-render bundles its Root via `lambda sites create`). Keep this folder free
// of Next-isms (no next/*, server-only, or @/ alias) so the worker bundle can consume it too.
export { FPS, REEL_HEIGHT, REEL_WIDTH } from "./constants";
export { layoutReel, type PlacedClip, type ReelLayout } from "./layout";
export { Reel } from "./Reel";
export { RemotionRoot } from "./Root";
export type { ReelClip, ReelProps, ReelTheme } from "./reel-types";
export { THEME_CLASSIC } from "./reel-types";
export { mulberry32, seeded } from "./seed";
export {
  DEFAULT_THEME_ID,
  resolveTheme,
  THEME_IDS,
  THEME_LABELS,
  THEME_PUNCHY,
  THEME_WARM,
  THEMES,
  type ThemeId,
} from "./themes";
