// Sentry init for the Edge runtime. Loaded by src/instrumentation.ts's register()
// when NEXT_RUNTIME === "edge". Shares commonInit (DSN-gated no-op when unset).
import * as Sentry from "@sentry/nextjs";

import { commonInit } from "@/lib/observability/sentry";
import {
  redactBreadcrumb,
  redactEvent,
} from "@/lib/security/telemetry-redaction";

Sentry.init({ ...commonInit, beforeBreadcrumb: redactBreadcrumb });

// The token scrub, on every event type (QA #22) — see sentry.server.config.ts for the why.
Sentry.addEventProcessor(redactEvent);
