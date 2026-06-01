// Next 16 server instrumentation hook. register() initializes Sentry for the active
// runtime; onRequestError forwards thrown errors from route handlers, Server Components,
// and the proxy to Sentry automatically (no per-site code needed for unhandled throws).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
