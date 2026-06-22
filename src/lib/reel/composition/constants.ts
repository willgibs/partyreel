// The reel's fixed render dimensions + frame rate. ONE source so the in-browser <Player> (which, unlike
// <Composition>, takes these as explicit props) can never drift from the <Composition> the Lambda render
// bundles. 9:16 vertical, 24fps montage (see docs/specs/reel-v1.md).
export const FPS = 24;
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
