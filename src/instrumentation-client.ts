// Sentry init for the browser (Next 15.3+ client instrumentation entry). Shares commonInit
// and adds Session Replay, captured ONLY when an error fires (replaysOnErrorSampleRate: 1,
// session sampling 0) so normal sessions upload nothing. Privacy: blockAllMedia keeps the
// guest gallery's photos/videos out of recordings, maskAllText keeps typed names/emails out.
import * as Sentry from "@sentry/nextjs";

import { commonInit } from "@/lib/observability/sentry";

Sentry.init({
  ...commonInit,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Instruments client-side navigations (App Router) for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
