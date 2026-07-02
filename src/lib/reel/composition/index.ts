// The reel composition — the ONE Remotion source shared by the in-app @remotion/player preview AND the
// Lambda render (workers/reel-render bundles its Root via `lambda sites create`). Keep this folder free
// of Next-isms (no next/*, server-only, or @/ alias) so the worker bundle can consume it too.
export {
  DEFAULT_ORIENTATION,
  FPS,
  type Orientation,
  REEL_HEIGHT,
  REEL_LANDSCAPE_HEIGHT,
  REEL_LANDSCAPE_WIDTH,
  REEL_WIDTH,
  reelDimensions,
} from "./constants";
export { ClipMedia } from "./clip-media";
export { fitClip, type FitMode } from "./framing";
export {
  isParticle,
  MOTION_STYLES,
  Overlay,
  PARTICLE_KINDS,
  TEXTURE_OVERLAYS,
} from "./effects";
export {
  type ClipMotion,
  planReel,
  type PlannedClip,
  type PlannedGap,
  type ReelPlan,
} from "./layout";
export { Reel } from "./Reel";
export { RemotionRoot } from "./Root";
export {
  PolaroidStack,
  polaroidStackDuration,
} from "./treatments/polaroid-stack";
export { FilmStrip, filmStripDuration } from "./treatments/film-strip";
export {
  ScatteredPrints,
  scatteredPrintsDuration,
} from "./treatments/scattered-prints";
export {
  FramedGallery,
  framedGalleryDuration,
} from "./treatments/framed-gallery";
export { CardDeck, cardDeckDuration } from "./treatments/card-deck";
export {
  LayeredParallax,
  layeredParallaxDuration,
} from "./treatments/layered-parallax";
export type {
  ClipBackdrop,
  EffectKind,
  KenBurnsKit,
  MotionStyle,
  OverlayKind,
  ParticleKind,
  ReelClip,
  ReelProps,
  ReelSignature,
  ReelTheme,
  SlideDir,
  TransitionKind,
  TransitionSpec,
} from "./reel-types";
export { THEME_CLASSIC } from "./reel-types";
export { mulberry32, seeded, seededPick, seededRange } from "./seed";
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
