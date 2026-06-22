import { registerRoot } from "remotion";

// The composition now lives in the APP (src/lib/reel/composition) as the ONE source shared by the
// in-app @remotion/player AND this Lambda render — so preview == export by construction. `npm run
// deploy-site` (`lambda sites create src/index.ts`) bundles from here; the worker's bundler resolves
// the relative path even though the app's tsconfig excludes workers/.
import { RemotionRoot } from "../../../src/lib/reel/composition/Root";

registerRoot(RemotionRoot);
