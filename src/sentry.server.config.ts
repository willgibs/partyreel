// Sentry init for the Node.js runtime. Loaded by src/instrumentation.ts's register()
// when NEXT_RUNTIME === "nodejs". Shares commonInit (DSN-gated no-op when unset).
import * as Sentry from "@sentry/nextjs";

import { commonInit } from "@/lib/observability/sentry";
import {
  redactBreadcrumb,
  redactEvent,
} from "@/lib/security/telemetry-redaction";

Sentry.init({ ...commonInit, beforeBreadcrumb: redactBreadcrumb });

// Guest capability tokens ride the URL PATH, and commonInit's beforeSend only sees ERROR events
// (QA #22). An event processor runs on every event type, transactions included, and runs BEFORE
// beforeSend, so the shared scrubber still gets its turn afterwards.
Sentry.addEventProcessor(redactEvent);
