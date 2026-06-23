/**
 * The ONE server-only boundary for Remotion Lambda. All @remotion/lambda usage funnels through
 * here so the heavy AWS SDK never leaks toward a client bundle (the render-service + the
 * /api/internal/reel-complete webhook import from THIS module, never @remotion/lambda directly).
 *
 * `@remotion/lambda/client` is the LIGHT, server-invocable entry: renderMediaOnLambda invokes the
 * already-deployed orchestrator Lambda and returns a renderId — it does NOT bundle the renderer
 * (@remotion/renderer / @remotion/bundler stay out of the app, in workers/reel-render). Pinned
 * 4.0.482 in lockstep with @remotion/player / @remotion/media and workers/reel-render — a drift
 * desyncs the seeded preview from the Lambda render.
 */
import "server-only";

export {
  getRenderProgress,
  renderMediaOnLambda,
  speculateFunctionName,
  validateWebhookSignature,
} from "@remotion/lambda/client";
export type { AwsRegion, WebhookPayload } from "@remotion/lambda/client";
