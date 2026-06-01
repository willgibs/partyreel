// Sentry init for the Node.js runtime. Loaded by src/instrumentation.ts's register()
// when NEXT_RUNTIME === "nodejs". Shares commonInit (DSN-gated no-op when unset).
import * as Sentry from "@sentry/nextjs";

import { commonInit } from "@/lib/observability/sentry";

Sentry.init({ ...commonInit });
