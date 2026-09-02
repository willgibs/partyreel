// Sentry init for the browser (Next 15.3+ client instrumentation entry). Shares commonInit
// and adds Session Replay, captured ONLY when an error fires (replaysOnErrorSampleRate: 1,
// session sampling 0) so normal sessions upload nothing. Privacy: blockAllMedia keeps the
// guest gallery's photos/videos out of recordings, maskAllText keeps typed names/emails out.
//
// The BROWSER is where the capability-token leak was widest (QA #22): a guest moves through
// `/e/<qr_token>` and every hop becomes a navigation breadcrumb, a pageload transaction and a URL
// on the replay. All three are redacted here; the shape of the fix is documented in
// src/lib/security/telemetry-redaction.ts.
import * as Sentry from "@sentry/nextjs";

import { commonInit } from "@/lib/observability/sentry";
import {
  redactBreadcrumb,
  redactEvent,
  redactReplayFrame,
} from "@/lib/security/telemetry-redaction";

Sentry.init({
  ...commonInit,
  beforeBreadcrumb: redactBreadcrumb,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      // The replay records its own navigation and performance frames, which never pass through the
      // event pipeline, so they need their own pass.
      beforeAddRecordingEvent: (frame) => redactReplayFrame(frame),
    }),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Covers errors, transactions AND the replay envelope's `urls` list; runs before beforeSend.
Sentry.addEventProcessor(redactEvent);

// Instruments client-side navigations (App Router) for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
